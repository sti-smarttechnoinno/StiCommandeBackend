import 'dart:ui' as ui;

class NotificationLocalizer {
  /// Detect phone system language (e.g. 'fr', 'ar', 'en')
  static String get phoneLanguageCode {
    try {
      return ui.PlatformDispatcher.instance.locale.languageCode.toLowerCase();
    } catch (_) {
      return 'fr';
    }
  }

  /// Whether current phone language is Arabic (RTL)
  static bool get isArabic => phoneLanguageCode == 'ar';

  /// Get localized Title, Body, and Action Button label based on phone system language
  static ({String title, String body, String actionLabel}) localize({
    required String? type,
    String? rawTitle,
    String? rawBody,
    Map<String, dynamic>? data,
  }) {
    final lang = phoneLanguageCode;

    // 1. Monthly Objective Notification
    if (type == 'monthly_objective' ||
        type == 'objective' ||
        (rawTitle?.toLowerCase().contains('objectif') ?? false) ||
        (rawBody?.toLowerCase().contains('objective') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: 'تم تحديد الهدف الشهري',
            body: 'تم تحديد هدف هذا الشهر، اضغط للاطلاع عليه.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Monthly Objective Set',
            body: 'The objective of this month has been set. Tap to view it.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Objectif Mensuel Fixé',
            body: 'Votre objectif pour ce mois a été fixé. Cliquez pour le consulter.',
            actionLabel: 'Voir',
          );
      }
    }

    // Extract order code if present in data or title
    final rawOrderCode = data?['order_code']?.toString() ?? data?['order_number']?.toString();
    final codeMatch = rawOrderCode != null && rawOrderCode.trim().isNotEmpty
        ? ' #${rawOrderCode.trim()}'
        : (RegExp(r'#(CMD-[^\s]+|ORD-[^\s]+|\d+)').firstMatch(rawTitle ?? '')?.group(0) != null
            ? ' ${RegExp(r'#(CMD-[^\s]+|ORD-[^\s]+|\d+)').firstMatch(rawTitle ?? '')!.group(0)}'
            : '');

    // 2. Order Created / Submitted
    if (type == 'order_submitted' ||
        type == 'order_created' ||
        (rawTitle?.toLowerCase().contains('submitted') ?? false) ||
        (rawTitle?.toLowerCase().contains('soumise') ?? false) ||
        (rawTitle?.toLowerCase().contains('nouvelle commande') ?? false) ||
        (rawTitle?.toLowerCase().contains('new order') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: 'تم تسجيل الطلبية$codeMatch',
            body: rawBody ?? 'تم استلام طلبيتك بنجاح وهي قيد المعالجة.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Order$codeMatch Submitted',
            body: rawBody ?? 'Your order has been submitted successfully.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Commande$codeMatch Soumise',
            body: rawBody ?? 'Votre commande a été enregistrée avec succès.',
            actionLabel: 'Voir',
          );
      }
    }

    // 3. Order Partially Validated (Validation Partielle)
    if (type == 'order_partially_validated' ||
        (rawTitle?.toLowerCase().contains('partiel') ?? false) ||
        (rawBody?.toLowerCase().contains('partiel') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: 'تأكيد جزئي للطلبية$codeMatch',
            body: rawBody ?? 'تمت المصادقة الجزئية على طلبيتك. يرجى مراجعة الكميات المقبولة.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Order$codeMatch Partially Validated',
            body: rawBody ?? 'Your order has been partially validated. Check approved quantities.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Commande$codeMatch Partiellement Validée',
            body: rawBody ?? 'Votre commande a été partiellement validée. Consultez les quantités approuvées.',
            actionLabel: 'Voir',
          );
      }
    }

    // 4. Order Approved / Validated
    if (type == 'order_validated' ||
        type == 'order_approved' ||
        (rawTitle?.toLowerCase().contains('valid') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: 'تم تأكيد الطلبية$codeMatch',
            body: rawBody ?? 'تم تأكيد طلبيتك بنجاح.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Order$codeMatch Validated',
            body: rawBody ?? 'Your order has been validated successfully.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Commande$codeMatch Validée',
            body: rawBody ?? 'Votre commande a été validée avec succès.',
            actionLabel: 'Voir',
          );
      }
    }

    // 5. Order Cancelled
    if (type == 'order_cancelled' ||
        (rawTitle?.toLowerCase().contains('annul') ?? false) ||
        (rawTitle?.toLowerCase().contains('cancel') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: 'تم إلغاء الطلبية$codeMatch',
            body: rawBody ?? 'تم إلغاء هذه الطلبية من طرف الإدارة.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Order$codeMatch Cancelled',
            body: rawBody ?? 'Your order has been cancelled.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Commande$codeMatch Annulée',
            body: rawBody ?? 'Votre commande a été annulée.',
            actionLabel: 'Voir',
          );
      }
    }

    // 3. Order Delivered
    if (type == 'order_delivered' || (rawTitle?.toLowerCase().contains('livr') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: 'تم توصيل الطلبية',
            body: rawBody ?? 'تم تسليم الطلبية للزبون بنجاح.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Order Delivered',
            body: rawBody ?? 'The order has been delivered to the client.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Commande Livrée',
            body: rawBody ?? 'La commande a été livrée au client.',
            actionLabel: 'Voir',
          );
      }
    }

    // 4. Broadcast / Announcement Messages
    if (type == 'broadcast_message' || (rawTitle?.toLowerCase().contains('diffus') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: rawTitle ?? 'إعلان جديد',
            body: rawBody ?? 'وصلتك رسالة وتنبيه جديد من الإدارة.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: rawTitle ?? 'New Broadcast Alert',
            body: rawBody ?? 'A new alert has been broadcasted by management.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: rawTitle ?? 'Nouvelle Diffusion',
            body: rawBody ?? 'Une nouvelle annonce a été diffusée par la direction.',
            actionLabel: 'Voir',
          );
      }
    }

    // 5. Task / Mission Notifications
    if (type == 'task_created' ||
        type == 'task_assigned' ||
        type == 'task_updated' ||
        type == 'task_status_changed' ||
        type == 'task' ||
        (type?.startsWith('task') ?? false) ||
        (type?.startsWith('mission') ?? false) ||
        (rawTitle?.toLowerCase().contains('mission') ?? false) ||
        (rawTitle?.toLowerCase().contains('tâche') ?? false)) {
      final isNewTask = type == 'task_created' || type == 'task_assigned';
      switch (lang) {
        case 'ar':
          return (
            title: isNewTask ? 'مهمة جديدة مسندة إليك' : (rawTitle ?? 'تحديث في المهمة'),
            body: rawBody ?? (isNewTask ? 'تم إسناد مهمة جديدة لك، يرجى الاطلاع عليها.' : 'تم تعديل حالة المهمة.'),
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: isNewTask ? 'New Mission Assigned' : (rawTitle ?? 'Mission Status Updated'),
            body: rawBody ?? (isNewTask ? 'A new task has been assigned to you.' : 'Task status has been updated.'),
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: isNewTask ? 'Nouvelle Mission Assignée' : (rawTitle ?? 'Mise à jour de la Mission'),
            body: rawBody ?? (isNewTask ? 'Une nouvelle tâche vous a été assignée.' : 'Le statut de la tâche a été mis à jour.'),
            actionLabel: 'Voir',
          );
      }
    }

    // 6. Default / Fallback
    final actionLabel = lang == 'ar' ? 'عرض' : (lang == 'en' ? 'View' : 'Voir');
    final defaultTitle = lang == 'ar'
        ? 'إشعار جديد'
        : (lang == 'en' ? 'New Notification' : 'Nouvelle Notification');
    final defaultBody = lang == 'ar'
        ? 'اضغط هنا لمشاهدة التفاصيل'
        : (lang == 'en' ? 'Tap here to view details' : 'Cliquez ici pour voir les détails');

    return (
      title: (rawTitle != null && rawTitle.trim().isNotEmpty) ? rawTitle : defaultTitle,
      body: (rawBody != null && rawBody.trim().isNotEmpty) ? rawBody : defaultBody,
      actionLabel: actionLabel,
    );
  }
}
