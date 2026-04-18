# WordWise

WordWise is a travel map app built with React, React Router, Leaflet, `json-server`, Express, and the OpenAI API. Users can click on the map to either record a visited city or open an AI exploration flow for places they have not visited yet.

## Project Highlights

- Organized the frontend with layered `pages / components / hooks / contexts` structure for clearer feature boundaries.
- Encapsulated 3 custom hooks: `useGeolocation`, `useUrlPosition`, and `useReverseGeocoding` to reuse map positioning, URL parsing, and reverse geocoding logic.
- Designed 2 core business flows: `visited` for trip recording and `explore` for AI-assisted city discovery.
- Implemented 6 core feature chains: map click selection, city markers, current-position locating, reverse geocoding, city CRUD, and AI Q&A.
- Integrated the OpenAI API to support 3 interaction modes: preset prompts, custom questions, and chat-style result rendering.

## Local Development

1. Install dependencies with `npm install`
2. Start the frontend with `npm run dev`
3. Start the mock city data service with `npm run server`
4. Add `OPENAI_API_KEY` to `.env`
5. Start the AI service with `npm run ai`

## Services

- Frontend: `http://localhost:5173`
- City data service: `http://localhost:9000`
- AI service: `http://localhost:8000/api/city-assistant`
