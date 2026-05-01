import { useEffect, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useSettings } from '../../hooks/useSettings';
import { executeIntelligenceLayer } from '../../services/IntelligenceLayer';

export default function SuggestionsColumn() {
  const { state, dispatch } = useAppState();
  const { settings } = useSettings();
  const [isGenerating, setIsGenerating] = useState(false);

  // Watch the transcript array to autonomously trigger the Intelligence Layer
  useEffect(() => {
    if (state.transcriptChunks.length === 0 || isGenerating) return;

    const fireIntelligenceLayer = async () => {
      setIsGenerating(true);
      try {
        const batch = await executeIntelligenceLayer(
          state.transcriptChunks,
          state.runningSummary,
          state.suggestionBatches,
          settings.groqApiKey,
          settings.modelSelection,
          settings.suggestionPrompt,
          settings.triggerThresholdWords
        );

        if (batch) {
          dispatch({ type: 'ADD_SUGGESTION_BATCH', payload: batch });
        }
      } catch (err) {
        console.error("Intelligence Layer Error:", err);
      } finally {
        setIsGenerating(false);
      }
    };

    fireIntelligenceLayer();
  }, [state.transcriptChunks]); // Trigger automatically whenever a new chunk hits state

  // Force bypass the gatekeeper (threshold 0)
  const handleManualSync = async () => {
    if (state.transcriptChunks.length === 0 || isGenerating) return;
    setIsGenerating(true);
    try {
      const batch = await executeIntelligenceLayer(
        state.transcriptChunks,
        state.runningSummary,
        state.suggestionBatches,
        settings.groqApiKey,
        settings.modelSelection,
        settings.suggestionPrompt,
        0 // Pass 0 to bypass the gatekeeper threshold
      );

      if (batch) {
        dispatch({ type: 'ADD_SUGGESTION_BATCH', payload: batch });
      }
    } catch (err) {
      console.error("Intelligence Layer Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="column-container">
      <header className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Intelligence Layer</span>
        <button 
          onClick={handleManualSync}
          disabled={isGenerating || state.transcriptChunks.length === 0}
          style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
        >
          Manual Sync
        </button>
      </header>

      <div className="suggestions-feed" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {state.suggestionBatches.length === 0 && !isGenerating && (
          <p style={{ color: 'var(--text-secondary)' }}>Waiting for conversational thresholds...</p>
        )}

        {state.suggestionBatches.map(batch => (
          <div key={batch.id} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', backgroundColor: '#1a1a1a' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Batch Generated: {new Date(batch.timestamp).toLocaleTimeString()}
            </div>
            {batch.suggestions.map(sug => (
              <div key={sug.id} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px', cursor: 'pointer' }}>
                <span style={{ display: 'inline-block', fontSize: '0.65rem', padding: '0.1rem 0.3rem', background: '#444', borderRadius: '2px', marginBottom: '0.2rem', textTransform: 'uppercase' }}>
                  {sug.type}
                </span>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{sug.preview}</div>
              </div>
            ))}
          </div>
        ))}

        {/* Optimistic UI loading state */}
        {isGenerating && (
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', opacity: 0.6 }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Evaluating Intent & Generating Suggestions...</p>
          </div>
        )}
      </div>
    </section>
  );
}
