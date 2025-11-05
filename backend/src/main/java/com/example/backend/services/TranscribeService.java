package com.example.backend.services;

import software.amazon.awssdk.services.transcribestreaming.model.StartStreamTranscriptionRequest;
import software.amazon.awssdk.services.transcribestreaming.model.StartStreamTranscriptionResponseHandler;

import java.io.File;

public interface TranscribeService {
    public StartStreamTranscriptionRequest getRequest(String language, int sampleRate);
    public StartStreamTranscriptionResponseHandler getResponseHandler();
    public String transcription(String language, File audioFile);

}
