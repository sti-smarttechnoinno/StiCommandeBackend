import '../../../../core/network/api_service.dart';
import '../../domain/models/task_models.dart';

class TasksRepository {
  /// Fetch list of tasks with optional query filters and summary statistics.
  Future<({List<UserTaskModel> tasks, TaskStatsModel stats})> getTasks({
    String? status,
    String? priority,
    String? category,
    String? search,
  }) async {
    final queryParams = <String, String>{};
    if (status != null && status != 'all') queryParams['status'] = status;
    if (priority != null && priority != 'all') queryParams['priority'] = priority;
    if (category != null && category != 'all') queryParams['category'] = category;
    if (search != null && search.trim().isNotEmpty) queryParams['search'] = search.trim();

    final res = await ApiService.get('/tasks', queryParams: queryParams);

    List<UserTaskModel> tasksList = [];
    TaskStatsModel statsObj = const TaskStatsModel();

    if (res is Map<String, dynamic>) {
      if (res['data'] is List) {
        tasksList = (res['data'] as List)
            .map((item) => UserTaskModel.fromJson(item as Map<String, dynamic>))
            .toList();
      } else if (res['tasks'] is List) {
        tasksList = (res['tasks'] as List)
            .map((item) => UserTaskModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }

      if (res['stats'] is Map<String, dynamic>) {
        statsObj = TaskStatsModel.fromJson(res['stats'] as Map<String, dynamic>);
      } else {
        statsObj = TaskStatsModel(
          total: tasksList.length,
          pending: tasksList.where((t) => t.isPending).length,
          inProgress: tasksList.where((t) => t.isInProgress).length,
          completed: tasksList.where((t) => t.isCompleted).length,
          validated: tasksList.where((t) => t.isValidated).length,
          problem: tasksList.where((t) => t.isProblem).length,
          cancelled: tasksList.where((t) => t.isCancelled).length,
          privateCount: tasksList.where((t) => t.isPrivate).length,
        );
      }
    } else if (res is List) {
      tasksList = res
          .map((item) => UserTaskModel.fromJson(item as Map<String, dynamic>))
          .toList();
      statsObj = TaskStatsModel(
        total: tasksList.length,
        pending: tasksList.where((t) => t.isPending).length,
        inProgress: tasksList.where((t) => t.isInProgress).length,
        completed: tasksList.where((t) => t.isCompleted).length,
        validated: tasksList.where((t) => t.isValidated).length,
        problem: tasksList.where((t) => t.isProblem).length,
        cancelled: tasksList.where((t) => t.isCancelled).length,
        privateCount: tasksList.where((t) => t.isPrivate).length,
      );
    }

    return (tasks: tasksList, stats: statsObj);
  }

  /// Update a task's status with optional completion notes.
  Future<UserTaskModel?> updateTaskStatus(
    int taskId,
    String status, {
    String? notes,
  }) async {
    final body = <String, dynamic>{
      'status': status,
    };
    if (notes != null && notes.trim().isNotEmpty) {
      body['notes'] = notes.trim();
    }

    final res = await ApiService.put('/tasks/$taskId/status', body: body);

    if (res is Map<String, dynamic>) {
      if (res['task'] is Map<String, dynamic>) {
        return UserTaskModel.fromJson(res['task'] as Map<String, dynamic>);
      } else if (res['data'] is Map<String, dynamic>) {
        return UserTaskModel.fromJson(res['data'] as Map<String, dynamic>);
      }
    }
    return null;
  }

  /// Fetch task history / audit flux timeline.
  Future<List<TaskHistoryModel>> getTaskHistory({int? taskId}) async {
    final queryParams = <String, String>{};
    if (taskId != null) queryParams['task_id'] = taskId.toString();

    final res = await ApiService.get('/tasks/history', queryParams: queryParams);

    if (res is Map<String, dynamic>) {
      final list = (res['history'] ?? res['data']) as List?;
      if (list != null) {
        return list
            .map((item) => TaskHistoryModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } else if (res is List) {
      return res
          .map((item) => TaskHistoryModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Delete a task.
  Future<bool> deleteTask(int taskId) async {
    try {
      await ApiService.delete('/tasks/$taskId');
      return true;
    } catch (_) {
      return false;
    }
  }
}
