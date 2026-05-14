package com.connect.transitconnect.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "stops",
        indexes = {
                @Index(name = "idx_stop_location", columnList = "location", unique = true)
        }, uniqueConstraints = {
        @UniqueConstraint(name = "uq_stop_location", columnNames = "location")
}
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StopEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String location;
    private Double latitude;
    private Double longitude;
}
