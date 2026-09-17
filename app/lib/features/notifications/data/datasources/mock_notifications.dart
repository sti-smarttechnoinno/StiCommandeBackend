import '../../domain/entities/notification.dart';

final List<AppNotification> mockNotifications = [
  AppNotification(
    id: '1',
    title: 'Commande approuvée',
    description:
        'La commande CMD-240731-0015 a été approuvée par l\'administrateur et est prête pour préparation.',
    type: NotificationType.orderApproved,
    isRead: false,
    createdAt: DateTime.now().subtract(const Duration(minutes: 2)),
    referenceNumber: 'CMD-240731-0015',
  ),
  AppNotification(
    id: '2',
    title: 'Nouveau produit disponible',
    description:
        'Le forfait 10 Go + 500 min est maintenant disponible dans le catalogue. Prix: 2,500 DA.',
    type: NotificationType.productAdded,
    isRead: false,
    createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
    referenceNumber: 'PRD-2024-0042',
  ),
  AppNotification(
    id: '3',
    title: 'Commande en préparation',
    description:
        'La commande CMD-240731-0012 est en cours de préparation au dépôt central.',
    type: NotificationType.orderPreparing,
    isRead: false,
    createdAt: DateTime.now().subtract(const Duration(minutes: 32)),
    referenceNumber: 'CMD-240731-0012',
  ),
  AppNotification(
    id: '4',
    title: 'Alerte de sécurité',
    description:
        'Nouvelle connexion détectée depuis un appareil non reconnu à Alger. Si c\'est vous, ignorez cette alerte.',
    type: NotificationType.securityAlert,
    isRead: false,
    createdAt: DateTime.now().subtract(const Duration(hours: 1)),
  ),
  AppNotification(
    id: '5',
    title: 'Commande livrée',
    description:
        'La commande CMD-240730-0008 a été livrée avec succès au client Boulangerie Atlas.',
    type: NotificationType.orderDelivered,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    referenceNumber: 'CMD-240730-0008',
  ),
  AppNotification(
    id: '6',
    title: 'Mise à jour client',
    description:
        'Le client Kiosk Mobile a mis à jour son adresse de livraison. Nouvelle adresse: Rue Didouche Mourad, Constantine.',
    type: NotificationType.clientUpdate,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    referenceNumber: 'CLI-0042',
  ),
  AppNotification(
    id: '7',
    title: 'Synchronisation terminée',
    description:
        'Toutes les données ont été synchronisées avec succès. Dernière synchronisation: il y a 5 minutes.',
    type: NotificationType.syncCompleted,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(hours: 4)),
  ),
  AppNotification(
    id: '8',
    title: 'Annonce système',
    description:
        'Maintenance planifiée du serveur ce soir de 22h à 23h. Les services peuvent être temporairement indisponibles.',
    type: NotificationType.systemAnnouncement,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(hours: 6)),
  ),
  AppNotification(
    id: '9',
    title: 'Stock disponible',
    description:
        'Le stock de SIM Cards 4G est de nouveau disponible. Quantité: 500 unités au dépôt de Sétif.',
    type: NotificationType.stockAvailable,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(hours: 8)),
    referenceNumber: 'STK-4G-500',
  ),
  AppNotification(
    id: '10',
    title: 'Commande rejetée',
    description:
        'La commande CMD-240729-0003 a été rejetée. Raison: Informations de livraison incomplètes.',
    type: NotificationType.orderRejected,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
    referenceNumber: 'CMD-240729-0003',
  ),
  AppNotification(
    id: '11',
    title: 'Connexion rétablie',
    description:
        'La connexion Internet a été rétablie. Toutes les fonctionnalités sont à nouveau disponibles.',
    type: NotificationType.internetRestored,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
  ),
  AppNotification(
    id: '12',
    title: 'Commande approuvée',
    description:
        'La commande CMD-240728-0019 a été approuvée. Livraison prévue demain matin.',
    type: NotificationType.orderApproved,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 2)),
    referenceNumber: 'CMD-240728-0019',
  ),
  AppNotification(
    id: '13',
    title: 'Mise à jour client',
    description:
        'Le client Tech Solutions a atteint sa limite de crédit. Nouvelle commande en attente de validation.',
    type: NotificationType.clientUpdate,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 2, hours: 4)),
    referenceNumber: 'CLI-0089',
  ),
  AppNotification(
    id: '14',
    title: 'Commande livrée',
    description:
        'La commande CMD-240727-0005 a été livrée au client Point Phone.',
    type: NotificationType.orderDelivered,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 3)),
    referenceNumber: 'CMD-240727-0005',
  ),
  AppNotification(
    id: '15',
    title: 'Annonce système',
    description:
        'Nouvelle version de l\'application disponible (v1.1.0). Mettez à jour pour accéder aux nouvelles fonctionnalités.',
    type: NotificationType.systemAnnouncement,
    isRead: true,
    createdAt: DateTime.now().subtract(const Duration(days: 4)),
  ),
];
