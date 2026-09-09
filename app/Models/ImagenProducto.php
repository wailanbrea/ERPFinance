<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImagenProducto extends Model
{
    protected $table = 'imagenes_productos';

    protected $fillable = [
        'producto_id',
        'path',
        'orden',
    ];
}
