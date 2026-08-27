# AGENTS.md  
## ReactTyping Web Application — Agentic Development Standards  
### Purpose  
This document defines the rules, constraints, and expectations for using agentic ai to develop this Typing Application. The model acts as a development-time assistant responsible for generating code, tests, documentation, refactoring proposals, and architectural guidance.  
The model **does not run inside the application** and has no runtime responsibilities.

This file ensures the project is built and maintained according to **enterprise-grade engineering standards**: SOLID, Clean Code, performance, security, observability, and testability.

---

## 1. Architectural Standards  
### 1.1 Tech Stack  
- **React 18+ with TypeScript (strict mode)**  
- **Redux Toolkit + RTK Query** for enterprise-grade state management  
- **React Testing Library + Vitest**  
- **Sentry** for production error monitoring  
- **Custom structured logger** for dev + prod  
- **ESLint + Prettier** with strict rules  
- **Vite** as the default build tool (may be replaced later via ADR)

---

## 2. Core Engineering Principles  
### 2.1 SOLID  
The model must enforce:  
- **Single Responsibility:** Components, hooks, and utilities must do one thing.  
- **Open/Closed:** Extend via composition, avoid unnecessary modification of core logic.  
- **Liskov Substitution:** All abstractions must be mockable and testable.  
- **Interface Segregation:** Prefer small, focused TypeScript interfaces.  
- **Dependency Inversion:** Business logic must not depend on UI components.

### 2.2 Clean Code  
The model must ensure:  
- No magic numbers or strings (use constants).  
- No `any` types.  
- Small components (<150 lines).  
- Pure functions for WPM/accuracy calculations.  
- Explicit return types everywhere.  
- No side effects in reducers or pure utilities.  
- Meaningful naming conventions.

### 2.3 Performance  
The model must enforce:  
- Keystroke capture must be **zero-latency**:
  - No debouncing or throttling on raw input events  
  - Stable callbacks (`useCallback`)  
  - Memoized derived values (`useMemo`)  
  - Avoid unnecessary re-renders (selector granularity, component boundaries)  
- WPM/accuracy calculations must be:
  - O(1) per keystroke  
  - Pure and isolated  
  - Covered by performance tests  
- Rendering must maintain **60 FPS** during typing sessions.

---

## 3. Security & Compliance  
The model must enforce:  
- No PII collection.  
- No storing keystrokes beyond session metrics.  
- No external dependencies without justification.  
- No unsafe HTML injection.  
- Use `DOMPurify` if user-generated content is ever introduced.  
- Follow OWASP recommendations for frontend security.  
- Authentication (future phase) must follow:
  - Token-based auth  
  - Secure storage (never localStorage for tokens)  
  - Proper logout and token invalidation  

---

## 4. Observability  
The model must enforce:  
- **Custom logger** with:
  - Levels: debug, info, warn, error  
  - Context metadata  
  - Correlation IDs  
- **Sentry integration** for:
  - Error boundaries  
  - Performance traces  
  - Breadcrumbs  
- No `console.log` in production code.

---

## 5. Testing Standards  
The model must enforce:  
- **Minimum 85% coverage** (lines, branches, functions).  
- Every new file requires a corresponding test file.  
- Required test types:
  - Unit tests (utilities, hooks, reducers)  
  - Integration tests (typing flow, metrics calculation)  
  - Component tests (UI correctness)  
  - Performance tests (keystroke latency)  
- The model must generate:
  - Edge-case tests  
  - Regression tests  
  - Tests for all reducers and selectors  
- The model must NEVER reduce coverage thresholds.

---

## 6. Project Structure  
The model must enforce the following structure:

```
src/
  app/
    store.ts
    rootReducer.ts
  features/
    typing/
      components/
      hooks/
      services/
      state/
      tests/
    auth/ (future)
  shared/
    components/
    hooks/
    utils/
    constants/
    types/
  infrastructure/
    logging/
    monitoring/
    api/
```

Rules:  
- No new top-level folders without explicit approval.  
- Features must be isolated and self-contained.  
- Shared utilities must be generic and reusable.

---

### 6.1 Domain Model Separation Rule
All TypeScript types, interfaces, and domain models must be scoped to their feature or infrastructure domain.
They must not be grouped into multi-domain files. For example:
- Logging types belong in `infrastructure/logging/`
- Theme types belong in `features/theme/`
- Typing test types belong in `features/typing/`

A file must represent a single cohesive domain. The model must never generate or expand “catch‑all” type files.

---

## 7. Model Responsibilities (Development-Time Only)

### 7.1 Code Quality Responsibilities  
- Enforce architecture, SOLID, Clean Code, and structure.  
- Provide refactoring proposals.  
- Detect anti-patterns.  
- Correct folder structure issues.  
- Improve naming conventions.  
- Reduce complexity where appropriate.  
**Constraints:**  
- Must not auto-create new abstractions without justification.  
- Must not introduce new dependencies without approval.

---

### 7.2 Performance Responsibilities  
- Ensure keystroke capture and rendering remain high-performance.  
- Provide render profiling insights.  
- Analyze keystroke latency.  
- Recommend memoization and selector optimization.  
**Constraints:**  
- Must not introduce debouncing/throttling on raw input events.  
- Must not modify core typing logic without explicit instruction.

---

### 7.3 Testing Responsibilities  
- Maintain enterprise-grade test coverage.  
- Generate test cases.  
- Detect coverage gaps.  
- Propose edge-case scenarios.  
- Suggest regression tests.  
**Constraints:**  
- Must follow project testing conventions.  
- Must not reduce coverage thresholds.  
- Must not generate brittle tests.

---

### 7.4 Documentation Responsibilities  
- Maintain professional documentation.  
- Generate JSDoc for utilities and hooks.  
- Document components.  
- Produce ADRs for architectural decisions.  
- Update README sections.  
**Constraints:**  
- Must ensure clarity and correctness.  
- Must avoid overly verbose documentation.

---

## 8. Interaction Rules  
The model must follow these rules when generating code or suggestions:

- All changes must be deterministic and reproducible.  
- All generated code must compile and pass linting.  
- All generated code must include tests.  
- The model must NEVER modify:
  - Coverage thresholds  
  - Linting rules  
  - Build configuration  
- The model must NEVER create:
  - New folders without justification  
  - New abstractions without need  
  - New dependencies without approval  
- The model must ALWAYS:
  - Follow SOLID  
  - Follow Clean Code  
  - Follow project structure  
  - Follow security standards  
  - Follow performance constraints  

---

## 9. Governance  
- All model-generated changes must be reviewed by a human.  
- All architectural changes require an ADR.  
- The model must follow this AGENTS.md strictly.  
- Violations must be corrected before merging.

---

## 10. Future Extensions  
- Backend integration (Node + TypeScript or .NET)  
- Authentication module  
- User profiles and progress tracking  
- Advanced analytics  
- Adaptive difficulty engine