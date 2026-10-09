# Imagem unica: o jogo (build do Vite) e servido pelo proprio Spring Boot, junto com a API.

# --- 1. Frontend -------------------------------------------------------------
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- 2. Backend --------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS backend
WORKDIR /app/backend
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY backend/src src
COPY --from=frontend /app/frontend/dist src/main/resources/static
# Os testes rodam no CI; aqui so empacota.
RUN ./mvnw -B -q package -DskipTests -Djacoco.skip=true

# --- 3. Execucao -------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S clonemon && adduser -S clonemon -G clonemon
USER clonemon
WORKDIR /app
COPY --from=backend /app/backend/target/backend-*.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k"
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
