<?php

namespace App\Services;

use App\Models\Client;
use App\Models\SalesJournal;
use App\Models\SalesJournalImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use XMLReader;
use ZipArchive;

class SalesJournalImportService
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
     * Preview an uploaded file or server file for Sales Journal import.
     */
    public function preview($fileOrPath, ?string $originalName = null): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(180);

        $fileToken = (string) Str::uuid();

        if ($fileOrPath instanceof UploadedFile) {
            $ext = strtolower($fileOrPath->getClientOriginalExtension());
            if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
                $ext = 'xlsx';
            }
            $storedFileName = "sales_journal_{$fileToken}.{$ext}";
            $storedPath = "{$this->tempDir}/{$storedFileName}";
            $fileOrPath->move($this->tempDir, $storedFileName);
            $fileName = $originalName ?: $fileOrPath->getClientOriginalName();
        } else {
            $sourcePath = $fileOrPath;
            if (!file_exists($sourcePath)) {
                throw new \InvalidArgumentException("Le fichier spécifié est introuvable: {$sourcePath}");
            }
            $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
            if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
                $ext = 'xlsx';
            }
            $storedFileName = "sales_journal_{$fileToken}.{$ext}";
            $storedPath = "{$this->tempDir}/{$storedFileName}";
            copy($sourcePath, $storedPath);
            $fileName = $originalName ?: basename($sourcePath);
        }

        $parsed = $this->parseFile($storedPath, $ext, 10);

        return [
            'file_token' => $fileToken,
            'file_name' => $fileName,
            'total_rows' => $parsed['total_rows'],
            'columns' => $parsed['columns'],
            'preview_rows' => $parsed['preview_rows'],
            'suggested_mapping' => $parsed['suggested_mapping'],
        ];
    }

    /**
     * Verify matching against system data (Clients, Wilayas, Regions, Delegates).
     */
    public function verify(string $fileToken, array $mapping, string $unmatchedAction = 'link_only'): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $filePath = $this->resolveFilePath($fileToken);
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        $tiersCol = $mapping['tiers_name'] ?? null;
        $ttcCol = $mapping['total_ttc'] ?? ($mapping['amount_ht'] ?? null);
        $paidCol = $mapping['paid_amount'] ?? null;
        $remainingCol = $mapping['remaining_amount'] ?? null;
        $dateCol = $mapping['operation_date'] ?? null;

        if (!$tiersCol) {
            throw new \InvalidArgumentException("La colonne 'Tiers / Client' est obligatoire pour la vérification.");
        }

        // 1. Preload clients from DB with delegate info
        $allClients = Client::with(['delegate:id,name'])->get(['id', 'client_code', 'name', 'phone', 'wilaya', 'region', 'delegate_id']);
        $clientsByCode = [];
        $clientsByName = [];
        $clientsByBaseName = [];

        foreach ($allClients as $client) {
            if (!empty($client->client_code)) {
                $clientsByCode[strtoupper(trim($client->client_code))] = $client;
            }
            if (!empty($client->name)) {
                $norm = $this->normalizeName($client->name);
                $clientsByName[$norm] = $client;
                $base = $this->normalizeName($this->extractBaseName($client->name));
                $clientsByBaseName[$base] = $client;
            }
        }

        // 2. Stream and aggregate by Tiers and collect unique references
        $tiersAggregates = [];
        $fileReferences = [];
        $totalTtc = 0.0;
        $totalPaid = 0.0;
        $totalRemaining = 0.0;
        $totalRows = 0;

        foreach ($this->streamRows($filePath, $ext) as $row) {
            $rawTiers = trim($row[$tiersCol] ?? '');
            if ($rawTiers === '') continue;

            $totalRows++;
            $ttc = $ttcCol && isset($row[$ttcCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$ttcCol])) : 0.0;
            $paid = $paidCol && isset($row[$paidCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$paidCol])) : 0.0;
            $remaining = $remainingCol && isset($row[$remainingCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$remainingCol])) : max(0.0, $ttc - $paid);

            $totalTtc += $ttc;
            $totalPaid += $paid;
            $totalRemaining += $remaining;

            $refCol = $mapping['reference'] ?? null;
            if ($refCol && !empty($row[$refCol])) {
                $ref = trim($row[$refCol]);
                $fileReferences[$ref] = ($fileReferences[$ref] ?? 0) + 1;
            }

            if (!isset($tiersAggregates[$rawTiers])) {
                $tiersAggregates[$rawTiers] = [
                    'count' => 0,
                    'total_ttc' => 0.0,
                    'total_paid' => 0.0,
                    'total_remaining' => 0.0,
                    'last_date' => null,
                ];
            }

            $tiersAggregates[$rawTiers]['count']++;
            $tiersAggregates[$rawTiers]['total_ttc'] += $ttc;
            $tiersAggregates[$rawTiers]['total_paid'] += $paid;
            $tiersAggregates[$rawTiers]['total_remaining'] += $remaining;

            if ($dateCol && !empty($row[$dateCol])) {
                $tiersAggregates[$rawTiers]['last_date'] = $row[$dateCol];
            }
        }

        // 3. Check existing duplicates in database by reference
        $existingDuplicatesCount = 0;
        $sampleDuplicates = [];
        if (!empty($fileReferences)) {
            $refKeys = array_keys($fileReferences);
            // Check in chunks of 1000 references
            foreach (array_chunk($refKeys, 1000) as $chunk) {
                $existingRefs = SalesJournal::whereIn('reference', $chunk)
                    ->get(['id', 'reference', 'tiers_name', 'total_ttc', 'operation_date']);
                foreach ($existingRefs as $rec) {
                    $existingDuplicatesCount++;
                    if (count($sampleDuplicates) < 10) {
                        $sampleDuplicates[] = [
                            'reference' => $rec->reference,
                            'tiers_name' => $rec->tiers_name,
                            'total_ttc' => $rec->total_ttc,
                            'operation_date' => $rec->operation_date ? $rec->operation_date->format('Y-m-d') : null,
                        ];
                    }
                }
            }
        }

        // Internal duplicates within file (same reference appearing multiple times in the file)
        $inboundDuplicatesCount = 0;
        foreach ($fileReferences as $ref => $cnt) {
            if ($cnt > 1) {
                $inboundDuplicatesCount += ($cnt - 1);
            }
        }

        // 4. Match against DB clients
        $matchedClientsCount = 0;
        $unmatchedClientsCount = 0;
        $samples = [];

        foreach ($tiersAggregates as $rawTiers => $data) {
            $matchedClient = $this->findMatchingClient($rawTiers, $clientsByCode, $clientsByName, $clientsByBaseName);

            if ($matchedClient) {
                $matchedClientsCount++;
                $matchStatus = 'matched';
            } else {
                $unmatchedClientsCount++;
                $matchStatus = 'unmatched';
            }

            $samples[] = [
                'tiers_name' => $rawTiers,
                'status' => $matchStatus,
                'operations_count' => $data['count'],
                'total_ttc' => round($data['total_ttc'], 2),
                'total_paid' => round($data['total_paid'], 2),
                'total_remaining' => round($data['total_remaining'], 2),
                'matched_client' => $matchedClient ? [
                    'id' => $matchedClient->id,
                    'name' => $matchedClient->name,
                    'client_code' => $matchedClient->client_code,
                    'wilaya' => $matchedClient->wilaya,
                    'region' => $matchedClient->region,
                    'delegate' => $matchedClient->delegate ? $matchedClient->delegate->name : null,
                ] : null,
            ];
        }

        // Sort samples: unmatched first, then by operations count desc
        usort($samples, function ($a, $b) {
            if ($a['status'] !== $b['status']) {
                return $a['status'] === 'unmatched' ? -1 : 1;
            }
            return $b['operations_count'] <=> $a['operations_count'];
        });

        return [
            'total_rows' => $totalRows,
            'unique_tiers_count' => count($tiersAggregates),
            'matched_clients_count' => $matchedClientsCount,
            'unmatched_clients_count' => $unmatchedClientsCount,
            'existing_duplicates_count' => $existingDuplicatesCount,
            'inbound_duplicates_count' => $inboundDuplicatesCount,
            'sample_duplicates' => $sampleDuplicates,
            'total_ttc' => round($totalTtc, 2),
            'total_paid' => round($totalPaid, 2),
            'total_remaining' => round($totalRemaining, 2),
            'unmatched_action' => $unmatchedAction,
            'samples' => array_slice($samples, 0, 100),
        ];
    }

    /**
     * Execute final import and persistence in transactions with batch inserts.
     */
    public function execute(string $fileToken, array $mapping, string $unmatchedAction = 'link_only', ?int $userId = null, string $duplicateAction = 'skip'): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $startTime = microtime(true);
        $filePath = $this->resolveFilePath($fileToken);
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        $tiersCol = $mapping['tiers_name'] ?? null;
        $refCol = $mapping['reference'] ?? null;
        $typeCol = $mapping['type'] ?? null;
        $statusCol = $mapping['status'] ?? null;
        $dateCol = $mapping['operation_date'] ?? null;
        $htCol = $mapping['amount_ht'] ?? null;
        $discCol = $mapping['discount_pct'] ?? null;
        $netHtCol = $mapping['net_ht'] ?? null;
        $tvaCol = $mapping['tva'] ?? null;
        $timbreCol = $mapping['timbre'] ?? null;
        $ttcCol = $mapping['total_ttc'] ?? null;
        $paidCol = $mapping['paid_amount'] ?? null;
        $remainingCol = $mapping['remaining_amount'] ?? null;
        $modeCol = $mapping['payment_mode'] ?? null;
        $currencyCol = $mapping['currency'] ?? null;
        $depotSourceCol = $mapping['depot_source'] ?? null;
        $depotDestCol = $mapping['depot_destination'] ?? null;
        $createdByCol = $mapping['created_by_erp'] ?? null;
        $createdAtCol = $mapping['created_at_erp'] ?? null;

        if (!$tiersCol) {
            throw new \InvalidArgumentException("La colonne 'Tiers / Client' est obligatoire pour l'importation.");
        }

        // 1. Preload clients from DB
        $allClients = Client::all();
        $clientsByCode = [];
        $clientsByName = [];
        $clientsByBaseName = [];

        foreach ($allClients as $client) {
            if (!empty($client->client_code)) {
                $clientsByCode[strtoupper(trim($client->client_code))] = $client;
            }
            if (!empty($client->name)) {
                $norm = $this->normalizeName($client->name);
                $clientsByName[$norm] = $client;
                $base = $this->normalizeName($this->extractBaseName($client->name));
                $clientsByBaseName[$base] = $client;
            }
        }

        // 2. Preload existing references from database to efficiently detect duplicates
        $existingSalesByRef = [];
        // Pull all existing references in DB into a hash map [reference => record_id]
        SalesJournal::select(['id', 'reference'])->chunk(5000, function ($chunk) use (&$existingSalesByRef) {
            foreach ($chunk as $item) {
                if (!empty($item->reference)) {
                    $existingSalesByRef[$item->reference] = $item->id;
                }
            }
        });

        $importRecord = SalesJournalImport::create([
            'file_name' => basename($filePath),
            'rows_count' => 0,
            'matched_clients_count' => 0,
            'unmatched_clients_count' => 0,
            'duplicate_action' => $duplicateAction,
            'skipped_duplicates_count' => 0,
            'updated_duplicates_count' => 0,
            'total_amount_ttc' => 0,
            'total_paid' => 0,
            'total_remaining' => 0,
            'imported_by' => $userId,
        ]);

        $batch = [];
        $batchSize = 500;
        $rowsImported = 0;
        $matchedCount = 0;
        $unmatchedCount = 0;
        $skippedDuplicates = 0;
        $updatedDuplicates = 0;
        $totalTtc = 0.0;
        $totalPaid = 0.0;
        $totalRemaining = 0.0;
        $seenTiers = [];
        $seenInFileRefs = [];

        DB::beginTransaction();
        try {
            foreach ($this->streamRows($filePath, $ext) as $row) {
                $rawTiers = trim($row[$tiersCol] ?? '');
                if ($rawTiers === '') continue;

                $reference = $refCol ? trim($row[$refCol] ?? '') : ('BL-' . date('Ymd') . '-' . ($rowsImported + 1));
                if (empty($reference)) {
                    $reference = 'BL-' . date('Ymd') . '-' . ($rowsImported + 1);
                }

                // Check if this reference was already encountered in this file (internal duplicate)
                $isDuplicateInFile = isset($seenInFileRefs[$reference]);
                // Check if this reference exists in the database
                $existingRecordId = $existingSalesByRef[$reference] ?? null;
                $isDuplicate = $isDuplicateInFile || ($existingRecordId !== null);

                $seenInFileRefs[$reference] = true;

                $matchedClient = $this->findMatchingClient($rawTiers, $clientsByCode, $clientsByName, $clientsByBaseName);

                if ($matchedClient) {
                    $clientId = $matchedClient->id;
                    $delegateId = $matchedClient->delegate_id;
                    $clientCode = $matchedClient->client_code;
                    $wilaya = $matchedClient->wilaya;
                    $region = $matchedClient->region;
                    if (!isset($seenTiers[$rawTiers])) {
                        $matchedCount++;
                        $seenTiers[$rawTiers] = true;
                    }
                } else {
                    if ($unmatchedAction === 'create_missing') {
                        $newCode = $this->generateClientCode();
                        $newClient = Client::create([
                            'name' => $rawTiers,
                            'client_code' => $newCode,
                            'status' => 'active',
                            'credit_limit' => 0,
                            'outstanding_balance' => 0,
                        ]);
                        $norm = $this->normalizeName($rawTiers);
                        $clientsByName[$norm] = $newClient;
                        $clientsByCode[strtoupper($newCode)] = $newClient;

                        $clientId = $newClient->id;
                        $delegateId = null;
                        $clientCode = $newCode;
                        $wilaya = null;
                        $region = null;
                    } else {
                        $clientId = null;
                        $delegateId = null;
                        $clientCode = null;
                        $wilaya = null;
                        $region = null;
                    }

                    if (!isset($seenTiers[$rawTiers])) {
                        $unmatchedCount++;
                        $seenTiers[$rawTiers] = false;
                    }
                }

                $type = $typeCol ? trim($row[$typeCol] ?? 'Bon de Livraison') : 'Bon de Livraison';
                $status = $statusCol ? trim($row[$statusCol] ?? 'Validé') : 'Validé';
                $operationDate = $dateCol ? $this->parseDate($row[$dateCol] ?? '') : now()->toDateTimeString();

                $amountHt = $htCol && isset($row[$htCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$htCol])) : 0.0;
                $discPct = $discCol && isset($row[$discCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$discCol])) : 0.0;
                $netHt = $netHtCol && isset($row[$netHtCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$netHtCol])) : $amountHt;
                $tva = $tvaCol && isset($row[$tvaCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$tvaCol])) : 0.0;
                $timbre = $timbreCol && isset($row[$timbreCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$timbreCol])) : 0.0;

                $totalRowTtc = $ttcCol && isset($row[$ttcCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$ttcCol])) : ($netHt + $tva + $timbre);
                $paid = $paidCol && isset($row[$paidCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$paidCol])) : 0.0;
                $remaining = $remainingCol && isset($row[$remainingCol]) ? floatval(str_replace([' ', ','], ['', '.'], $row[$remainingCol])) : max(0.0, $totalRowTtc - $paid);

                $paymentMode = $modeCol ? trim($row[$modeCol] ?? '') : null;
                $currency = $currencyCol ? trim($row[$currencyCol] ?? 'Dinar Algérie (DA)') : 'Dinar Algérie (DA)';
                $depotSource = $depotSourceCol ? trim($row[$depotSourceCol] ?? '') : null;
                $depotDest = $depotDestCol ? trim($row[$depotDestCol] ?? '') : null;
                $createdBy = $createdByCol ? trim($row[$createdByCol] ?? '') : null;
                $createdAtErp = $createdAtCol ? $this->parseDate($row[$createdAtCol] ?? '') : null;

                // Handle duplicate case
                if ($isDuplicate) {
                    if ($duplicateAction === 'skip') {
                        // Skip this duplicate row completely
                        $skippedDuplicates++;
                        continue;
                    } elseif ($duplicateAction === 'update' && $existingRecordId) {
                        // Update existing record in DB with newer values from the file
                        SalesJournal::where('id', $existingRecordId)->update([
                            'import_id' => $importRecord->id,
                            'client_id' => $clientId,
                            'delegate_id' => $delegateId,
                            'type' => $type,
                            'status' => $status,
                            'operation_date' => $operationDate,
                            'tiers_name' => $rawTiers,
                            'client_code' => $clientCode,
                            'wilaya' => $wilaya,
                            'region' => $region,
                            'amount_ht' => $amountHt,
                            'discount_pct' => $discPct,
                            'net_ht' => $netHt,
                            'tva' => $tva,
                            'timbre' => $timbre,
                            'total_ttc' => $totalRowTtc,
                            'paid_amount' => $paid,
                            'remaining_amount' => $remaining,
                            'payment_mode' => $paymentMode,
                            'currency' => $currency,
                            'depot_source' => $depotSource,
                            'depot_destination' => $depotDest,
                            'created_by_erp' => $createdBy,
                            'created_at_erp' => $createdAtErp,
                            'updated_at' => now(),
                        ]);
                        $updatedDuplicates++;
                        $totalTtc += $totalRowTtc;
                        $totalPaid += $paid;
                        $totalRemaining += $remaining;
                        $rowsImported++;
                        continue;
                    }
                }

                $totalTtc += $totalRowTtc;
                $totalPaid += $paid;
                $totalRemaining += $remaining;

                $batch[] = [
                    'import_id' => $importRecord->id,
                    'client_id' => $clientId,
                    'delegate_id' => $delegateId,
                    'reference' => $reference,
                    'type' => $type,
                    'status' => $status,
                    'operation_date' => $operationDate,
                    'tiers_name' => $rawTiers,
                    'client_code' => $clientCode,
                    'wilaya' => $wilaya,
                    'region' => $region,
                    'amount_ht' => $amountHt,
                    'discount_pct' => $discPct,
                    'net_ht' => $netHt,
                    'tva' => $tva,
                    'timbre' => $timbre,
                    'total_ttc' => $totalRowTtc,
                    'paid_amount' => $paid,
                    'remaining_amount' => $remaining,
                    'payment_mode' => $paymentMode,
                    'currency' => $currency,
                    'depot_source' => $depotSource,
                    'depot_destination' => $depotDest,
                    'created_by_erp' => $createdBy,
                    'created_at_erp' => $createdAtErp,
                    'locked' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $rowsImported++;

                if (count($batch) >= $batchSize) {
                    SalesJournal::insert($batch);
                    $batch = [];
                }
            }

            if (!empty($batch)) {
                SalesJournal::insert($batch);
                $batch = [];
            }

            $importRecord->update([
                'rows_count' => $rowsImported,
                'matched_clients_count' => $matchedCount,
                'unmatched_clients_count' => $unmatchedCount,
                'skipped_duplicates_count' => $skippedDuplicates,
                'updated_duplicates_count' => $updatedDuplicates,
                'total_amount_ttc' => round($totalTtc, 2),
                'total_paid' => round($totalPaid, 2),
                'total_remaining' => round($totalRemaining, 2),
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('SalesJournalImportService execute error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }

        $duration = round(microtime(true) - $startTime, 2);

        return [
            'success' => true,
            'import_id' => $importRecord->id,
            'rows_count' => $rowsImported,
            'matched_clients_count' => $matchedCount,
            'unmatched_clients_count' => $unmatchedCount,
            'duplicate_action' => $duplicateAction,
            'skipped_duplicates_count' => $skippedDuplicates,
            'updated_duplicates_count' => $updatedDuplicates,
            'total_amount_ttc' => round($totalTtc, 2),
            'total_paid' => round($totalPaid, 2),
            'total_remaining' => round($totalRemaining, 2),
            'duration_seconds' => $duration,
        ];
    }

    public function findMatchingClient(string $rawTiers, array $byCode, array $byName, array $byBaseName): ?Client
    {
        $code = strtoupper(trim($rawTiers));
        if (isset($byCode[$code])) {
            return $byCode[$code];
        }

        $norm = $this->normalizeName($rawTiers);
        if (isset($byName[$norm])) {
            return $byName[$norm];
        }

        $base = $this->normalizeName($this->extractBaseName($rawTiers));
        if (isset($byBaseName[$base])) {
            return $byBaseName[$base];
        }

        return null;
    }

    /**
     * Stream rows from XLSX or CSV using XMLReader / ZipArchive.
     */
    protected function streamRows(string $filePath, string $ext): \Generator
    {
        if ($ext === 'csv') {
            $delimiter = $this->detectCsvDelimiter($filePath);
            $handle = fopen($filePath, 'r');
            if (!$handle) return;

            $rowIndex = 0;
            while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
                if ($rowIndex === 0) {
                    $rowIndex++;
                    continue;
                }
                $cells = [];
                foreach ($row as $colIdx => $val) {
                    $colLetter = $this->indexToColumnLetter($colIdx);
                    $cells[$colLetter] = trim((string) $val);
                }
                yield $cells;
                $rowIndex++;
            }
            fclose($handle);
            return;
        }

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
            throw new \RuntimeException("Impossible d'ouvrir la feuille de calcul Excel.");
        }

        $rowCount = 0;
        while ($xmlSheet->read()) {
            if ($xmlSheet->nodeType === XMLReader::ELEMENT && $xmlSheet->name === 'row') {
                $rowCount++;
                if ($rowCount === 1) {
                    continue;
                }
                $rowXml = $xmlSheet->readOuterXml();
                $cells = $this->extractCellsFromRowXml($rowXml, $sharedStrings);
                yield $cells;
            }
        }

        $xmlSheet->close();
        $zip->close();
    }

    protected function parseFile(string $filePath, string $ext, int $previewLimit = 10): array
    {
        if ($ext === 'csv') {
            return $this->parseCsv($filePath, $previewLimit);
        }
        return $this->parseXlsx($filePath, $previewLimit);
    }

    protected function parseCsv(string $filePath, int $previewLimit = 10): array
    {
        $delimiter = $this->detectCsvDelimiter($filePath);
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new \RuntimeException("Impossible d'ouvrir le fichier CSV.");
        }

        $headers = [];
        $previewRows = [];
        $totalRows = 0;
        $rowCount = 0;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowCount++;
            $cells = [];
            foreach ($row as $idx => $val) {
                $colLetter = $this->indexToColumnLetter($idx);
                $cells[$colLetter] = trim((string) $val);
            }

            if ($rowCount === 1) {
                $headers = $cells;
                continue;
            }

            $hasContent = false;
            foreach ($cells as $v) {
                if ($v !== '') {
                    $hasContent = true;
                    break;
                }
            }
            if (!$hasContent) continue;

            $totalRows++;
            if (count($previewRows) < $previewLimit) {
                $previewRows[] = $cells;
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

        return [
            'total_rows' => $totalRows,
            'columns' => $columns,
            'preview_rows' => $previewRows,
            'suggested_mapping' => $this->generateSuggestedMapping($columns),
        ];
    }

    protected function parseXlsx(string $filePath, int $previewLimit = 10): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException("Impossible d'ouvrir le fichier Excel (.xlsx).");
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
            throw new \RuntimeException("Impossible de lire la feuille principale du fichier Excel.");
        }

        $headers = [];
        $previewRows = [];
        $totalRows = 0;
        $rowCount = 0;

        while ($xmlSheet->read()) {
            if ($xmlSheet->nodeType === XMLReader::ELEMENT && $xmlSheet->name === 'row') {
                $rowCount++;
                $rowXml = $xmlSheet->readOuterXml();
                $cells = $this->extractCellsFromRowXml($rowXml, $sharedStrings);

                if ($rowCount === 1) {
                    $headers = $cells;
                    continue;
                }

                $hasContent = false;
                foreach ($cells as $v) {
                    if (trim((string) $v) !== '') {
                        $hasContent = true;
                        break;
                    }
                }
                if (!$hasContent) continue;

                $totalRows++;
                if (count($previewRows) < $previewLimit) {
                    $previewRows[] = $cells;
                }
            }
        }

        $xmlSheet->close();
        $zip->close();

        $columns = [];
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

        return [
            'total_rows' => $totalRows,
            'columns' => $columns,
            'preview_rows' => $previewRows,
            'suggested_mapping' => $this->generateSuggestedMapping($columns),
        ];
    }

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

    protected function generateSuggestedMapping(array $columns): array
    {
        $mapping = [];
        $patterns = [
            'tiers_name' => '/\b(tiers|client|nom|nom client|raison|client\/tiers)\b/i',
            'reference' => '/\b(reference|référence|ref|n°\s*bl|numéro|n°\s*piece|piece)\b/i',
            'operation_date' => '/\b(date|date effet|date bl|date_effet|date op)\b/i',
            'total_ttc' => '/\b(net à payer|net a payer|ttc|total ttc|montant ttc)\b/i',
            'paid_amount' => '/\b(paiement|reglement|payé|versement|encaissement)\b/i',
            'remaining_amount' => '/\b(reste à payer|reste a payer|reste|solde)\b/i',
            'amount_ht' => '/\b(montant ht|total ht|brut ht)\b/i',
            'discount_pct' => '/\b(r\.%|remise|remise %|rabais)\b/i',
            'net_ht' => '/\b(net ht)\b/i',
            'tva' => '/\b(tva)\b/i',
            'timbre' => '/\b(timbre)\b/i',
            'type' => '/\b(type|nature|sens)\b/i',
            'status' => '/\b(etat|état|statut|validation)\b/i',
            'payment_mode' => '/\b(mode|moyen|reglement|mode associe)\b/i',
            'depot_source' => '/\b(dépot source|depot source|magasin source|depot)\b/i',
            'depot_destination' => '/\b(dépot destination|depot destination)\b/i',
            'created_by_erp' => '/\b(créé par|cree par|auteur|utilisateur)\b/i',
            'created_at_erp' => '/\b(créé le|cree le)\b/i',
        ];

        foreach ($patterns as $field => $pattern) {
            foreach ($columns as $col) {
                if (preg_match($pattern, $col['label'])) {
                    $mapping[$field] = $col['key'];
                    break;
                }
            }
        }

        return $mapping;
    }

    public function parseDate(?string $val): ?string
    {
        if (!$val || trim($val) === '') {
            return null;
        }

        $valStr = trim($val);

        if (is_numeric($valStr)) {
            $days = (float)$valStr;
            $ts = round(($days - 25569) * 86400);
            return date('Y-m-d H:i:s', $ts);
        }

        try {
            return Carbon::parse($valStr)->toDateTimeString();
        } catch (\Throwable $e) {
            return null;
        }
    }

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

    public function extractBaseName(string $name): string
    {
        $base = preg_replace('/\s*\([^)]*\)/', '', $name);
        $base = preg_replace('/\s*\[[^\]]*\]/', '', $base);
        return trim($base);
    }

    protected function generateClientCode(): string
    {
        $maxId = (int) (Client::max('id') ?? 0);
        return sprintf('CLT-%05d', $maxId + 1);
    }

    protected function resolveFilePath(string $fileToken): string
    {
        $pattern = "{$this->tempDir}/*{$fileToken}*";
        $matches = glob($pattern);
        if (!empty($matches) && file_exists($matches[0])) {
            return $matches[0];
        }

        $defaultCandidates = [
            base_path('../data/jrnl_vente.xlsx'),
            base_path('data/jrnl_vente.xlsx'),
            'c:/Users/pc -006/Desktop/StiCommande/data/jrnl_vente.xlsx',
        ];
        foreach ($defaultCandidates as $cand) {
            if (file_exists($cand)) {
                return $cand;
            }
        }

        throw new \RuntimeException("Fichier d'importation introuvable ou session expirée. Veuillez re-sélectionner le fichier.");
    }

    protected function detectCsvDelimiter(string $filePath): string
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) return ',';
        $line = fgets($handle);
        fclose($handle);
        if (!$line) return ',';

        $delimiters = [',', ';', "\t", '|'];
        $best = ',';
        $max = 0;
        foreach ($delimiters as $d) {
            $count = count(explode($d, $line));
            if ($count > $max) {
                $max = $count;
                $best = $d;
            }
        }
        return $best;
    }

    protected function indexToColumnLetter(int $index): string
    {
        $letter = '';
        while ($index >= 0) {
            $letter = chr($index % 26 + 65) . $letter;
            $index = intdiv($index, 26) - 1;
        }
        return $letter;
    }
}
