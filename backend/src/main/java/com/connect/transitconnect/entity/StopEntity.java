package com.connect.transitconnect.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "stops",
        indexes = {
                @Index(name = "idx_stop_location",       columnList = "location",       unique = true),
                @Index(name = "idx_stop_canonical_name", columnList = "canonical_name", unique = true)
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_stop_location",       columnNames = "location"),
                @UniqueConstraint(name = "uq_stop_canonical_name", columnNames = "canonical_name")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StopEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Original, human-readable name as entered by the user. */
    @Column(nullable = false, unique = true)
    private String location;

    /**
     * Normalized key: lowercase, only a-z, 0-9, spaces. Stripped of punctuation/symbols.
     * Used for graph keys and deduplication to prevent "Bengaluru" vs "bengaluru!" becoming
     * two separate nodes.
     */
    @Column(name = "canonical_name", nullable = false, unique = true)
    private String canonicalName;

    private Double latitude;
    private Double longitude;
}
