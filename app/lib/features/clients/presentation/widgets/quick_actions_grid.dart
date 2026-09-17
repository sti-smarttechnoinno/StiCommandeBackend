import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/client.dart';

class QuickActionsGrid extends StatelessWidget {
  final Client client;

  const QuickActionsGrid({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _Action(
        icon: Icons.phone_rounded,
        label: 'Appeler',
        color: AppColors.success,
        onTap: () {},
      ),
      _Action(
        icon: Icons.chat_rounded,
        label: 'WhatsApp',
        color: AppColors.success,
        onTap: () {},
      ),
      _Action(
        icon: Icons.location_on_rounded,
        label: 'Localisation',
        color: AppColors.info,
        onTap: () {},
      ),
      _Action(
        icon: Icons.shopping_cart_rounded,
        label: 'Commander',
        color: AppColors.primary,
        isPrimary: true,
        onTap: () {
          context.push('/orders/new', extra: {'clientId': client.id});
        },
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: List.generate(actions.length, (index) {
          final action = actions[index];
          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                left: index > 0 ? 4 : 0,
                right: index < actions.length - 1 ? 4 : 0,
              ),
              child: _ActionCard(
                action: action,
                delay: Duration(milliseconds: 300 + index * 80),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _Action {
  final IconData icon;
  final String label;
  final Color color;
  final bool isPrimary;
  final VoidCallback onTap;

  const _Action({
    required this.icon,
    required this.label,
    required this.color,
    this.isPrimary = false,
    required this.onTap,
  });
}

class _ActionCard extends StatefulWidget {
  final _Action action;
  final Duration delay;

  const _ActionCard({required this.action, required this.delay});

  @override
  State<_ActionCard> createState() => _ActionCardState();
}

class _ActionCardState extends State<_ActionCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final action = widget.action;
    final isPrimary = action.isPrimary;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        action.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          height: 68,
          decoration: BoxDecoration(
            color: isPrimary ? action.color : AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: isPrimary
                ? null
                : Border.all(color: action.color.withAlpha(40)),
            boxShadow: [
              BoxShadow(
                color: isPrimary
                    ? action.color.withAlpha(40)
                    : Colors.black.withAlpha(5),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isPrimary
                      ? Colors.white.withAlpha(30)
                      : action.color.withAlpha(20),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  action.icon,
                  color: isPrimary ? Colors.white : action.color,
                  size: 16,
                ),
              ),
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    action.label,
                    maxLines: 1,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isPrimary ? Colors.white : AppColors.textPrimary,
                      fontSize: 10.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
