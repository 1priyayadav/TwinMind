import { useState, useRef, useCallback } from 'react';

type AudioStatus = 'idle' | 'recording' | 'error';

export function useAudioRecorder(onChunkReady: (blob: Blob) => void) {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream.current, { mimeType: 'audio/webm' });
      mediaRecorder.current = recorder;

      // Fires immediately when a stop() command is invoked or timeslice finishes
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          onChunkReady(e.data);
        }
      };

      recorder.start();
      setStatus('recording');

      // Controlled Interval Slicing: Stop and instantly restart every 30 seconds
      intervalRef.current = window.setInterval(() => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
          mediaRecorder.current.stop();  // Physically drops the compiled chunk
          mediaRecorder.current.start(); // Flushes and begins fresh stream
        }
      }, 30000);

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Microphone access denied. Please enable mic permissions in your browser.');
      } else {
        setErrorMsg(`Audio setup failed: ${err.message}`);
      }
      setStatus('error');
    }
  }, [onChunkReady]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
    }

    setStatus('idle');
  }, []);

  return { startRecording, stopRecording, status, errorMsg };
}
