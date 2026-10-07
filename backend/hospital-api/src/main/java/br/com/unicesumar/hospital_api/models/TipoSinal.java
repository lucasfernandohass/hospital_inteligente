package br.com.unicesumar.hospital_api.models;

public enum TipoSinal {
    TEMPERATURA("°C"),
    PRESSAO_SISTOLICA("mmHg"),
    PRESSAO_DIASTOLICA("mmHg"),
    FREQUENCIA_CARDIACA("bpm"),
    FREQUENCIA_RESPIRATORIA("irpm"),
    SATURACAO_OXIGENIO("%");

    private final String unidade;
    TipoSinal(String unidade) { this.unidade = unidade; }
    public String getUnidade() { return unidade; }
}