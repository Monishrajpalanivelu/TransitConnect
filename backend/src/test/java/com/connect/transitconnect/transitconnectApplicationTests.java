package com.connect.transitconnect;

import com.connect.transitconnect.controller.AuthController;
import com.connect.transitconnect.security.JwtUtil;
import com.connect.transitconnect.service.AuthService;
import com.connect.transitconnect.service.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Smoke test — verifies the Spring web layer assembles without errors.
 * Uses @WebMvcTest (sliced context) so no Docker, DB, or Redis is required.
 */
@WebMvcTest(value = AuthController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
class transitconnectApplicationTests {

    @Autowired MockMvc mockMvc;

    @MockBean AuthService              authService;
    @MockBean JwtUtil                  jwtUtil;
    @MockBean CustomUserDetailsService userDetailsService;

    @Test
    void contextLoads() {
        // If this method runs, the Spring web slice assembled without errors.
        // mockMvc being non-null further confirms the DispatcherServlet is wired.
        assert mockMvc != null;
    }
}
