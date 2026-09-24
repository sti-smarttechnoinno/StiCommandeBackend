import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/client.dart';
import '../../../orders/domain/entities/order.dart';
import '../../../orders/presentation/providers/orders_history_provider.dart';
import 'clients_provider.dart' as main_clients_provider;
import 'client_details_entity.dart';

final clientDetailsProvider =
    Provider.family<ClientDetailsData, String>((ref, clientId) {
  final clients = ref.watch(main_clients_provider.clientsProvider);
  Client? client = clients.where((c) =>
      c.id == clientId ||
      c.code == clientId ||
      (clientId.isNotEmpty && c.id.toString() == clientId.toString())).firstOrNull;
  
  client ??= clients.isNotEmpty
      ? clients.first
      : Client(
          id: clientId,
          code: 'CLT-$clientId',
          name: 'Client Inconnu',
          region: '',
          wilaya: '',
          address: '',
          phone: '',
          customerSince: DateTime.now(),
        );

  final allOrders = ref.watch(ordersProvider).orders;
  final clientOrders = allOrders
      .where((o) => o.client.id == client!.id || o.client.name.toLowerCase() == client.name.toLowerCase())
      .toList()
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

  final products = _computeFrequentProducts(clientOrders);

  return ClientDetailsData(
    client: client,
    recentOrders: clientOrders.take(5).toList(),
    frequentProducts: products,
    delegateNote: client.address.isNotEmpty
        ? 'Adresse: ${client.address}\nTéléphone: ${client.phone}'
        : 'Le client préfère les livraisons après 14h. Paie généralement sous 24h.',
    noteUpdatedAt: DateTime.now().subtract(const Duration(days: 1)),
  );
});

final clientStatisticsProvider =
    Provider.family<ClientStatistics, String>((ref, clientId) {
  final details = ref.watch(clientDetailsProvider(clientId));
  final client = details.client;
  final avgOrder = client.totalOrders > 0
      ? client.totalRevenue / client.totalOrders
      : 0.0;

  return ClientStatistics(
    totalOrders: client.totalOrders,
    totalRevenue: client.totalRevenue,
    averageOrder: avgOrder,
    successRate: 96,
  );
});

List<ClientProduct> _computeFrequentProducts(List<Order> clientOrders) {
  if (clientOrders.isEmpty) {
    return const [];
  }

  final Map<String, _AggregatedProduct> map = {};

  for (final order in clientOrders) {
    for (final item in order.items) {
      final pName = item.product.name.trim();
      if (pName.isEmpty) continue;
      final key = pName.toLowerCase();
      final existing = map[key];

      String operatorName = 'Général';
      if (key.contains('mobilis') || key.contains('mob-') || key.contains('flexy')) {
        operatorName = 'Mobilis';
      } else if (key.contains('djezzy') || key.contains('djz-')) {
        operatorName = 'Djezzy';
      } else if (key.contains('ooredoo') || key.contains('storm') || key.contains('oor-')) {
        operatorName = 'Ooredoo';
      } else if (item.product.category != null && item.product.category!.isNotEmpty) {
        operatorName = item.product.category!;
      }

      final pCode = item.product.code.isNotEmpty
          ? item.product.code
          : 'PRD-${(map.length + 1).toString().padLeft(3, '0')}';
      final itemPrice =
          item.unitPrice > 0 ? item.unitPrice : item.product.nominalPrice;

      if (existing != null) {
        existing.quantity += item.quantity;
        existing.totalSpent += itemPrice * item.quantity;
        if (order.createdAt.isAfter(existing.lastPurchased)) {
          existing.lastPurchased = order.createdAt;
        }
      } else {
        map[key] = _AggregatedProduct(
          name: pName,
          code: pCode,
          operator: operatorName,
          quantity: item.quantity,
          totalSpent: itemPrice * item.quantity,
          lastPurchased: order.createdAt,
        );
      }
    }
  }

  if (map.isEmpty) {
    return const [];
  }

  final sorted = map.values.toList()
    ..sort((a, b) => b.quantity.compareTo(a.quantity));

  return sorted.take(5).map((p) {
    return ClientProduct(
      name: p.name,
      code: p.code,
      operator: p.operator,
      quantityPurchased: p.quantity,
      lastPurchased: p.lastPurchased,
      averagePrice: p.quantity > 0 ? p.totalSpent / p.quantity : 0.0,
    );
  }).toList();
}

class _AggregatedProduct {
  final String name;
  final String code;
  final String operator;
  int quantity;
  double totalSpent;
  DateTime lastPurchased;

  _AggregatedProduct({
    required this.name,
    required this.code,
    required this.operator,
    required this.quantity,
    required this.totalSpent,
    required this.lastPurchased,
  });
}
