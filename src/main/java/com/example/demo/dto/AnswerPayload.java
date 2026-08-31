package com.example.demo.dto;

public class AnswerPayload {
    private String username;
    private int selectedOption;
    private int questionIndex;
    private int timeRemaining; // Added for speed scoring!

    public AnswerPayload() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public int getSelectedOption() { return selectedOption; }
    public void setSelectedOption(int selectedOption) { this.selectedOption = selectedOption; }
    public int getQuestionIndex() { return questionIndex; }
    public void setQuestionIndex(int questionIndex) { this.questionIndex = questionIndex; }
    public int getTimeRemaining() { return timeRemaining; }
    public void setTimeRemaining(int timeRemaining) { this.timeRemaining = timeRemaining; }
}
