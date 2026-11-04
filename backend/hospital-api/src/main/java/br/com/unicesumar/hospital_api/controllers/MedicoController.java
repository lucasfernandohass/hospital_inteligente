package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.response.MedicoResumoResponse;
import br.com.unicesumar.hospital_api.repositories.MedicoRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medicos")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','MEDICO','ENFERMEIRA')")
public class MedicoController {
    private final MedicoRepository repository;

    public MedicoController(MedicoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<MedicoResumoResponse> listar() {
        return repository.findAll().stream()
                .map(medico -> new MedicoResumoResponse(medico.getId(), medico.getNome(), medico.getCrm(), medico.getEspecialidade()))
                .toList();
    }
}
