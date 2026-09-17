import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../domain/entities/client.dart';
import '../../domain/entities/order.dart';
import '../../domain/entities/order_item.dart';
import '../../domain/entities/product.dart';

// Orders list provider connected to real Laravel database
final ordersProvider =
    StateNotifierProvider<OrdersNotifier, OrdersState>((ref) {
  return OrdersNotifier(ref);
});

class OrdersState {
  final List<Order> orders;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final int page;
  final int pageSize;
  final int total;
  final String? error;

  const OrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.page = 1,
    this.pageSize = 50,
    this.total = 0,
    this.error,
  });

  OrdersState copyWith({
    List<Order>? orders,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    int? page,
    int? pageSize,
    int? total,
    String? error,
  }) {
    return OrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      total: total ?? this.total,
      error: error,
    );
  }
}

class OrdersNotifier extends StateNotifier<OrdersState> {
  final Ref ref;

  OrdersNotifier(this.ref) : super(const OrdersState()) {
    loadOrders();
  }

  void addOrder(Order newOrder) {
    final exists = state.orders.any((o) => o.id == newOrder.id || o.orderNumber == newOrder.orderNumber);
    if (!exists) {
      state = state.copyWith(orders: [newOrder, ...state.orders]);
    }
  }

  List<Order> _parseOrdersList(List list) {
    final List<Order> loaded = [];

    for (final item in list) {
      if (item is Map<String, dynamic>) {
        final orderId = item['id']?.toString() ?? '';
        final orderCode = item['order_code']?.toString() ?? '';
        final clientName = item['client_name']?.toString() ?? 'Client';
        final region = item['region']?.toString() ?? '';
        final wilaya = item['wilaya']?.toString() ?? '';
        final notes = item['notes']?.toString();
        final statusStr = (item['status']?.toString() ?? 'pending').toLowerCase();

        OrderStatus status = OrderStatus.pending;
        if (statusStr == 'validated' || statusStr == 'approved') {
          status = OrderStatus.approved;
        } else if (statusStr == 'partially_validated') {
          status = OrderStatus.partiallyValidated;
        } else if (statusStr == 'delivered') {
          status = OrderStatus.delivered;
        } else if (statusStr == 'preparing') {
          status = OrderStatus.preparing;
        } else if (statusStr == 'cancelled') {
          status = OrderStatus.cancelled;
        } else if (statusStr == 'rejected') {
          status = OrderStatus.rejected;
        }

        final itemsList = (item['items'] as List?)?.map((i) {
          final prodName = i['product_name']?.toString() ?? 'Produit';
          final refCode = i['reference']?.toString() ?? '';
          final qty = (i['quantity'] as num?)?.toInt() ?? 1;
          final price = (i['unit_price'] as num?)?.toDouble() ?? 0.0;
          final rawValQty = (i['validated_quantity'] ?? i['validatedQuantity']) as num?;
          final int validatedQty = (status == OrderStatus.approved || status == OrderStatus.delivered)
              ? qty
              : (rawValQty?.toInt() ?? (status == OrderStatus.partiallyValidated ? 0 : qty));
          final isVirt = i['is_virtual'] == true || i['isVirtual'] == true
              ? true
              : (i['is_virtual'] == false || i['isVirtual'] == false ? false : null);
          final cat = i['category']?.toString() ?? i['category_name']?.toString();

          return OrderItem(
            product: Product(
              id: i['product_id']?.toString() ?? 'p_${DateTime.now().millisecondsSinceEpoch}',
              name: prodName,
              code: refCode,
              nominalPrice: price,
              category: cat,
              isVirtualOverride: isVirt,
              stockQuantity: 999,
            ),
            quantity: qty,
            validatedQuantity: validatedQty,
          );
        }).toList() ?? [];

        final clientId = item['client_id']?.toString() ?? '';
        final clientMap = item['client'] as Map<String, dynamic>?;

        final clientCode = clientMap?['code']?.toString() ??
            clientMap?['client_code']?.toString() ??
            (clientId.isNotEmpty ? 'CLI-${clientId.substring(0, clientId.length.clamp(0, 6))}' : 'CLI-001');

        final clientAddress = clientMap?['address']?.toString() ??
            item['client_address']?.toString() ??
            item['address']?.toString() ??
            '';

        final clientPhone = clientMap?['phone']?.toString() ??
            item['client_phone']?.toString() ??
            item['phone']?.toString() ??
            '';

        final clientObj = Client(
          id: clientId.isNotEmpty ? clientId : (clientMap?['id']?.toString() ?? 'CLI-001'),
          code: clientCode,
          name: clientName,
          region: region.isNotEmpty ? region : (clientMap?['region']?.toString() ?? 'Centre Est'),
          wilaya: wilaya.isNotEmpty ? wilaya : (clientMap?['wilaya']?.toString() ?? 'Sétif'),
          address: clientAddress,
          phone: clientPhone,
        );

        final createdAtStr = item['created_at']?.toString();
        final createdAt = createdAtStr != null ? (DateTime.tryParse(createdAtStr) ?? DateTime.now()) : DateTime.now();

        final rawTotal = (item['total_amount'] as num?)?.toDouble() ??
            (item['subtotal'] as num?)?.toDouble();

        loaded.add(
          Order(
            id: orderId,
            orderNumber: orderCode,
            client: clientObj,
            items: itemsList,
            notes: notes,
            status: status,
            createdAt: createdAt,
            updatedAt: createdAt,
            rawTotalAmount: rawTotal,
          ),
        );
      }
    }
    return loaded;
  }

  Future<void> loadOrders({bool isRefresh = false}) async {
    if (state.isLoading) return;

    state = state.copyWith(
      isLoading: true,
      error: null,
      page: 1,
    );

    try {
      final response = await ApiService.get('/orders', queryParams: {
        'page': '1',
        'pageSize': state.pageSize.toString(),
      });

      List<Order> loadedOrders = [];
      int total = 0;
      int totalPages = 1;

      if (response is Map<String, dynamic>) {
        if (response['data'] is List) {
          loadedOrders = _parseOrdersList(response['data'] as List);
        }
        total = (response['total'] as num?)?.toInt() ?? loadedOrders.length;
        totalPages = (response['totalPages'] as num?)?.toInt() ?? 1;
      }

      state = state.copyWith(
        orders: loadedOrders,
        isLoading: false,
        page: 1,
        total: total,
        hasMore: 1 < totalPages,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.page + 1;
      final response = await ApiService.get('/orders', queryParams: {
        'page': nextPage.toString(),
        'pageSize': state.pageSize.toString(),
      });

      List<Order> newOrders = [];
      int totalPages = 1;

      if (response is Map<String, dynamic>) {
        if (response['data'] is List) {
          newOrders = _parseOrdersList(response['data'] as List);
        }
        totalPages = (response['totalPages'] as num?)?.toInt() ?? 1;
      }

      // Merge avoiding duplicates
      final existingIds = state.orders.map((o) => o.id).toSet();
      final merged = [
        ...state.orders,
        ...newOrders.where((o) => !existingIds.contains(o.id)),
      ];

      state = state.copyWith(
        orders: merged,
        isLoadingMore: false,
        page: nextPage,
        hasMore: nextPage < totalPages,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  Future<void> refresh() async {
    await loadOrders(isRefresh: true);
  }
}

// Selected month for filtering orders. Defaults to the current month.
// If null, displays all orders across all months.
final selectedMonthProvider = StateProvider<DateTime?>((ref) {
  final now = DateTime.now();
  return DateTime(now.year, now.month, 1);
});

// Month-scoped orders provider
final monthOrdersProvider = Provider<List<Order>>((ref) {
  final orders = ref.watch(ordersProvider).orders;
  final selectedMonth = ref.watch(selectedMonthProvider);

  if (selectedMonth == null) {
    return orders;
  }

  return orders.where((order) {
    return order.createdAt.year == selectedMonth.year &&
        order.createdAt.month == selectedMonth.month;
  }).toList();
});

// Search query provider
final searchQueryProvider = StateProvider<String>((ref) => '');

// Active status filter provider
final activeStatusFilterProvider = StateProvider<OrderStatus?>((ref) => null);

// Filtered orders provider (month -> status -> search query)
final filteredOrdersProvider = Provider<List<Order>>((ref) {
  final orders = ref.watch(monthOrdersProvider);
  final query = ref.watch(searchQueryProvider).toLowerCase();
  final statusFilter = ref.watch(activeStatusFilterProvider);

  var filtered = orders;

  // 1. Filter by status if selected
  if (statusFilter != null) {
    filtered = filtered.where((o) => o.status == statusFilter).toList();
  }

  // 2. Filter by search query
  if (query.isNotEmpty) {
    filtered = filtered.where((o) {
      return o.orderNumber.toLowerCase().contains(query) ||
          o.client.name.toLowerCase().contains(query) ||
          o.client.wilaya.toLowerCase().contains(query) ||
          o.client.region.toLowerCase().contains(query) ||
          o.items.any((i) => i.product.name.toLowerCase().contains(query));
    }).toList();
  }

  return filtered;
});

// Statistics provider computed from month orders
final ordersStatisticsProvider = Provider<OrdersStatsData>((ref) {
  final orders = ref.watch(monthOrdersProvider);

  final total = orders.length;
  final pending = orders.where((o) => o.status == OrderStatus.pending).length;
  final approved = orders.where((o) => o.status == OrderStatus.approved || o.status == OrderStatus.delivered).length;
  final totalAmount = orders.fold(0.0, (sum, o) => sum + o.totalAmount);

  return OrdersStatsData(
    total: total,
    pending: pending,
    approved: approved,
    totalAmount: totalAmount,
  );
});

class OrdersStatsData {
  final int total;
  final int pending;
  final int approved;
  final double totalAmount;

  const OrdersStatsData({
    required this.total,
    required this.pending,
    required this.approved,
    required this.totalAmount,
  });
}
