<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DelegateObjective;
use App\Models\SalesJournal;
use App\Models\SalesJournalImport;
use App\Models\User;
use App\Services\SalesJournalImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalesJournalController extends Controller
{
    protected SalesJournalImportService $importService;

    public function __construct(SalesJournalImportService $importService)
    {
        $this->importService = $importService;
    }

    /**
     * Display a listing of sales journal operations with KPIs and multi-criteria filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $baseQuery = SalesJournal::query()->forUser($user);

        // Apply filters
        $this->applyFilters($baseQuery, $request);

        // 1. Calculate KPIs on filtered base
        $kpiQuery = clone $baseQuery;
        $kpisData = $kpiQuery->selectRaw('
            COALESCE(SUM(total_ttc), 0) as total_ttc,
            COALESCE(SUM(net_ht), 0) as total_net_ht,
            COALESCE(SUM(paid_amount), 0) as total_paid,
            COALESCE(SUM(remaining_amount), 0) as total_remaining,
            COUNT(*) as total_operations,
            COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as matched_count,
            COUNT(CASE WHEN client_id IS NULL THEN 1 END) as unmatched_count
        ')->first();

        $totalTtc = floatval($kpisData->total_ttc ?? 0);
        $totalNetHt = floatval($kpisData->total_net_ht ?? 0);
        $totalPaid = floatval($kpisData->total_paid ?? 0);
        $totalRemaining = floatval($kpisData->total_remaining ?? 0);
        $totalOperations = intval($kpisData->total_operations ?? 0);
        $matchedCount = intval($kpisData->matched_count ?? 0);
        $unmatchedCount = intval($kpisData->unmatched_count ?? 0);
        $recoveryRate = $totalTtc > 0 ? round(($totalPaid / $totalTtc) * 100, 2) : 0;
        $matchRate = $totalOperations > 0 ? round(($matchedCount / $totalOperations) * 100, 1) : 0;

        // Plan / Objectives target comparison if delegate or month filter is present
        $targetRevenue = 0.0;
        if ($delegateId = $request->input('delegate_id')) {
            $currentYear = (int) now()->year;
            $currentMonth = (int) now()->month;
            $objQuery = DelegateObjective::where('user_id', $delegateId);
            if ($request->input('date_from')) {
                $df = Carbon::parse($request->input('date_from'));
                $objQuery->where('year', $df->year)->where('month', $df->month);
            } else {
                $objQuery->where('year', $currentYear)->where('month', $currentMonth);
            }
            $targetRevenue = floatval($objQuery->value('target_revenue') ?? 0);
        }

        $kpis = [
            'totalTtc' => $totalTtc,
            'totalNetHt' => $totalNetHt,
            'totalPaid' => $totalPaid,
            'totalRemaining' => $totalRemaining,
            'totalOperations' => $totalOperations,
            'matchedCount' => $matchedCount,
            'unmatchedCount' => $unmatchedCount,
            'recoveryRate' => $recoveryRate,
            'matchRate' => $matchRate,
            'targetRevenue' => $targetRevenue,
            'achievementRate' => $targetRevenue > 0 ? round(($totalTtc / $targetRevenue) * 100, 1) : null,
        ];

        // 2. Pagination & Sorting
        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(200, max(5, (int) $request->input('pageSize', 25)));
        $sortBy = $request->input('sortBy', 'operation_date');
        $sortDir = strtolower($request->input('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = [
            'operation_date', 'reference', 'tiers_name', 'total_ttc',
            'net_ht', 'paid_amount', 'remaining_amount', 'type', 'status',
            'wilaya', 'created_at',
        ];

        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'operation_date';
        }

        $records = $baseQuery
            ->with([
                'client:id,client_code,name,phone,wilaya,region,outstanding_balance',
                'delegate:id,name',
            ])
            ->orderBy($sortBy, $sortDir)
            ->orderBy('id', 'desc')
            ->paginate($pageSize, ['*'], 'page', $page);

        $lastImport = SalesJournalImport::latest()->first();

        return response()->json([
            'data' => $records->items(),
            'total' => $records->total(),
            'page' => $records->currentPage(),
            'pageSize' => $records->perPage(),
            'totalPages' => $records->lastPage(),
            'kpis' => $kpis,
            'lastImport' => $lastImport ? [
                'id' => $lastImport->id,
                'fileName' => $lastImport->file_name,
                'rowsCount' => $lastImport->rows_count,
                'matchedClientsCount' => $lastImport->matched_clients_count,
                'createdAt' => $lastImport->created_at ? $lastImport->created_at->toIso8601String() : null,
            ] : null,
        ]);
    }

    /**
     * Filter options for dropdown menus.
     */
    public function filterOptions(Request $request): JsonResponse
    {
        $types = SalesJournal::distinct()->whereNotNull('type')->where('type', '!=', '')->pluck('type');
        $paymentModes = SalesJournal::distinct()->whereNotNull('payment_mode')->where('payment_mode', '!=', '')->pluck('payment_mode');
        $depots = SalesJournal::distinct()->whereNotNull('depot_source')->where('depot_source', '!=', '')->pluck('depot_source');
        $statuses = SalesJournal::distinct()->whereNotNull('status')->where('status', '!=', '')->pluck('status');
        $wilayas = SalesJournal::distinct()->whereNotNull('wilaya')->where('wilaya', '!=', '')->pluck('wilaya');
        $regions = SalesJournal::distinct()->whereNotNull('region')->where('region', '!=', '')->pluck('region');

        $delegates = User::where('role', 'delegate')
            ->orderBy('name')
            ->get(['id', 'name', 'wilaya', 'region']);

        return response()->json([
            'types' => $types,
            'paymentModes' => $paymentModes,
            'depots' => $depots,
            'statuses' => $statuses,
            'wilayas' => $wilayas,
            'regions' => $regions,
            'delegates' => $delegates,
        ]);
    }

    /**
     * Preview file before importing.
     */
    public function importPreview(Request $request): JsonResponse
    {
        try {
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $result = $this->importService->preview($file);
            } elseif ($filePath = $request->input('file_path')) {
                $result = $this->importService->preview($filePath);
            } else {
                // Check if server file data/jrnl_vente.xlsx exists
                $defaultPath = base_path('../data/jrnl_vente.xlsx');
                if (file_exists($defaultPath)) {
                    $result = $this->importService->preview($defaultPath, 'jrnl_vente.xlsx');
                } else {
                    return response()->json(['message' => 'Veuillez téléverser un fichier.'], 422);
                }
            }

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Verify matching against system data.
     */
    public function importVerify(Request $request): JsonResponse
    {
        $request->validate([
            'file_token' => 'required|string',
            'mapping' => 'required|array',
            'unmatched_action' => 'nullable|string|in:link_only,create_missing',
        ]);

        try {
            $result = $this->importService->verify(
                $request->input('file_token'),
                $request->input('mapping'),
                $request->input('unmatched_action', 'link_only')
            );

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Execute final import.
     */
    public function importExecute(Request $request): JsonResponse
    {
        $request->validate([
            'file_token' => 'required|string',
            'mapping' => 'required|array',
            'unmatched_action' => 'nullable|string|in:link_only,create_missing',
            'duplicate_action' => 'nullable|string|in:skip,update',
        ]);

        try {
            $user = $request->user();
            $result = $this->importService->execute(
                $request->input('file_token'),
                $request->input('mapping'),
                $request->input('unmatched_action', 'link_only'),
                $user ? $user->id : null,
                $request->input('duplicate_action', 'skip')
            );

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Export filtered sales journal to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $query = SalesJournal::query()->forUser($user);
        $this->applyFilters($query, $request);

        $filename = 'journal_de_vente_' . date('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, [
                'Référence',
                'Date',
                'Type',
                'Statut',
                'Tiers (ERP)',
                'Code Client (STI)',
                'Client (STI)',
                'Délégué (STI)',
                'Wilaya',
                'Région',
                'Montant HT',
                'Remise %',
                'Net HT',
                'TVA',
                'Timbre',
                'Net à Payer (TTC)',
                'Paiement',
                'Reste à Payer',
                'Mode Règlement',
                'Dépôt',
                'Créé par (ERP)',
            ], ';');

            $query->with(['client', 'delegate'])->chunk(500, function ($records) use ($handle) {
                foreach ($records as $r) {
                    fputcsv($handle, [
                        $r->reference,
                        $r->operation_date ? $r->operation_date->format('Y-m-d H:i') : '',
                        $r->type,
                        $r->status,
                        $r->tiers_name,
                        $r->client ? $r->client->client_code : ($r->client_code ?: ''),
                        $r->client ? $r->client->name : '',
                        $r->delegate ? $r->delegate->name : '',
                        $r->wilaya ?: ($r->client ? $r->client->wilaya : ''),
                        $r->region ?: ($r->client ? $r->client->region : ''),
                        $r->amount_ht,
                        $r->discount_pct,
                        $r->net_ht,
                        $r->tva,
                        $r->timbre,
                        $r->total_ttc,
                        $r->paid_amount,
                        $r->remaining_amount,
                        $r->payment_mode,
                        $r->depot_source,
                        $r->created_by_erp,
                    ], ';');
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    protected function applyFilters($query, Request $request): void
    {
        // Search
        if ($search = $request->input('search')) {
            $q = mb_strtolower(trim($search));
            $query->where(function ($subQuery) use ($q) {
                $subQuery->whereRaw('LOWER(tiers_name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(reference) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(client_code) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(depot_source) LIKE ?', ["%{$q}%"]);
            });
        }

        // Delegate filter (System data)
        if ($delegateId = $request->input('delegate_id')) {
            if ($delegateId !== 'all' && $delegateId !== 'Tous') {
                $query->where('delegate_id', $delegateId);
            }
        }

        // Client filter (System data)
        if ($clientId = $request->input('client_id')) {
            if ($clientId !== 'all' && $clientId !== 'Tous') {
                $query->where('client_id', $clientId);
            }
        }

        // Wilaya filter
        if ($wilaya = $request->input('wilaya')) {
            if ($wilaya !== 'all' && $wilaya !== 'Tous') {
                $query->whereRaw('LOWER(TRIM(wilaya)) = ?', [strtolower(trim($wilaya))]);
            }
        }

        // Region filter
        if ($region = $request->input('region')) {
            if ($region !== 'all' && $region !== 'Tous') {
                $query->whereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
            }
        }

        // Payment Mode
        if ($mode = $request->input('payment_mode')) {
            if ($mode !== 'all' && $mode !== 'Tous') {
                $query->where('payment_mode', $mode);
            }
        }

        // Type
        if ($type = $request->input('type')) {
            if ($type !== 'all' && $type !== 'Tous') {
                $query->where('type', $type);
            }
        }

        // Depot
        if ($depot = $request->input('depot')) {
            if ($depot !== 'all' && $depot !== 'Tous') {
                $query->where('depot_source', $depot);
            }
        }

        // Status
        if ($status = $request->input('status')) {
            if ($status !== 'all' && $status !== 'Tous') {
                $query->where('status', $status);
            }
        }

        // Matched filter
        if ($request->has('matched')) {
            $matched = $request->input('matched');
            if ($matched === 'true' || $matched === '1') {
                $query->whereNotNull('client_id');
            } elseif ($matched === 'false' || $matched === '0') {
                $query->whereNull('client_id');
            }
        }

        // Remaining only
        if ($request->boolean('only_remaining')) {
            $query->where('remaining_amount', '>', 0);
        }

        // Date range
        if ($dateFrom = $request->input('date_from')) {
            $query->where('operation_date', '>=', Carbon::parse($dateFrom)->startOfDay());
        }
        if ($dateTo = $request->input('date_to')) {
            $query->where('operation_date', '<=', Carbon::parse($dateTo)->endOfDay());
        }
    }
}
