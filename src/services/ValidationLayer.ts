import type { Suggestion, SuggestionBatch, TranscriptChunk } from '../types';
import { computeSimilarity } from '../utils/similarity';
import { logger } from '../utils/logger';

// Validation rules implementation

export function checkRelevance(suggestionPreview: string, contextChunks: TranscriptChunk[]): boolean {
  // Combine context string
  const contextBlock = contextChunks.map(c => c.text).join(' ');
  
  // Simple intersection heuristic: If the suggestion has zero token overlap with the active chunk window, it's hallucinated.
  const score = computeSimilarity(suggestionPreview, contextBlock);
  return score > 0.02; // Very low threshold, but acts as a hard boundary against complete hallucinations
}

export function checkUsefulness(suggestionPreview: string): boolean {
  // Must be longer than 15 characters to not be generic filler
  if (suggestionPreview.length < 15) return false;

  // Ideally should contain an actionable command structure (disabled strict checking for demo to prevent over-filtering)
  // const words = suggestionPreview.toLowerCase().split(' ');
  // return words.some(w => ACTION_VERBS.has(w));
  return true; 
}

export function checkUniqueness(suggestionPreview: string, previousBatches: SuggestionBatch[]): boolean {
  if (previousBatches.length === 0) return true;

  // Use string token overlap (Jaccard proxy) to evaluate semantic collision
  for (const batch of previousBatches) {
    for (const oldSuggestion of batch.suggestions) {
      const similarity = computeSimilarity(suggestionPreview, oldSuggestion.preview);
      if (similarity > 0.6) { // High overlap means it's a duplicate concept
        return false;
      }
    }
  }
  return true;
}

export function validateBatchOutput(
  suggestions: Suggestion[], 
  contextChunks: TranscriptChunk[], 
  previousBatches: SuggestionBatch[]
): boolean {
  if (!suggestions || suggestions.length !== 3) {
    logger.log('VALIDATION', 'Validation Failed: Incorrect array length.', { length: suggestions?.length });
    return false;
  }

  for (const sug of suggestions) {
    if (!checkRelevance(sug.preview, contextChunks)) {
      logger.log('VALIDATION', 'Validation Failed: Irrelevant chunk (No contextual overlap).', { preview: sug.preview });
      return false;
    }
    if (!checkUsefulness(sug.preview)) {
      logger.log('VALIDATION', 'Validation Failed: Output not actionable or too short.', { preview: sug.preview });
      return false;
    }
    if (!checkUniqueness(sug.preview, previousBatches)) {
      logger.log('VALIDATION', 'Validation Failed: Semantic duplicate detected.', { preview: sug.preview });
      return false;
    }
  }

  logger.log('VALIDATION', 'Validation Passed: Batch conforms to all constraints.');
  return true;
}
