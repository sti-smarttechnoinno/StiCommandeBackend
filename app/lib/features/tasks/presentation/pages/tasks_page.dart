import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/fcm_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/tasks_provider.dart';
import '../widgets/task_card.dart';
import '../widgets/task_history_tile.dart';

class TasksPage extends ConsumerStatefulWidget {
  const TasksPage({super.key});

  @override
  ConsumerState<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends ConsumerState<TasksPage> {
  final TextEditingController _searchController = TextEditingController();
  StreamSubscription? _fcmSub;

  @override
  void initState() {
    super.initState();
    // Listen to real-time FCM pushes to auto-refresh tasks flux
    _fcmSub = FcmService.onMessageReceived.listen((message) {
      final type = message.data['type'] as String?;
      if (type == 'task_created' ||
          type == 'task_updated' ||
          type == 'task_status_changed' ||
          type == 'task_assigned' ||
          type == 'task' ||
          (type?.startsWith('task') ?? false) ||
          (type?.startsWith('mission') ?? false)) {
        ref.read(tasksProvider.notifier).refresh();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _fcmSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasksProvider);
    final notifier = ref.read(tasksProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar
            _buildAppBar(context, state, notifier),

            // Segmented View Selector: Missions vs. Historique & Flux
            _buildViewSelector(state, notifier),

            // Content Area
            Expanded(
              child: state.activeView == 'tasks'
                  ? _buildTasksView(state, notifier)
                  : _buildHistoryView(state, notifier),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, TasksState state, TasksNotifier notifier) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFFF8FAFC),
              foregroundColor: AppColors.textPrimary,
              padding: const EdgeInsets.all(8),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Missions & Tâches',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (state.stats.pending > 0) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD71920),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${state.stats.pending}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                const Text(
                  'Flux de travail & exécution commerciale',
                  style: TextStyle(
                    fontSize: 11.5,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Actualiser',
            onPressed: state.isLoading ? null : () => notifier.refresh(),
            icon: state.isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  )
                : const Icon(Icons.refresh_rounded, size: 20, color: AppColors.textPrimary),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFFF8FAFC),
              padding: const EdgeInsets.all(8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewSelector(TasksState state, TasksNotifier notifier) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
      child: Container(
        padding: const EdgeInsets.all(3.5),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => notifier.setActiveView('tasks'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: state.activeView == 'tasks' ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                    boxShadow: state.activeView == 'tasks'
                        ? [
                            BoxShadow(
                              color: Colors.black.withAlpha(6),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.check_box_outlined,
                        size: 15,
                        color: state.activeView == 'tasks' ? AppColors.primary : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Mes Missions (${state.stats.total})',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: state.activeView == 'tasks' ? FontWeight.w800 : FontWeight.w600,
                          color: state.activeView == 'tasks' ? AppColors.primary : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              child: GestureDetector(
                onTap: () => notifier.setActiveView('history'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: state.activeView == 'history' ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                    boxShadow: state.activeView == 'history'
                        ? [
                            BoxShadow(
                              color: Colors.black.withAlpha(6),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.history_rounded,
                        size: 15,
                        color: state.activeView == 'history' ? AppColors.primary : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Historique & Flux',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: state.activeView == 'history' ? FontWeight.w800 : FontWeight.w600,
                          color: state.activeView == 'history' ? AppColors.primary : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTasksView(TasksState state, TasksNotifier notifier) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => notifier.refresh(),
      child: Column(
        children: [
          // Search Bar + Filter Pills Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Column(
              children: [
                // Search Input
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) => notifier.setSearchQuery(val),
                    style: const TextStyle(fontSize: 12.5),
                    decoration: InputDecoration(
                      hintText: 'Rechercher une mission...',
                      hintStyle: TextStyle(fontSize: 12, color: AppColors.textTertiary),
                      prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Color(0xFF94A3B8)),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 16),
                              onPressed: () {
                                _searchController.clear();
                                notifier.setSearchQuery('');
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Horizontal Filter Pills with Counters
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      _buildFilterPill('all', 'Toutes', state.stats.total, state, notifier),
                      const SizedBox(width: 8),
                      _buildFilterPill('pending', 'En attente', state.stats.pending, state, notifier),
                      const SizedBox(width: 8),
                      _buildFilterPill('in_progress', 'En cours', state.stats.inProgress, state, notifier),
                      const SizedBox(width: 8),
                      _buildFilterPill('completed', 'À valider', state.stats.completed, state, notifier),
                      const SizedBox(width: 8),
                      _buildFilterPill('validated', 'Validées', state.stats.validated, state, notifier),
                      const SizedBox(width: 8),
                      _buildFilterPill('problem', 'Problèmes', state.stats.problem, state, notifier),
                      const SizedBox(width: 8),
                      _buildFilterPill('cancelled', 'Annulées', state.stats.cancelled, state, notifier),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Task List Content
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : state.tasks.isEmpty
                    ? _buildEmptyState(state, notifier)
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                        physics: const AlwaysScrollableScrollPhysics(
                          parent: BouncingScrollPhysics(),
                        ),
                        itemCount: state.tasks.length,
                        itemBuilder: (context, index) {
                          final task = state.tasks[index];
                          return TaskCard(
                            task: task,
                            onStatusUpdate: (newStatus, notes) {
                              return notifier.updateTaskStatus(task.id, newStatus, notes: notes);
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterPill(
    String filterValue,
    String label,
    int count,
    TasksState state,
    TasksNotifier notifier,
  ) {
    final isSelected = state.statusFilter == filterValue;
    return InkWell(
      onTap: () => notifier.setStatusFilter(filterValue),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5.5),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.textSecondary,
              ),
            ),
            const SizedBox(width: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withAlpha(50) : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryView(TasksState state, TasksNotifier notifier) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => notifier.loadHistory(),
      child: state.history.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.history_toggle_off_rounded, size: 48, color: Color(0xFFCBD5E1)),
                    SizedBox(height: 12),
                    Text(
                      'Aucun historique disponible',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Les changements de statut et les comptes-rendus apparaîtront ici au fur et à mesure.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              itemCount: state.history.length,
              itemBuilder: (context, index) {
                return TaskHistoryTile(
                  history: state.history[index],
                  allTasks: state.allTasks,
                );
              },
            ),
    );
  }

  Widget _buildEmptyState(TasksState state, TasksNotifier notifier) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.task_alt_rounded,
                size: 28,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              state.statusFilter == 'completed'
                  ? 'Aucune mission terminée pour l\'instant'
                  : 'Aucune mission en cours',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Toutes vos tâches actuelles sont synchronisées avec le tableau de bord.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => notifier.refresh(),
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Actualiser', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
