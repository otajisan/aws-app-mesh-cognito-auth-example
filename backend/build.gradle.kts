import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.0.0-RC2"
    id("io.spring.dependency-management") version "1.1.0"
    kotlin("jvm") version "1.7.21"
    kotlin("plugin.spring") version "1.7.21"
    id("com.google.cloud.tools.jib") version "3.2.1"
    jacoco
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

val buildNumber by extra("1")

repositories {
    mavenCentral()
    maven { url = uri("https://repo.spring.io/milestone") }
}

jib {

    from {
        image = "openjdk:17-jdk-slim-bullseye"
    }

    to {
        image =
            System.getenv("AWS_ACCOUNT_ID") + ".dkr.ecr." + System.getenv("AWS_REGION") + ".amazonaws.com/mtaji-test-app-mesh-be"
        tags = setOf("$version.${extra["buildNumber"]}")
    }

    container {
        creationTime = "USE_CURRENT_TIMESTAMP"
        jvmFlags = listOf(
            "-Xms512m",
            "-Xmx512m",
            "-Duser.language=ja",
            "-Duser.timezone=Asia/Tokyo",
            "-Dspring.devtools.restart.enabled=false",
        )
        environment = mapOf(
            "SPRING_PROFILES_ACTIVE" to "production"
        )
        workingDirectory = "/backend"
        volumes = listOf("/data")
        ports = listOf(
            "9080",
            "39080"
        )
    }
}

// NOTE: https://github.com/aws/aws-xray-sdk-java/issues/364
//val tomcatVersion = "9.0.70"
val awsXRayVersion = "2.13.0"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-web")

    // NOTE:
    // https://spring.pleiades.io/spring-boot/docs/current/reference/html/getting-started.html#getting-started.system-requirements.servlet-containers
    // https://tomcat.apache.org/whichversion.html
    //implementation("org.apache.tomcat.embed:tomcat-embed-core:$tomcatVersion")
    //implementation("org.apache.tomcat.embed:tomcat-embed-jasper:$tomcatVersion")
    //implementation("org.apache.tomcat.embed:tomcat-embed-el:$tomcatVersion")
    //implementation("org.apache.tomcat.embed:tomcat-embed-websocket:$tomcatVersion")

    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-aop")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")

    // Open API
    implementation("org.springdoc:springdoc-openapi-kotlin:1.6.13")
    implementation("org.springdoc:springdoc-openapi-webmvc-core:1.6.13")

    // Logging
    implementation("net.logstash.logback:logstash-logback-encoder:7.2")

    // Monitoring
    implementation("io.micrometer:micrometer-registry-prometheus:1.10.2")

    // AWS X-Ray
    // https://docs.aws.amazon.com/ja_jp/xray/latest/devguide/xray-sdk-java.html
    implementation("com.amazonaws:aws-xray-recorder-sdk-core:$awsXRayVersion")
    implementation("com.amazonaws:aws-xray-recorder-sdk-aws-sdk:$awsXRayVersion")
    implementation("com.amazonaws:aws-xray-recorder-sdk-aws-sdk-instrumentor:$awsXRayVersion")
    implementation("com.amazonaws:aws-xray-recorder-sdk-spring:$awsXRayVersion")
    implementation("com.amazonaws:aws-xray-recorder-sdk-sql:$awsXRayVersion")

    // Open Telemetry
    implementation("io.opentelemetry:opentelemetry-api:1.21.0")
    implementation("io.opentelemetry:opentelemetry-exporters-prometheus:0.9.1")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.mockito:mockito-inline:4.8.0")

    // Dev Tool
    developmentOnly("org.springframework.boot:spring-boot-devtools")
}

// https://spring.pleiades.io/spring-boot/docs/current/gradle-plugin/reference/htmlsingle/#packaging-executable.configuring.main-class
springBoot {
    mainClass.set("com.example.backend.BackendApplicationKt")
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    manifest {
        attributes("Start-Class" to "com.example.backend.BackendApplicationKt")
    }
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// Coverage Report
jacoco {
    toolVersion = "0.8.7"
    reportsDirectory.set(layout.buildDirectory.dir("reports/jacoco"))
}

tasks.test {
    finalizedBy(tasks.jacocoTestReport) // report is always generated after tests run
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        csv.required.set(false)
        html.outputLocation.set(layout.buildDirectory.dir("jacocoHtml"))
    }

    dependsOn(tasks.test)
}
