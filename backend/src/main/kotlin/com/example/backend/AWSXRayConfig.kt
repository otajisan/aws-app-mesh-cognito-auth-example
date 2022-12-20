package com.example.backend

import com.amazonaws.xray.AWSXRay
import com.amazonaws.xray.AWSXRayRecorderBuilder
import com.amazonaws.xray.javax.servlet.AWSXRayServletFilter
import com.amazonaws.xray.strategy.LogErrorContextMissingStrategy
import jakarta.annotation.PostConstruct
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


/*
@Configuration
class AWSXRayConfig {

    // NOTE: log error when suitable segment not found
    @PostConstruct
    fun disableXRayComplaintsForMainClasses() {
        val builder = AWSXRayRecorderBuilder.standard()
            .withContextMissingStrategy(LogErrorContextMissingStrategy())
        AWSXRay.setGlobalRecorder(builder.build())
    }

    @Bean
    fun tracingFilter() = AWSXRayServletFilter("backend")
}


 */
