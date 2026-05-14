package com.connect.transitconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponseDTO {
    private Long id;
    private String createdBy;
    private Instant createdAt;
    private List<StopDTO> stops;
    private List<HopDTO> hops;
}
