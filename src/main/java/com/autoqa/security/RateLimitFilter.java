package com.autoqa.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    private Bucket newAuthBucket() {
        // 10 requests per minute per IP
        Bandwidth limit = Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build();
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean isAuthEndpoint = path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/register")
                || path.startsWith("/api/auth/forgot-password");

        if (isAuthEndpoint) {
            String ip = request.getRemoteAddr();
            Bucket bucket = authBuckets.computeIfAbsent(ip, k -> newAuthBucket());

            if (!bucket.tryConsume(1)) {
                response.setStatus(429); // Too Many Requests
                response.getWriter().write("Too many attempts. Please wait a minute and try again.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}