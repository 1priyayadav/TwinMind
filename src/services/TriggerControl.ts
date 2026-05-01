import { logger } from '../utils/logger';

export function shouldTriggerGeneration(chunkText: string, thresholdWords: number): boolean {
  if (!chunkText) return false;
  
  const words = chunkText.trim().split(/\s+/).filter(w => w.length > 1);
  
  if (words.length >= thresholdWords) {
    logger.log('TRIGGER', 'Generation executed: Word threshold exceeded.', { wordCount: words.length });
    return true;
  }
  
  if (chunkText.includes('?')) {
    logger.log('TRIGGER', 'Generation executed: Direct question heuristic detected.', { text: chunkText });
    return true;
  }

  logger.log('TRIGGER', 'Generation skipped: Chunk failed threshold constraints.', { wordCount: words.length });
  return false;
}

export function detectIntentHeuristics(chunkText: string): string[] {
  const intents: string[] = [];
  const textLower = chunkText.toLowerCase();

  // Heuristic 1: Question
  if (textLower.includes('?')) {
    intents.push('Question or Clarification Request');
  }

  // Heuristic 2: Potential Claims / Assertions
  const claimTriggers = ['proven', 'fact', 'definitely', 'we need to', 'must', 'always'];
  if (claimTriggers.some(trigger => textLower.includes(trigger))) {
    intents.push('Strong Assertion or Claim (Potential Fact-Check)');
  }

  // Heuristic 3: Action Items
  const actionTriggers = ['i will', 'you should', 'let\'s', 'action item', 'assign'];
  if (actionTriggers.some(trigger => textLower.includes(trigger))) {
    intents.push('Action Item or Decision');
  }

  return intents.length > 0 ? intents : ['General Discussion'];
}
