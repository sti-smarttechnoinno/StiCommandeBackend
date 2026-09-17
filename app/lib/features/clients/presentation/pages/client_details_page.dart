import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../providers/client_details_provider.dart';
import '../widgets/client_profile_card.dart';
import '../widgets/financial_summary_card.dart';
import '../widgets/quick_actions_grid.dart';
import '../widgets/statistics_section.dart';
import '../widgets/recent_orders_card.dart';
import '../widgets/products_card.dart';
import '../widgets/delegate_notes_card.dart';
import '../widgets/floating_order_button.dart';

class ClientDetailsPage extends ConsumerWidget {
  final String clientId;

  const ClientDetailsPage({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final details = ref.watch(clientDetailsProvider(clientId));

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: AppColors.background,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          top: true,
          bottom: false,
          child: Stack(
            children: [
                    CustomScrollView(
                      physics: const BouncingScrollPhysics(
                        parent: AlwaysScrollableScrollPhysics(),
                      ),
                      slivers: [
                        // Header
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: () => context.pop(),
                                  child: Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.border.withAlpha(50)),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withAlpha(5),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.arrow_back_ios_new_rounded,
                                      size: 16,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Détails du Client',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textPrimary,
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                      SizedBox(height: 2),
                                      Text(
                                        'Profil complet et historique',
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          color: AppColors.textTertiary,
                                          fontWeight: FontWeight.w400,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.border.withAlpha(50)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withAlpha(5),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: IconButton(
                                    onPressed: () => _showMenuSheet(context),
                                    icon: const Icon(
                                      Icons.more_vert_rounded,
                                      color: AppColors.textSecondary,
                                      size: 18,
                                    ),
                                    padding: EdgeInsets.zero,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Profile card
                        SliverToBoxAdapter(
                          child: ClientProfileCard(client: details.client),
                        ),

                        const SliverToBoxAdapter(
                            child: SizedBox(height: AppConstants.xxl)),

                        // Financial summary
                        SliverToBoxAdapter(
                          child: FinancialSummaryCard(client: details.client),
                        ),

                        const SliverToBoxAdapter(
                            child: SizedBox(height: AppConstants.xxl)),

                        // Quick actions
                        SliverToBoxAdapter(
                          child: QuickActionsGrid(client: details.client),
                        ),

                        const SliverToBoxAdapter(
                            child: SizedBox(height: AppConstants.xxl)),

                        // Statistics
                        SliverToBoxAdapter(
                          child: StatisticsSection(clientId: clientId),
                        ),

                        const SliverToBoxAdapter(
                            child: SizedBox(height: AppConstants.xxl)),

                        // Recent orders
                        SliverToBoxAdapter(
                          child: RecentOrdersCard(clientId: clientId),
                        ),

                        const SliverToBoxAdapter(
                            child: SizedBox(height: AppConstants.xxl)),

                        // Products
                        SliverToBoxAdapter(
                          child: ProductsCard(clientId: clientId),
                        ),

                        const SliverToBoxAdapter(
                            child: SizedBox(height: AppConstants.xxl)),

                        // Notes
                        SliverToBoxAdapter(
                          child: DelegateNotesCard(clientId: clientId),
                        ),

                        // Bottom spacing for floating button
                        const SliverToBoxAdapter(
                          child: SizedBox(
                            height: 90,
                          ),
                        ),
                      ],
                    ),

                    // Floating order button
                    FloatingOrderButton(clientId: clientId),
                  ],
                ),
        ),
      ),
    );
  }

  void _showMenuSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: AppConstants.lg),
              _MenuRow(
                icon: Icons.receipt_long_rounded,
                label: 'Voir les commandes',
                onTap: () => Navigator.of(ctx).pop(),
              ),
              _MenuRow(
                icon: Icons.phone_rounded,
                label: 'Appeler le client',
                onTap: () => Navigator.of(ctx).pop(),
              ),
              _MenuRow(
                icon: Icons.chat_rounded,
                label: 'Envoyer un WhatsApp',
                onTap: () => Navigator.of(ctx).pop(),
              ),
              _MenuRow(
                icon: Icons.share_rounded,
                label: 'Partager le profil',
                onTap: () => Navigator.of(ctx).pop(),
              ),
              _MenuRow(
                icon: Icons.picture_as_pdf_rounded,
                label: 'Exporter en PDF',
                onTap: () => Navigator.of(ctx).pop(),
              ),
              _MenuRow(
                icon: Icons.edit_rounded,
                label: 'Modifier le client',
                onTap: () => Navigator.of(ctx).pop(),
              ),
              const Divider(color: AppColors.border),
              _MenuRow(
                icon: Icons.block_rounded,
                label: 'Désactiver le client',
                color: AppColors.danger,
                onTap: () => Navigator.of(ctx).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  final VoidCallback onTap;

  const _MenuRow({
    required this.icon,
    required this.label,
    this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final itemColor = color ?? AppColors.textPrimary;
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: (color ?? AppColors.textSecondary).withAlpha(20),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: itemColor, size: 20),
      ),
      title: Text(
        label,
        style: AppTypography.bodyMedium.copyWith(
          color: itemColor,
          fontWeight: FontWeight.w500,
        ),
      ),
      contentPadding: EdgeInsets.zero,
      visualDensity: VisualDensity.compact,
    );
  }
}
