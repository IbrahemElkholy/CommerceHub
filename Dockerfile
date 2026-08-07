# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY commercehub-common/pom.xml commercehub-common/
COPY commercehub-identity/pom.xml commercehub-identity/
COPY commercehub-catalog/pom.xml commercehub-catalog/
COPY commercehub-inventory/pom.xml commercehub-inventory/
COPY commercehub-cart/pom.xml commercehub-cart/
COPY commercehub-order/pom.xml commercehub-order/
COPY commercehub-payment/pom.xml commercehub-payment/
COPY commercehub-shipping/pom.xml commercehub-shipping/
COPY commercehub-notifications/pom.xml commercehub-notifications/
COPY commercehub-reviews/pom.xml commercehub-reviews/
COPY commercehub-promotions/pom.xml commercehub-promotions/
COPY commercehub-analytics/pom.xml commercehub-analytics/
COPY commercehub-wishlist/pom.xml commercehub-wishlist/
COPY commercehub-app/pom.xml commercehub-app/

RUN mvn dependency:go-offline -B

COPY . .
RUN mvn clean package -DskipTests -B

# Stage 2: Run
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S commercehub && adduser -S commercehub -G commercehub
USER commercehub

COPY --from=build /app/commercehub-app/target/*.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
