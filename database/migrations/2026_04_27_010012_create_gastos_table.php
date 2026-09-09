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
        Schema::create('gastos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('usuario_id')->constrained('users');
            $table->foreignId('caja_id')->nullable()->constrained('cajas')->nullOnDelete();
            $table->date('fecha')->index();
            $table->string('categoria')->nullable()->index();
            $table->string('concepto');
            $table->decimal('monto', 12, 2)->default(0);
            $table->string('estado')->default('registrado')->index(); // registrado/anulado
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gastos');
    }
};
