import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class QuickActionsCard extends StatelessWidget {
  const QuickActionsCard({super.key});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _ActionItem(
        icon: Icons.receipt_long_rounded,
        label: 'Mes Commandes',
        color: AppColors.primary,
        onTap: () => context.push('/orders'),
      ),
      _ActionItem(
        icon: Icons.task_alt_rounded,
        label: 'Mes Missions',
        color: const Color(0xFFD71920),
        onTap: () => context.push('/tasks'),
      ),
      _ActionItem(
        icon: Icons.people_rounded,
        label: 'Mes Clients',
        color: AppColors.info,
        onTap: () => context.push('/clients'),
      ),
      _ActionItem(
        icon: Icons.notifications_rounded,
        label: 'Notifications',
        color: AppColors.warning,
        onTap: () {},
      ),
      _ActionItem(
        icon: Icons.lock_reset_rounded,
        label: 'Changer Mot de Passe',
        color: AppColors.purple,
        onTap: () {},
      ),
      _ActionItem(
        icon: Icons.download_rounded,
        label: 'Rapports PDF',
        color: AppColors.success,
        onTap: () {},
      ),
      _ActionItem(
        icon: Icons.help_outline_rounded,
        label: 'Centre d\'aide',
        color: AppColors.textSecondary,
        onTap: () {},
      ),
    ];

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border.withAlpha(50)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(5),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.info.withAlpha(15),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(Icons.bolt_rounded,
                      color: AppColors.info, size: 17),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Actions Rapides',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 0.95,
              ),
              itemCount: actions.length,
              itemBuilder: (context, index) {
                return _ActionCard(item: actions[index]);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}

class _ActionCard extends StatefulWidget {
  final _ActionItem item;

  const _ActionCard({required this.item});

  @override
  State<_ActionCard> createState() => _ActionCardState();
}

class _ActionCardState extends State<_ActionCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.item.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _isPressed
                  ? widget.item.color.withAlpha(80)
                  : AppColors.border.withAlpha(60),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: widget.item.color.withAlpha(15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  widget.item.icon,
                  color: widget.item.color,
                  size: 18,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                widget.item.label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
