package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.ECG;
import br.com.unicesumar.hospital_api.repositories.ECGRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ECGService extends AbstractDomainService<ECG, DomainRequestDTOs.ECG, DomainResponseDTOs.ECG> {
    public ECGService(ECGRepository repository, ObjectMapper mapper) {
        super(repository, mapper, ECG.class, DomainResponseDTOs.ECG.class, "ecgs");
    }
}
