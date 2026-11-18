<?php

namespace App\Services;

class VitalSignsGenerator
{
    /** @return array<string, float|int> */
    public function generate(string $scenario, int $step): array
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

    private function noise(float $amplitude): float
    {
        return (mt_rand(-100, 100) / 100) * $amplitude;
    }
}
