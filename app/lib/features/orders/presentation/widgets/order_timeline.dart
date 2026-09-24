import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/order_details_entity.dart';

import '../../domain/entities/order.dart';

class OrderTimeline extends StatelessWidget {
  final List<TimelineStep> steps;
  final Order? order;

  const OrderTimeline({super.key, required this.steps, this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withAlpha(50)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.success.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.timeline_rounded,
                    color: AppColors.success, size: 15),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Suivi & Acheminement',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              if (order != null)
                Flexible(
                  child: Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    alignment: WrapAlignment.end,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (order!.status == OrderStatus.rejected)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.danger.withAlpha(20),
                            borderRadius: BorderRadius.circular(20),
                            border:
                                Border.all(color: AppColors.danger.withAlpha(80)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.cancel_outlined,
                                  size: 11, color: AppColors.danger),
                              SizedBox(width: 2.5),
                              Text(
                                'Rejetée',
                                style: TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.danger,
                                ),
                              ),
                            ],
                          ),
                        )
                      else if (order!.isVirtualOnly)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.success.withAlpha(20),
                            borderRadius: BorderRadius.circular(20),
                            border:
                                Border.all(color: AppColors.success.withAlpha(70)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.bolt_rounded,
                                  size: 11, color: AppColors.success),
                              SizedBox(width: 2.5),
                              Text(
                                'Validation Directe',
                                style: TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.success,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withAlpha(20),
                            borderRadius: BorderRadius.circular(20),
                            border:
                                Border.all(color: AppColors.primary.withAlpha(70)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.local_shipping_outlined,
                                  size: 11, color: AppColors.primary),
                              SizedBox(width: 2.5),
                              Text(
                                'Livraison requise',
                                style: TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (order!.isPartial)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.amber.withAlpha(30),
                            borderRadius: BorderRadius.circular(20),
                            border:
                                Border.all(color: Colors.amber.withAlpha(90)),
                          ),
                          child: const Text(
                            'Partiel',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: Colors.amber,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(steps.length * 2 - 1, (index) {
            if (index.isOdd) {
              final stepIndex = index ~/ 2;
              final step = steps[stepIndex];
              final nextStep = stepIndex < steps.length - 1
                  ? steps[stepIndex + 1]
                  : null;
              final isLastConnector =
                  nextStep == null || nextStep.status == TimelineStepStatus.upcoming;
              final isRejectedConnector = nextStep?.status == TimelineStepStatus.rejected;
              return _TimelineConnector(
                isActive: step.status == TimelineStepStatus.completed,
                isRejected: isRejectedConnector,
                isLast: isLastConnector,
              );
            }
            final stepIndex = index ~/ 2;
            return _TimelineStepWidget(
              step: steps[stepIndex],
              index: stepIndex,
            );
          }),
        ],
      ),
    );
  }
}

class _TimelineConnector extends StatelessWidget {
  final bool isActive;
  final bool isRejected;
  final bool isLast;

  const _TimelineConnector({
    required this.isActive,
    this.isRejected = false,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 18,
          child: Center(
            child: Container(
              width: 2,
              height: isLast ? 14 : 20,
              color: isRejected
                  ? AppColors.danger
                  : (isActive ? AppColors.success : AppColors.border.withAlpha(80)),
            ),
          ),
        ),
        const SizedBox(width: 12),
      ],
    );
  }
}

class _TimelineStepWidget extends StatelessWidget {
  final TimelineStep step;
  final int index;

  const _TimelineStepWidget({required this.step, required this.index});

  @override
  Widget build(BuildContext context) {
    final isCompleted = step.status == TimelineStepStatus.completed;
    final isCurrent = step.status == TimelineStepStatus.current;
    final isRejected = step.status == TimelineStepStatus.rejected;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Circle indicator
        Container(
          width: 18,
          height: 18,
          margin: const EdgeInsets.only(top: 2),
          decoration: BoxDecoration(
            color: isRejected
                ? AppColors.danger
                : isCompleted
                    ? AppColors.success
                    : isCurrent
                        ? AppColors.primary
                        : AppColors.surface,
            shape: BoxShape.circle,
            border: Border.all(
              color: isRejected
                  ? AppColors.danger
                  : isCompleted
                      ? AppColors.success
                      : isCurrent
                          ? AppColors.primary
                          : AppColors.border,
              width: 1.8,
            ),
          ),
          child: isRejected
              ? const Icon(Icons.close_rounded, color: Colors.white, size: 10)
              : isCompleted
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 10)
                  : isCurrent
                      ? Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        )
                      : null,
        ),

        const SizedBox(width: 10),

        // Content
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: isRejected
                  ? AppColors.dangerLight
                  : isCurrent
                      ? AppColors.primary.withAlpha(10)
                      : isCompleted
                          ? AppColors.successLight.withAlpha(40)
                          : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              border: isRejected
                  ? Border.all(color: AppColors.danger.withAlpha(50))
                  : isCurrent
                      ? Border.all(color: AppColors.primary.withAlpha(30))
                      : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.title,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: isCurrent || isRejected ? FontWeight.w700 : FontWeight.w600,
                    color: isRejected
                        ? AppColors.danger
                        : (isCompleted || isCurrent
                            ? AppColors.textPrimary
                            : AppColors.textTertiary),
                  ),
                ),
                if (step.description != null && step.description!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    step.description!,
                    style: TextStyle(
                      fontSize: 10.5,
                      color: isRejected
                          ? AppColors.danger.withAlpha(220)
                          : (isCompleted || isCurrent
                              ? AppColors.textSecondary
                              : AppColors.textTertiary),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
                if (step.date != null || step.time != null) ...[
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      if (step.date != null) ...[
                        Icon(Icons.calendar_today_rounded,
                            size: 11,
                            color: isCompleted || isCurrent
                                ? AppColors.textSecondary
                                : AppColors.textTertiary),
                        const SizedBox(width: 3),
                        Text(
                          step.date!,
                          style: TextStyle(
                            color: isCompleted || isCurrent
                                ? AppColors.textSecondary
                                : AppColors.textTertiary,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      if (step.date != null && step.time != null)
                        const SizedBox(width: 8),
                      if (step.time != null) ...[
                        Icon(Icons.access_time_rounded,
                            size: 11,
                            color: isCompleted || isCurrent
                                ? AppColors.textSecondary
                                : AppColors.textTertiary),
                        const SizedBox(width: 3),
                        Text(
                          step.time!,
                          style: TextStyle(
                            color: isCompleted || isCurrent
                                ? AppColors.textSecondary
                                : AppColors.textTertiary,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
                if (isCurrent) ...[
                  const SizedBox(height: 3),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(18),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'En cours',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 9.5,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
