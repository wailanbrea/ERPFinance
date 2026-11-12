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
        Schema::create('apartados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('venta_id')->constrained('ventas')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('clientes');
            $table->foreignId('usuario_id')->constrained('users');

            $table->decimal('monto_total', 12, 2)->default(0);
            $table->decimal('abono_inicial', 12, 2)->default(0);
            $table->decimal('total_abonado', 12, 2)->default(0);
            $table->decimal('saldo_pendiente', 12, 2)->default(0);
            $table->unsignedInteger('cuotas_semanales')->default(4);
            $table->date('fecha_apartado')->index();
            $table->date('fecha_limite')->nullable()->index();

            // pendiente, liquidado, entregado, cancelado
            $table->string('estado')->default('pendiente')->index();
            $table->text('nota')->nullable();
            $table->timestamps();
        });

        Schema::create('cuotas_apartado', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apartado_id')->constrained('apartados')->cascadeOnDelete();
            $table->unsignedInteger('numero');
            $table->date('vencimiento')->index();
            $table->decimal('monto', 12, 2)->default(0);
            $table->decimal('pagado', 12, 2)->default(0);
            // pendiente, pagada, parcial
            $table->string('estado')->default('pendiente')->index();
            $table->timestamps();

            $table->unique(['apartado_id', 'numero']);
        });

        Schema::table('pagos', function (Blueprint $table) {
            $table->foreignId('apartado_id')->nullable()->after('venta_id')
                ->constrained('apartados')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('apartado_id');
        });

        Schema::dropIfExists('cuotas_apartado');
        Schema::dropIfExists('apartados');
    }
};
