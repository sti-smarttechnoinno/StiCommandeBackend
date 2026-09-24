import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/task_models.dart';
import 'task_detail_sheet.dart';
import 'task_status_dialog.dart';

class TaskCard extends StatelessWidget {
  final UserTaskModel task;
  final Future<bool> Function(String newStatus, String? notes) onStatusUpdate;

  const TaskCard({
    super.key,
    required this.task,
    required this.onStatusUpdate,
  });

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'urgent':
        return const Color(0xFFDC2626);
      case 'high':
        return const Color(0xFFD97706);
      case 'medium':
        return const Color(0xFF2563EB);
      case 'low':
      default:
        return const Color(0xFF64748B);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'validated':
        return const Color(0xFF059669);
      case 'completed':
        return const Color(0xFF16A34A);
      case 'problem':
        return const Color(0xFFEA580C);
      case 'in_progress':
        return const Color(0xFF2563EB);
      case 'cancelled':
        return const Color(0xFFDC2626);
      case 'pending':
      default:
        return const Color(0xFFD97706);
    }
  }

  @override
  Widget build(BuildContext context) {
    final priorityColor = _getPriorityColor(task.priority);
    final statusColor = _getStatusColor(task.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: task.isOverdue
              ? const Color(0xFFFCA5A5)
              : const Color(0xFFE2E8F0),
          width: task.isOverdue ? 1.2 : 0.8,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            TaskDetailSheet.show(
              context,
              task: task,
              onStatusUpdate: onStatusUpdate,
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top line: Category chip, Priority chip, Due date, Private lock
                Row(
                  children: [
                    // Category Chip
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        task.categoryLabel,
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Priority Chip
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: priorityColor.withAlpha(18),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: priorityColor.withAlpha(50), width: 0.7),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 5.5,
                            height: 5.5,
                            decoration: BoxDecoration(
                              color: priorityColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            task.priorityLabel,
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: priorityColor,
                            ),
                          ),
                        ],
                      ),
                    ),

                    if (task.isPrivate) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF9333EA).withAlpha(15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(
                          Icons.lock_rounded,
                          size: 11,
                          color: Color(0xFF9333EA),
                        ),
                      ),
                    ],

                    const Spacer(),

                    // Due date or Overdue indicator
                    if (task.dueDate != null)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.calendar_today_rounded,
                            size: 11.5,
                            color: task.isOverdue ? const Color(0xFFDC2626) : AppColors.textTertiary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            task.dueDate!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: task.isOverdue ? FontWeight.w800 : FontWeight.w600,
                              color: task.isOverdue ? const Color(0xFFDC2626) : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),

                const SizedBox(height: 10),

                // Title
                Text(
                  task.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.25,
                  ),
                ),

                // Description (preview)
                if (task.description != null && task.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    task.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],

                // Assigned by Responsable indicator
                if (task.assignedByName.isNotEmpty) ...[
                  const SizedBox(height: 7),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 0.6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.supervisor_account_rounded,
                          size: 13,
                          color: Color(0xFF475569),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Assignée par : ${task.assignedByName}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                if (task.completionNotes != null && task.completionNotes!.trim().isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: task.isProblem
                          ? const Color(0xFFFFF7ED)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: task.isProblem
                            ? const Color(0xFFFED7AA)
                            : const Color(0xFFE2E8F0),
                        width: 0.8,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          task.isProblem ? Icons.warning_amber_rounded : Icons.comment_outlined,
                          size: 13,
                          color: task.isProblem ? const Color(0xFFEA580C) : AppColors.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            task.isProblem
                                ? 'Problème : ${task.completionNotes}'
                                : 'Note : ${task.completionNotes}',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: task.isProblem ? FontWeight.w700 : FontWeight.w500,
                              color: task.isProblem ? const Color(0xFF9A3412) : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 12),

                // Divider
                const Divider(height: 1, thickness: 0.6, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 10),

                // Footer Row: Status badge + Attachment indicator + Quick action
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Status Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withAlpha(20),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: statusColor.withAlpha(60), width: 0.8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (task.isValidated) ...[
                            const Icon(Icons.verified_rounded, size: 12, color: Color(0xFF059669)),
                            const SizedBox(width: 4),
                          ] else if (task.isProblem) ...[
                            const Icon(Icons.warning_amber_rounded, size: 12, color: Color(0xFFEA580C)),
                            const SizedBox(width: 4),
                          ],
                          Text(
                            task.statusLabel,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Attachment Icon if any
                    if (task.hasAttachment)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.attach_file_rounded, size: 14, color: Color(0xFF2563EB)),
                          SizedBox(width: 2),
                          Text(
                            'Pièce jointe',
                            style: TextStyle(
                              fontSize: 10.5,
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),

                    // Quick Action Button
                    InkWell(
                      onTap: () {
                        TaskStatusDialog.show(
                          context,
                          task: task,
                          onStatusUpdate: onStatusUpdate,
                        );
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: task.isValidated
                              ? const Color(0xFFECFDF5)
                              : task.isProblem
                                  ? const Color(0xFFFFF7ED)
                                  : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: task.isValidated
                                ? const Color(0xFFA7F3D0)
                                : task.isProblem
                                    ? const Color(0xFFFED7AA)
                                    : const Color(0xFFCBD5E1),
                            width: 0.8,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              task.isValidated
                                  ? Icons.verified_outlined
                                  : task.isProblem
                                      ? Icons.build_circle_outlined
                                      : Icons.edit_note_rounded,
                              size: 14,
                              color: task.isValidated
                                  ? const Color(0xFF059669)
                                  : task.isProblem
                                      ? const Color(0xFFEA580C)
                                      : AppColors.textPrimary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              task.isValidated
                                  ? 'Validée'
                                  : task.isProblem
                                      ? 'Corriger'
                                      : task.isCompleted
                                          ? 'En attente'
                                          : 'Changer statut',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: task.isValidated
                                    ? const Color(0xFF059669)
                                    : task.isProblem
                                        ? const Color(0xFFEA580C)
                                        : AppColors.textPrimary,
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
        ),
      ),
    );
  }
}
