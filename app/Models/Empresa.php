<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    protected $table = 'empresas';

    protected $fillable = [
        'admin_user_id',
        'nombre',
        'slug',
        'plan',
        'licencia_activa',
        'max_usuarios_empleados',
        'inicio',
        'proximo_pago',
        'ultimo_pago',
        'estado_pago',
        'nota',
        'rnc',
        'telefono_fiscal',
        'direccion_fiscal',
        'ncf_ejemplo',
        'nota_fiscal_pdf',
    ];

    protected function casts(): array
    {
        return [
            'licencia_activa' => 'boolean',
            'inicio' => 'date',
            'proximo_pago' => 'date',
            'ultimo_pago' => 'date',
        ];
    }

    public function sucursales(): HasMany
    {
        return $this->hasMany(Sucursal::class, 'empresa_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'empresa_id');
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'empresa_id');
    }
}

