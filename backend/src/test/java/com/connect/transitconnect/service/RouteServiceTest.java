package com.connect.transitconnect.service;

import com.connect.transitconnect.dto.HopDTO;
import com.connect.transitconnect.dto.RouteInputDTO;
import com.connect.transitconnect.dto.StopDTO;
import com.connect.transitconnect.entity.HopEntity;
import com.connect.transitconnect.entity.RouteEntity;
import com.connect.transitconnect.entity.StopEntity;
import com.connect.transitconnect.exception.InvalidRouteException;
import com.connect.transitconnect.exception.RouteNotFoundException;
import com.connect.transitconnect.repository.HopRepository;
import com.connect.transitconnect.repository.RouteRepository;
import com.connect.transitconnect.repository.StopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RouteService.
 *
 * All dependencies (repositories, graph cache) are mocked — no database or
 * Docker container is needed. These tests run in milliseconds and verify
 * the pure business-logic layer in isolation.
 */
@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock private RouteRepository    routeRepository;
    @Mock private StopRepository     stopRepository;
    @Mock private HopRepository      hopRepository;
    @Mock private GraphCacheService  graphCache;

    @InjectMocks
    private RouteService routeService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private RouteInputDTO buildInput(List<StopDTO> stops, List<HopDTO> hops) {
        RouteInputDTO dto = new RouteInputDTO();
        dto.setStops(stops);
        dto.setHops(hops);
        return dto;
    }

    private StopDTO stop(String name) {
        return new StopDTO(name, 12.0, 77.0);
    }

    private HopDTO hop() {
        return new HopDTO(10, 20, 100, "Bus", false);
    }

    // -------------------------------------------------------------------------
    // saveRoute — validation
    // -------------------------------------------------------------------------

    @Test
    void saveRoute_throwsInvalidRouteException_whenFewerThanTwoStops() {
        RouteInputDTO input = buildInput(List.of(stop("Only Stop")), List.of(hop()));

        assertThrows(InvalidRouteException.class,
                () -> routeService.saveRoute(input, "testuser"),
                "Expected InvalidRouteException when stops < 2");
    }

    @Test
    void saveRoute_throwsInvalidRouteException_whenHopCountMismatch() {
        // 2 stops requires exactly 1 hop; providing 2 hops should fail
        RouteInputDTO input = buildInput(
                List.of(stop("A"), stop("B")),
                List.of(hop(), hop())
        );

        assertThrows(InvalidRouteException.class,
                () -> routeService.saveRoute(input, "testuser"),
                "Expected InvalidRouteException when hops != stops - 1");
    }

    @Test
    void saveRoute_throwsInvalidRouteException_whenConsecutiveStopsAreSame() {
        RouteInputDTO input = buildInput(
                List.of(stop("Station A"), stop("Station A")),
                List.of(hop())
        );

        assertThrows(InvalidRouteException.class,
                () -> routeService.saveRoute(input, "testuser"),
                "Expected InvalidRouteException when two consecutive stops share the same name");
    }

    // -------------------------------------------------------------------------
    // saveRoute — stop deduplication
    // -------------------------------------------------------------------------

    @Test
    void saveRoute_reusesExistingStop_whenLocationAlreadyExistsInDB() {
        // Arrange
        StopEntity existingStop = new StopEntity();
        existingStop.setLocation("Central Station");

        when(stopRepository.findByLocationIgnoreCase("Central Station"))
                .thenReturn(Optional.of(existingStop));
        when(stopRepository.findByLocationIgnoreCase("East End"))
                .thenReturn(Optional.empty());

        StopEntity newStop = new StopEntity();
        newStop.setLocation("East End");
        when(stopRepository.save(any(StopEntity.class))).thenReturn(newStop);

        RouteEntity savedRoute = new RouteEntity();
        savedRoute.setId(1L);
        savedRoute.setCreatedBy("testuser");
        when(routeRepository.save(any(RouteEntity.class))).thenReturn(savedRoute);
        doNothing().when(graphCache).invalidate();

        RouteInputDTO input = buildInput(
                List.of(stop("Central Station"), stop("East End")),
                List.of(hop())
        );

        // Act
        RouteEntity result = routeService.saveRoute(input, "testuser");

        // Assert — stopRepository.save() called only once (for "East End", not "Central Station")
        verify(stopRepository, times(1)).save(any(StopEntity.class));
        assertNotNull(result);
    }

    @Test
    void saveRoute_createsNewStop_whenLocationNotInDB() {
        when(stopRepository.findByLocationIgnoreCase(anyString()))
                .thenReturn(Optional.empty());

        StopEntity newStop = new StopEntity();
        when(stopRepository.save(any(StopEntity.class))).thenReturn(newStop);

        RouteEntity savedRoute = new RouteEntity();
        savedRoute.setId(2L);
        when(routeRepository.save(any(RouteEntity.class))).thenReturn(savedRoute);
        doNothing().when(graphCache).invalidate();

        RouteInputDTO input = buildInput(
                List.of(stop("Brand New Stop A"), stop("Brand New Stop B")),
                List.of(hop())
        );

        routeService.saveRoute(input, "testuser");

        // Both stops are new — stopRepository.save() called twice
        verify(stopRepository, times(2)).save(any(StopEntity.class));
    }

    // -------------------------------------------------------------------------
    // getRouteById
    // -------------------------------------------------------------------------

    @Test
    void getRouteById_throwsRouteNotFoundException_whenIdDoesNotExist() {
        when(routeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RouteNotFoundException.class,
                () -> routeService.getRouteById(999L),
                "Expected RouteNotFoundException for a non-existent route id");
    }

    // -------------------------------------------------------------------------
    // deleteRoute
    // -------------------------------------------------------------------------

    @Test
    void deleteRoute_throwsRouteNotFoundException_whenIdDoesNotExist() {
        when(routeRepository.existsById(999L)).thenReturn(false);

        assertThrows(RouteNotFoundException.class,
                () -> routeService.deleteRoute(999L, "testuser"));
    }

    // -------------------------------------------------------------------------
    // findShortestPath — returns null when graph is empty
    // -------------------------------------------------------------------------

    @Test
    void findShortestPath_returnsNull_whenGraphIsEmpty() {
        // Graph cache returns empty adjacency map → no route possible
        when(graphCache.getAdjacency()).thenReturn(Collections.emptyMap());
        when(graphCache.getLocToEntity()).thenReturn(Collections.emptyMap());

        assertNull(routeService.findShortestPath("A", "B"),
                "Expected null when no graph data exists");
    }
}
