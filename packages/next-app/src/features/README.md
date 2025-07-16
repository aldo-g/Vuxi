# Features Directory

## Overview
The `features/` directory contains all business logic organized by functional domains. Each feature is self-contained with its own components, hooks, types, and business logic, following a feature-based architecture pattern.

## Architecture Philosophy
- **Feature Isolation**: Each feature manages its own state, components, and logic
- **Clear Boundaries**: Well-defined interfaces between features
- **Shared Resources**: Common utilities and components live in the root `src/` directory
- **Barrel Exports**: Clean import paths through `index.ts` files
- **Type Safety**: Comprehensive TypeScript types for each domain

## Feature Structure
Each feature follows a consistent internal structure:
```
feature-name/
├── components/     # UI components specific to this feature
├── hooks/         # Custom React hooks for business logic
├── types/         # TypeScript type definitions
├── utils/         # Feature-specific utility functions (optional)
├── constants/     # Feature-specific constants (optional)
└── index.ts       # Barrel export file
```

## Current Features

### 🔍 [Analysis](./analysis/README.md)
**Purpose**: Website UX analysis workflow management
- Multi-step wizard for analysis setup
- Website capture and screenshot management
- AI-powered analysis job orchestration
- Real-time progress tracking and polling

**Key Components**: `AnalysisWizard`, `ScreenshotReview`, `AnalysisProgress`

---

### 🔐 [Auth](./auth/README.md)
**Purpose**: User authentication and session management
- User login and registration forms
- Form validation and error handling
- Authentication state management
- Secure route protection foundation

**Key Components**: `LoginForm`, `RegisterForm`

---

### 📊 [Reports](./reports/README.md)
**Purpose**: Analysis results display and navigation
- Executive summary dashboards
- Detailed page-by-page analysis views
- Score visualization and progress indicators
- Report browsing and navigation

**Key Components**: `ExecutiveSummary`, `PageAnalysisCard`, `ScoreBadge`

## Import Patterns

### Feature-Level Imports
```typescript
// Import entire feature barrel
import { LoginForm, RegisterForm, useAuth } from '@/features/auth';

// Import specific components
import { AnalysisWizard } from '@/features/analysis';
import { ExecutiveSummary } from '@/features/reports';
```

### Root-Level Imports
```typescript
// Import from root features barrel (includes all features)
import { LoginForm, AnalysisWizard, ExecutiveSummary } from '@/features';
```

### Cross-Feature Dependencies
Features should minimize dependencies on each other. When cross-feature communication is needed:
- Use shared types from `@/types`
- Share data through URL parameters or global state
- Communicate via shared hooks in `@/hooks`

## Development Guidelines

### Adding New Features
1. Create feature directory with standard structure
2. Add feature-specific types to `types/index.ts`
3. Implement components following existing patterns
4. Add custom hooks for business logic
5. Export public interface through feature `index.ts`
6. Update main features `index.ts` with new exports
7. Create feature README documenting purpose and usage

### Feature Boundaries
- **Keep features independent**: Avoid importing from other features
- **Share through root**: Use `@/components`, `@/hooks`, `@/lib` for shared code
- **Clear interfaces**: Export only what other parts of the app need
- **Type safety**: Define comprehensive types for all feature data

### Best Practices
- **Single Responsibility**: Each feature owns one business domain
- **Consistent Structure**: Follow the established directory pattern
- **Comprehensive Types**: Define types for all data and interfaces
- **Error Boundaries**: Handle errors gracefully within features
- **Testing**: Test features in isolation when possible

## Shared Resources
Features utilize shared resources from the root `src/` directory:

- **`@/components`**: Reusable UI components (buttons, forms, layouts)
- **`@/hooks`**: Application-wide custom hooks
- **`@/lib`**: Utilities, constants, configurations
- **`@/types`**: Global type definitions
- **`@/styles`**: Global styles and themes

## Feature Communication
When features need to communicate:

1. **URL Parameters**: Pass data through route parameters
2. **Global State**: Use React Query or other global state for shared data
3. **Event System**: Custom events for loose coupling
4. **Shared Hooks**: Common data fetching or state management hooks

## Future Features
Potential features to consider:
- **Dashboard**: User dashboard with analytics and recent reports
- **Settings**: User preferences and application configuration
- **Projects**: Project management and organization
- **Teams**: Multi-user collaboration features
- **Integrations**: Third-party service connections

## Migration Guide
When refactoring existing code into features:
1. Identify business domains and responsibilities
2. Group related components, hooks, and types
3. Create feature directory structure
4. Move code into appropriate feature subdirectories
5. Update import paths throughout the application
6. Add feature documentation and exports
