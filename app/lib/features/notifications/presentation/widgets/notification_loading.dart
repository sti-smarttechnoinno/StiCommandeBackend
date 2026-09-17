import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';

class NotificationLoadingWidget extends StatelessWidget {
  const NotificationLoadingWidget({super.key});

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
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppConstants.xl,
                AppConstants.md,
                AppConstants.xl,
                0,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 180,
                          height: 28,
                          decoration: BoxDecoration(
                            color: AppColors.shimmer,
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: 240,
                          height: 14,
                          decoration: BoxDecoration(
                            color: AppColors.shimmer,
                            borderRadius: BorderRadius.circular(7),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: AppColors.shimmer,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: AppConstants.sm),
                      Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: AppColors.shimmer,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xxl)),

          // Stats skeleton
          SliverToBoxAdapter(
            child: SizedBox(
              height: 110,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding:
                    const EdgeInsets.symmetric(horizontal: AppConstants.xl),
                itemCount: 4,
                itemBuilder: (_, _) => Container(
                  width: 150,
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

          // Search skeleton
          SliverToBoxAdapter(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppConstants.xl),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xl)),

          // Filter chips skeleton
          SliverToBoxAdapter(
            child: SizedBox(
              height: 44,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding:
                    const EdgeInsets.symmetric(horizontal: AppConstants.xl),
                itemCount: 5,
                itemBuilder: (_, _) => Container(
                  width: 80,
                  height: 36,
                  margin: const EdgeInsets.only(right: AppConstants.sm),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xl)),

          // Card skeletons
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, _) => Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppConstants.xl,
                  vertical: 4,
                ),
                child: Container(
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius:
                        BorderRadius.circular(AppConstants.radiusXl),
                  ),
                ),
              ),
              childCount: 8,
            ),
          ),
        ],
      ),
    );
  }
}
