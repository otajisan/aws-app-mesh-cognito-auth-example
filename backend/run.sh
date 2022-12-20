#!/bin/bash

./gradlew build

OTEL_EXPORTER_OTLP_ENDPOINT="http://0.0.0.0:4317" \
  OTEL_RESOURCE_ATTRIBUTES=service.name=backend \
  java \
    -javaagent:opentelemetry-javaagent.jar \
    -jar ./build/libs/backend-0.0.1-SNAPSHOT.jar

