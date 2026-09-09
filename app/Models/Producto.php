<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';

    protected $fillable = [
        'empresa_id',
        'categoria_id',
        'marca_id',
        'nombre',
        'descripcion',
        'sku',
        'codigo_barra',
        'qr',
        'modelo',
        'serial',
        'costo',
        'precio_contado',
        'precio_financiado',
        'precio_mayor',
        'garantia_meses',
        'activo',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForEmpresa(Builder $query, ?int $empresaId): Builder
    {
        if ($empresaId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('productos.empresa_id', $empresaId);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class);
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(ImagenProducto::class, 'producto_id')->orderBy('orden');
    }
}
