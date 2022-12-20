package com.example.backend

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
internal class GreetingControllerTests {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `respond greeting message`() {
        mockMvc.perform(get("/greeting/to/mtaji"))
            .andExpect(status().isOk)
            .andExpect(content().string("Hello mtaji!"))
    }

    @Test
    fun `respond pong`() {
        mockMvc.perform(get("/greeting/ping"))
            .andExpect(status().isOk)
            .andExpect(content().string("pong"))
    }


}
