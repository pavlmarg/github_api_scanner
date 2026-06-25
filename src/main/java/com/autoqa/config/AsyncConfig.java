package com.autoqa.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "qaTaskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // Core workers ready at all times
        executor.setCorePoolSize(2); 
        // Maximum concurrent workers
        executor.setMaxPoolSize(4);  
        // If all 4 workers are busy, put the next 50 tasks in a waiting line
        executor.setQueueCapacity(50); 
        // Name them so our console logs are easy to read
        executor.setThreadNamePrefix("QaWorker-"); 
        executor.initialize();
        return executor;
    }
}