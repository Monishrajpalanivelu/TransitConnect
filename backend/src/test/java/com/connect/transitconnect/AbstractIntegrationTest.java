package com.connect.transitconnect;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    public static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.32")
            .withDatabaseName("transitconnect_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        // Important: Tell Hibernate to auto-create schema for the test DB
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
        // Disable Redis for simple DB integration tests to avoid requiring Redis Testcontainer
        registry.add("spring.cache.type", () -> "none");
    }
}
