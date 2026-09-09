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
        Schema::create('cajas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('usuario_apertura_id')->constrained('users');
            $table->foreignId('usuario_cierre_id')->nullable()->constrained('users')->nullOnDelete();

            $table->dateTime('apertura_en')->index();
            $table->dateTime('cierre_en')->nullable()->index();
            $table->decimal('monto_inicial', 12, 2)->default(0);
            $table->decimal('monto_cierre', 12, 2)->default(0);
            $table->decimal('diferencia', 12, 2)->default(0);
            $table->string('estado')->default('abierta')->index(); // abierta/cerrada
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cajas');
    }
};
