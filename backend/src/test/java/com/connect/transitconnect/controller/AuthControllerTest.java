package com.connect.transitconnect.controller;

import com.connect.transitconnect.dto.LoginRequest;
import com.connect.transitconnect.dto.RegisterRequest;
import com.connect.transitconnect.security.JwtUtil;
import com.connect.transitconnect.service.AuthService;
import com.connect.transitconnect.service.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc (HTTP layer) tests for AuthController.
 *
 * /auth/** is permitAll() in SecurityConfig.
 * @WithMockUser is used on each test (instead of @WithAnonymousUser) because the
 * @WebMvcTest slice creates a duplicate InMemoryUserDetailsManager alongside
 * @MockBean CustomUserDetailsService, which breaks anonymous-user access even on
 * permitAll() routes. @WithMockUser injects authentication before filters run,
 * bypassing that issue — the controller behaviour under test is unaffected.
 * JwtUtil and CustomUserDetailsService are mocked to satisfy JwtFilter's dependencies.
 */
@WebMvcTest(value = AuthController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
class AuthControllerTest {

    @Autowired MockMvc       mockMvc;
    @Autowired ObjectMapper  objectMapper;

    @MockBean AuthService              authService;
    @MockBean JwtUtil                  jwtUtil;            // satisfies JwtFilter's autowired dependency
    @MockBean CustomUserDetailsService userDetailsService; // satisfies JwtFilter's autowired dependency

    // -------------------------------------------------------------------------
    // POST /auth/login
    // -------------------------------------------------------------------------

    @Test
    @WithMockUser
    void login_returns200WithTokenAndRole_whenCredentialsAreValid() throws Exception {
        when(authService.authenticate("alice", "secret")).thenReturn("mock.jwt.token");
        when(authService.getUserRole("alice")).thenReturn("ADMIN");

        LoginRequest req = new LoginRequest();
        req.setUsername("alice");
        req.setPassword("secret");

        mockMvc.perform(post("/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    // -------------------------------------------------------------------------
    // POST /auth/register
    // -------------------------------------------------------------------------

    @Test
    @WithMockUser
    void register_returns200_whenRegistrationSucceeds() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn("User registered successfully");

        RegisterRequest req = new RegisterRequest();
        req.setUsername("bob");
        req.setPassword("pass123");
        req.setEmail("bob@example.com");
        req.setRole("USER");

        mockMvc.perform(post("/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("User registered successfully"));
    }

    @Test
    @WithMockUser
    void register_returns500_whenUsernameAlreadyExists() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Username already exists"));

        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice"); // already registered
        req.setPassword("other");
        req.setEmail("other@example.com");

        mockMvc.perform(post("/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isInternalServerError());
    }
}
