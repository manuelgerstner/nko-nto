FROM eclipse-temurin:21-jdk AS TEMP_BUILD_IMAGE
ENV APP_HOME=/usr/app/
WORKDIR $APP_HOME
COPY src/main/resources/firebase-config.json build.gradle.kts settings.gradle.kts gradlew $APP_HOME
COPY gradle $APP_HOME/gradle
RUN ./gradlew build || return 0
COPY . .
RUN ./gradlew build

FROM eclipse-temurin:21-jdk
ENV APP_HOME=/usr/app/
WORKDIR $APP_HOME
COPY --from=TEMP_BUILD_IMAGE $APP_HOME/build/libs/nko-nto-backend-0.0.1-SNAPSHOT.jar app.jar
COPY --from=TEMP_BUILD_IMAGE $APP_HOME/firebase-config.json .
COPY --from=TEMP_BUILD_IMAGE $APP_HOME/src/main/resources/xsd xsd
COPY --from=TEMP_BUILD_IMAGE $APP_HOME/src/main/resources/kosit kosit
EXPOSE 10001
CMD ["sh", "-c", "java -jar app.jar"]