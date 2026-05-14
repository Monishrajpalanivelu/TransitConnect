package com.connect.transitconnect.service;

import com.connect.transitconnect.entity.HopEntity;
import com.connect.transitconnect.entity.StopEntity;
import com.connect.transitconnect.repository.HopRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.Function;

@Service
public class GraphCacheService {

    private static final Logger log =
            LoggerFactory.getLogger(GraphCacheService.class);

    // ---- Inner Edge type (package-visible for RouteService) -----------------
    static class Edge {
        final String to;
        final int cost, duration;
        final String mode;
        Edge(String to, int cost, int duration, String mode) {
            this.to = to; this.cost = cost;
            this.duration = duration; this.mode = mode;
        }
    }

    // ---- Immutable snapshot built once per cache miss -----------------------
    private record GraphSnapshot(
            Map<String, List<Edge>> adjacency,
            Map<String, List<Edge>> edgeMultiMap,
            Map<String, StopEntity>  locToEntity,
            int hopCount, Instant builtAt
    ) {}

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private volatile GraphSnapshot snapshot = null;
    private final HopRepository hopRepository;

    public GraphCacheService(HopRepository hopRepository) {
        this.hopRepository = hopRepository;
    }

    // ---- Public API ---------------------------------------------------------

    public void invalidate() {
        lock.writeLock().lock();
        try { snapshot = null; log.info("Graph cache invalidated"); }
        finally { lock.writeLock().unlock(); }
    }

    public Map<String, List<Edge>> getAdjacency()    { return getSnapshot().adjacency(); }
    public Map<String, List<Edge>> getEdgeMultiMap() { return getSnapshot().edgeMultiMap(); }
    public Map<String, StopEntity>  getLocToEntity()  { return getSnapshot().locToEntity(); }

    // ---- Read-Write Lock pattern --------------------------------------------

    private GraphSnapshot getSnapshot() {
        // Fast path — concurrent reads run in parallel, zero blocking
        lock.readLock().lock();
        try { if (snapshot != null) return snapshot; }
        finally { lock.readLock().unlock(); }

        // Slow path — exclusive write lock for rebuild
        lock.writeLock().lock();
        try {
            // Double-check: another thread may have built it while we waited
            if (snapshot != null) return snapshot;
            snapshot = buildGraph();
            return snapshot;
        } finally { lock.writeLock().unlock(); }
    }

    private GraphSnapshot buildGraph() {
        Instant start = Instant.now();

        // ONE query — loads all hops with fromStop + toStop via JOIN FETCH
        // Previously: findAll() on routes + N lazy loads = 2001 queries per 1000 routes
        // Now: exactly 1 query regardless of data size
        List<HopEntity> allHops = hopRepository.findAllWithStops();

        Map<String, List<Edge>> adjacency   = new HashMap<>();
        Map<String, List<Edge>> multiMap    = new HashMap<>();
        Map<String, StopEntity>  locToEntity = new HashMap<>();

        for (HopEntity hop : allHops) {
            StopEntity from = hop.getFromStop();
            StopEntity to   = hop.getToStop();
            if (from == null || to == null) continue;

            String u = from.getLocation().toLowerCase().trim();
            String v = to.getLocation().toLowerCase().trim();

            locToEntity.putIfAbsent(u, from);
            locToEntity.putIfAbsent(v, to);
            adjacency.putIfAbsent(u, new ArrayList<>());
            adjacency.putIfAbsent(v, new ArrayList<>());

            Edge fwd = new Edge(v, hop.getCost(), hop.getDuration(), hop.getMode());
            Edge bwd = new Edge(u, hop.getCost(), hop.getDuration(), hop.getMode());

            adjacency.get(u).add(fwd);
            adjacency.get(v).add(bwd);

            // Pre-build edgeMultiMap — eliminates per-search rebuild (was old bug)
            multiMap.computeIfAbsent(u + "->" + v, k -> new ArrayList<>()).add(fwd);
            multiMap.computeIfAbsent(v + "->" + u, k -> new ArrayList<>()).add(bwd);
        }

        long ms = Instant.now().toEpochMilli() - start.toEpochMilli();
        // RESUME METRIC — log this number
        log.info("Graph built: {} nodes, {} hops, {}ms",
                adjacency.size(), allHops.size(), ms);

        return new GraphSnapshot(
                Collections.unmodifiableMap(adjacency),
                Collections.unmodifiableMap(multiMap),
                Collections.unmodifiableMap(locToEntity),
                allHops.size(), start
        );
    }
}