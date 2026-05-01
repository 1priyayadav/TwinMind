import { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useSettings } from '../../hooks/useSettings';
import { buildChatContext } from '../../services/ChatContextBuilder';
import { streamChatResponse } from '../../services/ChatService';

export default function ChatColumn() {
  const { state, dispatch } = useAppState();
  const { settings } = useSettings();
  const [inputText, setInputText] = useState('');
  const [activeStreamText, setActiveStreamText] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll mechanic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages, activeStreamText]);

  const handleSubmit = async (query: string, linkedSuggestionPreview?: string) => {
    if (!query.trim()) return;

    // 1. CONCURRENCY HANDLING: Instantly abort any active stream to prevent overlap rendering
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // 2. Dispatch baseline User entry into strict state tracker
    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      payload: {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: Date.now()
      }
    });

    // 3. PROACTIVE INTELLIGENCE: Directly inject 'WHY' this occurred to fulfill product traceability
    if (linkedSuggestionPreview) {
       dispatch({
         type: 'ADD_CHAT_MESSAGE',
         payload: {
           id: (Date.now() + 1).toString(),
           role: 'assistant',
           content: `*Proactive Context: This context dive was triggered because the insight ("${linkedSuggestionPreview}") was flagged by the TwinMind Intelligence Layer.*`,
           timestamp: Date.now()
         }
       });
    }

    setInputText('');
    setActiveStreamText('');

    // Context Optimization
    const contextPayload = buildChatContext(
      settings.chatPrompt,
      state.runningSummary,
      state.transcriptChunks.slice(-15), // Truncates timeline strictly
      query
    );

    let accumulatedResponse = '';

    try {
      await streamChatResponse(
        contextPayload,
        settings.groqApiKey,
        settings.modelSelection,
        abortControllerRef.current.signal,
        (token) => {
          accumulatedResponse += token;
          setActiveStreamText(accumulatedResponse); // Renders Optimistic Stream Frame
        }
      );

      // Finalize the immutable payload cleanly
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          id: Date.now().toString(),
          role: 'assistant',
          content: accumulatedResponse,
          timestamp: Date.now()
        }
      });
      setActiveStreamText('');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream successfully aborted due to rapid multi-click concurrency.');
      } else {
        console.error('Chat stream pipeline failed:', err);
        dispatch({
          type: 'ADD_CHAT_MESSAGE',
          payload: {
            id: Date.now().toString(),
            role: 'assistant',
            content: `[System Breakdown]: ${err.message}`,
            timestamp: Date.now()
          }
        });
        setActiveStreamText('');
      }
    }
  };

  return (
    <section className="column-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <header className="column-header">
        Deep Dive Chat
      </header>

      <div className="chat-feed" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {state.chatMessages.map(msg => (
          <div key={msg.id} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? '#2563eb' : '#2a2a2a',
            padding: '0.75rem', 
            borderRadius: '8px', 
            maxWidth: '85%',
            lineHeight: '1.5'
          }}>
            {msg.content}
          </div>
        ))}
        
        {/* Active Typing Optimistic State */}
        {activeStreamText && (
          <div style={{ 
            alignSelf: 'flex-start',
            backgroundColor: '#2a2a2a',
            padding: '0.75rem', 
            borderRadius: '8px', 
            maxWidth: '85%',
            lineHeight: '1.5',
            borderLeft: '2px solid #2563eb'
          }}>
            {activeStreamText}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-area" style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(inputText)}
          placeholder="Analyze the ongoing context..." 
          style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
        />
        <button 
          onClick={() => handleSubmit(inputText)}
          style={{ padding: '0.75rem 1.25rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Send
        </button>
      </div>
    </section>
  );
}
