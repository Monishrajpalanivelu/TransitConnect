package com.connect.transitconnect.repository;

import com.connect.transitconnect.entity.StopEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StopRepository extends JpaRepository<StopEntity, Long> {

    // Exact match — used in saveRoute to find existing stop before creating new
    Optional<StopEntity> findByLocationIgnoreCase(String location);

    // All distinct stop names that are currently used in at least one route
    @Query("SELECT DISTINCT LOWER(s.location) FROM RouteEntity r JOIN r.stops s ORDER BY LOWER(s.location)")
    List<String> findAllDistinctLocations();

    // Prefix search for frontend autocomplete dropdown
    @Query("SELECT s FROM StopEntity s WHERE LOWER(s.location) " +
            "LIKE LOWER(CONCAT(:prefix, '%')) ORDER BY s.location")
    List<StopEntity> findByLocationStartingWith(@Param("prefix") String prefix);

    // All stops that are actually referenced by hops (graph nodes only)
    @Query("SELECT s FROM StopEntity s WHERE s.id IN " +
            "(SELECT h.fromStop.id FROM HopEntity h) OR s.id IN " +
            "(SELECT h.toStop.id FROM HopEntity h)")
    List<StopEntity> findAllReferencedByHops();
}