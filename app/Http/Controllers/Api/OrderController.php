<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Client;
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
        $query = Order::with(['items', 'delegate', 'client.delegate']);

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

        // Fill delegate_name if null or unassigned from relationships
        $transformedItems = collect($orders->items())->map(function ($order) {
            if (empty($order->delegate_name) || strtolower($order->delegate_name) === 'unassigned') {
                $order->delegate_name = $order->delegate?->name 
                    ?? $order->client?->delegate?->name 
                    ?? 'Délégué Commercial';
            }
            return $order;
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

        $balance = (float) Order::whereIn('status', ['validated', 'delivered', 'partially_validated'])->sum('total_amount');
        $monthlyOrdersCount = Order::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
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
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json(['data' => $order]);
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
                'data' => $order->load('items'),
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

                foreach ($order->items as $item) {
                    $matchingVal = collect($validatedItems)->firstWhere('id', $item->id);
                    if ($matchingVal) {
                        $valQty = (int) $matchingVal['quantity'];
                        $item->validated_quantity = $valQty;
                        $item->subtotal = $valQty * $item->unit_price;
                        $item->save();
                    }
                    $effectiveQty = $item->validated_quantity ?? $item->quantity;
                    $totalAmount += $effectiveQty * $item->unit_price;
                }

                $order->total_amount = $totalAmount;
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
                'data' => $order->load('items'),
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
}
