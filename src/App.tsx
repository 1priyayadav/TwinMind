import { useState } from 'react';
import { exportSessionData } from './services/ExportEngine';
import ThreeColumnLayout from './components/layout/ThreeColumnLayout';
import SettingsPanel from './components/settings/SettingsPanel';
import { useAppState } from './context/AppStateContext';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { state } = useAppState();

  return (
    <div className="app-container">
      <header className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>TwinMind Protocol</h1>
          {state.topicState.currentTopic && (
            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#333', borderRadius: '4px' }}>
              Active Topic: {state.topicState.currentTopic}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowSettings(!showSettings)}>Settings</button>
          <button onClick={() => exportSessionData(state)}>Export JSON</button>
        </div>
      </header>
      
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      
      <ThreeColumnLayout />
    </div>
  );
}

export default App;
