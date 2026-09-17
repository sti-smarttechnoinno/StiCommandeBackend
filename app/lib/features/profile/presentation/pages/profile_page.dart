import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';
import '../widgets/profile_header.dart';
import '../widgets/statistics_cards.dart';
import '../widgets/personal_information_card.dart';
import '../widgets/performance_card.dart';
import '../widgets/quick_actions_card.dart';
import '../widgets/settings_card.dart';
import '../widgets/logout_button.dart';

import '../providers/profile_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        ref.invalidate(rawProfileKpisProvider);
        try {
          await ref.read(rawProfileKpisProvider.future);
        } catch (_) {}
      },
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        slivers: [
          // Header with title and refresh button
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Mon Profil',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Gérez vos informations et paramètres.',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: AppColors.border.withAlpha(60)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(6),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: IconButton(
                      tooltip: 'Actualiser',
                      onPressed: () => ref.invalidate(rawProfileKpisProvider),
                      icon: const Icon(
                        Icons.refresh_rounded,
                        color: AppColors.textSecondary,
                        size: 19,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Profile header
        const ProfileHeader(),

        const SliverToBoxAdapter(
            child: SizedBox(height: AppConstants.xxl)),

        // Statistics
        const StatisticsCards(),

        const SliverToBoxAdapter(
            child: SizedBox(height: AppConstants.xxl)),

        // Personal information
        const PersonalInformationCard(),

        const SliverToBoxAdapter(
            child: SizedBox(height: AppConstants.xxl)),

        // Performance
        const PerformanceCard(),

        const SliverToBoxAdapter(
            child: SizedBox(height: AppConstants.xxl)),

        // Quick actions
        const QuickActionsCard(),

        const SliverToBoxAdapter(
            child: SizedBox(height: AppConstants.xxl)),

        // Settings
        const SettingsCard(),

        const SliverToBoxAdapter(
            child: SizedBox(height: AppConstants.xxl)),

        // Logout
        const LogoutButton(),

        // Bottom spacing
        const SliverToBoxAdapter(
          child: SizedBox(
            height: AppConstants.bottomNavHeight + AppConstants.xxl,
          ),
        ),
      ],
    ),
  );
  }
}
