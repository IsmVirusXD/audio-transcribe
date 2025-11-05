package com.example.backend.services;

import com.example.backend.services.ByteToAudioEventSubscription;
import org.reactivestreams.Subscription;
import software.amazon.awssdk.services.transcribestreaming.model.AudioStream;
import org.reactivestreams.Publisher;
import org.reactivestreams.Subscriber;

import java.io.InputStream;

public class AudioStreamPublisher implements Publisher<AudioStream> {
    private final InputStream inputStream;
    private static Subscription currentSubscription;


    public AudioStreamPublisher(InputStream inputStream) {
        this.inputStream = inputStream;
    }

    @Override
    public void subscribe(Subscriber<? super AudioStream> s) {

        if (currentSubscription == null) {
            currentSubscription = new ByteToAudioEventSubscription(s, inputStream);
        } else {
            currentSubscription.cancel();
            currentSubscription = new ByteToAudioEventSubscription(s, inputStream);
        }
        s.onSubscribe(currentSubscription);
    }
}

