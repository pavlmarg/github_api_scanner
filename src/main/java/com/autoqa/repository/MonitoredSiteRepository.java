package com.autoqa.repository;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Make sure to import this
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonitoredSiteRepository extends JpaRepository<MonitoredSite, Long> {
    
    List<MonitoredSite> findByUser(User user);


    // Query finds sites with NO logs, OR sites where the time since the last log is greater than the frequency limit.
    @Query(value = 
        "SELECT ms.* FROM monitored_sites ms " +
        "LEFT JOIN (" +
        "  SELECT site_id, MAX(executed_at) as last_run " +
        "  FROM qa_logs " +
        "  GROUP BY site_id" +
        ") latest ON ms.id = latest.site_id " +
        "WHERE ms.is_testing = false " + 
        "AND (latest.last_run IS NULL " + 
        "OR latest.last_run <= (NOW() - (ms.scan_frequency_minutes * INTERVAL '1 minute')))",
        nativeQuery = true)
    List<MonitoredSite> findSitesDueForScan();
}