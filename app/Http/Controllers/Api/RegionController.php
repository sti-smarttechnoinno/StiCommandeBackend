<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Region;
use App\Models\User;
use App\Models\Wilaya;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RegionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $regions = Region::all();
        $formatted = $regions->map(fn ($r) => $this->formatRegion($r));

        return response()->json([
            'data' => $formatted,
            'total' => $formatted->count(),
        ]);
    }

    public function kpis(): JsonResponse
    {
        $totalRegions = Region::count();
        $totalWilayas = Wilaya::count();
        $totalDelegates = User::where('role', 'delegate')->count();
        $totalClients = Client::count();
        $totalOrders = (int) Client::sum('total_orders');
        $totalRevenue = (float) Client::sum('total_spent');

        $activeClients = Client::where('status', 'active')->count();
        $avgPerformance = $totalClients > 0 ? round(($activeClients / $totalClients) * 100, 1) : 0;

        return response()->json([
            'totalRegions' => $totalRegions,
            'totalWilayas' => $totalWilayas,
            'totalDelegates' => $totalDelegates,
            'totalClients' => $totalClients,
            'totalOrders' => $totalOrders,
            'totalRevenue' => $totalRevenue,
            'avgPerformance' => $avgPerformance,
            'trends' => [
                'totalRegions' => 0.0,
                'totalWilayas' => 0.0,
                'totalDelegates' => 0.0,
                'totalRevenue' => 0.0,
                'avgPerformance' => 0.0,
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        $regions = Region::all();

        $distribution = $regions->map(function ($r) {
            $wilayasCount = Wilaya::where(function ($q) use ($r) {
                $q->where('region_name', $r->name)
                    ->orWhere('region_id', $r->code)
                    ->orWhere('custom_region_id', $r->id);
            })->count();

            return [
                'name' => $r->name,
                'value' => $wilayasCount,
                'color' => $r->color,
            ];
        });

        return response()->json([
            'regionalDistribution' => $distribution,
        ]);
    }

    public function show(Region $region): JsonResponse
    {
        return response()->json([
            'data' => $this->formatRegion($region),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100|unique:regions,code',
            'name_fr' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'bg_color' => 'nullable|string|max:100',
            'text_color' => 'nullable|string|max:100',
            'wilaya_codes' => 'nullable|array',
            'wilaya_codes.*' => 'string',
            'delegate_ids' => 'nullable|array',
            'delegate_ids.*' => 'string',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = Str::slug($validated['name']);
        }

        $region = Region::create($validated);

        // Customize Wilayas assigned to this region
        if (! empty($request->input('wilaya_codes'))) {
            $codes = $request->input('wilaya_codes');
            Wilaya::whereIn('code', $codes)->update([
                'region_name' => $region->name,
                'region_id' => $region->code,
                'custom_region_id' => $region->id,
            ]);
        }

        // Customize Delegates assigned to this region
        if (! empty($request->input('delegate_ids'))) {
            $delegateIds = $request->input('delegate_ids');
            User::whereIn('id', $delegateIds)->where('role', 'delegate')->update([
                'region' => $region->name,
            ]);
        }

        return response()->json([
            'data' => $this->formatRegion($region),
            'message' => 'Region created successfully',
        ], 201);
    }

    public function update(Request $request, Region $region): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'name_fr' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'bg_color' => 'nullable|string|max:100',
            'text_color' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,inactive,archived',
            'wilaya_codes' => 'nullable|array',
            'wilaya_codes.*' => 'string',
            'delegate_ids' => 'nullable|array',
            'delegate_ids.*' => 'string',
        ]);

        $oldName = $region->name;
        $region->update($validated);

        // Customize & update Wilayas assigned to this region
        if ($request->has('wilaya_codes')) {
            $codes = $request->input('wilaya_codes', []);
            if (! empty($codes)) {
                Wilaya::whereIn('code', $codes)->update([
                    'region_name' => $region->name,
                    'region_id' => $region->code,
                    'custom_region_id' => $region->id,
                ]);
            }
        } elseif ($oldName !== $region->name) {
            Wilaya::where('region_name', $oldName)->update([
                'region_name' => $region->name,
            ]);
        }

        // Customize & update Delegates assigned to this region
        if ($request->has('delegate_ids')) {
            $delegateIds = $request->input('delegate_ids', []);
            if (! empty($delegateIds)) {
                User::whereIn('id', $delegateIds)->where('role', 'delegate')->update([
                    'region' => $region->name,
                ]);
            }
        } elseif ($oldName !== $region->name) {
            User::where('role', 'delegate')->where('region', $oldName)->update([
                'region' => $region->name,
            ]);
        }

        return response()->json([
            'data' => $this->formatRegion($region),
            'message' => 'Region updated successfully',
        ]);
    }

    public function destroy(Region $region): JsonResponse
    {
        $region->delete();

        return response()->json(['message' => 'Region deleted successfully']);
    }

    private function formatRegion(Region $region): array
    {
        // 1. Mapped Wilayas
        $wilayas = Wilaya::where(function ($q) use ($region) {
            $q->where('region_name', $region->name)
                ->orWhere('region_id', $region->code)
                ->orWhere('custom_region_id', $region->id);
        })->get();

        // 2. Commercial Delegates explicitly assigned to this region
        $regionDelegates = User::where('role', 'delegate')
            ->where(function ($q) use ($region) {
                $q->where('region', $region->name)
                    ->orWhere('region', $region->code);
            })->get();

        $allDelegates = User::where('role', 'delegate')->get();

        // 3. Format each Wilaya with REAL data strictly from DB
        $formattedWilayas = $wilayas->map(function ($w) use ($allDelegates) {
            $del = null;
            if ($w->delegate_id) {
                $del = $allDelegates->firstWhere('id', $w->delegate_id);
            }
            if (! $del && $w->name) {
                $del = $allDelegates->first(function ($d) use ($w) {
                    return $d->wilaya && str_contains(strtolower($d->wilaya), strtolower($w->name));
                });
            }

            $delegateData = null;
            if ($del) {
                $delegateData = [
                    'id' => (string) $del->id,
                    'name' => $del->name,
                    'phone' => $del->phone ?? '',
                    'email' => $del->email,
                    'avatar' => strtoupper(substr($del->name, 0, 2)),
                    'isOnline' => $del->status === 'online',
                    'role' => 'Commercial Delegate',
                ];
            }

            // Real Client Count for this wilaya
            $clientsQuery = Client::where(function ($q) use ($w) {
                $q->where('wilaya', 'LIKE', "%{$w->name}%")
                    ->orWhere('wilaya', 'LIKE', "%{$w->code}%");
            });

            if ($w->delegate_id) {
                $clientsQuery->orWhere('delegate_id', $w->delegate_id);
            }

            $clientsCount = (int) $clientsQuery->count();
            $ordersToday = (int) (clone $clientsQuery)->sum('total_orders');
            $revenue = (float) (clone $clientsQuery)->sum('total_spent');

            $activeClients = (int) (clone $clientsQuery)->where('status', 'active')->count();
            $coverage = $clientsCount > 0 ? (int) round(($activeClients / $clientsCount) * 100) : 0;

            return [
                'id' => (string) $w->id,
                'name' => $w->name,
                'code' => $w->code,
                'regionId' => $w->region_id ?? '',
                'regionName' => $w->region_name ?? '',
                'delegate' => $delegateData,
                'clients' => $clientsCount,
                'ordersToday' => $ordersToday,
                'revenue' => $revenue,
                'coverage' => $coverage,
                'status' => $w->status ?? ($clientsCount > 0 ? 'active' : 'inactive'),
                'lastActivity' => $clientsCount > 0 ? 'Active' : 'No activity',
            ];
        });

        // Unique delegate count across region and wilayas
        $assignedWilayaDelegateIds = $formattedWilayas->map(fn ($w) => $w['delegate']['id'] ?? null)->filter()->values();
        $regionDelegateIds = $regionDelegates->pluck('id')->map(fn ($id) => (string) $id);
        $totalUniqueDelegatesCount = $assignedWilayaDelegateIds->merge($regionDelegateIds)->unique()->count();

        // Direct clients for region if specified by region column
        $directRegionClients = Client::where('region', $region->name)->orWhere('region', $region->code)->get();

        $totalClients = max($formattedWilayas->sum('clients'), $directRegionClients->count());
        $totalOrdersToday = max($formattedWilayas->sum('ordersToday'), (int) $directRegionClients->sum('total_orders'));
        $totalRevenue = max($formattedWilayas->sum('revenue'), (float) $directRegionClients->sum('total_spent'));

        return [
            'id' => $region->code,
            'dbId' => (string) $region->id,
            'name' => $region->name,
            'nameFr' => $region->name_fr ?? $region->name,
            'subtitle' => $region->subtitle ?? "{$region->name} Algeria Distribution Zone",
            'icon' => $region->icon ?? '🗺️',
            'color' => $region->color ?? '#2563EB',
            'bgColor' => $region->bg_color ?? 'bg-blue-500/10',
            'textColor' => $region->text_color ?? 'text-blue-600',
            'wilayas' => $formattedWilayas,
            'delegates' => $totalUniqueDelegatesCount,
            'clients' => $totalClients,
            'ordersToday' => $totalOrdersToday,
            'revenue' => $totalRevenue,
            'status' => $region->status ?? 'active',
        ];
    }
}
