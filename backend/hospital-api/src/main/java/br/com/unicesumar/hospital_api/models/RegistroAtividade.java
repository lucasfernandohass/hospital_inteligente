package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "registro_atividade")
public class RegistroAtividade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "funcionario_id")
    private Long funcionarioId;

    @Column(name = "funcionario_nome", nullable = false, length = 150)
    private String funcionarioNome;

    @Enumerated(EnumType.STRING)
    @Column(name = "funcionario_role", nullable = false, length = 20)
    private Role funcionarioRole;

    @Column(nullable = false, length = 120)
    private String acao;

    @Column(nullable = false, length = 120)
    private String entidade;

    @Column(length = 500)
    private String detalhes;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;
}
