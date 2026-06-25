package com.autoqa.service;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.repository.MonitoredSiteRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Service
public class QaSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(QaSchedulerService.class);

    private final MonitoredSiteRepository siteRepository;
    private final QaExecutionService executionService;

    public QaSchedulerService(MonitoredSiteRepository siteRepository, QaExecutionService executionService) {
        this.siteRepository = siteRepository;
        this.executionService = executionService;
    }

    // Run this method exactly every 60,000 milliseconds (1 minute)
    @Scheduled(fixedRate = 60000)
    public void evaluateAndRunDueTests() {
        log.debug("Scheduler waking up: Checking database for due tests...");
        
        // PostgreSQL does 100% of the work
        List<MonitoredSite> dueSites = siteRepository.findSitesDueForScan();

        if (dueSites.isEmpty()) {
            log.debug("No tests due at this time.");
            return;
        }

        // Only process the sites that actually need it
        for (MonitoredSite site : dueSites) {
            log.info("Triggering scheduled test for: " + site.getName());
            executionService.runVisualTest(site);
        }
    }
}