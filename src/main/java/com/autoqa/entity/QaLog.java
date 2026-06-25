package com.autoqa.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "qa_logs", indexes = {
    @Index(name = "idx_qa_log_site_date", columnList = "monitored_site_id, executed_at DESC")
})
public class QaLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    @JsonIgnore
    private MonitoredSite monitoredSite;

    @Column(nullable = false)
    private String status; 

    @Column(name = "actual_load_time_ms")
    private Integer actualLoadTimeMs;

    @Column(name = "visual_difference_score")
    private Double visualDifferenceScore; 

    @Column(name = "screenshot_path")
    private String screenshotPath;

    @Column(name = "executed_at", nullable = false, updatable = false)
    private LocalDateTime executedAt = LocalDateTime.now();

    public QaLog() {
    }

    // GETTERS AND SETTERS

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MonitoredSite getMonitoredSite() {
        return monitoredSite;
    }

    public void setMonitoredSite(MonitoredSite monitoredSite) {
        this.monitoredSite = monitoredSite;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getActualLoadTimeMs() {
        return actualLoadTimeMs;
    }

    public void setActualLoadTimeMs(Integer actualLoadTimeMs) {
        this.actualLoadTimeMs = actualLoadTimeMs;
    }

    public Double getVisualDifferenceScore() {
        return visualDifferenceScore;
    }

    public void setVisualDifferenceScore(double visualDifferenceScore) {
        this.visualDifferenceScore = visualDifferenceScore;
    }

    public String getScreenshotPath() {
        return screenshotPath;
    }

    public void setScreenshotPath(String screenshotPath) {
        this.screenshotPath = screenshotPath;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }
}