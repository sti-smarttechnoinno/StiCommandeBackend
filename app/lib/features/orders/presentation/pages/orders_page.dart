import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';
import '../providers/orders_history_provider.dart';
import '../widgets/orders_header.dart';
import '../widgets/month_selector_bar.dart';
import '../widgets/orders_statistics.dart';
import '../widgets/orders_search_bar.dart';
import '../widgets/status_filter_tabs.dart';
import '../widgets/order_card.dart';
import '../widgets/order_empty_state.dart';
import '../widgets/order_loading.dart';

class OrdersPage extends ConsumerStatefulWidget {
  const OrdersPage({super.key});

  @override
  ConsumerState<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends ConsumerState<OrdersPage> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final ordersState = ref.read(ordersProvider);
      if (!ordersState.isLoading && !ordersState.isLoadingMore && ordersState.hasMore) {
        ref.read(ordersProvider.notifier).loadMore();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ordersState = ref.watch(ordersProvider);
    final filteredOrders = ref.watch(filteredOrdersProvider);
    final searchQuery = ref.watch(searchQueryProvider);
    final activeStatus = ref.watch(activeStatusFilterProvider);
    final selectedMonth = ref.watch(selectedMonthProvider);

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      onRefresh: () async {
        HapticFeedback.mediumImpact();
        await ref.read(ordersProvider.notifier).refresh();
      },
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          // Header
          const SliverToBoxAdapter(child: OrdersHeader()),

          const SliverToBoxAdapter(child: SizedBox(height: 14)),

          // Month Navigation Bar (< Month Year >)
          const SliverToBoxAdapter(child: MonthSelectorBar()),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Statistics
          const SliverToBoxAdapter(child: OrdersStatistics()),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Search Bar
          const SliverToBoxAdapter(child: OrdersSearchBar()),

          const SliverToBoxAdapter(child: SizedBox(height: 14)),

          // Filter Tabs
          const SliverToBoxAdapter(child: StatusFilterTabs()),

          const SliverToBoxAdapter(child: SizedBox(height: 18)),

          // Orders List or Loading/Empty
          if (ordersState.isLoading && ordersState.orders.isEmpty)
            const SliverToBoxAdapter(child: OrderLoading())
          else if (filteredOrders.isEmpty)
            SliverToBoxAdapter(
              child: OrderEmptyState(
                title: searchQuery.isNotEmpty
                    ? 'Aucun résultat'
                    : activeStatus != null
                        ? 'Aucune commande avec ce statut'
                        : selectedMonth != null
                            ? 'Aucune commande ce mois-ci'
                            : 'Aucune commande',
                subtitle: searchQuery.isNotEmpty
                    ? 'Aucune commande ne correspond à "$searchQuery".'
                    : activeStatus != null
                        ? 'Aucune commande trouvée pour le filtre sélectionné.'
                        : selectedMonth != null
                            ? 'Aucune commande enregistrée pour le mois sélectionné. Vous pouvez changer de mois ou afficher toutes les commandes.'
                            : 'Aucune commande enregistrée. Vous pouvez créer une nouvelle commande.',
              ),
            )
          else ...[
            // Orders count
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  '${filteredOrders.length} commande${filteredOrders.length > 1 ? 's' : ''}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // Order cards
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList.separated(
                itemCount: filteredOrders.length +
                    (ordersState.hasMore || ordersState.isLoadingMore ? 1 : 0),
                separatorBuilder: (_, _) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  if (index >= filteredOrders.length) {
                    // Loading indicator at bottom
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                color: AppColors.primary,
                                strokeWidth: 2,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              'Chargement...',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textTertiary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  final order = filteredOrders[index];
                  return RepaintBoundary(
                    child: OrderCard(order: order, index: index),
                  );
                },
              ),
            ),
          ],

          // Bottom spacer so content and buttons are never hidden behind navbar
          const SliverToBoxAdapter(
            child: SizedBox(
              height: AppConstants.bottomNavHeight + AppConstants.xxl + 24,
            ),
          ),
        ],
      ),
    );
  }
}
