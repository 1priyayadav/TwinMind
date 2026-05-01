/**
 * Wraps Groq's Chat Completions REST API with streaming capability.
 * Injects a physical AbortSignal to forcefully resolve race conditions inside the DOM.
 */
export async function streamChatResponse(
  systemPayload: string,
  apiKey: string,
  model: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  if (!apiKey) throw new Error("Groq API key required for deep-dive chat.");

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: systemPayload }],
      stream: true,
      temperature: 0.5
    }),
    signal // Mapped to our UI AbortController
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Chat API Error: ${response.status} - ${err?.error?.message || response.statusText}`);
  }

  if (!response.body) throw new Error("No readable stream returned from Groq API.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line === 'data: [DONE]') return;
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '');
          try {
            const data = JSON.parse(dataStr);
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (e) {
            // Ignore partial fragment parsing breaks natively
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
