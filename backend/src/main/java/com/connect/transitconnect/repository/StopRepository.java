package com.connect.transitconnect.repository;

import com.connect.transitconnect.entity.StopEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StopRepository extends JpaRepository<StopEntity, Long> {

    // Exact match by canonical name — used in saveRoute to deduplicate
    Optional<StopEntity> findByCanonicalName(String canonicalName);

    // Legacy exact match by location (kept for safety)
    Optional<StopEntity> findByLocationIgnoreCase(String location);

    // Paginated prefix search by canonical name — used by frontend autocomplete
    // e.g. GET /stops?q=ben&limit=10 → SELECT ... WHERE canonical_name LIKE 'ben%'
    @Query("SELECT s FROM StopEntity s WHERE s.canonicalName LIKE LOWER(CONCAT(:prefix, '%')) ORDER BY s.location")
    Page<StopEntity> searchByPrefix(@Param("prefix") String prefix, Pageable pageable);

    // All distinct stop names that are currently used in at least one route
    @Query("SELECT DISTINCT LOWER(s.location) FROM RouteEntity r JOIN r.stops s ORDER BY LOWER(s.location)")
    List<String> findAllDistinctLocations();

    // All stops that are actually referenced by hops (graph nodes only)
    @Query("SELECT s FROM StopEntity s WHERE s.id IN " +
            "(SELECT h.fromStop.id FROM HopEntity h) OR s.id IN " +
            "(SELECT h.toStop.id FROM HopEntity h)")
    List<StopEntity> findAllReferencedByHops();
}