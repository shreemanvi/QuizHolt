FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y maven

RUN mvn -f backend/pom.xml clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "backend/target/quiz-app-backend-1.0.0.jar"]
