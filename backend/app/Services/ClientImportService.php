<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Region;
use App\Models\User;
use App\Models\Wilaya;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use XMLReader;
use ZipArchive;

class ClientImportService
{
    protected string $tempDir;

    public function __construct()
    {
        $this->tempDir = storage_path('app/temp_imports');
        if (!is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }
    }

    /**
     * Parse and preview the uploaded file (XLSX, XLS, CSV).
     */
    public function preview(UploadedFile $file): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(180);

        $ext = strtolower($file->getClientOriginalExtension());
        if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
            $ext = 'xlsx';
        }

        $fileToken = (string) Str::uuid();
        $storedFileName = "{$fileToken}.{$ext}";
        $storedPath = "{$this->tempDir}/{$storedFileName}";

        $file->move($this->tempDir, $storedFileName);

        $parsed = $this->parseFile($storedPath, $ext, 5);

        return [
            'file_token' => $fileToken,
            'total_rows' => $parsed['total_rows'],
            'columns' => $parsed['columns'],
            'preview_rows' => $parsed['preview_rows'],
            'suggested_mapping' => $parsed['suggested_mapping'],
        ];
    }

    /**
     * Extract distinct wilayas from uploaded file and perform intelligent matching against DB wilayas.
     */
    public function extractWilayas(string $fileToken, string $wilayaColumn): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(180);

        $pattern = "{$this->tempDir}/{$fileToken}.*";
        $matches = glob($pattern);
        if (empty($matches) || !file_exists($matches[0])) {
            throw new \RuntimeException("Fichier d'importation introuvable ou session expirée. Veuillez réimporter votre fichier.");
        }

        $filePath = $matches[0];
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $allRows = $this->readAllDataRows($filePath, $ext);

        $distinctMap = [];
        foreach ($allRows as $row) {
            $raw = trim($row[$wilayaColumn] ?? '');
            if ($raw === '') {
                continue;
            }
            if (!isset($distinctMap[$raw])) {
                $distinctMap[$raw] = 0;
            }
            $distinctMap[$raw]++;
        }

        // Load all 58 Wilayas from DB
        $dbWilayas = Wilaya::orderBy('code')->get(['id', 'code', 'name', 'region_name']);

        $results = [];
        foreach ($distinctMap as $rawVal => $count) {
            $match = $this->matchWilaya($rawVal, $dbWilayas);
            $results[] = [
                'file_value' => $rawVal,
                'count' => $count,
                'matched_wilaya_id' => $match['wilaya']?->id,
                'matched_wilaya_name' => $match['wilaya']?->name ?? 'Alger',
                'matched_wilaya_code' => $match['wilaya']?->code ?? '16',
                'matched_region' => $match['wilaya']?->region_name ?? 'Center',
                'confidence' => $match['confidence'],
            ];
        }

        // Sort results by count descending
        usort($results, fn($a, $b) => $b['count'] <=> $a['count']);

        return [
            'distinct_wilayas' => $results,
            'db_wilayas' => $dbWilayas->map(fn($w) => [
                'id' => $w->id,
                'code' => $w->code,
                'name' => $w->name,
                'region_name' => $w->region_name,
            ])->values()->all(),
        ];
    }

    /**
     * Extract distinct regions from uploaded file and perform intelligent matching against DB regions.
     */
    public function extractRegions(string $fileToken, string $regionColumn): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(180);

        $pattern = "{$this->tempDir}/{$fileToken}.*";
        $matches = glob($pattern);
        if (empty($matches) || !file_exists($matches[0])) {
            throw new \RuntimeException("Fichier d'importation introuvable ou session expirée. Veuillez réimporter votre fichier.");
        }

        $filePath = $matches[0];
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $allRows = $this->readAllDataRows($filePath, $ext);

        $distinctMap = [];
        foreach ($allRows as $row) {
            $raw = trim($row[$regionColumn] ?? '');
            if ($raw === '') {
                continue;
            }
            if (!isset($distinctMap[$raw])) {
                $distinctMap[$raw] = 0;
            }
            $distinctMap[$raw]++;
        }

        // Load all active Regions from DB
        $dbRegions = Region::orderBy('name')->get(['id', 'code', 'name', 'color', 'icon']);
        if ($dbRegions->isEmpty()) {
            $dbRegions = collect([
                (object)['id' => 1, 'code' => 'center', 'name' => 'Centre', 'color' => '#2563EB', 'icon' => '🗺️'],
                (object)['id' => 2, 'code' => 'east', 'name' => 'Est', 'color' => '#10B981', 'icon' => '🗺️'],
                (object)['id' => 3, 'code' => 'west', 'name' => 'Ouest', 'color' => '#F59E0B', 'icon' => '🗺️'],
                (object)['id' => 4, 'code' => 'south', 'name' => 'Sud', 'color' => '#EF4444', 'icon' => '🗺️'],
            ]);
        }

        $results = [];
        foreach ($distinctMap as $rawVal => $count) {
            $match = $this->matchRegion($rawVal, $dbRegions);
            $results[] = [
                'file_value' => $rawVal,
                'count' => $count,
                'matched_region_id' => $match['region']?->id,
                'matched_region_name' => $match['region']?->name ?? ($dbRegions->first()->name ?? 'Centre'),
                'confidence' => $match['confidence'],
            ];
        }

        // Sort results by count descending
        usort($results, fn($a, $b) => $b['count'] <=> $a['count']);

        return [
            'distinct_regions' => $results,
            'db_regions' => $dbRegions->map(fn($r) => [
                'id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'color' => $r->color ?? '#2563EB',
                'icon' => $r->icon ?? '🗺️',
            ])->values()->all(),
        ];
    }

    /**
     * Smart match raw file string to official DB Region.
     */
    protected function matchRegion(string $raw, $dbRegions): array
    {
        $cleanRaw = trim($raw);
        $norm = $this->normalizeRegionKey($cleanRaw);

        // 1. Exact normalized name match or code match
        foreach ($dbRegions as $r) {
            if ($this->normalizeRegionKey($r->name) === $norm || $this->normalizeRegionKey($r->code) === $norm) {
                return ['region' => $r, 'confidence' => 'exact'];
            }
        }

        // 2. Partial/fuzzy substring match
        foreach ($dbRegions as $r) {
            $normR = $this->normalizeRegionKey($r->name);
            if (!empty($norm) && (str_contains($normR, $norm) || str_contains($norm, $normR))) {
                return ['region' => $r, 'confidence' => 'auto'];
            }
        }

        // 3. Known aliases: e.g. center/centre, alger, etc.
        $aliases = [
            'alger' => 'centre', 'algiers' => 'centre', 'centre' => 'center',
            'oran' => 'ouest', 'west' => 'ouest',
            'constantine' => 'est', 'east' => 'est',
            'sahara' => 'sud', 'south' => 'sud',
        ];
        if (isset($aliases[$norm])) {
            $target = $aliases[$norm];
            foreach ($dbRegions as $r) {
                $normR = $this->normalizeRegionKey($r->name);
                $normCode = $this->normalizeRegionKey($r->code);
                if (str_contains($normR, $target) || str_contains($normCode, $target)) {
                    return ['region' => $r, 'confidence' => 'auto'];
                }
            }
        }

        return ['region' => $dbRegions->first(), 'confidence' => 'none'];
    }

    /**
     * Normalize region name for matching (lowercase, no accents, alphanumeric only).
     */
    protected function normalizeRegionKey(string $str): string
    {
        $str = mb_strtolower(trim($str));
        $unaccented = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
        if ($unaccented !== false) {
            $str = $unaccented;
        }
        $str = preg_replace('/^(r\.|region\s+de\s+|region\s+|zone\s+de\s+|zone\s+)/i', '', $str);
        return preg_replace('/[^a-z0-9]/', '', $str);
    }

    /**
     * Smart match raw file string to official DB Wilaya.
     */
    protected function matchWilaya(string $raw, $dbWilayas): array
    {
        $cleanRaw = trim($raw);
        $norm = $this->normalizeWilayaKey($cleanRaw);

        // 1. Direct code check: e.g. "16", "09", "16 - Alger", "16-Alger"
        if (preg_match('/\b([0-5]?[0-9]|58)\b/', $cleanRaw, $m)) {
            $codeInt = (int) $m[1];
            if ($codeInt >= 1 && $codeInt <= 58) {
                $formattedCode = str_pad((string) $codeInt, 2, '0', STR_PAD_LEFT);
                foreach ($dbWilayas as $w) {
                    if ($w->code === $formattedCode || (int)$w->code === $codeInt) {
                        return ['wilaya' => $w, 'confidence' => 'exact'];
                    }
                }
            }
        }

        // 2. Exact normalized name match
        foreach ($dbWilayas as $w) {
            if ($this->normalizeWilayaKey($w->name) === $norm) {
                return ['wilaya' => $w, 'confidence' => 'exact'];
            }
        }

        // 3. Known aliases and abbreviations
        $aliases = [
            'oeb' => '04', 'oumelbouaghi' => '04', 'bouaghi' => '04',
            'bba' => '34', 'bordj' => '34', 'bordjbouarreridj' => '34',
            'sba' => '22', 'belabbes' => '22', 'sidibelabbes' => '22',
            'tizi' => '15', 'tiziouzou' => '15',
            'alger' => '16', 'algiers' => '16', 'algercentre' => '16',
            'oran' => '31', 'wahran' => '31',
            'constantine' => '25', 'qsentina' => '25',
            'annaba' => '23', 'bone' => '23',
            'blida' => '09', 'setif' => '19', 'batna' => '05',
            'tlemcen' => '13', 'bejaia' => '06', 'biskra' => '07',
            'tiaret' => '14', 'djelfa' => '17', 'jijel' => '18',
            'saida' => '20', 'skikda' => '21', 'guelma' => '24',
            'medea' => '26', 'mostaganem' => '27', 'msila' => '28',
            'mascara' => '29', 'ouargla' => '30', 'elbayadh' => '32',
            'illizi' => '33', 'boumerdes' => '35', 'eltarf' => '36',
            'tindouf' => '37', 'tissemsilt' => '38', 'eloued' => '39',
            'oued' => '39', 'khenchela' => '40', 'soukahras' => '41',
            'tipaza' => '42', 'mila' => '43', 'aindefla' => '44',
            'defla' => '44', 'naama' => '45', 'aintemouchent' => '46',
            'temouchent' => '46', 'ghardaia' => '47', 'relizane' => '48',
            'elmghair' => '49', 'elmeniaa' => '50', 'ouleddjellal' => '51',
            'bordjbajimokhtar' => '52', 'beniabbes' => '53', 'timimoun' => '54',
            'touggourt' => '55', 'djanet' => '56', 'insalah' => '57',
            'inguezzam' => '58', 'chlef' => '02', 'laghouat' => '03',
            'bechar' => '08', 'bouira' => '10', 'tamanrasset' => '11',
            'tebessa' => '12',
        ];

        foreach ($aliases as $aliasKey => $targetCode) {
            if ($norm === $aliasKey || str_contains($norm, $aliasKey)) {
                foreach ($dbWilayas as $w) {
                    if ($w->code === $targetCode) {
                        return ['wilaya' => $w, 'confidence' => 'auto'];
                    }
                }
            }
        }

        // 4. Substring containment
        foreach ($dbWilayas as $w) {
            $wNorm = $this->normalizeWilayaKey($w->name);
            if (strlen($wNorm) >= 4 && (str_contains($norm, $wNorm) || str_contains($wNorm, $norm))) {
                return ['wilaya' => $w, 'confidence' => 'auto'];
            }
        }

        // 5. Fallback to Alger (code 16) with no confidence
        $defaultWilaya = $dbWilayas->firstWhere('code', '16') ?? $dbWilayas->first();
        return ['wilaya' => $defaultWilaya, 'confidence' => 'none'];
    }

    /**
     * Normalize wilaya name for matching (lowercase, no accents, alphanumeric only).
     */
    protected function normalizeWilayaKey(string $str): string
    {
        $str = mb_strtolower(trim($str));
        // Remove accents
        $unaccented = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
        if ($unaccented !== false) {
            $str = $unaccented;
        }
        // Remove common prefixes: "w.", "wilaya de", "wilaya"
        $str = preg_replace('/^(w\.|wilaya\s+de\s+|wilaya\s+)/i', '', $str);
        // Remove all non-alphanumeric
        return preg_replace('/[^a-z0-9]/', '', $str);
    }

    /**
     * Verify the import configuration, inspect duplicates, and compute exact projection before committing.
     */
    public function verify(string $fileToken, array $mapping, string $duplicateAction = 'update', array $wilayaMapping = [], array $regionMapping = []): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(180);

        // Locate stored file
        $pattern = "{$this->tempDir}/{$fileToken}.*";
        $matches = glob($pattern);
        if (empty($matches) || !file_exists($matches[0])) {
            throw new \RuntimeException("Fichier d'importation introuvable ou session expirée. Veuillez réimporter votre fichier.");
        }

        $filePath = $matches[0];
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        // Parse all rows
        $allRows = $this->readAllDataRows($filePath, $ext);

        $nameCol = $mapping['name'] ?? null;
        $phoneCol = $mapping['phone'] ?? ($mapping['personal_phone'] ?? null);
        $stormCol = $mapping['storm_phone'] ?? null;
        $rcCol = $mapping['rc_number'] ?? null;
        $codeCol = $mapping['client_code'] ?? null;
        $wilayaCol = $mapping['wilaya'] ?? null;
        $regionCol = $mapping['region'] ?? null;
        $addressCol = $mapping['address'] ?? null;
        $typeCol = $mapping['client_type'] ?? null;
        $creditCol = $mapping['credit_limit'] ?? null;
        $soldeCol = $mapping['outstanding_balance'] ?? null;

        if (!$nameCol || !$phoneCol) {
            throw new \InvalidArgumentException("Le mappage du nom et du numéro de téléphone est obligatoire.");
        }

        // Cache existing clients for fast matching
        $clients = Client::all(['id', 'name', 'phone', 'personal_phone', 'storm_phone', 'rc_number', 'client_code', 'wilaya', 'region', 'outstanding_balance']);
        $clientsByCode = [];
        $clientsByPhone = [];
        $clientsByStorm = [];
        $clientsByRc = [];
        $clientsByName = [];

        foreach ($clients as $c) {
            if (!empty($c->client_code)) {
                $clientsByCode[strtoupper(trim($c->client_code))] = $c;
            }
            if (!empty($c->phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $c->phone);
                if (!empty($cleanPhone)) {
                    $clientsByPhone[$cleanPhone] = $c;
                }
            }
            if (!empty($c->personal_phone)) {
                $cleanPerso = preg_replace('/[^0-9]/', '', $c->personal_phone);
                if (!empty($cleanPerso)) {
                    $clientsByPhone[$cleanPerso] = $c;
                }
            }
            if (!empty($c->storm_phone)) {
                $cleanStorm = preg_replace('/[^0-9]/', '', $c->storm_phone);
                if (!empty($cleanStorm)) {
                    $clientsByStorm[$cleanStorm] = $c;
                }
            }
            if (!empty($c->rc_number)) {
                $cleanRc = mb_strtolower(preg_replace('/[^a-z0-9]/i', '', $c->rc_number));
                if (!empty($cleanRc)) {
                    $clientsByRc[$cleanRc] = $c;
                }
            }
            if (!empty($c->name)) {
                $normName = mb_strtolower(trim(preg_replace('/\s+/', ' ', $c->name)));
                $clientsByName[$normName] = $c;
            }
        }

        // Cache Wilaya mapping
        $wilayasMap = [];
        $wilayas = Wilaya::all();
        foreach ($wilayas as $w) {
            $wilayasMap[mb_strtolower(trim($w->name))] = $w;
            $cleanCode = ltrim($w->code, '0');
            $wilayasMap[$cleanCode] = $w;
            $wilayasMap[$w->code] = $w;
        }

        $totalRows = 0;
        $validRows = 0;
        $invalidRows = 0;
        $existingCount = 0;
        $newCount = 0;
        $errors = [];
        $sampleVerifications = [];
        $seenInFileByCode = [];
        $seenInFileByPhone = [];
        $seenInFileByName = [];

        $lineNum = 1;
        foreach ($allRows as $row) {
            $lineNum++;
            $name = trim($row[$nameCol] ?? '');
            $phone = trim($row[$phoneCol] ?? '');
            $rawCode = $codeCol ? trim($row[$codeCol] ?? '') : '';
            $stormPhone = $stormCol ? trim((string)($row[$stormCol] ?? '')) : '';
            $rcNumber = $rcCol ? trim((string)($row[$rcCol] ?? '')) : '';
            $rawWilaya = $wilayaCol ? trim($row[$wilayaCol] ?? '') : '';
            $wilaya = $rawWilaya;
            if (!empty($wilayaMapping) && isset($wilayaMapping[$rawWilaya])) {
                $wilaya = $wilayaMapping[$rawWilaya];
            }
            $derivedWilaya = $this->cleanWilayaName($wilaya);
            $region = $regionCol ? trim($row[$regionCol] ?? '') : '';
            $derivedRegion = $region;
            if (!empty($regionMapping) && isset($regionMapping[$region])) {
                $derivedRegion = $regionMapping[$region];
            }
            if (empty($derivedRegion) && !empty($derivedWilaya)) {
                $derivedRegion = $this->resolveRegionFromWilaya($derivedWilaya, $wilayasMap);
            }
            if (empty($derivedRegion)) {
                $derivedRegion = 'Center';
            }
            $address = $addressCol ? trim($row[$addressCol] ?? '') : '';
            $clientType = $typeCol ? trim($row[$typeCol] ?? '') : 'retail';

            // Skip empty rows
            if (empty($name) && empty($phone) && empty($rawCode)) {
                continue;
            }

            $totalRows++;

            if (empty($name) || empty($phone)) {
                $invalidRows++;
                $errorMsg = empty($name) && empty($phone) 
                    ? "Nom et numéro de téléphone manquants" 
                    : (empty($name) ? "Nom du client manquant" : "Numéro de téléphone manquant");
                $errors[] = [
                    'line' => $lineNum,
                    'error' => "Ligne {$lineNum} : {$errorMsg}.",
                ];
                if (count($sampleVerifications) < 20) {
                    $sampleVerifications[] = [
                        'line' => $lineNum,
                        'name' => $name ?: '—',
                        'phone' => $phone ?: '—',
                        'storm_phone' => $stormPhone ?: null,
                        'rc_number' => $rcNumber ?: null,
                        'code' => $rawCode ?: '—',
                        'wilaya' => $derivedWilaya ?: '—',
                        'region' => $derivedRegion ?: '—',
                        'status' => 'invalid',
                        'action' => 'error',
                        'match_reason' => $errorMsg,
                        'existing_client' => null,
                    ];
                }
                continue;
            }

            $validRows++;
            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
            $cleanStorm = preg_replace('/[^0-9]/', '', $stormPhone);
            $cleanRc = !empty($rcNumber) ? mb_strtolower(preg_replace('/[^a-z0-9]/i', '', $rcNumber)) : '';
            $normCode = strtoupper($rawCode);
            $normName = mb_strtolower(trim(preg_replace('/\s+/', ' ', $name)));

            // Try finding matching existing client
            $existing = null;
            $matchReason = '';

            if (!empty($normCode) && isset($clientsByCode[$normCode])) {
                $existing = $clientsByCode[$normCode];
                $matchReason = "Code client existant ({$normCode})";
            } elseif (!empty($cleanPhone) && isset($clientsByPhone[$cleanPhone])) {
                $existing = $clientsByPhone[$cleanPhone];
                $matchReason = "Numéro de téléphone existant ({$phone})";
            } elseif (!empty($cleanStorm) && isset($clientsByStorm[$cleanStorm])) {
                $existing = $clientsByStorm[$cleanStorm];
                $matchReason = "Numéro STORM existant ({$stormPhone})";
            } elseif (!empty($cleanRc) && isset($clientsByRc[$cleanRc])) {
                $existing = $clientsByRc[$cleanRc];
                $matchReason = "N° Registre de Commerce existant ({$rcNumber})";
            } elseif (isset($clientsByName[$normName])) {
                $existing = $clientsByName[$normName];
                $matchReason = "Raison sociale existante ({$name})";
            } elseif (!empty($normCode) && isset($seenInFileByCode[$normCode])) {
                $matchReason = "Doublon interne dans le fichier (même code {$normCode})";
            } elseif (!empty($cleanPhone) && isset($seenInFileByPhone[$cleanPhone])) {
                $matchReason = "Doublon interne dans le fichier (même téléphone {$phone})";
            }

            if ($existing) {
                $existingCount++;
                $action = ($duplicateAction === 'update') ? 'update' : 'skip';
                if (count($sampleVerifications) < 20) {
                    $sampleVerifications[] = [
                        'line' => $lineNum,
                        'name' => $name,
                        'phone' => $phone,
                        'storm_phone' => $stormPhone ?: null,
                        'rc_number' => $rcNumber ?: ($existing->rc_number ?? null),
                        'code' => $rawCode ?: ($existing->client_code ?? '—'),
                        'wilaya' => $derivedWilaya ?: ($existing->wilaya ?? '—'),
                        'region' => $derivedRegion ?: ($existing->region ?? '—'),
                        'status' => 'existing',
                        'action' => $action,
                        'match_reason' => $matchReason,
                        'existing_client' => [
                            'id' => $existing->id,
                            'name' => $existing->name,
                            'client_code' => $existing->client_code,
                            'phone' => $existing->personal_phone ?? $existing->phone,
                            'storm_phone' => $existing->storm_phone,
                            'rc_number' => $existing->rc_number,
                            'wilaya' => $existing->wilaya,
                        ],
                    ];
                }
            } else {
                $newCount++;
                if (!empty($normCode)) $seenInFileByCode[$normCode] = true;
                if (!empty($cleanPhone)) $seenInFileByPhone[$cleanPhone] = true;
                $seenInFileByName[$normName] = true;

                if (count($sampleVerifications) < 20) {
                    $sampleVerifications[] = [
                        'line' => $lineNum,
                        'name' => $name,
                        'phone' => $phone,
                        'storm_phone' => $stormPhone ?: null,
                        'rc_number' => $rcNumber ?: null,
                        'code' => $rawCode ?: 'CLI-2026-AUTO',
                        'wilaya' => $derivedWilaya ?: '—',
                        'region' => $derivedRegion ?: '—',
                        'status' => 'new',
                        'action' => 'create',
                        'match_reason' => 'Nouveau client (aucun doublon en base)',
                        'existing_client' => null,
                    ];
                }
            }
        }

        $toCreateCount = $newCount;
        $toUpdateCount = ($duplicateAction === 'update') ? $existingCount : 0;
        $toSkipCount = ($duplicateAction === 'skip') ? $existingCount : 0;

        return [
            'total_rows' => $totalRows,
            'valid_rows' => $validRows,
            'invalid_rows' => $invalidRows,
            'new_clients_count' => $newCount,
            'existing_clients_count' => $existingCount,
            'to_create_count' => $toCreateCount,
            'to_update_count' => $toUpdateCount,
            'to_skip_count' => $toSkipCount,
            'duplicate_action' => $duplicateAction,
            'sample_verifications' => $sampleVerifications,
            'errors' => array_slice($errors, 0, 50),
        ];
    }

    /**
     * Execute the import using the saved file and client field mapping.
     */
    public function execute(string $fileToken, array $mapping, string $duplicateAction = 'update', ?int $userId = null, array $wilayaMapping = [], array $regionMapping = []): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        // Locate stored file
        $pattern = "{$this->tempDir}/{$fileToken}.*";
        $matches = glob($pattern);
        if (empty($matches) || !file_exists($matches[0])) {
            throw new \RuntimeException("Fichier d'importation introuvable ou session expirée. Veuillez réimporter votre fichier.");
        }

        $filePath = $matches[0];
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        // Parse all rows
        $allRows = $this->readAllDataRows($filePath, $ext);

        $nameCol = $mapping['name'] ?? null;
        $phoneCol = $mapping['phone'] ?? ($mapping['personal_phone'] ?? null);
        $stormCol = $mapping['storm_phone'] ?? null;
        $rcCol = $mapping['rc_number'] ?? null;
        $persoCol = $mapping['personal_phone'] ?? null;
        $codeCol = $mapping['client_code'] ?? null;
        $wilayaCol = $mapping['wilaya'] ?? null;
        $regionCol = $mapping['region'] ?? null;
        $addressCol = $mapping['address'] ?? null;
        $typeCol = $mapping['client_type'] ?? null;
        $creditCol = $mapping['credit_limit'] ?? null;
        $soldeCol = $mapping['outstanding_balance'] ?? null;

        if (!$nameCol || !$phoneCol) {
            throw new \InvalidArgumentException("Le mappage du nom et du numéro de téléphone est obligatoire.");
        }

        // Cache existing clients for fast matching
        $clients = Client::all();
        $clientsByCode = [];
        $clientsByPhone = [];
        $clientsByStorm = [];
        $clientsByRc = [];
        $clientsByName = [];

        foreach ($clients as $c) {
            if (!empty($c->client_code)) {
                $clientsByCode[strtoupper(trim($c->client_code))] = $c;
            }
            if (!empty($c->phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $c->phone);
                if (!empty($cleanPhone)) {
                    $clientsByPhone[$cleanPhone] = $c;
                }
            }
            if (!empty($c->personal_phone)) {
                $cleanPerso = preg_replace('/[^0-9]/', '', $c->personal_phone);
                if (!empty($cleanPerso)) {
                    $clientsByPhone[$cleanPerso] = $c;
                }
            }
            if (!empty($c->storm_phone)) {
                $cleanStorm = preg_replace('/[^0-9]/', '', $c->storm_phone);
                if (!empty($cleanStorm)) {
                    $clientsByStorm[$cleanStorm] = $c;
                }
            }
            if (!empty($c->rc_number)) {
                $cleanRc = mb_strtolower(preg_replace('/[^a-z0-9]/i', '', $c->rc_number));
                if (!empty($cleanRc)) {
                    $clientsByRc[$cleanRc] = $c;
                }
            }
            if (!empty($c->name)) {
                $normName = mb_strtolower(trim(preg_replace('/\s+/', ' ', $c->name)));
                $clientsByName[$normName] = $c;
            }
        }

        // Cache Wilaya & Delegate mapping
        $wilayasMap = [];
        $wilayas = Wilaya::all();
        foreach ($wilayas as $w) {
            $wilayasMap[mb_strtolower(trim($w->name))] = $w;
            $cleanCode = ltrim($w->code, '0');
            $wilayasMap[$cleanCode] = $w;
            $wilayasMap[$w->code] = $w;
        }

        // Delegates by region
        $delegates = User::where('role', 'delegate')->where('is_active', true)->get();
        $delegatesByRegion = [];
        foreach ($delegates as $d) {
            if ($d->region) {
                $delegatesByRegion[mb_strtolower(trim($d->region))] = $d;
            }
        }

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $errors = [];
        $lineNum = 1; // Row 1 is header

        DB::beginTransaction();
        try {
            foreach ($allRows as $row) {
                $lineNum++;

                $name = trim($row[$nameCol] ?? '');
                $phone = trim($row[$phoneCol] ?? '');
                $rawCode = $codeCol ? trim($row[$codeCol] ?? '') : '';
                $rawWilaya = $wilayaCol ? trim($row[$wilayaCol] ?? '') : '';
                $wilaya = $rawWilaya;
                if (!empty($wilayaMapping) && isset($wilayaMapping[$rawWilaya])) {
                    $wilaya = $wilayaMapping[$rawWilaya];
                }
                $derivedWilaya = $this->cleanWilayaName($wilaya);
                $region = $regionCol ? trim($row[$regionCol] ?? '') : '';
                $derivedRegion = $region;
                if (!empty($regionMapping) && isset($regionMapping[$region])) {
                    $derivedRegion = $regionMapping[$region];
                }
                if (empty($derivedRegion) && !empty($derivedWilaya)) {
                    $derivedRegion = $this->resolveRegionFromWilaya($derivedWilaya, $wilayasMap);
                }
                if (empty($derivedRegion)) {
                    $derivedRegion = 'Center';
                }
                $address = $addressCol ? trim($row[$addressCol] ?? '') : '';
                $clientType = $typeCol ? trim($row[$typeCol] ?? '') : '';
                $creditLimit = $creditCol ? (float) str_replace([' ', ','], ['', '.'], $row[$creditCol] ?? '0') : 0.0;
                $solde = $soldeCol ? (float) str_replace([' ', ','], ['', '.'], $row[$soldeCol] ?? '0') : 0.0;

                $stormPhone = $stormCol ? trim((string) ($row[$stormCol] ?? '')) : null;
                $rcNumber = $rcCol ? trim((string) ($row[$rcCol] ?? '')) : null;
                $persoPhone = $persoCol ? trim((string) ($row[$persoCol] ?? '')) : null;

                // Skip completely blank rows
                if (empty($name) && empty($phone) && empty($rawCode)) {
                    continue;
                }

                // Validation
                if (empty($name) || empty($phone)) {
                    $errors[] = [
                        'line' => $lineNum,
                        'error' => "Nom ou téléphone manquant à la ligne {$lineNum}.",
                    ];
                    continue;
                }

                $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
                $cleanStorm = !empty($stormPhone) ? preg_replace('/[^0-9]/', '', $stormPhone) : '';
                $cleanRc = !empty($rcNumber) ? mb_strtolower(preg_replace('/[^a-z0-9]/i', '', $rcNumber)) : '';
                $normCode = strtoupper($rawCode);
                $normName = mb_strtolower(trim(preg_replace('/\s+/', ' ', $name)));

                // Try matching existing client
                $existing = null;
                if (!empty($normCode) && isset($clientsByCode[$normCode])) {
                    $existing = $clientsByCode[$normCode];
                } elseif (!empty($cleanPhone) && isset($clientsByPhone[$cleanPhone])) {
                    $existing = $clientsByPhone[$cleanPhone];
                } elseif (!empty($cleanStorm) && isset($clientsByStorm[$cleanStorm])) {
                    $existing = $clientsByStorm[$cleanStorm];
                } elseif (!empty($cleanRc) && isset($clientsByRc[$cleanRc])) {
                    $existing = $clientsByRc[$cleanRc];
                } elseif (isset($clientsByName[$normName])) {
                    $existing = $clientsByName[$normName];
                }

                if ($existing) {
                    if ($duplicateAction === 'skip') {
                        $skippedCount++;
                        continue;
                    }

                    // Update existing
                    $existing->name = $name;
                    $existing->phone = $phone;
                    $existing->personal_phone = $persoPhone ?: ($existing->personal_phone ?: $phone);
                    if (!empty($stormPhone)) {
                        $existing->storm_phone = $stormPhone;
                    }
                    if (!empty($rcNumber)) {
                        $existing->rc_number = $rcNumber;
                    }
                    if (!empty($derivedWilaya)) {
                        $existing->wilaya = $derivedWilaya;
                    }
                    if (!empty($derivedRegion)) {
                        $existing->region = $derivedRegion;
                    }
                    if (!empty($address)) {
                        $existing->address = $address;
                    }
                    if (!empty($clientType)) {
                        $existing->client_type = $this->normalizeClientType($clientType);
                    }
                    if ($creditLimit > 0) {
                        $existing->credit_limit = $creditLimit;
                    }
                    if ($solde != 0) {
                        $existing->outstanding_balance = $solde;
                    }

                    // Assign delegate matching region if available
                    $regKey = mb_strtolower(trim($derivedRegion));
                    if (isset($delegatesByRegion[$regKey])) {
                        $existing->delegate_id = $delegatesByRegion[$regKey]->id;
                    }

                    $existing->save();
                    $updatedCount++;
                } else {
                    // Create new client
                    $newClient = new Client();
                    $newClient->name = $name;
                    $newClient->phone = $phone;
                    $newClient->personal_phone = $persoPhone ?: $phone;
                    $newClient->storm_phone = $stormPhone ?: null;
                    $newClient->rc_number = !empty($rcNumber) ? $rcNumber : null;
                    $newClient->client_code = !empty($rawCode) ? $rawCode : $this->generateNextClientCode();
                    $newClient->wilaya = $derivedWilaya ?: 'Alger';
                    $newClient->region = $derivedRegion;
                    $newClient->address = $address ?: ($derivedWilaya ?: 'Non renseignée');
                    $newClient->client_type = $this->normalizeClientType($clientType);
                    $newClient->status = 'active';
                    $newClient->credit_limit = $creditLimit;
                    $newClient->outstanding_balance = $solde;

                    // Assign delegate matching region if available
                    $regKey = mb_strtolower(trim($derivedRegion));
                    if (isset($delegatesByRegion[$regKey])) {
                        $newClient->delegate_id = $delegatesByRegion[$regKey]->id;
                    }

                    $newClient->save();

                    // Update local caches so duplicate lines within the same file are detected
                    if (!empty($newClient->client_code)) {
                        $clientsByCode[strtoupper(trim($newClient->client_code))] = $newClient;
                    }
                    if (!empty($cleanPhone)) {
                        $clientsByPhone[$cleanPhone] = $newClient;
                    }
                    if (!empty($newClient->rc_number)) {
                        $cRc = mb_strtolower(preg_replace('/[^a-z0-9]/i', '', $newClient->rc_number));
                        if (!empty($cRc)) {
                            $clientsByRc[$cRc] = $newClient;
                        }
                    }
                    $clientsByName[$normName] = $newClient;

                    $createdCount++;
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("ClientImportService execute error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }

        // Clean up temp file
        @unlink($filePath);

        return [
            'total_rows' => count($allRows),
            'created_count' => $createdCount,
            'updated_count' => $updatedCount,
            'skipped_count' => $skippedCount,
            'errors_count' => count($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Parse file headers, columns, sample rows, and suggested mapping.
     */
    protected function parseFile(string $filePath, string $ext, int $previewLimit = 5): array
    {
        if ($ext === 'csv') {
            return $this->parseCsv($filePath, $previewLimit);
        }

        // Check if XLSX or XLS
        if ($ext === 'xlsx' || $this->isZipArchive($filePath)) {
            return $this->parseXlsx($filePath, $previewLimit);
        }

        // Fallback for .xls (might be CSV or XML table)
        return $this->parseFallbackXls($filePath, $previewLimit);
    }

    /**
     * Parse a CSV file.
     */
    protected function parseCsv(string $filePath, int $previewLimit = 5): array
    {
        $delimiter = $this->detectCsvDelimiter($filePath);
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new \RuntimeException("Impossible d'ouvrir le fichier CSV.");
        }

        $headers = [];
        $previewRows = [];
        $totalRows = 0;
        $rowIndex = 0;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            // Trim and sanitize first cell UTF-8 BOM if present
            if ($rowIndex === 0) {
                if (isset($row[0])) {
                    $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', $row[0]);
                }
                $headers = $row;
                $rowIndex++;
                continue;
            }

            // Check if entirely empty
            $hasContent = false;
            foreach ($row as $val) {
                if (trim((string) $val) !== '') {
                    $hasContent = true;
                    break;
                }
            }
            if (!$hasContent) {
                continue;
            }

            $totalRows++;

            if (count($previewRows) < $previewLimit) {
                $mappedRow = [];
                foreach ($row as $colIdx => $val) {
                    $colLetter = $this->indexToColumnLetter($colIdx);
                    $mappedRow[$colLetter] = trim((string) $val);
                }
                $previewRows[] = $mappedRow;
            }
        }
        fclose($handle);

        $columns = [];
        foreach ($headers as $idx => $label) {
            $colLetter = $this->indexToColumnLetter($idx);
            $sample = $previewRows[0][$colLetter] ?? '';
            $columns[] = [
                'key' => $colLetter,
                'label' => trim((string) $label) ?: "Colonne {$colLetter}",
                'sample' => $sample,
            ];
        }

        $suggestedMapping = $this->generateSuggestedMapping($columns);

        return [
            'total_rows' => $totalRows,
            'columns' => $columns,
            'preview_rows' => $previewRows,
            'suggested_mapping' => $suggestedMapping,
        ];
    }

    /**
     * Parse an XLSX file using ZipArchive and XMLReader.
     */
    protected function parseXlsx(string $filePath, int $previewLimit = 5): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Impossible d'ouvrir l'archive Excel (.xlsx).");
        }

        // 1. Shared Strings
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

        // 2. Sheet XML
        $sheetName = 'xl/worksheets/sheet1.xml';
        if ($zip->locateName($sheetName) === false) {
            // Find first sheet
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $stat = $zip->statIndex($i);
                if ($stat && str_starts_with($stat['name'], 'xl/worksheets/sheet')) {
                    $sheetName = $stat['name'];
                    break;
                }
            }
        }

        $xmlSheet = new XMLReader();
        if (!$xmlSheet->open('zip://' . $filePath . '#' . $sheetName)) {
            $zip->close();
            throw new \RuntimeException("Impossible de lire la feuille principale du fichier Excel.");
        }

        $headers = [];
        $previewRows = [];
        $totalRows = 0;
        $rowCount = 0;
        $columnsOrder = [];

        while ($xmlSheet->read()) {
            if ($xmlSheet->nodeType === XMLReader::ELEMENT && $xmlSheet->name === 'row') {
                $rowCount++;
                $rowXml = $xmlSheet->readOuterXml();

                $cells = $this->extractCellsFromRowXml($rowXml, $sharedStrings);

                if ($rowCount === 1) {
                    // Header row
                    $headers = $cells;
                    foreach ($cells as $colLetter => $val) {
                        if (!in_array($colLetter, $columnsOrder)) {
                            $columnsOrder[] = $colLetter;
                        }
                    }
                    continue;
                }

                // Check content
                $hasContent = false;
                foreach ($cells as $v) {
                    if (trim((string) $v) !== '') {
                        $hasContent = true;
                        break;
                    }
                }
                if (!$hasContent) {
                    continue;
                }

                $totalRows++;

                if (count($previewRows) < $previewLimit) {
                    $previewRows[] = $cells;
                }
            }
        }

        $xmlSheet->close();
        $zip->close();

        // Build columns list
        $columns = [];
        // Ensure standard alphabet order or headers order
        ksort($headers);
        foreach ($headers as $colLetter => $label) {
            $sample = '';
            foreach ($previewRows as $pr) {
                if (!empty($pr[$colLetter])) {
                    $sample = $pr[$colLetter];
                    break;
                }
            }
            $columns[] = [
                'key' => $colLetter,
                'label' => trim((string) $label) ?: "Colonne {$colLetter}",
                'sample' => $sample,
            ];
        }

        $suggestedMapping = $this->generateSuggestedMapping($columns);

        return [
            'total_rows' => $totalRows,
            'columns' => $columns,
            'preview_rows' => $previewRows,
            'suggested_mapping' => $suggestedMapping,
        ];
    }

    /**
     * Fallback parser for .xls files.
     */
    protected function parseFallbackXls(string $filePath, int $previewLimit = 5): array
    {
        // Try parsing as CSV in case it's a tab or comma delimited export named .xls
        try {
            return $this->parseCsv($filePath, $previewLimit);
        } catch (\Throwable $e) {
            throw new \RuntimeException("Format .xls non supporté ou fichier corrompu. Veuillez enregistrer au format .xlsx ou .csv.");
        }
    }

    /**
     * Read all data rows from file.
     */
    protected function readAllDataRows(string $filePath, string $ext): array
    {
        if ($ext === 'csv') {
            $delimiter = $this->detectCsvDelimiter($filePath);
            $handle = fopen($filePath, 'r');
            $rows = [];
            $idx = 0;
            while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
                $idx++;
                if ($idx === 1) {
                    continue; // skip header
                }
                $mapped = [];
                foreach ($data as $cIdx => $val) {
                    $colLetter = $this->indexToColumnLetter($cIdx);
                    $mapped[$colLetter] = trim((string) $val);
                }
                $rows[] = $mapped;
            }
            fclose($handle);
            return $rows;
        }

        // XLSX
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Impossible d'ouvrir le fichier Excel.");
        }

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

        $sheetName = 'xl/worksheets/sheet1.xml';
        if ($zip->locateName($sheetName) === false) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $stat = $zip->statIndex($i);
                if ($stat && str_starts_with($stat['name'], 'xl/worksheets/sheet')) {
                    $sheetName = $stat['name'];
                    break;
                }
            }
        }

        $xmlSheet = new XMLReader();
        if (!$xmlSheet->open('zip://' . $filePath . '#' . $sheetName)) {
            $zip->close();
            throw new \RuntimeException("Impossible de lire la feuille de calcul Excel.");
        }

        $rows = [];
        $rowCount = 0;
        while ($xmlSheet->read()) {
            if ($xmlSheet->nodeType === XMLReader::ELEMENT && $xmlSheet->name === 'row') {
                $rowCount++;
                if ($rowCount === 1) {
                    continue;
                }
                $rowXml = $xmlSheet->readOuterXml();
                $rows[] = $this->extractCellsFromRowXml($rowXml, $sharedStrings);
            }
        }

        $xmlSheet->close();
        $zip->close();

        return $rows;
    }

    /**
     * Extract key-value cells from a row's XML string.
     */
    protected function extractCellsFromRowXml(string $rowXml, array $sharedStrings): array
    {
        $cells = [];
        preg_match_all('/<c\b([^>]*)>(?:<v>(.*?)<\/v>|<is><t>(.*?)<\/t><\/is>)?/s', $rowXml, $matches, PREG_SET_ORDER);

        foreach ($matches as $m) {
            preg_match('/r="([A-Z]+)[0-9]+"/', $m[1], $rMatch);
            preg_match('/t="([^"]+)"/', $m[1], $tMatch);
            $col = $rMatch[1] ?? '';
            $type = $tMatch[1] ?? '';

            $val = '';
            if (isset($m[2]) && $m[2] !== '') {
                $val = $m[2];
            } elseif (isset($m[3]) && $m[3] !== '') {
                $val = $m[3];
            }

            if ($type === 's' && isset($sharedStrings[(int) $val])) {
                $val = $sharedStrings[(int) $val];
            }

            if (!empty($col)) {
                $cells[$col] = html_entity_decode((string) $val, ENT_QUOTES | ENT_XML1, 'UTF-8');
            }
        }

        return $cells;
    }

    /**
     * Auto-detect column mapping according to header names and typical keywords.
     */
    protected function generateSuggestedMapping(array $columns): array
    {
        $mapping = [];
        $patterns = [
            'name' => '/\b(nom|name|client|raison|societe|customer|tiers|denomination)\b/i',
            'phone' => '/\b(tel|phone|telephone|mobile|gsm|contact|portable)\b/i',
            'storm_phone' => '/\b(storm|flexy|puce|sim|ooredoo|num_storm|numero_storm)\b/i',
            'rc_number' => '/\b(rc|registre|num_rc|n_rc|numero_rc|rc_num|com_reg|reg_com)\b/i',
            'personal_phone' => '/\b(perso|personnel|contact_perso|tel_perso)\b/i',
            'client_code' => '/\b(code|ref|matricule|id_client|client_id)\b/i',
            'wilaya' => '/\b(wilaya|province|city|ville)\b/i',
            'region' => '/\b(region|zone|secteur)\b/i',
            'address' => '/\b(adresse|address|rue|street|localite)\b/i',
            'client_type' => '/\b(type|categorie|classification|segment)\b/i',
            'credit_limit' => '/\b(credit|plafond|limite|max)\b/i',
            'outstanding_balance' => '/\b(solde|dette|balance|impaye|creance|debit)\b/i',
        ];

        foreach ($patterns as $field => $pattern) {
            foreach ($columns as $col) {
                $label = mb_strtolower($col['label']);
                if (preg_match($pattern, $label)) {
                    // Avoid false positive (e.g. "code client" for "name")
                    if ($field === 'name' && (str_contains($label, 'code') || str_contains($label, 'type'))) {
                        continue;
                    }
                    if ($field === 'client_type' && str_contains($label, 'region')) {
                        continue;
                    }
                    $mapping[$field] = $col['key'];
                    break;
                }
            }
        }

        return $mapping;
    }

    /**
     * Detect CSV delimiter (comma, semicolon, tab, pipe).
     */
    protected function detectCsvDelimiter(string $filePath): string
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            return ',';
        }

        $lines = [];
        for ($i = 0; $i < 5 && ($line = fgets($handle)) !== false; $i++) {
            $lines[] = $line;
        }
        fclose($handle);

        $delimiters = [',', ';', "\t", '|'];
        $bestDelimiter = ',';
        $maxCount = 0;

        foreach ($delimiters as $d) {
            $count = 0;
            foreach ($lines as $l) {
                $count += substr_count($l, $d);
            }
            if ($count > $maxCount) {
                $maxCount = $count;
                $bestDelimiter = $d;
            }
        }

        return $bestDelimiter;
    }

    /**
     * Convert zero-based integer index to Excel column letter (0 -> A, 1 -> B, 26 -> AA).
     */
    protected function indexToColumnLetter(int $index): string
    {
        $letter = '';
        while ($index >= 0) {
            $letter = chr($index % 26 + 65) . $letter;
            $index = intdiv($index, 26) - 1;
        }
        return $letter;
    }

    /**
     * Check if a file is a valid ZIP archive.
     */
    protected function isZipArchive(string $filePath): bool
    {
        $zip = new ZipArchive();
        $res = $zip->open($filePath);
        if ($res === true) {
            $zip->close();
            return true;
        }
        return false;
    }

    /**
     * Clean wilaya name (removes number prefix e.g. "16 - Alger" -> "Alger").
     */
    protected function cleanWilayaName(string $wilaya): string
    {
        $trimmed = trim($wilaya);
        if (is_numeric($trimmed)) {
            $code = str_pad($trimmed, 2, '0', STR_PAD_LEFT);
            $w = Wilaya::where('code', $code)->first();
            if ($w) {
                return $w->name;
            }
        }
        return trim(preg_replace('/^\d+\s*-\s*/', '', $trimmed));
    }

    /**
     * Resolve region name from wilaya name using Wilaya default regions.
     */
    protected function resolveRegionFromWilaya(string $wilayaName, array $wilayasMap): string
    {
        $clean = mb_strtolower(trim($wilayaName));
        if (isset($wilayasMap[$clean])) {
            return $wilayasMap[$clean]->region_name ?? 'Center';
        }

        // Match against default regions
        foreach (Wilaya::$defaultRegions as $code => $info) {
            if (isset($wilayasMap[$code]) && mb_strtolower(trim($wilayasMap[$code]->name)) === $clean) {
                return $info['name'];
            }
        }

        return 'Center';
    }

    /**
     * Normalize client type string.
     */
    protected function normalizeClientType(string $type): string
    {
        $low = mb_strtolower(trim($type));
        if (str_contains($low, 'whole') || str_contains($low, 'gros')) {
            return 'wholesale';
        }
        if (str_contains($low, 'corp') || str_contains($low, 'entr')) {
            return 'corporate';
        }
        if (str_contains($low, 'gov') || str_contains($low, 'etat') || str_contains($low, 'pub')) {
            return 'government';
        }
        return 'retail';
    }

    /**
     * Generate next sequential client code (CLI-2026-XXXXXX).
     */
    protected function generateNextClientCode(): string
    {
        $last = Client::orderByDesc('id')->value('client_code');
        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            return 'CLI-2026-' . str_pad((string) ((int) $m[1] + 1), 6, '0', STR_PAD_LEFT);
        }

        $count = Client::count();
        return 'CLI-2026-' . str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
    }
}
