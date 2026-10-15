package br.com.unicesumar.hospital_api.models;

import java.time.LocalDate;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "pessoa")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Pessoa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    @Column(nullable = false, length = 150)
    protected String nome;

    @Column(nullable = false, unique = true, length = 11)
    protected String cpf;

    @Column(name = "data_nascimento", nullable = false)
    protected LocalDate dataNascimento;

    @Column(length = 20)
    protected String telefone;

    @Column(length = 255)
    protected String endereco;

    public boolean validarCpf(String cpf){
        if (cpf == null || cpf.trim().isEmpty()) {
            return false;
        }

        // Remove caracteres
        cpf = cpf.replaceAll("\\D", "");

        // CPF deve ter exatamente 11 digito
        if (cpf.length() != 11) {
            return false;
        }

        // Rejeita os CPFs com digitos iguais
        if (cpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        try {
            // Calcula o primeiro digito verificador
            int soma = 0;
            for (int i = 0; i < 9; i++) {
                soma += Character.getNumericValue(cpf.charAt(i)) * (10 - i);
            }
            int primeiroDigito = 11 - (soma % 11);
            if (primeiroDigito >= 10) {
                primeiroDigito = 0;
            }

            // Verifica o primeiro digito
            if (primeiroDigito != Character.getNumericValue(cpf.charAt(9))) {
                return false;
            }

            // Calcula o segundo digito verificador
            soma = 0;
            for (int i = 0; i < 10; i++) {
                soma += Character.getNumericValue(cpf.charAt(i)) * (11 - i);
            }
            int segundoDigito = 11 - (soma % 11);
            if (segundoDigito >= 10) {
                segundoDigito = 0;
            }

            // Verifica o segundo digito
            return segundoDigito == Character.getNumericValue(cpf.charAt(10));

        } catch (NumberFormatException e) {
            return false;
        }
    }

    public void atualizarDados(String nome, String cpf, LocalDate dataNascimento,
                           String telefone, String endereco) {
        
        // Validação do nome
        if (nome != null) {
            if (nome.trim().isEmpty()) {
                throw new IllegalArgumentException("Nome não pode ser vazio");
            }
            this.nome = nome.trim();
        }

        // Validação do CPF
        if (cpf != null) {
            if (!validarCpf(cpf)) {
                throw new IllegalArgumentException("CPF inválido: " + cpf);
            }
            this.cpf = cpf;
        }

        // Validação da data de nascimento
        if (dataNascimento != null) {
            if (dataNascimento.isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Data de nascimento inválida");
            }
            this.dataNascimento = dataNascimento;
        }

        // Validação do telefone
        if (telefone != null) {
            String apenasDigitos = telefone.replaceAll("\\D", "");
            if (apenasDigitos.length() < 10 || apenasDigitos.length() > 11) {
                throw new IllegalArgumentException("Telefone inválido: " + telefone);
            }
            this.telefone = telefone;
        }

        // Endereço
        if (endereco != null) {
            if (endereco.trim().isEmpty()) {
                throw new IllegalArgumentException("Endereço não pode ser vazio");
            }
            this.endereco = endereco.trim();
        }
    }

}
