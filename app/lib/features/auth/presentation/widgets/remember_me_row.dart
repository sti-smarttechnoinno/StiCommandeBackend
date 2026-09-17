import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../controller/auth_provider.dart';

class RememberMeRow extends ConsumerWidget {
  const RememberMeRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Row(
      children: [
        SizedBox(
          width: 22,
          height: 22,
          child: Checkbox(
            value: authState.rememberMe,
            onChanged: (_) => ref.read(authProvider.notifier).toggleRememberMe(),
            activeColor: AppColors.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6),
            ),
            side: const BorderSide(color: AppColors.border),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          'Se souvenir de moi',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    )
        .animate()
        .fadeIn(delay: 460.ms, duration: 300.ms)
        .slideY(begin: 0.05, end: 0, delay: 460.ms, duration: 300.ms);
  }
}
