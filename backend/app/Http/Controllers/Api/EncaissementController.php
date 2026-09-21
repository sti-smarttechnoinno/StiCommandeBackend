<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Encaissement;
use App\Models\EncaissementImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class EncaissementController extends Controller
{
    /**
     * Display a listing of encaissements and journal operations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Encaissement::with(['client:id,client_code,name,phone,wilaya,region']);

        // 1. Search across multiple fields
        if ($search = $request->input('search')) {
            $q = mb_strtolower(trim($search));
            $query->where(function ($subQuery) use ($q) {
                $subQuery->whereRaw('LOWER(tiers_name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(reference) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(order_number) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(label) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(account) LIKE ?', ["%{$q}%"]);
            });
        }

        // 2. Filter by Type (Encaissement vs Décaissement)
        if ($type = $request->input('type')) {
            if ($type !== 'all' && $type !== 'Tous') {
                $query->where('type', $type);
            }
        }

        // 3. Filter by Account (Compte)
        if ($account = $request->input('account')) {
            if ($account !== 'all' && $account !== 'Tous') {
                $query->where('account', $account);
            }
        }

        // 4. Filter by Payment Mode
        if ($paymentMode = $request->input('payment_mode', $request->input('paymentMode'))) {
            if ($paymentMode !== 'all' && $paymentMode !== 'Tous') {
                $query->where('payment_mode', $paymentMode);
            }
        }

        // 5. Filter by Client ID
        if ($clientId = $request->input('client_id', $request->input('clientId'))) {
            $query->where('client_id', $clientId);
        }

        // 6. Filter by Date Range
        if ($dateFrom = $request->input('date_from', $request->input('dateFrom'))) {
            $query->whereDate('payment_date', '>=', Carbon::parse($dateFrom)->startOfDay());
        }
        if ($dateTo = $request->input('date_to', $request->input('dateTo'))) {
            $query->whereDate('payment_date', '<=', Carbon::parse($dateTo)->endOfDay());
        }

        // 7. Filter by Last Encaissement (is_last)
        if ($request->boolean('is_last') || $request->boolean('only_last') || $request->input('filter') === 'last') {
            $query->where('is_last', true);
        }

        // 7. Calculate Filtered KPIs
        $kpiQuery = clone $query;
        $kpisData = $kpiQuery->selectRaw('
            COUNT(*) as total_count,
            COALESCE(SUM(credit), 0) as total_credit,
            COALESCE(SUM(debit), 0) as total_debit,
            COUNT(CASE WHEN type = \'Encaissement\' THEN 1 END) as encaissements_count,
            COUNT(CASE WHEN type = \'Décaissement\' THEN 1 END) as decaissements_count
        ')->first();

        $totalCredit = (float) ($kpisData->total_credit ?? 0);
        $totalDebit = (float) ($kpisData->total_debit ?? 0);
        $totalCount = (int) ($kpisData->total_count ?? 0);
        $encaissementsCount = (int) ($kpisData->encaissements_count ?? 0);
        $decaissementsCount = (int) ($kpisData->decaissements_count ?? 0);
        $netBalance = $totalCredit - $totalDebit;

        // 8. Sorting
        $sortBy = $request->input('sort_by', $request->input('sortBy', 'payment_date'));
        $sortDir = strtolower($request->input('sort_dir', $request->input('sortDir', 'desc'))) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['payment_date', 'amount', 'credit', 'debit', 'order_number', 'tiers_name', 'account', 'type', 'is_last'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'payment_date';
        }

        $query->orderByRaw("{$sortBy} {$sortDir} NULLS LAST")->orderBy('id', 'desc');

        // 9. Pagination
        $pageSize = (int) $request->input('pageSize', $request->input('per_page', 25));
        $pageSize = max(10, min($pageSize, 200));
        $page = (int) $request->input('page', 1);

        $paginator = $query->paginate($pageSize, ['*'], 'page', $page);

        // 10. Last Import info
        $lastImport = EncaissementImport::latest()->first();

        return response()->json([
            'data' => $paginator->items(),
            'total' => $paginator->total(),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'totalPages' => $paginator->lastPage(),
            'kpis' => [
                'totalCredit' => round($totalCredit, 2),
                'totalDebit' => round($totalDebit, 2),
                'netBalance' => round($netBalance, 2),
                'totalOperations' => $totalCount,
                'encaissementsCount' => $encaissementsCount,
                'decaissementsCount' => $decaissementsCount,
            ],
            'lastImportAt' => $lastImport ? $lastImport->created_at->toISOString() : null,
            'lastImportFile' => $lastImport ? $lastImport->file_name : null,
        ]);
    }

    /**
     * Return distinct filter options (accounts, modes, types).
     */
    public function filterOptions(): JsonResponse
    {
        $accounts = Encaissement::whereNotNull('account')
            ->where('account', '!=', '')
            ->distinct()
            ->pluck('account')
            ->sort()
            ->values();

        $modes = Encaissement::whereNotNull('payment_mode')
            ->where('payment_mode', '!=', '')
            ->distinct()
            ->pluck('payment_mode')
            ->sort()
            ->values();

        return response()->json([
            'accounts' => $accounts,
            'paymentModes' => $modes,
            'types' => ['Encaissement', 'Décaissement'],
        ]);
    }

    /**
     * Preview encaissements file and return suggested column mapping.
     */
    public function importPreview(Request $request, \App\Services\EncaissementImportService $importService): JsonResponse
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && !$user->hasPermission('clients.edit') && !$user->hasPermission('clients.create') && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => "Accès non autorisé : vous ne disposez pas des droits requis pour importer des encaissements."
            ], 403);
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $data = $importService->preview($file);
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        }

        if ($request->boolean('use_data_folder') || $request->input('from_data')) {
            $candidates = [
                base_path('../data/encaissement.xlsx'),
                base_path('data/encaissement.xlsx'),
                'c:/Users/pc -006/Desktop/StiCommande/data/encaissement.xlsx',
            ];
            $foundPath = null;
            foreach ($candidates as $cand) {
                if (file_exists($cand)) {
                    $foundPath = $cand;
                    break;
                }
            }
            if (!$foundPath) {
                return response()->json([
                    'message' => "Le fichier data/encaissement.xlsx est introuvable sur le serveur."
                ], 404);
            }
            $data = $importService->preview($foundPath, basename($foundPath));
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        }

        return response()->json([
            'message' => "Veuillez fournir un fichier Excel (.xlsx, .xls) ou sélectionner le fichier serveur.",
            'errors' => [
                'file' => ["Le fichier d'encaissement est obligatoire."]
            ]
        ], 422);
    }

    /**
     * Verify client matches and existence before committing import.
     */
    public function importVerify(Request $request, \App\Services\EncaissementImportService $importService): JsonResponse
    {
        $request->validate([
            'file_token' => 'required|string',
            'mapping' => 'required|array',
            'unmatched_action' => 'nullable|string|in:link_only,create,skip',
        ]);

        try {
            $data = $importService->verify(
                $request->input('file_token'),
                $request->input('mapping'),
                $request->input('unmatched_action', 'link_only')
            );

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Execute final import of encaissements and link to clients.
     */
    public function importExecute(Request $request, \App\Services\EncaissementImportService $importService): JsonResponse
    {
        $request->validate([
            'file_token' => 'required|string',
            'mapping' => 'required|array',
            'unmatched_action' => 'nullable|string|in:link_only,create,skip',
        ]);

        $user = auth('sanctum')->user() ?: $request->user();

        try {
            $data = $importService->execute(
                $request->input('file_token'),
                $request->input('mapping'),
                $request->input('unmatched_action', 'link_only'),
                $user?->id
            );

            $formattedCredit = number_format($data['total_amount_credited'], 2, ',', ' ') . ' DA';
            return response()->json([
                'success' => true,
                'message' => "Importation terminée avec succès. {$data['encaissements_imported']} encaissements enregistrés ({$data['clients_matched']} clients liés, {$data['clients_created']} créés). Total : {$formattedCredit}.",
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'importation : " . $e->getMessage(),
            ], 500);
        }
    }
}

