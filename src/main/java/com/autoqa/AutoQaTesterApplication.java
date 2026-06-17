package com.autoqa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AutoQaTesterApplication {
    public static void main(String[] args) {
        SpringApplication.run(AutoQaTesterApplication.class, args);
    }
}