<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::with('delegate');

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
            $query->whereIn('status', $statuses);
        }

        if ($regions = $request->input('region')) {
            $query->whereIn('region', $regions);
        }

        if ($delegates = $request->input('delegate')) {
            $query->whereHas('delegate', function ($q) use ($delegates) {
                $q->whereIn('name', $delegates);
            });
        }

        if ($types = $request->input('clientType')) {
            $query->whereIn('client_type', $types);
        }

        if ($startDate = $request->input('dateStart')) {
            $query->where('created_at', '>=', Carbon::parse($startDate)->startOfDay());
        }

        if ($endDate = $request->input('dateEnd')) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        $sortField = $request->input('sortField', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');
        $allowedSorts = ['name', 'client_code', 'phone', 'region', 'total_orders', 'total_spent', 'status', 'created_at'];
        if (! in_array($sortField, $allowedSorts)) {
            $sortField = 'created_at';
        }
        $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 10)));
        $total = (clone $query)->count();
        $clients = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => $clients->map(fn ($client) => $this->formatClient($client)),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $request->has('client_type') && $request->has('clientType')) {
            $request->merge(['client_type' => $request->input('clientType')]);
        }
        if (! $request->has('credit_limit') && $request->has('creditLimit')) {
            $request->merge(['credit_limit' => $request->input('creditLimit')]);
        }

        $dId = $request->input('delegate_id', $request->input('delegateId'));
        $dName = $request->input('delegate_name', $request->input('delegateName'));

        if ($dId && is_numeric($dId) && User::where('id', $dId)->exists()) {
            $request->merge(['delegate_id' => (int) $dId]);
        } elseif ($dName) {
            $baseUsername = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace(' ', '.', $dName)));
            $user = User::firstOrCreate(
                ['name' => $dName],
                [
                    'username' => $baseUsername,
                    'phone' => '0550000000',
                    'password' => bcrypt('password'),
                    'role' => 'delegate',
                ]
            );
            $request->merge(['delegate_id' => $user->id]);
        } else {
            $request->merge(['delegate_id' => null]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'region' => 'required|string|max:255',
            'wilaya' => 'required|string|max:255',
            'delegate_id' => 'nullable|exists:users,id',
            'client_type' => 'required|in:retail,wholesale,corporate,government',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['client_code'] = $request->input('client_code', $this->generateClientCode());
        $validated['status'] = $request->input('status', 'active');

        $client = Client::create($validated);

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
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string|max:500',
            'region' => 'sometimes|string|max:255',
            'wilaya' => 'sometimes|string|max:255',
            'delegate_id' => 'nullable|exists:users,id',
            'client_type' => 'sometimes|in:retail,wholesale,corporate,government',
            'status' => 'sometimes|in:active,inactive,pending,blocked',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $client->update($validated);

        return response()->json([
            'data' => $this->formatClient($client->load('delegate')),
            'message' => 'Client updated successfully',
        ]);
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json(['message' => 'Client deleted successfully']);
    }

    public function kpis(): JsonResponse
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        $totalClients = Client::count();
        $activeClients = Client::where('status', 'active')->count();
        $inactiveClients = Client::where('status', 'inactive')->count();
        $outstandingCredit = (float) Client::sum('outstanding_balance');
        
        $totalRevenue = (float) Order::whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');
        if ($totalRevenue === 0.0) {
            $totalRevenue = (float) Client::sum('total_spent');
        }

        $ordersThisMonth = (int) Order::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        if ($ordersThisMonth === 0) {
            $ordersThisMonth = (int) Client::where('last_order_at', '>=', $startOfMonth)->sum('total_orders');
        }

        $prevTotalClients = Client::where('created_at', '<=', $endOfLastMonth)->count();
        $prevActiveClients = Client::where('status', 'active')->where('created_at', '<=', $endOfLastMonth)->count();
        $prevInactiveClients = Client::where('status', 'inactive')->where('created_at', '<=', $endOfLastMonth)->count();
        $prevOutstanding = (float) Client::where('created_at', '<=', $endOfLastMonth)->sum('outstanding_balance');
        
        $prevRevenue = (float) Order::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');
        if ($prevRevenue === 0.0) {
            $prevRevenue = (float) Client::where('created_at', '<=', $endOfLastMonth)->sum('total_spent');
        }

        $prevOrders = (int) Order::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        if ($prevOrders === 0) {
            $prevOrders = (int) Client::where('last_order_at', '>=', $startOfLastMonth)
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

            $histTotal = Client::where('created_at', '<=', $endOfDay)->count();
            $histActive = Client::where('status', 'active')->where('created_at', '<=', $endOfDay)->count();
            $histInactive = Client::where('status', 'inactive')->where('created_at', '<=', $endOfDay)->count();

            $dayOrders = Order::whereDate('created_at', $date->toDateString())->count();
            $dayRev = (float) Order::whereDate('created_at', $date->toDateString())->whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');

            $totalClientsSparkline[] = $histTotal;
            $activeClientsSparkline[] = $histActive;
            $inactiveClientsSparkline[] = $histInactive;
            $outstandingCreditSparkline[] = round($outstandingCredit, 2);
            $ordersThisMonthSparkline[] = $dayOrders;
            $totalRevenueSparkline[] = round($dayRev, 2);
        }

        return response()->json([
            'totalClients' => $totalClients,
            'activeClients' => $activeClients,
            'inactiveClients' => $inactiveClients,
            'outstandingCredit' => $outstandingCredit,
            'ordersThisMonth' => $ordersThisMonth,
            'totalRevenue' => $totalRevenue,
            'trends' => [
                'totalClients' => $this->trend($totalClients, $prevTotalClients),
                'activeClients' => $this->trend($activeClients, $prevActiveClients),
                'inactiveClients' => $this->trend($inactiveClients, $prevInactiveClients),
                'outstandingCredit' => $this->trend($outstandingCredit, $prevOutstanding),
                'ordersThisMonth' => $this->trend($ordersThisMonth, $prevOrders),
                'totalRevenue' => $this->trend($totalRevenue, $prevRevenue),
            ],
            'sparklines' => [
                'totalClients' => $totalClientsSparkline,
                'activeClients' => $activeClientsSparkline,
                'inactiveClients' => $inactiveClientsSparkline,
                'outstandingCredit' => $outstandingCreditSparkline,
                'ordersThisMonth' => $ordersThisMonthSparkline,
                'totalRevenue' => $totalRevenueSparkline,
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        $regionalDistribution = Client::select('region', DB::raw('count(*) as value'))
            ->groupBy('region')
            ->orderByDesc('value')
            ->get();

        $creditUsage = Client::where('credit_limit', '>', 0)
            ->select('name', 'credit_limit as limit', 'outstanding_balance as used')
            ->orderByDesc('credit_limit')
            ->limit(4)
            ->get();

        $topDelegates = User::where('role', 'delegate')
            ->select(
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
            $topDelegates = Client::whereNotNull('delegate_id')
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
            'creditUsage' => $creditUsage,
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
    private function formatClient(Client $client): array
    {
        $delegate = $client->delegate;
        $delegateIsOnline = false;
        $delegateStatus = 'offline';

        if ($delegate) {
            $isRecent = $delegate->last_seen_at && $delegate->last_seen_at->gt(now()->subSeconds(45));
            $delegateIsOnline = $isRecent && $delegate->status !== 'offline' && $delegate->status !== 'suspended';
            $delegateStatus = $delegateIsOnline ? 'online' : ($delegate->status === 'suspended' ? 'suspended' : 'offline');
        }

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
            'lastOrderDate' => $client->last_order_at?->toISOString(),
            'createdAt' => $client->created_at->toISOString(),
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

    private function trend(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}
