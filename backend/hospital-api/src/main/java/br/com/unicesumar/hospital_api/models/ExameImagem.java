package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "exame_imagem")
public class ExameImagem extends Exame {

    @Column(nullable = false, length = 50)
    private String modalidade;

    @Column(name = "regiao_corpo", nullable = false, length = 80)
    private String regiaoCorpo;

    @Column(name = "arquivo_digital", length = 255)
    private String arquivoDigital;
}
