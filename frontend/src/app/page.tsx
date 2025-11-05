"use client";
import { use, useEffect, useRef, useState } from "react";
import { Mic, Play, Square, Send, Trash, Pause } from "lucide-react";
import next from "next";

export default function Home() {
  //Player
  const [trancricao, setTranscricao] = useState<String>(
    "Aguardando o envio da Gravação"
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<String>("00:00");
  const [currentTime, setCurrentTime] = useState<String>("00:00");
  const [file, setFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<any | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioElem = useRef<HTMLAudioElement | null>(null);

  const [RecordRTC, setRecordRTC] = useState<any>(null);
  const [StereoAudioRecorder, setStereoAudioRecorder] = useState<any>(null);

  useEffect(() => {
    // Importação da biblioteca de gravação no clietne
    (async () => {
      const recordrtcModule = await import("recordrtc");
      setRecordRTC(() => recordrtcModule.default || recordrtcModule);
      setStereoAudioRecorder(
        () =>
          recordrtcModule.StereoAudioRecorder ||
          (recordrtcModule.default &&
            recordrtcModule.default.StereoAudioRecorder)
      );
    })();
  }, []);
  
  // Gravação
  const startRecording = async () => {
    try {
      if (!RecordRTC || !StereoAudioRecorder) {
        console.error("RecordRTC ou StereoAudioRecorder não carregado");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
        },
      });
      audioStreamRef.current = stream;
      
      const recorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: StereoAudioRecorder,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
        timeSlice: 0,
        disableLogs: false,
      });
      
      recorder.startRecording();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Erro Microfone", error);
    }
  };
  
  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stopRecording(() => {
        const blob: Blob = mediaRecorderRef.current.getBlob();
        const file = new File([blob], "gravacao.wav", {
          type: "audio/wav",
        });
        setFile(file);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      });
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop);
      }
      
      setIsRecording(false);
    }
  };

  //Apagar Audio
  const emptyAudio = () => {
    setTranscricao("Aguardando o envio da gravação");
    setIsPlaying(false);
    setAudioURL(null);
    setIsRecording(false);
    setDuration("00:00");
    setCurrentTime('00:00');
  };
  
  //Reprodução
  
  useEffect(() => {
    const song = audioElem.current
    if(!song) return
    const update = () => {
      if(!song.duration) return
      setProgress((song.currentTime / song.duration) * 100)
      const format = (s:number) => 
        `${Math.floor(s/60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

      setCurrentTime(`${format(song.currentTime)}`);
      setDuration(`${format(song.duration)}`);
    }
    
    song.addEventListener("timeupdate", update);
    
    return () => {
      song.removeEventListener("time",update);
    }
  },[audioElem.current?.onloadedmetadata])

  
    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
      if(!audioElem.current) return
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = ((e.clientX -rect.left) / rect.width) * audioElem.current.duration  
      audioElem.current.currentTime = pos;
    }

  const PlayPause = () => {
    if (audioElem.current) {
      const prevValue = isPlaying;
      if (prevValue) {
        setIsPlaying(false);
        audioElem.current.pause();
      } else {
        setIsPlaying(true);
        audioElem.current.play().catch((err) => {
          console.error("Erro ao reproduzir", err);
        });
      }
    }
  };


  const calculateTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const returnedMinutes = String(minutes).padStart(2, "0");
    const returnedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${returnedMinutes}:${returnedSeconds}`;
  };

  //Requisição API
  const submitAudio = async () => {
    try {
      console.log(file);
      setIsLoading(true);

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      };

      

      fetch("http://localhost:8080/transcribe/upload", requestOptions)
        .then((response) => {
          if (!response.ok) {
            setIsLoading(false);
            throw Error("Erro na requisição");
          }
          return response.text();
        })
        .then((data) => {
          setIsLoading(false);
          console.log("Texto retornado:", data);
          setTranscricao(data);
        })
        .catch((error) => {
          setIsLoading(false);
          console.error("Erro:", error);
        });
    } catch (error) {
      console.error("Erro Microfone", error);
    }
  };

  return (
    <main>
      <div className="bg-[#2694BF] place-items-center place-content-center w-screen h-screen p-8">
        <div className="bg-[#E1DEE7] w-[70%] h-[80%] shadow-2xl rounded-4xl flex flex-col">
          {/* Titulo */}
          <div className="bg-[#0367A6] p-7 rounded-t-4xl flex-1">
            <h1 className="text-[#fffffb] text-7xl font-semibold">
              Speech to Text
            </h1>
          </div>
          {/* Microfone */}
          <div className="p-3 flex-1">
            <div className="flex flex-row">
              <div className="flex-15">
                {isRecording ? (
                  <div className="text-lg shadow-md text-[#035AA6] rounded-full items-center flex flex-row gap-4 flex-1 max-h-20 p-5 bg-[#fffffb]">
                    <button
                      onClick={() => {
                        stopRecording();
                      }}
                      className="bg-[#2694BF] text-[#fffffb] content-center rounded-full hover:bg-[#2BC7D9]"
                    >
                      <Square className="w-[45px] h-[45px] text-center m-2" />
                    </button>
                    <p className="font-bold text-[#2694BF] flex-grow m-4">
                      Gravando
                    </p>
                    <div className="relative flex">
                      <span className="absolute w-[40px] h-[40px] animate-ping rounded-full opacity-100 bg-[#2694BF]" />
                      <span className="relative w-[40px] h-[40px] rounded-full opacity-100 bg-[#2694BF]" />
                    </div>
                  </div>
                ) : (
                  <div className="text-lg shadow-md text-[#035AA6] rounded-full items-center  flex flex-row gap-4 flex-1 max-h-20 p-5 bg-[#fffffb]">
                    <button
                      onClick={() => {
                        startRecording();
                      }}
                      className="bg-[#035AA6] text-[#fffffb] content-center rounded-full hover:bg-[#2BC7D9]"
                    >
                      <Mic className="w-[45px] h-[45px] text-center m-2" />
                    </button>
                    <p className="font-semi flex-grow  m-4">
                      Clique para começar a gravação
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  submitAudio();
                }}
                className="bg-[#035AA6] text-[#fffffb] rounded-full content-center hover:bg-[#2BC7D9] flex-1 mx-2"
              >
                <Send className="w-[55px] h-[45px] m-2" />
              </button>
            </div>
          </div>
          {/* Player */}
          {audioURL ? (
            <div className="mx-2 flex-1">
              <div className="flex">
                <div className="text-lg shadow-md text-[#035AA6] rounded-full items-center flex flex-row gap-4 flex-1 max-h-20 p-2 bg-[#fffffb]">
                  {<audio src={audioURL} ref={audioElem} preload="metadata" />}
                  <button
                    onClick={() => {
                      PlayPause();
                    }}
                    className="bg-[#035AA6] rounded-full items-center text-[#fffffb] hover:bg-[#2bc7d9]  flex-1 mx-2"
                  >
                    {isPlaying ? (
                      <Pause className="w-[45px] h-[45px] m-3" />
                    ) : (
                      <Play className="w-[45px] h-[45px] m-3" />
                    )}
                  </button>
                  <div>{currentTime}</div>
                  <div
                    className="w-full h-2 bg-[#2bc7d9] rounded-full cursor-pointer opacity-25"
                    onClick={seek}
                  >
                    <div
                      className="h-2 bg-[#035AA6] rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div>{duration}</div>
                  <button
                    onClick={() => {
                      emptyAudio();
                    }}
                    className="bg-[#035AA6] rounded-full items-center text-[#fffffb] hover:bg-[#2bc7d9]  flex-1 mx-2"
                  >
                    <Trash className="w-[45px] h-[45px] m-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-2 flex-1 opacity-50">
              <div className="flex">
                <div className="text-lg shadow-md text-[#035AA6] rounded-full items-center flex flex-row gap-4 flex-1 max-h-20 p-2 bg-[#fffffb]">
                  <button
                    onClick={() => {}}
                    className="bg-[#035AA6] rounded-full items-center text-[#fffffb] flex-1 mx-2"
                  >
                    <Play className="w-[45px] h-[45px] m-3" />
                  </button>
                  <div className="flex-15 bg-[#035AA6] h-0.5 rounded-full"></div>
                  <button
                    onClick={() => {}}
                    className="bg-[#035AA6] rounded-full items-center text-[#fffffb] flex-1 mx-2"
                  >
                    <Trash className="w-[45px] h-[45px] m-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Transcription */}
          {isLoading ?
          <div className="bg-[#FFFFFB] rounded-4xl my-4 mx-3 flex-5 p-5 shadow-2xl opacity-60">
            {
              <h2 className="text-[#0367A6] text-3xl font-semibold">
                Transcrevendo seu Audio...
              </h2>
            }
          </div> :
          <div className="bg-[#FFFFFB] rounded-4xl my-4 mx-3 flex-5 p-5 shadow-2xl">
            <h2 className="text-[#0367A6] text-3xl font-semibold">Response:</h2>
            {
              <div className="text-[#2694BF] m-3 font-light text-lg">
                {trancricao}
              </div>
            }
          </div>
          }
        </div>
      </div>
    </main>
  );
}
