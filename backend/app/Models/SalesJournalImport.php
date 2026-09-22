<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesJournalImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'rows_count',
        'matched_clients_count',
        'unmatched_clients_count',
        'duplicate_action',
        'skipped_duplicates_count',
        'updated_duplicates_count',
        'total_amount_ttc',
        'total_paid',
        'total_remaining',
        'imported_by',
    ];

    protected function casts(): array
    {
        return [
            'rows_count' => 'integer',
            'matched_clients_count' => 'integer',
            'unmatched_clients_count' => 'integer',
            'skipped_duplicates_count' => 'integer',
            'updated_duplicates_count' => 'integer',
            'total_amount_ttc' => 'float',
            'total_paid' => 'float',
            'total_remaining' => 'float',
        ];
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    public function records(): HasMany
    {
        return $this->hasMany(SalesJournal::class, 'import_id');
    }
}
