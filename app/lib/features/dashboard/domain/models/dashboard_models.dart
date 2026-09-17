import 'package:flutter/material.dart';

enum OrderStatus { pending, validated, rejected, delivered }

class Order {
  final String id;
  final String? realId;
  final String clientName;
  final DateTime date;
  final String time;
  final double amount;
  final OrderStatus status;
  final bool isVirtual;

  const Order({
    required this.id,
    this.realId,
    required this.clientName,
    required this.date,
    required this.time,
    required this.amount,
    required this.status,
    this.isVirtual = false,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final bool isVirt = json['workflow_type'] == 'virtual' ||
        json['requires_delivery'] == false ||
        (json['items'] is List && (json['items'] as List).isNotEmpty &&
            (json['items'] as List).every((i) {
              final isItemVirt = i['is_virtual'] == true || i['isVirtual'] == true;
              final name = (i['product_name'] ?? '').toString().toLowerCase();
              final cat = (i['category'] ?? '').toString().toLowerCase();
              return isItemVirt ||
                  name.contains('recharge') ||
                  name.contains('credit') ||
                  cat.contains('recharge') ||
                  cat.contains('credit');
            }));

    final rawStatus = (json['status'] as String? ?? 'pending').toLowerCase();
    OrderStatus statusEnum;
    if (rawStatus.contains('valida')) {
      statusEnum = OrderStatus.validated;
    } else if (rawStatus.contains('deliver')) {
      // For virtual orders, delivered implies fully validated
      statusEnum = isVirt ? OrderStatus.validated : OrderStatus.delivered;
    } else if (rawStatus.contains('reject') || rawStatus.contains('cancel')) {
      statusEnum = OrderStatus.rejected;
    } else {
      statusEnum = OrderStatus.pending;
    }

    final createdAtStr = json['created_at'] as String?;
    final dateTime = createdAtStr != null ? DateTime.tryParse(createdAtStr) ?? DateTime.now() : DateTime.now();

    final rawId = json['id']?.toString();
    final orderCode = json['order_code'] as String? ?? json['orderNumber'] as String?;

    return Order(
      id: orderCode ?? rawId ?? 'CMD-000',
      realId: rawId,
      clientName: json['client_name'] as String? ?? 'Client',
      date: dateTime,
      time: '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}',
      amount: (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      status: statusEnum,
      isVirtual: isVirt,
    );
  }

  String get statusLabel {
    switch (status) {
      case OrderStatus.pending:
        return 'En attente';
      case OrderStatus.validated:
        return isVirtual ? 'Validée' : 'Validée';
      case OrderStatus.rejected:
        return 'Rejetée';
      case OrderStatus.delivered:
        return isVirtual ? 'Validée' : 'Livrée';
    }
  }

  Color get statusColor {
    switch (status) {
      case OrderStatus.pending:
        return const Color(0xFFF59E0B);
      case OrderStatus.validated:
        return const Color(0xFF22C55E);
      case OrderStatus.rejected:
        return const Color(0xFFEF4444);
      case OrderStatus.delivered:
        return isVirtual ? const Color(0xFF22C55E) : const Color(0xFF3B82F6);
    }
  }
}

class DashboardStats {
  final int pendingOrders;
  final int validatedOrders;
  final int deliveringOrders;
  final int productsOrdered;
  final int todayProductsOrdered;
  final int totalProductsOrdered;
  final double? productsGrowth;

  const DashboardStats({
    required this.pendingOrders,
    required this.validatedOrders,
    required this.deliveringOrders,
    required this.productsOrdered,
    this.todayProductsOrdered = 0,
    this.totalProductsOrdered = 0,
    this.productsGrowth,
  });

  DashboardStats copyWith({
    int? pendingOrders,
    int? validatedOrders,
    int? deliveringOrders,
    int? productsOrdered,
    int? todayProductsOrdered,
    int? totalProductsOrdered,
    double? productsGrowth,
  }) {
    return DashboardStats(
      pendingOrders: pendingOrders ?? this.pendingOrders,
      validatedOrders: validatedOrders ?? this.validatedOrders,
      deliveringOrders: deliveringOrders ?? this.deliveringOrders,
      productsOrdered: productsOrdered ?? this.productsOrdered,
      todayProductsOrdered: todayProductsOrdered ?? this.todayProductsOrdered,
      totalProductsOrdered: totalProductsOrdered ?? this.totalProductsOrdered,
      productsGrowth: productsGrowth ?? this.productsGrowth,
    );
  }

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final todayProd = (json['todayProductsOrdered'] as num?)?.toInt();
    final prodOrdered = (json['productsOrdered'] as num?)?.toInt() ?? 0;
    final totalProd = (json['totalProductsOrdered'] as num?)?.toInt() ?? prodOrdered;
    final effectiveToday = todayProd ?? prodOrdered;

    return DashboardStats(
      pendingOrders: (json['pendingOrders'] as num?)?.toInt() ?? 0,
      validatedOrders: (json['validatedOrders'] as num?)?.toInt() ?? 0,
      deliveringOrders: (json['deliveringOrders'] as num?)?.toInt() ?? 0,
      productsOrdered: effectiveToday,
      todayProductsOrdered: effectiveToday,
      totalProductsOrdered: totalProd,
      productsGrowth: (json['productsGrowth'] as num?)?.toDouble(),
    );
  }
}

class QuickAction {
  final String label;
  final String? subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const QuickAction({
    required this.label,
    this.subtitle,
    required this.icon,
    required this.color,
    this.onTap,
  });
}

class ObjectiveData {
  final String monthName;
  final double targetRevenue;
  final double achievedRevenue;
  final double remainingRevenue;
  final double revenuePercentage;
  final int targetOrders;
  final int achievedOrders;
  final bool isConfigured;

  const ObjectiveData({
    this.monthName = 'Ce mois',
    this.targetRevenue = 0.0,
    this.achievedRevenue = 0.0,
    this.remainingRevenue = 0.0,
    this.revenuePercentage = 0.0,
    this.targetOrders = 0,
    this.achievedOrders = 0,
    this.isConfigured = false,
  });

  bool get isSet => isConfigured && targetRevenue > 0;

  factory ObjectiveData.fromJson(Map<String, dynamic> json) {
    final targetRev = (json['targetRevenue'] as num?)?.toDouble() ?? 0.0;
    final isConf = (json['isConfigured'] as bool? ?? false) && targetRev > 0;
    return ObjectiveData(
      monthName: json['monthName'] as String? ?? 'Ce mois',
      targetRevenue: targetRev,
      achievedRevenue: (json['achievedRevenue'] as num?)?.toDouble() ?? 0.0,
      remainingRevenue: (json['remainingRevenue'] as num?)?.toDouble() ?? 0.0,
      revenuePercentage: (json['revenuePercentage'] as num?)?.toDouble() ?? 0.0,
      targetOrders: (json['targetOrders'] as num?)?.toInt() ?? 0,
      achievedOrders: (json['achievedOrders'] as num?)?.toInt() ?? 0,
      isConfigured: isConf,
    );
  }
}
