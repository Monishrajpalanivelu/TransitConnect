package com.connect.transitconnect;

import com.connect.transitconnect.dto.HopDTO;
import com.connect.transitconnect.dto.RouteInputDTO;
import com.connect.transitconnect.dto.StopDTO;
import com.connect.transitconnect.entity.RouteEntity;
import com.connect.transitconnect.service.RouteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class RouteServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private RouteService routeService;

    @Test
    void testSaveAndRetrieveRoute() {
        // Arrange: Create a sample route payload
        StopDTO stop1 = new StopDTO("Test Station A", 12.9716, 77.5946);
        StopDTO stop2 = new StopDTO("Test Station B", 12.9352, 77.6245);
        HopDTO hop = new HopDTO(15, 30, "Bus");

        RouteInputDTO inputDTO = new RouteInputDTO();
        inputDTO.setStops(List.of(stop1, stop2));
        inputDTO.setHops(List.of(hop));

        // Act: Save the route using the service
        RouteEntity result = routeService.saveRoute(inputDTO, "testuser");

        // Assert: Ensure it was successfully saved to the Docker database
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals("testuser", result.getCreatedBy());

        // Verify that we can fetch the stop names back
        List<String> stops = routeService.getAllStopNames();
        assertTrue(stops.contains("Test Station A"));
        assertTrue(stops.contains("Test Station B"));
    }
}
