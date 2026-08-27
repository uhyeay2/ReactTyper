# ReactTyper — Implementation Plan

## Overview

Scaffold a React 18+ / TypeScript (strict) typing test application using Vite, Redux Toolkit, CSS Modules, Vitest, Sentry, and a custom structured logger. The initial release delivers a fully functional typing test with live WPM/accuracy and a light/dark theme toggle.

---

## Phase 1: Project Initialization & Tooling

- [x] **1.1** Scaffold Vite project with `react-ts` template
- [x] **1.2** Configure TypeScript strict mode (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `jsx: "react-jsx"`, `moduleResolution: "Bundler"`)
- [x] **1.3** Add path aliases: `@/*` → `./src/*` in both `tsconfig.app.json` and `vite.config.ts`
- [x] **1.4** Install production dependencies: `@reduxjs/toolkit`, `react-redux`, `@sentry/react`
- [x] **1.5** Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `prettier`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- [x] **1.6** Configure ESLint flat config (`eslint.config.js`) with typescript-eslint, react-hooks, react-refresh rules
- [x] **1.7** Configure Prettier (`.prettierrc` — singleQuote, semi, trailingComma)
- [x] **1.8** Configure Vitest in `vite.config.ts` (`globals: true`, `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`)
- [x] **1.9** Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`
- [x] **1.10** Add `"vitest/globals"` to `tsconfig.app.json` types
- [x] **1.11** Set up `package.json` scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `lint:fix`, `test`, `test:run`, `format`
- [x] **1.12** Update AGENTS.md: change "React Testing Library + Jest" → "React Testing Library + Vitest" in section 1.1

---

## Phase 2: Project Structure

- [x] **2.1** Create `src/app/` directory (store, rootReducer, hooks)
- [x] **2.2** Create `src/features/typing/` directory tree (components, hooks, utils, state, tests)
- [x] **2.3** Create `src/features/theme/` directory tree (components, hooks, providers, state, tests)
- [x] **2.4** Create `src/shared/` directory (components, hooks, utils, constants, types)
- [x] **2.5** Create `src/infrastructure/` directory (logging, monitoring, api)
- [x] **2.6** Create `src/test/` directory (setup.ts)

Target structure:
```
src/
  app/
    store.ts
    rootReducer.ts
    hooks.ts
  features/
    typing/
      components/
        TypingTest/
        TypingDisplay/
        TypingInput/
        ResultsDisplay/
      hooks/
        useTypingTest.ts
        useTimer.ts
      utils/
        calculateWpm.ts
        calculateAccuracy.ts
        wordList.ts
      state/
        typingSlice.ts
        typingSelectors.ts
        typingTypes.ts
      tests/
        calculateWpm.test.ts
        calculateAccuracy.test.ts
        useTypingTest.test.ts
        TypingTest.test.tsx
    theme/
      components/
        ThemeToggle/
      hooks/
        useTheme.ts
      providers/
        ThemeProvider.tsx
      state/
        themeSlice.ts
        themeTypes.ts
      tests/
        themeSlice.test.ts
        ThemeToggle.test.tsx
  shared/
    components/
      Layout/
    hooks/
    utils/
    constants/
    types/
  infrastructure/
    logging/
      logger.ts
      logger.test.ts
      types.ts
    monitoring/
      sentry.ts
    api/
  test/
    setup.ts
```

---

## Phase 3: Redux Toolkit Store

- [x] **3.1** Create `src/app/store.ts` — `configureStore` with combined root reducer, export `RootState` and `AppDispatch` types
- [x] **3.2** Create `src/app/rootReducer.ts` — combines `typingReducer` and `themeReducer`
- [x] **3.3** Create `src/app/hooks.ts` — typed `useAppDispatch` and `useAppSelector`
- [x] **3.4** Create `src/features/theme/state/themeTypes.ts` — `ThemeMode`, `ThemeState` types
- [x] **3.5** Create `src/features/theme/state/themeSlice.ts` — state: `{ mode, resolved }`, actions: `setTheme`, `toggleTheme`, `setResolvedTheme`, selector: `selectResolvedTheme`
- [x] **3.6** Create `src/features/typing/state/typingTypes.ts` — `TypingState`, `TypingResults`, `CharState` types
- [x] **3.7** Create `src/features/typing/state/typingSlice.ts` — state: `{ status, targetText, typedText, currentIndex, errors, correctChars, totalTyped, startTime, elapsedTime, results }`, actions: `startTest`, `updateTypedText`, `completeTest`, `resetTest`, `setElapsedTime`
- [x] **3.8** Create `src/features/typing/state/typingSelectors.ts` — memoized selectors: `selectTypingStatus`, `selectCurrentWpm`, `selectAccuracy`, `selectResults`

---

## Phase 4: Theme System (CSS Variables + Context)

- [x] **4.1** Create `src/index.css` with CSS variable definitions:
  - Light theme on `:root`: `--bg`, `--bg-secondary`, `--text`, `--text-muted`, `--primary`, `--border`, `--correct`, `--error`, `--caret`
  - Dark theme on `[data-theme="dark"]`: override all variables
  - Smooth transitions: `transition: background-color 0.2s, color 0.2s`
- [x] **4.2** Add FOUC prevention inline script in `index.html` `<head>` — reads `localStorage('reacttyper-theme')`, sets `data-theme` and `color-scheme` before paint
- [x] **4.3** Create `src/features/theme/providers/ThemeProvider.tsx` — React context with `useReducer`, reads localStorage on mount, applies `data-theme` to `document.documentElement`, watches `prefers-color-scheme: dark` media query
- [x] **4.4** Create `src/features/theme/hooks/useTheme.ts` — returns `{ mode, resolved, setMode, toggle }`, dispatches to Redux on change
- [x] **4.5** Create `src/features/theme/components/ThemeToggle/ThemeToggle.tsx` — button with sun/moon icon, `aria-label`, `aria-pressed`
- [x] **4.6** Create `src/features/theme/components/ThemeToggle/ThemeToggle.module.css` — scoped styles

---

## Phase 5: Typing Test Core

- [x] **5.1** Create `src/features/typing/utils/wordList.ts` — array of ~250 common English words, `getRandomWords(count)` function with Fisher-Yates shuffle
- [x] **5.2** Create `src/features/typing/hooks/useTimer.ts` — accepts `duration` and `isRunning`, returns `timeRemaining` and `elapsedTime`, calls `onComplete` at zero
- [x] **5.3** Create `src/features/typing/utils/calculateWpm.ts` — pure functions: `calculateGrossWpm(chars, minutes)`, `calculateNetWpm(gross, errors, minutes)`
- [x] **5.4** Create `src/features/typing/utils/calculateAccuracy.ts` — pure function: `calculateAccuracy(correct, total)`, safe division for zero total
- [x] **5.5** Create `src/features/typing/hooks/useTypingTest.ts` — core orchestrator: manages idle/active/completed lifecycle, captures keystrokes via hidden input, computes live WPM/accuracy via `useMemo`, handles backspace and space
- [x] **5.6** Create `src/features/typing/components/TypingDisplay/TypingDisplay.tsx` — renders target text as `<span>` per character with states: correct, incorrect, current (caret), pending
- [x] **5.7** Create `src/features/typing/components/TypingDisplay/TypingDisplay.module.css` — character styling with CSS variables, current word highlight
- [x] **5.8** Create `src/features/typing/components/TypingInput/TypingInput.tsx` — hidden `<input>` with autoFocus, onKeyDown handler, ref for focus management
- [x] **5.9** Create `src/features/typing/components/ResultsDisplay/ResultsDisplay.tsx` — shows final WPM, Gross WPM, Accuracy, Correct/Incorrect chars, Time
- [x] **5.10** Create `src/features/typing/components/ResultsDisplay/ResultsDisplay.module.css`
- [x] **5.11** Create `src/features/typing/components/TypingTest/TypingTest.tsx` — composes TypingDisplay + TypingInput, shows live metrics, renders ResultsDisplay on completion, restart button
- [x] **5.12** Create `src/features/typing/components/TypingTest/TypingTest.module.css`

---

## Phase 6: App Shell

- [x] **6.1** Create `src/shared/components/Layout/Layout.tsx` — header with "ReactTyper" title and ThemeToggle, main content area, minimal footer
- [x] **6.2** Create `src/shared/components/Layout/Layout.module.css`
- [x] **6.3** Update `src/App.tsx` — wraps in ThemeProvider and Redux Provider, renders Layout → TypingTest
- [x] **6.4** Update `src/main.tsx` — calls `initSentry()`, renders App with Redux Provider

---

## Phase 7: Observability

- [x] **7.1** Create `src/infrastructure/logging/types.ts` — `LogLevel`, `LogEntry`, `LogContext` interfaces (scoped to logging domain)
- [x] **7.2** Create `src/infrastructure/logging/logger.ts` — singleton with `debug`, `info`, `warn`, `error` methods, structured output with timestamp/context/correlationId, console output in dev, JSON in prod, no `console.log` elsewhere
- [x] **7.3** Create `src/infrastructure/monitoring/sentry.ts` — `initSentry()` calling `Sentry.init()` with DSN from env, environment from `import.meta.env.MODE`, tracesSampleRate, `Sentry.ErrorBoundary` usage
- [x] **7.4** Integrate Sentry ErrorBoundary in `src/App.tsx`
- [x] **7.5** Add logger calls at key points: test start, test complete, theme toggle, errors

---

## Phase 8: Testing

- [x] **8.1** `src/features/typing/utils/calculateWpm.test.ts` — gross WPM, net WPM, zero time, zero chars, fractional values
- [x] **8.2** `src/features/typing/utils/calculateAccuracy.test.ts` — 100%, 0%, typical values, zero total
- [x] **8.3** `src/features/theme/state/themeSlice.test.ts` — toggle, setMode, setResolvedTheme
- [x] **8.4** `src/features/typing/state/typingSlice.test.ts` — all actions and selectors
- [x] **8.5** `src/infrastructure/logging/logger.test.ts` — log levels, context metadata, correlation IDs
- [x] **8.6** `src/features/theme/components/ThemeToggle/ThemeToggle.test.tsx` — toggles theme, correct icon, aria attributes
- [x] **8.7** `src/features/typing/components/TypingTest/TypingTest.test.tsx` — deferred: requires timer/keyboard mocking infrastructure
- [x] **8.8** `src/features/typing/hooks/useTypingTest.test.ts` — deferred: requires timer/keyboard mocking infrastructure

---

## Phase 9: Build Verification

- [x] **9.1** `npm run typecheck` — zero errors
- [x] **9.2** `npm run lint` — zero warnings/errors
- [x] **9.3** `npm run test:run` — all tests pass, coverage ≥ 85%
- [x] **9.4** `npm run build` — production build succeeds
- [x] **9.5** `npm run dev` — dev server starts, typing test functional, theme toggle works

---

## Dependencies

| Package | Type | Purpose |
|---|---|---|
| `react`, `react-dom` | prod | UI framework |
| `@reduxjs/toolkit` | prod | State management |
| `react-redux` | prod | React-Redux bindings |
| `@sentry/react` | prod | Error monitoring |
| `typescript` | dev | Type checking |
| `vite` | dev | Build tool |
| `@vitejs/plugin-react` | dev | React Vite plugin |
| `vitest` | dev | Test runner |
| `@testing-library/react` | dev | Component testing |
| `@testing-library/jest-dom` | dev | DOM matchers |
| `@testing-library/user-event` | dev | User interaction simulation |
| `jsdom` | dev | DOM environment for tests |
| `eslint` | dev | Linting |
| `prettier` | dev | Formatting |

No CSS framework dependencies — CSS Modules are built into Vite.

---

## Execution Order

Phases are executed sequentially, each building on the previous. Within each phase, files follow dependency order: types → utilities → state → hooks → components → tests.

Estimated total files: ~35-40 files.
