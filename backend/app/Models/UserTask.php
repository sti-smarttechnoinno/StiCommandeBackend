<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserTask extends Model
{
    use HasFactory;

    protected $table = 'user_tasks';

    protected $fillable = [
        'title',
        'description',
        'is_private',
        'assigned_by',
        'assigned_to',
        'category',
        'priority',
        'due_date',
        'target_amount',
        'target_count',
        'achieved_count',
        'has_attachment',
        'attachment_url',
        'attachment_name',
        'attachment_type',
        'attachment_size',
        'status',
        'completed_at',
        'completion_notes',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'target_amount' => 'float',
        'target_count' => 'integer',
        'achieved_count' => 'integer',
        'has_attachment' => 'boolean',
        'attachment_size' => 'integer',
    ];

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(TaskHistory::class, 'task_id')->orderBy('created_at', 'desc');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && !$this->isCompleted();
    }
}
