package com.connect.transitconnect.dto;

import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HopDTO {
    @Min(value = 0, message = "Cost must be >= 0")
    private Integer cost;

    @Min(value = 0, message = "Duration must be >= 0")
    private Integer duration;

    private String mode;
}
