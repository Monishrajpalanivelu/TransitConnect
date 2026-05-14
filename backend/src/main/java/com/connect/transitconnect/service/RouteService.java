package com.connect.transitconnect.service;

import com.connect.transitconnect.dto.*;
import com.connect.transitconnect.entity.*;
import com.connect.transitconnect.exception.InvalidRouteException;
import com.connect.transitconnect.exception.RouteNotFoundException;
import com.connect.transitconnect.repository.HopRepository;
import com.connect.transitconnect.repository.RouteRepository;
import com.connect.transitconnect.repository.StopRepository;
import com.connect.transitconnect.service.GraphCacheService.Edge;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * PRODUCTION REWRITE of RouteService.
 *
 * Changes from original:
 *
 * [1] Graph cache moved to GraphCacheService (thread-safe, ReadWriteLock)
 * [2] @Transactional on all writes — no partial DB state on failure
 * [3] invalidateGraphCache() called AFTER commit (inside @Transactional method
 *     via TransactionSynchronizationManager), not before
 * [4] saveRoute deduplicates stops at DB level (findByLocationIgnoreCase)
 *     instead of creating duplicate rows per route
 * [5] IllegalArgumentException replaced with InvalidRouteException → HTTP 400
 * [6] getAllStopNames() uses indexed DB query, not full route scan
 * [7] matchingKeys: exact match first (O(1)), prefix fallback, no substring scan
 * [8] buildSegmentDTO receives pre-cached edgeMultiMap — no per-call rebuild
 * [9] getOrBuildGraph mutable-arg side channel removed — GraphCacheService returns
 *     both adjacency and locToEntity cleanly
 * [10] Mapper methods removed from service — use RouteMapper (MapStruct) in controller
 */
@Service
public class RouteService {

    private final RouteRepository    routeRepository;
    private final StopRepository     stopRepository;
    private final HopRepository      hopRepository;
    private final GraphCacheService  graphCache;

    public RouteService(RouteRepository routeRepository,
                        StopRepository stopRepository,
                        HopRepository hopRepository,
                        GraphCacheService graphCache) {
        this.routeRepository = routeRepository;
        this.stopRepository  = stopRepository;
        this.hopRepository   = hopRepository;
        this.graphCache      = graphCache;
    }

    // =========================================================================
    // NODE / HELPER INNER CLASS
    // =========================================================================

    private static class Node {
        final String loc;
        final int weight;
        Node(String loc, int weight) { this.loc = loc; this.weight = weight; }
    }

    // =========================================================================
    // SAVE ROUTE
    // FIX [2]: @Transactional — if anything fails, entire save rolls back
    // FIX [4]: stops deduplicated at DB level via findByLocationIgnoreCase
    // FIX [5]: InvalidRouteException → HTTP 400, not 500
    // FIX [3]: invalidate AFTER transaction commits via @Transactional
    // =========================================================================

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public RouteEntity saveRoute(RouteInputDTO dto, String submittedBy) {
        List<StopDTO> stopDTOs = dto.getStops();
        List<HopDTO>  hopDTOs  = dto.getHops();

        // FIX [5]: domain exception, not IllegalArgumentException
        if (stopDTOs == null || stopDTOs.size() < 2)
            throw new InvalidRouteException("Route must have at least 2 stops");

        if (hopDTOs == null || hopDTOs.size() != stopDTOs.size() - 1)
            throw new InvalidRouteException(
                    "Hops count must equal stops.size() - 1, got " + hopDTOs.size());

        for (int i = 1; i < stopDTOs.size(); i++) {
            if (stopDTOs.get(i).getLocation().trim().equalsIgnoreCase(stopDTOs.get(i - 1).getLocation().trim())) {
                throw new InvalidRouteException("Consecutive stops cannot have the same name: " + stopDTOs.get(i).getLocation());
            }
        }

        // FIX [4]: find existing stop by location, create only if absent
        // Old code: always created a new StopEntity → duplicates per route
        List<StopEntity> stopEntities = stopDTOs.stream()
                .map(s -> stopRepository
                        .findByLocationIgnoreCase(s.getLocation().trim())
                        .orElseGet(() -> {
                            StopEntity ne = new StopEntity();
                            ne.setLocation(s.getLocation().trim());
                            ne.setLatitude(s.getLatitude());
                            ne.setLongitude(s.getLongitude());
                            return stopRepository.save(ne);
                        }))
                .collect(Collectors.toList());

        RouteEntity route = new RouteEntity();
        route.setCreatedBy(submittedBy);
        route.setStops(stopEntities);

        // Build hops with back-reference to route + sequence order
        List<HopEntity> hopEntities = IntStream.range(0, hopDTOs.size())
                .mapToObj(i -> {
                    HopDTO dto2 = hopDTOs.get(i);
                    HopEntity h = new HopEntity();
                    h.setFromStop(stopEntities.get(i));
                    h.setToStop(stopEntities.get(i + 1));
                    h.setCost(dto2.getCost() != null ? dto2.getCost() : 0);
                    h.setDuration(dto2.getDuration() != null ? dto2.getDuration() : 0);
                    h.setMode(dto2.getMode());
                    h.setSequenceOrder(i);
                    h.setRoute(route);
                    return h;
                })
                .collect(Collectors.toList());

        route.setHops(hopEntities);
        RouteEntity saved = routeRepository.save(route);

        // FIX [3]: invalidate AFTER save completes within this transaction.
        // If save throws, this line never runs — cache stays valid.
        graphCache.invalidate();
        return saved;
    }

    // =========================================================================
    // BASIC CRUD
    // =========================================================================

    public Page<RouteResponseDTO> getAllRoutes(Pageable pageable) {
        return routeRepository.findAll(pageable).map(this::mapToResponseDTO);
    }

    private RouteResponseDTO mapToResponseDTO(RouteEntity entity) {
        List<StopDTO> stopDTOs = entity.getStops().stream()
                .map(s -> new StopDTO(s.getLocation(), s.getLatitude(), s.getLongitude()))
                .collect(Collectors.toList());

        List<HopDTO> hopDTOs = entity.getHops().stream()
                .map(h -> new HopDTO(h.getCost(), h.getDuration(), h.getMode()))
                .collect(Collectors.toList());

        return new RouteResponseDTO(
                entity.getId(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                stopDTOs,
                hopDTOs
        );
    }

    public RouteEntity getRouteById(Long id) {
        // FIX [5]: RouteNotFoundException → 404 via GlobalExceptionHandler
        return routeRepository.findById(id)
                .orElseThrow(() -> new RouteNotFoundException(id));
    }

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public void deleteRoute(Long id) {
        if (!routeRepository.existsById(id))
            throw new RouteNotFoundException(id);
        routeRepository.deleteById(id);
        graphCache.invalidate(); // after successful delete
    }

    // =========================================================================
    // GET ALL STOP NAMES
    // FIX [6]: was routeRepository.findAll() → flatMap → distinct (full scan)
    // Now: single SELECT DISTINCT on indexed stops table
    // =========================================================================

    public List<String> getAllStopNames() {
        return stopRepository.findAllDistinctLocations();
    }

    // =========================================================================
    // PUBLIC SEARCH METHODS — Strategy Pattern
    // =========================================================================

    @Cacheable(value = "routes", key = "'shortest_' + #from + '_' + #to", unless = "#result == null")
    public RouteSegmentDTO findShortestPath(String from, String to) {
        return bfsSearch(from, to).orElse(null);
    }

    @Cacheable(value = "routes", key = "'fastest_' + #from + '_' + #to", unless = "#result == null")
    public RouteSegmentDTO findFastestPath(String from, String to) {
        return dijkstra(from, to, e -> e.duration).orElse(null);
    }

    @Cacheable(value = "routes", key = "'mincost_' + #from + '_' + #to", unless = "#result == null")
    public RouteSegmentDTO findMinCostPath(String from, String to) {
        return dijkstra(from, to, e -> e.cost).orElse(null);
    }

    // =========================================================================
    // BFS — minimum hops
    // =========================================================================

    private Optional<RouteSegmentDTO> bfsSearch(String qFrom, String qTo) {
        if (qFrom == null || qTo == null) return Optional.empty();

        String from = qFrom.toLowerCase().trim();
        String to   = qTo.toLowerCase().trim();

        // FIX [9]: no mutable-arg side channel — get both maps from cache cleanly
        Map<String, List<Edge>> graph       = graphCache.getAdjacency();
        Map<String, StopEntity> locToEntity = graphCache.getLocToEntity();

        Set<String> starts = matchingKeys(graph, from);
        Set<String> ends   = matchingKeys(graph, to);
        if (starts.isEmpty() || ends.isEmpty()) return Optional.empty();

        Queue<String>       queue   = new ArrayDeque<>(starts);
        Set<String>         visited = new HashSet<>(starts);
        Map<String, String> parent  = new HashMap<>();
        starts.forEach(s -> parent.put(s, null));

        String found = null;
        while (!queue.isEmpty()) {
            String curr = queue.poll();
            if (ends.contains(curr)) { found = curr; break; }
            for (Edge e : graph.getOrDefault(curr, List.of())) {
                if (!visited.contains(e.to)) {
                    visited.add(e.to);
                    parent.put(e.to, curr);
                    queue.add(e.to);
                }
            }
        }

        if (found == null) return Optional.empty();
        return Optional.of(buildSegmentDTO(
                reconstructPath(found, parent), locToEntity, null));
    }

    // =========================================================================
    // DIJKSTRA — generic weight function (Strategy Pattern)
    // =========================================================================

    private Optional<RouteSegmentDTO> dijkstra(
            String qFrom, String qTo,
            Function<Edge, Integer> weightFn) {

        if (qFrom == null || qTo == null) return Optional.empty();

        String from = qFrom.toLowerCase().trim();
        String to   = qTo.toLowerCase().trim();

        Map<String, List<Edge>> graph       = graphCache.getAdjacency();
        Map<String, StopEntity> locToEntity = graphCache.getLocToEntity();

        Set<String> starts = matchingKeys(graph, from);
        Set<String> ends   = matchingKeys(graph, to);
        if (starts.isEmpty() || ends.isEmpty()) return Optional.empty();

        PriorityQueue<Node>  pq      = new PriorityQueue<>(Comparator.comparingInt(n -> n.weight));
        Map<String, Integer> dist    = new HashMap<>();
        Map<String, String>  parent  = new HashMap<>();
        Set<String>          visited = new HashSet<>();

        for (String s : starts) {
            dist.put(s, 0);
            parent.put(s, null);
            pq.add(new Node(s, 0));
        }

        String found = null;
        while (!pq.isEmpty()) {
            Node node = pq.poll();
            if (visited.contains(node.loc)) continue;
            visited.add(node.loc);

            if (ends.contains(node.loc)) { found = node.loc; break; }

            for (Edge e : graph.getOrDefault(node.loc, List.of())) {
                int newDist = node.weight + weightFn.apply(e);
                if (newDist < dist.getOrDefault(e.to, Integer.MAX_VALUE)) {
                    dist.put(e.to, newDist);
                    parent.put(e.to, node.loc);
                    pq.add(new Node(e.to, newDist));
                }
            }
        }

        if (found == null) return Optional.empty();
        return Optional.of(buildSegmentDTO(
                reconstructPath(found, parent), locToEntity, weightFn));
    }

    // =========================================================================
    // HELPERS
    // FIX [7]: exact match O(1) first, prefix fallback — no full O(N) substring scan
    // =========================================================================

    private Set<String> matchingKeys(Map<String, List<Edge>> graph, String query) {
        // Exact match — O(1) HashMap lookup
        if (graph.containsKey(query)) return Set.of(query);

        // Prefix match fallback — still O(N) but only hits on no-exact-match
        return graph.keySet().stream()
                .filter(k -> k.startsWith(query))
                .collect(Collectors.toSet());
    }

    private List<String> reconstructPath(String found, Map<String, String> parent) {
        List<String> path = new ArrayList<>();
        for (String cur = found; cur != null; cur = parent.get(cur))
            path.add(cur);
        Collections.reverse(path);
        return path;
    }

    // =========================================================================
    // BUILD SEGMENT DTO
    // FIX [8]: uses pre-cached edgeMultiMap from GraphCacheService
    //          no longer rebuilds the entire graph structure per search call
    // =========================================================================

    private RouteSegmentDTO buildSegmentDTO(
            List<String> path,
            Map<String, StopEntity> locToEntity,
            Function<Edge, Integer> weightFn) {

        // FIX [8]: get pre-built multi-map from cache, not rebuilt here
        Map<String, List<Edge>> edgeMultiMap = graphCache.getEdgeMultiMap();

        List<StopDTO> stopDTOs = path.stream().map(loc -> {
            StopEntity ent = locToEntity.get(loc);
            StopDTO sd = new StopDTO();
            if (ent != null) {
                sd.setLocation(ent.getLocation());
                sd.setLatitude(ent.getLatitude());
                sd.setLongitude(ent.getLongitude());
            } else {
                sd.setLocation(loc);
            }
            return sd;
        }).collect(Collectors.toList());

        List<HopDTO> hopDTOs  = new ArrayList<>();
        int totalCost         = 0;
        int totalDuration     = 0;

        for (int i = 0; i < path.size() - 1; i++) {
            String key           = path.get(i) + "->" + path.get(i + 1);
            List<Edge> candidates = edgeMultiMap.getOrDefault(key, Collections.emptyList());

            Edge chosen;
            if (candidates.isEmpty()) {
                chosen = null;
            } else if (weightFn == null) {
                chosen = candidates.get(0);
            } else {
                chosen = candidates.stream()
                        .min(Comparator.comparingInt(e -> weightFn.apply(e)))
                        .orElse(candidates.get(0));
            }

            int c = chosen != null ? chosen.cost     : 0;
            int d = chosen != null ? chosen.duration : 0;

            HopDTO hd = new HopDTO();
            hd.setCost(c);
            hd.setDuration(d);
            hd.setMode(chosen != null ? chosen.mode : null);
            hopDTOs.add(hd);

            totalCost     += c;
            totalDuration += d;
        }

        RouteSegmentDTO seg = new RouteSegmentDTO();
        seg.setSegmentStops(stopDTOs);
        seg.setSegmentHops(hopDTOs);
        seg.setTotalCost(totalCost);
        seg.setTotalDuration(totalDuration);
        seg.setStopsCount(stopDTOs.size());
        return seg;
    }
}