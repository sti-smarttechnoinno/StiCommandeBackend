import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../../domain/models/dashboard_models.dart';

class QuickActionsSection extends StatelessWidget {
  const QuickActionsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final actions = [
      QuickAction(
        label: 'Nouvelle commande',
        subtitle: 'Créer un bon',
        icon: Icons.add_shopping_cart_rounded,
        color: AppColors.primary,
        onTap: () => context.push('/orders/new'),
      ),
      QuickAction(
        label: 'Mes commandes',
        subtitle: 'Historique & suivi',
        icon: Icons.receipt_long_rounded,
        color: AppColors.info,
        onTap: () => context.go('/orders'),
      ),
      QuickAction(
        label: 'Mes clients',
        subtitle: 'Portefeuille client',
        icon: Icons.people_alt_rounded,
        color: AppColors.success,
        onTap: () => context.go('/clients'),
      ),
      QuickAction(
        label: 'Catalogue produits',
        subtitle: 'Articles disponibles',
        icon: Icons.inventory_2_rounded,
        color: AppColors.purple,
        onTap: () => context.push('/products'),
      ),
    ];

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section header
            Text(
              'Actions rapides',
              style: AppTypography.sectionTitle,
            ),

            const SizedBox(height: AppConstants.md),

            // Grid of modern cards
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: AppConstants.md,
                crossAxisSpacing: AppConstants.md,
                childAspectRatio: 1.55,
              ),
              itemCount: actions.length,
              itemBuilder: (context, index) {
                final action = actions[index];
                return _QuickActionCard(
                  action: action,
                  delay: Duration(milliseconds: 300 + index * AppConstants.animDelayStepMs),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final QuickAction action;
  final Duration delay;

  const _QuickActionCard({required this.action, required this.delay});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: action.onTap,
        borderRadius: BorderRadius.circular(AppConstants.radiusLg),
        child: Container(
          padding: const EdgeInsets.all(AppConstants.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppConstants.radiusLg),
            border: Border.all(
              color: AppColors.border.withAlpha(50),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(6),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: action.color.withAlpha(20),
                      borderRadius: BorderRadius.circular(AppConstants.radiusSm),
                    ),
                    child: Center(
                      child: Icon(
                        action.icon,
                        color: action.color,
                        size: 20,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 13,
                    color: AppColors.textTertiary.withAlpha(140),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    action.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  if (action.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      action.subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textTertiary,
                        fontSize: 11,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

