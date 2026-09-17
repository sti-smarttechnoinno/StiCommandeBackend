import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../providers/order_provider.dart';
import '../widgets/order_stepper.dart';
import '../widgets/client_card.dart';
import '../widgets/order_info_card.dart';
import '../widgets/product_search_field.dart';
import '../widgets/product_card.dart';
import '../widgets/notes_card.dart';
import '../widgets/summary_card.dart';
import '../widgets/sticky_bottom_bar.dart';
import '../widgets/confirmation_dialog.dart';
import '../widgets/loading_overlay.dart';
import '../widgets/ordered_products_card.dart';
import '../../domain/entities/order.dart';
import '../../domain/entities/client.dart';
import '../providers/order_details_provider.dart';
import '../providers/orders_history_provider.dart';

class NewOrderPage extends ConsumerStatefulWidget {
  const NewOrderPage({super.key});

  @override
  ConsumerState<NewOrderPage> createState() => _NewOrderPageState();
}

class _NewOrderPageState extends ConsumerState<NewOrderPage> {
  void _showConfirmation() {
    showDialog(
      context: context,
      builder: (_) => ConfirmationDialog(
        onConfirm: _submitOrder,
      ),
    );
  }

  Future<void> _submitOrder() async {
    ref.read(orderSubmittingProvider.notifier).state = true;

    // Show loading overlay
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => const LoadingOverlay(),
      );
    }

    try {
      final backendOrderData = await submitOrderToBackend(ref);

      if (mounted) {
        Navigator.pop(context); // dismiss loading
        ref.read(orderSubmittingProvider.notifier).state = false;

        final client = ref.read(selectedClientProvider);
        final items = ref.read(orderItemsProvider);

        final orderNumber = backendOrderData['order_code'] as String? ?? 'ORD-CONFIRMED';
        final orderId = backendOrderData['id'] as String? ?? DateTime.now().millisecondsSinceEpoch.toString();

        final orderedProducts = items
            .map((item) => OrderedProduct(
                  name: item.product.name,
                  reference: item.product.code,
                  quantity: item.quantity,
                  price: item.subtotal,
                ))
            .toList();

        final authUser = ref.read(authProvider).user;
        final delegateName = authUser?['name'] as String? ?? 'Délégué';
        final delegateRegion = authUser?['region'] as String? ?? '';
        final delegateWilaya = authUser?['wilaya'] as String? ?? '';

        final orderClient = client ??
            Client(
              id: backendOrderData['client_id']?.toString() ?? 'CLI-001',
              code: 'CLI',
              name: 'Client',
              region: delegateRegion,
              wilaya: delegateWilaya,
              address: '',
              phone: '',
            );

        final newOrder = Order(
          id: orderId,
          orderNumber: orderNumber,
          client: orderClient,
          items: items,
          status: OrderStatus.pending,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          notes: ref.read(orderNotesProvider),
        );

        ref.read(lastCreatedOrderProvider.notifier).state = newOrder;
        ref.read(ordersProvider.notifier).addOrder(newOrder);

        context.pushReplacement('/orders/success', extra: {
          'orderNumber': orderNumber,
          'orderId': orderId,
          'clientName': orderClient.name,
          'delegate': delegateName,
          'region': orderClient.region.isNotEmpty ? orderClient.region : delegateRegion,
          'totalAmount': newOrder.totalAmount,
          'createdAt': DateTime.now(),
          'products': orderedProducts,
        });

        // Reset state
        ref.read(orderItemsProvider.notifier).clear();
        ref.read(selectedClientProvider.notifier).state = null;
        ref.read(orderNotesProvider.notifier).state = '';
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // dismiss loading
        ref.read(orderSubmittingProvider.notifier).state = false;
        _showErrorFeedbackDialog(e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  void _showErrorFeedbackDialog(String errorMessage) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.danger.withAlpha(20),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                color: AppColors.danger,
                size: 22,
              ),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Échec de la commande',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Impossible d\'enregistrer la commande dans la base de données. Détails du problème :',
              style: TextStyle(
                fontSize: 12.5,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dangerLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.danger.withAlpha(40)),
              ),
              child: Text(
                errorMessage,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.danger,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Fermer'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _submitOrder();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedClient = ref.watch(selectedClientProvider);
    final orderItems = ref.watch(orderItemsProvider);
    final currentStep = ref.watch(currentStepProvider);

    // Auto-update step
    if (selectedClient != null && currentStep == 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(currentStepProvider.notifier).state = 1;
      });
    } else if (selectedClient == null && currentStep > 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(currentStepProvider.notifier).state = 0;
      });
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Stack(
          children: [
            CustomScrollView(
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
                    onPressed: () => context.pop(),
                  ),
                  centerTitle: true,
                  title: const Text(
                    'Nouvelle Commande',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  actions: [
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: OutlinedButton.icon(
                        onPressed: () {
                          // Save draft
                        },
                        icon: const Icon(Icons.save_outlined, size: 15),
                        label: const Text('Brouillon', style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textSecondary,
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SliverToBoxAdapter(
                    child: SizedBox(height: 8)),

                // Step indicator
                const SliverToBoxAdapter(
                  child: OrderStepper(currentStep: 0),
                ),

                const SliverToBoxAdapter(
                    child: SizedBox(height: 16)),

                // Client card
                const SliverToBoxAdapter(child: ClientCard()),

                const SliverToBoxAdapter(
                    child: SizedBox(height: 14)),

                // Order info
                SliverToBoxAdapter(
                  child: OrderInfoCard(
                    delegate: ref.watch(authProvider).user?['name'] as String? ?? 'Délégué',
                    region: selectedClient?.region ?? '—',
                    wilaya: selectedClient?.wilaya ?? '—',
                  ),
                ),

                const SliverToBoxAdapter(
                    child: SizedBox(height: 14)),

                // Products section
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(8),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.inventory_2_outlined,
                                color: AppColors.primary,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Produits',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const Spacer(),
                            TextButton.icon(
                              onPressed: () => ProductSearchField.showProductSelectModal(context),
                              icon: const Icon(Icons.add_rounded, size: 18),
                              label: const Text('Ajouter'),
                              style: TextButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const ProductSearchField(),
                      ],
                    ),
                  ),
                ),

                const SliverToBoxAdapter(
                    child: SizedBox(height: 12)),

                // Product list
                if (orderItems.isNotEmpty) ...[
                  for (int i = 0; i < orderItems.length; i++)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ProductCard(item: orderItems[i], index: i),
                      ),
                    ),
                  const SliverToBoxAdapter(
                      child: SizedBox(height: 8)),
                  // Add another product button
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: OutlinedButton.icon(
                        onPressed: () => ProductSearchField.showProductSelectModal(context),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text('Ajouter un autre produit'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(
                            color: AppColors.primary,
                            width: 1.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          minimumSize: const Size(double.infinity, 52),
                        ),
                      ),
                    ),
                  ),
                ] else ...[
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20),
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.border,
                          width: 1.5,
                          strokeAlign: BorderSide.strokeAlignInside,
                        ),
                      ),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.shopping_cart_outlined,
                              size: 48,
                              color: AppColors.textTertiary.withAlpha(100),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Aucun produit ajouté',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textTertiary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Recherchez et sélectionnez des produits ci-dessus',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textTertiary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],

                const SliverToBoxAdapter(
                    child: SizedBox(height: 20)),

                // Notes & Remarques
                const SliverToBoxAdapter(child: NotesCard(isEditable: true)),

                const SliverToBoxAdapter(
                    child: SizedBox(height: 20)),

                // Summary
                const SliverToBoxAdapter(child: SummaryCard()),

                // Bottom spacer for sticky bar
                const SliverToBoxAdapter(
                    child: SizedBox(height: 120)),
              ],
            ),

            // Loading overlay
            if (ref.watch(orderSubmittingProvider))
              const LoadingOverlay(),

            // Sticky bottom bar
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: StickyBottomBar(
                onSubmit: _showConfirmation,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
