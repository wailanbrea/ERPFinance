<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('cliente_id')->nullable()->constrained('clientes');
            $table->foreignId('usuario_id')->constrained('users');
            $table->foreignId('almacen_id')->constrained('almacenes');

            $table->string('tipo')->index(); // contado, financiada, apartado
            $table->string('numero_factura')->nullable()->index();
            $table->date('fecha')->index();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('impuesto', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->string('estado')->default('registrada')->index();
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};
