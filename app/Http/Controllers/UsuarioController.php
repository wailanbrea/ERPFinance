<?php

namespace App\Http\Controllers;

use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $user = $request->user();
        $empresaId = $user->resolvedEmpresaId();

        $usuarios = User::query()
            ->with(['roles:name', 'sucursal:id,nombre,codigo'])
            ->when($empresaId, fn ($qq) => $qq->where('empresa_id', $empresaId))
            ->when(! $empresaId && ! $user->hasRole('SuperAdmin'), fn ($qq) => $qq->whereRaw('1 = 0'))
            ->when($q, fn ($qq) => $qq->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%");
            }))
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Usuarios/Index', [
            'usuarios' => $usuarios,
            'panelUsuarios' => config('planes.panel_usuarios'),
            'cuposPorPlan' => [
                'Plan Basico' => $this->resumenCupo('Plan Basico'),
                'Plan Full' => $this->resumenCupo('Plan Full'),
            ],
            'sucursales' => Sucursal::query()->orderBy('nombre')->get(['id', 'nombre', 'codigo']),
            'filtros' => ['q' => $q],
        ]);
    }

    public function store(Request $request)
    {
        $planes = $this->nombresRolesPlan();
        $operativos = $this->nombresRolesOperativos();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'sucursal_id' => ['nullable', 'integer', 'exists:sucursales,id'],
            'plan_rol' => ['required', 'string', Rule::in($planes)],
            'roles_operativos' => ['nullable', 'array'],
            'roles_operativos.*' => ['string', Rule::in($operativos)],
        ]);

        $sucursalId = $this->normalizarSucursalId($data['sucursal_id'] ?? null);

        $this->asegurarCupoDisponible(null, $data['plan_rol']);

        $roles = array_values(array_unique(array_merge(
            [$data['plan_rol']],
            $data['roles_operativos'] ?? []
        )));

        $sucursal = $sucursalId ? Sucursal::query()->find($sucursalId) : null;
        $empresaId = $sucursal?->empresa_id ?? $request->user()->resolvedEmpresaId();

        $u = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'sucursal_id' => $sucursalId,
            'empresa_id' => $empresaId,
        ]);

        $u->syncRoles($roles);

        return back()->with('success', 'Usuario creado con el plan indicado.');
    }

    public function update(Request $request, User $user)
    {
        $planes = $this->nombresRolesPlan();
        $operativos = $this->nombresRolesOperativos();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'sucursal_id' => ['nullable', 'integer', 'exists:sucursales,id'],
            'plan_rol' => ['required', 'string', Rule::in($planes)],
            'roles_operativos' => ['nullable', 'array'],
            'roles_operativos.*' => ['string', Rule::in($operativos)],
        ]);

        $sucursalId = $this->normalizarSucursalId($data['sucursal_id'] ?? null);
        $sucursal = $sucursalId ? Sucursal::query()->find($sucursalId) : null;
        $empresaId = $sucursal?->empresa_id ?? $request->user()->resolvedEmpresaId();

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'sucursal_id' => $sucursalId,
            'empresa_id' => $empresaId,
        ];
        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }
        $user->update($payload);

        $this->asegurarCupoDisponible($user, $data['plan_rol']);

        $roles = array_values(array_unique(array_merge(
            [$data['plan_rol']],
            $data['roles_operativos'] ?? []
        )));
        $user->syncRoles($roles);

        return back()->with('success', 'Usuario y plan actualizados.');
    }

    /**
     * @return list<string>
     */
    private function nombresRolesPlan(): array
    {
        return collect(config('planes.panel_usuarios.roles_plan', []))
            ->pluck('rol')
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function nombresRolesOperativos(): array
    {
        return collect(config('planes.panel_usuarios.roles_operativos', []))
            ->pluck('rol')
            ->filter()
            ->values()
            ->all();
    }

    private function normalizarSucursalId(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    /**
     * @return array{usados: int, max: int|null, disponibles: int|null}
     */
    private function resumenCupo(string $rolPlan): array
    {
        $maxRaw = match ($rolPlan) {
            'Plan Basico' => (int) config('planes.basico.max_usuarios_empleados', 10),
            'Plan Full' => (int) config('planes.full.max_usuarios_empleados', 50),
            default => 0,
        };
        $max = $maxRaw <= 0 ? null : $maxRaw;
        $usados = User::role($rolPlan)->count();

        return [
            'usados' => $usados,
            'max' => $max,
            'disponibles' => $max === null ? null : max(0, $max - $usados),
        ];
    }

    private function asegurarCupoDisponible(?User $usuario, string $planRol): void
    {
        if (! in_array($planRol, ['Plan Basico', 'Plan Full'], true)) {
            return;
        }

        $maxRaw = match ($planRol) {
            'Plan Basico' => (int) config('planes.basico.max_usuarios_empleados', 10),
            'Plan Full' => (int) config('planes.full.max_usuarios_empleados', 50),
            default => 0,
        };

        if ($maxRaw <= 0) {
            return;
        }

        if ($usuario?->hasRole($planRol)) {
            return;
        }

        $enUso = User::role($planRol)->count();
        if ($enUso >= $maxRaw) {
            $etiqueta = $planRol === 'Plan Basico' ? 'Plan Básico' : 'Plan Full';
            throw ValidationException::withMessages([
                'plan_rol' => "Cupo de «{$etiqueta}» completo ({$enUso}/{$maxRaw}). Sube el límite en .env (PLAN_".($planRol === 'Plan Basico' ? 'BASICO' : 'FULL')."_MAX_USUARIOS), libera un asiento cambiando el plan de otro usuario o asigna otro plan comercial.",
            ]);
        }
    }
}
