<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class DetalleCompra extends Model
{
    protected $table = 'detalle_compras';

    protected $fillable = [
        'compra_id',
        'producto_id',
        'cantidad',
        'costo_unitario',
        'itbis_aplica',
        'itbis_tasa',
        'costo_unitario_con_itbis',
        'subtotal',
    ];

    public function compra(): BelongsTo
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
