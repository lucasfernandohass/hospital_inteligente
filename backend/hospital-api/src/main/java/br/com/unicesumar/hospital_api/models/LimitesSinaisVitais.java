package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "limites_sinais_vitais")
public class LimitesSinaisVitais {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "paciente_id")
    private Long pacienteId;

    @Column(name = "fc_alerta_min", nullable = false)
    private Integer fcAlertaMin;

    @Column(name = "fc_alerta_max", nullable = false)
    private Integer fcAlertaMax;

    @Column(name = "fc_critico_min", nullable = false)
    private Integer fcCriticoMin;

    @Column(name = "fc_critico_max", nullable = false)
    private Integer fcCriticoMax;

    @Column(name = "spo2_alerta_min", nullable = false, precision = 5, scale = 2)
    private BigDecimal spo2AlertaMin;

    @Column(name = "spo2_critico_min", nullable = false, precision = 5, scale = 2)
    private BigDecimal spo2CriticoMin;

    @Column(name = "fr_alerta_max", nullable = false)
    private Integer frAlertaMax;

    @Column(name = "fr_critico_max", nullable = false)
    private Integer frCriticoMax;

    @Column(name = "temperatura_alerta_max", nullable = false, precision = 5, scale = 2)
    private BigDecimal temperaturaAlertaMax;

    @Column(name = "temperatura_critico_max", nullable = false, precision = 5, scale = 2)
    private BigDecimal temperaturaCriticoMax;

    @Column(name = "pa_sistolica_alerta_max", nullable = false)
    private Integer paSistolicaAlertaMax;

    @Column(name = "pa_sistolica_critico_max", nullable = false)
    private Integer paSistolicaCriticoMax;

    @Column(name = "atualizado_por_id")
    private Long atualizadoPorId;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
