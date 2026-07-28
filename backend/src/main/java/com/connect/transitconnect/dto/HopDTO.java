package com.connect.transitconnect.dto;

import jakarta.validation.constraints.Min;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HopDTO implements Serializable {

    @Min(value = 0, message = "Cost must be >= 0")
    private Integer cost;

    @Min(value = 0, message = "Duration must be >= 0")
    private Integer duration;

    private Integer distance;

    /** Transport mode as a string. Parsed to TransportMode enum in the service layer. */
    private String mode;

    /**
     * If true this hop is one-directional (from → to only).
     * Defaults to false (bidirectional) if not provided by the client.
     */
    private Boolean isOneWay;
}
