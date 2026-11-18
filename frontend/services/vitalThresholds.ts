import type { VitalThresholdsDto, VitalThresholdValues } from "./api"

export const defaultVitalThresholds: VitalThresholdValues = {
  fcAlertaMin: 50,
  fcAlertaMax: 110,
  fcCriticoMin: 40,
  fcCriticoMax: 130,
  spo2AlertaMin: 92,
  spo2CriticoMin: 88,
  frAlertaMax: 24,
  frCriticoMax: 30,
  temperaturaAlertaMax: 38,
  temperaturaCriticoMax: 39,
  paSistolicaAlertaMax: 140,
  paSistolicaCriticoMax: 180,
}

export function valuesFromVitalThresholds(config: VitalThresholdsDto): VitalThresholdValues {
  return {
    fcAlertaMin: config.fcAlertaMin,
    fcAlertaMax: config.fcAlertaMax,
    fcCriticoMin: config.fcCriticoMin,
    fcCriticoMax: config.fcCriticoMax,
    spo2AlertaMin: config.spo2AlertaMin,
    spo2CriticoMin: config.spo2CriticoMin,
    frAlertaMax: config.frAlertaMax,
    frCriticoMax: config.frCriticoMax,
    temperaturaAlertaMax: config.temperaturaAlertaMax,
    temperaturaCriticoMax: config.temperaturaCriticoMax,
    paSistolicaAlertaMax: config.paSistolicaAlertaMax,
    paSistolicaCriticoMax: config.paSistolicaCriticoMax,
  }
}
