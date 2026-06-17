package com.autoqa.controller;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.repository.MonitoredSiteRepository;
import com.autoqa.service.QaExecutionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final QaExecutionService qaExecutionService;
    private final MonitoredSiteRepository siteRepository;

    public TestController(QaExecutionService qaExecutionService, MonitoredSiteRepository siteRepository) {
        this.qaExecutionService = qaExecutionService;
        this.siteRepository = siteRepository;
    }

    @GetMapping("/run")
    public String triggerTest() {
        
        MonitoredSite site = siteRepository.findAll().stream().findFirst().orElse(null);

        if (site == null) {
            // Dummy Site for first simulation
            site = new MonitoredSite();
            site.setName("LiveClock");
            site.setUrl("https://liveclock.net/fullScreen.php");
            site.setScanFrequencyMinutes(60);
            siteRepository.save(site);
        }

        qaExecutionService.runVisualTest(site);
        
        return "Test triggered for " + site.getName() + "! Check your C:/qa_screenshots folder and your pgAdmin database.";
    }
}