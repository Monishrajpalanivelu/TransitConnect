package com.connect.transitconnect.exception;

/**
 * Thrown when a route submission is invalid.
 * Maps to HTTP 400 via GlobalExceptionHandler.
 * Replaces raw IllegalArgumentException which returned 500.
 */
public class InvalidRouteException extends RuntimeException {
    public InvalidRouteException(String message) {
        super(message);
    }
}