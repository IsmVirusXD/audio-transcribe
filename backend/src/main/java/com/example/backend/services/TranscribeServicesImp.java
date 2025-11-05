package com.example.backend.services;

import software.amazon.awssdk.services.transcribestreaming.TranscribeStreamingAsyncClient;
import software.amazon.awssdk.services.transcribestreaming.model.*;

import java.io.*;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class TranscribeServicesImp implements TranscribeService {
    private String finalResult = "";
    private final TranscribeStreamingAsyncClient client;
    public static final int MAX_TIMEOUT_MS = 2 * 60 * 1000;

    public TranscribeServicesImp(TranscribeStreamingAsyncClient client) {this.client = client;}

    public StartStreamTranscriptionRequest getRequest(String language, int sampleRate) {
        return StartStreamTranscriptionRequest.builder()
                .languageCode(LanguageCode.PT_BR.toString())
                .mediaEncoding(MediaEncoding.PCM)
                .mediaSampleRateHertz(sampleRate)
                .build();
    }

    public StartStreamTranscriptionResponseHandler getResponseHandler() {
        return StartStreamTranscriptionResponseHandler.builder()
                .onResponse(r -> {
                    System.out.println("== Starting Transcription ==");
                })
                .onError(e -> {
                    System.out.println(e.getMessage());
                    StringWriter sw = new StringWriter();
                    e.printStackTrace(new PrintWriter(sw));
                    System.out.println("Error Occurred: " + sw.toString());
                })
                .onComplete(() -> {
                    System.out.println("== Transcription Complete ==");
                })
                .subscriber(event -> {
                    List<Result> results = ((TranscriptEvent) event).transcript().results();
                    if (results.size() > 0) {
                        if (!results.getFirst().alternatives().getFirst().transcript().isEmpty()) {
                            finalResult = results.getFirst().alternatives().getFirst().transcript();
                            System.out.println(finalResult);
                        }
                    }
                })
                .build();
    }

    public String transcription(String language, File audioFile)
    {
        try {
            AudioStreamPublisher audioStream = new AudioStreamPublisher(new FileInputStream(audioFile));
            CompletableFuture<Void> result = client.startStreamTranscription(
                    getRequest(language, 16000),
                    audioStream,
                    getResponseHandler()
            );
            result.get(MAX_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        } catch (FileNotFoundException | ExecutionException | InterruptedException | TimeoutException e) {
            throw new RuntimeException(e);
        }
        client.close();
        if(finalResult.isEmpty())
        {
            return "No content in the audio";
        } else {
            return finalResult;
        }
    }


}
