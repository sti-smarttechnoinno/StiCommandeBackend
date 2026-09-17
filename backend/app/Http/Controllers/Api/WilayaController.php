<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wilaya;
use App\Models\User;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WilayaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Wilaya::with('delegate');

        if ($search = $request->input('search')) {
            $q = strtolower($search);
            $query->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                    ->orWhere('code', 'LIKE', "%{$q}%")
                    ->orWhereRaw('LOWER(region_name) LIKE ?', ["%{$q}%"])
                    ->orWhereHas('delegate', function ($dq) use ($q) {
                        $dq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]);
                    });
            });
        }

        if ($regions = $request->input('region')) {
            $query->whereIn('region_id', (array) $regions);
        }

        if ($statuses = $request->input('status')) {
            $query->whereIn('status', (array) $statuses);
        }

        $sortField = $request->input('sortField', 'rank');
        $sortDirection = $request->input('sortDirection', 'asc');

        $fieldMapping = [
            'rank' => 'rank',
            'name' => 'name',
            'region' => 'region_name',
            'status' => 'status',
        ];

        $column = $fieldMapping[$sortField] ?? 'rank';
        $query->orderBy($column, strtolower($sortDirection) === 'desc' ? 'desc' : 'asc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 10)));
        $total = (clone $query)->count();
        $wilayas = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => $wilayas->map(fn ($w) => $this->formatWilaya($w)),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
        ]);
    }

    public function kpis(): JsonResponse
    {
        $totalWilayas = Wilaya::count();
        $totalClients = Client::count();
        $monthlyRevenue = (float) Client::sum('total_spent');
        $ordersThisMonth = (int) Client::sum('total_orders');
        $activeDelegates = User::where('role', 'delegate')->where('status', 'online')->count();
        if ($activeDelegates === 0) {
            $activeDelegates = User::where('role', 'delegate')->count();
        }
        $avgGrowth = 0.0;

        return response()->json([
            'totalWilayas' => $totalWilayas,
            'totalClients' => $totalClients,
            'monthlyRevenue' => $monthlyRevenue,
            'ordersThisMonth' => $ordersThisMonth,
            'activeDelegates' => $activeDelegates,
            'averageGrowth' => $avgGrowth,
            'trends' => [
                'totalWilayas' => 0.0,
                'totalClients' => 0.0,
                'monthlyRevenue' => 0.0,
                'ordersThisMonth' => 0.0,
                'activeDelegates' => 0.0,
                'averageGrowth' => 0.0,
            ],
            'sparklines' => [
                'totalWilayas' => [58, 58, 58, 58, 58, 58, 58, 58, 58, 58, 58, 58],
                'totalClients' => array_fill(0, 12, $totalClients),
                'monthlyRevenue' => array_fill(0, 12, round($monthlyRevenue / 1000000, 2)),
                'ordersThisMonth' => array_fill(0, 12, $ordersThisMonth),
                'activeDelegates' => array_fill(0, 12, $activeDelegates),
                'averageGrowth' => array_fill(0, 12, 0),
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        $regionsMap = [
            'east' => ['name' => 'East Region', 'color' => '#2563EB'],
            'center' => ['name' => 'Center Region', 'color' => '#22C55E'],
            'west' => ['name' => 'West Region', 'color' => '#8B5CF6'],
            'south' => ['name' => 'South Region', 'color' => '#F59E0B'],
        ];

        $regionalDistribution = [];
        foreach ($regionsMap as $regKey => $meta) {
            $count = Wilaya::where('region_id', $regKey)->count();
            $rev = (float) Client::whereIn('wilaya', function ($q) use ($regKey) {
                $q->select('name')->from('wilayas')->where('region_id', $regKey);
            })->sum('total_spent');

            $regionalDistribution[] = [
                'name' => $meta['name'],
                'revenue' => $rev,
                'color' => $meta['color'],
                'wilayas' => $count,
            ];
        }

        $topPerformers = Wilaya::get()->map(function ($w) {
            $stats = $this->getWilayaRealStats($w);
            return [
                'id' => (string) $w->id,
                'code' => $w->code,
                'name' => $w->name,
                'monthlyRevenue' => $stats['monthlyRevenue'],
                'ordersMonth' => $stats['ordersMonth'],
                'growth' => 0.0,
            ];
        })->sortByDesc('monthlyRevenue')->values()->take(5);

        $performanceCounts = [
            'excellent' => Wilaya::where('performance', 'excellent')->count(),
            'good' => Wilaya::where('performance', 'good')->count(),
            'average' => Wilaya::where('performance', 'average')->count(),
            'needs_attention' => Wilaya::where('performance', 'needs_attention')->count(),
        ];

        return response()->json([
            'regionalDistribution' => $regionalDistribution,
            'topPerformers' => $topPerformers,
            'performanceCounts' => $performanceCounts,
        ]);
    }

    public function show(Wilaya $wilaya): JsonResponse
    {
        return response()->json([
            'data' => $this->formatWilaya($wilaya->load('delegate')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:wilayas,code',
            'name' => 'required|string|max:255',
            'region_id' => 'required|in:east,west,center,south',
            'region_name' => 'required|string|max:255',
            'delegate_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:active,limited,inactive',
        ]);

        $maxRank = (int) Wilaya::max('rank');
        $validated['rank'] = $maxRank + 1;
        $validated['status'] = $validated['status'] ?? 'active';

        $wilaya = Wilaya::create($validated);

        return response()->json([
            'data' => $this->formatWilaya($wilaya->load('delegate')),
            'message' => 'Wilaya created successfully',
        ], 201);
    }

    public function update(Request $request, Wilaya $wilaya): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'region_id' => 'sometimes|in:east,west,center,south',
            'region_name' => 'sometimes|string|max:255',
            'delegate_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:active,limited,inactive',
        ]);

        $wilaya->update($validated);

        return response()->json([
            'data' => $this->formatWilaya($wilaya->load('delegate')),
            'message' => 'Wilaya updated successfully',
        ]);
    }

    public function destroy(Wilaya $wilaya): JsonResponse
    {
        $wilaya->delete();

        return response()->json(['message' => 'Wilaya deleted successfully']);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:wilayas,id',
            'action' => 'required|in:active,limited,inactive,delete',
        ]);

        $query = Wilaya::whereIn('id', $validated['ids']);

        if ($validated['action'] === 'delete') {
            $query->delete();
        } else {
            $query->update(['status' => $validated['action']]);
        }

        return response()->json(['message' => 'Bulk action completed successfully']);
    }

    private function getWilayaRealStats(Wilaya $w): array
    {
        $clientsQuery = Client::where(function ($query) use ($w) {
            $query->where('wilaya', $w->name)
                ->orWhere('wilaya', 'LIKE', "%{$w->name}%")
                ->orWhere('wilaya', 'LIKE', "{$w->code}%");
        });

        $clientsCount = (clone $clientsQuery)->count();
        $activeClientsCount = (clone $clientsQuery)->where('status', 'active')->count();
        $monthlyRevenue = (float) (clone $clientsQuery)->sum('total_spent');
        $ordersMonth = (int) (clone $clientsQuery)->sum('total_orders');
        $avgOrder = $ordersMonth > 0 ? round($monthlyRevenue / $ordersMonth, 2) : 0;
        $yearlyRevenue = $monthlyRevenue * 12;

        return [
            'clients' => $clientsCount,
            'activeClients' => $activeClientsCount,
            'ordersMonth' => $ordersMonth,
            'monthlyRevenue' => $monthlyRevenue,
            'yearlyRevenue' => $yearlyRevenue,
            'avgOrder' => $avgOrder,
        ];
    }

    private function formatWilaya(Wilaya $w): array
    {
        $delegate = $w->delegate;
        if (! $delegate) {
            $delegate = User::where('role', 'delegate')
                ->where(function ($query) use ($w) {
                    $query->where('wilaya', $w->name)
                        ->orWhere('wilaya', 'LIKE', "%{$w->name}%")
                        ->orWhere('wilaya', 'LIKE', "{$w->code}%");
                })->first();
        }

        $formattedDelegate = null;
        if ($delegate) {
            $avatar = implode('', array_map(fn ($n) => $n[0] ?? '', explode(' ', $delegate->name)));
            $formattedDelegate = [
                'name' => $delegate->name,
                'phone' => $delegate->phone ?? '+213 550000000',
                'username' => $delegate->username ?? $delegate->name,
                'avatar' => strtoupper(substr($avatar, 0, 2)),
                'isOnline' => $delegate->status === 'online',
                'role' => 'Regional Delegate',
            ];
        }

        $stats = $this->getWilayaRealStats($w);

        return [
            'id' => (string) $w->id,
            'code' => $w->code,
            'name' => $w->name,
            'regionId' => $w->region_id,
            'regionName' => $w->region_name,
            'rank' => $w->rank,
            'delegate' => $formattedDelegate,
            'clients' => $stats['clients'],
            'activeClients' => $stats['activeClients'],
            'ordersToday' => 0,
            'ordersMonth' => $stats['ordersMonth'],
            'monthlyRevenue' => $stats['monthlyRevenue'],
            'yearlyRevenue' => $stats['yearlyRevenue'],
            'avgOrder' => $stats['avgOrder'],
            'growth' => 0.0,
            'performance' => $w->performance ?? 'good',
            'performanceScore' => $w->performance_score ?? 0,
            'topProduct' => '-',
            'lastActivity' => 'Active now',
            'status' => $w->status,
            'revenueTrend' => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'ordersTrend' => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
    }
}
