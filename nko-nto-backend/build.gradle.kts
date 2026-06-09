plugins {
    id("org.springframework.boot") version "3.3.5"
    id("io.spring.dependency-management") version "1.1.6"
    java
}

group = "de.nkotech"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Validation
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // JPA
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // PostgreSQL
    runtimeOnly("org.postgresql:postgresql")

    // Flyway (flyway-database-postgresql required separately since Flyway 10)
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // Security
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Firebase Admin SDK (token verification)
    implementation("com.google.firebase:firebase-admin:9.4.1")

    // OpenAPI / Swagger UI
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
