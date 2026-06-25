package com.autoqa.service;

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

    // Only fetch sites belonging to the logged-in user!
    public List<MonitoredSite> getAllSites() {
        User currentUser = getAuthenticatedUser();
        return siteRepository.findByUser(currentUser);
    }

    public Optional<MonitoredSite> getSiteById(Long id) {
        return siteRepository.findById(id);
    }

    // Attach the logged-in user to the new site before saving
    public MonitoredSite addSite(String urlString, Integer intervalMinutes) throws Exception {
        new URL(urlString).toURI();

        String domain = urlString.replaceFirst("^(http[s]?://www\\.|http[s]?://|www\\.)", "").split("[/?#]")[0].split("\\.")[0];
        String name = domain.substring(0, 1).toUpperCase() + domain.substring(1);

        User currentUser = getAuthenticatedUser(); 

        MonitoredSite site = new MonitoredSite();
        site.setName(name);
        site.setUrl(urlString);
        
        site.setScanFrequencyMinutes(intervalMinutes != null ? intervalMinutes : 3600); 
        site.setUser(currentUser); 

        return siteRepository.save(site);
    }

    public MonitoredSite updateScanFrequency(Long id, int newFrequency) {
        return siteRepository.findById(id).map(site -> {
            site.setScanFrequencyMinutes(newFrequency);
            return siteRepository.save(site);
        }).orElseThrow(() -> new RuntimeException("Site not found"));
    }

    @Transactional
    public void deleteSite(Long id) {
        MonitoredSite site = siteRepository.findById(id).orElseThrow(() -> new RuntimeException("Site not found"));
        
        List<QaLog> attachedLogs = logRepository.findByMonitoredSiteOrderByExecutedAtDesc(site);
        
        // Delete physical log diff images from the cloud
        for (QaLog log : attachedLogs) {
            storageService.deleteScreenshot(log.getScreenshotPath());
        }
        logRepository.deleteAll(attachedLogs); 
        
        // Delete physical baseline image from the cloud
        storageService.deleteScreenshot(site.getbaselineScreenshotPath());
        
        siteRepository.delete(site); 
    }

    public Page<QaLog> getLogsForSite(Long siteId, int page, int size) {
        MonitoredSite site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        
        return logRepository.findByMonitoredSiteOrderByExecutedAtDesc(site, PageRequest.of(page, size));
    }

    @Transactional
    public MonitoredSite wipeBaseline(Long id) {
        MonitoredSite site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found"));

        List<QaLog> attachedLogs = logRepository.findByMonitoredSiteOrderByExecutedAtDesc(site);
        
        // Delete physical log diff images from the cloud
        for (QaLog log : attachedLogs) {
            storageService.deleteScreenshot(log.getScreenshotPath());
        }
        logRepository.deleteAll(attachedLogs);

        // Delete physical baseline image from the cloud
        storageService.deleteScreenshot(site.getbaselineScreenshotPath());
        site.setbaselineScreenshotPath(null); 
        
        return siteRepository.save(site);
    }
}