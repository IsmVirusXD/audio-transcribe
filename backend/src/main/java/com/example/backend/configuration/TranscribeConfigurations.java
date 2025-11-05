package com.example.backend.configuration;

import com.example.backend.services.TranscribeService;
import com.example.backend.services.TranscribeServicesImp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.transcribestreaming.TranscribeStreamingAsyncClient;

@Configuration
public class TranscribeConfigurations {
    @Value(value = "${aws.accesskey}")
    private String accesskey;

    @Value(value = "${aws.secretkey}")
    private String secretkey;

    @Bean
    public TranscribeStreamingAsyncClient transcribeStreamingAsyncClient(){
        return TranscribeStreamingAsyncClient.builder()
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accesskey,secretkey)
                        )
                )
                .region(Region.US_EAST_1)
                .build();
    }

    @Bean
    TranscribeService transcribeServices(TranscribeStreamingAsyncClient client){
        return new TranscribeServicesImp(client);
    }
}
