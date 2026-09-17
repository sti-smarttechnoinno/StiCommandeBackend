import 'client.dart';
import 'order_item.dart';

enum OrderStatus { draft, pending, partiallyValidated, approved, rejected, preparing, delivered, cancelled }

class Order {
  final String id;
  final String orderNumber;
  final Client client;
  final List<OrderItem> items;
  final String? notes;
  final OrderStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double? rawTotalAmount;

  const Order({
    required this.id,
    required this.orderNumber,
    required this.client,
    required this.items,
    this.notes,
    this.status = OrderStatus.pending,
    required this.createdAt,
    required this.updatedAt,
    this.rawTotalAmount,
  });

  double get subtotal =>
      items.fold(0, (sum, item) => sum + item.subtotal);

  double get totalDiscount =>
      items.fold(0, (sum, item) => sum + item.discountTotal);

  double get totalAmount =>
      (items.isNotEmpty && subtotal > 0) ? subtotal : (rawTotalAmount ?? subtotal);

  int get totalQuantity =>
      items.fold(0, (sum, item) => sum + item.quantity);

  int get productCount => items.length;

  String get statusLabel {
    switch (status) {
      case OrderStatus.draft:
        return 'Brouillon';
      case OrderStatus.pending:
        return 'En attente';
      case OrderStatus.partiallyValidated:
        return 'Partielle';
      case OrderStatus.approved:
        return 'Validée';
      case OrderStatus.rejected:
        return 'Rejetée';
      case OrderStatus.preparing:
        return 'En préparation';
      case OrderStatus.delivered:
        return isVirtualOnly ? 'Validée' : 'Livrée';
      case OrderStatus.cancelled:
        return 'Annulée';
    }
  }

  bool get isFullyCompleted => status == OrderStatus.approved || status == OrderStatus.delivered;
  bool get isVirtualOnly => items.isNotEmpty && items.every((i) => i.product.isVirtual);
  bool get requiresDelivery => items.isEmpty || items.any((i) => !i.product.isVirtual);
  bool get isMixed => items.any((i) => i.product.isVirtual) && items.any((i) => !i.product.isVirtual);
  bool get isPartial => status == OrderStatus.partiallyValidated;
}
