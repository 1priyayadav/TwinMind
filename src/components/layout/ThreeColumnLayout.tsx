
import TranscriptColumn from '../transcript/TranscriptColumn';
import SuggestionsColumn from '../suggestions/SuggestionsColumn';
import ChatColumn from '../chat/ChatColumn';

export default function ThreeColumnLayout() {
  return (
    <main className="three-column-grid">
      <TranscriptColumn />
      <SuggestionsColumn />
      <ChatColumn />
    </main>
  );
}
