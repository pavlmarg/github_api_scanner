package com.autoqa.config;

import com.autoqa.repository.MonitoredSiteRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class StaleTestingResetter {

    private static final Logger log = LoggerFactory.getLogger(StaleTestingResetter.class);
    private final MonitoredSiteRepository siteRepository;

    public StaleTestingResetter(MonitoredSiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void clearStaleTestingFlags() {
        int cleared = siteRepository.clearAllTestingFlags();
        if (cleared > 0) {
            log.warn("Cleared {} stale 'is_testing' flag(s) left over from a previous crash/restart.", cleared);
        }
    }
}
