<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\TaskHistory;
use App\Models\User;
use App\Models\UserTask;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserTaskController extends Controller
{
    /**
     * List tasks assigned to or created by the current user.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user() ?? auth('sanctum')->user();
        if (!$currentUser) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }
        $query = UserTask::with(['assignedBy:id,name,role', 'assignedTo:id,name,role,region,wilaya']);

        // Privacy isolation:
        // A task where is_private = true is ONLY visible to the user it was created for
        $query->where(function ($q) use ($currentUser) {
            $q->where('is_private', false)
              ->orWhere(function ($q2) use ($currentUser) {
                  $q2->where('is_private', true)
                     ->where('assigned_to', $currentUser->id);
              });
        });

        // Filter permissions:
        // Admin & Directeurs can view all team tasks, or filter
        if ($currentUser->isAdmin() || $currentUser->role === 'directeur') {
            if ($request->query('assigned_to')) {
                $query->where('assigned_to', (int) $request->query('assigned_to'));
            }
            if ($request->query('assigned_by')) {
                $query->where('assigned_by', (int) $request->query('assigned_by'));
            }
        } elseif ($currentUser->role === 'responsable_commercial' || $currentUser->role === 'commercial') {
            // View tasks they created OR tasks assigned to them OR tasks of their team
            $scope = $request->query('scope', 'all'); // 'assigned_to_me', 'created_by_me', 'private', 'all'
            if ($scope === 'assigned_to_me') {
                $query->where('assigned_to', $currentUser->id);
            } elseif ($scope === 'created_by_me') {
                $query->where('assigned_by', $currentUser->id);
            } elseif ($scope === 'private') {
                $query->where('is_private', true)->where('assigned_to', $currentUser->id);
            } else {
                $query->where(function ($q) use ($currentUser) {
                    $q->where('assigned_by', $currentUser->id)
                      ->orWhere('assigned_to', $currentUser->id);
                });
            }
        } else {
            // Délégués: only tasks assigned to them
            $query->where('assigned_to', $currentUser->id);
        }

        // Filter for private tasks only
        if ($request->has('only_private') && filter_var($request->query('only_private'), FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_private', true)->where('assigned_to', $currentUser->id);
        } elseif ($request->has('is_private') && $request->query('is_private') !== '') {
            $query->where('is_private', filter_var($request->query('is_private'), FILTER_VALIDATE_BOOLEAN));
        }

        // Additional filters
        if ($request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->query('category') && $request->query('category') !== 'all') {
            $query->where('category', $request->query('category'));
        }
        if ($request->query('priority') && $request->query('priority') !== 'all') {
            $query->where('priority', $request->query('priority'));
        }
        if ($request->query('has_attachment') !== null) {
            $query->where('has_attachment', filter_var($request->query('has_attachment'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->query('has_file') !== null) {
            $query->where('has_attachment', filter_var($request->query('has_file'), FILTER_VALIDATE_BOOLEAN));
        }

        // Search query
        if ($request->filled('search')) {
            $searchTerm = trim((string) $request->query('search'));
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhereHas('assignedTo', function ($uq) use ($searchTerm) {
                      $uq->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        $data = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'is_private' => (bool) $task->is_private,
                'category' => $task->category,
                'priority' => $task->priority,
                'due_date' => $task->due_date?->format('Y-m-d'),
                'target_amount' => $task->target_amount,
                'target_count' => $task->target_count,
                'achieved_count' => $task->achieved_count,
                'has_attachment' => (bool) ($task->has_attachment ?? $task->has_file_attribution),
                'has_file_attribution' => (bool) ($task->has_attachment ?? $task->has_file_attribution),
                'attachment_url' => $task->attachment_url ?? $task->file_url,
                'file_url' => $task->attachment_url ?? $task->file_url,
                'attachment_name' => $task->attachment_name ?? $task->file_name,
                'file_name' => $task->attachment_name ?? $task->file_name,
                'attachment_type' => $task->attachment_type,
                'attachment_size' => $task->attachment_size,
                'status' => $task->status,
                'completed_at' => $task->completed_at?->toISOString(),
                'completion_notes' => $task->completion_notes,
                'created_at' => $task->created_at->toISOString(),
                'is_overdue' => $task->isOverdue(),
                'assigned_by_name' => $task->assignedBy?->name ?? 'Direction',
                'assigned_to_name' => $task->assignedTo?->name ?? 'Collaborateur',
                'assigned_by_id' => $task->assigned_by,
                'assigned_to_id' => $task->assigned_to,
                'assigned_by' => [
                    'id' => $task->assignedBy?->id,
                    'name' => $task->assignedBy?->name ?? 'Direction',
                    'role' => $task->assignedBy?->role,
                ],
                'assigned_to' => [
                    'id' => $task->assignedTo?->id,
                    'name' => $task->assignedTo?->name ?? 'Collaborateur',
                    'role' => $task->assignedTo?->role,
                    'region' => $task->assignedTo?->region,
                    'wilaya' => $task->assignedTo?->wilaya,
                ],
            ];
        });

        // Summary counts for quick statistics
        $stats = [
            'total' => $tasks->count(),
            'pending' => $tasks->where('status', 'pending')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'validated' => $tasks->where('status', 'validated')->count(),
            'problem' => $tasks->where('status', 'problem')->count(),
            'cancelled' => $tasks->where('status', 'cancelled')->count(),
            'private_count' => $tasks->where('is_private', true)->where('assigned_to', $currentUser->id)->count(),
            'with_attachment' => $tasks->where('has_attachment', true)->count(),
        ];

        return response()->json([
            'tasks' => $data,
            'data' => $data,
            'stats' => $stats,
        ]);
    }

    /**
     * Create a task for one or multiple persons concerned with optional file attribution.
     * Can also be a private task for the current user only.
     */
    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user() ?? auth('sanctum')->user();
        if (!$currentUser) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $isPrivate = filter_var($request->input('is_private'), FILTER_VALIDATE_BOOLEAN)
            || $request->input('is_private') === '1'
            || $request->input('is_private') === 'true';

        $validator = Validator::make($request->all(), [
            'is_private' => 'nullable',
            'assigned_to_ids' => 'nullable|array',
            'assigned_to_ids.*' => 'integer|exists:users,id',
            'assigned_to' => 'nullable',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'category' => 'nullable|string',
            'priority' => 'nullable|string',
            'due_date' => 'nullable|date',
            'target_amount' => 'nullable|numeric|min:0',
            'target_count' => 'nullable|integer|min:0',
            'attachment' => 'nullable|file|max:20480', // Max 20MB
            'file' => 'nullable|file|max:20480',       // Max 20MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        if ($isPrivate) {
            $targetUserIds = [$currentUser->id];
        } else {
            $targetUserIds = $request->input('assigned_to_ids')
                ?: ($request->input('assigned_to') ? (array) $request->input('assigned_to') : []);
            if (empty($targetUserIds)) {
                return response()->json([
                    'message' => 'Veuillez sélectionner au moins un collaborateur concerné.',
                    'errors' => ['assigned_to' => ['Veuillez sélectionner au moins un collaborateur concerné.']],
                ], 422);
            }
        }

        // File handling (support both 'file' and 'attachment' input names)
        $hasAttachment = false;
        $attachmentUrl = null;
        $attachmentName = null;
        $attachmentType = null;
        $attachmentSize = null;

        $uploadedFile = $request->file('attachment') ?: $request->file('file');
        if ($uploadedFile && $uploadedFile->isValid()) {
            $attachmentName = $uploadedFile->getClientOriginalName();
            $attachmentType = $uploadedFile->getClientMimeType();
            $attachmentSize = $uploadedFile->getSize();

            $path = $uploadedFile->store('tasks', 'public');
            $attachmentUrl = rtrim((string) env('APP_URL', 'http://localhost'), '/') . '/storage/' . $path;
            $hasAttachment = true;
        }

        $createdTasks = [];

        foreach ($targetUserIds as $targetId) {
            $targetUser = User::find($targetId);
            if (!$targetUser) continue;

            $task = UserTask::create([
                'title' => trim($validated['title']),
                'description' => $validated['description'] ?? null,
                'is_private' => $isPrivate,
                'assigned_by' => $currentUser->id,
                'assigned_to' => $targetUser->id,
                'category' => $validated['category'] ?? 'operational',
                'priority' => $validated['priority'] ?? 'medium',
                'due_date' => $validated['due_date'] ?? null,
                'target_amount' => $validated['target_amount'] ?? null,
                'target_count' => $validated['target_count'] ?? null,
                'has_attachment' => $hasAttachment,
                'attachment_url' => $attachmentUrl,
                'attachment_name' => $attachmentName,
                'attachment_type' => $attachmentType,
                'attachment_size' => $attachmentSize,
                'status' => 'pending',
            ]);

            // Record in audit trail history
            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => $currentUser->id,
                'action' => 'created',
                'from_status' => null,
                'to_status' => 'pending',
                'comment' => $isPrivate
                    ? ($hasAttachment ? "Objectif personnel et privé créé avec document joint : {$attachmentName}" : "Objectif personnel et privé créé par {$currentUser->name}")
                    : ($hasAttachment ? "Tâche d'équipe créée avec fichier joint : {$attachmentName}" : "Tâche créée et attribuée par {$currentUser->name}"),
                'created_at' => now(),
            ]);

            $createdTasks[] = $task;

            // Only notify if NOT private and not self-assigned
            if (!$isPrivate && $targetUser->id !== $currentUser->id) {
                $categoryNamesFr = [
                    'sales' => 'Vente & Chiffre d\'Affaires',
                    'visit' => 'Visite client',
                    'client_visit' => 'Visite client',
                    'recouvrement' => 'Recouvrement',
                    'prospection' => 'Prospection',
                    'product_promotion' => 'Promotion Produit',
                    'reporting' => 'Rapport d\'activité',
                    'administrative' => 'Administratif',
                    'operational' => 'Mission opérationnelle',
                ];
                $catLabel = $categoryNamesFr[$task->category] ?? 'Mission';

                $notifTitle = "Nouvelle tâche : {$task->title}";
                $notifBody = "{$currentUser->name} vous a assigné une mission ({$catLabel})" . ($hasAttachment ? " avec document joint." : ".");

                try {
                    Notification::create([
                        'title' => $notifTitle,
                        'description' => $notifBody,
                        'category' => 'system',
                        'priority' => $task->priority === 'urgent' ? 'urgent' : 'high',
                        'status' => 'unread',
                        'user' => $targetUser->name,
                        'region' => $targetUser->region ?? 'All',
                        'module' => 'Tasks',
                        'reference_id' => "TSK-{$task->id}",
                        'read' => false,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning("Task notification record error: " . $e->getMessage());
                }

            // FCM Push
            try {
                $targetRecipient = !empty($targetUser->fcm_token) ? $targetUser->fcm_token : '/topics/sti_delegates';
                app(FirebaseService::class)->sendPush(
                    $targetRecipient,
                    $notifTitle,
                    $notifBody,
                    [
                        'type' => 'task_assigned',
                        'task_id' => (string) $task->id,
                        'task_title' => (string) $task->title,
                        'assigned_by' => (string) $currentUser->name,
                        'priority' => (string) $task->priority,
                        'category' => (string) $task->category,
                        'has_attachment' => $hasAttachment ? '1' : '0',
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning("FCM task push error: " . $e->getMessage());
            }
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($createdTasks) . ' tâche(s) créée(s) et attribuée(s) avec succès.',
            'count' => count($createdTasks),
        ], 201);
    }

    /**
     * Show a single task detail.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user() ?? auth('sanctum')->user();
        if (!$currentUser) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $task = UserTask::with(['assignedBy:id,name,role', 'assignedTo:id,name,role,region,wilaya'])->findOrFail($id);

        if ($task->is_private && $task->assigned_to !== $currentUser->id && $task->assigned_by !== $currentUser->id && !$currentUser->isAdmin()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        return response()->json([
            'success' => true,
            'task' => $task,
        ]);
    }

    /**
     * Update task status with audit trail logging, assigner/assignee notifications and WebSocket broadcast.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user() ?? auth('sanctum')->user();
        if (!$currentUser) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $task = UserTask::with(['assignedBy', 'assignedTo'])->findOrFail($id);

        // Authorization: Assignee, creator/assigner, or admin can update status
        if ($task->assigned_to !== $currentUser->id && $task->assigned_by !== $currentUser->id && !$currentUser->isAdmin()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:pending,in_progress,completed,validated,problem,cancelled',
            'completion_notes' => 'nullable|string|max:2000',
            'notes' => 'nullable|string|max:2000',
            'comment' => 'nullable|string|max:2000',
            'achieved_count' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $oldStatus = $task->status;
        $newStatus = $request->input('status');
        $notes = $request->input('completion_notes') ?? $request->input('notes') ?? $request->input('comment');

        // Business rule: Only assigner or admin can validate or report problem
        if (in_array($newStatus, ['validated', 'problem']) && $task->assigned_by !== $currentUser->id && !$currentUser->isAdmin()) {
            return response()->json([
                'error' => "Seul le responsable ayant assigné la mission ou un administrateur peut valider ou signaler un problème sur cette mission."
            ], 403);
        }

        $task->status = $newStatus;
        if ($notes !== null) {
            $task->completion_notes = $notes;
        }
        if ($request->has('achieved_count')) {
            $task->achieved_count = (int) $request->input('achieved_count');
        }

        if (($newStatus === 'completed' || $newStatus === 'validated') && !$task->completed_at) {
            $task->completed_at = now();
        }

        $task->save();

        // French labels for audit trail & notifications
        $statusLabels = [
            'pending' => 'En attente',
            'in_progress' => 'En cours',
            'completed' => 'Terminée',
            'validated' => 'Validée',
            'problem' => 'Problème signalé',
            'cancelled' => 'Annulée',
        ];
        $oldStatusLabel = $statusLabels[$oldStatus] ?? $oldStatus;
        $newStatusLabel = $statusLabels[$newStatus] ?? $newStatus;

        // Record in audit trail history
        TaskHistory::create([
            'task_id' => $task->id,
            'user_id' => $currentUser->id,
            'action' => 'status_updated',
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'comment' => $notes ?: "Statut passé de '{$oldStatusLabel}' à '{$newStatusLabel}' par {$currentUser->name}",
            'created_at' => now(),
        ]);

        // 1. If updated by assignee (commercial), notify the person who assigned the mission
        if ($currentUser->id === $task->assigned_to && $task->assignedBy && $task->assignedBy->id !== $currentUser->id) {
            $manager = $task->assignedBy;
            $notifTitle = $newStatus === 'completed'
                ? "Mission terminée : {$task->title}"
                : "Mise à jour mission : {$task->title}";
            $notifBody = $newStatus === 'completed'
                ? "{$currentUser->name} a terminé la mission '{$task->title}'." . ($notes ? " Note : {$notes}" : "")
                : "{$currentUser->name} a passé la mission à '{$newStatusLabel}'." . ($notes ? " Note : {$notes}" : "");

            try {
                Notification::create([
                    'title' => $notifTitle,
                    'description' => $notifBody,
                    'category' => 'system',
                    'priority' => 'high',
                    'status' => 'unread',
                    'user' => $manager->name,
                    'region' => $manager->region ?? 'All',
                    'module' => 'Tasks',
                    'reference_id' => "TSK-{$task->id}",
                    'read' => false,
                ]);

                if (!empty($manager->fcm_token)) {
                    app(FirebaseService::class)->sendPush(
                        $manager->fcm_token,
                        $notifTitle,
                        $notifBody,
                        [
                            'type' => 'task_status_changed',
                            'task_id' => (string) $task->id,
                            'status' => (string) $newStatus,
                            'updated_by' => (string) $currentUser->name,
                            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                        ]
                    );
                }
            } catch (\Throwable $e) {
                Log::warning("Assigner task notification error: " . $e->getMessage());
            }
        }

        // 2. If updated by assigner or admin, notify the assignee (commercial)
        if ($currentUser->id !== $task->assigned_to && $task->assignedTo && $task->assignedTo->id !== $currentUser->id) {
            $assignee = $task->assignedTo;
            if ($newStatus === 'validated') {
                $notifTitle = "Mission validée : {$task->title}";
                $notifBody = "{$currentUser->name} a validé votre mission." . ($notes ? " Note : {$notes}" : "");
            } elseif ($newStatus === 'problem') {
                $notifTitle = "Problème signalé : {$task->title}";
                $notifBody = "{$currentUser->name} a signalé un problème sur votre mission : {$notes}";
            } elseif ($newStatus === 'cancelled') {
                $notifTitle = "Mission annulée : {$task->title}";
                $notifBody = "{$currentUser->name} a annulé la mission." . ($notes ? " Note : {$notes}" : "");
            } else {
                $notifTitle = "Mise à jour mission : {$task->title}";
                $notifBody = "{$currentUser->name} a mis à jour votre mission vers '{$newStatusLabel}'." . ($notes ? " Note : {$notes}" : "");
            }

            try {
                Notification::create([
                    'title' => $notifTitle,
                    'description' => $notifBody,
                    'category' => 'system',
                    'priority' => $newStatus === 'problem' ? 'urgent' : 'high',
                    'status' => 'unread',
                    'user' => $assignee->name,
                    'region' => $assignee->region ?? 'All',
                    'module' => 'Tasks',
                    'reference_id' => "TSK-{$task->id}",
                    'read' => false,
                ]);

                $targetRecipient = !empty($assignee->fcm_token) ? $assignee->fcm_token : '/topics/sti_delegates';
                app(FirebaseService::class)->sendPush(
                    $targetRecipient,
                    $notifTitle,
                    $notifBody,
                    [
                        'type' => 'task_status_changed',
                        'task_id' => (string) $task->id,
                        'status' => (string) $newStatus,
                        'updated_by' => (string) $currentUser->name,
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning("Assignee task notification error: " . $e->getMessage());
            }
        }

        // 3. Broadcast real-time WebSocket event
        try {
            Http::timeout(2)->post('http://127.0.0.1:8085/broadcast', [
                'type' => 'TASK_STATUS_CHANGED',
                'task_id' => $task->id,
                'status' => $newStatus,
                'old_status' => $oldStatus,
                'completion_notes' => $task->completion_notes,
                'updated_by' => [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                    'role' => $currentUser->role,
                ],
                'task' => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'completion_notes' => $task->completion_notes,
                    'assigned_by' => $task->assigned_by,
                    'assigned_to' => $task->assigned_to,
                    'assigned_to_name' => $task->assignedTo?->name,
                    'assigned_by_name' => $task->assignedBy?->name,
                ],
            ]);
        } catch (\Throwable $e) {
            // Non-blocking WebSocket broadcast
        }

        return response()->json([
            'success' => true,
            'message' => "Statut de la tâche mis à jour vers '{$newStatusLabel}'.",
            'task' => $task->fresh(['assignedBy:id,name,role', 'assignedTo:id,name,role,region,wilaya']),
        ]);
    }

    /**
     * Get global chronological audit trail / history of all task events.
     */
    public function history(Request $request): JsonResponse
    {
        $currentUser = $request->user() ?? auth('sanctum')->user();
        if (!$currentUser) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }
        $query = TaskHistory::with([
            'user:id,name,role',
            'task:id,title,description,category,priority,status,due_date,completion_notes,has_attachment,attachment_name,attachment_url,assigned_by,assigned_to,is_private',
            'task.assignedTo:id,name,role',
            'task.assignedBy:id,name,role',
        ]);

        if ($request->filled('task_id')) {
            $query->where('task_id', $request->input('task_id'));
        }

        // Exclude private tasks of other users from history
        $query->where(function ($q) use ($currentUser) {
            $q->whereDoesntHave('task', function ($t) {
                $t->where('is_private', true);
            })->orWhereHas('task', function ($t) use ($currentUser) {
                $t->where('is_private', true)
                  ->where(function ($sub) use ($currentUser) {
                      $sub->where('assigned_to', $currentUser->id)
                          ->orWhere('assigned_by', $currentUser->id);
                  });
            });
        });

        // Restrict non-admins to tasks they are involved in or performed actions on
        if (!$currentUser->isAdmin() && $currentUser->role !== 'directeur') {
            $query->where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)
                  ->orWhereHas('task', function ($t) use ($currentUser) {
                      $t->where('assigned_by', $currentUser->id)
                        ->orWhere('assigned_to', $currentUser->id);
                  });
            });
        }

        $histories = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        $data = $histories->map(function ($h) {
            return [
                'id' => $h->id,
                'task_id' => $h->task_id,
                'task_title' => $h->task?->title ?? 'Tâche supprimée',
                'task_category' => $h->task?->category,
                'has_attachment' => (bool) ($h->task?->has_attachment ?? $h->has_file),
                'has_file' => (bool) ($h->has_file ?? $h->task?->has_attachment),
                'attachment_name' => $h->task?->attachment_name ?? $h->file_name,
                'file_name' => $h->file_name ?? $h->task?->attachment_name,
                'file_url' => $h->file_url ?? $h->task?->attachment_url,
                'assignee_name' => $h->task?->assignedTo?->name,
                'performed_by_name' => $h->user?->name ?? 'Système',
                'user_name' => $h->user?->name ?? 'Système',
                'user_role' => $h->user?->role,
                'action' => $h->action,
                'from_status' => $h->from_status,
                'to_status' => $h->to_status,
                'notes' => $h->comment ?? $h->notes,
                'comment' => $h->comment ?? $h->notes,
                'task' => $h->task ? [
                    'id' => $h->task->id,
                    'title' => $h->task->title,
                    'description' => $h->task->description,
                    'status' => $h->task->status,
                    'priority' => $h->task->priority,
                    'category' => $h->task->category,
                    'due_date' => $h->task->due_date?->format('Y-m-d'),
                    'completion_notes' => $h->task->completion_notes,
                    'has_attachment' => (bool) $h->task->has_attachment,
                    'attachment_name' => $h->task->attachment_name,
                    'attachment_url' => $h->task->attachment_url,
                    'assigned_to' => $h->task->assigned_to,
                    'assigned_to_name' => $h->task->assignedTo?->name,
                    'assigned_by' => $h->task->assigned_by,
                    'assigned_by_name' => $h->task->assignedBy?->name ?? 'Direction',
                ] : [
                    'id' => $h->task_id,
                    'title' => $h->task?->title ?? 'Tâche #' . $h->task_id,
                    'assigned_to_name' => null,
                    'assigned_by_name' => 'Direction',
                ],
            ];
        });

        return response()->json([
            'history' => $data,
            'data' => $data,
        ]);
    }

    /**
     * Delete / cancel a task.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user() ?? auth('sanctum')->user();
        if (!$currentUser) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }
        $task = UserTask::findOrFail($id);

        if ($task->assigned_by !== $currentUser->id && !$currentUser->isAdmin()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $task->delete();

        return response()->json(['success' => true, 'message' => 'Tâche supprimée avec succès']);
    }
}
