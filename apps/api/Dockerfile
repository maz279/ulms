# ULMS API — multi-stage build (PLANNING/10 §1: distroless-style runtime, one artifact)
FROM gradle:8-jdk21 AS build
WORKDIR /src
COPY build.gradle.kts settings.gradle.kts ./
# cache deps first
RUN gradle --no-daemon dependencies -q > /dev/null || true
COPY src ./src
RUN gradle --no-daemon bootJar -q

FROM eclipse-temurin:21-jre-jammy
# (glibc base — netty needs libgcc_s.so.1, missing on alpine musl)
RUN groupadd -r ulms && useradd -r -g ulms ulms
USER ulms
WORKDIR /app
COPY --from=build /src/build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8081
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseZGC"
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
