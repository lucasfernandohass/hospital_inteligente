<?php

namespace App\Services;

class VitalSignsGenerator
{
    /** @return array<string, float|int> */
    public function generate(string $scenario, int $step, int $patientIndex = 0): array
    {
        $baseline = [
            'TEMPERATURA' => 36.8,
            'PRESSAO_SISTOLICA' => 120,
            'PRESSAO_DIASTOLICA' => 80,
            'FREQUENCIA_CARDIACA' => 76,
            'FREQUENCIA_RESPIRATORIA' => 16,
            'SATURACAO_OXIGENIO' => 98,
        ];

        $profile = match ($scenario) {
            'febre' => ['TEMPERATURA' => 39.1, 'FREQUENCIA_CARDIACA' => 112],
            'dessaturacao' => ['SATURACAO_OXIGENIO' => 88, 'FREQUENCIA_RESPIRATORIA' => 26, 'FREQUENCIA_CARDIACA' => 104],
            'hipertensao' => ['PRESSAO_SISTOLICA' => 178, 'PRESSAO_DIASTOLICA' => 108, 'FREQUENCIA_CARDIACA' => 96],
            'deterioracao_recuperacao' => $this->deteriorationProfile($step),
            'apresentacao' => $this->presentationProfile($step, $patientIndex),
            'estavel' => [],
            default => throw new \InvalidArgumentException("Cenário desconhecido: {$scenario}"),
        };

        $values = array_replace($baseline, $profile);
        $values['TEMPERATURA'] += $this->noise(0.1);
        $values['PRESSAO_SISTOLICA'] += $this->noise(3);
        $values['PRESSAO_DIASTOLICA'] += $this->noise(2);
        $values['FREQUENCIA_CARDIACA'] += $this->noise(3);
        $values['FREQUENCIA_RESPIRATORIA'] += $this->noise(1);
        $values['SATURACAO_OXIGENIO'] += $this->noise(1);

        return array_map(static fn ($value) => round(max(0, $value), 1), $values);
    }

    /** @return array<string, float|int> */
    private function deteriorationProfile(int $step): array
    {
        $phase = ($step % 60) / 60;
        $severity = $phase < 0.5 ? $phase * 2 : (1 - $phase) * 2;

        return [
            'TEMPERATURA' => 36.8 + 2.2 * $severity,
            'PRESSAO_SISTOLICA' => 120 - 14 * $severity,
            'PRESSAO_DIASTOLICA' => 80 - 8 * $severity,
            'FREQUENCIA_CARDIACA' => 76 + 48 * $severity,
            'FREQUENCIA_RESPIRATORIA' => 16 + 14 * $severity,
            'SATURACAO_OXIGENIO' => 98 - 12 * $severity,
        ];
    }

    /**
     * Todos começam saudáveis; o 1º internado evolui para febre a partir do ciclo 6
     * e o 2º para dessaturação a partir do ciclo 10. Os demais seguem estáveis.
     *
     * @return array<string, float|int>
     */
    private function presentationProfile(int $step, int $patientIndex): array
    {
        $ramp = static fn (int $start): float => min(1, max(0, ($step - $start + 1) / 3));

        return match ($patientIndex) {
            0 => [
                'TEMPERATURA' => 36.8 + 2.6 * $ramp(6),
                'FREQUENCIA_CARDIACA' => 76 + 40 * $ramp(6),
            ],
            1 => [
                'SATURACAO_OXIGENIO' => 98 - 12 * $ramp(10),
                'FREQUENCIA_RESPIRATORIA' => 16 + 11 * $ramp(10),
                'FREQUENCIA_CARDIACA' => 76 + 30 * $ramp(10),
            ],
            default => [],
        };
    }

    private function noise(float $amplitude): float
    {
        return (mt_rand(-100, 100) / 100) * $amplitude;
    }
}
