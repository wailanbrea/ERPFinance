<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    protected $table = 'compras';

    protected $fillable = [
        'sucursal_id',
        'proveedor_id',
        'almacen_id',
        'numero',
        'fecha',
        'total',
        'estado',
        'nota',
    ];

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }
}
