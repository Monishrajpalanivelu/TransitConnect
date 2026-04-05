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

    // =========================================================================
    // ADD ROUTE
    // POST /api/routes/add
    // =========================================================================
    @PostMapping("/add")
    public ResponseEntity<RouteEntity> addRoute(@RequestBody RouteInputDTO dto) {
        RouteEntity saved = routeService.saveRoute(dto);
        // FIX: 201 Created is more correct than 200 OK for a POST that creates a resource
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // =========================================================================
    // GET ALL ROUTES
    // GET /api/routes/all
    // =========================================================================
    @GetMapping("/all")
    public ResponseEntity<List<RouteEntity>> getAll() {
        return ResponseEntity.ok(routeService.getAllRoutes());
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

        // FIX: type is now Optional<RouteSegmentDTO> — not Optional<Object>
        Optional<RouteSegmentDTO> result = switch (mode.toLowerCase().trim()) {
            case "fastest"                      -> routeService.findFastestPath(stop1, stop2);
            case "cheapest", "mincost",
                 "minimum-cost"                 -> routeService.findMinCostPath(stop1, stop2);
            case "shortest"                     -> routeService.findShortestPath(stop1, stop2);
            default -> {
                // FIX: return 400 immediately for invalid mode — no need to run any search
                yield null;
            }
        };

        // Handle invalid mode (null from default branch above)
        if (result == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message", "Invalid mode. Allowed values: shortest (default), fastest, cheapest"));
        }

        // FIX: return 404 with a clear message instead of 200 with an empty list
        // An empty list is misleading — the route simply was not found
        if (result.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message",
                            "No route found between '" + stop1 + "' and '" + stop2 + "'"));
        }

        return ResponseEntity.ok(result.get());
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