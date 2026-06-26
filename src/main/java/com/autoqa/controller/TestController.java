package com.autoqa.controller;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.service.MonitoredSiteService;
import com.autoqa.service.QaExecutionService;
import com.autoqa.repository.MonitoredSiteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final MonitoredSiteService siteService;
    private final QaExecutionService qaExecutionService;
    private final MonitoredSiteRepository siteRepository;

    public TestController(MonitoredSiteService siteService, QaExecutionService qaExecutionService, MonitoredSiteRepository siteRepository) {
        this.siteService = siteService;
        this.qaExecutionService = qaExecutionService;
        this.siteRepository = siteRepository;
    }

    @GetMapping("/sites")
    public List<MonitoredSite> getAllSites() {
        return siteService.getAllSites(); 
    }

    @PostMapping("/sites")
    public ResponseEntity<?> addNewSite(@RequestBody Map<String, Object> payload) {
        try {
            String url = (String) payload.get("url");
            Integer interval = null;
            
            if (payload.containsKey("scanFrequencyMinutes")) {
                interval = Integer.valueOf(payload.get("scanFrequencyMinutes").toString());
            }

            MonitoredSite savedSite = siteService.addSite(url, interval);
            return ResponseEntity.ok(savedSite);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid URL format.");
        }
    }

    // Standard Manual Test
    @PostMapping("/sites/{id}/run")
    public ResponseEntity<?> runTestForSite(@PathVariable Long id) {
        MonitoredSite site = siteService.getSiteById(id).orElse(null);
        
        if (site == null) {
            return ResponseEntity.notFound().build();
        }

        if (Boolean.TRUE.equals(site.getIsTesting())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A test is currently running for this site. Please wait.");
        }

        site.setIsTesting(true);
        siteRepository.save(site);

        qaExecutionService.runVisualTest(site);
        
        return ResponseEntity.ok(site);
    }

    // Reset Baseline 
    @PostMapping("/sites/{id}/reset")
    public ResponseEntity<?> resetBaselineAndRun(@PathVariable Long id) {
        try {
            MonitoredSite site = siteService.getSiteById(id)
                    .orElseThrow(() -> new RuntimeException("Site not found"));

            // Check the Lock BEFORE wiping data!
            if (Boolean.TRUE.equals(site.getIsTesting())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("A test is currently running for this site. Please wait.");
            }

            MonitoredSite wipedSite = siteService.wipeBaseline(id);
            

            wipedSite.setIsTesting(true);
            siteRepository.save(wipedSite);
            
            qaExecutionService.runVisualTest(wipedSite);
            
            return ResponseEntity.ok(wipedSite);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/sites/{id}")
    public ResponseEntity<?> updateSiteFrequency(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        try {
            MonitoredSite updatedSite = siteService.updateScanFrequency(id, payload.get("scanFrequencyMinutes"));
            return ResponseEntity.ok(updatedSite);
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
            return ResponseEntity.ok(siteService.getLogsForSite(id, page, size));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}