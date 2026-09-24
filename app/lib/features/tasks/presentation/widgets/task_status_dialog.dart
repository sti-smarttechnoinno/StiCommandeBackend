import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/task_models.dart';

class TaskStatusDialog extends StatefulWidget {
  final UserTaskModel task;
  final Future<bool> Function(String newStatus, String? notes) onStatusUpdate;

  const TaskStatusDialog({
    super.key,
    required this.task,
    required this.onStatusUpdate,
  });

  static Future<bool?> show(
    BuildContext context, {
    required UserTaskModel task,
    required Future<bool> Function(String newStatus, String? notes) onStatusUpdate,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => TaskStatusDialog(
        task: task,
        onStatusUpdate: onStatusUpdate,
      ),
    );
  }

  @override
  State<TaskStatusDialog> createState() => _TaskStatusDialogState();
}

class _TaskStatusDialogState extends State<TaskStatusDialog> {
  late String _selectedStatus;
  final TextEditingController _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.task.isProblem) {
      _selectedStatus = 'in_progress';
      _notesController.text = '';
    } else {
      _selectedStatus = widget.task.status;
      _notesController.text = widget.task.completionNotes ?? '';
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  final List<({String status, String label, IconData icon, Color color})> _statusOptions = [
    (
      status: 'pending',
      label: 'En attente',
      icon: Icons.schedule_rounded,
      color: const Color(0xFFF59E0B),
    ),
    (
      status: 'in_progress',
      label: 'En cours',
      icon: Icons.play_circle_outline_rounded,
      color: const Color(0xFF2563EB),
    ),
    (
      status: 'completed',
      label: 'Terminée (soumettre)',
      icon: Icons.check_circle_outline_rounded,
      color: const Color(0xFF16A34A),
    ),
  ];

  Future<void> _handleSubmit() async {
    if (_isSubmitting) return;

    setState(() => _isSubmitting = true);

    final success = await widget.onStatusUpdate(
      _selectedStatus,
      _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.of(context).pop(true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(20),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.published_with_changes_rounded,
                        color: AppColors.primary,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Mettre à jour le statut',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          'Mission #${widget.task.id}',
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  icon: const Icon(Icons.close_rounded, size: 20),
                  color: AppColors.textTertiary,
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Task title preview
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                widget.task.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),

            const SizedBox(height: 16),

            if (widget.task.isValidated) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_rounded, color: Color(0xFF059669), size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Mission Validée',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF065F46),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.task.completionNotes?.isNotEmpty == true
                                ? 'Remarque de validation : ${widget.task.completionNotes}'
                                : 'Cette mission a été approuvée par votre responsable.',
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF047857),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Fermer', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ] else ...[
              if (widget.task.isProblem && widget.task.completionNotes != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFED7AA)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFEA580C), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Problème signalé par le responsable :',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF9A3412),
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              widget.task.completionNotes!,
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFFC2410C),
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              const Text(
                'Sélectionner le statut :',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),

              const SizedBox(height: 10),

              // Status selection grid / chips
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _statusOptions.map((opt) {
                  final isSelected = _selectedStatus == opt.status;
                  return InkWell(
                    onTap: () {
                      setState(() => _selectedStatus = opt.status);
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? opt.color.withAlpha(25) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? opt.color : const Color(0xFFE2E8F0),
                          width: isSelected ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(opt.icon, size: 16, color: opt.color),
                          const SizedBox(width: 6),
                          Text(
                            opt.label,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? opt.color : AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),

              // Notes / justification field
              Text(
                _selectedStatus == 'completed'
                    ? 'Compte-rendu de réalisation :'
                    : 'Notes / Justification (optionnel) :',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),

              const SizedBox(height: 8),

              TextField(
                controller: _notesController,
                maxLines: 3,
                style: const TextStyle(fontSize: 12.5, color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: _selectedStatus == 'completed'
                      ? 'Ex: Visite effectuée avec succès, bon de commande signé...'
                      : 'Notes ou observations pour l\'équipe...',
                  hintStyle: TextStyle(fontSize: 12, color: AppColors.textTertiary),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),

              if (_selectedStatus == 'completed') ...[
                const SizedBox(height: 6),
                Row(
                  children: const [
                    Icon(Icons.info_outline_rounded, size: 13, color: Color(0xFF2563EB)),
                    SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        'Le responsable ayant assigné cette mission recevra une notification.',
                        style: TextStyle(fontSize: 10.5, color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 20),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      child: const Text(
                        'Annuler',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _selectedStatus == 'completed'
                            ? const Color(0xFF16A34A)
                            : AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              _selectedStatus == 'completed'
                                  ? 'Soumettre au responsable'
                                  : 'Enregistrer',
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
