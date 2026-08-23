<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($search = $request->input('search')) {
            $q = strtolower($search);
            $query->where(function ($qBuilder) use ($q) {
                $qBuilder->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(code) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(operator) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(category) LIKE ?', ["%{$q}%"])
                    ->orWhere('barcode', 'LIKE', "%{$q}%");
            });
        }

        if ($categories = $request->input('category')) {
            $cats = is_array($categories) ? $categories : explode(',', $categories);
            $query->whereIn('category', $cats);
        }

        if ($operators = $request->input('operator')) {
            $ops = is_array($operators) ? $operators : explode(',', $operators);
            $query->whereIn('operator', $ops);
        }

        if ($stockStatus = $request->input('stockStatus')) {
            if ($stockStatus === 'in_stock') {
                $query->where('stock_quantity', '>', DB::raw('min_stock'));
            } elseif ($stockStatus === 'low_stock') {
                $query->where('stock_quantity', '>', 0)
                    ->where('stock_quantity', '<=', DB::raw('min_stock'));
            } elseif ($stockStatus === 'out_of_stock') {
                $query->where('stock_quantity', '<=', 0);
            }
        }

        if ($productStatuses = $request->input('productStatus')) {
            $statuses = is_array($productStatuses) ? $productStatuses : explode(',', $productStatuses);
            $query->whereIn('status', $statuses);
        }

        if ($startDate = $request->input('dateStart')) {
            $query->where('created_at', '>=', Carbon::parse($startDate)->startOfDay());
        }

        if ($endDate = $request->input('dateEnd')) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        $sortField = $request->input('sortField', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');

        $allowedSorts = [
            'name' => 'name',
            'sku' => 'code',
            'code' => 'code',
            'category' => 'category',
            'price' => 'nominal_price',
            'nominal_price' => 'nominal_price',
            'stock' => 'stock_quantity',
            'stock_quantity' => 'stock_quantity',
            'status' => 'status',
            'createdAt' => 'created_at',
            'created_at' => 'created_at',
        ];

        $column = $allowedSorts[$sortField] ?? 'created_at';
        $query->orderBy($column, strtolower($sortDirection) === 'asc' ? 'asc' : 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 10)));
        $total = (clone $query)->count();
        $products = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => $products->map(fn ($product) => $this->formatProduct($product)),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Handle field casing differences
        if (! $request->has('nominal_price') && $request->has('price')) {
            $request->merge(['nominal_price' => $request->input('price')]);
        }
        if (! $request->has('nominal_price') && $request->has('faceValue')) {
            $request->merge(['nominal_price' => $request->input('faceValue')]);
        }
        if (! $request->has('discount_percent') && $request->has('discountPercent')) {
            $request->merge(['discount_percent' => $request->input('discountPercent')]);
        }
        if (! $request->has('stock_quantity') && $request->has('stock')) {
            $request->merge(['stock_quantity' => $request->input('stock')]);
        }
        if (! $request->has('min_stock') && $request->has('minStock')) {
            $request->merge(['min_stock' => $request->input('minStock')]);
        }
        if (! $request->has('code') && $request->has('sku')) {
            $request->merge(['code' => $request->input('sku')]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100|unique:products,code',
            'barcode' => 'nullable|string|max:100',
            'category' => 'required|string|max:100',
            'operator' => 'required|string|max:100',
            'nominal_price' => 'required|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock' => 'nullable|integer|min:0',
            'status' => 'nullable|string|max:50',
            'warehouse' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = $this->generateProductCode($validated['operator'], $validated['category']);
        }

        $validated['discount_percent'] = $validated['discount_percent'] ?? 0;
        $validated['min_stock'] = $validated['min_stock'] ?? 100;
        $validated['status'] = $validated['status'] ?? ($validated['stock_quantity'] == 0 ? 'out_of_stock' : 'active');

        $product = Product::create($validated);

        return response()->json([
            'data' => $this->formatProduct($product),
            'message' => 'Product created successfully',
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $this->formatProduct($product),
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        if (! $request->has('nominal_price') && $request->has('price')) {
            $request->merge(['nominal_price' => $request->input('price')]);
        }
        if (! $request->has('nominal_price') && $request->has('faceValue')) {
            $request->merge(['nominal_price' => $request->input('faceValue')]);
        }
        if (! $request->has('discount_percent') && $request->has('discountPercent')) {
            $request->merge(['discount_percent' => $request->input('discountPercent')]);
        }
        if (! $request->has('stock_quantity') && $request->has('stock')) {
            $request->merge(['stock_quantity' => $request->input('stock')]);
        }
        if (! $request->has('min_stock') && $request->has('minStock')) {
            $request->merge(['min_stock' => $request->input('minStock')]);
        }
        if (! $request->has('code') && $request->has('sku')) {
            $request->merge(['code' => $request->input('sku')]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:100|unique:products,code,' . $product->id,
            'barcode' => 'nullable|string|max:100',
            'category' => 'sometimes|string|max:100',
            'operator' => 'sometimes|string|max:100',
            'nominal_price' => 'sometimes|numeric|min:0',
            'discount_percent' => 'sometimes|numeric|min:0|max:100',
            'stock_quantity' => 'sometimes|integer|min:0',
            'min_stock' => 'sometimes|integer|min:0',
            'status' => 'sometimes|string|max:50',
            'warehouse' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
        ]);

        $product->update($validated);

        return response()->json([
            'data' => $this->formatProduct($product),
            'message' => 'Product updated successfully',
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }

    public function kpis(): JsonResponse
    {
        $totalProducts = Product::count();
        $activeProducts = Product::where('status', 'active')->count();
        $totalStock = (int) Product::sum('stock_quantity');
        $lowStockCount = Product::where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<=', DB::raw('min_stock'))
            ->count();
        $outOfStockCount = Product::where('stock_quantity', '<=', 0)->count();

        // Catalog valuation (sum of nominal_price * stock_quantity)
        $catalogValue = (float) Product::select(DB::raw('SUM(nominal_price * stock_quantity) as total_val'))->value('total_val');

        return response()->json([
            'totalProducts' => $totalProducts,
            'activeProducts' => $activeProducts,
            'totalStock' => $totalStock,
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
            'catalogValue' => $catalogValue,
            'trends' => [
                'totalProducts' => 0.0,
                'activeProducts' => 0.0,
                'totalStock' => 0.0,
                'catalogValue' => 0.0,
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        $operatorDistribution = Product::select('operator as name', DB::raw('count(*) as value'))
            ->groupBy('operator')
            ->orderByDesc('value')
            ->get();

        $categoryDistribution = Product::select('category as name', DB::raw('count(*) as value'))
            ->groupBy('category')
            ->orderByDesc('value')
            ->get();

        $stockOverview = [
            [
                'status' => 'In Stock',
                'count' => Product::where('stock_quantity', '>', DB::raw('min_stock'))->count(),
            ],
            [
                'status' => 'Low Stock',
                'count' => Product::where('stock_quantity', '>', 0)->where('stock_quantity', '<=', DB::raw('min_stock'))->count(),
            ],
            [
                'status' => 'Out of Stock',
                'count' => Product::where('stock_quantity', '<=', 0)->count(),
            ],
        ];

        return response()->json([
            'operatorDistribution' => $operatorDistribution,
            'categoryDistribution' => $categoryDistribution,
            'stockOverview' => $stockOverview,
        ]);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        $products = Product::whereIn('id', $validated['ids']);

        match ($validated['action']) {
            'activate' => $products->update(['status' => 'active']),
            'deactivate' => $products->update(['status' => 'inactive']),
            'delete' => $products->delete(),
            default => null,
        };

        return response()->json(['message' => 'Bulk action completed successfully']);
    }

    private function formatProduct(Product $product): array
    {
        return [
            'id' => (string) $product->id,
            'sku' => $product->code,
            'code' => $product->code,
            'name' => $product->name,
            'barcode' => $product->barcode ?? '',
            'category' => $product->category,
            'operator' => $product->operator,
            'nominalPrice' => (float) $product->nominal_price,
            'price' => (float) $product->nominal_price, // face value / base price
            'faceValue' => (float) $product->nominal_price,
            'discountPercent' => (float) $product->discount_percent,
            'discountAmount' => (float) $product->discount_amount,
            'sellingPrice' => (float) $product->selling_price, // 9,600 DZD for 10,000 with 4% discount
            'stock' => $product->stock_quantity,
            'stockQuantity' => $product->stock_quantity,
            'minStock' => $product->min_stock,
            'status' => $product->status,
            'reserved' => $product->reserved,
            'warehouse' => $product->warehouse,
            'totalSold' => $product->total_sold,
            'revenue' => (float) $product->revenue,
            'region' => $product->region,
            'createdAt' => $product->created_at?->toISOString() ?? now()->toISOString(),
            'updatedAt' => $product->updated_at?->toISOString() ?? now()->toISOString(),
        ];
    }

    private function generateProductCode(string $operator, string $category): string
    {
        $prefix = strtoupper(substr($operator, 0, 3)) . '-' . strtoupper(substr($category, 0, 3));
        $count = Product::where('code', 'LIKE', "{$prefix}-%")->count();
        return $prefix . '-' . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }
}
