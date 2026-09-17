import '../../domain/entities/client.dart';
import '../../../orders/domain/entities/order.dart';

class ClientDetailsData {
  final Client client;
  final List<Order> recentOrders;
  final List<ClientProduct> frequentProducts;
  final String? delegateNote;
  final DateTime? noteUpdatedAt;

  const ClientDetailsData({
    required this.client,
    required this.recentOrders,
    required this.frequentProducts,
    this.delegateNote,
    this.noteUpdatedAt,
  });
}

class ClientProduct {
  final String name;
  final String code;
  final String operator;
  final int quantityPurchased;
  final DateTime lastPurchased;
  final double averagePrice;

  const ClientProduct({
    required this.name,
    required this.code,
    required this.operator,
    required this.quantityPurchased,
    required this.lastPurchased,
    required this.averagePrice,
  });
}

class ClientStatistics {
  final int totalOrders;
  final double totalRevenue;
  final double averageOrder;
  final double successRate;

  const ClientStatistics({
    required this.totalOrders,
    required this.totalRevenue,
    required this.averageOrder,
    required this.successRate,
  });
}
