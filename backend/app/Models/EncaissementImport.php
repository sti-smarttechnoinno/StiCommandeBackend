<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EncaissementImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'rows_count',
        'tiers_count',
        'clients_updated',
        'clients_created',
        'imported_by',
    ];

    protected function casts(): array
    {
        return [
            'rows_count' => 'integer',
            'tiers_count' => 'integer',
            'clients_updated' => 'integer',
            'clients_created' => 'integer',
        ];
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}
