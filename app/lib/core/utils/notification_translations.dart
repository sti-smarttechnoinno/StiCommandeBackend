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

    // 2. Order Created / Submitted
    if (type == 'order_submitted' ||
        type == 'order_created' ||
        (rawTitle?.toLowerCase().contains('submitted') ?? false) ||
        (rawTitle?.toLowerCase().contains('soumise') ?? false) ||
        (rawTitle?.toLowerCase().contains('nouvelle commande') ?? false) ||
        (rawTitle?.toLowerCase().contains('new order') ?? false)) {
      final codeMatch = RegExp(r'#(ORD-[^\s]+|\d+)').firstMatch(rawTitle ?? '');
      final codeSuffix = codeMatch != null ? ' ${codeMatch.group(0)}' : '';

      switch (lang) {
        case 'ar':
          return (
            title: 'تم تسجيل الطلبية$codeSuffix',
            body: rawBody ?? 'تم استلام طلبيتك بنجاح وهي قيد المعالجة.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Order$codeSuffix Submitted',
            body: rawBody ?? 'Your order has been submitted successfully.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Commande$codeSuffix Soumise',
            body: rawBody ?? 'Votre commande a été enregistrée avec succès.',
            actionLabel: 'Voir',
          );
      }
    }

    // 3. Order Approved / Validated
    if (type == 'order_approved' || (rawTitle?.toLowerCase().contains('valid') ?? false)) {
      switch (lang) {
        case 'ar':
          return (
            title: 'تم تأكيد الطلبية',
            body: rawBody ?? 'تم تأكيد طلبيتك بنجاح.',
            actionLabel: 'عرض',
          );
        case 'en':
          return (
            title: 'Order Validated',
            body: rawBody ?? 'Your order has been validated successfully.',
            actionLabel: 'View',
          );
        case 'fr':
        default:
          return (
            title: 'Commande Validée',
            body: rawBody ?? 'Votre commande a été validée avec succès.',
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

    // 5. Default / Fallback
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
