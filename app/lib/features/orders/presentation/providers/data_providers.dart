import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../products/presentation/providers/products_provider.dart' as catalog;
import '../../domain/entities/client.dart';
import '../../domain/entities/product.dart';

final clientsProvider = FutureProvider<List<Client>>((ref) async {
  try {
    final response = await ApiService.get('/clients', queryParams: {'pageSize': '100'});
    if (response is Map<String, dynamic> && response['data'] is List) {
      return (response['data'] as List)
          .map((item) => Client.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (response is List) {
      return response.map((item) => Client.fromJson(item as Map<String, dynamic>)).toList();
    }
  } catch (_) {}
  return [];
});

// Reuse the catalog productsProvider so any update in catalogue is instantly reactive in new orders
final productSearchProvider =
    Provider.family<List<Product>, String>((ref, query) {
  final catalogState = ref.watch(catalog.productsProvider);
  final products = catalogState.products;
  if (query.trim().isEmpty) return products;
  final lower = query.trim().toLowerCase();
  return products.where((p) {
    return p.name.toLowerCase().contains(lower) ||
        p.code.toLowerCase().contains(lower) ||
        (p.barcode?.toLowerCase().contains(lower) ?? false);
  }).toList();
});

final clientSearchProvider =
    Provider.family<List<Client>, String>((ref, query) {
  final clients = ref.watch(clientsProvider).valueOrNull ?? [];
  if (query.trim().isEmpty) return clients;
  final lower = query.trim().toLowerCase();
  return clients.where((c) {
    return c.name.toLowerCase().contains(lower) ||
        c.code.toLowerCase().contains(lower) ||
        c.wilaya.toLowerCase().contains(lower);
  }).toList();
});
