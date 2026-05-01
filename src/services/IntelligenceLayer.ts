import type { SuggestionBatch, TranscriptChunk } from '../types';
import { shouldTriggerGeneration, detectIntentHeuristics } from './TriggerControl';
import { generateStructuredPrompt } from './PromptGenerator';
import { validateBatchOutput } from './ValidationLayer';
import { logger } from '../utils/logger';

/**
 * Orchestrates the full lifecycle of the Intelligence Layer.
 * Wraps generation with failure handling, validation loops, and structured Groq requests.
 */
export async function executeIntelligenceLayer(
  newChunks: TranscriptChunk[], // Last ~60s of active context
  runningSummary: string | null,
  previousBatches: SuggestionBatch[],
  apiKey: string,
  model: string,
  systemPromptStr: string,
  thresholdWords: number
): Promise<SuggestionBatch | null> {
  const startTime = performance.now();

  if (!apiKey) throw new Error("Groq API key required for suggestions.");
  if (newChunks.length === 0) return null;

  // 1. SMART TRIGGER CONTROL
  const latestChunk = newChunks[newChunks.length - 1];
  if (!shouldTriggerGeneration(latestChunk.text, thresholdWords)) {
    const elapsed = performance.now() - startTime;
    logger.log('LATENCY', 'Intelligence Layer Skipped natively (Gatekeeper threshold).', { ms: elapsed });
    return null; // Gracefully drop if threshold isn't met (low SNR)
  }

  // 2. HEURISTIC INTENT DETECTION
  const intents = detectIntentHeuristics(latestChunk.text);

  // 3. PROMPT GENERATOR
  const finalPrompt = generateStructuredPrompt(
    systemPromptStr, 
    runningSummary, 
    newChunks, 
    intents, 
    previousBatches
  );

  // FAILURE HANDLING & RETRY LOOP
  let retries = 2;
  
  while (retries > 0) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: finalPrompt }],
          response_format: { type: 'json_object' }, // Enforces deterministic JSON structure
          temperature: 0.6
        })
      });

      if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
      
      const data = await response.json();
      const payload = JSON.parse(data.choices[0].message.content);

      // 4. POST-GENERATION VALIDATION
      if (payload.suggestions && validateBatchOutput(payload.suggestions, newChunks, previousBatches)) {
        const elapsed = performance.now() - startTime;
        logger.log('LATENCY', 'Intelligence Layer Success - Payload Verified.', { ms: elapsed, retriesLeft: retries });
        // Validation Passed! Generate structural batch object
        return {
          id: Date.now().toString(),
          timestamp: Date.now(),
          basedOnChunkId: latestChunk.id,
          suggestions: payload.suggestions.map((s: any, idx: number) => ({
            id: `${Date.now()}-${idx}`,
            type: s.type || 'Exploratory',
            preview: s.preview || '',
            detailed_prompt: s.detailed_prompt || ''
          }))
        };
      } else {
        logger.log('VALIDATION', 'Batch discarded. Initiating logic retry...', { retriesLeft: retries - 1 });
        throw new Error("Validation Layer execution failed: Output did not meet Relevance/Uniqueness criteria.");
      }

    } catch (err: any) {
      logger.log('ERROR', `Intelligence Layer Exception: ${err.message}`, { retriesLeft: retries - 1 });
      console.warn(`Intelligence Layer Retry [${retries} left]:`, err);
      retries--;
    }
  }

  // If retries exhausted, silently discard to prevent bad UI flashes.
  logger.log('ERROR', 'Intelligence Layer Failed completely. Payload discarded implicitly to preserve UX.');
  return null; 
}
