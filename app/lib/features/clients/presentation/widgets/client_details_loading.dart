import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';

class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmer,
      highlightColor: AppColors.surface,
      child: CustomScrollView(
        physics: const NeverScrollableScrollPhysics(),
        slivers: [
          // Profile skeleton
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.fromLTRB(
                AppConstants.xl,
                AppConstants.xxl,
                AppConstants.xl,
                0,
              ),
              padding: const EdgeInsets.all(AppConstants.xxl),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: const BoxDecoration(
                          color: AppColors.shimmer,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: AppConstants.lg),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 160,
                              height: 22,
                              decoration: BoxDecoration(
                                color: AppColors.shimmer,
                                borderRadius: BorderRadius.circular(11),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              width: 100,
                              height: 16,
                              decoration: BoxDecoration(
                                color: AppColors.shimmer,
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppConstants.xl),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: AppConstants.md,
                    crossAxisSpacing: AppConstants.md,
                    childAspectRatio: 3.2,
                    children: List.generate(
                      6,
                      (_) => Container(
                        decoration: BoxDecoration(
                          color: AppColors.shimmer,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xxl)),

          // Financial skeleton
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
              height: 180,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
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
                    const EdgeInsets.symmetric(horizontal: AppConstants.xl),
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

          // Orders skeleton
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
              height: 280,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppConstants.xxl)),

          // Products skeleton
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
              height: 250,
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
