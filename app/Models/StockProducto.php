<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockProducto extends Model
{
    protected $table = 'stock_productos';

    protected $fillable = [
        'almacen_id',
        'producto_id',
        'stock',
        'stock_minimo',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }
}
