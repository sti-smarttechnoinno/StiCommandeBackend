import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../providers/client_details_provider.dart';
import '../providers/client_details_entity.dart';

class ProductsCard extends ConsumerWidget {
  final String clientId;

  const ProductsCard({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final details = ref.watch(clientDetailsProvider(clientId));

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
      padding: const EdgeInsets.all(AppConstants.xxl),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: AppColors.cardShadow,
            blurRadius: 20,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.warning.withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.inventory_2_rounded,
                    color: AppColors.warning, size: 20),
              ),
              const SizedBox(width: AppConstants.md),
              Expanded(
                child: Text(
                  'Produits les plus achetés',
                  style: AppTypography.titleMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Voir tout',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 10,
                      color: AppColors.primary,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: AppConstants.md),
          if (details.frequentProducts.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.border.withAlpha(50)),
                    ),
                    child: const Icon(
                      Icons.inventory_2_outlined,
                      size: 20,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Aucun produit commandé pour le moment',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Les articles achetés par ce client apparaîtront ici automatiquement.',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            ...List.generate(details.frequentProducts.length * 2 - 1, (index) {
              if (index.isOdd) {
                return const Divider(
                    height: 1, color: AppColors.border, indent: 56);
              }
              final i = index ~/ 2;
              final product = details.frequentProducts[i];
              return _ProductRow(
                product: product,
                index: i,
              );
            }),
        ],
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final ClientProduct product;
  final int index;

  const _ProductRow({required this.product, required this.index});

  @override
  Widget build(BuildContext context) {
    final opTag = product.operator.isNotEmpty
        ? (product.operator.length >= 2
            ? product.operator.substring(0, 2).toUpperCase()
            : product.operator.toUpperCase())
        : 'PR';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppConstants.md),
      child: Row(
        children: [
          // Thumbnail
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: _operatorColor(product.operator).withAlpha(20),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                opTag,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: _operatorColor(product.operator),
                ),
              ),
            ),
          ),
          const SizedBox(width: AppConstants.md),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    _OperatorBadge(
                      operator: product.operator,
                      color: _operatorColor(product.operator),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Acheté ${product.quantityPurchased}×',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textTertiary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Price
          Text(
            '${_formatPrice(product.averagePrice)} DA',
            style: AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(
          delay: Duration(milliseconds: 750 + index * 60),
          duration: const Duration(milliseconds: 200),
        );
  }

  Color _operatorColor(String operator) {
    switch (operator.toLowerCase()) {
      case 'mobilis':
        return AppColors.primary;
      case 'djezzy':
        return AppColors.warning;
      case 'ooredoo':
        return AppColors.danger;
      default:
        return AppColors.info;
    }
  }

  String _formatPrice(double price) {
    final parts = price.toStringAsFixed(0).split('');
    final result = StringBuffer();
    for (int i = 0; i < parts.length; i++) {
      if (i > 0 && (parts.length - i) % 3 == 0) result.write(' ');
      result.write(parts[i]);
    }
    return result.toString();
  }
}

class _OperatorBadge extends StatelessWidget {
  final String operator;
  final Color color;

  const _OperatorBadge({required this.operator, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        operator,
        style: AppTypography.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 9,
        ),
      ),
    );
  }
}
