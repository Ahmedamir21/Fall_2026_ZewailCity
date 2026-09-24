
## Local Development

Prerequisites: Node.js `^20.19.0` or `>=22.12.0`.

```bash
git clone https://github.com/Ahmedamir21/Fall_2026_ZewailCity.git
cd Fall_2026_ZewailCity

# The planner's package.json lives in the nested project folder:
cd "Final_Fall_2026_ZewailCity/Templates-Final-Final-main/Zewail-City-Templates-arena-01a09711-zewail-city-templates/Final_Fall_2026_ZewailCity/Final_Fall_2026_Zewail"

npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build → single self-contained dist/index.html
npm run preview   # Serve the production build locally
```

### Tests

```bash
npm run test:harness   # Core scheduling engine, share codec, state persistence, preferences
npm run test:ssr       # Full-app server-side rendering smoke test
npm run test:ui        # Real-DOM UI interaction tests
```

### AI Assistant locally

The assistant's serverless function (`app/api/assistant.ts`) expects a `GEMINI_API_KEY` environment variable (see `.env.example` under the nested project template folder for the variable names). Without it configured, the assistant reports itself as unconfigured; the rest of the planner is unaffected.

## Deployment (Vercel)

The project deploys from the top-level `app/` directory:

- `app/vercel.json` sets `buildCommand: npm run build`, `outputDirectory: dist`, and configures the `api/assistant.ts` serverless function.
- `app/package.json`'s `build` script installs and builds the nested planner project, then copies its `dist/` output into `app/dist`.
- `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) must be set in the Vercel project's Environment Variables for the AI assistant to work in production.

Live deployment: https://fall-2026-zewail-city.vercel.app/

## Data Accuracy & Limitations

- Course, section, instructor, and timing data reflects a manually compiled snapshot for the **Fall 2026** session and is not synced with Self-Service in any automated way.
- University-side changes to offerings, instructors, or section times made after data collection will not automatically appear here.
- The Best Schedule engine runs within a bounded search budget; for very large combination spaces, results may be the best found within that budget rather than exhaustively optimal.
- **Always verify your final schedule in the official Zewail City Self-Service portal before registering.** This tool does not submit, hold, or affect your actual registration in any way.

## Contributing

This is a student project. Issues and pull requests are welcome — please keep changes scoped and include relevant test coverage (`npm run test:harness`, `npm run test:ssr`, `npm run test:ui`) where applicable.

## Disclaimer

This is an independent, student-built planning tool for Zewail City students. It is **not an official Zewail City product** and is **not connected to the Self-Service registration system**. All course, section, and instructor data should be independently verified against the official registration portal before finalizing any course registration.
