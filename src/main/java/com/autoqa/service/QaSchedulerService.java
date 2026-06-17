package com.autoqa.service;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.entity.QaLog;
import com.autoqa.repository.MonitoredSiteRepository;
import com.autoqa.repository.QaLogRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class QaSchedulerService {

    private final MonitoredSiteRepository siteRepository;
    private final QaLogRepository qaLogRepository;
    private final QaExecutionService executionService;

    public QaSchedulerService(MonitoredSiteRepository siteRepository, QaLogRepository qaLogRepository, QaExecutionService executionService) {
        this.siteRepository = siteRepository;
        this.qaLogRepository = qaLogRepository;
        this.executionService = executionService;
    }

    // Run this method exactly every 60,000 milliseconds 
    @Scheduled(fixedRate = 60000)
    public void evaluateAndRunDueTests() {
        System.out.println("Scheduler waking up: Checking for due tests...");
        
        List<MonitoredSite> allSites = siteRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (MonitoredSite site : allSites) {
            Optional<QaLog> lastLogOpt = qaLogRepository.findTopByMonitoredSiteOrderByExecutedAtDesc(site);

            boolean isDue = false;

            if (lastLogOpt.isEmpty()) {
                isDue = true;
                System.out.println(site.getName() + " is due (First time run).");
            } else {
                QaLog lastLog = lastLogOpt.get();
                LocalDateTime lastRunTime = lastLog.getExecutedAt();
                long minutesSinceLastRun = ChronoUnit.MINUTES.between(lastRunTime, now);

                if (minutesSinceLastRun >= site.getScanFrequencyMinutes()) {
                    isDue = true;
                    System.out.println(site.getName() + " is due. (Last run " + minutesSinceLastRun + " mins ago).");
                }
            }

            if (isDue) {
                executionService.runVisualTest(site);
            }
        }
    }
}