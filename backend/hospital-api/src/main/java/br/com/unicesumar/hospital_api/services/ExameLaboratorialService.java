package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.ExameLaboratorial;
import br.com.unicesumar.hospital_api.repositories.ExameLaboratorialRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ExameLaboratorialService extends AbstractDomainService<ExameLaboratorial, DomainRequestDTOs.ExameLaboratorial, DomainResponseDTOs.ExameLaboratorial> {
    public ExameLaboratorialService(ExameLaboratorialRepository repository, ObjectMapper mapper) {
        super(repository, mapper, ExameLaboratorial.class, DomainResponseDTOs.ExameLaboratorial.class, "exames-laboratoriais");
    }
}
