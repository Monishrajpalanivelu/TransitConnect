package com.connect.transitconnect.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StopDTO implements Serializable {
    @NotBlank(message = "Stop location must not be blank")
    private String location;
    private Double latitude;
    private Double longitude;
}
