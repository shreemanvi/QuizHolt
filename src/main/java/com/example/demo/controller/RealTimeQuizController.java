package com.example.demo.controller;

import com.example.demo.dto.AnswerPayload;
import com.example.demo.dto.LeaderboardEntry;
import com.example.demo.model.Quiz;
import com.example.demo.model.QuizSession;
import com.example.demo.repository.QuizRepository;
import com.example.demo.repository.QuizSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.stream.Collectors;

@Controller
public class RealTimeQuizController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private QuizSessionRepository sessionRepository;

    @Autowired
    private QuizRepository quizRepository;

    @MessageMapping("/join/{roomCode}")
    public void joinRoom(@DestinationVariable String roomCode, @Payload String username) {
        Optional<QuizSession> sessionOpt = sessionRepository.findById(roomCode);
        if (sessionOpt.isPresent()) {
            QuizSession session = sessionOpt.get();
            session.getScores().putIfAbsent(username, 0);
            sessionRepository.save(session);
            messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/participants", session.getScores().keySet());
        }
    }

    @MessageMapping("/next-question/{roomCode}")
    public void nextQuestion(@DestinationVariable String roomCode, @Payload int nextIndex) {
        Optional<QuizSession> sessionOpt = sessionRepository.findById(roomCode);
        if (sessionOpt.isPresent()) {
            QuizSession session = sessionOpt.get();
            session.setStatus("ACTIVE");
            session.setCurrentQuestionIndex(nextIndex);
            sessionRepository.save(session);
            messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/question", nextIndex);
        }
    }

    @MessageMapping("/submit-answer/{roomCode}")
    public void submitAnswer(@DestinationVariable String roomCode, @Payload AnswerPayload payload) {
        Optional<QuizSession> sessionOpt = sessionRepository.findById(roomCode);
        if (sessionOpt.isPresent()) {
            QuizSession session = sessionOpt.get();
            Quiz quiz = quizRepository.findById(session.getQuizId()).orElse(null);

            if (quiz != null && payload.getQuestionIndex() < quiz.getQuestions().size()) {
                int correctIdx = quiz.getQuestions().get(payload.getQuestionIndex()).getCorrectOptionIndex();
                if (payload.getSelectedOption() == correctIdx) {
                    
                    // SPEED-BASED SCORING LOGIC
                    int basePoints = 500;
                    // Assuming a 15-second timer
                    int speedBonus = (int) ((payload.getTimeRemaining() / 15.0) * 500); 
                    int pointsEarned = basePoints + speedBonus;

                    int currentScore = session.getScores().getOrDefault(payload.getUsername(), 0);
                    session.getScores().put(payload.getUsername(), currentScore + pointsEarned);
                    sessionRepository.save(session);
                }
            }

            List<LeaderboardEntry> leaderboard = session.getScores().entrySet().stream()
                    .map(e -> new LeaderboardEntry(e.getKey(), e.getValue()))
                    .sorted((a, b) -> Integer.compare(b.getScore(), a.getScore()))
                    .collect(Collectors.toList());

            messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/leaderboard", leaderboard);
        }
    }

    @MessageMapping("/end-quiz/{roomCode}")
    public void endQuiz(@DestinationVariable String roomCode) {
        Optional<QuizSession> sessionOpt = sessionRepository.findById(roomCode);
        if (sessionOpt.isPresent()) {
            QuizSession session = sessionOpt.get();
            session.setStatus("FINISHED");
            sessionRepository.save(session);
            messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/end", "QUIZ_FINISHED");
        }
    }
}
