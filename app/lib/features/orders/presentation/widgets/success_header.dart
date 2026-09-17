import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';

class SuccessHeader extends StatelessWidget {
  final String orderNumber;

  const SuccessHeader({super.key, required this.orderNumber});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 20),
        // Animated check circle (Clean, scaled size)
        SizedBox(
          width: 90,
          height: 90,
          child: Stack(
            alignment: Alignment.center,
            children: [
              ...List.generate(6, (index) {
                final angle = (index * 60) * (3.14159 / 180);
                final delay = index * 80;
                return AnimatedParticle(
                  angle: angle,
                  delay: Duration(milliseconds: delay),
                );
              }),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.success.withAlpha(50),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: Colors.white,
                  size: 36,
                ),
              ),
            ],
          ),
        )
            .animate()
            .scale(
              begin: const Offset(0.6, 0.6),
              end: const Offset(1, 1),
              duration: 500.ms,
              curve: Curves.elasticOut,
            )
            .fadeIn(duration: 300.ms),
        const SizedBox(height: 16),
        // Title (Comfortable, readable size)
        const Text(
          'Commande ajoutée avec succès !',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            letterSpacing: -0.2,
            height: 1.25,
          ),
        )
            .animate()
            .fadeIn(delay: 300.ms, duration: 400.ms)
            .slideY(begin: 0.1, end: 0, delay: 300.ms, duration: 400.ms),
        const SizedBox(height: 8),
        // Subtitle (Proportional font size)
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Votre commande a été enregistrée et sera traitée par l\'administration.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.35,
            ),
          ),
        )
            .animate()
            .fadeIn(delay: 400.ms, duration: 400.ms)
            .slideY(begin: 0.1, end: 0, delay: 400.ms, duration: 400.ms),
      ],
    );
  }
}

class AnimatedParticle extends StatelessWidget {
  final double angle;
  final Duration delay;

  const AnimatedParticle({
    super.key,
    required this.angle,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedPositioned(
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOut,
      child: Container(
        width: 6,
        height: 6,
        decoration: BoxDecoration(
          color: angle > 3.14 ? AppColors.success.withAlpha(150) : AppColors.primary.withAlpha(150),
          shape: BoxShape.circle,
        ),
      ),
    )
        .animate(
          onComplete: (controller) => controller.repeat(),
        )
        .fadeIn(delay: delay, duration: 300.ms)
        .move(
          begin: Offset.zero,
          end: Offset(
            cos(angle) * 40,
            sin(angle) * 40,
          ),
          delay: delay,
          duration: 800.ms,
          curve: Curves.easeOut,
        )
        .then(delay: 400.ms)
        .fadeOut(duration: 200.ms);
  }
}
