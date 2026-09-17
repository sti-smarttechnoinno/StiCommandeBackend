import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../orders/domain/entities/product.dart';

final productsProvider =
    StateNotifierProvider<ProductsNotifier, ProductsState>((ref) {
  return ProductsNotifier();
});

class ProductsState {
  final List<Product> products;
  final bool isLoading;
  final String? error;
  final String searchQuery;
  final String selectedCategory;

  const ProductsState({
    this.products = const [],
    this.isLoading = false,
    this.error,
    this.searchQuery = '',
    this.selectedCategory = 'Tous',
  });

  ProductsState copyWith({
    List<Product>? products,
    bool? isLoading,
    String? error,
    String? searchQuery,
    String? selectedCategory,
  }) {
    return ProductsState(
      products: products ?? this.products,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategory: selectedCategory ?? this.selectedCategory,
    );
  }
}

class ProductsNotifier extends StateNotifier<ProductsState> {
  ProductsNotifier() : super(const ProductsState()) {
    loadProducts();
  }

  Future<void> loadProducts() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await ApiService.get('/products', queryParams: {'pageSize': '100'});

      List<Product> loaded = [];

      if (response is Map<String, dynamic> && response['data'] is List) {
        final List list = response['data'];
        for (final item in list) {
          if (item is Map<String, dynamic>) {
            loaded.add(Product.fromJson(item));
          }
        }
      }

      // Fallback mock products if DB has no products
      if (loaded.isEmpty) {
        loaded = _getMockProducts();
      }

      state = state.copyWith(
        products: loaded,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        products: _getMockProducts(),
        isLoading: false,
      );
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  Future<void> refresh() async {
    await loadProducts();
  }

  List<Product> _getMockProducts() {
    return const [
      Product(
        id: 'prod_1',
        code: 'PRD-001',
        name: 'SIM Flexi 4G Dual',
        nominalPrice: 1500.0,
        stockQuantity: 450,
      ),
      Product(
        id: 'prod_2',
        code: 'PRD-002',
        name: 'Pack Recharge 5000 DA',
        nominalPrice: 5000.0,
        stockQuantity: 120,
      ),
      Product(
        id: 'prod_3',
        code: 'PRD-003',
        name: 'Terminal Paiement Mobile',
        nominalPrice: 28000.0,
        stockQuantity: 15,
      ),
      Product(
        id: 'prod_4',
        code: 'PRD-004',
        name: 'Carte Data 50 Go',
        nominalPrice: 3200.0,
        stockQuantity: 80,
      ),
      Product(
        id: 'prod_5',
        code: 'PRD-005',
        name: 'Modem Routeur 4G Pro',
        nominalPrice: 14500.0,
        stockQuantity: 28,
      ),
      Product(
        id: 'prod_6',
        code: 'PRD-006',
        name: 'Pack SIM B2B Enterprise',
        nominalPrice: 8900.0,
        stockQuantity: 65,
      ),
    ];
  }
}

// Filtered products provider
final filteredProductsProvider = Provider<List<Product>>((ref) {
  final state = ref.watch(productsProvider);
  final query = state.searchQuery.toLowerCase().trim();

  return state.products.where((p) {
    final matchesQuery = query.isEmpty ||
        p.name.toLowerCase().contains(query) ||
        p.code.toLowerCase().contains(query);

    return matchesQuery;
  }).toList();
});
