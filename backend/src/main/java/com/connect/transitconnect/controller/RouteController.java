package com.connect.transitconnect.controller;

import com.connect.transitconnect.dto.RouteInputDTO;
import com.connect.transitconnect.dto.RouteSegmentDTO;
import com.connect.transitconnect.entity.RouteEntity;
import com.connect.transitconnect.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.connect.transitconnect.dto.RouteResponseDTO;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    // =========================================================================
    // ADD ROUTE
    // POST /api/routes/add
    // =========================================================================
    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addRoute(@Valid @RequestBody RouteInputDTO dto,
                                                Authentication auth) {
        RouteEntity saved = routeService.saveRoute(dto,auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Route created successfully",
                "routeId", saved.getId()
        ));
    }

    // =========================================================================
    // GET ALL ROUTES
    // GET /api/routes/all
    // =========================================================================
    @GetMapping("/all")
    public ResponseEntity<Page<RouteResponseDTO>> getAll(Pageable pageable) {
        return ResponseEntity.ok(routeService.getAllRoutes(pageable));
    }

    // =========================================================================
    // SEARCH
    // GET /api/routes/search?stop1=x&stop2=y&mode=shortest|fastest|cheapest
    //
    // FIX: result type changed from Optional<Object> → Optional<RouteSegmentDTO>
    //      to match the updated RouteService return types.
    // =========================================================================
    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam("stop1") String stop1,
            @RequestParam("stop2") String stop2,
            @RequestParam(value = "mode", required = false, defaultValue = "shortest") String mode) {

        // Validation
        if (stop1.trim().isEmpty() || stop2.trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "stop1 and stop2 must not be blank"));
        }

        if (stop1.trim().equalsIgnoreCase(stop2.trim())) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Source and destination stops cannot be the same"));
        }

        // FIX: type is now RouteSegmentDTO directly (to avoid Redis JSON Optional serialization bugs)
        RouteSegmentDTO result = null;
        switch (mode.toLowerCase().trim()) {
            case "fastest":
                result = routeService.findFastestPath(stop1, stop2);
                break;
            case "cheapest":
            case "mincost":
            case "minimum-cost":
                result = routeService.findMinCostPath(stop1, stop2);
                break;
            case "shortest":
                result = routeService.findShortestPath(stop1, stop2);
                break;
            default:
                return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message", "Invalid mode. Allowed values: shortest (default), fastest, cheapest"));
        }

        // FIX: return 404 with a clear message if no route was found (result is null)
        if (result == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message",
                            "No route found between '" + stop1 + "' and '" + stop2 + "'"));
        }

        return ResponseEntity.ok(result);
    }

    // =========================================================================
    // DELETE ROUTE
    // DELETE /api/routes/{id}
    // =========================================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        routeService.deleteRoute(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // GET ALL STOP NAMES
    // GET /api/routes/stops
    // =========================================================================
    @GetMapping("/stops")
    public ResponseEntity<List<String>> getAllStops() {
        return ResponseEntity.ok(routeService.getAllStopNames());
    }
}