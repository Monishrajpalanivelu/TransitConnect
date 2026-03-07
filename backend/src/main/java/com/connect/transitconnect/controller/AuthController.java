package com.connect.transitconnect.controller;

import com.connect.transitconnect.dto.AuthResponse;
import com.connect.transitconnect.dto.LoginRequest;
import com.connect.transitconnect.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = { "http://localhost:3000", "https://transitconnect-production.up.railway.app" })
public class AuthController {

      private final AuthService authService;

      public AuthController(AuthService authService) {
            this.authService = authService;
      }

      @PostMapping("/login")
      public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
            String token = authService.authenticate(request.getUsername(), request.getPassword());
            String role = authService.getUserRole(request.getUsername());
            return ResponseEntity.ok(new AuthResponse(token, role));
      }

      @PostMapping("/register")
      public ResponseEntity<String> register(@RequestBody com.connect.transitconnect.dto.RegisterRequest request) {
            return ResponseEntity.ok(authService.register(request));
      }
}
