package com.autoqa.dto;

import com.autoqa.entity.QaLog;
import java.time.LocalDateTime;

public class QaLogDto {
    private Long id;
    private String status;
    private Integer actualLoadTimeMs;
    private Double visualDifferenceScore;
    private String screenshotPath;
    private LocalDateTime executedAt;

    public QaLogDto(QaLog log) {
        this.id = log.getId();
        this.status = log.getStatus();
        this.actualLoadTimeMs = log.getActualLoadTimeMs();
        this.visualDifferenceScore = log.getVisualDifferenceScore();
        this.screenshotPath = log.getScreenshotPath();
        this.executedAt = log.getExecutedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public void setVisualDifferenceScore(Double visualDifferenceScore) {
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