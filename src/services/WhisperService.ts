/**
 * Processes audio blobs into transcripts via Groq's Whisper API.
 * Includes explicit noise filtering and hallucination prevention.
 */
export async function transcribeAudioChunk(
  audioBlob: Blob, 
  apiKey: string
): Promise<string | null> {
  if (!apiKey) {
    throw new Error("Missing Groq API Key in settings.");
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'chunk.webm'); // Explicit MIME naming
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'json');
  formData.append('language', 'en'); // Force English logic per spec

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Whisper API Error: ${response.status} - ${err?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return cleanWhisperOutput(data.text || '');
}

/**
 * Strips common Whisper hallucination artifacts (e.g. [Silence], [Music]).
 * Returns null if the chunk is completely empty or just noise.
 */
export function cleanWhisperOutput(text: string): string | null {
  // Removes bracketed and parenthetical sound descriptions globally
  let cleaned = text.replace(/\[.*?\]|\(.*?\)/g, ''); 
  cleaned = cleaned.trim();
  
  if (cleaned.length < 2) {
    return null; // Ignore purely silent or sub-word hallucination chunks
  }
  
  return cleaned;
}
