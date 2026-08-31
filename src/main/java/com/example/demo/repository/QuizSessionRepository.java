package com.example.demo.repository;

import com.example.demo.model.QuizSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizSessionRepository extends MongoRepository<QuizSession, String> {
}
