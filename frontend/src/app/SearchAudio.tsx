'use client';
import { useTranslation } from 'react-i18next';
import { OrcButton, OrcInput } from '@orchestra/ui-react-shadcn';
import { useUnit } from 'effector-react';
import { $isLoadingChangesConfigurationStore } from '@/lib/effector/loading_configuration/stores';
import { ArrowLeftIcon, Mic, Check, StretchVertical, Trash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SearchAudioProps {
  isAudioMode: boolean;
  handleClickBack: () => void;
  setOpenState: (open: boolean) => void;
}

function SearchAudio({ handleClickBack, setOpenState }: SearchAudioProps) {
  const { t: translate } = useTranslation();

  //Content
  const [audioUrl, setAudioURL] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  //Recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [haveRecord, setHaveRecord] = useState<boolean>(false);
  const [isStopRecording, setIsStopRecording] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  //Audio Player
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isStop, setIsStop] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>('00:00');
  const [currentTime, setCurrentTime] = useState<string>('00:00');
  const [progress, setProgress] = useState<number>(0);

  //Referencias
  const mediaRecorderRef = useRef<any | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioElem = useRef<HTMLAudioElement | null>(null);
  const intervaloRef = useRef(null);

  //Importações Dinamica
  const [RecordRTC, setRecordRTC] = useState<any>(null);
  const [StereoAudioRecorder, setStereoAudioRecorder] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    (async () => {
      try {
        const recordrtcModule = await import('recordrtc');

        const RecordRTCInstance = recordrtcModule.default || recordrtcModule;
        const StereoAudioRecorderInstance =
          recordrtcModule.StereoAudioRecorder || (recordrtcModule.default && recordrtcModule.default.StereoAudioRecorder);

        if (!RecordRTCInstance || !StereoAudioRecorderInstance) {
          console.error('RecordRTC ou StereoAudioRecorder não encontrados no módulo.');
          return;
        }

        setRecordRTC(() => RecordRTCInstance);
        setStereoAudioRecorder(() => StereoAudioRecorderInstance);

        console.log('RecordRTC e StereoAudioRecorder carregados com sucesso');
      } catch (error) {
        console.error('Erro ao carregar RecordRTC dinamicamente', error);
      }
    })();
  }, []);

  //Gravação
  const startRecording = async () => {
    try {
      if (!RecordRTC || !StereoAudioRecorder) {
        console.error('RecordRTC or StereoAudioRecorder not load');
        return;
      }
      console.log('Start Recording');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
        },
      });
      audioStreamRef.current = stream;

      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
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
      console.error('Erro Microfone', error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stopRecording(() => {
        const blob: Blob = mediaRecorderRef.current.getBlob();
        const file = new File([blob], 'gravacao.wav', {
          type: 'audio/wav',
        });
        setFile(file);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      });

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop);
      }

      console.log('Stop Recording');
      setIsRecording(false);
    }
  };

  //Manipulação de Arquivo

  useEffect(() => {
    const audio = audioElem.current;
    if (!audio) return;
    const update = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
      const format = (s: number) => {
        `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
        setCurrentTime(`${format(audio.currentTime)}`);
        setDuration(`${format(audio.duration)}`);
      };
      audio.addEventListener('time', update);
      return () => {
        audio.removeEventListener('time', update);
      };
    };
  }, [audioElem.current?.onloadedmetadata]);

  const handlerClickAudioPlayer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioElem.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * audioElem.current.duration;
    audioElem.current.currentTime = pos;
  };

  const handlerPlayPausePlayer = () => {
    if (audioElem.current) {
      const prevValue = isPlaying;
      if (prevValue) {
        setIsPlaying(false);
        audioElem.current.pause();
      } else {
        setIsPlaying(true);
        audioElem.current.play().catch((err) => {
          console.error('Player Erro', err);
        });
      }
    }
  };

  const deleteRecord = () => {
    setHaveRecord(false);
    setIsFinalizing(false);
    setIsPlaying(false);
    setAudioURL(null);
    setIsRecording(false);
    setDuration('00:00');
    setCurrentTime('00:00');
  };

  const submitAudio = async () => {};

  return (
    <div>
      <div className='mb-2 flex items-center'>
        <OrcButton className='mr-2 border-none bg-weg-neutral-0 hover:bg-[#E2F0FD]' onClick={handleClickBack} cy-id='button-audio-back'>
          <ArrowLeftIcon className='h-5 w-5 bg-transparent text-weg-slate-500' />
        </OrcButton>
        <h3 className='text-lg font-semibold text-weg-slate-900' cy-id={'title-configuration-audio'}>
          Configurar por IA usando voz
        </h3>
      </div>
      <p className='mb-4 ml-11 text-sm text-weg-slate-500' cy-id={'subtitle-configuration-cv'}>
        Fale os requisitos que deseja aplicar à configuração
      </p>
      <div className='flex justify-items-center'>
        {isRecording ? (
          isStopRecording ? (
            <div className='flex h-36 w-full flex-col items-center gap-4 rounded-lg border bg-weg-neutral-20 px-6 py-2 align-middle'>
              <div className='flex w-14 flex-row items-center justify-center gap-1'>
                <div className='h-2 w-2 rounded-full bg-weg-neutral-60 py-[1px]' />
                <p className='w-9 py-[1px] font-semibold'>00:00</p>
              </div>
              <div className='flex h-10 w-80 items-center justify-center rounded-lg bg-weg-secondary-20'>Audio</div>
              <div className='flex h-7 w-36 flex-row items-center justify-center gap-6 py-4'>
                <button
                  className='flex h-7 w-7 items-center justify-center'
                  onClick={() => {
                    deleteRecord;
                  }}
                >
                  <Trash className='h-4 w-4 text-red-500' />
                </button>
                <button className='flex h-7 w-7 items-center justify-center rounded-full bg-red-500' onClick={() => setIsStopRecording(false)}>
                  <Mic className='h-4 w-4 text-weg-white' />
                </button>
                <button className='flex h-7 w-7 items-center justify-center'>
                  <StretchVertical className='h-4 w-4 text-weg-neutral-100' onClick={() => setIsStopRecording(true)} />
                </button>
              </div>
            </div>
          ) : (
            <div className='flex h-36 w-full flex-col items-center gap-4 rounded-lg border bg-weg-neutral-20 px-6 py-2 align-middle'>
              <div className='flex w-14 flex-row items-center justify-center gap-1'>
                <div className='h-2 w-2 rounded-full bg-red-500 py-[1px]' />
                <p className='w-9 py-[1px] font-semibold'>00:00</p>
              </div>
              <div className='flex h-10 w-80 items-center justify-center rounded-lg bg-weg-secondary-20'>Audio</div>
              <div className='flex h-7 w-36 flex-row items-center justify-center gap-6 py-4'>
                <button
                  className='flex h-7 w-7 items-center justify-center'
                  onClick={() => {
                    deleteRecord;
                  }}
                >
                  <Trash className='h-4 w-4 text-red-500' />
                </button>
                <button
                  className='flex h-7 w-7 items-center justify-center rounded-full bg-weg-blue-800'
                  onClick={() => {
                    setIsRecording(false);
                    setHaveRecord(true);
                    setIsFinalizing(true);
                  }}
                >
                  <Check className='h-4 w-4 text-weg-white' />
                </button>
                <button className='flex h-7 w-7 items-center justify-center'>
                  <StretchVertical className='h-4 w-4 text-weg-neutral-100' onClick={() => setIsStopRecording(true)} />
                </button>
              </div>
            </div>
          )
        ) : (
          <>
            {haveRecord ? (
              <div className='flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border bg-weg-neutral-20 px-6 py-2 align-middle'>
                <div className='flex h-10 w-80 items-center justify-center rounded-lg bg-weg-secondary-20'>Audio</div>
                <div className='flex h-7 w-36 flex-row items-center justify-center gap-6 py-4'>
                  <button
                    className='flex h-7 w-7 items-center justify-center'
                    onClick={() => {
                      deleteRecord;
                    }}
                  >
                    <Trash className='h-4 w-4 text-red-500' />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className='flex h-36 w-full flex-col items-center justify-center rounded-lg bg-weg-neutral-30 bg-gradient-to-l from-blue-100 to-blue-100 py-4'
                cy-id={'record-area-audio'}
              >
                <div className='flex h-24 w-24 items-center justify-center rounded-full'>
                  <button className='flex h-20 w-20 items-center justify-center rounded-full bg-weg-neutral-10' onClick={startRecording}>
                    <Mic className='h-14 w-14 rounded-full bg-[#E2F0FD] p-2 text-weg-primary-0' />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className='mt-4 flex justify-end'>
        <OrcButton className='mr-4' variant='secondary' onClick={handleClickBack} cy-id='button-cv-cancel'>
          {translate('cancel')}
        </OrcButton>
        <OrcButton cy-id='button-cv-up'>{translate('confirm')}</OrcButton>
      </div>
    </div>
  );
}

export { SearchAudio };
