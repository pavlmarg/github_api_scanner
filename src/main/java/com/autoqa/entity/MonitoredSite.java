package com.autoqa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(name = "monitored_sites", indexes = {
    @Index(name = "idx_site_user", columnList = "user_id")
})
public class MonitoredSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "is_testing", nullable = false)
    private Boolean isTesting = false;

    public MonitoredSite() {
    }

    // GETTERS AND SETTERS
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public User getUser() { 
        return user; 
    }

    public void setUser(User user) {
        this.user = user; 
    }

    public Boolean getIsTesting() {
        return isTesting;
    }

    public void setIsTesting(Boolean isTesting) {
        this.isTesting = isTesting;
    }
}