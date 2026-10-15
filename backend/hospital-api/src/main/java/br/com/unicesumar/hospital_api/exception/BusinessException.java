package br.com.unicesumar.hospital_api.exception;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) { super(message); }
}
