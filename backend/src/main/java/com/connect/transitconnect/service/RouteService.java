package com.connect.transitconnect.service;

import com.connect.transitconnect.dto.*;
import com.connect.transitconnect.entity.*;
import com.connect.transitconnect.exception.InvalidRouteException;
import com.connect.transitconnect.exception.RouteNotFoundException;
import com.connect.transitconnect.repository.HopRepository;
import com.connect.transitconnect.repository.RouteRepository;
import com.connect.transitconnect.repository.StopRepository;
import com.connect.transitconnect.service.GraphCacheService.Edge;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

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
    // HELPERS
    // =========================================================================

    private static class Node {
        final String loc;
        final int weight;
        final Long lastRouteId;   // Track last route for transfer penalty
        Node(String loc, int weight, Long lastRouteId) {
            this.loc = loc; this.weight = weight; this.lastRouteId = lastRouteId;
        }
    }

    // =========================================================================
    // SAVE ROUTE
    // =========================================================================

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public RouteEntity saveRoute(RouteInputDTO dto, String submittedBy) {
        return persistRoute(null, dto, submittedBy);
    }

    // =========================================================================
    // UPDATE ROUTE (PUT)
    // =========================================================================

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public RouteEntity updateRoute(Long id, RouteInputDTO dto, String callerUsername) {
        RouteEntity existing = routeRepository.findById(id)
                .orElseThrow(() -> new RouteNotFoundException(id));

        // Only the original creator OR an ADMIN can update
        String role = callerUsername; // role check handled in controller
        if (!existing.getCreatedBy().equals(callerUsername)) {
            throw new SecurityException("You do not have permission to update this route");
        }

        return persistRoute(existing, dto, callerUsername);
    }

    /** Shared logic for save and update. If route is null → create new. */
    private RouteEntity persistRoute(RouteEntity route, RouteInputDTO dto, String submittedBy) {
        List<StopDTO> stopDTOs = dto.getStops();
        List<HopDTO>  hopDTOs  = dto.getHops();

        if (stopDTOs == null || stopDTOs.size() < 2)
            throw new InvalidRouteException("Route must have at least 2 stops");

        if (hopDTOs == null || hopDTOs.size() != stopDTOs.size() - 1)
            throw new InvalidRouteException(
                    "Hops count must equal stops.size() - 1, got " +
                    (hopDTOs == null ? 0 : hopDTOs.size()));

        for (int i = 1; i < stopDTOs.size(); i++) {
            String curCanon  = GraphCacheService.normalize(stopDTOs.get(i).getLocation());
            String prevCanon = GraphCacheService.normalize(stopDTOs.get(i - 1).getLocation());
            if (curCanon.equals(prevCanon)) {
                throw new InvalidRouteException(
                        "Consecutive stops cannot have the same name: " +
                        stopDTOs.get(i).getLocation());
            }
        }

        // Deduplicate stops by canonical name
        List<StopEntity> stopEntities = stopDTOs.stream()
                .map(s -> {
                    String canon = GraphCacheService.normalize(s.getLocation().trim());
                    return stopRepository
                            .findByCanonicalName(canon)
                            .orElseGet(() -> {
                                StopEntity ne = new StopEntity();
                                ne.setLocation(s.getLocation().trim());
                                ne.setCanonicalName(canon);
                                ne.setLatitude(s.getLatitude());
                                ne.setLongitude(s.getLongitude());
                                return stopRepository.save(ne);
                            });
                })
                .collect(Collectors.toList());

        if (route == null) {
            route = new RouteEntity();
            route.setCreatedBy(submittedBy);
        }

        route.setStops(stopEntities);

        final RouteEntity finalRoute = route;

        List<HopEntity> hopEntities = IntStream.range(0, hopDTOs.size())
                .mapToObj(i -> {
                    HopDTO dto2 = hopDTOs.get(i);
                    HopEntity h = new HopEntity();
                    h.setFromStop(stopEntities.get(i));
                    h.setToStop(stopEntities.get(i + 1));
                    h.setCost(dto2.getCost()     != null ? dto2.getCost()     : 0);
                    h.setDuration(dto2.getDuration() != null ? dto2.getDuration() : 0);
                    h.setDistance(dto2.getDistance() != null ? dto2.getDistance() : 0);
                    h.setMode(TransportMode.fromString(dto2.getMode()));
                    h.setOneWay(Boolean.TRUE.equals(dto2.getIsOneWay()));
                    h.setSequenceOrder(i);
                    h.setRoute(finalRoute);
                    return h;
                })
                .collect(Collectors.toList());

        // For update: replace hops (orphanRemoval handles old ones)
        route.getHops().clear();
        route.getHops().addAll(hopEntities);

        RouteEntity saved = routeRepository.save(route);
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
                .map(h -> new HopDTO(
                        h.getCost(), h.getDuration(), null,
                        h.getMode() != null ? h.getMode().name() : null,
                        h.isOneWay()))
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
        return routeRepository.findById(id)
                .orElseThrow(() -> new RouteNotFoundException(id));
    }

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public void deleteRoute(Long id, String callerUsername) {
        RouteEntity route = routeRepository.findById(id)
                .orElseThrow(() -> new RouteNotFoundException(id));

        // Only the original creator OR an ADMIN can delete
        if (!route.getCreatedBy().equals(callerUsername)) {
            throw new SecurityException("You do not have permission to delete this route");
        }

        routeRepository.deleteById(id);
        graphCache.invalidate();
    }

    // =========================================================================
    // STOP NAMES — paginated for autocomplete
    // =========================================================================

    public List<String> getAllStopNames() {
        return stopRepository.findAllDistinctLocations();
    }

    /**
     * Returns up to `limit` stop location names whose canonical name starts with `query`.
     * Used by the frontend autocomplete dropdown.
     */
    public List<String> searchStopNames(String query, int limit) {
        String canon = GraphCacheService.normalize(query);
        Pageable page = PageRequest.of(0, Math.min(limit, 20));
        return stopRepository.searchByPrefix(canon, page)
                .stream()
                .map(StopEntity::getLocation)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // PUBLIC SEARCH METHODS — Strategy Pattern
    // =========================================================================

    @Cacheable(value = "routes", key = "'shortest_' + #from + '_' + #to", unless = "#result == null")
    public RouteSegmentDTO findShortestPath(String from, String to) {
        return dijkstra(from, to, e -> e.distance).orElse(null);
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
    // DIJKSTRA — with transfer penalty
    // =========================================================================

    private Optional<RouteSegmentDTO> dijkstra(
            String qFrom, String qTo,
            Function<Edge, Integer> weightFn) {

        if (qFrom == null || qTo == null) return Optional.empty();

        // Normalize search terms using the same canonical key as the graph
        String from = GraphCacheService.normalize(qFrom);
        String to   = GraphCacheService.normalize(qTo);

        Map<String, List<Edge>> graph       = graphCache.getAdjacency();
        Map<String, StopEntity> locToEntity = graphCache.getLocToEntity();

        Set<String> starts = matchingKeys(graph, from);
        Set<String> ends   = matchingKeys(graph, to);
        if (starts.isEmpty() || ends.isEmpty()) return Optional.empty();

        PriorityQueue<Node>  pq      = new PriorityQueue<>(Comparator.comparingInt(n -> n.weight));
        Map<String, Integer> dist    = new HashMap<>();
        Map<String, String>  parent  = new HashMap<>();
        Map<String, Long>    lastRoute = new HashMap<>();
        Set<String> visited = new HashSet<>();

        for (String s : starts) {
            dist.put(s, 0);
            parent.put(s, null);
            lastRoute.put(s, null);
            pq.add(new Node(s, 0, null));
        }

        String found = null;
        while (!pq.isEmpty()) {
            Node node = pq.poll();
            if (visited.contains(node.loc)) continue;
            visited.add(node.loc);

            if (ends.contains(node.loc)) { found = node.loc; break; }

            for (Edge e : graph.getOrDefault(node.loc, List.of())) {
                // Transfer penalty: add 5 mins if we're switching routes
                int transferPenalty = 0;
                if (node.lastRouteId != null && e.routeId != null
                        && !node.lastRouteId.equals(e.routeId)
                        && weightFn.apply(e) == e.duration) {
                    transferPenalty = GraphCacheService.TRANSFER_PENALTY_DURATION;
                }

                int newDist = node.weight + weightFn.apply(e) + transferPenalty;
                if (newDist < dist.getOrDefault(e.to, Integer.MAX_VALUE)) {
                    dist.put(e.to, newDist);
                    parent.put(e.to, node.loc);
                    lastRoute.put(e.to, e.routeId);
                    pq.add(new Node(e.to, newDist, e.routeId));
                }
            }
        }

        if (found == null) return Optional.empty();
        return Optional.of(buildSegmentDTO(
                reconstructPath(found, parent), locToEntity, weightFn));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private Set<String> matchingKeys(Map<String, List<Edge>> graph, String query) {
        if (graph.containsKey(query)) return Set.of(query);
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

    private RouteSegmentDTO buildSegmentDTO(
            List<String> path,
            Map<String, StopEntity> locToEntity,
            Function<Edge, Integer> weightFn) {

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
        int totalDistance     = 0;
        int transferCount     = 0;
        Long lastRouteId      = null;

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

            if (chosen != null && lastRouteId != null && chosen.routeId != null
                    && !chosen.routeId.equals(lastRouteId)) {
                transferCount++;
            }
            if (chosen != null) lastRouteId = chosen.routeId;

            int c    = chosen != null ? chosen.cost     : 0;
            int d    = chosen != null ? chosen.duration : 0;
            int dist = chosen != null ? chosen.distance : 0;

            HopDTO hd = new HopDTO();
            hd.setCost(c);
            hd.setDuration(d);
            hd.setDistance(dist);
            hd.setMode(chosen != null ? chosen.mode : null);
            hopDTOs.add(hd);

            totalCost     += c;
            totalDuration += d;
            totalDistance += dist;
        }

        RouteSegmentDTO seg = new RouteSegmentDTO();
        seg.setSegmentStops(stopDTOs);
        seg.setSegmentHops(hopDTOs);
        seg.setTotalCost(totalCost);
        seg.setTotalDuration(totalDuration);
        seg.setTotalDistance(totalDistance);
        seg.setStopsCount(stopDTOs.size());
        seg.setTransferCount(transferCount);
        return seg;
    }
}