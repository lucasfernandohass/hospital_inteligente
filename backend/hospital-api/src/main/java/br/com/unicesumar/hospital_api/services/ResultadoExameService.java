package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.ResultadoExame;
import br.com.unicesumar.hospital_api.repositories.ResultadoExameRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ResultadoExameService extends AbstractDomainService<ResultadoExame, DomainRequestDTOs.ResultadoExame, DomainResponseDTOs.ResultadoExame> {
    public ResultadoExameService(ResultadoExameRepository repository, ObjectMapper mapper) {
        super(repository, mapper, ResultadoExame.class, DomainResponseDTOs.ResultadoExame.class, "resultados-exame");
    }
}
