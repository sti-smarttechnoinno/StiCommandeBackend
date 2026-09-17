import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/utils/pdf_invoice_service.dart';
import '../providers/order_details_provider.dart';
import '../widgets/ordered_products_card.dart';

class QuickActionsCard extends ConsumerWidget {
  final String orderId;

  const QuickActionsCard({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final details = ref.watch(orderDetailsProvider(orderId));

    final actions = [
      _ActionItem(
        icon: Icons.picture_as_pdf_rounded,
        label: 'Télécharger PDF',
        color: AppColors.danger,
        onTap: () {
          final orderedProducts = details.order.items
              .map((item) => OrderedProduct(
                    name: item.product.name,
                    reference: item.product.code,
                    quantity: item.quantity,
                    price: item.subtotal,
                  ))
              .toList();

          PdfInvoiceService.generateAndDownloadOrderPdf(
            orderNumber: details.order.orderNumber,
            clientName: details.order.client.name,
            delegateName: details.delegateName,
            region: details.order.client.region,
            totalAmount: details.order.totalAmount,
            createdAt: details.order.createdAt,
            products: orderedProducts,
          );
        },
      ),
      _ActionItem(
        icon: Icons.share_rounded,
        label: 'Partager',
        color: AppColors.info,
        onTap: () => _showShareSheet(context),
      ),
      _ActionItem(
        icon: Icons.phone_rounded,
        label: 'Contacter Client',
        color: AppColors.success,
        onTap: () {},
      ),
      _ActionItem(
        icon: Icons.refresh_rounded,
        label: 'Actualiser',
        color: AppColors.purple,
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Statut mis à jour'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          );
        },
      ),
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withAlpha(50)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.warning.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.bolt_outlined,
                    color: AppColors.warning, size: 15),
              ),
              const SizedBox(width: 8),
              const Text(
                'Actions rapides',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.8,
            ),
            itemCount: actions.length,
            itemBuilder: (context, index) {
              final item = actions[index];
              return _ActionBtn(
                item: item,
                delay: Duration(milliseconds: 900 + index * 80),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showShareSheet(BuildContext context) {
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
              const Text(
                'Partager la commande',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: AppConstants.xl),
              _ShareOption(
                icon: Icons.picture_as_pdf_rounded,
                label: 'Partager PDF',
                color: AppColors.danger,
                onTap: () => Navigator.of(ctx).pop(),
              ),
              _ShareOption(
                icon: Icons.link_rounded,
                label: 'Copier le lien',
                color: AppColors.info,
                onTap: () {
                  Navigator.of(ctx).pop();
                  Clipboard.setData(
                      const ClipboardData(text: 'https://sti.dz/orders/12345'));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('Lien copié'),
                      backgroundColor: AppColors.success,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  );
                },
              ),
              _ShareOption(
                icon: Icons.chat_rounded,
                label: 'Envoyer via WhatsApp',
                color: AppColors.success,
                onTap: () => Navigator.of(ctx).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}

class _ActionBtn extends StatefulWidget {
  final _ActionItem item;
  final Duration delay;

  const _ActionBtn({required this.item, required this.delay});

  @override
  State<_ActionBtn> createState() => _ActionBtnState();
}

class _ActionBtnState extends State<_ActionBtn> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.item.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: widget.item.color.withAlpha(12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: widget.item.color.withAlpha(35)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.item.icon, color: widget.item.color, size: 16),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  widget.item.label,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: widget.item.color,
                    fontSize: 11.5,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShareOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ShareOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(label),
      trailing:
          const Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary),
    );
  }
}
