package com.autoqa.service;

import com.autoqa.dto.MonitoredSiteDto;
import com.autoqa.entity.MonitoredSite;
import com.autoqa.entity.QaLog;
import com.autoqa.entity.User;
import com.autoqa.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.net.URL;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MonitoredSiteService {

    private final MonitoredSiteRepository siteRepository;
    private final QaLogRepository logRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    public MonitoredSiteService(MonitoredSiteRepository siteRepository, QaLogRepository logRepository, UserRepository userRepository, StorageService storageService) {
        this.siteRepository = siteRepository;
        this.logRepository = logRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Authenticated user not found in database"));
    }

    // The Gatekeeper (IDOR Protection)
    private MonitoredSite getOwnedSiteOrThrow(Long id) {
        MonitoredSite site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        
        User currentUser = getAuthenticatedUser();
        
        // If the user attached to the site does NOT match the logged-in user, throw a 404 fake-out.
        if (!site.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Site not found");
        }
        
        return site;
    }

    public List<MonitoredSite> getAllSites() {
        User currentUser = getAuthenticatedUser();
        return siteRepository.findByUser(currentUser);
    }

    public Optional<MonitoredSite> getSiteById(Long id) {
        try {
            return Optional.of(getOwnedSiteOrThrow(id));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public MonitoredSite addSite(String urlString, Integer intervalMinutes) throws Exception {
        new URL(urlString).toURI();

        String domain = urlString.replaceFirst("^(http[s]?://www\\.|http[s]?://|www\\.)", "").split("[/?#]")[0].split("\\.")[0];
        String name = domain.substring(0, 1).toUpperCase() + domain.substring(1);

        User currentUser = getAuthenticatedUser();

        MonitoredSite site = new MonitoredSite();
        site.setName(name);
        site.setUrl(urlString);
        site.setScanFrequencyMinutes(intervalMinutes != null ? intervalMinutes : 60);
        site.setUser(currentUser);

        try {
            return siteRepository.save(site);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalStateException("You are already monitoring this URL.");
        }
    }

    
    public MonitoredSite updateScanFrequency(Long id, int newFrequency) {
        MonitoredSite site = getOwnedSiteOrThrow(id);
        site.setScanFrequencyMinutes(newFrequency);
        return siteRepository.save(site);
    }

    
    @Transactional
    public void deleteSite(Long id) {
        MonitoredSite site = getOwnedSiteOrThrow(id);
        
        List<QaLog> attachedLogs = logRepository.findByMonitoredSiteOrderByExecutedAtDesc(site);
        
        for (QaLog log : attachedLogs) {
            if (log.getScreenshotPath() != null) {
                storageService.deleteScreenshot(log.getScreenshotPath());
            }
        }
        logRepository.deleteAll(attachedLogs); 
        
        if (site.getbaselineScreenshotPath() != null) {
            storageService.deleteScreenshot(site.getbaselineScreenshotPath());
        }
        
        siteRepository.delete(site); 
    }

    
    public Page<QaLog> getLogsForSite(Long siteId, int page, int size) {
        MonitoredSite site = getOwnedSiteOrThrow(siteId);
        return logRepository.findByMonitoredSiteOrderByExecutedAtDesc(site, PageRequest.of(page, size));
    }

    
    @Transactional
    public MonitoredSite wipeBaseline(Long id) {
        MonitoredSite site = getOwnedSiteOrThrow(id);

        List<QaLog> attachedLogs = logRepository.findByMonitoredSiteOrderByExecutedAtDesc(site);
        
        for (QaLog log : attachedLogs) {
            if (log.getScreenshotPath() != null) {
                storageService.deleteScreenshot(log.getScreenshotPath());
            }
        }
        logRepository.deleteAll(attachedLogs);

        if (site.getbaselineScreenshotPath() != null) {
            storageService.deleteScreenshot(site.getbaselineScreenshotPath());
            site.setbaselineScreenshotPath(null); 
        }
        
        return siteRepository.save(site);
    }

    @Transactional
    public void deleteLog(Long logId) {
        QaLog log = logRepository.findById(logId).orElseThrow(() -> new RuntimeException("Log not found"));

        getOwnedSiteOrThrow(log.getMonitoredSite().getId());

        if (log.getScreenshotPath() != null) {
            storageService.deleteScreenshot(log.getScreenshotPath());
        }

        logRepository.delete(log);
    }

    public QaLog getLogById(Long logId) {
        QaLog log = logRepository.findById(logId).orElseThrow(() -> new RuntimeException("Report not found with ID: " + logId));

        getOwnedSiteOrThrow(log.getMonitoredSite().getId());

        return log;
    }

    // Pauses automated testing for a specific site
    public MonitoredSite pauseSite(Long id) {
        MonitoredSite site = getSiteById(id)
                .orElseThrow(() -> new RuntimeException("Site not found with ID: " + id));
        
        // Ensure your MonitoredSite entity has a boolean field named 'isActive' or 'active'
        site.setIsActive(false); 
        return siteRepository.save(site);
    }

    // Resumes automated testing for a specific site
    public MonitoredSite resumeSite(Long id) {
        MonitoredSite site = getSiteById(id)
                .orElseThrow(() -> new RuntimeException("Site not found with ID: " + id));
        
        site.setIsActive(true);
        return siteRepository.save(site);
    }

    @Transactional
    public MonitoredSite setBaselineFromLog(Long siteId, Long logId) {
        MonitoredSite site = getOwnedSiteOrThrow(siteId);
        QaLog sourceLog = logRepository.findById(logId)
            .orElseThrow(() -> new RuntimeException("Report not found"));

        if (!sourceLog.getMonitoredSite().getId().equals(site.getId())) {
            throw new RuntimeException("Report does not belong to this site");
        }

        String newBaselinePath = sourceLog.getCleanScreenshotPath() != null
            ? sourceLog.getCleanScreenshotPath()
            : sourceLog.getScreenshotPath();

        List<QaLog> attachedLogs = logRepository.findByMonitoredSiteOrderByExecutedAtDesc(site);

        for (QaLog log : attachedLogs) {
            if (log.getScreenshotPath() != null && !log.getScreenshotPath().equals(newBaselinePath)) {
                storageService.deleteScreenshot(log.getScreenshotPath());
            }
            if (log.getCleanScreenshotPath() != null && !log.getCleanScreenshotPath().equals(newBaselinePath)) {
                storageService.deleteScreenshot(log.getCleanScreenshotPath());
            }
        }
        logRepository.deleteAll(attachedLogs);

        if (site.getbaselineScreenshotPath() != null && !site.getbaselineScreenshotPath().equals(newBaselinePath)) {
            storageService.deleteScreenshot(site.getbaselineScreenshotPath());
        }

        site.setbaselineScreenshotPath(newBaselinePath);
        site = siteRepository.save(site);

        QaLog baselineLog = new QaLog();
        baselineLog.setMonitoredSite(site);
        baselineLog.setStatus("BASELINE_CREATED");
        baselineLog.setScreenshotPath(newBaselinePath);
        baselineLog.setCleanScreenshotPath(newBaselinePath);
        baselineLog.setVisualDifferenceScore(0.0);
        baselineLog.setActualLoadTimeMs(sourceLog.getActualLoadTimeMs());
        baselineLog.setExecutedAt(java.time.LocalDateTime.now());
        logRepository.save(baselineLog);

        return site;
    }

    public List<MonitoredSiteDto> getAllSitesWithLastStatus() {
        User currentUser = getAuthenticatedUser();
        List<MonitoredSite> sites = siteRepository.findByUser(currentUser);

        return sites.stream()
            .map(site -> {
                String lastStatus = logRepository.findTopByMonitoredSiteOrderByExecutedAtDesc(site).map(QaLog::getStatus).orElse(null);
                return new MonitoredSiteDto(site, lastStatus);
            })
            .collect(Collectors.toList());
    }
}