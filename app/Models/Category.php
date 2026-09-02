<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'icon',
        'description',
        'workflow_type',
        'requires_delivery',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_delivery' => 'boolean',
    ];
}
