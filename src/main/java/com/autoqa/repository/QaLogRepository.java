package com.autoqa.repository;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.entity.QaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QaLogRepository extends JpaRepository<QaLog, Long> {
    Optional<QaLog> findTopByMonitoredSiteOrderByExecutedAtDesc(MonitoredSite site);
}