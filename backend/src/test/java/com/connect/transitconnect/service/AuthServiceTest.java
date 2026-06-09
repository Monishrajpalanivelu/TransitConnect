package com.connect.transitconnect.service;

import com.connect.transitconnect.dto.RegisterRequest;
import com.connect.transitconnect.entity.User;
import com.connect.transitconnect.repository.UserRepository;
import com.connect.transitconnect.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService.
 *
 * Every external dependency is mocked — no HTTP, no DB, no JWT key needed.
 * These tests verify only the AuthService business logic in isolation.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository       userRepository;
    @Mock private JwtUtil              jwtUtil;
    @Mock private PasswordEncoder      passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    // -------------------------------------------------------------------------
    // register()
    // -------------------------------------------------------------------------

    @Test
    void register_savesUserWithEncodedPassword_whenUsernameIsNew() {
        // Arrange
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setPassword("secret");
        req.setEmail("alice@example.com");
        req.setRole("USER");

        // Act
        String result = authService.register(req);

        // Assert
        assertEquals("User registered successfully", result);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("$2a$hashed", captor.getValue().getPassword(),
                "Password must be stored encoded, never plain-text");
        assertEquals("alice@example.com", captor.getValue().getEmail());
        assertEquals("USER", captor.getValue().getRole());
    }

    @Test
    void register_throwsRuntimeException_whenUsernameAlreadyExists() {
        User existing = new User();
        existing.setUsername("alice");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(existing));

        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setPassword("any");
        req.setEmail("other@example.com");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register(req));
        assertTrue(ex.getMessage().contains("already exists"),
                "Error message should mention that the username already exists");

        // Ensure no user was saved
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_assignsDefaultUserRole_whenRoleIsNull() {
        when(userRepository.findByUsername("bob")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        RegisterRequest req = new RegisterRequest();
        req.setUsername("bob");
        req.setPassword("pass");
        req.setEmail("bob@example.com");
        req.setRole(null); // no role provided

        authService.register(req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("USER", captor.getValue().getRole(),
                "Should default to 'USER' when no role is provided");
    }

    // -------------------------------------------------------------------------
    // getUserRole()
    // -------------------------------------------------------------------------

    @Test
    void getUserRole_returnsDefaultUser_whenUsernameNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        String role = authService.getUserRole("ghost");

        assertEquals("USER", role, "Should fall back to 'USER' for unknown usernames");
    }

    // -------------------------------------------------------------------------
    // authenticate()
    // -------------------------------------------------------------------------

    @Test
    void authenticate_returnsJwtToken_whenCredentialsAreValid() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(jwtUtil.generateToken("alice")).thenReturn("mock.jwt.token");

        String token = authService.authenticate("alice", "secret");

        assertEquals("mock.jwt.token", token);
    }
}
