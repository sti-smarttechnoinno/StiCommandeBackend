import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';

class OrderLoading extends StatelessWidget {
  const OrderLoading({super.key});

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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _ShimmerBox(width: 140, height: 16),
                  _ShimmerBox(width: 80, height: 24, radius: 20),
                ],
              ),
              const SizedBox(height: 14),
              _ShimmerBox(width: 180, height: 14),
              const SizedBox(height: 8),
              _ShimmerBox(width: 140, height: 14),
              const SizedBox(height: 8),
              _ShimmerBox(width: 160, height: 14),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    _ShimmerBox(width: double.infinity, height: 14),
                    const SizedBox(height: 8),
                    _ShimmerBox(width: double.infinity, height: 14),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _ShimmerBox(width: 60, height: 20),
                  const Spacer(),
                  _ShimmerBox(width: 100, height: 20),
                ],
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
