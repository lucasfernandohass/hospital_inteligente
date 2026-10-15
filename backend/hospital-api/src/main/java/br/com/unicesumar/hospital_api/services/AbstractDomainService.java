package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public abstract class AbstractDomainService<E, Q, S> {
    protected final JpaRepository<E, Long> repository;
    protected final ObjectMapper mapper;
    private final Class<E> entityType;
    private final Class<S> responseType;
    private final String resourceName;

    protected AbstractDomainService(JpaRepository<E, Long> repository, ObjectMapper mapper, Class<E> entityType, Class<S> responseType, String resourceName) {
        this.repository = repository; this.mapper = mapper.copy().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.entityType = entityType; this.responseType = responseType; this.resourceName = resourceName;
    }
    protected E toEntity(Q request) { return mapper.convertValue(request, entityType); }

    protected S toResponse(E entity) { return mapper.convertValue(entity, responseType); }

    @Transactional(readOnly = true) public List<S> listar() { return repository.findAll().stream().map(this::toResponse).toList(); }
    
    @Transactional(readOnly = true) public S buscar(Long id) { return toResponse(obter(id)); }
    
    @Transactional public S criar(Q request) { E entity = toEntity(request); definirId(entity, null); return toResponse(repository.save(entity)); }
    
    @Transactional public S atualizar(Long id, Q request) { obter(id); E entity = toEntity(request); definirId(entity, id); return toResponse(repository.save(entity)); }
    
    @Transactional public void excluir(Long id) { repository.delete(obter(id)); }
    
    protected E obter(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException(resourceName, id)); }
   
    public String getResourceKey() { return resourceName; }
    
    private void definirId(E entity, Long id) {
        try { entityType.getMethod("setId", Long.class).invoke(entity, id); }
        catch (ReflectiveOperationException e) { throw new IllegalStateException("A entidade não expõe um identificador Long", e); }
    }
}
