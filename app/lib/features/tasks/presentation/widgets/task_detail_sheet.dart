import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/task_models.dart';
import 'task_status_dialog.dart';

class TaskDetailSheet extends StatelessWidget {
  final UserTaskModel task;
  final Future<bool> Function(String newStatus, String? notes) onStatusUpdate;

  const TaskDetailSheet({
    super.key,
    required this.task,
    required this.onStatusUpdate,
  });

  static Future<void> show(
    BuildContext context, {
    required UserTaskModel task,
    required Future<bool> Function(String newStatus, String? notes) onStatusUpdate,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => TaskDetailSheet(
        task: task,
        onStatusUpdate: onStatusUpdate,
      ),
    );
  }

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
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header badges row
          Row(
            children: [
              // Category chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  task.categoryLabel,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF475569),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Priority chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                decoration: BoxDecoration(
                  color: priorityColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: priorityColor.withAlpha(50), width: 0.8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: priorityColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      task.priorityLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: priorityColor,
                      ),
                    ),
                  ],
                ),
              ),

              if (task.isPrivate) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF9333EA).withAlpha(15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF9333EA).withAlpha(40), width: 0.8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.lock_rounded, size: 11, color: Color(0xFF9333EA)),
                      SizedBox(width: 4),
                      Text(
                        'Privée',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF9333EA),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const Spacer(),

              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                decoration: BoxDecoration(
                  color: statusColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withAlpha(70), width: 0.8),
                ),
                child: Text(
                  task.statusLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Title
          Text(
            task.title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
              height: 1.3,
            ),
          ),

          // Description
          if (task.description != null && task.description!.trim().isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                task.description!,
                style: const TextStyle(
                  fontSize: 12.5,
                  height: 1.45,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Metadata Grid: Dates & Attribution
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                _buildInfoRow(
                  icon: Icons.calendar_today_rounded,
                  label: 'Échéance',
                  value: task.dueDate ?? 'Non spécifiée',
                  isWarning: task.isOverdue,
                ),
                const Divider(height: 16, thickness: 0.6, color: Color(0xFFE2E8F0)),
                _buildInfoRow(
                  icon: Icons.person_outline_rounded,
                  label: 'Assignée par',
                  value: task.assignedByName,
                ),
                if (task.assignedToName != null) ...[
                  const Divider(height: 16, thickness: 0.6, color: Color(0xFFE2E8F0)),
                  _buildInfoRow(
                    icon: Icons.assignment_ind_outlined,
                    label: 'Assignée à',
                    value: task.assignedToName!,
                  ),
                ],
                if (task.completedAt != null) ...[
                  const Divider(height: 16, thickness: 0.6, color: Color(0xFFE2E8F0)),
                  _buildInfoRow(
                    icon: Icons.check_circle_outline_rounded,
                    label: 'Complétée le',
                    value: task.completedAt!,
                    valueColor: const Color(0xFF16A34A),
                  ),
                ],
              ],
            ),
          ),

          // Completion Notes if present
          if (task.completionNotes != null && task.completionNotes!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Compte-rendu de réalisation :',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF166534),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    task.completionNotes!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF14532D),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Attachment section if present
          if (task.hasAttachment && task.attachmentName != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.attach_file_rounded,
                      color: Color(0xFF2563EB),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          task.attachmentName!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E40AF),
                          ),
                        ),
                        if (task.fileSize != null)
                          Text(
                            '${(task.fileSize! / 1024).toStringAsFixed(1)} Ko',
                            style: const TextStyle(
                              fontSize: 10.5,
                              color: Color(0xFF3B82F6),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (task.attachmentUrl != null)
                    IconButton(
                      icon: const Icon(Icons.copy_rounded, size: 18, color: Color(0xFF2563EB)),
                      tooltip: 'Copier le lien',
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: task.attachmentUrl!));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Lien du document copié dans le presse-papier'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 20),

          // Primary action button: Change Status
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: task.isValidated
                  ? null
                  : () async {
                      Navigator.of(context).pop();
                      await TaskStatusDialog.show(
                        context,
                        task: task,
                        onStatusUpdate: onStatusUpdate,
                      );
                    },
              icon: Icon(
                task.isValidated
                    ? Icons.verified_rounded
                    : task.isProblem
                        ? Icons.build_circle_rounded
                        : Icons.edit_note_rounded,
                size: 18,
              ),
              label: Text(
                task.isValidated
                    ? 'Mission Validée par le responsable'
                    : task.isProblem
                        ? 'Corriger le problème signalé'
                        : task.isCompleted
                            ? 'Modifier le compte-rendu'
                            : 'Mettre à jour le statut',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: task.isValidated
                    ? const Color(0xFF059669)
                    : task.isProblem
                        ? const Color(0xFFEA580C)
                        : AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFF059669).withAlpha(180),
                disabledForegroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    bool isWarning = false,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 15,
          color: isWarning ? const Color(0xFFDC2626) : AppColors.textTertiary,
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: isWarning ? const Color(0xFFDC2626) : AppColors.textSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isWarning
                ? const Color(0xFFDC2626)
                : (valueColor ?? AppColors.textPrimary),
          ),
        ),
      ],
    );
  }
}
