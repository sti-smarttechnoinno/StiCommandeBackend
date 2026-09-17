import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/order_item.dart';
import '../providers/order_provider.dart';

class ProductCard extends ConsumerWidget {
  final OrderItem item;
  final int index;

  const ProductCard({
    super.key,
    required this.item,
    required this.index,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final product = item.product;

    return Dismissible(
      key: Key(product.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.danger,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Icon(
          Icons.delete_outline_rounded,
          color: Colors.white,
          size: 24,
        ),
      ),
      onDismissed: (_) {
        ref.read(orderItemsProvider.notifier).removeProduct(product.id);
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
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
          children: [
            // Top Row: Thumbnail + Product Title & Code + Popup Menu
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(18),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Icon(
                      _getProductIcon(product.code),
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              product.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          if (item.discountPercent > 0) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 5, vertical: 1.5),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(15),
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: Text(
                                '${item.discountPercent % 1 == 0 ? item.discountPercent.toStringAsFixed(0) : item.discountPercent.toStringAsFixed(2)}%',
                                style: const TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: AppColors.border.withAlpha(80),
                              ),
                            ),
                            child: Text(
                              product.code,
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondary,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  padding: EdgeInsets.zero,
                  icon: Icon(
                    Icons.more_vert_rounded,
                    color: AppColors.textTertiary.withAlpha(160),
                    size: 18,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  itemBuilder: (_) => [
                    const PopupMenuItem(
                      value: 'duplicate',
                      child: Row(
                        children: [
                          Icon(Icons.copy_outlined, size: 16),
                          SizedBox(width: 8),
                          Text('Dupliquer', style: TextStyle(fontSize: 13)),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline_rounded,
                              size: 16, color: AppColors.danger),
                          SizedBox(width: 8),
                          Text('Supprimer',
                              style: TextStyle(
                                  fontSize: 13, color: AppColors.danger)),
                        ],
                      ),
                    ),
                  ],
                  onSelected: (value) {
                    if (value == 'duplicate') {
                      ref
                          .read(orderItemsProvider.notifier)
                          .duplicateProduct(product.id);
                      HapticFeedback.lightImpact();
                    } else if (value == 'delete') {
                      ref
                          .read(orderItemsProvider.notifier)
                          .removeProduct(product.id);
                    }
                  },
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Price Details Box
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: AppColors.border.withAlpha(40),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Prix unitaire:',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textTertiary,
                        ),
                      ),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            '${item.unitPrice.toStringAsFixed(0)} DA',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          if (item.discountPercent > 0) ...[
                            const SizedBox(width: 4),
                            Text(
                              '(${product.nominalPrice.toStringAsFixed(0)} DA)',
                              style: const TextStyle(
                                fontSize: 9.5,
                                decoration: TextDecoration.lineThrough,
                                color: AppColors.textTertiary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Sous-total:',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textTertiary,
                        ),
                      ),
                      Text(
                        '${item.subtotal.toStringAsFixed(0)} DA',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Price Percentage Preset Chips Selector Bar
            Row(
              children: [
                const Icon(Icons.percent_rounded, size: 13, color: AppColors.textTertiary),
                const SizedBox(width: 4),
                Text(
                  'Prix (%):',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textTertiary,
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: [
                        _DiscountChip(
                          label: '0%',
                          isSelected: item.discountPercent == 0,
                          onTap: () => ref
                              .read(orderItemsProvider.notifier)
                              .updateDiscount(product.id, 0),
                        ),
                        _DiscountChip(
                          label: '1.5%',
                          isSelected: (item.discountPercent - 1.5).abs() < 0.01,
                          onTap: () => ref
                              .read(orderItemsProvider.notifier)
                              .updateDiscount(product.id, 1.5),
                        ),
                        _DiscountChip(
                          label: '2.75%',
                          isSelected: (item.discountPercent - 2.75).abs() < 0.01,
                          onTap: () => ref
                              .read(orderItemsProvider.notifier)
                              .updateDiscount(product.id, 2.75),
                        ),
                        _DiscountChip(
                          label: '4%',
                          isSelected: (item.discountPercent - 4.0).abs() < 0.01,
                          onTap: () => ref
                              .read(orderItemsProvider.notifier)
                              .updateDiscount(product.id, 4.0),
                        ),
                        _DiscountChip(
                          label: '5%',
                          isSelected: (item.discountPercent - 5.0).abs() < 0.01,
                          onTap: () => ref
                              .read(orderItemsProvider.notifier)
                              .updateDiscount(product.id, 5.0),
                        ),
                        _DiscountChip(
                          label: 'Autre...',
                          isSelected: ![0.0, 1.5, 2.75, 4.0, 5.0]
                              .any((d) => (item.discountPercent - d).abs() < 0.01),
                          isCustom: true,
                          onTap: () => _showCustomDiscountDialog(
                              context, ref, product.id, item.discountPercent),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Quantity Controller
            _QuantitySelector(
              quantity: item.quantity,
              maxQuantity: product.hasStockLimit ? product.stockQuantity : null,
              onChanged: (qty) {
                ref
                    .read(orderItemsProvider.notifier)
                    .updateQuantity(product.id, qty);
              },
            ),
          ],
        ),
      ),
    );
  }

  IconData _getProductIcon(String code) {
    if (code.contains('FLX') || code.contains('DJZ')) {
      return Icons.phone_android_rounded;
    }
    if (code.contains('ARS') || code.contains('MOB')) {
      return Icons.cell_tower_rounded;
    }
    if (code.contains('STR') || code.contains('OOR')) {
      return Icons.flash_on_rounded;
    }
    return Icons.sim_card_rounded;
  }
}

class _QuantitySelector extends StatefulWidget {
  final int quantity;
  final int? maxQuantity;
  final ValueChanged<int> onChanged;

  const _QuantitySelector({
    required this.quantity,
    this.maxQuantity,
    required this.onChanged,
  });

  @override
  State<_QuantitySelector> createState() => _QuantitySelectorState();
}

class _QuantitySelectorState extends State<_QuantitySelector> {
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startContinuousIncrement(int direction) {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 80), (_) {
      if (direction > 0 && widget.maxQuantity != null && widget.quantity >= widget.maxQuantity!) {
        _stopContinuous();
        return;
      }
      final newQty = widget.maxQuantity != null
          ? (widget.quantity + direction).clamp(1, widget.maxQuantity!)
          : (widget.quantity + direction < 1 ? 1 : widget.quantity + direction);
      if (newQty != widget.quantity) {
        widget.onChanged(newQty);
        HapticFeedback.selectionClick();
      }
    });
  }

  void _stopContinuous() {
    _timer?.cancel();
    _timer = null;
  }

  void _showQuantityEditDialog(BuildContext context) {
    final controller = TextEditingController(text: '${widget.quantity}');
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Quantité',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Ex: 100',
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              final val = int.tryParse(controller.text);
              if (val != null && val >= 1) {
                final clamped = widget.maxQuantity != null
                    ? val.clamp(1, widget.maxQuantity!)
                    : val;
                widget.onChanged(clamped);
              }
              Navigator.pop(context);
            },
            child: const Text('Valider'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasReachedMax = widget.maxQuantity != null && widget.quantity >= widget.maxQuantity!;

    return Row(
      children: [
        GestureDetector(
          onTap: () {
            if (widget.quantity > 1) {
              widget.onChanged(widget.quantity - 1);
              HapticFeedback.lightImpact();
            }
          },
          onLongPressStart: (_) => _startContinuousIncrement(-1),
          onLongPressEnd: (_) => _stopContinuous(),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: widget.quantity <= 1
                  ? AppColors.border.withAlpha(60)
                  : AppColors.primary.withAlpha(15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.remove_rounded,
              size: 20,
              color: widget.quantity <= 1
                  ? AppColors.textTertiary
                  : AppColors.primary,
            ),
          ),
        ),
        const SizedBox(width: 12),
        GestureDetector(
          onTap: () => _showQuantityEditDialog(context),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            height: 40,
            constraints: const BoxConstraints(minWidth: 56),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border.withAlpha(80)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${widget.quantity}',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.edit_rounded,
                  size: 12,
                  color: AppColors.textTertiary.withAlpha(120),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        GestureDetector(
          onTap: () {
            if (!hasReachedMax) {
              widget.onChanged(widget.quantity + 1);
              HapticFeedback.lightImpact();
            }
          },
          onLongPressStart: (_) => _startContinuousIncrement(1),
          onLongPressEnd: (_) => _stopContinuous(),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: hasReachedMax
                  ? AppColors.border.withAlpha(60)
                  : AppColors.primary.withAlpha(15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.add_rounded,
              size: 20,
              color: hasReachedMax
                  ? AppColors.textTertiary
                  : AppColors.primary,
            ),
          ),
        ),
        const Spacer(),
      ],
    );
  }
}

class _DiscountChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final bool isCustom;
  final VoidCallback onTap;

  const _DiscountChip({
    required this.label,
    required this.isSelected,
    this.isCustom = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(8),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary
                : isCustom
                    ? AppColors.primary.withAlpha(12)
                    : AppColors.background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? AppColors.primary
                  : AppColors.border.withAlpha(80),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
              color: isSelected
                  ? Colors.white
                  : isCustom
                      ? AppColors.primary
                      : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

void _showCustomDiscountDialog(
    BuildContext context, WidgetRef ref, String productId, double currentDiscount) {
  final controller = TextEditingController(text: currentDiscount > 0 ? currentDiscount.toString() : '');
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Pourcentage du prix (%)',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      content: TextField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        autofocus: true,
        decoration: InputDecoration(
          suffixText: '%',
          hintText: 'Ex: 2.75',
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: () {
            final text = controller.text.replaceAll(',', '.');
            final val = double.tryParse(text);
            if (val != null && val >= 0 && val <= 100) {
              ref.read(orderItemsProvider.notifier).updateDiscount(productId, val);
            }
            Navigator.pop(context);
          },
          child: const Text('Appliquer'),
        ),
      ],
    ),
  );
}
