
import { useSettings } from '../../hooks/useSettings';

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettings();

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <h2>System Diagnostics & Settings</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <label>
          Groq API Key (Stored Locally):
          <input 
            type="password" 
            value={settings.groqApiKey} 
            onChange={e => updateSettings({ groqApiKey: e.target.value })} 
            style={{ display: 'block', width: '100%', maxWidth: '400px' }}
          />
        </label>

        <label>
          Model Selection (Groq Hub):
          <select 
            value={settings.modelSelection} 
            onChange={e => updateSettings({ modelSelection: e.target.value })}
            style={{ display: 'block', width: '100%', maxWidth: '400px' }}
          >
             <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Default)</option>
             <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Low Latency)</option>
          </select>
        </label>

        <label>
          Trigger Threshold Filter (Words): {settings.triggerThresholdWords}
          <input 
            type="range" 
            min="5" max="30" 
            value={settings.triggerThresholdWords} 
            onChange={e => updateSettings({ triggerThresholdWords: parseInt(e.target.value, 10) })}
            style={{ display: 'block', width: '100%', maxWidth: '400px' }}
          />
        </label>
      </div>

      <button onClick={onClose} style={{ padding: '0.5rem 1rem' }}>Close Controls</button>
    </div>
  );
}
