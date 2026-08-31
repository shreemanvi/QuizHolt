package com.example.demo.controller;

import com.example.demo.model.Quiz;
import com.example.demo.model.QuizSession;
import com.example.demo.repository.QuizRepository;
import com.example.demo.repository.QuizSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizSessionRepository sessionRepository;

    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@RequestBody Quiz quiz) {
        return ResponseEntity.ok(quizRepository.save(quiz));
    }

    @GetMapping
    public ResponseEntity<List<Quiz>> getAllQuizzes() {
        return ResponseEntity.ok(quizRepository.findAll());
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<QuizSession> startSession(@PathVariable String id) {
        Quiz quiz = quizRepository.findById(id).orElseThrow(() -> new RuntimeException("Quiz not found"));
        // Generates a random 6-character string/number combination for the room code
        String roomCode = String.valueOf(100000 + new Random().nextInt(900000)); 
        QuizSession session = new QuizSession(roomCode, quiz.getId(), quiz.getTitle());
        return ResponseEntity.ok(sessionRepository.save(session));
    }

    @GetMapping("/session/{roomCode}")
    public ResponseEntity<QuizSession> getSession(@PathVariable String roomCode) {
        return sessionRepository.findById(roomCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable String id) {
        return quizRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/history")
    public ResponseEntity<List<QuizSession>> getQuizHistory() {
        return ResponseEntity.ok(sessionRepository.findAll());
    }
}
