package com.commercehub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = "com.commercehub")
@EnableJpaAuditing
@EnableAsync
@ConfigurationPropertiesScan(basePackages = "com.commercehub")
public class CommerceHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(CommerceHubApplication.class, args);
    }
}
