enum NotificationType {
  orderApproved,
  orderRejected,
  orderDelivered,
  orderPreparing,
  stockAvailable,
  productAdded,
  clientUpdate,
  systemAnnouncement,
  syncCompleted,
  internetRestored,
  securityAlert,
}

enum NotificationFilter { all, unread, orders, clients, inventory, system, security }

class AppNotification {
  final String id;
  final String title;
  final String description;
  final NotificationType type;
  final bool isRead;
  final bool isPinned;
  final DateTime createdAt;
  final String? referenceId;
  final String? referenceNumber;
  final String? imageUrl;

  const AppNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.isRead,
    this.isPinned = false,
    required this.createdAt,
    this.referenceId,
    this.referenceNumber,
    this.imageUrl,
  });

  AppNotification copyWith({
    String? id,
    String? title,
    String? description,
    NotificationType? type,
    bool? isRead,
    bool? isPinned,
    DateTime? createdAt,
    String? referenceId,
    String? referenceNumber,
    String? imageUrl,
  }) {
    return AppNotification(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      type: type ?? this.type,
      isRead: isRead ?? this.isRead,
      isPinned: isPinned ?? this.isPinned,
      createdAt: createdAt ?? this.createdAt,
      referenceId: referenceId ?? this.referenceId,
      referenceNumber: referenceNumber ?? this.referenceNumber,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final cat = (json['category'] as String? ?? 'system').toLowerCase();
    final title = (json['title'] as String? ?? 'Notification').toLowerCase();

    NotificationType nType;
    if (cat.contains('order') || title.contains('order') || title.contains('commande')) {
      if (title.contains('valida') || title.contains('approved')) {
        nType = NotificationType.orderApproved;
      } else if (title.contains('reject') || title.contains('rejet') || title.contains('cancel')) {
        nType = NotificationType.orderRejected;
      } else if (title.contains('deliver') || title.contains('livr')) {
        nType = NotificationType.orderDelivered;
      } else {
        nType = NotificationType.orderPreparing;
      }
    } else if (cat.contains('client')) {
      nType = NotificationType.clientUpdate;
    } else if (cat.contains('stock') || cat.contains('inventory') || cat.contains('product')) {
      nType = NotificationType.stockAvailable;
    } else if (cat.contains('secu')) {
      nType = NotificationType.securityAlert;
    } else {
      nType = NotificationType.systemAnnouncement;
    }

    final createdAtStr = json['timestamp'] as String? ?? json['created_at'] as String?;
    final date = createdAtStr != null
        ? DateTime.tryParse(createdAtStr) ?? DateTime.now()
        : DateTime.now();

    return AppNotification(
      id: json['id']?.toString() ?? '1',
      title: json['title'] as String? ?? 'Notification',
      description: json['description'] as String? ?? '',
      type: nType,
      isRead: json['read'] as bool? ?? (json['status'] == 'read'),
      isPinned: json['isPinned'] as bool? ?? false,
      createdAt: date,
      referenceId: json['referenceId'] as String? ?? json['reference_id'] as String?,
      referenceNumber: json['referenceNumber'] as String? ?? json['reference_id'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  NotificationCategory get category {
    switch (type) {
      case NotificationType.orderApproved:
      case NotificationType.orderRejected:
      case NotificationType.orderDelivered:
      case NotificationType.orderPreparing:
        return NotificationCategory.orders;
      case NotificationType.clientUpdate:
        return NotificationCategory.clients;
      case NotificationType.stockAvailable:
      case NotificationType.productAdded:
        return NotificationCategory.inventory;
      case NotificationType.systemAnnouncement:
      case NotificationType.syncCompleted:
      case NotificationType.internetRestored:
        return NotificationCategory.system;
      case NotificationType.securityAlert:
        return NotificationCategory.security;
    }
  }
}

enum NotificationCategory { orders, clients, inventory, system, security }
