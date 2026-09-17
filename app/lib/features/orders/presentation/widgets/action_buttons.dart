import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';

class ActionButtons extends ConsumerWidget {
  final String orderId;

  const ActionButtons({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {
                // Navigate to order details
                context.push('/orders/$orderId');
              },
              icon: const Icon(Icons.description_outlined, size: 17),
              label: const Text(
                'Voir la commande',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textPrimary,
                side: const BorderSide(color: AppColors.border),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                ref.read(dashboardProvider.notifier).loadRealData();
                context.go('/dashboard');
              },
              icon: const Icon(Icons.home_outlined, size: 17),
              label: const Text(
                'Retour à l\'accueil',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 900.ms, duration: 300.ms)
        .slideY(begin: 0.08, end: 0, delay: 900.ms, duration: 300.ms);
  }
}
