import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';

class ClientLoadingSkeleton extends StatelessWidget {
  const ClientLoadingSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(8),
                blurRadius: 12,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _ShimmerBox(width: 56, height: 56, radius: 16),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ShimmerBox(width: 140, height: 16),
                        const SizedBox(height: 6),
                        _ShimmerBox(width: 80, height: 12),
                      ],
                    ),
                  ),
                  _ShimmerBox(width: 60, height: 24, radius: 20),
                ],
              ),
              const SizedBox(height: 16),
              _ShimmerBox(width: 180, height: 14),
              const SizedBox(height: 8),
              _ShimmerBox(width: 140, height: 14),
              const SizedBox(height: 8),
              _ShimmerBox(width: 120, height: 14),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _ShimmerBox(width: 60, height: 30),
                        _ShimmerBox(width: 60, height: 30),
                        _ShimmerBox(width: 60, height: 30),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _ShimmerBox(width: double.infinity, height: 6, radius: 4),
                  ],
                ),
              ),
            ],
          ),
        )
            .animate(
              onComplete: (controller) => controller.repeat(),
            )
            .shimmer(
              duration: const Duration(milliseconds: 1500),
              color: AppColors.shimmer.withAlpha(120),
            );
      },
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;

  const _ShimmerBox({
    required this.width,
    required this.height,
    this.radius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.shimmer.withAlpha(80),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}
