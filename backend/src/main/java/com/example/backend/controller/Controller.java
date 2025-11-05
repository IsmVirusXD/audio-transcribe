package com.example.backend.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class Controller {

    @GetMapping("/alive")
    public ResponseEntity<String> alive(){
        return ResponseEntity.ok().body("API online");
    }
}

