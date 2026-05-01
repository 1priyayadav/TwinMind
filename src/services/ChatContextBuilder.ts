import type { TranscriptChunk } from '../types';

/**
 * Merges Multi-Layer Context safely into an optimized SNR prompt for the active session.
 */
export function buildChatContext(
  systemPrompt: string,
  runningSummary: string | null,
  recentChunks: TranscriptChunk[],
  userQuery: string
): string {
  // Extract strictly the most recent window of transcript to protect token limits
  const targetedText = recentChunks.map(c => `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.text}`).join('\n');

  return `
${systemPrompt}

### CONVERSATION MEMORY (RUNNING SUMMARY)
${runningSummary || 'No summary available.'}

### RECENT DIALOGUE CONTEXT (IMMEDIATE)
${targetedText || 'No recent transcript available.'}

### USER QUERY
${userQuery}

### INSTRUCTIONS
Answer the query directly using ONLY the provided memory and dialogue context. If the answer is not contained in the context, state that clearly. Be concise, actionable, and highly specific.
`;
}
