import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/task_models.dart';
import 'task_detail_sheet.dart';

class TaskHistoryTile extends StatelessWidget {
  final TaskHistoryModel history;
  final List<UserTaskModel>? allTasks;

  const TaskHistoryTile({
    super.key,
    required this.history,
    this.allTasks,
  });

  UserTaskModel _resolveTask() {
    if (history.task != null) return history.task!;
    if (allTasks != null) {
      try {
        return allTasks!.firstWhere((t) => t.id == history.taskId);
      } catch (_) {}
    }
    return UserTaskModel(
      id: history.taskId,
      title: history.taskTitle,
      category: 'other',
      priority: 'medium',
      status: history.toStatus ?? 'pending',
      completionNotes: history.notes,
      assignedByName: history.performedByName,
      createdAt: history.createdAt,
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'validated':
        return const Color(0xFF059669);
      case 'completed':
        return const Color(0xFF16A34A);
      case 'in_progress':
        return const Color(0xFF2563EB);
      case 'problem':
        return const Color(0xFFEA580C);
      case 'cancelled':
        return const Color(0xFFDC2626);
      case 'pending':
        return const Color(0xFFD97706);
      default:
        return const Color(0xFF64748B);
    }
  }

  String _formatStatus(String? status) {
    switch (status) {
      case 'validated':
        return 'Validée';
      case 'completed':
        return 'Terminée (soumise)';
      case 'in_progress':
        return 'En cours';
      case 'problem':
        return 'Problème';
      case 'cancelled':
        return 'Annulée';
      case 'pending':
        return 'En attente';
      default:
        return status ?? '-';
    }
  }

  void _openDetail(BuildContext context, UserTaskModel task) {
    TaskDetailSheet.show(
      context,
      task: task,
      onStatusUpdate: (newStatus, notes) async {
        return false;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final task = _resolveTask();
    final toColor = _getStatusColor(history.toStatus ?? task.status);

    return InkWell(
      onTap: () => _openDetail(context, task),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: history.toStatus == 'problem'
                ? const Color(0xFFFED7AA)
                : history.toStatus == 'validated'
                    ? const Color(0xFFA7F3D0)
                    : const Color(0xFFE2E8F0),
            width: (history.toStatus == 'problem' || history.toStatus == 'validated') ? 1.2 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(5),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Actor + Timestamp
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withAlpha(20),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.person_rounded,
                          size: 14,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          history.performedByName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  history.createdAt,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textTertiary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Task Title Row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    history.taskTitle.isNotEmpty ? history.taskTitle : task.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      height: 1.25,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Status Transition Row if present
            if (history.fromStatus != null || history.toStatus != null)
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 6,
                runSpacing: 4,
                children: [
                  if (history.fromStatus != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _formatStatus(history.fromStatus),
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ),
                    const Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF94A3B8)),
                  ],
                  if (history.toStatus != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: toColor.withAlpha(25),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: toColor.withAlpha(80), width: 0.8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: toColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            _formatStatus(history.toStatus),
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: toColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),

            // Notes / Comment if present
            if (history.notes != null && history.notes!.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: history.toStatus == 'problem'
                      ? const Color(0xFFFFF7ED)
                      : history.toStatus == 'validated'
                          ? const Color(0xFFF0FDF4)
                          : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: history.toStatus == 'problem'
                        ? const Color(0xFFFFEDD5)
                        : history.toStatus == 'validated'
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFF1F5F9),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      history.toStatus == 'problem'
                          ? Icons.warning_amber_rounded
                          : history.toStatus == 'validated'
                              ? Icons.verified_rounded
                              : Icons.format_quote_rounded,
                      size: 14,
                      color: history.toStatus == 'problem'
                          ? const Color(0xFFEA580C)
                          : history.toStatus == 'validated'
                              ? const Color(0xFF059669)
                              : AppColors.textTertiary,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        history.notes!,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontStyle: FontStyle.italic,
                          color: history.toStatus == 'problem'
                              ? const Color(0xFF9A3412)
                              : AppColors.textSecondary,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 10),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 8),

            // Footer Row: Details link
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Info label
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.history_toggle_off_rounded, size: 13, color: Color(0xFF94A3B8)),
                    SizedBox(width: 5),
                    Text(
                      'Événement journalisé',
                      style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),

                // Details button (read-only mission inspection)
                InkWell(
                  onTap: () => _openDetail(context, task),
                  borderRadius: BorderRadius.circular(6),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.visibility_outlined, size: 14, color: AppColors.primary),
                        SizedBox(width: 4),
                        Text(
                          'Voir mission',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
