package com.connect.transitconnect.controller;

import com.connect.transitconnect.dto.RouteInputDTO;
import com.connect.transitconnect.dto.RouteSegmentDTO;
import com.connect.transitconnect.entity.RouteEntity;
import com.connect.transitconnect.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.connect.transitconnect.dto.RouteResponseDTO;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    // =========================================================================
    // ADD ROUTE  —  POST /api/routes/add
    // =========================================================================
    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addRoute(
            @Valid @RequestBody RouteInputDTO dto,
            Authentication auth) {
        RouteEntity saved = routeService.saveRoute(dto, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Route created successfully",
                "routeId", saved.getId()
        ));
    }

    // =========================================================================
    // UPDATE ROUTE  —  PUT /api/routes/{id}
    // Only the original creator can update their own route.
    // =========================================================================
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateRoute(
            @PathVariable Long id,
            @Valid @RequestBody RouteInputDTO dto,
            Authentication auth) {
        try {
            RouteEntity updated = routeService.updateRoute(id, dto, auth.getName());
            return ResponseEntity.ok(Map.of(
                    "message", "Route updated successfully",
                    "routeId", updated.getId()
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // =========================================================================
    // GET ALL ROUTES  —  GET /api/routes/all
    // =========================================================================
    @GetMapping("/all")
    public ResponseEntity<Page<RouteResponseDTO>> getAll(Pageable pageable) {
        return ResponseEntity.ok(routeService.getAllRoutes(pageable));
    }

    // =========================================================================
    // SEARCH  —  GET /api/routes/search?stop1=x&stop2=y
    // =========================================================================
    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam("stop1") String stop1,
            @RequestParam("stop2") String stop2) {

        if (stop1.trim().isEmpty() || stop2.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "stop1 and stop2 must not be blank"));
        }

        if (stop1.trim().equalsIgnoreCase(stop2.trim())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Source and destination stops cannot be the same"));
        }

        Map<String, RouteSegmentDTO> results = new java.util.HashMap<>();

        RouteSegmentDTO shortest = routeService.findShortestPath(stop1, stop2);
        if (shortest != null) results.put("shortest", shortest);

        RouteSegmentDTO fastest = routeService.findFastestPath(stop1, stop2);
        if (fastest != null) results.put("fastest", fastest);

        RouteSegmentDTO cheapest = routeService.findMinCostPath(stop1, stop2);
        if (cheapest != null) results.put("cheapest", cheapest);

        if (results.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message",
                            "No route found between '" + stop1 + "' and '" + stop2 + "'"));
        }

        return ResponseEntity.ok(results);
    }

    // =========================================================================
    // DELETE ROUTE  —  DELETE /api/routes/{id}
    // Only the original creator can delete their own route.
    // =========================================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        try {
            routeService.deleteRoute(id, auth.getName());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // =========================================================================
    // STOP AUTOCOMPLETE  —  GET /api/routes/stops?q=ben&limit=10
    // Returns up to `limit` stop names matching the prefix.
    // Falls back to all stops if q is blank (for initial dropdown population).
    // =========================================================================
    @GetMapping("/stops")
    public ResponseEntity<List<String>> getStops(
            @RequestParam(value = "q", required = false, defaultValue = "") String q,
            @RequestParam(value = "limit", required = false, defaultValue = "10") int limit) {

        List<String> results = q.isBlank()
                ? routeService.getAllStopNames()
                : routeService.searchStopNames(q, limit);

        return ResponseEntity.ok(results);
    }
}