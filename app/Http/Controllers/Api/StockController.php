<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockMovement::query();

        if ($search = $request->input('search')) {
            $q = strtolower(trim($search));
            $query->where(function ($qb) use ($q) {
                $qb->whereRaw('LOWER(reference) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(product_name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(warehouse) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(delegate_name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(notes) LIKE ?', ["%{$q}%"]);
            });
        }

        if ($warehouse = $request->input('warehouse')) {
            $warehouses = is_array($warehouse) ? $warehouse : explode(',', $warehouse);
            $query->whereIn('warehouse', $warehouses);
        }

        $movementTypes = $request->input('movementType', $request->input('movement_type'));
        if ($movementTypes) {
            $types = is_array($movementTypes) ? $movementTypes : explode(',', $movementTypes);
            $query->whereIn('movement_type', $types);
        }

        if ($delegate = $request->input('delegate')) {
            $delegates = is_array($delegate) ? $delegate : explode(',', $delegate);
            $query->whereIn('delegate_name', $delegates);
        }

        if ($status = $request->input('status')) {
            $statuses = is_array($status) ? $status : explode(',', $status);
            $query->whereIn('status', $statuses);
        }

        if ($dateStart = $request->input('dateStart', $request->input('start_date'))) {
            $query->where('date', '>=', Carbon::parse($dateStart)->startOfDay());
        }

        if ($dateEnd = $request->input('dateEnd', $request->input('end_date'))) {
            $query->where('date', '<=', Carbon::parse($dateEnd)->endOfDay());
        }

        $sortField = $request->input('sortField', $request->input('sort_field', 'date'));
        $sortDirection = strtolower($request->input('sortDirection', $request->input('sort_direction', 'desc')));

        $sortMap = [
            'reference' => 'reference',
            'product' => 'product_name',
            'productName' => 'product_name',
            'movementType' => 'movement_type',
            'quantity' => 'quantity',
            'warehouse' => 'warehouse',
            'delegate' => 'delegate_name',
            'status' => 'status',
            'date' => 'date',
            'createdAt' => 'created_at',
        ];

        $column = $sortMap[$sortField] ?? 'date';
        $query->orderBy($column, $sortDirection === 'asc' ? 'asc' : 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 10)));
        $total = (clone $query)->count();
        $items = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => $items->map(fn ($m) => $this->formatMovement($m)),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
        ]);
    }

    public function kpis(): JsonResponse
    {
        $currentStock = (int) Product::sum('stock_quantity');

        $today = now()->startOfDay();
        $incomingToday = (int) StockMovement::where('movement_type', 'incoming')
            ->where('status', 'completed')
            ->where('date', '>=', $today)
            ->sum('quantity');

        $outgoingToday = (int) StockMovement::where('movement_type', 'outgoing')
            ->where('status', 'completed')
            ->where('date', '>=', $today)
            ->sum('quantity');

        $startOfMonth = now()->startOfMonth();
        $transfersCount = StockMovement::where('movement_type', 'transfer')
            ->where('status', 'completed')
            ->where('date', '>=', $startOfMonth)
            ->count();

        $adjustmentsCount = StockMovement::where('movement_type', 'adjustment')
            ->where('status', 'completed')
            ->where('date', '>=', $startOfMonth)
            ->count();

        $lowStockCount = Product::where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<=', DB::raw('min_stock'))
            ->count();

        // 7-day sparklines
        $incomingSparkline = [];
        $outgoingSparkline = [];
        $stockSparkline = [];

        for ($i = 6; $i >= 0; $i--) {
            $day = now()->subDays($i)->toDateString();
            $inc = (int) StockMovement::where('movement_type', 'incoming')
                ->where('status', 'completed')
                ->whereDate('date', $day)
                ->sum('quantity');
            $out = (int) StockMovement::where('movement_type', 'outgoing')
                ->where('status', 'completed')
                ->whereDate('date', $day)
                ->sum('quantity');

            $incomingSparkline[] = $inc;
            $outgoingSparkline[] = $out;
            $stockSparkline[] = $currentStock;
        }

        return response()->json([
            'currentStock' => $currentStock,
            'incomingToday' => $incomingToday,
            'outgoingToday' => $outgoingToday,
            'transfersCount' => $transfersCount,
            'adjustmentsCount' => $adjustmentsCount,
            'lowStockCount' => $lowStockCount,
            'trends' => [
                'currentStock' => 3.5,
                'incomingToday' => 8.2,
                'outgoingToday' => -2.1,
                'transfersCount' => 0.0,
                'adjustmentsCount' => 0.0,
                'lowStockCount' => 0.0,
            ],
            'sparklines' => [
                'currentStock' => $stockSparkline,
                'incomingToday' => $incomingSparkline,
                'outgoingToday' => $outgoingSparkline,
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        // Summary counts of movements
        $incoming = (int) StockMovement::where('movement_type', 'incoming')->sum('quantity');
        $outgoing = (int) StockMovement::where('movement_type', 'outgoing')->sum('quantity');
        $transfers = StockMovement::where('movement_type', 'transfer')->count();
        $adjustments = StockMovement::where('movement_type', 'adjustment')->count();

        // Low stock alerts from real Products table
        $lowStock = Product::where('stock_quantity', '<=', DB::raw('min_stock'))
            ->orderByRaw('stock_quantity / NULLIF(min_stock, 0) asc')
            ->limit(6)
            ->get()
            ->map(function ($p) {
                $ratio = $p->min_stock > 0 ? ($p->stock_quantity / $p->min_stock) : 0;
                $severity = $ratio <= 0.2 ? 'critical' : ($ratio <= 0.5 ? 'warning' : 'low');
                return [
                    'id' => (string) $p->id,
                    'product' => $p->name,
                    'currentStock' => (int) $p->stock_quantity,
                    'minimumStock' => (int) $p->min_stock,
                    'warehouse' => $p->warehouse ?: 'Main Warehouse',
                    'severity' => $severity,
                ];
            });

        // Warehouses distribution from products and movements
        $palette = ['#22C55E', '#2563EB', '#6366F1', '#F59E0B', '#EF4444', '#14B8A6'];
        $warehouses = Product::select('warehouse', DB::raw('SUM(stock_quantity) as total_units'))
            ->whereNotNull('warehouse')
            ->where('warehouse', '!=', '')
            ->groupBy('warehouse')
            ->orderByDesc('total_units')
            ->get()
            ->values()
            ->map(function ($w, $idx) use ($palette) {
                $maxCap = max(10000, (int) $w->total_units * 1.3);
                $utilization = min(100, (int) round(($w->total_units / $maxCap) * 100));
                return [
                    'name' => $w->warehouse,
                    'utilization' => $utilization,
                    'color' => $palette[$idx % count($palette)],
                ];
            });

        if ($warehouses->isEmpty()) {
            $warehouses = collect([
                ['name' => 'Main Warehouse', 'utilization' => 75, 'color' => '#22C55E'],
            ]);
        }

        return response()->json([
            'summary' => [
                'incoming' => $incoming,
                'outgoing' => $outgoing,
                'transfers' => $transfers,
                'adjustments' => $adjustments,
            ],
            'lowStock' => $lowStock,
            'warehouses' => $warehouses,
        ]);
    }

    public function filterOptions(): JsonResponse
    {
        $warehousesFromProducts = Product::whereNotNull('warehouse')
            ->where('warehouse', '!=', '')
            ->distinct()
            ->pluck('warehouse');

        $warehousesFromMovements = StockMovement::whereNotNull('warehouse')
            ->distinct()
            ->pluck('warehouse');

        $warehouses = $warehousesFromProducts
            ->concat($warehousesFromMovements)
            ->unique()
            ->filter()
            ->values();

        $delegates = User::where('role', 'delegate')
            ->pluck('name')
            ->concat(StockMovement::whereNotNull('delegate_name')->distinct()->pluck('delegate_name'))
            ->unique()
            ->filter()
            ->values();

        $products = Product::select('id', 'name', 'code', 'warehouse', 'stock_quantity')
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => (string) $p->id,
                'name' => $p->name,
                'code' => $p->code,
                'warehouse' => $p->warehouse ?: 'Main Warehouse',
                'currentStock' => (int) $p->stock_quantity,
            ]);

        return response()->json([
            'warehouses' => $warehouses,
            'delegates' => $delegates,
            'movementTypes' => ['incoming', 'outgoing', 'transfer', 'adjustment'],
            'statuses' => ['completed', 'pending', 'in_transit', 'cancelled'],
            'products' => $products,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'movement_type' => 'required|in:incoming,outgoing,transfer,adjustment',
            'quantity' => 'required|integer|min:1',
            'warehouse' => 'required|string|max:100',
            'destination_warehouse' => 'nullable|string|max:100',
            'delegate_name' => 'nullable|string|max:150',
            'status' => 'nullable|in:completed,pending,in_transit,cancelled',
            'notes' => 'nullable|string|max:1000',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $status = $validated['status'] ?? 'completed';
        $qty = (int) $validated['quantity'];

        // Auto-generate sequential reference STK-YYYY-XXXX
        $year = now()->year;
        $count = StockMovement::whereYear('created_at', $year)->count() + 1;
        $reference = sprintf('STK-%d-%04d', $year, $count);

        $delegateName = $validated['delegate_name']
            ?? auth()->user()?->name
            ?? 'Admin System';

        $movement = StockMovement::create([
            'reference' => $reference,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'movement_type' => $validated['movement_type'],
            'quantity' => $qty,
            'warehouse' => $validated['warehouse'],
            'destination_warehouse' => $validated['destination_warehouse'] ?? null,
            'delegate_name' => $delegateName,
            'user_id' => auth()->id(),
            'status' => $status,
            'date' => now(),
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update product stock if completed
        if ($status === 'completed') {
            if ($validated['movement_type'] === 'incoming') {
                $product->increment('stock_quantity', $qty);
            } elseif ($validated['movement_type'] === 'outgoing') {
                $newStock = max(0, $product->stock_quantity - $qty);
                $product->update(['stock_quantity' => $newStock]);
            } elseif ($validated['movement_type'] === 'adjustment') {
                $product->update(['stock_quantity' => $qty]);
            }
        }

        return response()->json([
            'data' => $this->formatMovement($movement),
            'message' => 'Stock movement recorded successfully',
        ], 201);
    }

    private function formatMovement(StockMovement $m): array
    {
        return [
            'id' => (string) $m->id,
            'reference' => $m->reference,
            'productId' => (string) ($m->product_id ?? ''),
            'product' => $m->product_name,
            'movementType' => $m->movement_type,
            'quantity' => (int) $m->quantity,
            'warehouse' => $m->warehouse,
            'destinationWarehouse' => $m->destination_warehouse ?: null,
            'delegate' => $m->delegate_name ?: 'System',
            'status' => $m->status,
            'date' => $m->date ? $m->date->toIso8601String() : now()->toIso8601String(),
            'notes' => $m->notes ?: null,
        ];
    }
}
