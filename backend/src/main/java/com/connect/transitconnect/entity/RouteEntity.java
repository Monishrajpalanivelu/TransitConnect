package com.connect.transitconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "routes",
        indexes = {
                @Index(name = "idx_route_created_by", columnList = "created_by")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteEntity {

    @Id //primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    /**
     * ManyToMany — one Stop can belong to many Routes.
     * @OrderColumn preserves ordered sequence in join table.
     * No CascadeType — stops have their own lifecycle (shared).
     */
    @ManyToMany
    @JoinTable(
            name = "route_stops",
            joinColumns = @JoinColumn(name = "route_id"),
            inverseJoinColumns = @JoinColumn(name = "stop_id"),
            indexes = {
                    @Index(name = "idx_route_stops_route", columnList = "route_id"),
                    @Index(name = "idx_route_stops_stop",  columnList = "stop_id")
            }
    )
    @OrderColumn(name = "stop_sequence")
    @org.hibernate.annotations.BatchSize(size = 20)
    private List<StopEntity> stops = new ArrayList<>();

    /**
     * Hops are owned by route — cascade ALL + orphanRemoval.
     */
    @OneToMany(
            mappedBy = "route",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("sequenceOrder ASC")
    @org.hibernate.annotations.BatchSize(size = 20)
    private List<HopEntity> hops = new ArrayList<>();
}
