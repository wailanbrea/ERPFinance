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
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('venta_id')->nullable()->constrained('ventas')->nullOnDelete();
            $table->decimal('monto', 12, 2)->default(0);
            $table->decimal('mora', 12, 2)->default(0);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->string('metodo_pago')->default('efectivo');
            $table->date('fecha')->index();
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
