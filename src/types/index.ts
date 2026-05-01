export interface TranscriptChunk {
  id: string;
  text: string;
  timestamp: number;
}

export type SuggestionType = 'Urgent' | 'High Value' | 'Exploratory' | 'Answer' | 'Follow-up' | 'Fact-check';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  preview: string;
  detailed_prompt: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: number;
  basedOnChunkId: string;
  suggestions: Suggestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  linkedSuggestionId?: string; // Links back for proactive explainability
}

export interface TopicState {
  currentTopic: string | null;
  topicHistory: string[];
}

export interface AppState {
  sessionStartTime: number;
  transcriptChunks: TranscriptChunk[];
  suggestionBatches: SuggestionBatch[];
  chatMessages: ChatMessage[];
  topicState: TopicState;
  runningSummary: string | null;
}

export interface AppSettings {
  groqApiKey: string;
  suggestionPrompt: string;
  chatPrompt: string;
  contextWindowSize: number;
  modelSelection: string;
  triggerThresholdWords: number;
}
