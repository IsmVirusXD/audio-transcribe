package com.example.backend.controller;

import com.example.backend.services.TranscribeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/transcribe")
@CrossOrigin(origins = "http://localhost:3000")
public class TranscribeController {
    private final TranscribeService transcribeServices;

    public TranscribeController(TranscribeService transcribeServices){
        this.transcribeServices = transcribeServices;
    }


    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<String> streamingSession(InputStream inputStream) throws IOException {
        System.out.println(inputStream);
        File file = File.createTempFile("audio-", ".wav");
        Files.copy(inputStream, file.toPath(), StandardCopyOption.REPLACE_EXISTING);
        System.out.println(file.getTotalSpace());
        file.deleteOnExit();

        try {
            if (!file.exists()){
                return ResponseEntity.badRequest().body("Nenhum Arquivo Enviado");
            } else {
                String response;
                response = transcribeServices.transcription("pt-BR",file);
                return ResponseEntity.ok().body(response);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro" + e.toString());
        }
    }
}
