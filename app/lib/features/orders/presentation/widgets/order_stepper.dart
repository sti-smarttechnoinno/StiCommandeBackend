import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';

class OrderStepper extends StatelessWidget {
  final int currentStep;

  const OrderStepper({super.key, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    final steps = [
      const _StepData(label: 'Client', icon: Icons.person_outline_rounded),
      const _StepData(label: 'Produits', icon: Icons.inventory_2_outlined),
      const _StepData(label: 'Confirmation', icon: Icons.check_circle_outline),
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            final stepIndex = index ~/ 2;
            final isCompleted = stepIndex < currentStep;
            return Expanded(
              child: Container(
                height: 2,
                margin: const EdgeInsets.symmetric(horizontal: 8),
                color: isCompleted
                    ? AppColors.success
                    : AppColors.border,
              ),
            );
          }

          final stepIndex = index ~/ 2;
          final step = steps[stepIndex];
          final isActive = stepIndex == currentStep;
          final isCompleted = stepIndex < currentStep;

          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? AppColors.success
                      : isActive
                          ? AppColors.primary
                          : AppColors.border.withAlpha(80),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check_rounded,
                          color: Colors.white, size: 18)
                      : Icon(step.icon,
                          color: isActive
                              ? Colors.white
                              : AppColors.textTertiary,
                          size: 16),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                step.label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight:
                      isActive ? FontWeight.w600 : FontWeight.w500,
                  color: isActive
                      ? AppColors.textPrimary
                      : AppColors.textTertiary,
                ),
              ),
            ],
          );
        }),
      ),
    )
        .animate()
        .fadeIn(delay: 100.ms, duration: 300.ms)
        .slideY(begin: 0.05, end: 0, delay: 100.ms, duration: 300.ms);
  }
}

class _StepData {
  final String label;
  final IconData icon;
  const _StepData({required this.label, required this.icon});
}
