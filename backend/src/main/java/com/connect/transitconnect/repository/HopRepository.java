package com.connect.transitconnect.repository;

import com.connect.transitconnect.entity.HopEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface HopRepository extends JpaRepository<HopEntity, Long> {

    // THE graph build query — one SQL JOIN loads all data the graph needs.
    // GraphCacheService calls this exactly once per cache miss.
    @Query("SELECT h FROM HopEntity h " +
            "JOIN FETCH h.fromStop " +
            "JOIN FETCH h.toStop")
    List<HopEntity> findAllWithStops();

    // Route detail view — ordered hops for a specific route
    @Query("SELECT h FROM HopEntity h " +
            "JOIN FETCH h.fromStop " +
            "JOIN FETCH h.toStop " +
            "WHERE h.route.id = :routeId " +
            "ORDER BY h.sequenceOrder ASC")
    List<HopEntity> findByRouteIdWithStops(Long routeId);
}