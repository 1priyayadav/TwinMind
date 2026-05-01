import { createContext, useReducer, useContext } from 'react';
import type { ReactNode, Dispatch } from 'react';
import type { AppState, TranscriptChunk, SuggestionBatch, ChatMessage } from '../types';

type Action =
  | { type: 'ADD_CHUNK'; payload: TranscriptChunk }
  | { type: 'ADD_SUGGESTION_BATCH'; payload: SuggestionBatch }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_TOPIC'; payload: string }
  | { type: 'UPDATE_SUMMARY'; payload: string };

const initialState: AppState = {
  sessionStartTime: Date.now(),
  transcriptChunks: [],
  suggestionBatches: [],
  chatMessages: [],
  runningSummary: null,
  topicState: {
    currentTopic: null,
    topicHistory: [],
  },
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_CHUNK':
      return { ...state, transcriptChunks: [...state.transcriptChunks, action.payload] };
    case 'ADD_SUGGESTION_BATCH':
      return { ...state, suggestionBatches: [...state.suggestionBatches, action.payload] };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'UPDATE_TOPIC':
      const oldHistory = state.topicState.currentTopic && state.topicState.currentTopic !== action.payload
        ? [...state.topicState.topicHistory, state.topicState.currentTopic] 
        : state.topicState.topicHistory;
      return {
        ...state,
        topicState: {
          currentTopic: action.payload,
          topicHistory: oldHistory,
        },
      };
    case 'UPDATE_SUMMARY':
      return { ...state, runningSummary: action.payload };
    default:
      return state;
  }
};

interface AppContextProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppStateContext = createContext<AppContextProps | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
