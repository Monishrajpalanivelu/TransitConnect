package com.connect.transitconnect.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;

@Entity
@Table(name = "hops", indexes = {
        @Index(name = "idx_hop_from_stop", columnList = "from_stop_id"),
        @Index(name = "idx_hop_to_stop",   columnList = "to_stop_id"),
        @Index(name = "idx_hop_route",      columnList = "route_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HopEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Min(0)
    @Column(nullable = false)
    private int cost;

    @Min(0)
    @Column(nullable = false)
    private int duration;

    @Column(nullable = false)
    private int distance;

    /**
     * Transport mode stored as enum string.
     * Replaces the old free-text String to prevent typos like "bus", "Bus ", "BUS".
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransportMode mode = TransportMode.BUS;

    /**
     * If true, this hop is one-directional (from → to only).
     * The graph will NOT create a reverse edge for one-way hops.
     */
    @Column(name = "is_one_way", nullable = false)
    private boolean oneWay = false;

    @Column(name = "sequence_order", nullable = false)
    private int sequenceOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_stop_id", nullable = false)
    private StopEntity fromStop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_stop_id", nullable = false)
    private StopEntity toStop;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private RouteEntity route;
}
