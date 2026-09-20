<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use App\Models\Order;
use App\Models\Region;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::with('delegate');

        // Server-Side Authorization Principle:
        // Automatically scope clients query based on territory of authenticated user
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query->forUser($authUser);

        if ($search = $request->input('search')) {
            $q = strtolower($search);
            $query->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(client_code) LIKE ?', ["%{$q}%"])
                    ->orWhere('phone', 'LIKE', "%{$q}%")
                    ->orWhereRaw('LOWER(address) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(region) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(wilaya) LIKE ?', ["%{$q}%"]);
            });
        }

        if ($statuses = $request->input('status')) {
            $statuses = is_array($statuses) ? $statuses : explode(',', (string) $statuses);
            $query->whereIn('status', $statuses);
        }

        if ($regions = $request->input('region')) {
            $regions = is_array($regions) ? $regions : explode(',', (string) $regions);
            $query->where(function ($q) use ($regions) {
                foreach ($regions as $r) {
                    $cleaned = strtolower(trim($r));
                    if (!empty($cleaned)) {
                        $q->orWhereRaw('LOWER(TRIM(region)) = ?', [$cleaned]);
                    }
                }
            });
        }

        if ($delegates = $request->input('delegate')) {
            $delegates = is_array($delegates) ? $delegates : explode(',', (string) $delegates);
            $query->where(function ($q) use ($delegates) {
                $q->whereHas('delegate', function ($sub) use ($delegates) {
                    $sub->whereIn('name', $delegates);
                })->orWhereIn('delegate_name', $delegates);
            });
        }

        if ($types = $request->input('clientType')) {
            $types = is_array($types) ? $types : explode(',', (string) $types);
            $query->whereIn('client_type', $types);
        }

        if ($startDate = $request->input('dateStart')) {
            $query->where('created_at', '>=', Carbon::parse($startDate)->startOfDay());
        }

        if ($endDate = $request->input('dateEnd')) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        $sortFieldRaw = $request->input('sortField', 'created_at');
        $sortFieldMap = [
            'clientCode' => 'client_code',
            'totalOrders' => 'total_orders',
            'totalSpent' => 'total_spent',
            'outstandingBalance' => 'outstanding_balance',
            'solde' => 'outstanding_balance',
            'createdAt' => 'created_at',
            'delegateName' => 'region',
        ];
        $sortField = $sortFieldMap[$sortFieldRaw] ?? $sortFieldRaw;
        $sortDirection = $request->input('sortDirection', 'desc');
        $allowedSorts = ['name', 'client_code', 'phone', 'region', 'total_orders', 'total_spent', 'outstanding_balance', 'status', 'created_at'];
        if (! in_array($sortField, $allowedSorts)) {
            $sortField = 'created_at';
        }
        $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(200, (int) $request->input('pageSize', 10)));
        $total = (clone $query)->count();
        $clients = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        $clientIds = $clients->pluck('id');
        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        $objectives = \App\Models\ClientObjective::whereIn('client_id', $clientIds)
            ->where('year', $currentYear)
            ->where('month', $currentMonth)
            ->get()
            ->keyBy('client_id');

        $monthOrders = \App\Models\Order::whereIn('client_id', $clientIds)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('status', '!=', 'cancelled')
            ->with(['items.product'])
            ->get()
            ->groupBy('client_id');

        $lastImportAt = \App\Models\EncaissementImport::latest()->value('created_at');

        return response()->json([
            'data' => $clients->map(fn ($client) => $this->formatClient(
                $client,
                $objectives->get($client->id),
                $monthOrders->get($client->id) ?? collect()
            )),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
            'lastImportAt' => $lastImportAt ? Carbon::parse($lastImportAt)->toISOString() : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && !$user->hasPermission('clients.create')) {
            return response()->json([
                'message' => "Acc├¿s non autoris├® : votre r├┤le [{$user->role}] ne dispose pas du droit de cr├®er des clients."
            ], 403);
        }

        if ($user && $user->isRestrictedByRegion() && !empty($user->region)) {
            $request->merge([
                'region' => $user->region,
                'delegate_id' => $user->id,
            ]);
        }

        if (! $request->has('client_type') && $request->has('clientType')) {
            $request->merge(['client_type' => $request->input('clientType')]);
        }
        if (! $request->has('credit_limit') && $request->has('creditLimit')) {
            $request->merge(['credit_limit' => $request->input('creditLimit')]);
        }

        $dId = $request->input('delegate_id', $request->input('delegateId'));
        $dName = $request->input('delegate_name', $request->input('delegateName'));

        if ($dId && is_numeric($dId) && User::where('id', $dId)->where('name', '!=', 'Unassigned')->exists()) {
            $request->merge(['delegate_id' => (int) $dId]);
        } elseif ($dName && !in_array(strtolower(trim($dName)), ['unassigned', 'non assign├®', 'none', 'null', ''])) {
            $user = User::where('name', $dName)->where('name', '!=', 'Unassigned')->first();
            $request->merge(['delegate_id' => $user?->id]);
        } else {
            $request->merge(['delegate_id' => null]);
        }

        // Auto-resolve delegate from region or wilaya if delegate_id is null
        if (empty($request->input('delegate_id'))) {
            $targetRegion = $request->input('region');
            if (empty($targetRegion) && $request->filled('wilaya')) {
                $wClean = strtolower(trim(preg_replace('/^\d+\s*-\s*/', '', (string) $request->input('wilaya'))));
                $wCode = preg_match('/^(\d+)/', (string) $request->input('wilaya'), $m) ? $m[1] : null;
                $wilayaModel = \App\Models\Wilaya::where(function ($q) use ($wClean, $wCode) {
                    $q->whereRaw('LOWER(name) = ?', [$wClean]);
                    if ($wCode) {
                        $q->orWhere('code', $wCode)->orWhere('code', str_pad($wCode, 2, '0', STR_PAD_LEFT));
                    }
                })->first();
                if ($wilayaModel) {
                    $targetRegion = $wilayaModel->region_name ?? $wilayaModel->region?->name;
                    if ($targetRegion && !$request->filled('region')) {
                        $request->merge(['region' => $targetRegion]);
                    }
                }
            }

            if (!empty($targetRegion)) {
                $regClean = strtolower(trim($targetRegion));
                $autoDelegate = User::whereRaw('LOWER(TRIM(region)) = ?', [$regClean])
                    ->where('role', 'delegate')
                    ->where('name', '!=', 'Unassigned')
                    ->first()
                    ?? User::whereRaw('LOWER(TRIM(region)) = ?', [$regClean])
                    ->whereIn('role', ['delegate', 'commercial'])
                    ->where('name', '!=', 'Unassigned')
                    ->first();

                if ($autoDelegate) {
                    $request->merge(['delegate_id' => $autoDelegate->id]);
                }
            }
        }

        if (! $request->has('outstanding_balance') && $request->has('outstandingBalance')) {
            $request->merge(['outstanding_balance' => $request->input('outstandingBalance')]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'region' => 'required|string|max:255',
            'wilaya' => 'required|string|max:255',
            'delegate_id' => 'nullable|exists:users,id',
            'client_type' => 'required|in:retail,wholesale,corporate,government',
            'credit_limit' => 'nullable|numeric|min:0',
            'outstanding_balance' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['address'] = (string) ($request->input('address') ?? '');
        $validated['client_code'] = $request->input('client_code', $this->generateClientCode());
        $validated['status'] = $request->input('status', 'active');
        $validated['outstanding_balance'] = (float) ($request->input('outstanding_balance', 0));

        $client = Client::create($validated);

        // If an initial monthly objective was specified during creation, save it to client_objectives
        $targetRev = (float) ($request->input('target_revenue')
            ?? $request->input('targetRevenue')
            ?? $request->input('monthly_objective')
            ?? $request->input('monthlyObjective')
            ?? 0);

        if ($targetRev > 0) {
            \App\Models\ClientObjective::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'year' => (int) now()->year,
                    'month' => (int) now()->month,
                ],
                [
                    'target_revenue' => $targetRev,
                    'target_orders' => (int) ($request->input('target_orders') ?? $request->input('targetOrders') ?? 0),
                    'notes' => 'Objectif initial fix├® ├á la cr├®ation du compte',
                ]
            );
        }

        return response()->json([
            'data' => $this->formatClient($client->load('delegate')),
            'message' => 'Client created successfully',
        ], 201);
    }

    public function show(Client $client): JsonResponse
    {
        return response()->json([
            'data' => $this->formatClient($client->load('delegate')),
        ]);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        if (! $request->has('client_type') && $request->has('clientType')) {
            $request->merge(['client_type' => $request->input('clientType')]);
        }
        if (! $request->has('credit_limit') && $request->has('creditLimit')) {
            $request->merge(['credit_limit' => $request->input('creditLimit')]);
        }
        if (! $request->has('client_code') && $request->has('clientCode')) {
            $request->merge(['client_code' => $request->input('clientCode')]);
        }
        if ($request->has('delegateId') || $request->has('delegate_id')) {
            $val = $request->input('delegate_id') ?? $request->input('delegateId');
            $request->merge(['delegate_id' => ($val === 'unassigned' || $val === null || $val === '' || $val === 0) ? null : $val]);
        }

        $validated = $request->validate([
            'client_code' => 'nullable|string|max:50',
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'sometimes|string|max:20',
            'address' => 'nullable|string|max:500',
            'region' => 'sometimes|string|max:255',
            'wilaya' => 'sometimes|string|max:255',
            'delegate_id' => 'nullable|exists:users,id',
            'client_type' => 'sometimes|in:retail,wholesale,corporate,government',
            'status' => 'sometimes|in:active,inactive,pending,blocked',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if (array_key_exists('address', $validated) && $validated['address'] === null) {
            $validated['address'] = '';
        }

        if (array_key_exists('delegate_id', $validated)) {
            // Explicitly set (can be null or a user ID)
        } else {
            $targetRegion = $validated['region'] ?? $client->region;
            if (empty($targetRegion)) {
                $targetWilaya = $validated['wilaya'] ?? $client->wilaya;
                if (!empty($targetWilaya)) {
                    $wClean = strtolower(trim(preg_replace('/^\d+\s*-\s*/', '', (string) $targetWilaya)));
                    $wCode = preg_match('/^(\d+)/', (string) $targetWilaya, $m) ? $m[1] : null;
                    $wilayaModel = \App\Models\Wilaya::where(function ($q) use ($wClean, $wCode) {
                        $q->whereRaw('LOWER(name) = ?', [$wClean]);
                        if ($wCode) {
                            $q->orWhere('code', $wCode)->orWhere('code', str_pad($wCode, 2, '0', STR_PAD_LEFT));
                        }
                    })->first();
                    $targetRegion = $wilayaModel?->region_name ?? $wilayaModel?->region?->name;
                }
            }

            if (!empty($targetRegion) && (empty($client->delegate_id) || isset($validated['region']))) {
                $regClean = strtolower(trim($targetRegion));
                $autoDelegate = User::whereRaw('LOWER(TRIM(region)) = ?', [$regClean])
                    ->where('role', 'delegate')
                    ->where('name', '!=', 'Unassigned')
                    ->first()
                    ?? User::whereRaw('LOWER(TRIM(region)) = ?', [$regClean])
                    ->whereIn('role', ['delegate', 'commercial'])
                    ->where('name', '!=', 'Unassigned')
                    ->first();

                if ($autoDelegate) {
                    $validated['delegate_id'] = $autoDelegate->id;
                }
            }
        }

        $client->update($validated);

        // Update or create monthly objective if supplied
        $targetRev = $request->input('target_revenue') ?? $request->input('targetRevenue');
        $targetOrd = $request->input('target_orders') ?? $request->input('targetOrders');
        if ($targetRev !== null || $targetOrd !== null) {
            \App\Models\ClientObjective::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'year' => (int) now()->year,
                    'month' => (int) now()->month,
                ],
                [
                    'target_revenue' => (float) ($targetRev ?? 0),
                    'target_orders' => (int) ($targetOrd ?? 0),
                    'notes' => 'Objectif mis ├á jour lors de la modification du profil',
                ]
            );
        }

        return response()->json([
            'data' => $this->formatClient($client->fresh('delegate')),
            'message' => 'Client updated successfully',
        ]);
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();
        if ($user && !$user->hasPermission('clients.delete')) {
            return response()->json([
                'message' => "Acc├¿s non autoris├® : vous ne disposez pas des droits requis pour supprimer des clients."
            ], 403);
        }

        // Safeguard: Retain all historical orders and their client_name, ensuring NO cascade deletion
        \App\Models\Order::where('client_id', $client->id)->each(function ($order) use ($client) {
            if (empty($order->client_name) || $order->client_name === 'Client Inconnu') {
                $order->client_name = $client->name;
            }
            $order->client_id = null;
            $order->save();
        });

        $client->delete();

        return response()->json(['message' => 'Client deleted successfully']);
    }

    public function kpis(?Request $request = null): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request?->user() ?: request()->user();
        $clientBase = Client::forUser($authUser);
        $orderBase = Order::forUser($authUser);

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        $totalClients = (clone $clientBase)->count();
        $activeClients = (clone $clientBase)->where('status', 'active')->count();
        $inactiveClients = (clone $clientBase)->where('status', 'inactive')->count();
        $outstandingCredit = (float) (clone $clientBase)->sum('outstanding_balance');
        
        $totalRevenue = (float) (clone $orderBase)->whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');
        if ($totalRevenue === 0.0) {
            $totalRevenue = (float) (clone $clientBase)->sum('total_spent');
        }

        $ordersThisMonth = (int) (clone $orderBase)->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        if ($ordersThisMonth === 0) {
            $ordersThisMonth = (int) (clone $clientBase)->where('last_order_at', '>=', $startOfMonth)->sum('total_orders');
        }

        $prevTotalClients = (clone $clientBase)->where('created_at', '<=', $endOfLastMonth)->count();
        $prevActiveClients = (clone $clientBase)->where('status', 'active')->where('created_at', '<=', $endOfLastMonth)->count();
        $prevInactiveClients = (clone $clientBase)->where('status', 'inactive')->where('created_at', '<=', $endOfLastMonth)->count();
        $prevOutstanding = (float) (clone $clientBase)->where('created_at', '<=', $endOfLastMonth)->sum('outstanding_balance');
        
        $prevRevenue = (float) (clone $orderBase)->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');
        if ($prevRevenue === 0.0) {
            $prevRevenue = (float) (clone $clientBase)->where('created_at', '<=', $endOfLastMonth)->sum('total_spent');
        }

        $prevOrders = (int) (clone $orderBase)->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        if ($prevOrders === 0) {
            $prevOrders = (int) (clone $clientBase)->where('last_order_at', '>=', $startOfLastMonth)
                ->where('last_order_at', '<=', $endOfLastMonth)
                ->sum('total_orders');
        }

        // Generate 7-day sparkline arrays from DB
        $totalClientsSparkline = [];
        $activeClientsSparkline = [];
        $inactiveClientsSparkline = [];
        $outstandingCreditSparkline = [];
        $ordersThisMonthSparkline = [];
        $totalRevenueSparkline = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $endOfDay = $date->copy()->endOfDay();

            $histTotal = (clone $clientBase)->where('created_at', '<=', $endOfDay)->count();
            $histActive = (clone $clientBase)->where('status', 'active')->where('created_at', '<=', $endOfDay)->count();
            $histInactive = (clone $clientBase)->where('status', 'inactive')->where('created_at', '<=', $endOfDay)->count();

            $dayOrders = (clone $orderBase)->whereDate('created_at', $date->toDateString())->count();
            $dayRev = (float) (clone $orderBase)->whereDate('created_at', $date->toDateString())->whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');

            $totalClientsSparkline[] = $histTotal;
            $activeClientsSparkline[] = $histActive;
            $inactiveClientsSparkline[] = $histInactive;
            $outstandingCreditSparkline[] = round($outstandingCredit, 2);
            $ordersThisMonthSparkline[] = $dayOrders;
            $totalRevenueSparkline[] = round($dayRev, 2);
        }

        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;
        $totalTargetRevenue = (float) \App\Models\ClientObjective::where('year', $currentYear)
            ->where('month', $currentMonth)
            ->whereIn('client_id', (clone $clientBase)->pluck('id'))
            ->sum('target_revenue');
        if ($totalTargetRevenue <= 0) {
            $totalTargetRevenue = round((float) (clone $clientBase)->sum('total_spent') * 1.2, 2);
        }

        return response()->json([
            'totalClients' => $totalClients,
            'activeClients' => $activeClients,
            'inactiveClients' => $inactiveClients,
            'outstandingCredit' => round($outstandingCredit, 2),
            'targetRevenue' => $totalTargetRevenue,
            'ordersThisMonth' => $ordersThisMonth,
            'totalRevenue' => $totalRevenue,
            'trends' => [
                'totalClients' => $this->trend($totalClients, $prevTotalClients),
                'activeClients' => $this->trend($activeClients, $prevActiveClients),
                'inactiveClients' => $this->trend($inactiveClients, $prevInactiveClients),
                'outstandingCredit' => $this->trend($outstandingCredit, $prevOutstanding),
                'targetRevenue' => 0.0,
                'ordersThisMonth' => $this->trend($ordersThisMonth, $prevOrders),
                'totalRevenue' => $this->trend($totalRevenue, $prevRevenue),
            ],
            'sparklines' => [
                'totalClients' => $totalClientsSparkline,
                'activeClients' => $activeClientsSparkline,
                'inactiveClients' => $inactiveClientsSparkline,
                'outstandingCredit' => [0, 0, 0, 0, 0, 0, 0],
                'targetRevenue' => array_fill(0, 7, round($totalTargetRevenue, 2)),
                'ordersThisMonth' => $ordersThisMonthSparkline,
                'totalRevenue' => $totalRevenueSparkline,
            ],
        ]);
    }

    public function analytics(?Request $request = null): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request?->user() ?: request()->user();
        $clientBase = Client::forUser($authUser);
        $orderBase = Order::forUser($authUser);

        $regionalDistribution = (clone $clientBase)->select(
            DB::raw("COALESCE(NULLIF(region, ''), 'Non assign├®') as name"),
            'region',
            DB::raw('count(*) as value')
        )
            ->groupBy('region')
            ->orderByDesc('value')
            ->get();

        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;

        $objectivePerformance = (clone $clientBase)->whereHas('objectives', function ($q) use ($currentYear, $currentMonth) {
            $q->where('year', $currentYear)->where('month', $currentMonth)->where('target_revenue', '>', 0);
        })
            ->with(['objectives' => function ($q) use ($currentYear, $currentMonth) {
                $q->where('year', $currentYear)->where('month', $currentMonth);
            }])
            ->limit(5)
            ->get()
            ->map(function ($c) use ($orderBase) {
                $obj = $c->objectives->first();
                $target = (float) ($obj->target_revenue ?? 0);
                $achieved = (float) (clone $orderBase)->where('client_id', $c->id)
                    ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->whereNotIn('status', ['cancelled', 'rejected'])
                    ->sum('total_amount');
                $percent = $target > 0 ? round(($achieved / $target) * 100, 1) : 0;
                return [
                    'name' => $c->name,
                    'target' => $target,
                    'achieved' => $achieved,
                    'percent' => $percent,
                ];
            });

        if ($objectivePerformance->isEmpty()) {
            $objectivePerformance = (clone $clientBase)->select('clients.name', DB::raw('COALESCE(SUM(orders.total_amount), clients.total_spent) as achieved'))
                ->leftJoin('orders', 'clients.id', '=', 'orders.client_id')
                ->groupBy('clients.id', 'clients.name', 'clients.total_spent')
                ->orderByDesc('achieved')
                ->limit(4)
                ->get()
                ->map(function ($c) {
                    $achieved = (float) $c->achieved;
                    $target = max(100000, round($achieved * 1.25, -3));
                    $percent = $target > 0 ? round(($achieved / $target) * 100, 1) : 0;
                    return [
                        'name' => $c->name,
                        'target' => $target,
                        'achieved' => $achieved,
                        'percent' => $percent,
                    ];
                });
        }

        $topDelegatesQuery = User::whereIn('role', ['delegate', 'commercial', 'delegue']);
        if ($authUser && $authUser->isRestrictedByRegion()) {
            if (!empty($authUser->region)) {
                $reg = strtolower(trim($authUser->region));
                $topDelegatesQuery->where(function ($q) use ($authUser, $reg) {
                    $q->whereRaw('LOWER(TRIM(region)) = ?', [$reg])
                      ->orWhere('id', $authUser->id);
                });
            } else {
                $topDelegatesQuery->where('id', $authUser->id);
            }
        }

        $topDelegates = $topDelegatesQuery->select(
                'users.name',
                DB::raw('COALESCE(SUM(clients.total_orders), 0) as orders'),
                DB::raw('COALESCE(SUM(clients.total_spent), 0) as revenue'),
                DB::raw('CASE WHEN SUM(clients.total_orders) > 0 THEN ROUND(SUM(clients.total_orders) * 100.0 / NULLIF(SUM(clients.total_orders), 0), 0) ELSE 0 END as completion')
            )
            ->leftJoin('clients', 'users.id', '=', 'clients.delegate_id')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('revenue')
            ->limit(4)
            ->get();

        if ($topDelegates->isEmpty()) {
            $topDelegates = (clone $clientBase)->whereNotNull('delegate_id')
                ->select(
                    'clients.delegate_id',
                    DB::raw('(SELECT name FROM users WHERE id = clients.delegate_id) as name'),
                    DB::raw('SUM(total_orders) as orders'),
                    DB::raw('SUM(total_spent) as revenue'),
                    DB::raw('100 as completion')
                )
                ->groupBy('clients.delegate_id')
                ->orderByDesc('revenue')
                ->limit(4)
                ->get();
        }

        return response()->json([
            'regionalDistribution' => $regionalDistribution,
            'objectivePerformance' => $objectivePerformance,
            'creditUsage' => [],
            'topDelegates' => $topDelegates,
        ]);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:clients,id',
            'action' => 'required|in:activate,deactivate,delete,assign_delegate',
            'delegate_id' => 'required_if:action,assign_delegate|nullable|exists:users,id',
        ]);

        $clients = Client::whereIn('id', $validated['ids']);

        match ($validated['action']) {
            'activate' => $clients->update(['status' => 'active']),
            'deactivate' => $clients->update(['status' => 'inactive']),
            'delete' => $clients->delete(),
            'assign_delegate' => $clients->update(['delegate_id' => $validated['delegate_id']]),
            default => null,
        };

        return response()->json(['message' => 'Bulk action completed successfully']);
    }

    /**
     * @return array{id: string, clientCode: string, name: string, email: string|null, phone: string, address: string, region: string, wilaya: string, delegateId: string|null, delegateName: string|null, clientType: string, status: string, creditLimit: float, outstandingBalance: float, totalOrders: int, totalSpent: float, lastOrderDate: string|null, createdAt: string}
     */
    private function formatClient(Client $client, ?\App\Models\ClientObjective $objective = null, $monthOrders = null): array
    {
        $delegate = $client->delegate;

        // Auto-resolve delegate from region or wilaya if client delegate is not yet assigned
        if (! $delegate) {
            $regionName = $client->region;
            if (empty($regionName) && ! empty($client->wilaya)) {
                $wClean = strtolower(trim(preg_replace('/^\d+\s*-\s*/', '', (string) $client->wilaya)));
                $wCode = preg_match('/^(\d+)/', (string) $client->wilaya, $m) ? $m[1] : null;
                $wilayaModel = \App\Models\Wilaya::where(function ($q) use ($wClean, $wCode) {
                    $q->whereRaw('LOWER(name) = ?', [$wClean]);
                    if ($wCode) {
                        $q->orWhere('code', $wCode)->orWhere('code', str_pad($wCode, 2, '0', STR_PAD_LEFT));
                    }
                })->first();
                if ($wilayaModel) {
                    $regionName = $wilayaModel->region_name ?? $wilayaModel->region?->name;
                    if ($regionName && empty($client->region)) {
                        $client->region = $regionName;
                    }
                }
            }

            if (! empty($regionName)) {
                $regClean = strtolower(trim($regionName));
                $delegate = User::whereRaw('LOWER(TRIM(region)) = ?', [$regClean])
                    ->where('role', 'delegate')
                    ->where('name', '!=', 'Unassigned')
                    ->first()
                    ?? User::whereRaw('LOWER(TRIM(region)) = ?', [$regClean])
                    ->whereIn('role', ['delegate', 'commercial'])
                    ->where('name', '!=', 'Unassigned')
                    ->first();

                if ($delegate) {
                    $client->delegate_id = $delegate->id;
                    $client->saveQuietly();
                }
            }
        }

        $delegateIsOnline = false;
        $delegateStatus = 'offline';

        if ($delegate) {
            $isRecent = $delegate->last_seen_at && $delegate->last_seen_at->gt(now()->subSeconds(45));
            $delegateIsOnline = $isRecent && $delegate->status !== 'offline' && $delegate->status !== 'suspended';
            $delegateStatus = $delegateIsOnline ? 'online' : ($delegate->status === 'suspended' ? 'suspended' : 'offline');
        }

        if ($monthOrders === null) {
            $currentYear = (int) now()->year;
            $currentMonth = (int) now()->month;
            $objective = \App\Models\ClientObjective::where('client_id', $client->id)
                ->where('year', $currentYear)
                ->where('month', $currentMonth)
                ->first();

            $monthOrders = \App\Models\Order::where('client_id', $client->id)
                ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                ->where('status', '!=', 'cancelled')
                ->with(['items.product'])
                ->get();
        }

        $achievedRevenue = 0.0;
        foreach ($monthOrders as $ord) {
            if ($ord->items && $ord->items->isNotEmpty()) {
                foreach ($ord->items as $item) {
                    $nominalPrice = (float) ($item->product?->nominal_price ?? $item->unit_price);
                    $qty = (int) ($item->quantity ?? 1);
                    $achievedRevenue += ($nominalPrice * $qty);
                }
            } else {
                $achievedRevenue += (float) ($ord->total_amount ?? 0.0);
            }
        }

        $achievedOrders = $monthOrders->count();
        $targetRevenue = $objective ? (float) $objective->target_revenue : 0.0;
        $targetOrders = $objective ? (int) $objective->target_orders : 0;
        $revenuePercentage = $targetRevenue > 0
            ? round(($achievedRevenue / $targetRevenue) * 100, 1)
            : ($achievedRevenue > 0 ? 100.0 : 0.0);

        $monthNamesFr = [
            1 => 'Janvier', 2 => 'F├®vrier', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Ao├╗t',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'D├®cembre',
        ];
        $cMonth = (int) now()->month;
        $cYear = (int) now()->year;

        $objectivePayload = [
            'isConfigured' => ($objective !== null && $targetRevenue > 0),
            'targetRevenue' => $targetRevenue,
            'achievedRevenue' => round($achievedRevenue, 2),
            'revenuePercentage' => $revenuePercentage,
            'targetOrders' => $targetOrders,
            'achievedOrders' => $achievedOrders,
            'monthName' => ($monthNamesFr[$cMonth] ?? "Mois $cMonth") . " $cYear",
        ];

        return [
            'id' => (string) $client->id,
            'clientCode' => $client->client_code,
            'name' => $client->name,
            'email' => $client->email,
            'phone' => $client->phone,
            'address' => $client->address,
            'region' => $client->region,
            'wilaya' => $client->wilaya,
            'delegateId' => $client->delegate_id ? (string) $client->delegate_id : null,
            'delegateName' => $delegate?->name,
            'delegateStatus' => $delegateStatus,
            'delegateIsOnline' => $delegateIsOnline,
            'clientType' => $client->client_type,
            'status' => $client->status ?? 'active',
            'creditLimit' => (float) $client->credit_limit,
            'outstandingBalance' => (float) $client->outstanding_balance,
            'totalOrders' => $client->total_orders,
            'totalSpent' => (float) $client->total_spent,
            'lastOrderDate' => $client->last_order_at instanceof \DateTimeInterface ? $client->last_order_at->toISOString() : ($client->last_order_at ? (string)$client->last_order_at : null),
            'lastPaymentDate' => $client->last_payment_date instanceof \DateTimeInterface ? $client->last_payment_date->toISOString() : ($client->last_payment_date ? (string)$client->last_payment_date : null),
            'lastPaymentAmount' => (float) $client->last_payment_amount,
            'lastPaymentMode' => $client->last_payment_mode,
            'lastPaymentReference' => $client->last_payment_reference,
            'lastPaymentStatus' => $client->last_payment_status,
            'lastPaymentOrderNumber' => $client->last_payment_order_number,
            'lastPaymentAccount' => $client->last_payment_account,
            'lastPayment' => $client->last_payment_amount > 0 ? [
                'date' => $client->last_payment_date instanceof \DateTimeInterface ? $client->last_payment_date->toISOString() : ($client->last_payment_date ? (string)$client->last_payment_date : null),
                'amount' => (float) $client->last_payment_amount,
                'mode' => $client->last_payment_mode,
                'reference' => $client->last_payment_reference,
                'status' => $client->last_payment_status,
                'orderNumber' => $client->last_payment_order_number,
                'account' => $client->last_payment_account,
            ] : null,
            'createdAt' => $client->created_at->toISOString(),
            'objective' => $objectivePayload,
        ];
    }

    private function generateClientCode(): string
    {
        $last = Client::orderByDesc('id')->value('client_code');
        if ($last) {
            if (preg_match('/(\d+)$/', $last, $m)) {
                return 'CLI-2026-' . str_pad((string) ((int) $m[1] + 1), 6, '0', STR_PAD_LEFT);
            }
        }

        $count = Client::count();
        return 'CLI-2026-' . str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
    }

    public function filterOptions(Request $request): JsonResponse
    {
        // Get distinct regions from Client records and Region model
        $clientRegions = Client::whereNotNull('region')
            ->where('region', '!=', '')
            ->distinct()
            ->pluck('region')
            ->toArray();
        $modelRegions = Region::whereNotNull('name')
            ->where('name', '!=', '')
            ->distinct()
            ->pluck('name')
            ->toArray();
        $regions = array_values(array_unique(array_filter(array_merge($clientRegions, $modelRegions))));
        sort($regions, SORT_NATURAL | SORT_FLAG_CASE);

        $authUser = auth('sanctum')->user() ?: $request->user();
        if ($authUser && $authUser->isRestrictedByRegion() && !empty($authUser->region)) {
            $regions = [$authUser->region];
        }

        // Get distinct delegates from users with role 'delegate' and from assigned client delegates
        $delegateUsers = User::where('role', 'delegate')
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->pluck('name')
            ->toArray();
        $assignedDelegates = User::whereIn('id', Client::whereNotNull('delegate_id')->pluck('delegate_id'))
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->pluck('name')
            ->toArray();
        $delegates = array_values(array_unique(array_filter(array_merge($delegateUsers, $assignedDelegates))));
        sort($delegates, SORT_NATURAL | SORT_FLAG_CASE);

        // Client Types
        $clientTypes = Client::whereNotNull('client_type')
            ->where('client_type', '!=', '')
            ->distinct()
            ->pluck('client_type')
            ->toArray();
        $defaultTypes = ['retail', 'wholesale', 'corporate', 'government'];
        $types = array_values(array_unique(array_merge($defaultTypes, $clientTypes)));

        // Statuses
        $statuses = ['active', 'inactive', 'pending', 'blocked'];

        return response()->json([
            'regions' => $regions,
            'delegates' => $delegates,
            'clientTypes' => $types,
            'statuses' => $statuses,
        ]);
    }

    public function importEncaissements(Request $request, \App\Services\EncaissementParserService $parserService): JsonResponse
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && !$user->hasPermission('clients.edit') && !$user->hasPermission('clients.create') && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => "Acc├¿s non autoris├® : vous ne disposez pas des droits requis pour importer des encaissements."
            ], 403);
        }

        $filePath = null;
        $originalName = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, ['xlsx', 'xls'])) {
                return response()->json([
                    'message' => 'Le fichier doit ├¬tre au format Excel (.xlsx).'
                ], 422);
            }
            $filePath = $file->getRealPath();
            $originalName = $file->getClientOriginalName();
        } elseif ($request->boolean('use_data_folder') || $request->input('from_data') || $request->input('use_default_file')) {
            $candidates = [
                base_path('../data/encaissement.xlsx'),
                base_path('data/encaissement.xlsx'),
                'c:/Users/pc -006/Desktop/StiCommande/data/encaissement.xlsx',
            ];
            foreach ($candidates as $cand) {
                if (file_exists($cand)) {
                    $filePath = $cand;
                    $originalName = basename($cand);
                    break;
                }
            }
            if (!$filePath) {
                return response()->json([
                    'message' => 'Le fichier data/encaissement.xlsx est introuvable sur le serveur.'
                ], 404);
            }
        } else {
            return response()->json([
                'message' => 'Veuillez fournir un fichier Excel (.xlsx) ou s├®lectionner use_data_folder.'
            ], 422);
        }

        try {
            $result = $parserService->importFromFile($filePath, $originalName, $user?->id);
            return response()->json([
                'success' => true,
                'message' => "Encaissements import├®s avec succ├¿s. {$result['tiers_count']} clients trait├®s ({$result['clients_updated']} mis ├á jour, {$result['clients_created']} cr├®├®s).",
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'importation : " . $e->getMessage(),
            ], 500);
        }
    }

    public function importRecouvrement(Request $request, \App\Services\RecouvrementParserService $parserService): JsonResponse
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && !$user->hasPermission('clients.edit') && !$user->hasPermission('clients.create') && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => "Acc├¿s non autoris├® : vous ne disposez pas des droits requis pour importer des soldes clients."
            ], 403);
        }

        $filePath = null;
        $originalName = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, ['xlsx', 'xls'])) {
                return response()->json([
                    'message' => 'Le fichier doit ├¬tre au format Excel (.xlsx).'
                ], 422);
            }
            $filePath = $file->getRealPath();
            $originalName = $file->getClientOriginalName();
        } elseif ($request->boolean('use_data_folder') || $request->input('from_data') || $request->input('use_default_file')) {
            $candidates = [
                base_path('../data/recouvrement.xlsx'),
                base_path('data/recouvrement.xlsx'),
                'c:/Users/pc -006/Desktop/StiCommande/data/recouvrement.xlsx',
            ];
            foreach ($candidates as $cand) {
                if (file_exists($cand)) {
                    $filePath = $cand;
                    $originalName = basename($cand);
                    break;
                }
            }
            if (!$filePath) {
                return response()->json([
                    'message' => 'Le fichier data/recouvrement.xlsx est introuvable sur le serveur.'
                ], 404);
            }
        } else {
            return response()->json([
                'message' => 'Veuillez fournir un fichier Excel (.xlsx) ou s├®lectionner use_data_folder.'
            ], 422);
        }

        $createMissing = $request->boolean('create_missing', true);

        try {
            $result = $parserService->importFromFile($filePath, $originalName, $user?->id, $createMissing);
            $formattedTotal = number_format($result['total_outstanding'], 2, ',', ' ') . ' DA';
            return response()->json([
                'success' => true,
                'message' => "Soldes de recouvrement importés avec succès. {$result['total_rows']} lignes traitées ({$result['clients_updated']} mis à jour, {$result['clients_created']} créés). Total des impayés : {$formattedTotal}.",
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'importation du recouvrement : " . $e->getMessage(),
            ], 500);
        }
    }

    public function importPreview(Request $request, \App\Services\ClientImportService $importService): JsonResponse
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && !$user->hasPermission('clients.edit') && !$user->hasPermission('clients.create') && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => "Accès non autorisé : vous ne disposez pas des droits requis pour importer des clients."
            ], 403);
        }

        $file = $request->file('file') ?? $request->file('document') ?? $request->file('client_file');

        if (!$file) {
            return response()->json([
                'message' => "Le fichier d'importation est obligatoire. Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV (.csv).",
                'errors' => [
                    'file' => ["Le fichier d'importation est obligatoire."]
                ]
            ], 422);
        }

        try {
            $data = $importService->preview($file);
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

    public function extractWilayas(Request $request, \App\Services\ClientImportService $importService): JsonResponse
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && !$user->hasPermission('clients.edit') && !$user->hasPermission('clients.create') && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => "Accès non autorisé : vous ne disposez pas des droits requis pour importer des clients."
            ], 403);
        }

        $request->validate([
            'file_token' => 'required|string',
            'wilaya_column' => 'required|string',
        ]);

        try {
            $data = $importService->extractWilayas(
                $request->input('file_token'),
                $request->input('wilaya_column')
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

    public function importVerify(Request $request, \App\Services\ClientImportService $importService): JsonResponse
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && !$user->hasPermission('clients.edit') && !$user->hasPermission('clients.create') && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => "Accès non autorisé : vous ne disposez pas des droits requis pour importer des clients."
            ], 403);
        }

        $request->validate([
            'file_token' => 'required|string',
            'mapping' => 'required|array',
            'mapping.name' => 'required|string',
            'mapping.phone' => 'required|string',
            'duplicate_action' => 'nullable|string|in:update,skip',
            'wilaya_mapping' => 'nullable|array',
        ]);

        try {
            $data = $importService->verify(
                $request->input('file_token'),
                $request->input('mapping'),
                $request->input('duplicate_action', 'update'),
                $request->input('wilaya_mapping', [])
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

    public function importExecute(Request $request, \App\Services\ClientImportService $importService): JsonResponse
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && !$user->hasPermission('clients.edit') && !$user->hasPermission('clients.create') && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => "Accès non autorisé : vous ne disposez pas des droits requis pour importer des clients."
            ], 403);
        }

        $request->validate([
            'file_token' => 'required|string',
            'mapping' => 'required|array',
            'mapping.name' => 'required|string',
            'mapping.phone' => 'required|string',
            'duplicate_action' => 'nullable|string|in:update,skip',
            'wilaya_mapping' => 'nullable|array',
        ]);

        try {
            $result = $importService->execute(
                $request->input('file_token'),
                $request->input('mapping'),
                $request->input('duplicate_action', 'update'),
                $user?->id,
                $request->input('wilaya_mapping', [])
            );

            return response()->json([
                'success' => true,
                'message' => "Importation termin├®e avec succ├¿s : {$result['created_count']} client(s) cr├®├®(s), {$result['updated_count']} mis ├á jour, {$result['skipped_count']} ignor├®(s).",
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    private function trend(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}
