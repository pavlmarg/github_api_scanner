package com.autoqa.dto;

import com.autoqa.entity.MonitoredSite;

public class MonitoredSiteDto {
    private Long id;
    private String name;
    private String url;
    private Integer scanFrequencyMinutes;
    private String baselineScreenshotPath;
    private Boolean isTesting;

    public MonitoredSiteDto(MonitoredSite site) {
        this.id = site.getId();
        this.name = site.getName();
        this.url = site.getUrl();
        this.scanFrequencyMinutes = site.getScanFrequencyMinutes();
        this.baselineScreenshotPath = site.getbaselineScreenshotPath();
        this.isTesting = site.getIsTesting();
    }

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

    public String getBaselineScreenshotPath() {
        return baselineScreenshotPath;
    }

    public void setBaselineScreenshotPath(String baselineScreenshotPath) {
        this.baselineScreenshotPath = baselineScreenshotPath;
    }

    public Boolean getTesting() {
        return isTesting;
    }

    public void setTesting(Boolean testing) {
        isTesting = testing;
    }
}