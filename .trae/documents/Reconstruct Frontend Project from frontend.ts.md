# Frontend Project Reconstruction Plan

I will convert the single-file [frontend.ts](file:///Users/cin/code/project/story-music-ai/frontend.ts) into a structured React + Vite + TypeScript project within a new `frontend` directory. The project will fully implement the original UI while integrating with the backend API as specified in [接口文档.md](file:///Users/cin/code/project/story-music-ai/接口文档.md).

## Technical Stack
1. **Framework**: React 18 with Vite and TypeScript.
2. **Styling**: Tailwind CSS for utility-first styling.
3. **Animations**: Framer Motion for complex transitions and watercolor effects.
4. **Icons**: Lucide React.
5. **API Client**: Axios for handling backend requests.

## Implementation Steps

### 1. Project Initialization
- Create the `frontend` directory and initialize a Vite project.
- Install all necessary dependencies (`framer-motion`, `lucide-react`, `axios`, `tailwindcss`, etc.).
- Configure Tailwind CSS to match the existing design patterns.

### 2. Project Structure
- `frontend/src/components`: Reusable UI components (e.g., `GlassCard`, `PrimaryButton`, `InkTransition`).
- `frontend/src/api`: API service layer to handle communication with the backend.
- `frontend/src/types`: TypeScript definitions for API responses and state.
- `frontend/src/App.tsx`: Main logic orchestration and stage management.

### 3. UI Migration & Refactoring
- **Components**: Extract `GlassCard`, `PrimaryButton`, and the complex `InkTransition` into dedicated files for better maintainability.
- **Styling**: Ensure all Tailwind classes and custom CSS (like the SVG filters for watercolor effects) are correctly ported.
- **State Management**: Update the state logic to handle `session_id` and transition between stages based on real API feedback.

### 4. API Integration
- Replace mock data and `setTimeout` delays with actual API calls:
    - `POST /sessions`: Initialize a new creation session.
    - `POST /sessions/{session_id}/story`: Submit user stories and retrieve AI-generated summaries/lyrics.
    - `POST /sessions/{session_id}/lyrics/lock`: Save the selected/edited lyrics.
    - `POST /sessions/{session_id}/music/generate`: Trigger music generation.
    - `GET /sessions/{session_id}/music/status`: Poll for generation progress.

### 5. Verification
- Verify that all 5 stages (Story Intake, Brief, Lyrics, Scene Style, Result) function correctly with the backend.
- Ensure the "Watercolor" transitions remain smooth and visually identical to the original implementation.

## Note
- I will not modify any files in the root directory except for creating the `frontend` folder.
- All frontend-related logic will be encapsulated within the `frontend` directory.

Do you want me to proceed with these steps?