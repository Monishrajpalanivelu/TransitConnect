package com.connect.transitconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteEntity {

    @Id //primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Keep insertion order: stops[0] -> stops[1] -> ...
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "route_id")
    @OrderColumn(name = "stop_order")
    private List<StopEntity> stops;

    // hops[i] corresponds to stops[i] -> stops[i+1]
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "route_id")
    @OrderColumn(name = "hop_order")
    private List<HopEntity> hops;
}
