<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class VitalSignsSender
{
    /** @param array<string, float|int> $values */
    public function send(int $patientId, array $values): array
    {
        $measures = [];
        foreach ($values as $type => $value) {
            $measures[] = ['tipo' => $type, 'valor' => $value];
        }

        return Http::baseUrl(rtrim(config('simulator.api_url'), '/'))
            ->withHeader('X-Monitor-Api-Key', config('simulator.api_key'))
            ->acceptJson()
            ->asJson()
            ->timeout(10)
            ->post('/api/ingestao/sinais-vitais', [
                'pacienteId' => $patientId,
                'capturadoEm' => now()->format('Y-m-d\TH:i:s'),
                'medidas' => $measures,
            ])
            ->throw()
            ->json();
    }
}
