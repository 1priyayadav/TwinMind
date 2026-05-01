import { useState, useEffect } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useAppState } from '../../context/AppStateContext';
import { transcribeAudioChunk } from '../../services/WhisperService';
import { useSettings } from '../../hooks/useSettings';

export default function TranscriptColumn() {
  const { state, dispatch } = useAppState();
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChunkReady = async (blob: Blob) => {
    setIsProcessing(true);
    setApiError(null);
    try {
      const text = await transcribeAudioChunk(blob, settings.groqApiKey);
      if (text) {
        dispatch({
          type: 'ADD_CHUNK',
          payload: {
            id: Date.now().toString(),
            text,
            timestamp: Date.now()
          }
        });
      }
    } catch (error: any) {
      console.error('Transcription failed:', error);
      setApiError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const { startRecording, stopRecording, status, errorMsg } = useAudioRecorder(handleChunkReady);

  // Automatically halt the microphone loop if an API key issue occurs
  useEffect(() => {
    if (apiError) {
      stopRecording();
    }
  }, [apiError, stopRecording]);

  return (
    <section className="column-container">
      <header className="column-header">
        Live Transcript
      </header>
      
      {/* Edge Case UX Handling */}
      {errorMsg && (
        <div style={{ backgroundColor: '#b91c1c', color: 'white', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px' }}>
          {errorMsg}
        </div>
      )}
      {apiError && (
        <div style={{ backgroundColor: '#b91c1c', color: 'white', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px' }}>
          {apiError}
        </div>
      )}

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          onClick={() => {
            setApiError(null);
            startRecording();
          }} 
          disabled={status === 'recording'}
          style={{ padding: '0.5rem 1rem' }}
        >
          Start Mic
        </button>
        <button 
          onClick={stopRecording} 
          disabled={status !== 'recording'}
          style={{ padding: '0.5rem 1rem' }}
        >
          Stop Mic
        </button>
        {status === 'recording' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Recording (30s chunks)...</span>}
      </div>

      <div className="transcript-feed" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {state.transcriptChunks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No audio chunks recorded yet...</p>
        ) : (
          state.transcriptChunks.map(chunk => (
            <div key={chunk.id} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                {new Date(chunk.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ lineHeight: '1.4' }}>{chunk.text}</span>
            </div>
          ))
        )}
        {isProcessing && (
          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem' }}>
            Processing audio chunk...
          </div>
        )}
      </div>
    </section>
  );
}
