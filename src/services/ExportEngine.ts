import type { AppState } from '../types';
import { logger } from '../utils/logger';

/**
 * Compiles the entire system context into a strictly formatted JSON artifact, 
 * explicitly preserving UI action linkages and deep-dive metadata.
 */
export function exportSessionData(state: AppState) {
  const exportPayload = {
    session_metadata: {
      start_time: new Date(state.sessionStartTime).toISOString(),
      end_time: new Date().toISOString(),
      active_topic: state.topicState.currentTopic,
      topic_history: state.topicState.topicHistory
    },
    transcript: state.transcriptChunks.map(chunk => ({
      id: chunk.id,
      timestamp: new Date(chunk.timestamp).toISOString(),
      text: chunk.text
    })),
    suggestions: state.suggestionBatches.map(batch => ({
      timestamp: new Date(batch.timestamp).toISOString(),
      based_on_chunk_id: batch.basedOnChunkId,
      items: batch.suggestions
    })),
    chat: state.chatMessages.map(msg => ({
      interaction_type: msg.role === 'user' ? (msg.linkedSuggestionId ? 'suggestion_click' : 'direct_query') : 'system_response',
      role: msg.role,
      linked_suggestion_id: msg.linkedSuggestionId || null,
      content: msg.content,
      timestamp: new Date(msg.timestamp).toISOString()
    })),
    debug_logs: logger.getLogs().map(log => ({
      type: log.type,
      timestamp: new Date(log.timestamp).toISOString(),
      message: log.message,
      metadata: log.metadata
    }))
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Natively force local browser download mapping
  const link = document.createElement('a');
  link.href = url;
  link.download = `twinmind_export_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
