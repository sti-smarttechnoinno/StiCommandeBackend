import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';

class ProfileLoadingWidget extends StatelessWidget {
  const ProfileLoadingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmer,
      highlightColor: AppColors.surface,
      child: CustomScrollView(
        physics: const NeverScrollableScrollPhysics(),
        slivers: [
          // Header skeleton
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.fromLTRB(
                AppConstants.lg,
                AppConstants.xxl,
                AppConstants.lg,
                0,
              ),
              padding: const EdgeInsets.all(AppConstants.xxl),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(
                children: [
                  Container(
                    width: 96,
                    height: 96,
                    decoration: const BoxDecoration(
                      color: AppColors.shimmer,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(height: AppConstants.lg),
                  Container(
                    width: 160,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.shimmer,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: AppConstants.sm),
                  Container(
                    width: 80,
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.shimmer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: AppConstants.md),
                  Container(
                    width: 120,
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppColors.shimmer,
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  const SizedBox(height: AppConstants.md),
                  Container(
                    width: double.infinity,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.shimmer,
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xxl)),

          // Stats skeleton
          SliverToBoxAdapter(
            child: SizedBox(
              height: 120,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding:
                    const EdgeInsets.symmetric(horizontal: AppConstants.lg),
                  itemCount: 4,
                  itemBuilder: (_, _) => Container(
                  width: 160,
                  margin: const EdgeInsets.only(right: AppConstants.md),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius:
                        BorderRadius.circular(AppConstants.radiusXl),
                  ),
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xxl)),

          // Card skeleton
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: AppConstants.lg),
              height: 280,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xxl)),

          // Another card skeleton
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: AppConstants.lg),
              height: 200,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
