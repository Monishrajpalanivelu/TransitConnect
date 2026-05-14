package com.connect.transitconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteInputDTO {
    @NotEmpty(message = "Route must contain at least 2 stops")
    @Size(min = 2, message = "Route must contain at least 2 stops")
    @Valid
    private List<StopDTO> stops;

    @NotEmpty(message = "Route must contain at least 1 hop")
    @Valid
    private List<HopDTO> hops;
}
