import type { TranscriptChunk } from "../types";
import { computeSimilarity } from "../utils/similarity";
import { logger } from '../utils/logger';

/**
 * Checks if a topic shift occurred based on the new chunk and the running summary.
 * Returns true if similarity is BELOW the threshold, indicating a shift.
 */
export function detectTopicShift(newChunk: TranscriptChunk, currentSummary: string | null): boolean {
  if (!currentSummary) return false; // Not enough context to shift
  
  // Exclude very short chunks from causing topic shifts to prevent noise
  const words = newChunk.text.split(' ').filter(w => w.length > 0);
  if (words.length < 10) return false;

  const similarityScore = computeSimilarity(newChunk.text, currentSummary);
  
  // Threshold can be adjusted via settings. Baseline < 0.05 indicates extremely low overlap.
  const TOPIC_SHIFT_THRESHOLD = 0.05; 
  
  const isShift = similarityScore < TOPIC_SHIFT_THRESHOLD;

  if (isShift) {
    logger.log('TOPIC_SHIFT', 'Topic Shift heuristic detected based on semantic drift.', { similarityScore });
  }

  return isShift;
}

/**
 * Asynchronous job compressing older chunks into the tight "Running Summary".
 * Simulates external LLM API orchestration for Phase 3.
 */
export async function generateRunningSummary(
  oldSummary: string | null, 
  newChunks: TranscriptChunk[], 
  apiKey: string
): Promise<string> {
  const combinedText = newChunks.map(c => c.text).join(' ');
  
  // Graceful stub preventing runtime errors while LLM layer is decoupled
  if (!apiKey) {
    return `[Mock Context]: Previously discussed: ${oldSummary || 'none'}. New items: ${combinedText.substring(0, 50)}...`;
  }

  // Phase 5 LLM Logic connects here to hit Groq with a compression prompt.
  // For now, we return a structural proxy string.
  return `[Summarized]: ${combinedText.substring(0, 50)}...`;
}
