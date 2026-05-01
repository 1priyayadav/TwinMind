import type { SuggestionBatch, TranscriptChunk } from '../types';

export function buildDeduplicationState(previousBatches: SuggestionBatch[]): string {
  if (previousBatches.length === 0) return 'No previous suggestions generated yet.';
  
  // Extract just the preview concepts from the last 3 batches to prevent prompt bloat
  const recentBatches = previousBatches.slice(-3);
  const previousConcepts = recentBatches.flatMap(batch => 
    batch.suggestions.map(s => `- ${s.preview}`)
  );

  return `DO NOT SUGGEST ANY OF THESE PREVIOUSLY PROVIDED CONCEPTS:\n${previousConcepts.join('\n')}`;
}

export function generateStructuredPrompt(
  systemPrompt: string,
  runningSummary: string | null,
  recentChunks: TranscriptChunk[],
  intents: string[],
  previousBatches: SuggestionBatch[]
): string {
  const deduplicationBlock = buildDeduplicationState(previousBatches);
  
  const recentTranscriptText = recentChunks.map(c => `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.text}`).join('\n');

  return `
${systemPrompt}

### CONTEXT STATE
[Running Summary]: ${runningSummary || 'No summary available yet.'}
[Recent Transcript]:
${recentTranscriptText}

### DETERMINISTIC HEURISTICS DETECTED
The following structural intents were detected via regex in the latest transcript segment:
${intents.join(', ')}

### STRICT NEGATIVE CONSTRAINTS (DEDUPLICATION)
${deduplicationBlock}

### TASK
Generate exactly 3 suggestions formatted as JSON. The array must be mapped to the key "suggestions". 

STRICT SPECIFICITY CONSTRAINTS:
1. DO NOT output generic advice (e.g., "Discuss the project timeline", "Ask for clarification").
2. BIND TO ENTITIES: You MUST reference exact names, numbers, or unique concepts mentioned in the [Recent Transcript]. (e.g., "Verify Priya's Q3 revenue estimate of $4M").
3. Your 'preview' must be a highly specific, actionable verb phrase.
4. Your 'detailed_prompt' must explain the specific logical gap, risk, or opportunity you detected.

Rank them in order of importance. Ensure strict alignment with the deterministic heuristics detected.
`;
}
