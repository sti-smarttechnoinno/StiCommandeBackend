import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/orders/presentation/pages/new_order_page.dart';
import '../../features/orders/presentation/pages/order_success_page.dart';
import '../../features/orders/presentation/pages/orders_page.dart';
import '../../features/orders/presentation/pages/order_details_page.dart';
import '../../features/clients/presentation/pages/clients_page.dart';
import '../../features/clients/presentation/pages/client_details_page.dart';
import '../../features/products/presentation/pages/products_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/orders/presentation/widgets/ordered_products_card.dart';
import '../../features/chat/domain/models/chat_models.dart';
import '../../features/chat/presentation/pages/chat_inbox_page.dart';
import '../../features/chat/presentation/pages/chat_conversation_page.dart';
import '../../features/tasks/presentation/pages/tasks_page.dart';
import 'main_scaffold.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginPage(),
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return MainScaffold(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/dashboard',
              name: 'dashboard',
              builder: (context, state) => const DashboardPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/orders',
              name: 'orders',
              builder: (context, state) => const OrdersPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/clients',
              name: 'clients',
              builder: (context, state) => const ClientsPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              name: 'profile',
              builder: (context, state) => const ProfilePage(),
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/products',
      name: 'products',
      builder: (context, state) => const ProductsPage(),
    ),
    GoRoute(
      path: '/orders/new',
      name: 'new-order',
      builder: (context, state) => const NewOrderPage(),
    ),
    GoRoute(
      path: '/orders/success',
      name: 'order-success',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return OrderSuccessPage(
          orderNumber: extra['orderNumber'] as String? ?? 'CMD-000000-0000',
          orderId: extra['orderId'] as String? ?? '0',
          clientName: extra['clientName'] as String? ?? '',
          delegate: extra['delegate'] as String? ?? 'Délégué',
          region: extra['region'] as String? ?? '',
          totalAmount: extra['totalAmount'] as double? ?? 0,
          createdAt: extra['createdAt'] as DateTime? ?? DateTime.now(),
          products: extra['products'] as List<OrderedProduct>? ?? const [],
        );
      },
    ),
    GoRoute(
      path: '/orders/:id',
      name: 'order-details',
      builder: (context, state) {
        final orderId = state.pathParameters['id']!;
        return OrderDetailsPage(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/clients/:id',
      name: 'client-details',
      builder: (context, state) {
        final clientId = state.pathParameters['id']!;
        return ClientDetailsPage(clientId: clientId);
      },
    ),
    GoRoute(
      path: '/notifications',
      name: 'notifications',
      builder: (context, state) => const NotificationsPage(),
    ),
    GoRoute(
      path: '/chat',
      name: 'chat',
      builder: (context, state) => const ChatInboxPage(),
    ),
    GoRoute(
      path: '/chat/:userId',
      name: 'chat-conversation',
      builder: (context, state) {
        final userId = int.tryParse(state.pathParameters['userId'] ?? '0') ?? 0;
        final contact = state.extra as ChatContact?;
        return ChatConversationPage(userId: userId, initialContact: contact);
      },
    ),
    GoRoute(
      path: '/tasks',
      name: 'tasks',
      builder: (context, state) => const TasksPage(),
    ),
  ],
);
