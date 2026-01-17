# Corporate Constellations

A 3D Graph Visualization of corporate relationships with Gemini AI analysis.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file in the root:
    ```properties
    PORT=3000
    GEMINI_API_KEY=your_google_gemini_api_key
    ```
    *(You can get a Gemini Key from Google AI Studio)*

3.  **Run Development Mode**
    Runs Backend (Port 3000) and Frontend (Vite) concurrently.
    ```bash
    npm run dev
    ```

4.  **Open App**
    Go to URL provided by Vite (usually `http://localhost:5173`).

## Features to Demo

1.  **3D Navigation:** Left click to rotate, right click to pan, wheel to zoom. Click nodes to focus.
2.  **Circle Jerk Mode:** Toggle the checkbox in the top right. Click on **OpenAI** or **NVIDIA** (entities with cycles in the seed data). Look at the "Cycles Found" panel.
3.  **Gemini AI:**
    * Open the "Gemini AI" tab on the right.
    * Paste: *"The recent Microsoft investment in OpenAI might conflict with their NVIDIA partnership."*
    * Click Decode. The app will extract entities, highlight the path on the graph, and explain the financial context.
Next Steps for the User
Would you like me to create the specific SQL queries to sync the In-Memory JSON data to a real Neo4j instance if you decide to spin up a Docker container for it?
