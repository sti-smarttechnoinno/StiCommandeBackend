import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../../domain/entities/client.dart';

// Raw regions provider from DB
final rawRegionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    final response = await ApiService.get('/regions');
    if (response is Map<String, dynamic> && response['data'] is List) {
      return (response['data'] as List).cast<Map<String, dynamic>>();
    }
  } catch (_) {}
  return <Map<String, dynamic>>[];
});

// Raw wilayas provider from DB
final rawWilayasProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    final response = await ApiService.get('/wilayas', queryParams: {'pageSize': '100'});
    if (response is Map<String, dynamic> && response['data'] is List) {
      return (response['data'] as List).cast<Map<String, dynamic>>();
    }
  } catch (_) {}
  return <Map<String, dynamic>>[];
});

// Provider for assigned region of current delegate from DB
final delegateAssignedRegionProvider = Provider<String>((ref) {
  final authState = ref.watch(authProvider);
  final userRegion = authState.assignedRegion;

  final regionsAsync = ref.watch(rawRegionsProvider);
  final regions = regionsAsync.value ?? [];

  if (regions.isNotEmpty) {
    final match = regions.firstWhere(
      (r) =>
          (r['name'] ?? '').toString().toLowerCase() == userRegion.toLowerCase() ||
          (r['code'] ?? '').toString().toLowerCase() == userRegion.toLowerCase() ||
          userRegion.toLowerCase().contains((r['name'] ?? '').toString().toLowerCase()),
      orElse: () => <String, dynamic>{},
    );
    if (match.isNotEmpty && match['name'] != null) {
      return match['name'].toString();
    }
  }

  return userRegion.isNotEmpty ? userRegion : 'Région Centre';
});

// Provider for assigned wilayas strictly from database for this region
final delegateAssignedWilayasProvider = Provider<List<String>>((ref) {
  final authState = ref.watch(authProvider);

  // 1. If explicit wilayas are assigned on the delegate user record in DB
  if (authState.assignedWilayas.isNotEmpty) {
    return authState.assignedWilayas;
  }

  final regionName = ref.watch(delegateAssignedRegionProvider);
  final regionsAsync = ref.watch(rawRegionsProvider);
  final regions = regionsAsync.value ?? [];

  // 2. Look up the region from DB and retrieve its mapped wilayas
  if (regions.isNotEmpty) {
    final match = regions.firstWhere(
      (r) =>
          (r['name'] ?? '').toString().toLowerCase() == regionName.toLowerCase() ||
          (r['code'] ?? '').toString().toLowerCase() == regionName.toLowerCase() ||
          regionName.toLowerCase().contains((r['name'] ?? '').toString().toLowerCase()),
      orElse: () => <String, dynamic>{},
    );

    if (match.isNotEmpty && match['wilayas'] is List) {
      final dbWilayas = (match['wilayas'] as List)
          .map((w) {
            if (w is Map<String, dynamic>) {
              return w['name']?.toString() ?? '';
            }
            return w.toString();
          })
          .where((w) => w.isNotEmpty)
          .toList();

      if (dbWilayas.isNotEmpty) {
        return dbWilayas;
      }
    }
  }

  // 3. Check wilayas table from DB where region_name matches
  final wilayasAsync = ref.watch(rawWilayasProvider);
  final allDbWilayas = wilayasAsync.value ?? [];
  if (allDbWilayas.isNotEmpty) {
    final matchedWilayas = allDbWilayas
        .where((w) {
          final rName = (w['region'] ?? w['region_name'] ?? '').toString().toLowerCase();
          final rCode = (w['region_id'] ?? '').toString().toLowerCase();
          return rName == regionName.toLowerCase() ||
              rCode == regionName.toLowerCase() ||
              regionName.toLowerCase().contains(rName);
        })
        .map((w) => (w['name'] ?? '').toString())
        .where((name) => name.isNotEmpty)
        .toSet()
        .toList();

    if (matchedWilayas.isNotEmpty) {
      return matchedWilayas;
    }
  }

  // 4. Fallback from clients present in this region
  final asyncClients = ref.watch(rawClientsProvider);
  final clients = asyncClients.value ?? [];
  final clientWilayas = clients
      .where((c) =>
          c.region.toLowerCase().contains(regionName.toLowerCase()) ||
          regionName.toLowerCase().contains(c.region.toLowerCase()))
      .map((c) => c.wilaya)
      .where((w) => w.isNotEmpty)
      .toSet()
      .toList();

  if (clientWilayas.isNotEmpty) {
    return clientWilayas;
  }

  // 5. Final fallback to user's direct wilaya if set
  final userWilaya = authState.user?['wilaya']?.toString();
  if (userWilaya != null && userWilaya.isNotEmpty) {
    return [userWilaya];
  }

  return const [];
});

// Raw async clients provider fetching directly from Laravel Backend API
final rawClientsProvider = FutureProvider<List<Client>>((ref) async {
  try {
    final response = await ApiService.get('/clients', queryParams: {'pageSize': '200'});
    if (response is Map<String, dynamic> && response['data'] != null) {
      final list = response['data'] as List;
      return list.map((item) => Client.fromJson(item as Map<String, dynamic>)).toList();
    }
  } catch (_) {
    // Return empty list on network or parse error
  }
  return <Client>[];
});

// Clients assigned to the logged-in delegate or accessible by user
final clientsProvider = Provider<List<Client>>((ref) {
  final asyncClients = ref.watch(rawClientsProvider);
  final allClients = asyncClients.value ?? [];

  if (allClients.isEmpty) return <Client>[];

  final authState = ref.watch(authProvider);
  final delegateId = authState.delegateId;
  final region = authState.assignedRegion;
  final assignedWilayas = authState.assignedWilayas;
  final userRole = (authState.user?['role'] ?? '').toString().toLowerCase();

  // If admin / superadmin / manager, show all clients
  if (userRole.contains('admin') || userRole.contains('manager') || userRole.contains('direction')) {
    return allClients;
  }

  // If delegate user is logged in, filter clients assigned to this delegate
  final filtered = allClients.where((client) {
    final isExplicitlyAssigned = client.delegateId != null &&
        client.delegateId!.isNotEmpty &&
        client.delegateId == delegateId;

    final matchesWilaya = assignedWilayas.isNotEmpty &&
        assignedWilayas.any((w) =>
            client.wilaya.toLowerCase().contains(w.toLowerCase()) ||
            w.toLowerCase().contains(client.wilaya.toLowerCase()));

    final matchesRegion = region.isNotEmpty &&
        client.region.isNotEmpty &&
        (client.region.toLowerCase() == region.toLowerCase() ||
            client.region.toLowerCase().contains(region.toLowerCase()) ||
            region.toLowerCase().contains(client.region.toLowerCase()));

    return isExplicitlyAssigned || matchesWilaya || matchesRegion;
  }).toList();

  return filtered;
});

// Favorites
final favoritesProvider = Provider<List<Client>>((ref) {
  final clients = ref.watch(clientsProvider);
  return clients.where((c) => c.isFavorite).toList();
});

// Search query
final searchQueryProvider = StateProvider<String>((ref) => '');

// Active filter
final clientsFilterProvider = StateProvider<ClientsFilter>((ref) {
  return const ClientsFilter();
});

class ClientsFilter {
  final String? wilaya;
  final BusinessType? businessType;
  final ClientStatus? status;
  final bool? hasDebt;
  final ClientSortBy sortBy;

  const ClientsFilter({
    this.wilaya,
    this.businessType,
    this.status,
    this.hasDebt,
    this.sortBy = ClientSortBy.name,
  });

  ClientsFilter copyWith({
    String? wilaya,
    BusinessType? businessType,
    ClientStatus? status,
    bool? hasDebt,
    ClientSortBy? sortBy,
    bool clearWilaya = false,
    bool clearBusinessType = false,
    bool clearStatus = false,
    bool clearHasDebt = false,
  }) {
    return ClientsFilter(
      wilaya: clearWilaya ? null : (wilaya ?? this.wilaya),
      businessType:
          clearBusinessType ? null : (businessType ?? this.businessType),
      status: clearStatus ? null : (status ?? this.status),
      hasDebt: clearHasDebt ? null : (hasDebt ?? this.hasDebt),
      sortBy: sortBy ?? this.sortBy,
    );
  }

  bool get hasActiveFilters =>
      wilaya != null ||
      businessType != null ||
      status != null ||
      hasDebt != null;
}

enum ClientSortBy { name, recent, orders, revenue }

// Filtered clients
final filteredClientsProvider = Provider<List<Client>>((ref) {
  final clients = ref.watch(clientsProvider);
  final query = ref.watch(searchQueryProvider).toLowerCase();
  final filter = ref.watch(clientsFilterProvider);

  var result = clients;

  // Search
  if (query.isNotEmpty) {
    result = result.where((c) {
      return c.name.toLowerCase().contains(query) ||
          c.code.toLowerCase().contains(query) ||
          c.phone.contains(query) ||
          c.wilaya.toLowerCase().contains(query);
    }).toList();
  }

  // Filters
  if (filter.wilaya != null && filter.wilaya!.trim().isNotEmpty) {
    final target = filter.wilaya!.trim().toLowerCase();
    result = result.where((c) => c.wilaya.trim().toLowerCase() == target).toList();
  }
  if (filter.businessType != null) {
    result =
        result.where((c) => c.businessType == filter.businessType).toList();
  }
  if (filter.status != null) {
    result = result.where((c) => c.status == filter.status).toList();
  }
  if (filter.hasDebt != null) {
    result = result.where((c) => c.hasDebt == filter.hasDebt).toList();
  }

  // Sort
  switch (filter.sortBy) {
    case ClientSortBy.name:
      result.sort((a, b) => a.name.compareTo(b.name));
      break;
    case ClientSortBy.recent:
      result.sort((a, b) =>
          (b.lastOrderDate ?? DateTime(0))
              .compareTo(a.lastOrderDate ?? DateTime(0)));
      break;
    case ClientSortBy.orders:
      result.sort((a, b) => b.totalOrders.compareTo(a.totalOrders));
      break;
    case ClientSortBy.revenue:
      result.sort((a, b) => b.totalRevenue.compareTo(a.totalRevenue));
      break;
  }

  return result;
});

// Statistics
final clientsStatisticsProvider = Provider<ClientsStatistics>((ref) {
  final clients = ref.watch(clientsProvider);

  final total = clients.length;
  final active = clients.where((c) => c.status == ClientStatus.active).length;
  final todayOrders = clients
      .where((c) =>
          c.lastOrderDate != null &&
          c.lastOrderDate!.isAfter(DateTime.now().subtract(const Duration(days: 1))))
      .length;
  final totalRevenue =
      clients.fold(0.0, (sum, c) => sum + c.totalRevenue);

  return ClientsStatistics(
    total: total,
    active: active,
    todayOrders: todayOrders,
    totalRevenue: totalRevenue,
  );
});

class ClientsStatistics {
  final int total;
  final int active;
  final int todayOrders;
  final double totalRevenue;

  const ClientsStatistics({
    required this.total,
    required this.active,
    required this.todayOrders,
    required this.totalRevenue,
  });
}
