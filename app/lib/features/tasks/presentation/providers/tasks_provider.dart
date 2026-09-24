import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/tasks_repository.dart';
import '../../domain/models/task_models.dart';

final tasksRepositoryProvider = Provider<TasksRepository>((ref) {
  return TasksRepository();
});

class TasksState {
  final List<UserTaskModel> tasks;
  final TaskStatsModel stats;
  final List<TaskHistoryModel> history;
  final bool isLoading;
  final bool isMutating;
  final String statusFilter;
  final String? categoryFilter;
  final String? priorityFilter;
  final String searchQuery;
  final String activeView; // 'tasks' or 'history'
  final String? error;

  const TasksState({
    this.tasks = const [],
    this.stats = const TaskStatsModel(),
    this.history = const [],
    this.isLoading = false,
    this.isMutating = false,
    this.statusFilter = 'all',
    this.categoryFilter,
    this.priorityFilter,
    this.searchQuery = '',
    this.activeView = 'tasks',
    this.error,
  });

  TasksState copyWith({
    List<UserTaskModel>? tasks,
    TaskStatsModel? stats,
    List<TaskHistoryModel>? history,
    bool? isLoading,
    bool? isMutating,
    String? statusFilter,
    String? categoryFilter,
    String? priorityFilter,
    String? searchQuery,
    String? activeView,
    String? error,
  }) {
    return TasksState(
      tasks: tasks ?? this.tasks,
      stats: stats ?? this.stats,
      history: history ?? this.history,
      isLoading: isLoading ?? this.isLoading,
      isMutating: isMutating ?? this.isMutating,
      statusFilter: statusFilter ?? this.statusFilter,
      categoryFilter: categoryFilter ?? this.categoryFilter,
      priorityFilter: priorityFilter ?? this.priorityFilter,
      searchQuery: searchQuery ?? this.searchQuery,
      activeView: activeView ?? this.activeView,
      error: error,
    );
  }
}

class TasksNotifier extends StateNotifier<TasksState> {
  final TasksRepository _repository;

  TasksNotifier(this._repository) : super(const TasksState(isLoading: true)) {
    loadData();
  }

  Future<void> loadData({bool silent = false}) async {
    if (!silent) {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final tasksFuture = _repository.getTasks(
        status: state.statusFilter,
        priority: state.priorityFilter,
        category: state.categoryFilter,
        search: state.searchQuery,
      );
      final historyFuture = _repository.getTaskHistory();

      final results = await Future.wait([tasksFuture, historyFuture]);

      final taskResult = results[0] as ({List<UserTaskModel> tasks, TaskStatsModel stats});
      final historyResult = results[1] as List<TaskHistoryModel>;

      state = state.copyWith(
        tasks: taskResult.tasks,
        stats: taskResult.stats,
        history: historyResult,
        isLoading: false,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void setStatusFilter(String status) {
    if (state.statusFilter == status) return;
    state = state.copyWith(statusFilter: status);
    loadData();
  }

  void setCategoryFilter(String? category) {
    if (state.categoryFilter == category) return;
    state = state.copyWith(categoryFilter: category);
    loadData();
  }

  void setPriorityFilter(String? priority) {
    if (state.priorityFilter == priority) return;
    state = state.copyWith(priorityFilter: priority);
    loadData();
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
    loadData();
  }

  void setActiveView(String view) {
    if (state.activeView == view) return;
    state = state.copyWith(activeView: view);
    if (view == 'history' && state.history.isEmpty) {
      loadHistory();
    }
  }

  Future<void> loadHistory() async {
    try {
      final history = await _repository.getTaskHistory();
      state = state.copyWith(history: history);
    } catch (_) {}
  }

  Future<bool> updateTaskStatus(int taskId, String newStatus, {String? notes}) async {
    state = state.copyWith(isMutating: true);

    // Optimistic UI update
    final previousTasks = state.tasks;
    final updatedList = state.tasks.map((task) {
      if (task.id == taskId) {
        return task.copyWith(
          status: newStatus,
          completedAt: newStatus == 'completed' ? DateTime.now().toIso8601String() : null,
          completionNotes: notes ?? task.completionNotes,
        );
      }
      return task;
    }).toList();

    state = state.copyWith(tasks: updatedList);

    try {
      final updated = await _repository.updateTaskStatus(taskId, newStatus, notes: notes);
      if (updated != null) {
        // Refresh history & server stats
        loadData(silent: true);
        state = state.copyWith(isMutating: false);
        return true;
      }
      // Rollback on failure
      state = state.copyWith(tasks: previousTasks, isMutating: false);
      return false;
    } catch (e) {
      state = state.copyWith(tasks: previousTasks, isMutating: false, error: e.toString());
      return false;
    }
  }

  Future<void> refresh() async {
    await loadData(silent: true);
  }
}

final tasksProvider = StateNotifierProvider<TasksNotifier, TasksState>((ref) {
  final repository = ref.watch(tasksRepositoryProvider);
  return TasksNotifier(repository);
});
