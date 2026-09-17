import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';
import '../providers/clients_provider.dart';
import '../widgets/clients_header.dart';
import '../widgets/statistics_cards.dart';
import '../widgets/clients_search_bar.dart';
import '../widgets/favorite_clients.dart';
import '../widgets/client_card.dart';
import '../widgets/client_empty_state.dart';
import '../widgets/filter_bottom_sheet.dart';

class ClientsPage extends ConsumerStatefulWidget {
  const ClientsPage({super.key});

  @override
  ConsumerState<ClientsPage> createState() => _ClientsPageState();
}

class _ClientsPageState extends ConsumerState<ClientsPage> {
  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const FilterBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredClients = ref.watch(filteredClientsProvider);
    final filter = ref.watch(clientsFilterProvider);

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        ref.invalidate(rawClientsProvider);
        ref.invalidate(rawRegionsProvider);
        ref.invalidate(rawWilayasProvider);
        await Future.wait([
          ref.read(rawClientsProvider.future),
          ref.read(rawRegionsProvider.future),
          ref.read(rawWilayasProvider.future),
        ]);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: ClientsHeader(onFilterPressed: _showFilterSheet),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Statistics
          const SliverToBoxAdapter(child: StatisticsCards()),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Search
          const SliverToBoxAdapter(child: ClientsSearchBar()),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Favorites
          const SliverToBoxAdapter(child: FavoriteClients()),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),

          // Filter indicator
          if (filter.hasActiveFilters)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Icon(Icons.filter_alt_outlined,
                        size: 16, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text(
                      '${filteredClients.length} résultat${filteredClients.length > 1 ? 's' : ''}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.primary,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () {
                        ref.read(clientsFilterProvider.notifier).state =
                            const ClientsFilter();
                      },
                      child: Text(
                        'Effacer',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.danger,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          if (filter.hasActiveFilters)
            const SliverToBoxAdapter(child: SizedBox(height: 12)),

          // Clients List
          if (filteredClients.isEmpty)
            SliverToBoxAdapter(
              child: ClientEmptyState(
                onRefresh: () {
                  ref.read(searchQueryProvider.notifier).state = '';
                  ref.read(clientsFilterProvider.notifier).state = const ClientsFilter();
                  ref.invalidate(rawClientsProvider);
                },
              ),
            )
          else ...[
            // Count
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  '${filteredClients.length} client${filteredClients.length > 1 ? 's' : ''}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // Client cards
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList.separated(
                itemCount: filteredClients.length,
                separatorBuilder: (_, _) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final client = filteredClients[index];
                  return RepaintBoundary(
                    child: ClientCard(client: client, index: index),
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
