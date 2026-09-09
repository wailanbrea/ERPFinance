<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $fillable = [
        'sucursal_id',
        'nombre',
        'apellido',
        'cedula_rnc',
        'telefono',
        'whatsapp',
        'direccion',
        'referencias',
        'estado',
    ];

    public function direcciones(): HasMany
    {
        return $this->hasMany(DireccionCliente::class, 'cliente_id');
    }
}
