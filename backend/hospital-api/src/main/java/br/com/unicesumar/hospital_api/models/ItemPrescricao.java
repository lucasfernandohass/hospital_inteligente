package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "item_prescricao")
public class ItemPrescricao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescricao_id", nullable = false)
    private Prescricao prescricao;

    @Column(name = "medicamento_id", nullable = false)
    private Long medicamentoId;

    @Column(nullable = false, length = 50)
    private String dose;

    @Column(name = "via_administracao", nullable = false, length = 50)
    private String viaAdministracao;

    @Column(nullable = false, length = 50)
    private String frequencia;

    @Column(nullable = false, length = 50)
    private String duracao;

    @Column(length = 500)
    private String observacoes;
}