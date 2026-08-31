package com.example.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "sessions")
public class QuizSession {
    @Id
    private String roomCode;
    private String quizId;
    private String quizTitle;
    private String status; 
    private int currentQuestionIndex;
    private Map<String, Integer> scores = new HashMap<>();

    public QuizSession() {}

    public QuizSession(String roomCode, String quizId, String quizTitle) {
        this.roomCode = roomCode;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.status = "WAITING";
        this.currentQuestionIndex = 0;
    }

    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }
    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(int currentQuestionIndex) { this.currentQuestionIndex = currentQuestionIndex; }
    public Map<String, Integer> getScores() { return scores; }
    public void setScores(Map<String, Integer> scores) { this.scores = scores; }
}
