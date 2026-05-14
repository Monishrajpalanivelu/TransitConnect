package com.connect.transitconnect.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StopDTO {
    @NotBlank(message = "Stop location must not be blank")
    private String location;
    private Double latitude;
    private Double longitude;
}
