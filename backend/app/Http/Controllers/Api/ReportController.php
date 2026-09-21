<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Client;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get paginated generated reports list.
     */
    public function index(Request $request)
    {
        $query = Report::with('creator');

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
        }

        if ($type = $request->query('type')) {
            if ($type !== 'all') {
                $query->where('type', $type);
            }
        }

        if ($format = $request->query('format')) {
            if ($format !== 'all') {
                $query->where('format', $format);
            }
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate($request->query('pageSize', 10));

        $data = collect($reports->items())->map(function ($report) {
            return [
                'id' => (string) $report->id,
                'name' => $report->name,
                'type' => $report->type,
                'period' => $report->period,
                'format' => strtoupper($report->format),
                'status' => $report->status,
                'fileSize' => $report->file_size ?? '1.2 MB',
                'createdAt' => $report->created_at->format('M d, Y H:i'),
                'author' => $report->creator?->name ?? 'System Admin',
            ];
        });

        return response()->json([
            'data' => $data,
            'total' => $reports->total(),
            'page' => $reports->currentPage(),
            'pageSize' => $reports->perPage(),
            'totalPages' => $reports->lastPage(),
        ]);
    }

    /**
     * Get reports KPI metrics overview calculated from live DB data.
     */
    public function kpis()
    {
        $totalOrders = Order::count();
        $totalRevenue = (float) Order::whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
        
        $pendingOrders = Order::where('status', 'pending')->count();
        $activeClients = Client::where('status', 'active')->count();

        $activeDelegates = User::where(function ($q) {
            $q->where('role', 'delegate')
              ->orWhere('role', 'DELEGATE');
        })->where('is_active', true)->count();

        if ($activeDelegates === 0) {
            $activeDelegates = User::where(function ($q) {
                $q->where('role', 'delegate')
                  ->orWhere('role', 'DELEGATE');
            })->count();
        }

        // Calculate comparison for growth % (current 30 days vs previous 30 days)
        $currentPeriodRevenue = (float) Order::where('created_at', '>=', now()->subDays(30))
                                             ->whereNotIn('status', ['cancelled', 'rejected'])
                                             ->sum('total_amount');
        $prevPeriodRevenue = (float) Order::whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])
                                          ->whereNotIn('status', ['cancelled', 'rejected'])
                                          ->sum('total_amount');

        $revenueGrowth = $prevPeriodRevenue > 0 
            ? round((($currentPeriodRevenue - $prevPeriodRevenue) / $prevPeriodRevenue) * 100, 1) 
            : 0.0;

        $currentPeriodOrders = Order::where('created_at', '>=', now()->subDays(30))->count();
        $prevPeriodOrders = Order::whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])->count();

        $ordersGrowth = $prevPeriodOrders > 0
            ? round((($currentPeriodOrders - $prevPeriodOrders) / $prevPeriodOrders) * 100, 1)
            : 0.0;

        $currentPeriodPending = Order::where('created_at', '>=', now()->subDays(30))->where('status', 'pending')->count();
        $prevPeriodPending = Order::whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])->where('status', 'pending')->count();

        $pendingGrowth = $prevPeriodPending > 0
            ? round((($currentPeriodPending - $prevPeriodPending) / $prevPeriodPending) * 100, 1)
            : 0.0;

        // Daily 7-day sparklines
        $ordersSparkline = [];
        $revenueSparkline = [];
        $pendingSparkline = [];
        $delegatesSparkline = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayOrders = Order::whereDate('created_at', $date->toDateString())->count();
            $dayRevenue = (float) Order::whereDate('created_at', $date->toDateString())
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->sum('total_amount');
            $dayPending = Order::whereDate('created_at', $date->toDateString())
                ->where('status', 'pending')
                ->count();

            $ordersSparkline[] = $dayOrders;
            $revenueSparkline[] = round($dayRevenue, 2);
            $pendingSparkline[] = $dayPending;
            $delegatesSparkline[] = $activeDelegates;
        }

        $realProductIds = Product::pluck('id')->filter()->values()->toArray();
        $realProductCodes = Product::pluck('code')->filter()->values()->toArray();
        $productsSold = (int) OrderItem::where(function ($q) use ($realProductIds, $realProductCodes) {
            if (!empty($realProductIds)) {
                $q->whereIn('product_id', $realProductIds);
            }
            if (!empty($realProductCodes)) {
                $q->orWhereIn('reference', $realProductCodes);
            }
        })->sum('quantity');

        if ($productsSold === 0) {
            $productsSold = (int) Product::sum('total_sold');
        }

        return response()->json([
            'totalRevenue' => round($totalRevenue, 2),
            'revenueGrowth' => $revenueGrowth,
            'totalOrders' => $totalOrders,
            'ordersGrowth' => $ordersGrowth,
            'pendingOrders' => $pendingOrders,
            'pendingGrowth' => $pendingGrowth,
            'avgOrderValue' => round($avgOrderValue, 2),
            'avgOrderGrowth' => 0.0,
            'activeClients' => $activeClients,
            'activeDelegates' => $activeDelegates,
            'productsSold' => $productsSold,
            'ordersSparkline' => $ordersSparkline,
            'revenueSparkline' => $revenueSparkline,
            'pendingSparkline' => $pendingSparkline,
            'delegatesSparkline' => $delegatesSparkline,
        ]);
    }

    /**
     * Get Revenue Overview chart data grouped by month/week.
     */
    public function revenueOverview(Request $request)
    {
        $range = $request->query('range', '30d');
        $points = collect([]);

        if ($range === '7d') {
            // Daily breakdown for the last 7 days
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $label = $date->format('D, M d');

                $revenue = (float) Order::whereDate('created_at', $date->toDateString())
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');

                $orderCount = Order::whereDate('created_at', $date->toDateString())->count();

                $points->push([
                    'month' => $label,
                    'revenue' => round($revenue, 2),
                    'orders' => $orderCount,
                    'target' => round($revenue * 1.15, 2),
                ]);
            }
        } elseif ($range === '30d') {
            // 5-day interval breakdown for the last 30 days (6 intervals)
            for ($i = 5; $i >= 0; $i--) {
                $startDate = now()->subDays(($i + 1) * 5);
                $endDate = now()->subDays($i * 5);
                $label = $endDate->format('M d');

                $revenue = (float) Order::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');

                $orderCount = Order::whereBetween('created_at', [$startDate, $endDate])->count();

                $points->push([
                    'month' => $label,
                    'revenue' => round($revenue, 2),
                    'orders' => $orderCount,
                    'target' => round($revenue * 1.15, 2),
                ]);
            }
        } elseif ($range === '90d') {
            // 15-day interval breakdown for the last 90 days (6 intervals)
            for ($i = 5; $i >= 0; $i--) {
                $startDate = now()->subDays(($i + 1) * 15);
                $endDate = now()->subDays($i * 15);
                $label = $endDate->format('M d');

                $revenue = (float) Order::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');

                $orderCount = Order::whereBetween('created_at', [$startDate, $endDate])->count();

                $points->push([
                    'month' => $label,
                    'revenue' => round($revenue, 2),
                    'orders' => $orderCount,
                    'target' => round($revenue * 1.15, 2),
                ]);
            }
        } else {
            // Monthly aggregate for the last 12 months ('1y')
            for ($i = 11; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $label = $date->format('M Y');
                $year = $date->year;
                $month = $date->month;

                $revenue = (float) Order::whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');

                $orderCount = Order::whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->count();

                $points->push([
                    'month' => $label,
                    'revenue' => round($revenue, 2),
                    'orders' => $orderCount,
                    'target' => round($revenue * 1.15, 2),
                ]);
            }
        }

        return response()->json($points);
    }

    /**
     * Get Revenue by Region distribution.
     */
    public function revenueByRegion()
    {
        $regions = Order::select('region', DB::raw('SUM(total_amount) as total_revenue'), DB::raw('COUNT(*) as total_orders'))
            ->whereNotNull('region')
            ->where('status', '!=', 'cancelled')
            ->groupBy('region')
            ->get();

        $colors = [
            'Center (Alger)' => '#D71920',
            'East (Constantine)' => '#3B82F6',
            'West (Oran)' => '#10B981',
            'South (Ouargla)' => '#F59E0B',
            'Alger' => '#D71920',
            'Oran' => '#3B82F6',
            'Constantine' => '#10B981',
            'Ouargla' => '#F59E0B',
        ];

        $data = $regions->map(function ($r) use ($colors) {
            return [
                'region' => $r->region,
                'revenue' => (float) $r->total_revenue,
                'orders' => (int) $r->total_orders,
                'color' => $colors[$r->region] ?? '#8B5CF6',
            ];
        });

        return response()->json($data);
    }

    /**
     * Get Sales Trends timeline chart.
     */
    public function salesTrends(Request $request)
    {
        $days = collect([]);
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayLabel = $date->format('D, M d');
            
            $sales = (float) Order::whereDate('created_at', $date->toDateString())
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');

            $volume = Order::whereDate('created_at', $date->toDateString())->count();

            $days->push([
                'date' => $dayLabel,
                'sales' => round($sales, 2),
                'volume' => $volume,
            ]);
        }

        return response()->json($days);
    }

    /**
     * Get Order Status Distribution.
     */
    public function orderStatusDistribution()
    {
        $statuses = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $total = Order::count();
        if ($total == 0) $total = 1;

        $data = [
            [
                'status' => 'delivered',
                'label' => 'Delivered',
                'count' => $statuses['delivered'] ?? 0,
                'color' => '#10B981',
            ],
            [
                'status' => 'validated',
                'label' => 'Validated',
                'count' => ($statuses['validated'] ?? 0) + ($statuses['partially_validated'] ?? 0),
                'color' => '#3B82F6',
            ],
            [
                'status' => 'preparing',
                'label' => 'Preparing',
                'count' => $statuses['preparing'] ?? 0,
                'color' => '#8B5CF6',
            ],
            [
                'status' => 'pending',
                'label' => 'Pending Approval',
                'count' => $statuses['pending'] ?? 0,
                'color' => '#F59E0B',
            ],
            [
                'status' => 'rejected',
                'label' => 'Rejected',
                'count' => $statuses['rejected'] ?? 0,
                'color' => '#EF4444',
            ],
        ];

        // Format percentages
        $result = collect($data)->map(function ($item) use ($total) {
            $item['percentage'] = round(($item['count'] / $total) * 100, 1);
            return $item;
        });

        return response()->json($result);
    }

    /**
     * Get Top Performing Delegates.
     */
    public function topDelegates()
    {
        $delegates = Order::select(
            'delegate_name',
            DB::raw('MAX(region) as region'),
            DB::raw('SUM(total_amount) as total_sales'),
            DB::raw('COUNT(*) as total_orders')
        )
            ->whereNotNull('delegate_name')
            ->where('delegate_name', '!=', '')
            ->where('status', '!=', 'cancelled')
            ->groupBy('delegate_name')
            ->orderBy('total_sales', 'desc')
            ->limit(5)
            ->get();

        $transformed = $delegates->map(function ($d, $idx) {
            return [
                'id' => (string) ($idx + 1),
                'name' => $d->delegate_name,
                'sales' => (float) $d->total_sales,
                'orders' => (int) $d->total_orders,
                'region' => $d->region ?: 'Non assignée',
                'targetAchievement' => min(100, round(($d->total_sales / 250000) * 100, 1)),
            ];
        });

        return response()->json($transformed);
    }

    /**
     * Get Best Selling Products ranking from real DB products catalog.
     */
    public function bestProducts()
    {
        // Get valid product IDs and codes from the real catalog (Product table)
        $realProducts = Product::all();
        $realProductIds = $realProducts->pluck('id')->filter()->values()->toArray();
        $realProductCodes = $realProducts->pluck('code')->filter()->values()->toArray();

        // If no products exist in catalog, return empty
        if ($realProducts->isEmpty()) {
            return response()->json([]);
        }

        // Aggregate sales strictly for real products from OrderItem
        $best = OrderItem::select(
            'product_name',
            DB::raw('MAX(product_id) as product_id'),
            DB::raw('MAX(reference) as reference'),
            DB::raw('SUM(subtotal) as total_sales'),
            DB::raw('SUM(quantity) as total_units')
        )
            ->where(function ($query) use ($realProductIds, $realProductCodes) {
                if (!empty($realProductIds)) {
                    $query->whereIn('product_id', $realProductIds);
                }
                if (!empty($realProductCodes)) {
                    $query->orWhereIn('reference', $realProductCodes);
                }
            })
            ->groupBy('product_name')
            ->orderBy('total_sales', 'desc')
            ->limit(10)
            ->get();

        // Preload products for fast lookup
        $productsById = $realProducts->keyBy('id');
        $productsByCode = $realProducts->keyBy('code');

        // If no OrderItems match yet, fallback directly to products having revenue or total_sold in Product table
        if ($best->isEmpty()) {
            $catalogWithSales = $realProducts->filter(function ($p) {
                return ($p->total_sold > 0) || ($p->revenue > 0);
            })->sortByDesc('revenue')->values();

            $totalCatalogRevenue = $catalogWithSales->sum('revenue') ?: 1;

            $fallbackTransformed = $catalogWithSales->map(function ($product, $idx) use ($totalCatalogRevenue) {
                $cat = strtolower($product->category ?? '');
                if ($cat === 'mobile_recharge' || str_contains($cat, 'recharge')) {
                    $category = 'Recharge Mobile';
                } elseif ($cat === 'sim_cards' || str_contains($cat, 'sim')) {
                    $category = 'Cartes SIM';
                } elseif ($cat === 'devices' || str_contains($cat, 'device')) {
                    $category = 'Terminaux';
                } elseif (!empty($cat)) {
                    $category = ucwords(str_replace(['_', '-'], ' ', $cat));
                } else {
                    $category = 'Télécom';
                }

                $sharePercent = round(($product->revenue / $totalCatalogRevenue) * 100, 1);

                return [
                    'id' => (string) ($idx + 1),
                    'name' => $product->name,
                    'reference' => $product->code,
                    'sales' => (float) $product->revenue,
                    'units' => (int) $product->total_sold,
                    'category' => $category,
                    'operator' => $product->operator,
                    'growth' => $sharePercent . '% du vol.',
                    'share' => $sharePercent,
                ];
            });

            return response()->json($fallbackTransformed);
        }

        $totalSalesReal = $best->sum('total_sales') ?: 1;

        $transformed = $best->map(function ($p, $idx) use ($totalSalesReal, $productsById, $productsByCode) {
            $product = null;
            if ($p->product_id && isset($productsById[$p->product_id])) {
                $product = $productsById[$p->product_id];
            } elseif ($p->reference && isset($productsByCode[$p->reference])) {
                $product = $productsByCode[$p->reference];
            }

            // Category & Operator resolution strictly from Product
            $category = 'Recharge Mobile';
            $operator = null;

            if ($product) {
                $cat = strtolower($product->category ?? '');
                if ($cat === 'mobile_recharge' || str_contains($cat, 'recharge')) {
                    $category = 'Recharge Mobile';
                } elseif ($cat === 'sim_cards' || str_contains($cat, 'sim')) {
                    $category = 'Cartes SIM';
                } elseif ($cat === 'devices' || str_contains($cat, 'device')) {
                    $category = 'Terminaux';
                } elseif (!empty($cat)) {
                    $category = ucwords(str_replace(['_', '-'], ' ', $cat));
                }
                $operator = $product->operator;
            }

            // Real share of sales among real products
            $sharePercent = round(($p->total_sales / $totalSalesReal) * 100, 1);

            return [
                'id' => (string) ($idx + 1),
                'name' => $product ? $product->name : $p->product_name,
                'reference' => $product ? $product->code : $p->reference,
                'sales' => (float) $p->total_sales,
                'units' => (int) $p->total_units,
                'category' => $category,
                'operator' => $operator,
                'growth' => $sharePercent . '% du vol.',
                'share' => $sharePercent,
            ];
        });

        return response()->json($transformed);
    }

    /**
     * Create / Generate custom report record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'period' => 'required|string',
            'format' => 'required|string',
        ]);

        $report = Report::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'period' => $validated['period'],
            'format' => strtolower($validated['format']),
            'status' => 'completed',
            'file_size' => rand(1, 4) . '.' . rand(1, 9) . ' MB',
            'file_path' => '/reports/' . Str::slug($validated['name']) . '.' . strtolower($validated['format']),
            'created_by' => auth('sanctum')->id() ?? 1,
        ]);

        return response()->json($report, 201);
    }

    /**
     * Delete a report.
     */
    public function destroy($id)
    {
        $report = Report::findOrFail($id);
        $report->delete();

        return response()->json(['message' => 'Report deleted successfully']);
    }

    /**
     * Bulk actions on reports.
     */
    public function bulkAction(Request $request)
    {
        $action = $request->input('action');
        $ids = $request->input('ids', []);

        if ($action === 'delete') {
            Report::whereIn('id', $ids)->delete();
            return response()->json(['message' => 'Selected reports deleted successfully']);
        }

        return response()->json(['message' => 'Invalid bulk action'], 400);
    }

    /**
     * Get detailed clients by region report (with Wilaya, Last Encaissement, Outstanding Balance, Subtotals).
     */
    public function clientsByRegionReport(Request $request)
    {
        $regionFilter = $request->query('region');
        $debtOnly = filter_var($request->query('debt_only', false), FILTER_VALIDATE_BOOLEAN);
        $minSolde = $request->query('min_solde') !== null && $request->query('min_solde') !== ''
            ? (float) $request->query('min_solde')
            : null;
        $search = $request->query('search');
        $sortBy = $request->query('sort_by', 'wilaya');

        $query = Client::query()->select([
            'id',
            'client_code',
            'name',
            'phone',
            'personal_phone',
            'storm_phone',
            'rc_number',
            'wilaya',
            'region',
            'address',
            'status',
            'client_type',
            'credit_limit',
            'outstanding_balance',
            'last_payment_date',
            'last_payment_amount',
            'last_payment_mode',
            'last_payment_reference',
            'last_payment_status',
            'last_payment_order_number',
            'last_payment_account',
            'delegate_id',
        ]);

        if (!empty($regionFilter) && $regionFilter !== 'all' && !str_starts_with(strtolower(trim($regionFilter)), 'toutes')) {
            $query->whereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($regionFilter))]);
        }

        if ($minSolde !== null && $minSolde > 0) {
            $query->where('outstanding_balance', '>=', $minSolde);
        } elseif ($debtOnly) {
            $query->where('outstanding_balance', '>', 0);
        }

        if (!empty($search)) {
            $s = trim($search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('client_code', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('personal_phone', 'like', "%{$s}%")
                  ->orWhere('storm_phone', 'like', "%{$s}%")
                  ->orWhere('rc_number', 'like', "%{$s}%")
                  ->orWhere('wilaya', 'like', "%{$s}%");
            });
        }

        // Sorting
        if ($sortBy === 'balance_desc') {
            $query->orderBy('region')->orderByDesc('outstanding_balance')->orderBy('wilaya');
        } elseif ($sortBy === 'name') {
            $query->orderBy('region')->orderBy('name');
        } else {
            // default: wilaya, then client name
            $query->orderBy('region')->orderBy('wilaya')->orderBy('name');
        }

        $clients = $query->with('delegate')->get();

        // Group by Region
        $grouped = $clients->groupBy(function ($client) {
            return !empty(trim((string)$client->region)) ? trim($client->region) : 'Non assigné';
        });

        $regionsReport = [];
        $globalTotalSolde = 0.0;
        $globalTotalPayments = 0.0;
        $globalClientsCount = 0;
        $globalDebtorsCount = 0;

        foreach ($grouped as $regName => $regClients) {
            $regTotalSolde = (float) $regClients->sum('outstanding_balance');
            $regTotalPayments = (float) $regClients->sum('last_payment_amount');
            $regCount = $regClients->count();
            $regDebtors = $regClients->where('outstanding_balance', '>', 0)->count();

            $globalTotalSolde += $regTotalSolde;
            $globalTotalPayments += $regTotalPayments;
            $globalClientsCount += $regCount;
            $globalDebtorsCount += $regDebtors;

            // Find primary delegate for region if any
            $primaryDelegate = $regClients->first(fn($c) => !empty($c->delegate))?->delegate?->name;

            $regionsReport[] = [
                'region' => $regName,
                'delegate_name' => $primaryDelegate ?? 'Non assigné',
                'clients_count' => $regCount,
                'debtors_count' => $regDebtors,
                'total_solde' => round($regTotalSolde, 2),
                'total_last_payments' => round($regTotalPayments, 2),
                'clients' => $regClients->map(function ($c) {
                    return [
                        'id' => (string) $c->id,
                        'client_code' => $c->client_code,
                        'name' => $c->name,
                        'phone' => $c->personal_phone ?: $c->phone,
                        'storm_phone' => $c->storm_phone,
                        'rc_number' => $c->rc_number,
                        'wilaya' => $c->wilaya,
                        'address' => $c->address,
                        'status' => $c->status ?? 'active',
                        'client_type' => $c->client_type,
                        'solde' => (float) $c->outstanding_balance,
                        'last_payment_date' => $c->last_payment_date ? \Carbon\Carbon::parse($c->last_payment_date)->format('d/m/Y') : null,
                        'last_payment_amount' => (float) $c->last_payment_amount,
                        'last_payment_mode' => $c->last_payment_mode,
                        'last_payment_reference' => $c->last_payment_reference,
                        'last_payment_status' => $c->last_payment_status,
                    ];
                })->values()->all(),
            ];
        }

        // Sort regions alphabetically
        usort($regionsReport, fn($a, $b) => strcmp($a['region'], $b['region']));

        $lastImport = \App\Models\EncaissementImport::latest()->first();

        return response()->json([
            'meta' => [
                'generated_at' => now()->format('d/m/Y H:i'),
                'generated_at_iso' => now()->toISOString(),
                'last_import_at' => $lastImport ? \Carbon\Carbon::parse($lastImport->created_at)->format('d/m/Y H:i') : null,
                'total_regions' => count($regionsReport),
                'total_clients' => $globalClientsCount,
                'total_debtors' => $globalDebtorsCount,
                'total_solde' => round($globalTotalSolde, 2),
                'total_last_payments' => round($globalTotalPayments, 2),
                'filter_region' => $regionFilter ?: 'all',
                'filter_debt_only' => $debtOnly,
                'filter_min_solde' => $minSolde,
            ],
            'regions' => $regionsReport,
        ]);
    }
}
