package com.autoqa.controller;

import com.autoqa.dto.MonitoredSiteDto;
import com.autoqa.dto.QaLogDto;
import com.autoqa.dto.SiteCreateRequest;
import com.autoqa.dto.SiteUpdateRequest;
import com.autoqa.entity.MonitoredSite;
import com.autoqa.service.MonitoredSiteService;
import com.autoqa.service.QaExecutionService;
import com.autoqa.service.ScanRateLimiterService;
import com.autoqa.repository.MonitoredSiteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final MonitoredSiteService siteService;
    private final QaExecutionService qaExecutionService;
    private final MonitoredSiteRepository siteRepository;
    private final ScanRateLimiterService scanRateLimiterService;

    public TestController(MonitoredSiteService siteService, QaExecutionService qaExecutionService, MonitoredSiteRepository siteRepository, ScanRateLimiterService scanRateLimiterService) {
        this.siteService = siteService;
        this.qaExecutionService = qaExecutionService;
        this.siteRepository = siteRepository;
        this.scanRateLimiterService = scanRateLimiterService;
    }

    @GetMapping("/sites")
    public List<MonitoredSiteDto> getAllSites() {
        return siteService.getAllSitesWithLastStatus();
    }

    @GetMapping("/sites/{id}")
    public ResponseEntity<MonitoredSiteDto> getSiteById(@PathVariable Long id) {
        return siteService.getSiteById(id)
                .map(site -> ResponseEntity.ok(new MonitoredSiteDto(site)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/sites")
    public ResponseEntity<?> addNewSite(@RequestBody SiteCreateRequest request) {
        try {
            MonitoredSite savedSite = siteService.addSite(request.getUrl(), request.getScanFrequencyMinutes());
            return ResponseEntity.ok(new MonitoredSiteDto(savedSite));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid URL format."));
        }
    }

    // Standard Manual Test
    @PostMapping("/sites/{id}/run")
    public ResponseEntity<?> runTestForSite(@PathVariable Long id) {
        String userEmail = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication().getName();

        if (!scanRateLimiterService.tryConsume(userEmail)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("message", "You're triggering scans too quickly. Please wait a moment."));
        }

        MonitoredSite site = siteService.getSiteById(id).orElse(null);
    
        if (site == null) {
            return ResponseEntity.notFound().build();
        }

        if (Boolean.TRUE.equals(site.getIsTesting())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("A test is currently running for this site. Please wait.");
        }

        try {
            site.setIsTesting(true);
            siteRepository.save(site); 
        } catch (ObjectOptimisticLockingFailureException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("A scheduled test just started for this site. Please wait.");
        }

        qaExecutionService.runVisualTest(site);
    
        return ResponseEntity.ok(new MonitoredSiteDto(site));
    }

    // Reset Baseline 
    @PostMapping("/sites/{id}/reset")
    public ResponseEntity<?> resetBaselineAndRun(@PathVariable Long id) {
        try {
            MonitoredSite site = siteService.getSiteById(id)
                    .orElseThrow(() -> new RuntimeException("Site not found"));

            if (Boolean.TRUE.equals(site.getIsTesting())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("A test is currently running for this site. Please wait.");
            }

            try {
                site.setIsTesting(true);
                site = siteRepository.save(site); 
            } catch (ObjectOptimisticLockingFailureException e) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("A scheduled test just started for this site. Please wait.");
            }

            MonitoredSite wipedSite = siteService.wipeBaseline(site.getId());
            
            qaExecutionService.runVisualTest(wipedSite);
            
            return ResponseEntity.ok(new MonitoredSiteDto(wipedSite));
            
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/sites/{id}")
    public ResponseEntity<?> updateSiteFrequency(@PathVariable Long id, @RequestBody SiteUpdateRequest request) {
        try {
            MonitoredSite updatedSite = siteService.updateScanFrequency(id, request.getScanFrequencyMinutes());
            return ResponseEntity.ok(new MonitoredSiteDto(updatedSite));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/sites/{id}")
    public ResponseEntity<?> deleteSite(@PathVariable Long id) {
        try {
            siteService.deleteSite(id); 
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/sites/{id}/logs")
    public ResponseEntity<?> getSiteLogs(
        @PathVariable Long id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        try {
            Page<QaLogDto> dtoPage = siteService.getLogsForSite(id, page, size).map(QaLogDto::new);
            return ResponseEntity.ok(dtoPage);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/sites/{id}/pause")
    public ResponseEntity<?> pauseTesting(@PathVariable Long id) {
        try {
            MonitoredSite updatedSite = siteService.pauseSite(id);
            return ResponseEntity.ok(new MonitoredSiteDto(updatedSite));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/sites/{id}/resume")
    public ResponseEntity<?> resumeTesting(@PathVariable Long id) {
        try {
            MonitoredSite updatedSite = siteService.resumeSite(id);
            return ResponseEntity.ok(new MonitoredSiteDto(updatedSite));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/sites/{siteId}/logs/{logId}")
    public ResponseEntity<?> deleteLog(@PathVariable Long siteId, @PathVariable Long logId) {
        try {
            // Assuming your siteService has logic to delete a specific QaLog
            siteService.deleteLog(logId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete report: " + e.getMessage());
        }
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<?> getLogById(@PathVariable Long id) {
        try {
            com.autoqa.entity.QaLog log = siteService.getLogById(id); 
            return ResponseEntity.ok(new QaLogDto(log));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/sites/{siteId}/logs/{logId}/set-baseline")
    public ResponseEntity<?> setBaselineFromLog(@PathVariable Long siteId, @PathVariable Long logId) {
        try {
            MonitoredSite updatedSite = siteService.setBaselineFromLog(siteId, logId);
            return ResponseEntity.ok(new MonitoredSiteDto(updatedSite));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}