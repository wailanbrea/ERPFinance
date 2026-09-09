<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class EmpresasController extends Controller
{
    private function isOwnerEmpresa(Empresa $empresa): bool
    {
        return $empresa->slug === 'owner';
    }

    public function index(Request $request)
    {
        $q = $request->string('q')->toString();

        $empresas = Empresa::query()
            ->with(['adminUser:id,name,email'])
            ->when($q, function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('nombre', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%")
                        ->orWhere('id', $q);
                });
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        $empresas->getCollection()->transform(function (Empresa $e) {
            return [
                'id' => $e->id,
                'nombre' => $e->nombre,
                'slug' => $e->slug,
                'plan' => $e->plan,
                'licencia_activa' => (bool) $e->licencia_activa,
                'max_usuarios_empleados' => (int) $e->max_usuarios_empleados,
                'inicio' => $e->inicio?->toDateString(),
                'proximo_pago' => $e->proximo_pago?->toDateString(),
                'ultimo_pago' => $e->ultimo_pago?->toDateString(),
                'estado_pago' => $e->estado_pago,
                'nota' => $e->nota,
                'rnc' => $e->rnc,
                'telefono_fiscal' => $e->telefono_fiscal,
                'direccion_fiscal' => $e->direccion_fiscal,
                'ncf_ejemplo' => $e->ncf_ejemplo,
                'nota_fiscal_pdf' => $e->nota_fiscal_pdf,
                'admin_user' => $e->adminUser ? [
                    'id' => $e->adminUser->id,
                    'name' => $e->adminUser->name,
                    'email' => $e->adminUser->email,
                ] : null,
            ];
        });

        return Inertia::render('SuperAdmin/Empresas/Index', [
            'empresas' => $empresas,
            'filtros' => ['q' => $q],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:empresas,slug'],
            'plan' => ['required', 'in:basico,full,personalizado'],
            'licencia_activa' => ['required', 'boolean'],
            'max_usuarios_empleados' => ['required', 'integer', 'min:1', 'max:500'],
            'inicio' => ['nullable', 'date'],
            'proximo_pago' => ['nullable', 'date'],
            'ultimo_pago' => ['nullable', 'date'],
            'estado_pago' => ['required', 'in:al_dia,atrasado,suspendido'],
            'nota' => ['nullable', 'string'],
            'rnc' => ['nullable', 'string', 'max:20'],
            'telefono_fiscal' => ['nullable', 'string', 'max:40'],
            'direccion_fiscal' => ['nullable', 'string', 'max:2000'],
            'ncf_ejemplo' => ['nullable', 'string', 'max:20'],
            'nota_fiscal_pdf' => ['nullable', 'string', 'max:5000'],
            'admin_name' => ['required', 'string', 'max:120'],
            'admin_email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        $plainPassword = Str::password(length: 12);

        $empresa = null;
        $admin = null;
        DB::transaction(function () use ($data, $plainPassword, &$empresa, &$admin) {
            $emptyToNull = fn (?string $v): ?string => ($v !== null && trim($v) === '') ? null : $v;

            $empresa = Empresa::create([
                'nombre' => $data['nombre'],
                'slug' => $data['slug'],
                'plan' => $data['plan'],
                'licencia_activa' => (bool) $data['licencia_activa'],
                'max_usuarios_empleados' => (int) $data['max_usuarios_empleados'],
                'inicio' => $data['inicio'] ?? null,
                'proximo_pago' => $data['proximo_pago'] ?? null,
                'ultimo_pago' => $data['ultimo_pago'] ?? null,
                'estado_pago' => $data['estado_pago'],
                'nota' => $emptyToNull($data['nota'] ?? null),
                'rnc' => $emptyToNull($data['rnc'] ?? null),
                'telefono_fiscal' => $emptyToNull($data['telefono_fiscal'] ?? null),
                'direccion_fiscal' => $emptyToNull($data['direccion_fiscal'] ?? null),
                'ncf_ejemplo' => $emptyToNull($data['ncf_ejemplo'] ?? null),
                'nota_fiscal_pdf' => $emptyToNull($data['nota_fiscal_pdf'] ?? null),
            ]);

            // Sucursal principal por defecto
            $sucursal = Sucursal::create([
                'empresa_id' => $empresa->id,
                'nombre' => 'Sucursal Principal',
                'codigo' => strtoupper($empresa->slug).'-PRINCIPAL',
                'telefono' => null,
                'direccion' => null,
                'activa' => true,
            ]);

            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => Hash::make($plainPassword),
                'empresa_id' => $empresa->id,
                'sucursal_id' => $sucursal->id,
            ]);

            // Rol admin de empresa (full permisos dentro de la empresa; el scoping se hará por empresa_id)
            $adminRole = Role::firstOrCreate(['name' => 'Administrador']);
            $admin->syncRoles([$adminRole->name]);

            $empresa->admin_user_id = $admin->id;
            $empresa->save();
        });

        return redirect()
            ->route('superadmin.empresas.index')
            ->with('success', 'Licencia creada. Guarda las credenciales (se muestran una sola vez).')
            ->with('credenciales_nueva_empresa', [
                'empresa' => $empresa?->nombre,
                'slug' => $empresa?->slug,
                'admin_email' => $admin?->email,
                'admin_password' => $plainPassword,
            ]);
    }

    public function update(Request $request, Empresa $empresa)
    {
        $data = $request->validate([
            'plan' => ['required', 'in:basico,full,personalizado'],
            'licencia_activa' => ['required', 'boolean'],
            'max_usuarios_empleados' => ['required', 'integer', 'min:1', 'max:500'],
            'inicio' => ['nullable', 'date'],
            'proximo_pago' => ['nullable', 'date'],
            'ultimo_pago' => ['nullable', 'date'],
            'estado_pago' => ['required', 'in:al_dia,atrasado,suspendido'],
            'nota' => ['nullable', 'string'],
            'rnc' => ['nullable', 'string', 'max:20'],
            'telefono_fiscal' => ['nullable', 'string', 'max:40'],
            'direccion_fiscal' => ['nullable', 'string', 'max:2000'],
            'ncf_ejemplo' => ['nullable', 'string', 'max:20'],
            'nota_fiscal_pdf' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($this->isOwnerEmpresa($empresa) && array_key_exists('licencia_activa', $data) && ! (bool) $data['licencia_activa']) {
            abort(403, 'La licencia OWNER no se puede desactivar.');
        }

        foreach (['rnc', 'telefono_fiscal', 'direccion_fiscal', 'ncf_ejemplo', 'nota_fiscal_pdf', 'nota'] as $k) {
            if (array_key_exists($k, $data) && $data[$k] === '') {
                $data[$k] = null;
            }
        }

        $empresa->update($data);

        return back()->with('success', 'Empresa actualizada.');
    }

    public function resetClaveAdmin(Request $request, Empresa $empresa)
    {
        $empresa->load(['adminUser']);
        $admin = $empresa->adminUser;
        if (! $admin) {
            abort(422, 'Esta empresa no tiene admin asignado.');
        }

        $plainPassword = Str::password(length: 12);
        $admin->password = Hash::make($plainPassword);
        $admin->save();

        return back()
            ->with('success', 'Clave del admin reseteada. Guarda la clave temporal (se muestra una sola vez).')
            ->with('credenciales_nueva_empresa', [
                'empresa' => $empresa->nombre,
                'slug' => $empresa->slug,
                'admin_email' => $admin->email,
                'admin_password' => $plainPassword,
            ]);
    }

    public function destroy(Request $request, Empresa $empresa)
    {
        if ($this->isOwnerEmpresa($empresa)) {
            abort(403, 'La empresa OWNER no se puede eliminar.');
        }

        DB::transaction(function () use ($empresa) {
            // Desasignar admin (si existe) para evitar confusiones; el usuario permanece.
            $empresa->admin_user_id = null;
            $empresa->save();

            // Liberar sucursales y usuarios; idealmente deberían migrarse a otra empresa antes.
            Sucursal::query()->where('empresa_id', $empresa->id)->update(['empresa_id' => null]);
            User::query()->where('empresa_id', $empresa->id)->update(['empresa_id' => null]);

            $empresa->delete();
        });

        return redirect()->route('superadmin.empresas.index')->with('success', 'Empresa eliminada.');
    }
}

