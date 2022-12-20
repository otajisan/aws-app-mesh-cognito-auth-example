package com.example.backend

import com.amazonaws.xray.spring.aop.XRayEnabled
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@XRayEnabled
@RestController
@RequestMapping("/greeting")
class GreetingController {

    /**
     * Greeting message
     *
     * @return Greeting message.
     */
    @Operation(summary = "greeting", description = "greeting")
    @ApiResponse(responseCode = "200", description = "Success")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping(value = ["/to/{name}"])
    fun to(@PathVariable name: String): String = "Hello $name!"

    /**
     * Ping
     *
     * @return pong
     */
    @Operation(summary = "ping")
    @ApiResponse(responseCode = "200", description = "Success")
    @ResponseStatus(HttpStatus.OK)
    @GetMapping(value = ["/ping"])
    fun ping(): String = "pong"
}
