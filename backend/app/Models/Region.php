<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'name_fr',
        'subtitle',
        'icon',
        'color',
        'bg_color',
        'text_color',
        'status',
    ];

    public function wilayas(): BelongsToMany
    {
        return $this->belongsToMany(Wilaya::class, 'region_wilaya');
    }

    public function defaultWilayas(): HasMany
    {
        return $this->hasMany(Wilaya::class, 'region_name', 'name');
    }

    public function customWilayas(): BelongsToMany
    {
        return $this->belongsToMany(Wilaya::class, 'region_wilaya');
    }

    public function delegates(): HasMany
    {
        return $this->hasMany(User::class, 'region', 'name');
    }

    public function resolveRouteBinding($value, $field = null)
    {
        if (is_numeric($value)) {
            return $this->where('id', $value)->first() ?? $this->where('code', $value)->firstOrFail();
        }

        return $this->where('code', $value)->firstOrFail();
    }
}
