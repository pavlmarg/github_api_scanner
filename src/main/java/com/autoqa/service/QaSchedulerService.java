package com.autoqa.service;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.repository.MonitoredSiteRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
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

    // initialDelay avoids firing the instant the context finishes starting
    @Scheduled(fixedRate = 60000, initialDelay = 30000)
    public void evaluateAndRunDueTests() {
        log.debug("Scheduler waking up: Checking database for due tests...");

        List<MonitoredSite> dueSites = siteRepository.findSitesDueForScan();

        if (dueSites.isEmpty()) {
            log.debug("No tests due at this time.");
            return;
        }

        for (MonitoredSite site : dueSites) {
            try {
                site.setIsTesting(true);
                site = siteRepository.saveAndFlush(site);
            } catch (ObjectOptimisticLockingFailureException e) {
                log.warn("Site {} already claimed (manual run or duplicate scheduler tick) — skipping.", site.getName());
                continue;
            }

            log.info("Triggering scheduled test for: {}", site.getName());
            executionService.runVisualTest(site);
        }
    }
}