package com.example.backend

import com.amazonaws.xray.spring.aop.BaseAbstractXRayInterceptor
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Pointcut
import org.springframework.stereotype.Component

/*

@Aspect
@Component
class AWSXrayInspector : BaseAbstractXRayInterceptor() {

    @Pointcut("@within(com.amazonaws.xray.spring.aop.XRayEnabled)")
    public override fun xrayEnabledClasses() {
        println("I am inside the class");
    }
}

 */
