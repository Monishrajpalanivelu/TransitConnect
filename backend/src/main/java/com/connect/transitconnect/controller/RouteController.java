package com.connect.transitconnect.controller;

import com.connect.transitconnect.dto.RouteInputDTO;
import com.connect.transitconnect.dto.RouteSegmentDTO;
import com.connect.transitconnect.entity.RouteEntity;
import com.connect.transitconnect.service.RouteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = { "http://localhost:3000", "https://transitconnect-production.up.railway.app" })
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    // Add a new route
    @PostMapping("/add")
    public ResponseEntity<RouteEntity> addRoute(@RequestBody RouteInputDTO dto) {
        RouteEntity saved = routeService.saveRoute(dto);
        return ResponseEntity.ok(saved);
    }

    // Get all routes
    @GetMapping("/all")
    public ResponseEntity<List<RouteEntity>> getAll() {
        return ResponseEntity.ok(routeService.getAllRoutes());
    }

    /**
     * SEARCH endpoint (smartSearch removed)
     * Default mode = SHORTEST
     *
     * Examples:
     * GET /api/routes/search?stop1=m&stop2=e
     * GET /api/routes/search?stop1=m&stop2=e&mode=cheapest
     */
    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam("stop1") String stop1,
            @RequestParam("stop2") String stop2,
            @RequestParam(value = "mode", required = false) String mode) {

        // Validation
        if (stop1 == null || stop1.trim().isEmpty() ||
                stop2 == null || stop2.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "stop1 and stop2 are required"));
        }

        Optional<Object> result;

        // DEFAULT = shortest path
        if (mode == null || mode.isEmpty()) {
            result = routeService.findShortestPath(stop1, stop2);
        } else {
            switch (mode.toLowerCase().trim()) {
                case "cheapest":
                case "minimum-cost":
                case "mincost":
                    result = routeService.findMinCostPath(stop1, stop2);
                    break;

                case "shortest":
                    result = routeService.findShortestPath(stop1, stop2);
                    break;

                case "fastest":
                    result = routeService.findFastestPath(stop1, stop2);
                    break;

                default:
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message",
                                    "Invalid mode. Allowed: shortest (default), cheapest"));
            }
        }

        if (result.isEmpty()) {
            return ResponseEntity.ok(List.of()); // empty result
        }

        return ResponseEntity.ok(result.get());
    }

    // Delete route
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        routeService.deleteRoute(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stops")
    public ResponseEntity<List<String>> getAllStops() {
        return ResponseEntity.ok(routeService.getAllStopNames());
    }

}
