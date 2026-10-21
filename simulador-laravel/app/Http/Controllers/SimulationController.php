<?php

namespace App\Http\Controllers;

use App\Services\JavaApiClient;
use App\Services\SimulationState;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class SimulationController
{
    public function patients(JavaApiClient $java): JsonResponse
    {
        try {
            return response()->json(['data' => $java->pacientesInternados()]);
        } catch (Throwable $exception) {
            return response()->json(['message' => 'Não foi possível consultar os pacientes internados na API Java.', 'detail' => $exception->getMessage()], 502);
        }
    }

    public function start(Request $request, SimulationState $state): JsonResponse
    {
        $validated = $request->validate([
            'scenario' => ['sometimes', 'string', Rule::in(['estavel', 'febre', 'dessaturacao', 'hipertensao', 'deterioracao_recuperacao'])],
        ]);

        try {
            $patients = app(JavaApiClient::class)->pacientesInternados();
            $simulation = $state->start($validated['scenario'] ?? config('simulator.scenario'));
            $simulation['activePatients'] = count($patients);
            $state->write($simulation);

            return response()->json([
                'message' => $patients === []
                    ? 'Simulação armada. Ela começará a enviar sinais quando houver paciente com internação ativa.'
                    : 'Simulação iniciada. Novos pacientes com internação ativa serão incluídos automaticamente.',
                'data' => $simulation,
                'patients' => $patients,
            ], 202);
        } catch (Throwable $exception) {
            return response()->json(['message' => 'Não foi possível iniciar a simulação.', 'detail' => $exception->getMessage()], 502);
        }
    }

    public function status(SimulationState $state): JsonResponse
    {
        return response()->json(['data' => $state->read()]);
    }

    public function stop(SimulationState $state): JsonResponse
    {
        return response()->json(['message' => 'Simulação parada.', 'data' => $state->stop()]);
    }
}
