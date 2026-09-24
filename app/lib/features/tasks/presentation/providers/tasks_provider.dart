import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/tasks_repository.dart';
import '../../domain/models/task_models.dart';

final tasksRepositoryProvider = Provider<TasksRepository>((ref) {
  return TasksRepository();
});

class TasksState {
  final List<UserTaskModel> allTasks;
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
    this.allTasks = const [],
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
    List<UserTaskModel>? allTasks,
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
      allTasks: allTasks ?? this.allTasks,
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

  static TaskStatsModel computeStats(List<UserTaskModel> allList) {
    return TaskStatsModel(
      total: allList.length,
      pending: allList.where((t) => t.isPending).length,
      inProgress: allList.where((t) => t.isInProgress).length,
      completed: allList.where((t) => t.isCompleted).length,
      validated: allList.where((t) => t.isValidated).length,
      problem: allList.where((t) => t.isProblem).length,
      cancelled: allList.where((t) => t.isCancelled).length,
      privateCount: allList.where((t) => t.isPrivate).length,
    );
  }

  static List<UserTaskModel> filterTasks(
    List<UserTaskModel> allList, {
    required String statusFilter,
    String? categoryFilter,
    String? priorityFilter,
    String searchQuery = '',
  }) {
    return allList.where((task) {
      if (statusFilter != 'all') {
        if (task.status != statusFilter) return false;
      }
      if (categoryFilter != null && categoryFilter != 'all') {
        if (task.category != categoryFilter) return false;
      }
      if (priorityFilter != null && priorityFilter != 'all') {
        if (task.priority != priorityFilter) return false;
      }
      if (searchQuery.trim().isNotEmpty) {
        final query = searchQuery.trim().toLowerCase();
        final matchTitle = task.title.toLowerCase().contains(query);
        final matchDesc = task.description?.toLowerCase().contains(query) ?? false;
        final matchAssignee = task.assignedToName?.toLowerCase().contains(query) ?? false;
        final matchAssigner = task.assignedByName.toLowerCase().contains(query);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchAssigner) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  Future<void> loadData({bool silent = false}) async {
    if (!silent) {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      // Fetch all tasks for this user so local provider holds complete list
      final tasksFuture = _repository.getTasks();
      final historyFuture = _repository.getTaskHistory();

      final results = await Future.wait([tasksFuture, historyFuture]);

      final taskResult = results[0] as ({List<UserTaskModel> tasks, TaskStatsModel stats});
      final historyResult = results[1] as List<TaskHistoryModel>;

      final allTasks = taskResult.tasks;
      final computed = computeStats(allTasks);
      final stats = taskResult.stats.total > 0 ? taskResult.stats : computed;

      final filteredTasks = filterTasks(
        allTasks,
        statusFilter: state.statusFilter,
        categoryFilter: state.categoryFilter,
        priorityFilter: state.priorityFilter,
        searchQuery: state.searchQuery,
      );

      state = state.copyWith(
        allTasks: allTasks,
        tasks: filteredTasks,
        stats: stats,
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
    final filtered = filterTasks(
      state.allTasks,
      statusFilter: status,
      categoryFilter: state.categoryFilter,
      priorityFilter: state.priorityFilter,
      searchQuery: state.searchQuery,
    );
    state = state.copyWith(
      statusFilter: status,
      tasks: filtered,
    );
  }

  void setCategoryFilter(String? category) {
    if (state.categoryFilter == category) return;
    final filtered = filterTasks(
      state.allTasks,
      statusFilter: state.statusFilter,
      categoryFilter: category,
      priorityFilter: state.priorityFilter,
      searchQuery: state.searchQuery,
    );
    state = state.copyWith(
      categoryFilter: category,
      tasks: filtered,
    );
  }

  void setPriorityFilter(String? priority) {
    if (state.priorityFilter == priority) return;
    final filtered = filterTasks(
      state.allTasks,
      statusFilter: state.statusFilter,
      categoryFilter: state.categoryFilter,
      priorityFilter: priority,
      searchQuery: state.searchQuery,
    );
    state = state.copyWith(
      priorityFilter: priority,
      tasks: filtered,
    );
  }

  void setSearchQuery(String query) {
    final filtered = filterTasks(
      state.allTasks,
      statusFilter: state.statusFilter,
      categoryFilter: state.categoryFilter,
      priorityFilter: state.priorityFilter,
      searchQuery: query,
    );
    state = state.copyWith(
      searchQuery: query,
      tasks: filtered,
    );
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

    // Optimistic UI update across all tasks
    final previousAllTasks = state.allTasks;
    final previousTasks = state.tasks;
    final previousStats = state.stats;

    final updatedAll = state.allTasks.map((task) {
      if (task.id == taskId) {
        return task.copyWith(
          status: newStatus,
          completedAt: newStatus == 'completed' ? DateTime.now().toIso8601String() : null,
          completionNotes: notes ?? task.completionNotes,
        );
      }
      return task;
    }).toList();

    final newStats = computeStats(updatedAll);
    final updatedFiltered = filterTasks(
      updatedAll,
      statusFilter: state.statusFilter,
      categoryFilter: state.categoryFilter,
      priorityFilter: state.priorityFilter,
      searchQuery: state.searchQuery,
    );

    state = state.copyWith(
      allTasks: updatedAll,
      tasks: updatedFiltered,
      stats: newStats,
    );

    try {
      final updated = await _repository.updateTaskStatus(taskId, newStatus, notes: notes);
      if (updated != null) {
        loadData(silent: true);
        state = state.copyWith(isMutating: false);
        return true;
      }
      state = state.copyWith(
        allTasks: previousAllTasks,
        tasks: previousTasks,
        stats: previousStats,
        isMutating: false,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        allTasks: previousAllTasks,
        tasks: previousTasks,
        stats: previousStats,
        isMutating: false,
        error: e.toString(),
      );
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
