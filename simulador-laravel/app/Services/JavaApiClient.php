<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class JavaApiClient
{
    /** @return list<array{id: int, nome: string, numeroProntuario: ?string}> */
    public function pacientesInternados(): array
    {
        $email = config('simulator.java_email');
        $password = config('simulator.java_password');

        if (!$email || !$password) {
            throw new RuntimeException('Configure JAVA_API_EMAIL e JAVA_API_PASSWORD no .env do simulador.');
        }

        $baseUrl = rtrim(config('simulator.api_url'), '/');
        $login = Http::baseUrl($baseUrl)->asJson()->acceptJson()->timeout(10)
            ->post('/api/auth/login', ['email' => $email, 'senha' => $password])->throw()->json();
        $token = $login['token'] ?? null;

        if (!$token) {
            throw new RuntimeException('A API Java não retornou um token de autenticação.');
        }

        $api = Http::baseUrl($baseUrl)->withToken($token)->acceptJson()->timeout(10);
        $patients = $api->get('/api/pacientes')->throw()->json();
        $admissions = $api->get('/api/internacoes')->throw()->json();
        $activePatientIds = collect($admissions)
            ->filter(fn (array $admission) => ($admission['dataAlta'] ?? null) === null)
            ->pluck('pacienteId')->map(fn ($id) => (int) $id)->unique()->all();

        return collect($patients)
            ->filter(fn (array $patient) => in_array((int) $patient['id'], $activePatientIds, true))
            ->map(fn (array $patient) => [
                'id' => (int) $patient['id'],
                'nome' => $patient['nome'],
                'numeroProntuario' => $patient['numeroProntuario'] ?? null,
            ])
            ->values()->all();
    }
}
