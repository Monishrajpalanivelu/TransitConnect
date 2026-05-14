package com.connect.transitconnect.repository;

import com.connect.transitconnect.entity.RouteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RouteRepository extends JpaRepository<RouteEntity, Long> {

    // Fetches routes + hops + stops in ONE query — eliminates N+1
    // Old: findAll() → N lazy loads per route (2001 queries for 1000 routes)
    // New: 1 JOIN FETCH query regardless of data size
    @Query("SELECT DISTINCT r FROM RouteEntity r " +
            "LEFT JOIN FETCH r.hops h " +
            "LEFT JOIN FETCH h.fromStop " +
            "LEFT JOIN FETCH h.toStop")
    List<RouteEntity> findAllWithHopsAndStops();

    // Lightweight counts for health/metrics endpoints
    @Query("SELECT COUNT(r) FROM RouteEntity r")
    long countRoutes();

    @Query("SELECT COUNT(h) FROM HopEntity h")
    long countHops();
}