<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Client;
use App\Models\Category;
use App\Models\OrderValidationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Display a listing of orders with filters & pagination.
     */
    public function index(Request $request)
    {
        $query = Order::with(['items.product', 'delegate', 'client.delegate']);

        // Search term (code, client name, delegate name)
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_code', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('delegate_name', 'like', "%{$search}%")
                  ->orWhere('region', 'like', "%{$search}%")
                  ->orWhere('wilaya', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Region filter
        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $query->where('region', $region);
            }
        }

        // Sorting
        $sortField = $request->query('sortField', 'created_at');
        $sortDirection = strtolower($request->query('sortDirection', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $pageSize = (int) $request->query('pageSize', 15);
        $orders = $query->paginate($pageSize);

        // Fill delegate_name and enrich with workflow metadata
        $transformedItems = collect($orders->items())->map(function ($order) {
            if (empty($order->delegate_name) || strtolower($order->delegate_name) === 'unassigned') {
                $order->delegate_name = $order->delegate?->name 
                    ?? $order->client?->delegate?->name 
                    ?? 'Délégué Commercial';
            }
            return $this->enrichOrderWithCategoryWorkflow($order);
        });

        return response()->json([
            'data' => $transformedItems,
            'total' => $orders->total(),
            'page' => $orders->currentPage(),
            'pageSize' => $orders->perPage(),
            'totalPages' => $orders->lastPage(),
        ]);
    }

    /**
     * Get KPI summary analytics for orders.
     */
    public function kpis()
    {
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $validatedOrders = Order::whereIn('status', ['validated', 'partially_validated'])->count();
        $deliveringOrders = Order::where('status', 'preparing')->count();
        $deliveredOrders = Order::where('status', 'delivered')->count();
        $totalRevenue = (float) Order::whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');

        $balance = (float) Order::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->sum('total_amount');
        $monthlyOrdersCount = Order::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->count();

        $productsOrdered = (int) OrderItem::sum('quantity');

        // Growth calculation comparing today vs yesterday
        $todayStart = now()->startOfDay();
        $yesterdayStart = now()->subDay()->startOfDay();
        $yesterdayEnd = now()->subDay()->endOfDay();

        $todayOrders = Order::where('created_at', '>=', $todayStart)->count();
        $yesterdayOrders = Order::whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->count();
        $ordersGrowth = $yesterdayOrders > 0 
            ? round((($todayOrders - $yesterdayOrders) / $yesterdayOrders) * 100, 1) 
            : 0.0;

        $todayRevenue = (float) Order::where('created_at', '>=', $todayStart)->whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');
        $yesterdayRevenue = (float) Order::whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->whereNotIn('status', ['cancelled', 'rejected'])->sum('total_amount');
        $revenueGrowth = $yesterdayRevenue > 0 
            ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1) 
            : 0.0;

        $todayPending = Order::where('created_at', '>=', $todayStart)->where('status', 'pending')->count();
        $yesterdayPending = Order::whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->where('status', 'pending')->count();
        $pendingGrowth = $yesterdayPending > 0 
            ? round((($todayPending - $yesterdayPending) / $yesterdayPending) * 100, 1) 
            : 0.0;

        $todayValidated = Order::where('created_at', '>=', $todayStart)->whereIn('status', ['validated', 'partially_validated'])->count();
        $yesterdayValidated = Order::whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->whereIn('status', ['validated', 'partially_validated'])->count();
        $validatedGrowth = $yesterdayValidated > 0 
            ? round((($todayValidated - $yesterdayValidated) / $yesterdayValidated) * 100, 1) 
            : 0.0;

        $todayDelivered = Order::where('created_at', '>=', $todayStart)->where('status', 'delivered')->count();
        $yesterdayDelivered = Order::whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->where('status', 'delivered')->count();
        $deliveredGrowth = $yesterdayDelivered > 0 
            ? round((($todayDelivered - $yesterdayDelivered) / $yesterdayDelivered) * 100, 1) 
            : 0.0;

        // Daily 7-day sparklines
        $ordersSparkline = [];
        $revenueSparkline = [];
        $pendingSparkline = [];
        $validatedSparkline = [];
        $deliveredSparkline = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayOrders = Order::whereDate('created_at', $date->toDateString())->count();
            $dayRevenue = (float) Order::whereDate('created_at', $date->toDateString())
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->sum('total_amount');
            $dayPending = Order::whereDate('created_at', $date->toDateString())
                ->where('status', 'pending')
                ->count();
            $dayValidated = Order::whereDate('created_at', $date->toDateString())
                ->whereIn('status', ['validated', 'partially_validated'])
                ->count();
            $dayDelivered = Order::whereDate('created_at', $date->toDateString())
                ->where('status', 'delivered')
                ->count();

            $ordersSparkline[] = $dayOrders;
            $revenueSparkline[] = round($dayRevenue, 2);
            $pendingSparkline[] = $dayPending;
            $validatedSparkline[] = $dayValidated;
            $deliveredSparkline[] = $dayDelivered;
        }

        // Real Active Month Objective from DB
        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;
        $monthNamesFr = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];

        $delegateObjective = \App\Models\DelegateObjective::where('year', $currentYear)
            ->where('month', $currentMonth)
            ->first();

        $monthStartDate = now()->startOfMonth();
        $monthEndDate = now()->endOfMonth();

        $monthlyOrders = Order::whereBetween('created_at', [$monthStartDate, $monthEndDate])
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->with(['items.product'])
            ->get();

        $achievedMonthlyOrders = $monthlyOrders->count();
        $achievedMonthlyRevenue = 0.0;

        foreach ($monthlyOrders as $ord) {
            if ($ord->items->isNotEmpty()) {
                foreach ($ord->items as $item) {
                    $nominalPrice = (float) ($item->product?->nominal_price ?? $item->unit_price);
                    $qty = (int) ($item->quantity ?? 1);
                    $achievedMonthlyRevenue += ($nominalPrice * $qty);
                }
            } else {
                $achievedMonthlyRevenue += (float) $ord->total_amount;
            }
        }

        $targetRevenue = $delegateObjective ? (float) $delegateObjective->target_revenue : 2500000.0;
        $targetOrders = $delegateObjective ? (int) $delegateObjective->target_orders : 40;

        $revenuePercentage = $targetRevenue > 0
            ? round(($achievedMonthlyRevenue / $targetRevenue) * 100, 1)
            : ($achievedMonthlyRevenue > 0 ? 100.0 : 0.0);

        $objectivePayload = [
            'monthName' => ($monthNamesFr[$currentMonth] ?? "Mois $currentMonth") . " $currentYear",
            'targetRevenue' => $targetRevenue,
            'achievedRevenue' => round($achievedMonthlyRevenue, 2),
            'remainingRevenue' => max(0, round($targetRevenue - $achievedMonthlyRevenue, 2)),
            'revenuePercentage' => $revenuePercentage,
            'targetOrders' => $targetOrders,
            'achievedOrders' => $achievedMonthlyOrders,
            'isConfigured' => ($delegateObjective !== null),
        ];

        return response()->json([
            'totalOrders' => $totalOrders,
            'pendingOrders' => $pendingOrders,
            'validatedOrders' => $validatedOrders,
            'deliveringOrders' => $deliveringOrders,
            'deliveredOrders' => $deliveredOrders,
            'totalRevenue' => $totalRevenue,
            'balance' => $balance,
            'monthlyOrdersCount' => $monthlyOrdersCount,
            'productsOrdered' => $productsOrdered,
            'objective' => $objectivePayload,
            'ordersGrowth' => $ordersGrowth,
            'revenueGrowth' => $revenueGrowth,
            'pendingGrowth' => $pendingGrowth,
            'validatedGrowth' => $validatedGrowth,
            'deliveredGrowth' => $deliveredGrowth,
            'ordersSparkline' => $ordersSparkline,
            'revenueSparkline' => $revenueSparkline,
            'pendingSparkline' => $pendingSparkline,
            'validatedSparkline' => $validatedSparkline,
            'deliveredSparkline' => $deliveredSparkline,
        ]);
    }

    /**
     * Display single order details.
     */
    public function show($id)
    {
        $order = Order::with(['items.product', 'client', 'delegate', 'validationLogs'])
            ->where('id', $id)
            ->orWhere('order_code', $id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Auto-synthesize past validation log for existing orders with validation history
        if ($order->validationLogs->isEmpty() && ($order->status === 'partially_validated' || $order->status === 'validated')) {
            $totalValQty = 0;
            $totalValAmt = 0;
            $itemsPayload = [];
            foreach ($order->items as $item) {
                $vQty = $item->validated_quantity ?? ($order->status === 'validated' ? $item->quantity : 0);
                if ($vQty > 0) {
                    $totalValQty += $vQty;
                    $sub = $vQty * $item->unit_price;
                    $totalValAmt += $sub;
                    $itemsPayload[] = [
                        'item_id' => $item->id,
                        'product_name' => $item->product_name,
                        'reference' => $item->reference,
                        'quantity_validated' => $vQty,
                        'cumulative_quantity' => $vQty,
                        'ordered_quantity' => $item->quantity,
                        'remaining_quantity' => max(0, $item->quantity - $vQty),
                        'unit_price' => $item->unit_price,
                        'subtotal' => $sub,
                    ];
                }
            }
            if ($totalValQty > 0) {
                try {
                    OrderValidationLog::create([
                        'order_id' => $order->id,
                        'batch_number' => 1,
                        'status' => $order->status,
                        'validated_by' => $order->delegate_name ?: 'Délégué Commercial',
                        'total_quantity' => $totalValQty,
                        'total_amount' => $totalValAmt,
                        'items_payload' => $itemsPayload,
                        'notes' => 'Validation initiale enregistrée',
                        'created_at' => $order->updated_at ?: $order->created_at,
                        'updated_at' => $order->updated_at ?: $order->created_at,
                    ]);
                    $order->load('validationLogs');
                } catch (\Throwable $e) {
                    // Ignore duplicate race conditions
                }
            }
        }

        return response()->json(['data' => $this->enrichOrderWithCategoryWorkflow($order)]);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'client_id' => 'nullable|string',
            'client_name' => 'required_without:client_id|nullable|string',
            'delegate_id' => 'nullable|string',
            'delegate_name' => 'nullable|string',
            'region' => 'nullable|string',
            'wilaya' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|string',
            'items.*.product_name' => 'required_without:items.*.product_id|nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
        ]);

        // Resolve client & delegate details
        $clientName = $request->input('client_name');
        $wilaya = $request->input('wilaya');
        $region = $request->input('region', 'Algiers');
        
        $user = $request->user();
        $delegateName = $request->input('delegate_name') 
            ?? ($user ? $user->name : null);

        if ($clientId = $request->input('client_id')) {
            $client = Client::with('delegate')->find($clientId);
            if ($client) {
                $clientName = $client->name;
                $wilaya = $client->wilaya ?? $wilaya;
                $region = $client->region ?? $region;
                if (!$delegateName || strtolower($delegateName) === 'unassigned') {
                    $delegateName = $client->delegate?->name ?? $client->delegate_name;
                }
            }
        }

        if (!$delegateName || strtolower($delegateName) === 'unassigned') {
            $delegateName = 'Délégué Commercial';
        }

        if (empty($clientName)) {
            return response()->json([
                'message' => 'Un client valide doit être sélectionné.',
                'errors' => ['client' => ['Le client est obligatoire pour valider la commande.']],
            ], 422);
        }

        // Sequential code generation
        $nextNum = Order::count() + 1;
        $orderCode = sprintf('ORD-2026-%06d', $nextNum);

        DB::beginTransaction();

        try {
            $totalAmount = 0;
            $orderItemsData = [];

            foreach ($request->input('items') as $item) {
                $productId = $item['product_id'] ?? null;
                $productName = $item['product_name'] ?? 'Produit';
                $reference = $item['reference'] ?? null;
                $unitPrice = (float) ($item['unit_price'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 1);

                // Fetch product from DB to ensure accurate price & stock reduction
                if ($productId) {
                    $dbProduct = Product::find($productId);
                    if ($dbProduct) {
                        $productName = $dbProduct->name;
                        $reference = $dbProduct->sku ?? $reference;
                        if ($unitPrice <= 0) {
                            $unitPrice = (float) $dbProduct->nominal_price;
                        }

                        // Check stock level
                        if ($dbProduct->stock_quantity < $quantity) {
                            DB::rollBack();
                            return response()->json([
                                'message' => "Stock insuffisant pour le produit \"{$dbProduct->name}\". Stock disponible : {$dbProduct->stock_quantity}",
                                'errors' => ['stock' => ["Stock insuffisant pour {$dbProduct->name}"]],
                            ], 400);
                        }

                        // Deduct stock
                        $dbProduct->decrement('stock_quantity', $quantity);
                    }
                }

                $subtotal = $unitPrice * $quantity;
                $totalAmount += $subtotal;

                $orderItemsData[] = [
                    'product_id' => $productId,
                    'product_name' => $productName,
                    'reference' => $reference,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                ];
            }

            $delegateId = $request->input('delegate_id') ?? ($user ? (string) $user->id : null);
            if (!$delegateId && !empty($client) && $client->delegate_id) {
                $delegateId = (string) $client->delegate_id;
            }

            $order = Order::create([
                'order_code' => $orderCode,
                'client_id' => $request->input('client_id'),
                'client_name' => $clientName,
                'delegate_id' => $delegateId,
                'delegate_name' => $delegateName,
                'region' => $region,
                'wilaya' => $wilaya,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'payment_method' => $request->input('payment_method', 'Cash on Delivery'),
                'notes' => $request->input('notes'),
            ]);

            $order->items()->createMany($orderItemsData);

            // Update client financial stats if client exists
            if (!empty($client)) {
                $client->increment('total_orders');
                $client->increment('total_spent', $totalAmount);
                $client->update(['last_order_date' => now()]);
            }

            // Create system notification for order
            try {
                \App\Models\Notification::create([
                    'title' => "New Order #{$orderCode} submitted",
                    'description' => "Order #{$orderCode} worth " . number_format($totalAmount) . " DA submitted by {$clientName}.",
                    'category' => 'orders',
                    'priority' => $totalAmount >= 50000 ? 'critical' : 'high',
                    'status' => 'unread',
                    'user' => $delegateName,
                    'region' => $region,
                    'module' => 'Orders',
                    'reference_id' => $orderCode,
                    'read' => false,
                ]);
            } catch (\Throwable $e) {
                // Silent catch if notifications table not ready
            }

            DB::commit();

            // Broadcast real-time order creation event to WebSocket Hub
            try {
                \Illuminate\Support\Facades\Http::timeout(2)->post('http://127.0.0.1:8085/broadcast', [
                    'type' => 'ORDER_CREATED',
                    'order' => $order->load('items'),
                ]);
            } catch (\Throwable $e) {
                // Non-blocking broadcast fallback
            }

            return response()->json([
                'message' => 'Commande créée avec succès',
                'data' => $this->enrichOrderWithCategoryWorkflow($order->load(['items.product'])),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement de la commande.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update order status or details with full/partial item validation.
     */
    public function update(Request $request, $id)
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Commande introuvable.'], 404);
        }

        $request->validate([
            'status' => 'nullable|string|in:pending,validated,partially_validated,processing,delivered,cancelled',
            'notes' => 'nullable|string',
            'validated_items' => 'nullable|array',
            'validated_items.*.id' => 'required_with:validated_items|string',
            'validated_items.*.quantity' => 'required_with:validated_items|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            if ($request->has('validated_items')) {
                $validatedItems = $request->input('validated_items');
                $totalAmount = 0;
                $batchItems = [];
                $batchQty = 0;
                $batchAmount = 0;

                foreach ($order->items as $item) {
                    $matchingVal = collect($validatedItems)->firstWhere('id', $item->id);
                    if ($matchingVal) {
                        $oldValQty = (int) ($item->validated_quantity ?? 0);
                        $newValQty = (int) $matchingVal['quantity'];
                        $delta = max(0, $newValQty - $oldValQty);

                        $item->validated_quantity = $newValQty;
                        $item->subtotal = $newValQty * $item->unit_price;
                        $item->save();

                        $qtyAdded = $delta > 0 ? $delta : ($oldValQty === 0 && $newValQty > 0 ? $newValQty : 0);
                        if ($qtyAdded > 0) {
                            $batchQty += $qtyAdded;
                            $subtotalForLog = $qtyAdded * $item->unit_price;
                            $batchAmount += $subtotalForLog;
                            $batchItems[] = [
                                'item_id' => $item->id,
                                'product_name' => $item->product_name,
                                'reference' => $item->reference,
                                'quantity_validated' => $qtyAdded,
                                'cumulative_quantity' => $newValQty,
                                'ordered_quantity' => $item->quantity,
                                'remaining_quantity' => max(0, $item->quantity - $newValQty),
                                'unit_price' => $item->unit_price,
                                'subtotal' => $subtotalForLog,
                            ];
                        }
                    }
                    $effectiveQty = $item->validated_quantity ?? $item->quantity;
                    $totalAmount += $effectiveQty * $item->unit_price;
                }

                $order->total_amount = $totalAmount;

                if (!empty($batchItems)) {
                    $batchNumber = $order->validationLogs()->count() + 1;
                    $user = $request->user();
                    $validatorName = $user ? $user->name : ($order->delegate_name ?: 'Délégué Commercial');

                    OrderValidationLog::create([
                        'order_id' => $order->id,
                        'batch_number' => $batchNumber,
                        'status' => $request->input('status', 'partially_validated'),
                        'validated_by' => $validatorName,
                        'total_quantity' => $batchQty,
                        'total_amount' => $batchAmount,
                        'items_payload' => $batchItems,
                        'notes' => $request->input('notes') ?: "Tranche #{$batchNumber} validée ({$batchQty} unités)",
                    ]);
                }
            }

            if ($request->has('status')) {
                $order->status = $request->input('status');
            }

            if ($request->has('notes')) {
                $order->notes = $request->input('notes');
            }

            $order->save();
            DB::commit();

            return response()->json([
                'message' => 'Commande mise à jour avec succès',
                'data' => $this->enrichOrderWithCategoryWorkflow($order->load(['items.product', 'validationLogs'])),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la validation de la commande.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * cPanel Real-time event stream endpoint.
     * Non-blocking to prevent locking single-threaded PHP workers (php artisan serve / cPanel FPM).
     */
    public function stream(Request $request)
    {
        $since = $request->query('since');
        $query = Order::with('items');

        if ($since) {
            $query->where('created_at', '>', $since);
        } else {
            $query->where('created_at', '>', now()->subSeconds(10));
        }

        $newOrders = $query->orderBy('created_at', 'asc')->get();

        return response()->json([
            'status' => 'ok',
            'server_time' => now()->format('Y-m-d H:i:s'),
            'events' => $newOrders->map(function ($order) {
                return [
                    'type' => 'ORDER_CREATED',
                    'order' => $order,
                ];
            }),
        ], 200, [
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Helper to compute category-based workflow metadata for an order.
     */
    private function enrichOrderWithCategoryWorkflow(Order $order): Order
    {
        $categoriesMap = Category::all()->keyBy('slug');
        $hasVirtual = false;
        $hasPhysical = false;
        $categoriesList = [];

        foreach ($order->items as $item) {
            $catSlug = $item->product?->category ?? 'general';
            $categoryRecord = $categoriesMap->get($catSlug);

            $isVirtual = false;
            if ($categoryRecord) {
                $isVirtual = ($categoryRecord->workflow_type === 'virtual') || !$categoryRecord->requires_delivery;
            } else {
                $lowerCat = strtolower($catSlug);
                $lowerName = strtolower($item->product_name);
                $isVirtual = str_contains($lowerCat, 'credit') 
                    || str_contains($lowerCat, 'recharge')
                    || str_contains($lowerName, 'recharge')
                    || str_contains($lowerName, 'credit');
            }

            $item->category = $catSlug;
            $item->category_name = $categoryRecord?->name ?? ucfirst(str_replace('_', ' ', $catSlug));
            $item->is_virtual = $isVirtual;

            if ($isVirtual) {
                $hasVirtual = true;
            } else {
                $hasPhysical = true;
            }

            if (!in_array($item->category_name, $categoriesList)) {
                $categoriesList[] = $item->category_name;
            }
        }

        $workflowType = 'physical';
        if ($hasVirtual && !$hasPhysical) {
            $workflowType = 'virtual';
        } elseif ($hasVirtual && $hasPhysical) {
            $workflowType = 'mixed';
        }

        $order->has_virtual_items = $hasVirtual;
        $order->has_physical_items = $hasPhysical;
        $order->workflow_type = $workflowType;
        $order->requires_delivery = $hasPhysical;
        $order->categories = $categoriesList;

        return $order;
    }
}
