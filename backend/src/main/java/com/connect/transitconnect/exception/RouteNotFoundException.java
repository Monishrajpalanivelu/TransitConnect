package com.connect.transitconnect.exception;

public class RouteNotFoundException extends RuntimeException {
    public RouteNotFoundException(Long id) {
        super("Route not found with id: " + id);
    }
}