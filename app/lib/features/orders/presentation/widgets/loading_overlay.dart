import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';

class LoadingOverlay extends StatelessWidget {
  final String message;

  const LoadingOverlay({
    super.key,
    this.message = 'Transmission de la commande au serveur en cours...',
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.fromLTRB(28, 36, 28, 32),
            decoration: BoxDecoration(
              color: AppColors.surface.withAlpha(245),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: AppColors.primary.withAlpha(40),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withAlpha(25),
                  blurRadius: 36,
                  offset: const Offset(0, 12),
                ),
                BoxShadow(
                  color: Colors.black.withAlpha(30),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animated Glowing Icon Container
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer Pulsing Glow Aura
                    Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary.withAlpha(15),
                      ),
                    )
                        .animate(onPlay: (c) => c.repeat(reverse: true))
                        .scale(
                          begin: const Offset(0.9, 0.9),
                          end: const Offset(1.15, 1.15),
                          duration: 1200.ms,
                          curve: Curves.easeInOut,
                        )
                        .fadeIn(duration: 600.ms),

                    // Rotating Circular Progress Ring
                    SizedBox(
                      width: 76,
                      height: 76,
                      child: CircularProgressIndicator(
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                        backgroundColor: AppColors.primary.withAlpha(25),
                        strokeWidth: 3.5,
                        strokeCap: StrokeCap.round,
                      ),
                    ),

                    // Center Icon Badge with Soft Gradient
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            AppColors.primary,
                            AppColors.primary.withAlpha(200),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withAlpha(80),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.rocket_launch_rounded,
                        color: Colors.white,
                        size: 26,
                      ),
                    )
                        .animate(onPlay: (c) => c.repeat(reverse: true))
                        .slideY(
                          begin: 0.05,
                          end: -0.05,
                          duration: 900.ms,
                          curve: Curves.easeInOut,
                        ),
                  ],
                ),

                const SizedBox(height: 26),

                // Title
                const Text(
                  'Envoi de la Commande',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.3,
                  ),
                )
                    .animate()
                    .fadeIn(delay: 150.ms, duration: 300.ms)
                    .slideY(begin: 0.2, end: 0, duration: 300.ms),

                const SizedBox(height: 8),

                // Message / Subtitle
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: AppColors.textSecondary,
                    height: 1.35,
                  ),
                )
                    .animate()
                    .fadeIn(delay: 250.ms, duration: 300.ms),

                const SizedBox(height: 20),

                // Modern Linear Progress Indicator Bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: SizedBox(
                    width: 140,
                    height: 4,
                    child: LinearProgressIndicator(
                      backgroundColor: AppColors.primary.withAlpha(25),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 350.ms, duration: 300.ms),
              ],
            ),
          ),
        ),
      )
          .animate()
          .fadeIn(duration: 250.ms)
          .scale(
            begin: const Offset(0.88, 0.88),
            end: const Offset(1, 1),
            duration: 300.ms,
            curve: Curves.easeOutCubic,
          ),
    );
  }
}
