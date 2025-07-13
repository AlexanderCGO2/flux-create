# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Starts both Next.js and Electron in development mode
- `npm run dev:next` - Runs only Next.js development server
- `npm run dev:electron` - Runs only Electron in development mode

### Building & Distribution
- `npm run build` - Builds Next.js and compiles TypeScript for Electron
- `npm run build:next` - Builds only Next.js
- `npm run build:electron` - Compiles only Electron TypeScript files
- `npm start` - Runs the built Electron application
- `npm run dist` - Creates distributable packages for Mac, Windows, and Linux

### Code Quality
- `npm run lint` - Runs ESLint for code linting
- `npm run format` - Runs Prettier for code formatting
- `npm run type-check` - Runs TypeScript type checking
- `npm test` - Runs Jest tests
- `npm run test:watch` - Runs Jest in watch mode

## Architecture

### Tech Stack
- **Desktop Framework**: Electron 27 with Next.js 14 embedded
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom glass morphism theme
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack Query (React Query)
- **Canvas**: React Konva for image editing capabilities
- **AI Integration**: 
  - OpenAI SDK for voice processing
  - Replicate API for Flux model generation
  - Custom API routes in `/src/app/api/` for AI operations

### Project Structure
- `/electron/` - Electron main process and preload scripts
- `/src/app/` - Next.js app router pages and API routes
- `/src/components/` - React components organized by feature
  - `canvas/` - Canvas and drawing components
  - `editor/` - Editor panels and controls
  - `voice/` - Voice control UI components
  - `ui/` - Shared UI components with glass morphism design
- `/src/hooks/` - Custom React hooks for voice, canvas, and keyboard controls
- `/src/lib/` - Services and utilities
  - `ai/` - AI integration services (Flux, voice)
  - `providers/` - React context providers
- `/src/types/` - TypeScript type definitions

### Key Architectural Patterns
1. **Electron + Next.js Integration**: Next.js runs as the renderer process within Electron, loaded via custom protocol
2. **AI Service Layer**: All AI operations go through API routes that handle authentication and model communication
3. **Voice Control System**: Uses Web Speech API with OpenAI for natural language processing
4. **Canvas State Management**: Zustand store manages canvas elements, layers, and editing state
5. **Glass Morphism UI**: Consistent design system using Tailwind CSS with backdrop filters and transparency

### API Routes
- `/api/ai/flux` - Handles Flux model image generation
- `/api/ai/rembg` - Background removal processing
- `/api/ai/upscale` - 4K upscaling service
- `/api/voice/process` - Voice command processing

### Development Notes
- The app uses strict TypeScript configuration with comprehensive type checking
- Electron security is configured with sandboxing and CSP headers
- Hot reload works in development for both Electron and Next.js
- The canvas system supports layers, blend modes, and real-time filters
- Voice commands are processed through OpenAI with custom action mappings