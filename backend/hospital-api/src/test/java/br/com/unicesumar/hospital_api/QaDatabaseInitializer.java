package br.com.unicesumar.hospital_api;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;

public final class QaDatabaseInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        String port = System.getenv("HOSPITAL_QA_PORT");
        String run = System.getenv("HOSPITAL_QA_RUN");
        String password = System.getenv("HOSPITAL_QA_PASSWORD");
        String jwt = System.getenv("HOSPITAL_QA_JWT");
        String monitorKey = System.getenv("HOSPITAL_QA_MONITOR_KEY");
        if (port == null || !port.matches("[1-9][0-9]{3,4}") || Integer.parseInt(port) > 65535
                || run == null || !run.matches("[0-9a-f]{32}") || password == null || password.isBlank()
                || jwt == null || jwt.isBlank() || monitorKey == null || monitorKey.isBlank()) {
            throw new IllegalStateException("Execute os testes Spring pelo script de QA com PostgreSQL descartável.");
        }

        String url = "jdbc:postgresql://127.0.0.1:" + port + "/postgres?connectTimeout=5";
        try (var connection = DriverManager.getConnection(url, "hospital_qa", password);
                var statement = connection.createStatement();
                var result = statement.executeQuery("select current_setting('hospital.qa_run', true)")) {
            if (!result.next() || !run.equals(result.getString(1))) {
                throw new IllegalStateException("O PostgreSQL não pertence a esta execução de QA.");
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Não foi possível validar o PostgreSQL descartável (SQLState "
                    + e.getSQLState() + ").");
        }

        String schema = context.getEnvironment().getProperty("hospital.qa.schema", "public");
        if (!schema.matches("[a-z][a-z0-9_]*")) {
            throw new IllegalStateException("Nome de schema inválido para QA.");
        }
        String schemaUrl = url + "&currentSchema=" + schema;
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("isolatedQa", Map.of(
                "spring.datasource.url", schemaUrl,
                "spring.datasource.username", "hospital_qa",
                "spring.datasource.password", password,
                "spring.flyway.url", schemaUrl,
                "spring.flyway.user", "hospital_qa",
                "spring.flyway.password", password,
                "spring.flyway.default-schema", schema,
                "app.jwt.secret", jwt,
                "app.monitor.api-key", monitorKey)));
    }
}
