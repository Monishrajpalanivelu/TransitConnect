package com.connect.transitconnect.service;

import com.connect.transitconnect.dto.*;
import com.connect.transitconnect.entity.*;
import com.connect.transitconnect.repository.RouteRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class RouteService {

    private final RouteRepository routeRepository;

    public RouteService(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    // =========================================================================
    // INNER CLASSES
    // =========================================================================

    private static class Edge {
        final String to;
        final int cost;
        final int duration;
        final String mode;

        Edge(String to, Integer cost, Integer duration, String mode) {
            this.to       = to;
            this.cost     = cost     != null ? cost     : 0;
            this.duration = duration != null ? duration : 0;
            this.mode     = mode;
        }
    }

    private static class Node {
        final String loc;
        final int weight;

        Node(String loc, int weight) {
            this.loc    = loc;
            this.weight = weight;
        }
    }

    // =========================================================================
    // DTO <-> ENTITY CONVERTERS
    // =========================================================================

    private StopEntity toStopEntity(StopDTO dto) {
        StopEntity e = new StopEntity();
        e.setLocation(dto.getLocation());
        e.setLatitude(dto.getLatitude());
        e.setLongitude(dto.getLongitude());
        return e;
    }

    private HopEntity toHopEntity(HopDTO dto) {
        HopEntity h = new HopEntity();
        h.setCost(dto.getCost());
        h.setDuration(dto.getDuration());
        h.setMode(dto.getMode());
        return h;
    }

    // =========================================================================
    // SAVE ROUTE
    // =========================================================================

    public RouteEntity saveRoute(RouteInputDTO dto) {
        List<StopDTO> stopDTOs = dto.getStops();
        List<HopDTO>  hopDTOs  = dto.getHops();

        if (stopDTOs == null || stopDTOs.size() < 2)
            throw new IllegalArgumentException("Route must have at least 2 stops");

        if (hopDTOs == null || hopDTOs.size() != stopDTOs.size() - 1)
            throw new IllegalArgumentException("Hops count must equal stops.size() - 1");

        List<StopEntity> stopEntities = stopDTOs.stream()
                .map(this::toStopEntity)
                .collect(Collectors.toList());

        List<HopEntity> hopEntities = IntStream.range(0, hopDTOs.size())
                .mapToObj(i -> {
                    HopEntity h = toHopEntity(hopDTOs.get(i));
                    h.setFromStop(stopEntities.get(i));
                    h.setToStop(stopEntities.get(i + 1));
                    return h;
                })
                .collect(Collectors.toList());

        RouteEntity route = new RouteEntity();
        route.setStops(stopEntities);
        route.setHops(hopEntities);

        invalidateGraphCache();
        return routeRepository.save(route);
    }

    // =========================================================================
    // BASIC CRUD
    // =========================================================================

    public List<RouteEntity> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Optional<RouteEntity> getRouteById(Long id) {
        return routeRepository.findById(id);
    }

    public void deleteRoute(Long id) {
        routeRepository.deleteById(id);
        invalidateGraphCache();
    }

    // =========================================================================
    // GET ALL STOP NAMES
    // =========================================================================

    public List<String> getAllStopNames() {
        return routeRepository.findAll().stream()
                .flatMap(r -> r.getStops().stream())
                .map(StopEntity::getLocation)
                .distinct()
                .collect(Collectors.toList());
    }

    // =========================================================================
    // GRAPH CACHE
    // locToEntityCache is ALWAYS keyed by lowercase — matches graph keys exactly.
    // =========================================================================

    private Map<String, List<Edge>> graphCache       = null;
    private Map<String, StopEntity> locToEntityCache = null;

    private synchronized void invalidateGraphCache() {
        graphCache       = null;
        locToEntityCache = null;
    }

    private synchronized Map<String, List<Edge>> getOrBuildGraph(
            Map<String, StopEntity> locToEntity) {

        if (graphCache != null) {
            locToEntity.putAll(locToEntityCache);
            return graphCache;
        }

        Map<String, List<Edge>> graph    = new HashMap<>();
        Map<String, StopEntity> locToEnt = new HashMap<>();
        List<RouteEntity> allRoutes       = routeRepository.findAll();

        for (RouteEntity route : allRoutes) {
            List<StopEntity> stops = route.getStops();
            List<HopEntity>  hops  = route.getHops();

            if (stops == null || stops.size() < 2) continue;

            List<String> locs = stops.stream()
                    .map(s -> s.getLocation().toLowerCase().trim())
                    .collect(Collectors.toList());

            for (int i = 0; i < stops.size(); i++) {
                String key = locs.get(i);
                locToEnt.putIfAbsent(key, stops.get(i));
                graph.putIfAbsent(key, new ArrayList<>());
            }

            for (int i = 0; i < locs.size() - 1; i++) {
                String u   = locs.get(i);
                String v   = locs.get(i + 1);
                HopEntity hop = hops.get(i);
                // ALL edges are added — including parallel edges between same stops.
                // Dijkstra/BFS will naturally pick the best one via relaxation.
                graph.get(u).add(new Edge(v, hop.getCost(), hop.getDuration(), hop.getMode()));
                graph.get(v).add(new Edge(u, hop.getCost(), hop.getDuration(), hop.getMode()));
            }
        }

        graphCache       = graph;
        locToEntityCache = locToEnt;
        locToEntity.putAll(locToEnt);
        return graphCache;
    }

    // =========================================================================
    // PUBLIC SEARCH METHODS
    // =========================================================================

    public Optional<RouteSegmentDTO> findShortestPath(String qStop1, String qStop2) {
        return bfsSearch(qStop1, qStop2);
    }

    public Optional<RouteSegmentDTO> findFastestPath(String qStop1, String qStop2) {
        return dijkstra(qStop1, qStop2, e -> e.duration);
    }

    public Optional<RouteSegmentDTO> findMinCostPath(String qStop1, String qStop2) {
        return dijkstra(qStop1, qStop2, e -> e.cost);
    }

    // =========================================================================
    // BFS - minimum hops
    // =========================================================================

    private Optional<RouteSegmentDTO> bfsSearch(String qStop1, String qStop2) {
        if (qStop1 == null || qStop2 == null) return Optional.empty();

        String stop1 = qStop1.toLowerCase().trim();
        String stop2 = qStop2.toLowerCase().trim();

        Map<String, StopEntity> locToEntity = new HashMap<>();
        Map<String, List<Edge>> graph       = getOrBuildGraph(locToEntity);

        Set<String> starts = matchingKeys(graph, stop1);
        Set<String> ends   = matchingKeys(graph, stop2);
        if (starts.isEmpty() || ends.isEmpty()) return Optional.empty();

        Queue<String>       queue   = new ArrayDeque<>(starts);
        Set<String>         visited = new HashSet<>(starts);
        Map<String, String> parent  = new HashMap<>();
        starts.forEach(s -> parent.put(s, null));

        String found = null;

        while (!queue.isEmpty()) {
            String curr = queue.poll();
            if (ends.contains(curr)) { found = curr; break; }

            for (Edge e : graph.get(curr)) {
                if (!visited.contains(e.to)) {
                    visited.add(e.to);
                    parent.put(e.to, curr);
                    queue.add(e.to);
                }
            }
        }

        if (found == null) return Optional.empty();

        // BFS does not optimize weight — pass null weightFn, buildSegmentDTO
        // will just pick the first available edge (hop count is what matters here)
        return Optional.of(buildSegmentDTO(
                reconstructPath(found, parent), graph, locToEntity, null));
    }

    // =========================================================================
    // GENERIC DIJKSTRA - Strategy Pattern
    // =========================================================================

    private Optional<RouteSegmentDTO> dijkstra(
            String qStop1, String qStop2,
            Function<Edge, Integer> weightFn) {

        if (qStop1 == null || qStop2 == null) return Optional.empty();

        String stop1 = qStop1.toLowerCase().trim();
        String stop2 = qStop2.toLowerCase().trim();

        Map<String, StopEntity> locToEntity = new HashMap<>();
        Map<String, List<Edge>> graph       = getOrBuildGraph(locToEntity);

        Set<String> starts = matchingKeys(graph, stop1);
        Set<String> ends   = matchingKeys(graph, stop2);
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

            for (Edge e : graph.get(node.loc)) {
                int newDist = node.weight + weightFn.apply(e);
                if (newDist < dist.getOrDefault(e.to, Integer.MAX_VALUE)) {
                    dist.put(e.to, newDist);
                    parent.put(e.to, node.loc);
                    pq.add(new Node(e.to, newDist));
                }
            }
        }

        if (found == null) return Optional.empty();

        // Pass the same weightFn into buildSegmentDTO so it picks the
        // correct edge (min duration for fastest, min cost for cheapest)
        // when multiple parallel edges exist between the same two stops.
        return Optional.of(buildSegmentDTO(
                reconstructPath(found, parent), graph, locToEntity, weightFn));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private Set<String> matchingKeys(Map<String, List<Edge>> graph, String query) {
        return graph.keySet().stream()
                .filter(k -> k.contains(query))
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
    // PATH -> RouteSegmentDTO
    //
    // KEY FIX — parallel edges (same stops, different cost/duration):
    //
    //   Old code used putIfAbsent → always kept the FIRST edge regardless of
    //   which search mode was active. So findFastestPath would find the right
    //   PATH via Dijkstra but then buildSegmentDTO attached the wrong edge
    //   data (first added, not fastest) → duration showed the first route's
    //   value, not the minimum.
    //
    //   Fix: buildSegmentDTO now receives the same weightFn used by Dijkstra.
    //   For each hop, it collects ALL parallel edges between u→v and picks
    //   the one with minimum weight according to weightFn.
    //   - findFastestPath  passes e -> e.duration  → picks min-duration edge
    //   - findMinCostPath  passes e -> e.cost       → picks min-cost edge
    //   - findShortestPath passes null              → picks first edge (hops only)
    // =========================================================================

    private RouteSegmentDTO buildSegmentDTO(
            List<String> path,
            Map<String, List<Edge>> graph,
            Map<String, StopEntity> locToEntity,
            Function<Edge, Integer> weightFn) {   // <-- weightFn added

        // Build a multi-map: "u->v" -> List<Edge> (all parallel edges)
        Map<String, List<Edge>> edgeMultiMap = new HashMap<>();
        graph.forEach((u, edges) ->
                edges.forEach(e -> {
                    String key = u + "->" + e.to;
                    edgeMultiMap.computeIfAbsent(key, k -> new ArrayList<>()).add(e);
                })
        );

        // Stop DTOs — loc is lowercase, locToEntity is lowercase-keyed → always matches
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

        // Hop DTOs — pick best parallel edge using weightFn
        List<HopDTO> hopDTOs  = new ArrayList<>();
        int totalCost         = 0;
        int totalDuration     = 0;

        for (int i = 0; i < path.size() - 1; i++) {
            String key = path.get(i) + "->" + path.get(i + 1);
            List<Edge> candidates = edgeMultiMap.getOrDefault(key, Collections.emptyList());

            Edge chosen;
            if (candidates.isEmpty()) {
                chosen = null;
            } else if (weightFn == null) {
                // BFS / shortest path — just take first, weight doesn't matter
                chosen = candidates.get(0);
            } else {
                // Fastest or cheapest — pick the candidate with minimum weight
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