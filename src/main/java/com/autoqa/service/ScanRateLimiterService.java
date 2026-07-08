package com.autoqa.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ScanRateLimiterService {

    private final ConcurrentHashMap<String, Bucket> userBuckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        // 4 manual scan triggers per minute per user, across all their sites
        Bandwidth limit = Bandwidth.builder().capacity(4).refillGreedy(4, Duration.ofMinutes(1)).build();
        return Bucket.builder().addLimit(limit).build();
    }

    public boolean tryConsume(String userEmail) {
        Bucket bucket = userBuckets.computeIfAbsent(userEmail, k -> newBucket());
        return bucket.tryConsume(1);
    }
}