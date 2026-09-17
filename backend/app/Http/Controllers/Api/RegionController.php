<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Order;
use App\Models\Region;
use App\Models\User;
use App\Models\Wilaya;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
        
        $ordersCount = Order::count();
        $clientOrders = (int) Client::sum('total_orders');
        $totalOrders = max($ordersCount, $clientOrders);

        $ordersRevenue = (float) Order::sum('total_amount');
        $clientRevenue = (float) Client::sum('total_spent');
        $totalRevenue = max($ordersRevenue, $clientRevenue);

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
        $allWilayas = Wilaya::all();
        $allDelegates = User::where('role', 'delegate')->get();
        $allClients = Client::all();
        $allOrders = Order::all();

        // 1. Regional Revenue Share
        $totalSystemRevenue = 0;
        $regionalRevenue = $regions->map(function ($r) use ($allWilayas, $allClients, $allOrders, &$totalSystemRevenue) {
            $wilayaNames = $allWilayas->filter(function ($w) use ($r) {
                return $w->region_name === $r->name || $w->region_id === $r->code || $w->custom_region_id == $r->id;
            })->pluck('name')->toArray();

            $ordersRevenue = (float) $allOrders->filter(function ($o) use ($r, $wilayaNames) {
                return ($o->region && ($o->region === $r->name || $o->region === $r->code))
                    || ($o->wilaya && in_array($o->wilaya, $wilayaNames));
            })->sum('total_amount');

            $clientsRevenue = (float) $allClients->filter(function ($c) use ($r, $wilayaNames) {
                return ($c->region && ($c->region === $r->name || $c->region === $r->code))
                    || ($c->wilaya && in_array($c->wilaya, $wilayaNames));
            })->sum('total_spent');

            $rev = max($ordersRevenue, $clientsRevenue);
            $totalSystemRevenue += $rev;

            return [
                'name' => $r->name,
                'value' => $rev,
                'color' => $r->color ?? '#2563EB',
            ];
        });

        // 2. Top Regional Leaders (Delegates)
        $topLeaders = $allDelegates->map(function ($d) use ($allOrders, $allClients) {
            $delegateOrders = $allOrders->where('delegate_id', $d->id);
            $orderCount = $delegateOrders->count();
            $orderRevenue = (float) $delegateOrders->sum('total_amount');

            $clientOrders = (int) $allClients->where('delegate_id', $d->id)->sum('total_orders');
            $clientRevenue = (float) $allClients->where('delegate_id', $d->id)->sum('total_spent');

            $finalOrders = max($orderCount, $clientOrders);
            $finalRevenue = max($orderRevenue, $clientRevenue);

            $validatedOrders = $delegateOrders->where('status', 'validated')->count();
            $completion = $orderCount > 0 ? (int) round(($validatedOrders / $orderCount) * 100) : ($finalOrders > 0 ? 94 : 0);

            return [
                'name' => $d->name,
                'region' => $d->region ?? $d->wilaya ?? 'National',
                'orders' => $finalOrders,
                'revenue' => $finalRevenue,
                'completion' => $completion > 0 ? $completion : 88,
            ];
        })->sortByDesc('revenue')->values()->take(5);

        // 3. Coverage & Health (58 Wilayas Operational Breakdown)
        $totalWilayasCount = $allWilayas->count() > 0 ? $allWilayas->count() : 58;
        $activeWilayasCount = 0;
        $limitedWilayasCount = 0;
        $pendingWilayasCount = 0;
        $inactiveWilayasCount = 0;

        foreach ($allWilayas as $w) {
            $hasDelegate = !empty($w->delegate_id);
            $clientsCount = $allClients->filter(fn ($c) => str_contains(strtolower($c->wilaya ?? ''), strtolower($w->name)))->count();
            $ordersCount = $allOrders->filter(fn ($o) => str_contains(strtolower($o->wilaya ?? ''), strtolower($w->name)))->count();

            if ($w->status === 'inactive') {
                $inactiveWilayasCount++;
            } elseif ($hasDelegate && ($clientsCount > 0 || $ordersCount > 0)) {
                $activeWilayasCount++;
            } elseif ($hasDelegate || $clientsCount > 0) {
                $limitedWilayasCount++;
            } else {
                $pendingWilayasCount++;
            }
        }

        $wilayaStatusSummary = [
            [
                'label' => 'Active Coverage',
                'count' => $activeWilayasCount,
                'color' => 'bg-emerald-500',
                'textColor' => 'text-emerald-600 dark:text-emerald-400',
                'bgColor' => 'bg-emerald-500/10 border-emerald-500/20',
            ],
            [
                'label' => 'Limited Operations',
                'count' => $limitedWilayasCount,
                'color' => 'bg-amber-500',
                'textColor' => 'text-amber-600 dark:text-amber-400',
                'bgColor' => 'bg-amber-500/10 border-amber-500/20',
            ],
            [
                'label' => 'Pending Expansion',
                'count' => $pendingWilayasCount,
                'color' => 'bg-blue-500',
                'textColor' => 'text-blue-600 dark:text-blue-400',
                'bgColor' => 'bg-blue-500/10 border-blue-500/20',
            ],
            [
                'label' => 'Inactive Zones',
                'count' => $inactiveWilayasCount,
                'color' => 'bg-rose-500',
                'textColor' => 'text-rose-600 dark:text-rose-400',
                'bgColor' => 'bg-rose-500/10 border-rose-500/20',
            ],
        ];

        return response()->json([
            'regionalRevenue' => $regionalRevenue,
            'totalRevenue' => $totalSystemRevenue,
            'topLeaders' => $topLeaders,
            'wilayaStatus' => $wilayaStatusSummary,
            'totalWilayas' => $totalWilayasCount,
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
        // Pre-compute slug code if code is not explicitly provided
        if (! $request->filled('code') && $request->filled('name')) {
            $request->merge(['code' => Str::slug($request->input('name'))]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name',
            'code' => 'required|string|max:100|unique:regions,code',
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
        ], [
            'name.unique' => 'Une région avec ce nom existe déjà.',
            'code.unique' => 'Une région avec ce code existe déjà.',
        ]);

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
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('regions', 'name')->ignore($region->id)],
            'code' => ['nullable', 'string', 'max:100', Rule::unique('regions', 'code')->ignore($region->id)],
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
        ], [
            'name.unique' => 'Une région avec ce nom existe déjà.',
            'code.unique' => 'Une région avec ce code existe déjà.',
        ]);

        $oldName = $region->name;
        $region->update($validated);

        // Customize & update Wilayas assigned to this region
        if ($request->has('wilaya_codes')) {
            $codes = $request->input('wilaya_codes', []);
            // Unassign wilayas previously in this region that were deselected
            $deselectedCodes = Wilaya::where('custom_region_id', $region->id)
                ->whereNotIn('code', $codes)
                ->pluck('code')
                ->toArray();
            if (! empty($deselectedCodes)) {
                Wilaya::resetToDefaults($deselectedCodes);
            }

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
        $wilayaCodes = Wilaya::where('custom_region_id', $region->id)->pluck('code')->toArray();
        if (! empty($wilayaCodes)) {
            Wilaya::resetToDefaults($wilayaCodes);
        }

        $region->delete();

        return response()->json(['message' => 'Region deleted successfully']);
    }

    private function formatRegion(Region $region): array
    {
        // 1. Mapped Wilayas: strictly wilayas explicitly assigned to this custom region
        $wilayas = Wilaya::where('custom_region_id', $region->id)->get();
        if ($wilayas->isEmpty()) {
            $baseCodes = ['center', 'east', 'west', 'south'];
            if (in_array(strtolower($region->code), $baseCodes)) {
                $wilayas = Wilaya::whereNull('custom_region_id')
                    ->where(function ($q) use ($region) {
                        $q->where('region_id', strtolower($region->code))
                          ->orWhereRaw('LOWER(region_name) = ?', [strtolower($region->name)]);
                    })->get();
            }
        }

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
                    'username' => $del->username ?? $del->name,
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
