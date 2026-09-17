<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryNote;
use App\Models\DeliveryNoteItem;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DeliveryNoteController extends Controller
{
    /**
     * Display a listing of delivery notes with filters & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryNote::with(['items', 'client', 'delegate', 'order']);

        $authUser = auth('sanctum')->user() ?: $request->user();
        $query->forUser($authUser);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('delivery_note_code', 'like', "%{$search}%")
                  ->orWhere('order_code', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('delegate_name', 'like', "%{$search}%")
                  ->orWhere('wilaya', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($type = $request->query('validation_type')) {
            if ($type !== 'all') {
                $query->where('validation_type', $type);
            }
        }

        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $query->where('region', $region);
            }
        }

        if ($orderId = $request->query('order_id')) {
            $query->where('order_id', $orderId);
        }

        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $sortField = $request->query('sortField', 'created_at');
        $sortDirection = strtolower($request->query('sortDirection', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['created_at', 'delivery_note_code', 'order_code', 'client_name', 'total_amount', 'total_quantity', 'status'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $pageSize = max(1, min(100, (int) $request->query('pageSize', 10)));
        $paginated = $query->paginate($pageSize);

        return response()->json([
            'data' => $paginated->items(),
            'total' => $paginated->total(),
            'page' => $paginated->currentPage(),
            'pageSize' => $paginated->perPage(),
            'totalPages' => $paginated->lastPage(),
        ]);
    }

    /**
     * Compute summary KPIs for delivery notes dashboard.
     */
    public function kpis(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $baseQuery = DeliveryNote::query()->forUser($authUser);

        $now = now();
        $todayStart = $now->copy()->startOfDay();
        $yesterdayStart = $now->copy()->subDay()->startOfDay();
        $yesterdayEnd = $now->copy()->subDay()->endOfDay();

        $totalCount = (clone $baseQuery)->count();
        $deliveredCount = (clone $baseQuery)->where('status', 'delivered')->count();
        $inTransitCount = (clone $baseQuery)->where('status', 'in_transit')->count();
        $totalAmount = (float) (clone $baseQuery)->sum('total_amount');
        $partialCount = (clone $baseQuery)->where('validation_type', 'partial')->count();
        $fullCount = (clone $baseQuery)->where('validation_type', 'full')->count();

        // Daily growth calculations
        $todayCount = (clone $baseQuery)->where('created_at', '>=', $todayStart)->count();
        $yesterdayCount = (clone $baseQuery)->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->count();
        $countGrowth = $yesterdayCount > 0 
            ? round((($todayCount - $yesterdayCount) / $yesterdayCount) * 100, 1) 
            : 0.0;

        $todayDelivered = (clone $baseQuery)->where('created_at', '>=', $todayStart)->where('status', 'delivered')->count();
        $yesterdayDelivered = (clone $baseQuery)->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->where('status', 'delivered')->count();
        $deliveredGrowth = $yesterdayDelivered > 0 
            ? round((($todayDelivered - $yesterdayDelivered) / $yesterdayDelivered) * 100, 1) 
            : 0.0;

        // 7-day sparklines
        $totalSparkline = [];
        $deliveredSparkline = [];
        $inTransitSparkline = [];
        $amountSparkline = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayTotal = (clone $baseQuery)->whereDate('created_at', $date->toDateString())->count();
            $dayDelivered = (clone $baseQuery)->whereDate('created_at', $date->toDateString())->where('status', 'delivered')->count();
            $dayInTransit = (clone $baseQuery)->whereDate('created_at', $date->toDateString())->where('status', 'in_transit')->count();
            $dayAmount = (float) (clone $baseQuery)->whereDate('created_at', $date->toDateString())->sum('total_amount');

            $totalSparkline[] = $dayTotal;
            $deliveredSparkline[] = $dayDelivered;
            $inTransitSparkline[] = $dayInTransit;
            $amountSparkline[] = round($dayAmount, 2);
        }

        return response()->json([
            'totalDeliveryNotes' => $totalCount,
            'deliveredCount' => $deliveredCount,
            'inTransitCount' => $inTransitCount,
            'totalAmount' => round($totalAmount, 2),
            'partialCount' => $partialCount,
            'fullCount' => $fullCount,
            'countGrowth' => $countGrowth,
            'deliveredGrowth' => $deliveredGrowth,
            'totalSparkline' => $totalSparkline,
            'deliveredSparkline' => $deliveredSparkline,
            'inTransitSparkline' => $inTransitSparkline,
            'amountSparkline' => $amountSparkline,
        ]);
    }

    /**
     * Display a single delivery note.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $deliveryNote = DeliveryNote::with(['items', 'client', 'delegate', 'order.items'])
            ->where('id', $id)
            ->first();

        if (!$deliveryNote) {
            return response()->json(['message' => 'Bon de livraison introuvable.'], 404);
        }

        $authUser = auth('sanctum')->user() ?: $request->user();
        if ($authUser && $authUser->isRestrictedByRegion()) {
            $allowed = DeliveryNote::query()->forUser($authUser)->where('id', $id)->exists();
            if (!$allowed) {
                return response()->json(['message' => 'Accès non autorisé à ce bon de livraison.'], 403);
            }
        }

        return response()->json(['data' => $deliveryNote]);
    }

    /**
     * Update delivery note status (e.g. from in_transit to delivered).
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:pending,in_transit,delivered,cancelled',
            'notes' => 'nullable|string',
        ]);

        $deliveryNote = DeliveryNote::find($id);
        if (!$deliveryNote) {
            return response()->json(['message' => 'Bon de livraison introuvable.'], 404);
        }

        $status = $request->input('status');
        $deliveryNote->status = $status;
        if ($status === 'delivered' && !$deliveryNote->delivered_at) {
            $deliveryNote->delivered_at = now();
        }
        if ($request->has('notes')) {
            $deliveryNote->notes = $request->input('notes');
        }
        $deliveryNote->save();

        // If this BL is marked delivered and its source order has all BLs delivered, ensure order status and all items are validated
        if ($status === 'delivered' && $deliveryNote->order_id) {
            $order = Order::with(['deliveryNotes', 'items.product'])->find($deliveryNote->order_id);
            if ($order) {
                $allDelivered = $order->deliveryNotes->every(function ($dn) {
                    return $dn->status === 'delivered';
                });
                if ($allDelivered) {
                    $isVirtualOnly = ($order->workflow_type === 'virtual') || (
                        $order->items->isNotEmpty() && $order->items->every(function ($i) {
                            $cat = strtolower($i->product?->category ?? '');
                            $name = strtolower($i->product_name ?? '');
                            return str_contains($cat, 'credit') || str_contains($cat, 'recharge') || str_contains($name, 'recharge') || str_contains($name, 'credit');
                        })
                    );
                    $targetOrderStatus = $isVirtualOnly ? 'validated' : 'delivered';
                    $order->update(['status' => $targetOrderStatus]);
                    foreach ($order->items as $item) {
                        if ((int) ($item->validated_quantity ?? 0) < (int) $item->quantity) {
                            $item->validated_quantity = $item->quantity;
                            $item->subtotal = $item->quantity * $item->unit_price;
                            $item->save();
                        }
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Statut du bon de livraison mis à jour.',
            'data' => $deliveryNote->fresh(['items', 'client', 'delegate', 'order']),
        ]);
    }

    /**
     * Store a newly created delivery note (manual or from existing order).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'nullable|uuid|exists:orders,id',
            'order_code' => 'nullable|string',
            'client_id' => 'nullable|integer',
            'client_name' => 'required|string',
            'delegate_id' => 'nullable|integer',
            'delegate_name' => 'nullable|string',
            'region' => 'required|string',
            'wilaya' => 'required|string',
            'delivery_address' => 'nullable|string',
            'validation_type' => 'nullable|string|in:full,partial',
            'status' => 'nullable|string|in:pending,in_transit,delivered,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer',
            'items.*.order_item_id' => 'nullable|uuid',
            'items.*.product_name' => 'required|string',
            'items.*.reference' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.is_gift' => 'nullable|boolean',
            'items.*.notes' => 'nullable|string',
        ]);

        $authUser = auth('sanctum')->user() ?: $request->user();

        // Check regional restriction if applicable
        if ($authUser && $authUser->isRestrictedByRegion()) {
            $assignedRegion = strtolower(trim($authUser->region ?? ''));
            $assignedWilayas = array_map('strtolower', array_map('trim', $authUser->getAssignedRegionWilayas()));
            $reqRegion = strtolower(trim($request->input('region', '')));
            $reqWilaya = strtolower(trim($request->input('wilaya', '')));

            $isAllowed = false;
            if (!empty($assignedRegion) && $assignedRegion === $reqRegion) {
                $isAllowed = true;
            }
            if (!empty($assignedWilayas) && in_array($reqWilaya, $assignedWilayas, true)) {
                $isAllowed = true;
            }
            if (!$isAllowed && $request->input('delegate_id') == $authUser->id) {
                $isAllowed = true;
            }
            if (!$isAllowed) {
                return response()->json(['message' => 'Non autorisé pour cette région / wilaya.'], 403);
            }
        }

        $itemsData = $request->input('items');
        $totalQuantity = 0;
        $totalAmount = 0.0;

        foreach ($itemsData as $it) {
            $qty = (int) $it['quantity'];
            $isGift = !empty($it['is_gift']);
            $discountPercent = isset($it['discount_percent']) ? (float) $it['discount_percent'] : 0.0;
            $rawPrice = (float) $it['unit_price'];

            $netPrice = $isGift ? 0.0 : round($rawPrice * (1 - ($discountPercent / 100)), 2);
            $subtotal = round($qty * $netPrice, 2);

            $totalQuantity += $qty;
            $totalAmount += $subtotal;
        }

        $orderId = $request->input('order_id');
        $order = $orderId ? Order::with('items')->find($orderId) : null;
        $orderCode = $order ? $order->order_code : ($request->input('order_code') ?: 'DIRECT');
        $batchNumber = 1;
        $validationType = $request->input('validation_type', 'full');

        if ($order) {
            $batchNumber = DeliveryNote::where('order_id', $order->id)->count() + 1;
        }

        $validatorName = $authUser ? $authUser->name : ($request->input('delegate_name') ?: 'Administrateur');

        $deliveryNote = DB::transaction(function () use ($request, $order, $orderCode, $batchNumber, $validationType, $totalQuantity, $totalAmount, $validatorName, $itemsData) {
            $code = DeliveryNote::generateCode();

            $dn = DeliveryNote::create([
                'delivery_note_code' => $code,
                'order_id' => $order?->id,
                'order_code' => $orderCode,
                'client_id' => $request->input('client_id') ?: $order?->client_id,
                'client_name' => $request->input('client_name') ?: $order?->client_name,
                'delegate_id' => $request->input('delegate_id') ?: $order?->delegate_id,
                'delegate_name' => $request->input('delegate_name') ?: $order?->delegate_name,
                'region' => $request->input('region') ?: $order?->region,
                'wilaya' => $request->input('wilaya') ?: $order?->wilaya,
                'delivery_address' => $request->input('delivery_address') ?: $order?->delivery_address,
                'status' => $request->input('status', 'in_transit'),
                'validation_type' => $validationType,
                'batch_number' => $batchNumber,
                'total_quantity' => $totalQuantity,
                'total_amount' => round($totalAmount, 2),
                'validated_by' => $validatorName,
                'validated_at' => now(),
                'notes' => $request->input('notes'),
            ]);

            foreach ($itemsData as $it) {
                $qty = (int) $it['quantity'];
                $isGift = !empty($it['is_gift']);
                $discountPercent = isset($it['discount_percent']) ? (float) $it['discount_percent'] : 0.0;
                $rawPrice = (float) $it['unit_price'];

                $netPrice = $isGift ? 0.0 : round($rawPrice * (1 - ($discountPercent / 100)), 2);
                $subtotal = round($qty * $netPrice, 2);

                DeliveryNoteItem::create([
                    'delivery_note_id' => $dn->id,
                    'order_item_id' => $it['order_item_id'] ?? null,
                    'product_id' => $it['product_id'] ?? null,
                    'product_name' => $it['product_name'],
                    'reference' => $it['reference'] ?? null,
                    'quantity' => $qty,
                    'discount_percent' => $discountPercent,
                    'unit_price' => $netPrice,
                    'subtotal' => $subtotal,
                    'is_gift' => $isGift,
                    'notes' => $it['notes'] ?? null,
                ]);

                // Update order item validated quantity if linked
                if ($order && !empty($it['order_item_id'])) {
                    $orderItem = $order->items->firstWhere('id', $it['order_item_id']);
                    if ($orderItem) {
                        $orderItem->validated_quantity = (int) ($orderItem->validated_quantity ?? 0) + $qty;
                        $orderItem->save();
                    }
                }
            }

            // Adjust parent order status if appropriate
            if ($order) {
                $allValidated = true;
                $order->load('items');
                foreach ($order->items as $oItem) {
                    if ((int) ($oItem->validated_quantity ?? 0) < (int) $oItem->quantity) {
                        $allValidated = false;
                        break;
                    }
                }
                $newStatus = $allValidated ? 'validated' : 'partially_validated';
                if ($order->status !== 'delivered') {
                    $order->update(['status' => $newStatus]);
                }
            }

            return $dn;
        });

        return response()->json([
            'message' => "Bon de livraison {$deliveryNote->delivery_note_code} créé avec succès.",
            'data' => $deliveryNote->load(['items', 'client', 'delegate', 'order']),
        ], 201);
    }
}
