package br.com.unicesumar.hospital_api.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    ProblemDetail naoEncontrado(ResourceNotFoundException e) { return detalhe(HttpStatus.NOT_FOUND, e.getMessage()); }
    
    @ExceptionHandler(DuplicateResourceException.class)
    ProblemDetail duplicado(DuplicateResourceException e) { return detalhe(HttpStatus.CONFLICT, e.getMessage()); }
    
    @ExceptionHandler(BusinessException.class)
    ProblemDetail regraNegocio(BusinessException e) { return detalhe(HttpStatus.UNPROCESSABLE_CONTENT, e.getMessage()); }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validacao(MethodArgumentNotValidException e) {
        String errors = e.getBindingResult().getFieldErrors().stream().map(err -> err.getField() + ": " + err.getDefaultMessage()).collect(Collectors.joining("; "));
        return detalhe(HttpStatus.BAD_REQUEST, errors);
    }
    
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ProblemDetail requisicaoInvalida(Exception e) { return detalhe(HttpStatus.BAD_REQUEST, "A requisição contém dados inválidos"); }
    
    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail naoAutenticado(AuthenticationException e) { return detalhe(HttpStatus.UNAUTHORIZED, "Credenciais inválidas ou ausentes"); }
    
    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail acessoNegado(AccessDeniedException e) { return detalhe(HttpStatus.FORBIDDEN, "Você não tem permissão para esta operação"); }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail integridade(DataIntegrityViolationException e) { return detalhe(HttpStatus.CONFLICT, "A operação viola uma regra de integridade dos dados"); }
    
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail argumentoInvalido(IllegalArgumentException e) { return detalhe(HttpStatus.BAD_REQUEST, e.getMessage()); }
    
    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail estadoInvalido(IllegalStateException e) { return detalhe(HttpStatus.CONFLICT, e.getMessage()); }
    
    @ExceptionHandler(Exception.class)
    ProblemDetail inesperado(Exception e) { return detalhe(HttpStatus.INTERNAL_SERVER_ERROR, "Ocorreu um erro inesperado"); }
    private ProblemDetail detalhe(HttpStatus status, String mensagem) { return ProblemDetail.forStatusAndDetail(status, mensagem); }
}
