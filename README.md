# ReactTyper

A typing speed test web application built with React, TypeScript, and Vite.

## Features

- 60-second timed typing test with live WPM and accuracy tracking
- Light and dark theme toggle with FOUC prevention
- Pause, Resume, Quit, Reset, and Refresh controls
- Three-state character feedback: correct (green), incorrect (red), fixed (gold)
- Infinite word bank that extends as you type
- Results display with WPM, raw WPM, accuracy, and error count

## Tech Stack

- **React 19** with TypeScript (strict mode)
- **Redux Toolkit** for state management
- **Vite 8** for build tooling
- **Vitest** for testing
- **ESLint + Prettier** for code quality
- **Sentry** for error monitoring
- **CSS Modules** with CSS custom properties for theming

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type-check |

## Project Structure

```
src/
  app/                  # Store configuration, hooks, root reducer
  features/
    typing/             # Typing test feature
      components/       # TypingTest, TypingInput, TypingDisplay, ResultsDisplay
      hooks/            # useTypingTest, useTimer
      state/            # Redux slice, selectors, types
      tests/            # Unit tests for utilities
      utils/            # Word list, WPM/accuracy calculations
    theme/              # Light/dark theme toggle
  shared/               # Shared components, hooks, utils, constants
  infrastructure/       # Logging, monitoring (Sentry)
```

## Testing

Tests use Vitest with React Testing Library. The test runner requires the `vmThreads` pool due to resource constraints:

```bash
npx vitest run --pool=vmThreads --no-file-parallelism
```
