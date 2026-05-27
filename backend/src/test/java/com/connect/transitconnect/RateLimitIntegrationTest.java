package com.connect.transitconnect;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.boot.test.context.SpringBootTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "ratelimittest", roles = {"USER"})
    public void testRateLimitingOnApiRoutes() throws Exception {
        // Send 20 requests which should be allowed under the rate limit of 20 per minute
        for (int i = 1; i <= 20; i++) {
            mockMvc.perform(get("/api/routes/stops"))
                    .andExpect(status().isOk());
        }

        // The 21st request should be rate-limited and return 429 Too Many Requests
        mockMvc.perform(get("/api/routes/stops"))
                .andExpect(status().is4xxClientError())
                .andExpect(status().is(429))
                .andExpect(content().string("Too many requests. Please try again later."));
    }
}
