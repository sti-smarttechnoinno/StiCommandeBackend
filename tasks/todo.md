# Task List: Flutter Missions & Tasks (Todo List) with Flux Integration

## Task 1: Create Task and Task History Domain Models
**Description:** Implement `app/lib/features/tasks/domain/models/task_models.dart` containing type-safe models for `UserTaskModel`, `TaskHistoryModel`, and `TaskStatsModel`.

**Acceptance criteria:**
- [x] `UserTaskModel`: parsed from `/tasks`, fields: `id`, `title`, `description`, `category`, `priority`, `status`, `dueDate`, `isPrivate`, `hasAttachment`, `attachmentUrl`, `attachmentName`, `assignedToName`, `assignedByName`, `createdAt`, `completedAt`, `completionNotes`.
- [x] `TaskHistoryModel`: parsed from `/tasks/history`, fields: `id`, `taskId`, `taskTitle`, `action`, `fromStatus`, `toStatus`, `notes`, `performedByName`, `createdAt`.
- [x] `TaskStatsModel`: parsed from `/tasks` response stats object (`total`, `pending`, `inProgress`, `completed`, `cancelled`, `privateCount`).

**Verification:**
- [x] Dart syntax verification passes without errors.

**Dependencies:** None
**Files touched:**
- `app/lib/features/tasks/domain/models/task_models.dart`
**Estimated scope:** Small (1 file)

---

## Task 2: Create TasksRepository for Backend API Integration
**Description:** Implement `app/lib/features/tasks/data/repositories/tasks_repository.dart` to communicate with backend endpoints using `ApiService`.

**Acceptance criteria:**
- [x] `getTasks({String? status, String? priority, String? category, String? search})`: queries `/tasks` with query parameters.
- [x] `updateTaskStatus(int taskId, String status, {String? notes})`: sends `PUT /tasks/$taskId/status` with status and optional notes.
- [x] `getTaskHistory({int? taskId})`: queries `/tasks/history`.

**Verification:**
- [x] Dart syntax verification passes without errors.

**Dependencies:** Task 1
**Files touched:**
- `app/lib/features/tasks/data/repositories/tasks_repository.dart`
**Estimated scope:** Small (1 file)

---

## Checkpoint: Phase 1 Data Layer
- [x] All Dart models and repository files compile with 0 errors.

---

## Task 3: Create Riverpod Tasks StateNotifier & Providers
**Description:** Implement `app/lib/features/tasks/presentation/providers/tasks_provider.dart` to manage task list state, category/status filters, search, optimistic status updates, and audit history flux.

**Acceptance criteria:**
- [x] `TasksState` tracks `tasks`, `stats`, `history`, `isLoading`, `statusFilter` (`all`, `pending`, `in_progress`, `completed`, `cancelled`), `searchQuery`, `activeView` (`tasks` | `history`), and `error`.
- [x] `loadTasks()` and `loadHistory()` fetch data concurrently.
- [x] `updateStatus(int taskId, String newStatus, {String? notes})` updates the task on backend, optimistically updates local list and stats, and reloads history.
- [x] `setStatusFilter(String status)` and `setSearch(String query)` update filters dynamically.

**Verification:**
- [x] Dart syntax verification passes without errors.

**Dependencies:** Task 2
**Files touched:**
- `app/lib/features/tasks/presentation/providers/tasks_provider.dart`
**Estimated scope:** Small (1 file)

---

## Task 4: Connect Real-Time FCM Notification Stream to TasksNotifier
**Description:** Hook Flutter push notification handling to auto-refresh missions and route clicks directly to the tasks page.

**Acceptance criteria:**
- [x] Update `app/lib/core/services/fcm_service.dart` to route task pushes (`task_created`, `task_updated`, `task_status_changed`, `mission_assigned`) directly to `/tasks`.
- [x] Update `app/lib/core/utils/notification_translations.dart` with localized strings for task notifications in FR, AR, EN.
- [x] In `TasksPage`, listen to `FcmService.onMessageReceived` stream and auto-refresh task state when a task notification arrives.

**Verification:**
- [x] Dart syntax verification passes without errors.

**Dependencies:** Task 3
**Files touched:**
- `app/lib/core/services/fcm_service.dart`
- `app/lib/core/utils/notification_translations.dart`
**Estimated scope:** Small (2 files)

---

## Checkpoint: Phase 2 State Layer
- [x] State management and notification pipeline compiles cleanly.

---

## Task 5: Build Task Status Update Dialog & Detail Sheet
**Description:** Implement bottom sheets and dialogs in `app/lib/features/tasks/presentation/widgets/` for inspecting mission details, previewing attachments, and executing status transitions.

**Acceptance criteria:**
- [x] `TaskStatusDialog`: allows transitioning between `En attente`, `En cours`, `Terminée`, `Annulée` with input for completion notes.
- [x] `TaskDetailSheet`: displays title, full description, creator, assignee, category, priority, due date, status, and attachment link.
- [x] Visual indicators matching backend: red for urgent, amber for high, blue for medium, gray for low; purple for private lock.

**Verification:**
- [x] Dart syntax verification passes without errors.

**Dependencies:** Task 3
**Files touched:**
- `app/lib/features/tasks/presentation/widgets/task_status_dialog.dart`
- `app/lib/features/tasks/presentation/widgets/task_detail_sheet.dart`
**Estimated scope:** Small (2 files)

---

## Task 6: Build Missions & Tasks Main Screen (TasksPage)
**Description:** Implement `app/lib/features/tasks/presentation/pages/tasks_page.dart` offering the complete mobile experience for Missions & Tasks (Todo list).

**Acceptance criteria:**
- [x] Clean header with title "Missions & Tâches", live pending badge count, and refresh button.
- [x] Segmented tab selector: "Missions" vs. "Historique & Flux".
- [x] Search bar for quick filtering by title or description.
- [x] Filter pills for statuses (`Tous`, `En attente`, `En cours`, `Terminées`, `Annulées`) with counters.
- [x] Interactive task cards with category chip, priority badge, due date alert, attachment icon, and status action button.
- [x] Audit trail / flux list in Historique tab showing chronological status transitions and notes.
- [x] Loading skeleton shimmer and pull-to-refresh (`RefreshIndicator`).

**Verification:**
- [x] Dart syntax verification passes without errors.

**Dependencies:** Tasks 3, 5
**Files touched:**
- `app/lib/features/tasks/presentation/pages/tasks_page.dart`
- `app/lib/features/tasks/presentation/widgets/task_card.dart`
- `app/lib/features/tasks/presentation/widgets/task_history_tile.dart`
**Estimated scope:** Medium (3 files)

---

## Task 7: Integrate Routing and Links in Navigation & Profile
**Description:** Connect the Flutter app's router and entry points to the new Missions screen.

**Acceptance criteria:**
- [x] Add `/tasks` route in `app/lib/core/router/app_router.dart`.
- [x] Update `app/lib/features/profile/presentation/widgets/quick_actions_card.dart` with a quick action "Mes Missions / Tâches" navigating to `/tasks`.
- [x] Add quick shortcut on Dashboard header (`DashboardHeader`).

**Verification:**
- [x] `flutter analyze` runs with 0 issues.
- [x] Tapping quick action on Profile navigates cleanly to `/tasks`.

**Dependencies:** Task 6
**Files touched:**
- `app/lib/core/router/app_router.dart`
- `app/lib/features/profile/presentation/widgets/quick_actions_card.dart`
- `app/lib/features/dashboard/presentation/widgets/dashboard_header.dart`
**Estimated scope:** Small (3 files)

---

## Checkpoint: Complete Verification
- [x] `flutter analyze` runs across the entire Flutter project with 0 issues.
- [ ] Run `graphify update .` to update the knowledge graph.
