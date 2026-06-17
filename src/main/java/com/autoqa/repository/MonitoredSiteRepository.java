package com.autoqa.repository;

import com.autoqa.entity.MonitoredSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonitoredSiteRepository extends JpaRepository<MonitoredSite, Long> {
}