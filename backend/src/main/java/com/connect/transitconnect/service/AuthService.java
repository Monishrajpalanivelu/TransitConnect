package com.connect.transitconnect.service;

import com.connect.transitconnect.repository.UserRepository;
import com.connect.transitconnect.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

      @Autowired
      private AuthenticationManager authenticationManager;

      @Autowired
      private JwtUtil jwtUtil;

      @Autowired
      private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

      @Autowired
      private UserRepository userRepository;

      public String authenticate(String username, String password) {
            Authentication authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(username, password));

            if (authentication.isAuthenticated()) {
                  return jwtUtil.generateToken(username);
            } else {
                  throw new RuntimeException("Authentication failed");
            }
      }

      public String getUserRole(String username) {
            return userRepository.findByUsername(username)
                        .map(user -> user.getRole())
                        .orElse("USER");
      }

      public String register(com.connect.transitconnect.dto.RegisterRequest request) {
            if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                  throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Username already exists"
                  );
            }
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                  throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Email already exists"
                  );
            }
            com.connect.transitconnect.entity.User user = new com.connect.transitconnect.entity.User();
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmail(request.getEmail());
            user.setRole(request.getRole() != null ? request.getRole() : "USER");
            userRepository.save(user);
            return "User registered successfully";
      }
}
