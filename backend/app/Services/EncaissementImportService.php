<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Encaissement;
use App\Models\EncaissementImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use XMLReader;
use ZipArchive;

class EncaissementImportService
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
     * Preview an uploaded file or server file for Encaissements import.
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
            $storedFileName = "encaissement_{$fileToken}.{$ext}";
            $storedPath = "{$this->tempDir}/{$storedFileName}";
            $fileOrPath->move($this->tempDir, $storedFileName);
            $fileName = $originalName ?: $fileOrPath->getClientOriginalName();
        } else {
            // Path provided (e.g. server file data/encaissement.xlsx)
            $sourcePath = $fileOrPath;
            if (!file_exists($sourcePath)) {
                throw new \InvalidArgumentException("Le fichier spécifié est introuvable: {$sourcePath}");
            }
            $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
            if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
                $ext = 'xlsx';
            }
            $storedFileName = "encaissement_{$fileToken}.{$ext}";
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
     * Verify clients existence and compute detailed match statistics.
     */
    public function verify(string $fileToken, array $mapping, string $unmatchedAction = 'link_only'): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $filePath = $this->resolveFilePath($fileToken);
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        $tiersCol = $mapping['tiers_name'] ?? null;
        $creditCol = $mapping['credit'] ?? null;
        $debitCol = $mapping['debit'] ?? null;
        $dateCol = $mapping['payment_date'] ?? null;
        $typeCol = $mapping['type'] ?? null;

        if (!$tiersCol) {
            throw new \InvalidArgumentException("La colonne 'Tiers / Client' est obligatoire pour la vérification.");
        }

        // 1. Preload clients from DB
        $allClients = Client::all(['id', 'client_code', 'name', 'phone', 'wilaya', 'region']);
        $clientsByCode = [];
        $clientsByName = [];
        $clientsByBaseName = [];

        foreach ($allClients as $client) {
            if (!empty($client->client_code)) {
                $clientsByCode[strtoupper(trim($client->client_code))] = $client;
            }
            $norm = $this->normalizeName($client->name);
            if (!empty($norm)) {
                $clientsByName[$norm] = $client;
                $base = $this->normalizeName($this->extractBaseName($client->name));
                if (!empty($base)) {
                    $clientsByBaseName[$base] = $client;
                }
            }
        }

        // 2. Stream file and aggregate by Tiers
        $tiersAggregates = [];
        $totalRows = 0;
        $totalCredit = 0.0;
        $totalDebit = 0.0;

        $rowsGenerator = $this->streamRows($filePath, $ext);

        foreach ($rowsGenerator as $row) {
            $totalRows++;
            $rawTiers = trim($row[$tiersCol] ?? '');
            if ($rawTiers === '') {
                $rawTiers = 'Sans Tiers / Caisse';
            }

            $credit = 0.0;
            if ($creditCol && isset($row[$creditCol])) {
                $credit = (float) str_replace([' ', ','], ['', '.'], $row[$creditCol]);
            }
            $debit = 0.0;
            if ($debitCol && isset($row[$debitCol])) {
                $debit = (float) str_replace([' ', ','], ['', '.'], $row[$debitCol]);
            }

            $totalCredit += $credit;
            $totalDebit += $debit;

            if (!isset($tiersAggregates[$rawTiers])) {
                $tiersAggregates[$rawTiers] = [
                    'raw_tiers' => $rawTiers,
                    'count' => 0,
                    'total_credit' => 0.0,
                    'total_debit' => 0.0,
                    'last_date' => null,
                ];
            }

            $tiersAggregates[$rawTiers]['count']++;
            $tiersAggregates[$rawTiers]['total_credit'] += $credit;
            $tiersAggregates[$rawTiers]['total_debit'] += $debit;

            if ($dateCol && !empty($row[$dateCol])) {
                $tiersAggregates[$rawTiers]['last_date'] = $row[$dateCol];
            }
        }

        // 3. Match against DB clients
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
                'total_credit' => round($data['total_credit'], 2),
                'total_debit' => round($data['total_debit'], 2),
                'matched_client' => $matchedClient ? [
                    'id' => $matchedClient->id,
                    'name' => $matchedClient->name,
                    'client_code' => $matchedClient->client_code,
                    'wilaya' => $matchedClient->wilaya,
                    'region' => $matchedClient->region,
                ] : null,
            ];
        }

        // Sort samples: unmatched first, then by count desc
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
            'total_credit' => round($totalCredit, 2),
            'total_debit' => round($totalDebit, 2),
            'unmatched_action' => $unmatchedAction,
            'samples' => array_slice($samples, 0, 100),
        ];
    }

    /**
     * Execute final import and persistence in transactions.
     */
    public function execute(string $fileToken, array $mapping, string $unmatchedAction = 'link_only', ?int $userId = null): array
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $startTime = microtime(true);
        $filePath = $this->resolveFilePath($fileToken);
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        $tiersCol = $mapping['tiers_name'] ?? null;
        $creditCol = $mapping['credit'] ?? null;
        $debitCol = $mapping['debit'] ?? null;
        $dateCol = $mapping['payment_date'] ?? null;
        $orderCol = $mapping['order_number'] ?? null;
        $typeCol = $mapping['type'] ?? null;
        $modeCol = $mapping['payment_mode'] ?? null;
        $accountCol = $mapping['account'] ?? null;
        $refCol = $mapping['reference'] ?? null;
        $labelCol = $mapping['label'] ?? null;

        if (!$tiersCol) {
            throw new \InvalidArgumentException("La colonne 'Tiers / Client' est obligatoire pour l'importation.");
        }

        // 1. Preload existing clients
        $allClients = Client::all();
        $clientsByCode = [];
        $clientsByName = [];
        $clientsByBaseName = [];

        foreach ($allClients as $client) {
            if (!empty($client->client_code)) {
                $clientsByCode[strtoupper(trim($client->client_code))] = $client;
            }
            $norm = $this->normalizeName($client->name);
            if (!empty($norm)) {
                $clientsByName[$norm] = $client;
                $base = $this->normalizeName($this->extractBaseName($client->name));
                if (!empty($base)) {
                    $clientsByBaseName[$base] = $client;
                }
            }
        }

        $clientsMatchedCount = 0;
        $clientsCreatedCount = 0;
        $rowsProcessed = 0;
        $rowsImported = 0;
        $rowsSkipped = 0;
        $totalCredited = 0.0;
        $totalDebited = 0.0;

        $createdClientsMap = [];
        $clientLastPayments = []; // clientId => latest Carbon date

        $rowsGenerator = $this->streamRows($filePath, $ext);
        $batch = [];
        $batchSize = 500;

        DB::beginTransaction();
        try {
            foreach ($rowsGenerator as $row) {
                $rowsProcessed++;
                $rawTiers = trim($row[$tiersCol] ?? '');

                // Amounts
                $credit = 0.0;
                if ($creditCol && isset($row[$creditCol])) {
                    $credit = (float) str_replace([' ', ','], ['', '.'], $row[$creditCol]);
                }
                $debit = 0.0;
                if ($debitCol && isset($row[$debitCol])) {
                    $debit = (float) str_replace([' ', ','], ['', '.'], $row[$debitCol]);
                }

                // Date
                $paymentDate = null;
                if ($dateCol && !empty($row[$dateCol])) {
                    $paymentDate = $this->parseDateValue($row[$dateCol]);
                }

                // Type
                $type = 'Encaissement';
                if ($typeCol && !empty($row[$typeCol])) {
                    $type = trim($row[$typeCol]);
                } elseif ($debit > 0 && $credit == 0) {
                    $type = 'Décaissement';
                }

                // Client matching
                $client = null;
                if (!empty($rawTiers)) {
                    $client = $this->findMatchingClient($rawTiers, $clientsByCode, $clientsByName, $clientsByBaseName);

                    if (!$client && isset($createdClientsMap[$rawTiers])) {
                        $client = $createdClientsMap[$rawTiers];
                    }

                    if (!$client && $unmatchedAction === 'create') {
                        // Create missing client
                        $client = new Client();
                        $client->name = $rawTiers;
                        $client->client_code = $this->generateClientCode();
                        $client->phone = '';
                        $client->wilaya = 'Alger';
                        $client->region = 'Center';
                        $client->address = 'Non renseignée';
                        $client->client_type = 'retail';
                        $client->status = 'active';
                        $client->credit_limit = 0;
                        $client->outstanding_balance = 0;
                        $client->total_orders = 0;
                        $client->total_spent = 0;
                        $client->save();

                        $createdClientsMap[$rawTiers] = $client;
                        $clientsCreatedCount++;

                        $norm = $this->normalizeName($client->name);
                        $clientsByName[$norm] = $client;
                    }
                }

                // Skip if client is missing and unmatchedAction is skip
                if (!$client && $unmatchedAction === 'skip') {
                    $rowsSkipped++;
                    continue;
                }

                $clientId = $client?->id;
                if ($clientId) {
                    $clientsMatchedCount++;
                    if ($paymentDate) {
                        $dt = Carbon::parse($paymentDate);
                        if (!isset($clientLastPayments[$clientId]) || $dt->greaterThan($clientLastPayments[$clientId])) {
                            $clientLastPayments[$clientId] = $dt;
                        }
                    }
                }

                $orderNumber = $orderCol ? trim($row[$orderCol] ?? '') : null;
                $paymentMode = $modeCol ? trim($row[$modeCol] ?? '') : null;
                $account = $accountCol ? trim($row[$accountCol] ?? '') : null;
                $reference = $refCol ? trim($row[$refCol] ?? '') : null;
                $label = $labelCol ? trim($row[$labelCol] ?? '') : null;

                $totalCredited += $credit;
                $totalDebited += $debit;

                $batch[] = [
                    'client_id' => $clientId,
                    'tiers_name' => $rawTiers ?: 'Non spécifié',
                    'order_number' => $orderNumber,
                    'type' => $type,
                    'payment_date' => $paymentDate,
                    'amount' => $credit > 0 ? $credit : $debit,
                    'debit' => $debit,
                    'credit' => $credit,
                    'payment_mode' => $paymentMode,
                    'reference' => $reference,
                    'status' => 'Payé',
                    'account' => $account,
                    'label' => $label,
                    'locked' => false,
                    'is_last' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $rowsImported++;

                if (count($batch) >= $batchSize) {
                    Encaissement::insert($batch);
                    $batch = [];
                }
            }

            if (!empty($batch)) {
                Encaissement::insert($batch);
                $batch = [];
            }

            // Update is_last on encaissements and synchronize clients last_payment_* fields
            DB::table('encaissements')->where('is_last', true)->update(['is_last' => false]);

            if (DB::getDriverName() === 'pgsql') {
                DB::statement("
                    UPDATE encaissements
                    SET is_last = true
                    WHERE id IN (
                        SELECT DISTINCT ON (client_id) id
                        FROM encaissements
                        WHERE client_id IS NOT NULL
                        ORDER BY client_id, payment_date DESC NULLS LAST, id DESC
                    )
                ");

                DB::statement("
                    UPDATE clients c
                    SET
                        last_payment_date = e.payment_date,
                        last_payment_amount = COALESCE(e.amount, e.credit, 0),
                        last_payment_mode = e.payment_mode,
                        last_payment_reference = e.reference,
                        last_payment_status = COALESCE(e.status, 'Payé'),
                        last_payment_order_number = e.order_number,
                        last_payment_account = e.account
                    FROM encaissements e
                    WHERE e.client_id = c.id
                      AND e.is_last = true
                ");
            } else {
                $clientIds = Encaissement::whereNotNull('client_id')->distinct()->pluck('client_id');
                foreach ($clientIds as $cId) {
                    $latest = Encaissement::where('client_id', $cId)
                        ->orderByDesc('payment_date')
                        ->orderByDesc('id')
                        ->first();
                    if ($latest) {
                        $latest->is_last = true;
                        $latest->save();

                        Client::where('id', $cId)->update([
                            'last_payment_date' => $latest->payment_date,
                            'last_payment_amount' => $latest->amount ?: $latest->credit,
                            'last_payment_mode' => $latest->payment_mode,
                            'last_payment_reference' => $latest->reference,
                            'last_payment_status' => $latest->status ?: 'Payé',
                            'last_payment_order_number' => $latest->order_number,
                            'last_payment_account' => $latest->account,
                        ]);
                    }
                }
            }

            // Record import history
            EncaissementImport::create([
                'file_name' => basename($filePath),
                'rows_count' => $rowsImported,
                'tiers_count' => count($createdClientsMap) + $clientsMatchedCount,
                'clients_updated' => $clientsMatchedCount,
                'clients_created' => $clientsCreatedCount,
                'imported_by' => $userId,
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("EncaissementImportService execute error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }

        // Cleanup temporary import file if it was created in tempDir
        if (str_starts_with($filePath, $this->tempDir)) {
            @unlink($filePath);
        }

        $duration = round(microtime(true) - $startTime, 2);

        return [
            'total_rows_processed' => $rowsProcessed,
            'encaissements_imported' => $rowsImported,
            'rows_skipped' => $rowsSkipped,
            'clients_matched' => $clientsMatchedCount,
            'clients_created' => $clientsCreatedCount,
            'total_amount_credited' => round($totalCredited, 2),
            'total_amount_debited' => round($totalDebited, 2),
            'duration_seconds' => $duration,
        ];
    }

    /**
     * Find a client from DB by name, code or base name.
     */
    protected function findMatchingClient(string $rawTiers, array $byCode, array $byName, array $byBaseName): ?Client
    {
        $codeMatch = strtoupper(trim($rawTiers));
        if (isset($byCode[$codeMatch])) {
            return $byCode[$codeMatch];
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
     * Generator streaming rows from XLSX, XLS or CSV.
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
                    continue; // Skip header
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

        // XLSX / XMLReader stream
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
                    continue; // Skip header
                }
                $rowXml = $xmlSheet->readOuterXml();
                $cells = $this->extractCellsFromRowXml($rowXml, $sharedStrings);
                yield $cells;
            }
        }

        $xmlSheet->close();
        $zip->close();
    }

    /**
     * Parse headers and preview rows from XLSX or CSV.
     */
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
        $rowIndex = 0;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($rowIndex === 0) {
                if (isset($row[0])) {
                    $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', $row[0]);
                }
                $headers = $row;
                $rowIndex++;
                continue;
            }

            $hasContent = false;
            foreach ($row as $val) {
                if (trim((string) $val) !== '') {
                    $hasContent = true;
                    break;
                }
            }
            if (!$hasContent) continue;

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

        // Build columns
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

    /**
     * Auto-detect columns based on typical encaissement headers.
     */
    protected function generateSuggestedMapping(array $columns): array
    {
        $mapping = [];
        $patterns = [
            'tiers_name' => '/\b(tiers|client|nom|nom client|raison|client\/tiers)\b/i',
            'payment_date' => '/\b(date|date effet|date paiement|date op|date_paiement)\b/i',
            'credit' => '/\b(credit|crédit|montant|encaissement|versement|entree)\b/i',
            'debit' => '/\b(debit|débit|decaissement|décaissement|sortie)\b/i',
            'order_number' => '/\b(ordre|n° ordre|n°ordre|num ordre|piece|n° piece)\b/i',
            'payment_mode' => '/\b(mode|mode associe|mode associé|reglement|règlement|moyen)\b/i',
            'account' => '/\b(compte|caisse|banque|account)\b/i',
            'reference' => '/\b(reference|référence|ref|chèque|cheque|virement)\b/i',
            'label' => '/\b(libelle|libellé|designation|description|motif)\b/i',
            'type' => '/\b(type|nature|sens)\b/i',
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

    /**
     * Parse an Excel serial date or standard date string.
     */
    public function parseDateValue($val): ?string
    {
        if (empty($val)) return null;
        $valStr = trim((string)$val);
        if (is_numeric($valStr) && (float)$valStr > 20000 && (float)$valStr < 80000) {
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

        // Check fallback to data/encaissement.xlsx if matching token
        $defaultCandidates = [
            base_path('../data/encaissement.xlsx'),
            base_path('data/encaissement.xlsx'),
            'c:/Users/pc -006/Desktop/StiCommande/data/encaissement.xlsx',
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
            $cnt = substr_count($line, $d);
            if ($cnt > $max) {
                $max = $cnt;
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
            $index = intval($index / 26) - 1;
        }
        return $letter;
    }
}
