package com.connect.transitconnect.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteSegmentDTO {
    private List<StopDTO> segmentStops;
    private List<HopDTO> segmentHops;
    private Integer totalCost;
    private Integer totalDuration;
    private Integer totalDistance;
    private Integer stopsCount;
}
