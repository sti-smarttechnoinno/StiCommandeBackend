import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/pdf_invoice_service.dart';
import '../widgets/success_header.dart';
import '../widgets/order_number_card.dart';
import '../widgets/order_details_card.dart';
import '../widgets/ordered_products_card.dart';
import '../widgets/order_total_card.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';
import '../widgets/action_buttons.dart';

class OrderSuccessPage extends ConsumerWidget {
  final String orderNumber;
  final String orderId;
  final String clientName;
  final String delegate;
  final String region;
  final double totalAmount;
  final DateTime createdAt;
  final List<OrderedProduct> products;

  const OrderSuccessPage({
    super.key,
    required this.orderNumber,
    required this.orderId,
    required this.clientName,
    required this.delegate,
    required this.region,
    required this.totalAmount,
    required this.createdAt,
    required this.products,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // App Bar
              SliverAppBar(
                pinned: true,
                backgroundColor: AppColors.background,
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                scrolledUnderElevation: 0,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      size: 20),
                  onPressed: () {
                    ref.read(dashboardProvider.notifier).loadRealData();
                    context.go('/dashboard');
                  },
                ),
                centerTitle: true,
                title: const Text(
                  'Commande ajoutée',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                actions: [
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(8),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.download_outlined,
                          size: 20,
                        ),
                        onPressed: () {
                          PdfInvoiceService.generateAndDownloadOrderPdf(
                            orderNumber: orderNumber,
                            clientName: clientName,
                            delegateName: delegate,
                            region: region,
                            totalAmount: totalAmount,
                            createdAt: createdAt,
                            products: products,
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),

              // Success Header
              SliverToBoxAdapter(
                child: SuccessHeader(orderNumber: orderNumber),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: 28)),

              // Order Number Card
              SliverToBoxAdapter(
                child: OrderNumberCard(orderNumber: orderNumber),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: 16)),

              // Order Details Card
              SliverToBoxAdapter(
                child: OrderDetailsCard(
                  orderNumber: orderNumber,
                  delegate: delegate,
                  region: region,
                  client: clientName,
                  createdAt: createdAt,
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: 16)),

              // Ordered Products
              SliverToBoxAdapter(
                child: OrderedProductsCard(products: products),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: 16)),

              // Total Card
              SliverToBoxAdapter(
                child: OrderTotalCard(totalAmount: totalAmount),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: 24)),

              // Action Buttons
              SliverToBoxAdapter(
                child: ActionButtons(orderId: orderId),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: 32)),
            ],
          ),
        ),
      ),
    );
  }
}
