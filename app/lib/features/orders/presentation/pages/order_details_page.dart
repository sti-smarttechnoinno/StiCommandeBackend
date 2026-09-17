import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/pdf_invoice_service.dart';
import '../providers/order_details_provider.dart';
import '../widgets/order_header_card.dart';
import '../widgets/client_information_card.dart';
import '../widgets/order_timeline.dart';
import '../widgets/products_section.dart';
import '../widgets/notes_card.dart';
import '../widgets/quick_actions_card.dart';
import '../widgets/ordered_products_card.dart';

class OrderDetailsPage extends ConsumerWidget {
  final String orderId;

  const OrderDetailsPage({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final details = ref.watch(orderDetailsProvider(orderId));

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
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            slivers: [
                    // Header with back button and PDF action
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (context.canPop()) {
                                  context.pop();
                                } else {
                                  context.go('/orders');
                                }
                              },
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: AppColors.border.withAlpha(60)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withAlpha(6),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.arrow_back_ios_new_rounded,
                                  size: 18,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Détails de Commande',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                      letterSpacing: -0.3,
                                    ),
                                  ).animate().fadeIn(
                                        duration:
                                            const Duration(milliseconds: 300),
                                      ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'N° ${details.order.orderNumber}',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ).animate().fadeIn(
                                        delay: const Duration(
                                            milliseconds: 100),
                                        duration:
                                            const Duration(milliseconds: 300),
                                      ),
                                ],
                              ),
                            ),
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: AppColors.border.withAlpha(60)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(6),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: IconButton(
                                onPressed: () {
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
                                icon: const Icon(
                                  Icons.picture_as_pdf_rounded,
                                  color: AppColors.danger,
                                  size: 19,
                                ),
                              ),
                            ).animate().fadeIn(
                                  delay: const Duration(milliseconds: 200),
                                  duration: const Duration(milliseconds: 300),
                                ),
                          ],
                        ),
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 16)),

                    // Order summary card
                    SliverToBoxAdapter(
                      child: OrderHeaderCard(details: details),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 16)),

                    // Rejection reason if rejected
                    if (details.rejectionReason != null)
                      SliverToBoxAdapter(
                        child: _RejectionBanner(
                            reason: details.rejectionReason!),
                      ),
                    if (details.rejectionReason != null)
                      const SliverToBoxAdapter(child: SizedBox(height: 16)),

                    // Client information card
                    SliverToBoxAdapter(
                      child: ClientInformationCard(client: details.order.client),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 16)),

                    // Timeline
                    SliverToBoxAdapter(
                      child: OrderTimeline(
                        steps: details.timeline,
                        order: details.order,
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 16)),

                    // Products
                    SliverToBoxAdapter(
                      child: ProductsSection(
                        items: details.order.items,
                        totalCount: details.order.productCount,
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 16)),

                    // Notes
                    SliverToBoxAdapter(
                      child: NotesCard(
                        notes: details.order.notes,
                        author: details.delegateName,
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 16)),

                    // Quick actions
                    SliverToBoxAdapter(
                      child: QuickActionsCard(orderId: details.order.id),
                    ),

                    // Bottom spacing for navigation bar
                    const SliverToBoxAdapter(
                      child: SizedBox(height: 100),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _RejectionBanner extends StatelessWidget {
  final String reason;

  const _RejectionBanner({required this.reason});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.dangerLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.danger.withAlpha(60)),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline_rounded,
                color: AppColors.danger, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Commande rejetée',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.danger,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    reason,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.danger.withAlpha(200),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ).animate().fadeIn(
            delay: const Duration(milliseconds: 150),
            duration: const Duration(milliseconds: 300),
          ),
    );
  }
}
