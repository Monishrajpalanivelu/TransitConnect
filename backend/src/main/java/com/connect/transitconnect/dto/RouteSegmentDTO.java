package com.connect.transitconnect.dto;

import lombok.*;

import java.util.List;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteSegmentDTO implements Serializable {
    private List<StopDTO> segmentStops;
    private List<HopDTO> segmentHops;
    private Integer totalCost;
    private Integer totalDuration;
    private Integer totalDistance;
    private Integer stopsCount;
    /** Number of route transfers (vehicle changes) in this path. 0 = direct service. */
    private Integer transferCount;
}
