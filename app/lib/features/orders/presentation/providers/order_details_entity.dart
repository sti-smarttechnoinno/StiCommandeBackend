import '../../domain/entities/order.dart';

class TimelineStep {
  final String title;
  final String? date;
  final String? time;
  final TimelineStepStatus status;
  final String? description;

  const TimelineStep({
    required this.title,
    this.date,
    this.time,
    required this.status,
    this.description,
  });
}

enum TimelineStepStatus { completed, current, upcoming, rejected }

class OrderPaymentSummary {
  final double subtotal;
  final double discount;
  final double vat;
  final double delivery;
  final double total;

  const OrderPaymentSummary({
    required this.subtotal,
    required this.discount,
    required this.vat,
    required this.delivery,
    required this.total,
  });
}

class OrderDetailsData {
  final Order order;
  final List<TimelineStep> timeline;
  final OrderPaymentSummary payment;
  final String delegateName;
  final String delegateRegion;
  final String delegateWilaya;
  final String? rejectionReason;

  const OrderDetailsData({
    required this.order,
    required this.timeline,
    required this.payment,
    required this.delegateName,
    required this.delegateRegion,
    required this.delegateWilaya,
    this.rejectionReason,
  });
}
