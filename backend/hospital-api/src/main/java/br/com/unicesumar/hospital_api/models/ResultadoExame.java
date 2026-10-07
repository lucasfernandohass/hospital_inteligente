package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "resultado_exame")
public class ResultadoExame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_liberacao", nullable = false)
    private LocalDateTime dataLiberacao;

    @Column(nullable = false, length = 2000)
    private String laudo;

    @Column(name = "arquivo_anexo", length = 255)
    private String arquivoAnexo;

    @Column(nullable = false)
    private Boolean liberado;
}