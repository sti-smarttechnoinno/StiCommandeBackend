enum ClientStatus { active, inactive, suspended }

class Client {
  final String id;
  final String code;
  final String name;
  final String region;
  final String wilaya;
  final String address;
  final String phone;
  final ClientStatus status;
  final DateTime? lastPaymentDate;
  final double? lastPaymentAmount;
  final String? lastPaymentMode;
  final String? lastPaymentReference;
  final String? lastPaymentStatus;
  final String? lastPaymentOrderNumber;
  final DateTime? lastImportDate;

  const Client({
    required this.id,
    required this.code,
    required this.name,
    required this.region,
    required this.wilaya,
    required this.address,
    required this.phone,
    this.status = ClientStatus.active,
    this.lastPaymentDate,
    this.lastPaymentAmount,
    this.lastPaymentMode,
    this.lastPaymentReference,
    this.lastPaymentStatus,
    this.lastPaymentOrderNumber,
    this.lastImportDate,
  });

  factory Client.fromJson(Map<String, dynamic> json) {
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
    final lastImportRaw = json['lastImportAt'] ?? json['last_import_at'];

    return Client(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? json['client_code']?.toString() ?? json['clientCode']?.toString() ?? '',
      name: json['name']?.toString() ?? json['company_name']?.toString() ?? '',
      region: json['region']?.toString() ?? '',
      wilaya: json['wilaya']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      status: ClientStatus.active,
      lastPaymentDate: lastPaymentDateRaw != null ? DateTime.tryParse(lastPaymentDateRaw.toString()) : null,
      lastPaymentAmount: lastPaymentAmount,
      lastPaymentMode: lastPaymentMode,
      lastPaymentReference: lastPaymentRef,
      lastPaymentStatus: lastPaymentStatus,
      lastPaymentOrderNumber: lastPaymentOrderNum,
      lastImportDate: lastImportRaw != null ? DateTime.tryParse(lastImportRaw.toString()) : null,
    );
  }

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
}
