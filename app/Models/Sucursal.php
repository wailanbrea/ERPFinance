<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sucursal extends Model
{
    protected $table = 'sucursales';

    protected $fillable = [
        'empresa_id',
        'nombre',
        'codigo',
        'telefono',
        'direccion',
        'activa',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'sucursal_id');
    }
}
