<?php

namespace App\Services;

use App\Models\Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use XMLReader;
use ZipArchive;

class RecouvrementParserService
{
    /**
     * Parse an xlsx file from recouvrement and update/create client outstanding balances (soldes).
     *
     * @param string $filePath Absolute path to the .xlsx file
     * @param string|null $originalFileName Original uploaded file name
     * @param int|null $userId User ID performing the import
     * @param bool $createMissing Whether to create clients that do not exist yet
     * @return array
     */
    public function importFromFile(
        string $filePath,
        ?string $originalFileName = null,
        ?int $userId = null,
        bool $createMissing = true
    ): array {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException("Le fichier spécifié est introuvable: {$filePath}");
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Impossible d'ouvrir le fichier Excel (archive ZIP invalide).");
        }

        // 1. Read shared strings using XMLReader
        $sharedStrings = [];
        $xmlStrings = new XMLReader();
        if ($xmlStrings->open('zip://' . $filePath . '#xl/sharedStrings.xml')) {
            while ($xmlStrings->read()) {
                if ($xmlStrings->nodeType === XMLReader::ELEMENT && $xmlStrings->name === 'si') {
                    $siXml = $xmlStrings->readOuterXml();
                    $text = '';
                    if (preg_match_all('/<t[^>]*>(.*?)<\/t>/s', $siXml, $matches)) {
                        $text = implode('', $matches[1]);
                    }
                    $sharedStrings[] = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
                }
            }
            $xmlStrings->close();
        }

        // 2. Stream sheet1.xml
        $xmlSheet = new XMLReader();
        if (!$xmlSheet->open('zip://' . $filePath . '#xl/worksheets/sheet1.xml')) {
            $zip->close();
            throw new \RuntimeException("Impossible de lire la feuille principale sheet1.xml de l'Excel.");
        }

        $rowCount = 0;
        $parsedClients = [];
        $totalSolde = 0.0;
        $clientsWithDebt = 0;

        // Default standard columns if not detected from header
        $colMap = [
            'code' => 'C',
            'name' => 'D',
            'solde' => 'E',
            'ventes' => 'F',
            'wilaya' => 'H',
            'region' => 'I',
            'credit' => 'M',
        ];

        while ($xmlSheet->read()) {
            if ($xmlSheet->nodeType === XMLReader::ELEMENT && $xmlSheet->name === 'row') {
                $rowCount++;

                $rowXml = $xmlSheet->readOuterXml();
                $cells = [];
                preg_match_all('/<c\b([^>]*)>(?:<v>(.*?)<\/v>)?/s', $rowXml, $cMatches, PREG_SET_ORDER);

                foreach ($cMatches as $cm) {
                    preg_match('/r="([A-Z]+)[0-9]+"/', $cm[1], $rMatch);
                    preg_match('/t="([^"]+)"/', $cm[1], $tMatch);
                    $col = $rMatch[1] ?? '';
                    $type = $tMatch[1] ?? '';
                    $val = $cm[2] ?? '';

                    if ($type === 's' && isset($sharedStrings[(int)$val])) {
                        $val = $sharedStrings[(int)$val];
                    }
                    $cells[$col] = $val;
                }

                if ($rowCount === 1) {
                    // Inspect header row to detect column names dynamically
                    foreach ($cells as $cLetter => $hVal) {
                        $h = mb_strtolower(trim($hVal));
                        if (in_array($h, ['code', 'code client', 'num client', 'client code', 'code_client'])) {
                            $colMap['code'] = $cLetter;
                        } elseif (in_array($h, ['libellé', 'libelle', 'nom', 'nom client', 'client', 'raison sociale', 'nom du client', 'clients', 'tiers'])) {
                            $colMap['name'] = $cLetter;
                        } elseif (in_array($h, ['solde', 'solde final', 'solde net', 'impayé', 'impayes', 'creance', 'créances', 'solde initial', 'balance', 'sold'])) {
                            $colMap['solde'] = $cLetter;
                        } elseif (in_array($h, ['ventes', 'vente', 'total ventes', 'ca', "chiffre d'affaires"])) {
                            $colMap['ventes'] = $cLetter;
                        } elseif (in_array($h, ['wilaya', 'ville', 'state'])) {
                            $colMap['wilaya'] = $cLetter;
                        } elseif (in_array($h, ['région', 'region', 'zone'])) {
                            $colMap['region'] = $cLetter;
                        } elseif (in_array($h, ['crédit', 'credit'])) {
                            $colMap['credit'] = $cLetter;
                        }
                    }
                    continue;
                }

                $code = trim($cells[$colMap['code']] ?? '');
                $name = trim($cells[$colMap['name']] ?? '');
                $solde = (float) str_replace([' ', ','], ['', '.'], $cells[$colMap['solde']] ?? '0');
                $ventes = (float) str_replace([' ', ','], ['', '.'], $cells[$colMap['ventes']] ?? '0');
                $wilaya = trim($cells[$colMap['wilaya']] ?? '');
                $region = trim($cells[$colMap['region']] ?? '');
                $credit = (float) str_replace([' ', ','], ['', '.'], $cells[$colMap['credit']] ?? '0');

                if (empty($name) && empty($code)) {
                    continue;
                }

                $normalizedName = $this->normalizeName($name);
                $baseName = $this->extractBaseName($name);
                $normalizedBase = $this->normalizeName($baseName);
                $normalizedCode = strtoupper(trim($code));

                if ($solde > 0) {
                    $clientsWithDebt++;
                    $totalSolde += $solde;
                }

                $parsedClients[] = [
                    'code' => $code,
                    'normalized_code' => $normalizedCode,
                    'name' => $name,
                    'normalized_name' => $normalizedName,
                    'normalized_base' => $normalizedBase,
                    'solde' => $solde,
                    'ventes' => $ventes,
                    'credit' => $credit,
                    'wilaya' => $wilaya,
                    'region' => $region,
                ];
            }
        }

        $xmlSheet->close();
        $zip->close();

        // 3. Database persistence & synchronization
        $clientsUpdated = 0;
        $clientsCreated = 0;
        $matchedSamples = [];

        DB::beginTransaction();
        try {
            // Pre-load all existing clients indexed by code and by normalized name
            $allClients = Client::all();
            $clientsByCode = [];
            $clientsByName = [];
            $clientsByBaseName = [];

            foreach ($allClients as $client) {
                if (!empty($client->client_code)) {
                    $clientsByCode[strtoupper(trim($client->client_code))] = $client;
                }
                if (!empty($client->name)) {
                    $normFull = $this->normalizeName($client->name);
                    if ($normFull !== '') {
                        $clientsByName[$normFull] = $client;
                    }

                    $base = $this->extractBaseName($client->name);
                    $normBase = $this->normalizeName($base);
                    if ($normBase !== '' && $normBase !== $normFull) {
                        $clientsByBaseName[$normBase] = $client;
                    }
                }
            }

            $lastClientCodeNum = (int) (Client::max('id') ?? 0);

            foreach ($parsedClients as $item) {
                $client = null;
                $matchType = null;

                // Priority 1: Match by Code
                if (!empty($item['normalized_code']) && isset($clientsByCode[$item['normalized_code']])) {
                    $client = $clientsByCode[$item['normalized_code']];
                    $matchType = 'code';
                }
                // Priority 2: Match by Full Normalized Name
                elseif (!empty($item['normalized_name']) && isset($clientsByName[$item['normalized_name']])) {
                    $client = $clientsByName[$item['normalized_name']];
                    $matchType = 'exact_name';
                }
                // Priority 3: Match by Base Normalized Name (handles parentheses/store suffixes)
                elseif (!empty($item['normalized_base']) && isset($clientsByName[$item['normalized_base']])) {
                    $client = $clientsByName[$item['normalized_base']];
                    $matchType = 'base_name';
                }
                elseif (!empty($item['normalized_name']) && isset($clientsByBaseName[$item['normalized_name']])) {
                    $client = $clientsByBaseName[$item['normalized_name']];
                    $matchType = 'db_base_name';
                }
                elseif (!empty($item['normalized_base']) && isset($clientsByBaseName[$item['normalized_base']])) {
                    $client = $clientsByBaseName[$item['normalized_base']];
                    $matchType = 'both_base_name';
                }

                if ($client) {
                    $oldSolde = (float) $client->outstanding_balance;

                    // Update existing client
                    $updates = [
                        'outstanding_balance' => $item['solde'],
                    ];

                    // If existing client has a generic code (CLI-2026-...) and the file has a real code, update code
                    if (!empty($item['code']) && (empty($client->client_code) || str_starts_with($client->client_code, 'CLI-2026-'))) {
                        $updates['client_code'] = $item['code'];
                        $clientsByCode[strtoupper(trim($item['code']))] = $client;
                    }

                    // Update total_spent from ventes if client's total_spent is 0
                    if ((float)$client->total_spent === 0.0 && $item['ventes'] > 0) {
                        $updates['total_spent'] = $item['ventes'];
                    }

                    if (empty($client->wilaya) && !empty($item['wilaya'])) {
                        $updates['wilaya'] = $item['wilaya'];
                    }
                    if (empty($client->region) && !empty($item['region'])) {
                        $updates['region'] = $item['region'];
                    }

                    $client->update($updates);
                    $clientsUpdated++;

                    if (count($matchedSamples) < 5) {
                        $matchedSamples[] = [
                            'name' => $client->name,
                            'code' => $client->client_code,
                            'old_solde' => $oldSolde,
                            'new_solde' => $item['solde'],
                            'match_type' => $matchType,
                        ];
                    }
                } elseif ($createMissing && !empty($item['name'])) {
                    // Create new client
                    $lastClientCodeNum++;
                    $clientCode = !empty($item['code']) ? $item['code'] : sprintf('CLI-2026-%06d', $lastClientCodeNum);

                    $newClient = Client::create([
                        'client_code' => $clientCode,
                        'name' => $item['name'],
                        'phone' => '',
                        'address' => '',
                        'region' => !empty($item['region']) ? $item['region'] : 'Centre',
                        'wilaya' => !empty($item['wilaya']) ? $item['wilaya'] : '',
                        'status' => 'active',
                        'client_type' => 'retail',
                        'credit_limit' => 0,
                        'outstanding_balance' => $item['solde'],
                        'total_spent' => $item['ventes'],
                        'total_orders' => 0,
                    ]);

                    if (!empty($item['normalized_code'])) {
                        $clientsByCode[$item['normalized_code']] = $newClient;
                    }
                    if (!empty($item['normalized_name'])) {
                        $clientsByName[$item['normalized_name']] = $newClient;
                    }
                    $clientsCreated++;
                }
            }

            DB::commit();

            return [
                'total_rows' => count($parsedClients),
                'clients_updated' => $clientsUpdated,
                'clients_created' => $clientsCreated,
                'clients_with_debt' => $clientsWithDebt,
                'total_outstanding' => round($totalSolde, 2),
                'file_name' => $originalFileName ?: basename($filePath),
                'matched_samples' => $matchedSamples,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Erreur RecouvrementParserService: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Normalize a client name for resilient fuzzy matching.
     */
    public function normalizeName(string $name): string
    {
        $str = mb_strtolower($name, 'UTF-8');
        $str = str_replace(
            ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'î', 'ï', 'ô', 'ö', 'ù', 'û', 'ü', 'ç', 'ñ', "'", '"', '’'],
            ['e', 'e', 'e', 'e', 'a', 'a', 'a', 'i', 'i', 'o', 'o', 'u', 'u', 'u', 'c', 'n', ' ', ' ', ' '],
            $str
        );
        $str = preg_replace('/[^a-z0-9]/', ' ', $str);
        return trim(preg_replace('/\s+/', ' ', $str));
    }

    /**
     * Extract base client name without parentheses, brackets, or store mentions.
     */
    public function extractBaseName(string $name): string
    {
        $base = preg_replace('/\s*\([^)]*\)/', '', $name);
        $base = preg_replace('/\s*\[[^\]]*\]/', '', $base);
        return trim($base);
    }
}
