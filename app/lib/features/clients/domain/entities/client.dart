enum ClientStatus { active, inactive, suspended }

enum BusinessType { retail, wholesaler, distributor }

class Client {
  final String id;
  final String code;
  final String name;
  final String region;
  final String wilaya;
  final String address;
  final String phone;
  final String? whatsapp;
  final double latitude;
  final double longitude;
  final ClientStatus status;
  final BusinessType businessType;
  final double creditLimit;
  final double outstandingBalance;
  final int totalOrders;
  final double totalRevenue;
  final DateTime? lastOrderDate;
  final DateTime? lastPaymentDate;
  final double? lastPaymentAmount;
  final String? lastPaymentMode;
  final String? lastPaymentReference;
  final String? lastPaymentStatus;
  final String? lastPaymentOrderNumber;
  final String? lastPaymentAccount;
  final String? personalPhone;
  final String? stormPhone;
  final DateTime? lastImportDate;
  final DateTime customerSince;
  final bool isFavorite;
  final String? logoUrl;
  final String? delegateId;
  final ClientObjectiveSummary? objective;

  const Client({
    required this.id,
    required this.code,
    required this.name,
    required this.region,
    required this.wilaya,
    required this.address,
    required this.phone,
    this.personalPhone,
    this.stormPhone,
    this.whatsapp,
    this.latitude = 0,
    this.longitude = 0,
    this.status = ClientStatus.active,
    this.businessType = BusinessType.retail,
    this.creditLimit = 0,
    this.outstandingBalance = 0,
    this.totalOrders = 0,
    this.totalRevenue = 0,
    this.lastOrderDate,
    this.lastPaymentDate,
    this.lastPaymentAmount,
    this.lastPaymentMode,
    this.lastPaymentReference,
    this.lastPaymentStatus,
    this.lastPaymentOrderNumber,
    this.lastPaymentAccount,
    this.lastImportDate,
    required this.customerSince,
    this.isFavorite = false,
    this.logoUrl,
    this.delegateId,
    this.objective,
  });

  String get displayPersonalPhone =>
      (personalPhone != null && personalPhone!.trim().isNotEmpty)
          ? personalPhone!.trim()
          : (phone.trim().isNotEmpty ? phone.trim() : 'Non renseigné');

  String get displayStormPhone =>
      (stormPhone != null && stormPhone!.trim().isNotEmpty)
          ? stormPhone!.trim()
          : 'Non renseigné';

  double get availableCredit => creditLimit - outstandingBalance;

  double get creditUsagePercent =>
      creditLimit > 0 ? (outstandingBalance / creditLimit * 100) : 0;

  bool get hasDebt => outstandingBalance > 0;

  String get statusLabel {
    switch (status) {
      case ClientStatus.active:
        return 'Actif';
      case ClientStatus.inactive:
        return 'Inactif';
      case ClientStatus.suspended:
        return 'Suspendu';
    }
  }

  String get businessTypeLabel {
    switch (businessType) {
      case BusinessType.retail:
        return 'Détaillant';
      case BusinessType.wholesaler:
        return 'Grossiste';
      case BusinessType.distributor:
        return 'Distributeur';
    }
  }

  String get initials {
    final words = name.split(' ');
    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length.clamp(0, 2)).toUpperCase();
  }

  factory Client.fromJson(Map<String, dynamic> json) {
    final statusStr = (json['status'] as String? ?? 'active').toLowerCase();
    final ClientStatus status = statusStr == 'suspended' || statusStr == 'blocked'
        ? ClientStatus.suspended
        : statusStr == 'inactive'
            ? ClientStatus.inactive
            : ClientStatus.active;

    final bTypeStr = (json['client_type'] ?? json['clientType'] ?? 'retail').toString().toLowerCase();
    final BusinessType bType = (bTypeStr == 'wholesaler' || bTypeStr == 'wholesale')
        ? BusinessType.wholesaler
        : bTypeStr == 'distributor' || bTypeStr == 'corporate' || bTypeStr == 'government'
            ? BusinessType.distributor
            : BusinessType.retail;

    final lastOrderRaw = json['last_order_at'] ?? json['lastOrderDate'] ?? json['last_order_date'];
    final createdRaw = json['created_at'] ?? json['createdAt'];

    final lastPaymentMap = json['lastPayment'] is Map<String, dynamic> ? json['lastPayment'] as Map<String, dynamic> : null;
    final lastPaymentDateRaw = json['lastPaymentDate'] ?? json['last_payment_date'] ?? lastPaymentMap?['date'];
    final lastPaymentAmount = (json['lastPaymentAmount'] as num?)?.toDouble() ??
        (json['last_payment_amount'] as num?)?.toDouble() ??
        (lastPaymentMap?['amount'] as num?)?.toDouble();
    final lastPaymentMode = json['lastPaymentMode']?.toString() ??
        json['last_payment_mode']?.toString() ??
        lastPaymentMap?['mode']?.toString();
    final lastPaymentRef = json['lastPaymentReference']?.toString() ??
        json['last_payment_reference']?.toString() ??
        lastPaymentMap?['reference']?.toString();
    final lastPaymentStatus = json['lastPaymentStatus']?.toString() ??
        json['last_payment_status']?.toString() ??
        lastPaymentMap?['status']?.toString();
    final lastPaymentOrderNum = json['lastPaymentOrderNumber']?.toString() ??
        json['last_payment_order_number']?.toString() ??
        lastPaymentMap?['orderNumber']?.toString();
    final lastPaymentAcc = json['lastPaymentAccount']?.toString() ??
        json['last_payment_account']?.toString() ??
        lastPaymentMap?['account']?.toString();
    final lastImportRaw = json['lastImportAt'] ?? json['last_import_at'];

    return Client(
      id: json['id']?.toString() ?? '',
      code: json['clientCode']?.toString() ?? json['client_code']?.toString() ?? json['code']?.toString() ?? 'CL-000',
      name: json['name']?.toString() ?? 'Client',
      region: json['region']?.toString() ?? '',
      wilaya: json['wilaya']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      personalPhone: json['personalPhone']?.toString() ?? json['personal_phone']?.toString(),
      stormPhone: json['stormPhone']?.toString() ?? json['storm_phone']?.toString(),
      whatsapp: json['whatsapp']?.toString(),
      status: status,
      businessType: bType,
      creditLimit: (json['creditLimit'] as num?)?.toDouble() ?? (json['credit_limit'] as num?)?.toDouble() ?? 0.0,
      outstandingBalance: (json['outstandingBalance'] as num?)?.toDouble() ?? (json['outstanding_balance'] as num?)?.toDouble() ?? 0.0,
      totalOrders: (json['totalOrders'] as num?)?.toInt() ?? (json['total_orders'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['totalSpent'] as num?)?.toDouble() ?? (json['total_spent'] as num?)?.toDouble() ?? (json['totalRevenue'] as num?)?.toDouble() ?? (json['total_revenue'] as num?)?.toDouble() ?? 0.0,
      lastOrderDate: lastOrderRaw != null ? DateTime.tryParse(lastOrderRaw.toString()) : null,
      lastPaymentDate: lastPaymentDateRaw != null ? DateTime.tryParse(lastPaymentDateRaw.toString()) : null,
      lastPaymentAmount: lastPaymentAmount,
      lastPaymentMode: lastPaymentMode,
      lastPaymentReference: lastPaymentRef,
      lastPaymentStatus: lastPaymentStatus,
      lastPaymentOrderNumber: lastPaymentOrderNum,
      lastPaymentAccount: lastPaymentAcc,
      lastImportDate: lastImportRaw != null ? DateTime.tryParse(lastImportRaw.toString()) : null,
      customerSince: createdRaw != null ? DateTime.tryParse(createdRaw.toString()) ?? DateTime.now() : DateTime.now(),
      delegateId: json['delegateId']?.toString() ?? json['delegate_id']?.toString(),
      objective: json['objective'] is Map<String, dynamic>
          ? ClientObjectiveSummary.fromJson(json['objective'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ClientObjectiveSummary {
  final bool isConfigured;
  final double targetRevenue;
  final double achievedRevenue;
  final double revenuePercentage;
  final int targetOrders;
  final int achievedOrders;
  final String monthName;

  const ClientObjectiveSummary({
    this.isConfigured = false,
    this.targetRevenue = 0.0,
    this.achievedRevenue = 0.0,
    this.revenuePercentage = 0.0,
    this.targetOrders = 0,
    this.achievedOrders = 0,
    this.monthName = 'Ce mois',
  });

  bool get isSet => isConfigured && targetRevenue > 0;

  factory ClientObjectiveSummary.fromJson(Map<String, dynamic> json) {
    final targetRev = (json['targetRevenue'] as num?)?.toDouble() ?? 0.0;
    final isConf = (json['isConfigured'] as bool? ?? false) && targetRev > 0;
    return ClientObjectiveSummary(
      isConfigured: isConf,
      targetRevenue: targetRev,
      achievedRevenue: (json['achievedRevenue'] as num?)?.toDouble() ?? 0.0,
      revenuePercentage: (json['revenuePercentage'] as num?)?.toDouble() ?? 0.0,
      targetOrders: (json['targetOrders'] as num?)?.toInt() ?? 0,
      achievedOrders: (json['achievedOrders'] as num?)?.toInt() ?? 0,
      monthName: json['monthName'] as String? ?? 'Ce mois',
    );
  }
}
