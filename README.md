# TwinMind AI Assistant

TwinMind is a high-performance, real-time AI meeting assistant web application. Designed around a rigorous 3-tier memory system and a reactive intelligence pipeline, TwinMind captures live microphone audio, transcribes it locally, and proactively generates contextual insights and actions without interrupting your workflow.

## 🚀 Core Architecture

The system is decoupled into three primary columns:
1. **Live Transcript:** Uses the native `MediaRecorder` API to capture audio in 30-second slices and transcibes it via the Groq Whisper API.
2. **Intelligence Layer:** A gatekeeper heuristic engine that evaluates transcript word counts and structural intents (e.g., questions) to autonomously generate proactive, highly-specific suggestions. All suggestions are passed through a strict 3-way validation filter (Relevance, Usefulness, Uniqueness) before rendering.
3. **Deep Dive Chat:** A concurrent streaming chat engine allowing users to explore the AI's proactive thought process in real-time.

## 🛠️ Tech Stack

*   **Frontend Framework:** React 18
*   **Language:** TypeScript (Strict typing for all data contracts)
*   **Build Tool:** Vite
*   **Styling:** Vanilla CSS (Structural grid approach)
*   **AI Engine:** Groq API 
    *   *Audio Pipeline:* `whisper-large-v3`
    *   *Intelligence & Chat:* `llama-3.3-70b-versatile`
*   **Browser APIs:** `MediaRecorder` (Audio), `AbortController` (Concurrency), `LocalStorage` (Settings Sync)

## ⚙️ Local Setup Instructions

Because TwinMind is engineered entirely as a Client-Side React SPA (Single Page Application), there are no backend databases or node servers to configure. All logic runs directly in your browser.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/1priyayadav/TwinMind.git
   cd TwinMind
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Boot the Application:**
   * Open your browser and navigate to `http://localhost:5173/`.
   * Click the **Settings** button in the top right corner.
   * Paste your [Groq API Key](https://console.groq.com/keys) into the configuration panel.
   * Click **Start Mic** to begin the live intelligence loop!

## 📦 Export & Observability
TwinMind features a built-in `DebugLogger` and `ExportEngine`. By clicking **Export JSON**, you can download a complete diagnostic snapshot of your session, mapping exact architectural decisions, algorithmic drops, and linked chat context states.
