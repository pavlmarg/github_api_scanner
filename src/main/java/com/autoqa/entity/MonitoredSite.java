package com.autoqa.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "monitored_sites")
public class MonitoredSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long site_id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String url;

    @Column(name = "scan_frequency_minutes", nullable = false)
    private Integer scanFrequencyMinutes; 

    @Column(name = "expected_load_time_ms")
    private Integer expectedLoadTimeMs;

    @Column(name = "baseline_screenshot_path")
    private String baselineScreenshotPath;

    public MonitoredSite() {
    }

    // GETTERS AND SETTERS
    
    public Long getId() {
        return site_id;
    }

    public void setId(Long site_id) {
        this.site_id = site_id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Integer getScanFrequencyMinutes() {
        return scanFrequencyMinutes;
    }

    public void setScanFrequencyMinutes(Integer scanFrequencyMinutes) {
        this.scanFrequencyMinutes = scanFrequencyMinutes;
    }

    public Integer getExpectedLoadTimeMs() {
        return expectedLoadTimeMs;
    }

    public void setExpectedLoadTimeMs(Integer expectedLoadTimeMs) {
        this.expectedLoadTimeMs = expectedLoadTimeMs;
    }

    public String getbaselineScreenshotPath() {
        return baselineScreenshotPath;
    }
    
    public void setbaselineScreenshotPath(String baselineScreenshotPath) {
        this.baselineScreenshotPath = baselineScreenshotPath;
    }
}