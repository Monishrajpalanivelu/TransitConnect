package com.connect.transitconnect.controller;

import com.connect.transitconnect.dto.HopDTO;
import com.connect.transitconnect.dto.RouteInputDTO;
import com.connect.transitconnect.dto.StopDTO;
import com.connect.transitconnect.entity.RouteEntity;
import com.connect.transitconnect.exception.RouteNotFoundException;
import com.connect.transitconnect.security.JwtUtil;
import com.connect.transitconnect.service.CustomUserDetailsService;
import com.connect.transitconnect.service.RouteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc (HTTP layer) tests for RouteController.
 *
 * The real JwtFilter runs but passes straight through — test requests carry no
 * Bearer token, so the filter just calls chain.doFilter() and continues.
 * JwtUtil and CustomUserDetailsService are mocked to satisfy the filter's
 * Spring context requirements without hitting a real DB or Redis.
 *
 * @WithMockUser supplies a pre-authenticated principal for protected routes.
 */
@WebMvcTest(RouteController.class)
class RouteControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean RouteService routeService;
    @MockBean JwtUtil jwtUtil;            // satisfies JwtFilter's autowired dependency
    @MockBean CustomUserDetailsService userDetailsService; // satisfies JwtFilter's autowired dependency

    // -------------------------------------------------------------------------
    // POST /api/routes/add
    // -------------------------------------------------------------------------

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void addRoute_returns201_whenInputIsValid() throws Exception {
        RouteEntity saved = new RouteEntity();
        saved.setId(42L);
        saved.setCreatedBy("testuser");

        when(routeService.saveRoute(any(RouteInputDTO.class), anyString()))
                .thenReturn(saved);

        RouteInputDTO dto = new RouteInputDTO();
        dto.setStops(List.of(
                new StopDTO("Stop A", 12.97, 77.59),
                new StopDTO("Stop B", 12.93, 77.62)
        ));
        dto.setHops(List.of(new HopDTO(10, 20, 100, "Bus", false)));

        mockMvc.perform(post("/api/routes/add")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Route created successfully"))
                .andExpect(jsonPath("$.routeId").value(42));
    }

    
    @Test
    @WithMockUser
    void search_returns400_whenStop1AndStop2AreTheSame() throws Exception {
        mockMvc.perform(get("/api/routes/search")
                        .param("stop1", "Central")
                        .param("stop2", "Central"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Source and destination stops cannot be the same"));
    }

    @Test
    @WithMockUser
    void search_returns400_whenModeIsUnknown() throws Exception {
        mockMvc.perform(get("/api/routes/search")
                        .param("stop1", "A")
                        .param("stop2", "B")
                        .param("mode", "teleport"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Invalid mode. Allowed values: shortest (default), fastest, cheapest"));
    }

    @Test
    @WithMockUser
    void search_returns404_whenNoRouteFoundBetweenStops() throws Exception {
        when(routeService.findShortestPath("A", "Z")).thenReturn(null);

        mockMvc.perform(get("/api/routes/search")
                        .param("stop1", "A")
                        .param("stop2", "Z")
                        .param("mode", "shortest"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No route found between 'A' and 'Z'"));
    }

    
    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_returns204_whenRouteExistsAndIsDeleted() throws Exception {
        doNothing().when(routeService).deleteRoute(eq(1L), anyString());

        mockMvc.perform(delete("/api/routes/1").with(csrf()))
                .andExpect(status().isNoContent());

        verify(routeService, times(1)).deleteRoute(eq(1L), anyString());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_returns404_whenRouteDoesNotExist() throws Exception {
        doThrow(new RouteNotFoundException(999L))
                .when(routeService).deleteRoute(eq(999L), anyString());

        mockMvc.perform(delete("/api/routes/999").with(csrf()))
                .andExpect(status().isNotFound());
    }
}
