# Implementation Plan: Flutter Missions & Tasks (Todo List) with Real-Time Flux

## Overview
Implement a dedicated **Missions & Tasks (Todo List)** screen in the Flutter mobile application (`app/`) focused exclusively on commercial tasks, visits, follow-ups, and assignments. 

The screen is tightly integrated with the Laravel backend and web frontend architecture via a real-time flux:
1. **Interactive Task Workflow**: Filter and manage assigned missions (statuses: `pending` -> `in_progress` -> `completed` with completion notes, or `cancelled`).
2. **Category & Priority Metadata**: Category tags (e.g. `client_visit`, `recovery`, `delivery`, `prospecting`, `administrative`), priority chips (`urgent`, `high`, `medium`, `low`), due dates with overdue highlights, and private mission flags.
3. **Attachments & Attribution**: View and open attached files or document URLs directly from mobile.
4. **Audit Trail & Event Flux**: Real-time event log tracking transitions, notes, and actor history.
5. **Real-Time Synchronization**: Live updates through FCM push notification listener and Riverpod state management.

---

## Architecture Decisions
- **Domain Modeling (`task_models.dart`)**: Type-safe immutable models for `UserTaskModel`, `TaskHistoryModel`, and `TaskStatsModel`.
- **Repository Pattern (`tasks_repository.dart`)**: Uses `ApiService` to communicate with backend endpoints (`GET /tasks`, `PUT /tasks/:id/status`, `GET /tasks/history`, and `POST /tasks`).
- **Riverpod State Management (`tasks_provider.dart`)**: Reactive state notifier managing status filters (`all`, `pending`, `in_progress`, `completed`, `cancelled`), search query, optimistic status transitions, and audit flux.
- **Real-Time Flux**: Hooked into `FcmService.onMessageReceived` stream to automatically refresh missions on mobile whenever a task is created or updated from the web dashboard.
- **UI Design System**: Conforms to STI mobile UI design tokens (`AppColors.primary` #D71920, `AppTypography`, `AppConstants`, card elevation, subtle borders, and smooth animations).

---

## Task List

### Phase 1: Domain Models & Network Repository
- [x] Task 1: Create Task and Task History Domain Models
- [x] Task 2: Create TasksRepository for Backend API Integration

### Checkpoint: Phase 1 Data Layer
- [x] Dart models and repository compile without errors.
- [x] API endpoints map accurately to backend routes (`/tasks`, `/tasks/:id/status`, `/tasks/history`).

### Phase 2: State Management & Real-Time Flux
- [x] Task 3: Create Riverpod Tasks StateNotifier & Providers
- [x] Task 4: Connect Real-Time FCM Notification Stream to TasksNotifier

### Checkpoint: Phase 2 State Layer
- [x] Riverpod provider builds cleanly and handles loading, filtering, optimistic status mutations, and error states.

### Phase 3: Presentation UI & Interactive Workflow
- [x] Task 5: Build Task Status Update Dialog & Detail Sheet
- [x] Task 6: Build Missions & Tasks Main Screen (`TasksPage`)
- [x] Task 7: Integrate Routing and Links in Navigation & Profile

### Checkpoint: Complete Verification
- [x] `flutter analyze` runs with 0 issues found.
- [x] Task status updates (`pending` -> `in_progress` -> `completed` / `cancelled`) trigger immediate UI updates and audit history logging.
- [x] Navigation from Profile Quick Actions and Dashboard to Missions works seamlessly.
- [ ] Graphify knowledge graph updated.

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Mobile network latency during status updates | Medium | Optimistic local state update with automatic rollback and SnackBar toast on failure. |
| Accessing file attachments on Android/iOS | Low | Open attachment URLs safely via browser intent (`url_launcher` or system handler). |
| Role permissions for task visibility | Low | Handled securely by backend `UserTaskController`, scoping tasks directly to authenticated user. |

---

## Open Questions
- None. Scope is refined to the Todo list (Missions/Tasks) only, without monthly revenue objectives.
