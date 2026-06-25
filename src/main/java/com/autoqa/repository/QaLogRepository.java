package com.autoqa.repository;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.entity.QaLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; 

@Repository
public interface QaLogRepository extends JpaRepository<QaLog, Long> {
    
    Page<QaLog> findByMonitoredSiteOrderByExecutedAtDesc(MonitoredSite site, Pageable pageable);

    List<QaLog> findByMonitoredSiteOrderByExecutedAtDesc(MonitoredSite site);

    Optional<QaLog> findTopByMonitoredSiteOrderByExecutedAtDesc(MonitoredSite site);
}