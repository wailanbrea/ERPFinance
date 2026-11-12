<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Apartado extends Model
{
    protected $table = 'apartados';

    protected $fillable = [
        'sucursal_id',
        'venta_id',
        'cliente_id',
        'usuario_id',
        'monto_total',
        'abono_inicial',
        'total_abonado',
        'saldo_pendiente',
        'cuotas_semanales',
        'fecha_apartado',
        'fecha_limite',
        'estado',
        'nota',
    ];

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function cuotas(): HasMany
    {
        return $this->hasMany(CuotaApartado::class, 'apartado_id')->orderBy('numero');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'apartado_id')->orderByDesc('fecha');
    }
}
