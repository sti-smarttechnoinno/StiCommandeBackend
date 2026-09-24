class UserTaskModel {
  final int id;
  final String title;
  final String? description;
  final bool isPrivate;
  final String category;
  final String priority;
  final String status;
  final String? dueDate;
  final double? targetAmount;
  final int? targetCount;
  final int? achievedCount;
  final bool hasAttachment;
  final String? attachmentUrl;
  final String? attachmentName;
  final int? fileSize;
  final String? fileMime;
  final int? assignedBy;
  final String assignedByName;
  final int? assignedTo;
  final String? assignedToName;
  final String? completedAt;
  final String? completionNotes;
  final String createdAt;
  final String? updatedAt;

  const UserTaskModel({
    required this.id,
    required this.title,
    this.description,
    this.isPrivate = false,
    required this.category,
    required this.priority,
    required this.status,
    this.dueDate,
    this.targetAmount,
    this.targetCount,
    this.achievedCount,
    this.hasAttachment = false,
    this.attachmentUrl,
    this.attachmentName,
    this.fileSize,
    this.fileMime,
    this.assignedBy,
    required this.assignedByName,
    this.assignedTo,
    this.assignedToName,
    this.completedAt,
    this.completionNotes,
    required this.createdAt,
    this.updatedAt,
  });

  factory UserTaskModel.fromJson(Map<String, dynamic> json) {
    return UserTaskModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? 'Sans titre',
      description: json['description'] as String?,
      isPrivate: json['is_private'] == true || json['is_private'] == 1,
      category: json['category'] as String? ?? 'general',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'pending',
      dueDate: json['due_date'] as String?,
      targetAmount: (json['target_amount'] as num?)?.toDouble(),
      targetCount: (json['target_count'] as num?)?.toInt(),
      achievedCount: (json['achieved_count'] as num?)?.toInt(),
      hasAttachment: json['has_attachment'] == true ||
          json['has_attachment'] == 1 ||
          json['has_file_attribution'] == true ||
          json['has_file_attribution'] == 1 ||
          (json['attachment_url'] != null && json['attachment_url'].toString().isNotEmpty),
      attachmentUrl: (json['attachment_url'] ?? json['file_url']) as String?,
      attachmentName: (json['attachment_name'] ?? json['file_name']) as String?,
      fileSize: (json['file_size'] as num?)?.toInt(),
      fileMime: json['file_mime'] as String?,
      assignedBy: json['assigned_by'] is int
          ? json['assigned_by'] as int
          : (json['assigned_by'] is num
              ? (json['assigned_by'] as num).toInt()
              : (json['assigned_by'] is Map
                  ? (json['assigned_by']['id'] as num?)?.toInt()
                  : (json['assigned_by_id'] as num?)?.toInt())),
      assignedByName: (json['assigned_by_name'] as String?) ??
          (json['assigned_by'] is Map ? json['assigned_by']['name'] as String? : null) ??
          'Responsable STI',
      assignedTo: json['assigned_to'] is int
          ? json['assigned_to'] as int
          : (json['assigned_to'] is num
              ? (json['assigned_to'] as num).toInt()
              : (json['assigned_to'] is Map
                  ? (json['assigned_to']['id'] as num?)?.toInt()
                  : (json['assigned_to_id'] as num?)?.toInt())),
      assignedToName: (json['assigned_to_name'] as String?) ??
          (json['assigned_to'] is Map ? json['assigned_to']['name'] as String? : null),
      completedAt: json['completed_at'] as String?,
      completionNotes: json['completion_notes'] as String?,
      createdAt: json['created_at'] as String? ?? DateTime.now().toIso8601String(),
      updatedAt: json['updated_at'] as String?,
    );
  }

  UserTaskModel copyWith({
    int? id,
    String? title,
    String? description,
    bool? isPrivate,
    String? category,
    String? priority,
    String? status,
    String? dueDate,
    double? targetAmount,
    int? targetCount,
    int? achievedCount,
    bool? hasAttachment,
    String? attachmentUrl,
    String? attachmentName,
    int? fileSize,
    String? fileMime,
    int? assignedBy,
    String? assignedByName,
    int? assignedTo,
    String? assignedToName,
    String? completedAt,
    String? completionNotes,
    String? createdAt,
    String? updatedAt,
  }) {
    return UserTaskModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      isPrivate: isPrivate ?? this.isPrivate,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      dueDate: dueDate ?? this.dueDate,
      targetAmount: targetAmount ?? this.targetAmount,
      targetCount: targetCount ?? this.targetCount,
      achievedCount: achievedCount ?? this.achievedCount,
      hasAttachment: hasAttachment ?? this.hasAttachment,
      attachmentUrl: attachmentUrl ?? this.attachmentUrl,
      attachmentName: attachmentName ?? this.attachmentName,
      fileSize: fileSize ?? this.fileSize,
      fileMime: fileMime ?? this.fileMime,
      assignedBy: assignedBy ?? this.assignedBy,
      assignedByName: assignedByName ?? this.assignedByName,
      assignedTo: assignedTo ?? this.assignedTo,
      assignedToName: assignedToName ?? this.assignedToName,
      completedAt: completedAt ?? this.completedAt,
      completionNotes: completionNotes ?? this.completionNotes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  bool get isPending => status == 'pending';
  bool get isInProgress => status == 'in_progress';
  bool get isCompleted => status == 'completed';
  bool get isValidated => status == 'validated';
  bool get isProblem => status == 'problem';
  bool get isCancelled => status == 'cancelled';

  bool get isOverdue {
    if (dueDate == null || isCompleted || isValidated || isCancelled) return false;
    try {
      final due = DateTime.parse(dueDate!);
      final today = DateTime.now();
      final dateOnlyDue = DateTime(due.year, due.month, due.day);
      final dateOnlyToday = DateTime(today.year, today.month, today.day);
      return dateOnlyDue.isBefore(dateOnlyToday);
    } catch (_) {
      return false;
    }
  }

  String get categoryLabel {
    switch (category) {
      case 'client_visit':
        return 'Visite Client';
      case 'recovery':
        return 'Recouvrement';
      case 'delivery':
        return 'Livraison';
      case 'prospecting':
        return 'Prospection';
      case 'administrative':
        return 'Administratif';
      case 'urgent':
        return 'Urgence';
      default:
        return category.toUpperCase();
    }
  }

  String get priorityLabel {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Normale';
      case 'low':
        return 'Basse';
      default:
        return priority;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée (à valider)';
      case 'validated':
        return 'Validée';
      case 'problem':
        return 'Problème signalé';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  }
}

class TaskHistoryModel {
  final int id;
  final int taskId;
  final String action;
  final String? fromStatus;
  final String? toStatus;
  final String? notes;
  final bool hasFile;
  final String? attachmentName;
  final String? attachmentUrl;
  final String performedByName;
  final String taskTitle;
  final String createdAt;
  final UserTaskModel? task;

  const TaskHistoryModel({
    required this.id,
    required this.taskId,
    required this.action,
    this.fromStatus,
    this.toStatus,
    this.notes,
    this.hasFile = false,
    this.attachmentName,
    this.attachmentUrl,
    required this.performedByName,
    required this.taskTitle,
    required this.createdAt,
    this.task,
  });

  factory TaskHistoryModel.fromJson(Map<String, dynamic> json) {
    UserTaskModel? taskModel;
    if (json['task'] is Map<String, dynamic>) {
      final taskMap = json['task'] as Map<String, dynamic>;
      if (taskMap.containsKey('title') && taskMap.containsKey('status')) {
        taskModel = UserTaskModel.fromJson(taskMap);
      }
    }

    return TaskHistoryModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      taskId: (json['task_id'] as num?)?.toInt() ?? 0,
      action: json['action'] as String? ?? 'action',
      fromStatus: json['from_status'] as String?,
      toStatus: json['to_status'] as String?,
      notes: (json['notes'] ?? json['comment']) as String?,
      hasFile: json['has_file'] == true || json['has_file'] == 1,
      attachmentName: (json['attachment_name'] ?? json['file_name']) as String?,
      attachmentUrl: (json['attachment_url'] ?? json['file_url']) as String?,
      performedByName: json['performed_by_name'] as String? ?? 'Utilisateur',
      taskTitle: json['task_title'] as String? ??
          (json['task'] is Map ? (json['task']['title'] ?? 'Mission') : 'Mission'),
      createdAt: json['created_at'] as String? ?? DateTime.now().toIso8601String(),
      task: taskModel,
    );
  }
}

class TaskStatsModel {
  final int total;
  final int pending;
  final int inProgress;
  final int completed;
  final int validated;
  final int problem;
  final int cancelled;
  final int privateCount;

  const TaskStatsModel({
    this.total = 0,
    this.pending = 0,
    this.inProgress = 0,
    this.completed = 0,
    this.validated = 0,
    this.problem = 0,
    this.cancelled = 0,
    this.privateCount = 0,
  });

  factory TaskStatsModel.fromJson(Map<String, dynamic> json) {
    return TaskStatsModel(
      total: (json['total'] as num?)?.toInt() ?? 0,
      pending: (json['pending'] as num?)?.toInt() ?? 0,
      inProgress: (json['in_progress'] as num?)?.toInt() ?? 0,
      completed: (json['completed'] as num?)?.toInt() ?? 0,
      validated: (json['validated'] as num?)?.toInt() ?? 0,
      problem: (json['problem'] as num?)?.toInt() ?? 0,
      cancelled: (json['cancelled'] as num?)?.toInt() ?? 0,
      privateCount: (json['private_count'] as num?)?.toInt() ?? 0,
    );
  }
}
