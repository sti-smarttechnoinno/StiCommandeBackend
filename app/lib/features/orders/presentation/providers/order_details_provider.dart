import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../../domain/entities/order.dart';
import '../../data/datasources/mock_orders.dart';
import 'order_details_entity.dart';
import 'orders_history_provider.dart';

// Stores the last order created in this session for instant details navigation
final lastCreatedOrderProvider = StateProvider<Order?>((ref) => null);

// Find order by ID or orderNumber from database or session cache
final orderDetailsProvider =
    Provider.family<OrderDetailsData, String>((ref, orderId) {
  final orders = ref.watch(ordersHistoryProvider);
  final lastCreated = ref.watch(lastCreatedOrderProvider);

  // 1. Look in fresh orders history first (so updates from API take precedence)
  Order? order = orders.where((o) =>
      o.id == orderId ||
      o.orderNumber == orderId ||
      (orderId.isNotEmpty && o.id.toString() == orderId.toString()) ||
      o.orderNumber.replaceAll('-', '').contains(orderId.replaceAll('-', ''))).firstOrNull;

  // 2. Fallback to lastCreated session cache if not yet loaded in history
  if (order == null &&
      lastCreated != null &&
      (lastCreated.id == orderId || lastCreated.orderNumber == orderId)) {
    order = lastCreated;
  }

  order ??= lastCreated ?? (orders.isNotEmpty ? orders.first : mockOrders.first);

  final authUser = ref.watch(authProvider).user;
  final delegateName = authUser?['name'] as String? ?? 'Délégué';
  final delegateRegion = authUser?['region'] as String? ?? '';
  final delegateWilaya = authUser?['wilaya'] as String? ?? '';

  final now = order.createdAt;
  final timeline = _buildTimeline(order, now);
  final payment = _buildPayment(order);

  return OrderDetailsData(
    order: order,
    timeline: timeline,
    payment: payment,
    delegateName: delegateName,
    delegateRegion: delegateRegion,
    delegateWilaya: delegateWilaya,
    rejectionReason: (order.rejectionReason != null && order.rejectionReason!.trim().isNotEmpty)
        ? order.rejectionReason
        : (order.status == OrderStatus.rejected ? 'Aucun motif spécifié.' : null),
  );
});

List<TimelineStep> _buildTimeline(Order order, DateTime base) {
  final steps = <TimelineStep>[];
  final isPartial = order.status == OrderStatus.partiallyValidated;
  final isApproved = order.status == OrderStatus.approved;
  final isPreparing = order.status == OrderStatus.preparing;
  final isDelivered = order.status == OrderStatus.delivered;

  // Step 1: Commande créée
  steps.add(TimelineStep(
    title: 'Commande créée',
    description: 'Enregistrée par le délégué',
    date:
        '${base.day.toString().padLeft(2, '0')} ${_monthName(base.month)} ${base.year}',
    time:
        '${base.hour.toString().padLeft(2, '0')}:${base.minute.toString().padLeft(2, '0')}',
    status: TimelineStepStatus.completed,
  ));

  // If order was rejected, show rejection directly in the timeline
  if (order.status == OrderStatus.rejected) {
    steps.add(TimelineStep(
      title: 'Commande Rejetée',
      description: (order.rejectionReason != null && order.rejectionReason!.isNotEmpty)
          ? 'Motif : ${order.rejectionReason}'
          : 'La commande a été rejetée par l\'administration.',
      date:
          '${order.updatedAt.day.toString().padLeft(2, '0')} ${_monthName(order.updatedAt.month)} ${order.updatedAt.year}',
      time:
          '${order.updatedAt.hour.toString().padLeft(2, '0')}:${order.updatedAt.minute.toString().padLeft(2, '0')}',
      status: TimelineStepStatus.rejected,
    ));
    return steps;
  }

  // Step 2: En attente
  steps.add(TimelineStep(
    title: 'En attente',
    description: 'En attente de traitement commercial',
    date:
        '${base.day.toString().padLeft(2, '0')} ${_monthName(base.month)} ${base.year}',
    time:
        '${base.hour.toString().padLeft(2, '0')}:${base.minute.toString().padLeft(2, '0')}',
    status: order.status == OrderStatus.pending
        ? TimelineStepStatus.current
        : TimelineStepStatus.completed,
  ));

  if (order.isVirtualOnly) {
    // 2-Step Workflow for Recharges / Dematerialized items (Validation Directe)
    final validationDate = base.add(const Duration(hours: 1));
    final isDone = isApproved || isDelivered;
    steps.add(TimelineStep(
      title: isPartial
          ? 'Validation Partielle (Partiel)'
          : (isDone ? 'Validée & Crédit délivré' : 'Validée (Crédit injecté)'),
      description: isPartial
          ? 'Validation partielle de la recharge'
          : (isDone
              ? 'Recharge validée & crédit disponible immédiatement (Validation Directe effectuée)'
              : 'Validation directe sans transport physique'),
      date: (isPartial || isDone)
          ? '${validationDate.day.toString().padLeft(2, '0')} ${_monthName(validationDate.month)} ${validationDate.year}'
          : null,
      time: (isPartial || isDone)
          ? '${validationDate.hour.toString().padLeft(2, '0')}:${validationDate.minute.toString().padLeft(2, '0')}'
          : null,
      status: isDone
          ? TimelineStepStatus.completed
          : isPartial
              ? TimelineStepStatus.current
              : TimelineStepStatus.upcoming,
    ));
  } else {
    // Full Delivery Workflow for Physical SIMs, Scratch cards / tickets, or mixed
    final valDate = base.add(const Duration(hours: 1));
    final hasPassedVal = isApproved || isPreparing || isDelivered;

    steps.add(TimelineStep(
      title: isPartial ? 'Validation Partielle (Partiel)' : 'Validation Administrative',
      description: isPartial
          ? 'Allocation partielle de stock'
          : (hasPassedVal ? 'Stock alloué et approuvé' : 'Validation administrative'),
      date: (isPartial || hasPassedVal)
          ? '${valDate.day.toString().padLeft(2, '0')} ${_monthName(valDate.month)} ${valDate.year}'
          : null,
      time: (isPartial || hasPassedVal)
          ? '${valDate.hour.toString().padLeft(2, '0')}:${valDate.minute.toString().padLeft(2, '0')}'
          : null,
      status: hasPassedVal
          ? TimelineStepStatus.completed
          : isPartial
              ? TimelineStepStatus.current
              : TimelineStepStatus.upcoming,
    ));

    final prepDate = base.add(const Duration(hours: 3));
    final hasPassedPrep = isDelivered;
    steps.add(TimelineStep(
      title: 'En cours d\'acheminement',
      description: 'Expédition et transport physique des cartes/tickets',
      date: (isPreparing || hasPassedPrep)
          ? '${prepDate.day.toString().padLeft(2, '0')} ${_monthName(prepDate.month)} ${prepDate.year}'
          : null,
      time: (isPreparing || hasPassedPrep)
          ? '${prepDate.hour.toString().padLeft(2, '0')}:${prepDate.minute.toString().padLeft(2, '0')}'
          : null,
      status: hasPassedPrep
          ? TimelineStepStatus.completed
          : isPreparing
              ? TimelineStepStatus.current
              : TimelineStepStatus.upcoming,
    ));

    final delDate = base.add(const Duration(hours: 5));
    steps.add(TimelineStep(
      title: 'Livrée',
      description: 'Réception confirmée par le client',
      date: isDelivered
          ? '${delDate.day.toString().padLeft(2, '0')} ${_monthName(delDate.month)} ${delDate.year}'
          : null,
      time: isDelivered
          ? '${delDate.hour.toString().padLeft(2, '0')}:${delDate.minute.toString().padLeft(2, '0')}'
          : null,
      status: isDelivered ? TimelineStepStatus.completed : TimelineStepStatus.upcoming,
    ));
  }

  return steps;
}

OrderPaymentSummary _buildPayment(Order order) {
  final subtotal = order.subtotal;
  final discount = order.totalDiscount;
  return OrderPaymentSummary(
    subtotal: subtotal + discount,
    discount: discount,
    vat: 0,
    delivery: 0,
    total: subtotal,
  );
}

String _monthName(int month) {
  const names = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return names[month];
}

// Re-use the existing orders provider from history
final ordersHistoryProvider = Provider<List<Order>>((ref) {
  final realOrders = ref.watch(ordersProvider).orders;
  if (realOrders.isNotEmpty) return realOrders;
  return mockOrders;
});
