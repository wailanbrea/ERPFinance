<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('rnc', 20)->nullable()->after('nombre');
            $table->string('telefono_fiscal', 40)->nullable()->after('rnc');
            $table->text('direccion_fiscal')->nullable()->after('telefono_fiscal');
            $table->string('ncf_ejemplo', 20)->nullable()->after('direccion_fiscal');
            $table->text('nota_fiscal_pdf')->nullable()->after('ncf_ejemplo');
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'rnc',
                'telefono_fiscal',
                'direccion_fiscal',
                'ncf_ejemplo',
                'nota_fiscal_pdf',
            ]);
        });
    }
};
