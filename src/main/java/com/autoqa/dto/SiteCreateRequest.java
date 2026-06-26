package com.autoqa.dto;

public class SiteCreateRequest {
    private String url;
    private Integer scanFrequencyMinutes;

    // Getters and Setters
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public Integer getScanFrequencyMinutes() { return scanFrequencyMinutes; }
    public void setScanFrequencyMinutes(Integer scanFrequencyMinutes) { this.scanFrequencyMinutes = scanFrequencyMinutes; }
}