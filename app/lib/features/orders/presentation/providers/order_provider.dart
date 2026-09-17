import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../domain/entities/client.dart';
import '../../domain/entities/order_item.dart';
import '../../domain/entities/product.dart';

// Selected client (null by default)
final selectedClientProvider = StateProvider<Client?>((ref) => null);

// Current step (0=client, 1=products, 2=confirmation)
final currentStepProvider = StateProvider<int>((ref) => 0);

// Order items (empty by default)
final orderItemsProvider =
    StateNotifierProvider<OrderItemsNotifier, List<OrderItem>>((ref) {
  return OrderItemsNotifier();
});

class OrderItemsNotifier extends StateNotifier<List<OrderItem>> {
  OrderItemsNotifier() : super([]);

  void addProduct(Product product, int quantity, {double? customDiscountPercent}) {
    final existing = state.indexWhere((i) => i.product.id == product.id);
    if (existing >= 0) return;
    if (product.isOutOfStock) return;
    final validQty = product.hasStockLimit && product.stockQuantity != null
        ? quantity.clamp(1, product.stockQuantity!)
        : (quantity < 1 ? 1 : quantity);
    state = [
      ...state,
      OrderItem(
        product: product,
        quantity: validQty,
        customDiscountPercent: customDiscountPercent ?? 0.0,
      ),
    ];
  }

  void removeProduct(String productId) {
    state = state.where((i) => i.product.id != productId).toList();
  }

  void updateQuantity(String productId, int quantity) {
    state = state.map((item) {
      if (item.product.id == productId) {
        final validQty = item.product.hasStockLimit && item.product.stockQuantity != null
            ? quantity.clamp(1, item.product.stockQuantity!)
            : (quantity < 1 ? 1 : quantity);
        return item.copyWith(quantity: validQty);
      }
      return item;
    }).toList();
  }

  void updateDiscount(String productId, double discountPercent) {
    state = state.map((item) {
      if (item.product.id == productId) {
        return item.copyWith(customDiscountPercent: discountPercent);
      }
      return item;
    }).toList();
  }

  void duplicateProduct(String productId) {
    final item = state.firstWhere((i) => i.product.id == productId);
    final maxQty = item.product.hasStockLimit && item.product.stockQuantity != null
        ? item.product.stockQuantity!
        : 999999999;
    final newQty = (item.quantity * 2).clamp(1, maxQty);
    state = [
      ...state,
      OrderItem(
        product: item.product,
        quantity: newQty,
        customDiscountPercent: item.customDiscountPercent,
      ),
    ];
  }

  void clear() => state = [];
}

// Notes
final orderNotesProvider = StateProvider<String>((ref) => '');

// Summary computed
final orderSummaryProvider = Provider<OrderSummary>((ref) {
  final items = ref.watch(orderItemsProvider);
  final grossSubtotal =
      items.fold(0.0, (sum, item) => sum + (item.product.nominalPrice * item.quantity));
  final discount =
      items.fold(0.0, (sum, item) => sum + item.discountTotal);
  final totalAmountAfterDiscount =
      items.fold(0.0, (sum, item) => sum + item.subtotal);
  final totalQuantity =
      items.fold(0, (sum, item) => sum + item.quantity);

  return OrderSummary(
    productCount: items.length,
    totalQuantity: totalQuantity,
    subtotal: grossSubtotal,
    discount: discount,
    totalAmount: totalAmountAfterDiscount,
  );
});

class OrderSummary {
  final int productCount;
  final int totalQuantity;
  final double subtotal;
  final double discount;
  final double totalAmount;

  const OrderSummary({
    required this.productCount,
    required this.totalQuantity,
    required this.subtotal,
    required this.discount,
    required this.totalAmount,
  });
}

// Validation
final orderValidationProvider = Provider<OrderValidation>((ref) {
  final client = ref.watch(selectedClientProvider);
  final items = ref.watch(orderItemsProvider);

  final hasClient = client != null;
  final hasProducts = items.isNotEmpty;
  final allQuantitiesValid = items.every((i) =>
      i.quantity > 0 &&
      (!i.product.hasStockLimit || i.quantity <= (i.product.stockQuantity ?? i.quantity)));
  final noDuplicates = items.length ==
      items.map((i) => i.product.id).toSet().length;

  return OrderValidation(
    hasClient: hasClient,
    hasProducts: hasProducts,
    allQuantitiesValid: allQuantitiesValid,
    noDuplicates: noDuplicates,
    isValid: hasClient && hasProducts && allQuantitiesValid && noDuplicates,
  );
});

class OrderValidation {
  final bool hasClient;
  final bool hasProducts;
  final bool allQuantitiesValid;
  final bool noDuplicates;
  final bool isValid;

  const OrderValidation({
    required this.hasClient,
    required this.hasProducts,
    required this.allQuantitiesValid,
    required this.noDuplicates,
    required this.isValid,
  });
}

// Loading / submission
final orderSubmittingProvider = StateProvider<bool>((ref) => false);

/// Helper function to submit order directly to Laravel backend DB
Future<Map<String, dynamic>> submitOrderToBackend(WidgetRef ref) async {
  final client = ref.read(selectedClientProvider);
  final items = ref.read(orderItemsProvider);
  final notes = ref.read(orderNotesProvider);

  if (client == null) {
    throw Exception('Veuillez sélectionner un client pour valider la commande.');
  }

  if (items.isEmpty) {
    throw Exception('Veuillez ajouter au moins un produit à la commande.');
  }

  final itemsPayload = items.map((item) {
    return {
      'product_id': item.product.id,
      'product_name': item.product.name,
      'reference': item.product.code,
      'unit_price': item.unitPrice, // Price AFTER discount
      'quantity': item.quantity,
    };
  }).toList();

  final payload = {
    'client_id': client.id,
    'client_name': client.name,
    'region': client.region,
    'wilaya': client.wilaya,
    'notes': notes,
    'items': itemsPayload,
  };

  try {
    final response = await ApiService.post('/orders', body: payload);
    if (response is Map<String, dynamic>) {
      final data = response['data'] as Map<String, dynamic>? ?? response;
      return data;
    }
    return {};
  } catch (e) {
    rethrow;
  }
}
