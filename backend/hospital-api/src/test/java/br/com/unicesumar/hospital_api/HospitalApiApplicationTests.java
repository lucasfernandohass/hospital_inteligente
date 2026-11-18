package br.com.unicesumar.hospital_api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;

@SpringBootTest
@ContextConfiguration(initializers = QaDatabaseInitializer.class)
class HospitalApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
