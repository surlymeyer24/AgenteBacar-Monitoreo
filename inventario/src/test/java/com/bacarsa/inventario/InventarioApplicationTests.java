package com.bacarsa.inventario;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.stock.codigo-interno.backfill=false")
class InventarioApplicationTests {

	@Test
	void contextLoads() {
	}

}
