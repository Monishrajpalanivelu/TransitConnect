package com.connect.transitconnect.entity;

public enum TransportMode {
    BUS,
    METRO,
    WALK,
    AUTO;

    /** Case-insensitive parse — returns BUS as a safe fallback for unknown strings */
    public static TransportMode fromString(String s) {
        if (s == null) return BUS;
        try {
            return TransportMode.valueOf(s.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return BUS;
        }
    }
}
