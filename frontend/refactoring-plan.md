# WebSlayer Frontend Refactoring Plan

This document outlines a comprehensive plan for refactoring the WebSlayer frontend to make it more secure, modular, consistent, and aligned with Remix best practices. Each task is presented in a checklist format so they can be marked as completed during implementation.

## 1. Security Improvements

### 1.1 API Error Handling
- [ ] Create a centralized error handling utility in `app/utils/errorHandling.ts`
  - [ ] Implement standardized error response types
    - Current issue: Inconsistent error handling in `api.server.ts` (lines 44-46, 58-60, 90-93, etc.)
    - Goal: Create a unified error response interface that includes status code, message, and details
    - Example: `interface ApiError { status: number; message: string; details?: any; }`
  - [ ] Add sanitization for error messages displayed to users
    - Current issue: Raw error messages from backend are displayed directly to users in `api.projects.tsx` (lines 74-89)
    - Goal: Sanitize error messages to remove sensitive information and provide user-friendly messages
  - [ ] Create custom error classes for different error types
    - Create specific error classes like `ApiConnectionError`, `ValidationError`, `AuthenticationError`
    - Files to modify: Create new file `app/utils/errors.ts`
- [ ] Refactor all API calls to use the centralized error handling
  - [ ] Update `api.server.ts` to use the new error handling utility
    - Focus on functions: `startScrapeJob`, `getJobStatus`, `getAllSchemaNames`, etc.
    - Replace direct `throw new Error()` with proper error handling
  - [ ] Ensure consistent error handling across all API routes
    - Files to modify: `api.projects.tsx`, `api.schema.tsx`, `api.job-status.$jobId.tsx`
    - Replace the `handleApiError` function in `api.projects.tsx` (lines 4-13) with the centralized utility

### 1.2 Environment Variables
- [ ] Enhance environment variable handling in `app/utils/env.server.ts`
  - [ ] Add validation for environment variable types and formats
    - Current issue: Basic implementation in `env.server.ts` without type validation
    - Goal: Add validation for URL formats, API keys, and other critical values
    - Example: Validate that `API_URL` is a valid URL format
  - [ ] Implement environment-specific configurations
    - Create separate configurations for development, testing, and production
    - Add support for loading different variables based on `NODE_ENV`
  - [ ] Document required environment variables
    - Add JSDoc comments to explain each environment variable's purpose and format
- [ ] Create a `.env.example` file with all required variables
  - Include all necessary variables with example values
  - Add comments explaining each variable's purpose
- [ ] Add environment variable validation at application startup
  - Modify `entry.server.tsx` to validate environment variables during server startup
  - Fail fast if critical variables are missing or invalid

### 1.3 Form Submissions
- [ ] Implement CSRF protection for all form submissions
  - [ ] Create a CSRF token utility in `app/utils/csrf.server.ts`
    - Implement token generation, validation, and storage
    - Use Remix's session mechanism to store tokens
  - [ ] Add CSRF token to all forms
    - Current issue: Forms in `ProjectCards.tsx` (line 41) and `_index.tsx` (line 144) lack CSRF protection
    - Add hidden input field for CSRF token to all forms
- [ ] Add client-side form validation
  - [ ] Create reusable validation hooks in `app/hooks/useFormValidation.ts`
    - Implement validation logic for common fields (URLs, project names, etc.)
    - Support custom validation rules
  - [ ] Implement validation schemas for all forms
    - Create validation schemas for project creation, schema creation, etc.
    - Validate form data before submission to prevent unnecessary API calls
- [ ] Replace direct `fetcher.submit()` calls with Remix's `Form` component
  - [ ] Update `ProjectCards.tsx` form submission (line 41)
    - Replace `fetcher.submit(formData, { method: "DELETE", action: "/api/projects" });` with Remix's `Form`
  - [ ] Update all other form submissions in the application
    - Files to check: `_index.tsx`, `projects.$projectId.tsx`, `schemas.new.tsx`

### 1.4 Data Sanitization
- [ ] Implement input sanitization for all user inputs
  - [ ] Create a sanitization utility in `app/utils/sanitization.ts`
    - Implement functions to sanitize strings, URLs, and other input types
    - Use established libraries like DOMPurify for HTML sanitization
  - [ ] Apply sanitization to all user inputs before submission
    - Current issue: Direct form data submission in `api.projects.tsx` (lines 28-39)
    - Sanitize all user inputs before sending to API
- [ ] Implement output sanitization for all data displayed to users
  - [ ] Create a safe rendering component for user-generated content
    - Implement a `SafeHtml` component that sanitizes HTML content
    - Use for displaying any content that might contain user-generated HTML
  - [ ] Apply output sanitization to all displayed data
    - Current issue: Direct rendering of API responses in `ProjectCards.tsx` (line 87)
    - Sanitize data before displaying to prevent XSS attacks

## 2. Modularity Improvements

### 2.1 Component Structure
- [ ] Refactor large components into smaller, focused components
  - [ ] Extract reusable UI components from `ProjectCards.tsx`
    - Current issue: `ProjectCards.tsx` (lines 13-126) handles too many responsibilities (UI, state, API calls)
    - [ ] Create `ProjectCard.tsx` for individual project cards
      - Extract the card rendering logic from `ProjectCards.tsx` (lines 82-106)
      - Make it a pure presentational component that receives props and emits events
    - [ ] Create `DeleteConfirmationDialog.tsx` for reusable confirmation dialogs
      - Extract from `ConfirmationDialog` component in `ProjectCards.tsx` (lines 109-117)
      - Make it reusable across the application
  - [ ] Extract reusable UI components from `SchemaCards.tsx`
    - Current issue: Similar structure and issues as `ProjectCards.tsx`
    - [ ] Create `SchemaCard.tsx` for individual schema cards
      - Focus on making it a pure presentational component
  - [ ] Create a component library in `app/components/ui/` for reusable UI elements
    - Goal: Create a consistent UI component library that can be used across the application
    - [ ] Button
      - Create variants: primary, secondary, danger, etc.
      - Support loading states, disabled states, and icons
    - [ ] Card
      - Create a reusable card component with consistent styling
      - Support header, body, footer, and loading states
    - [ ] Input
      - Create reusable input components with validation support
      - Support different types: text, number, email, etc.
    - [ ] Modal
      - Create a reusable modal component with consistent styling
      - Support different sizes, animations, and close behaviors
    - [ ] Toast
      - Refactor existing `Toast.tsx` to be more reusable
      - Create a toast management system

### 2.2 Custom Hooks
- [ ] Create custom hooks for data fetching and state management
  - [ ] Implement `useProjects` hook in `app/hooks/useProjects.ts`
    - Current issue: Project data fetching logic is scattered across components and routes
    - Goal: Centralize project data fetching and state management
    - Implementation: Use Remix's `useFetcher` and handle loading, error, and success states
    - Example usage: `const { projects, isLoading, error, createProject, deleteProject } = useProjects();`
  - [ ] Implement `useSchemas` hook in `app/hooks/useSchemas.ts`
    - Similar to `useProjects` but for schema-related operations
    - Centralize schema data fetching and state management
  - [ ] Implement `useJobs` hook in `app/hooks/useJobs.ts`
    - Extract job-related logic from `JobContext.tsx` (lines 3-77)
    - Provide a simpler interface for job operations
- [ ] Extract form handling logic into custom hooks
  - [ ] Create `useProjectForm` hook in `app/hooks/useProjectForm.ts`
    - Current issue: Form handling logic in `_index.tsx` (lines 64-110) is complex and tightly coupled
    - Goal: Separate form handling logic from UI components
    - Implementation: Handle form state, validation, submission, and error handling
  - [ ] Create `useSchemaForm` hook in `app/hooks/useSchemaForm.ts`
    - Similar to `useProjectForm` but for schema-related forms

### 2.3 API Client
- [ ] Refactor `api.server.ts` into domain-specific API clients
  - Current issue: `api.server.ts` (lines 9-177) mixes different API domains and has inconsistent error handling
  - [ ] Create `app/api/projects.server.ts` for project-related API calls
    - Extract functions: `getProjects`, `getProjectByName`, `createOrUpdateProject`, `deleteProject`
    - Ensure consistent error handling and response typing
  - [ ] Create `app/api/schemas.server.ts` for schema-related API calls
    - Extract functions: `getAllSchemaNames`, `getSchema`, `upsertSchema`, `deleteSchema`
    - Ensure consistent error handling and response typing
  - [ ] Create `app/api/jobs.server.ts` for job-related API calls
    - Extract functions: `startScrapeJob`, `getJobStatus`
    - Ensure consistent error handling and response typing
- [ ] Implement a base API client with common functionality
  - [ ] Create `app/api/base.server.ts` with shared API client logic
    - Implement a function to create API requests with proper headers and error handling
    - Example: `async function apiRequest<T>(url: string, options?: RequestInit): Promise<T>`
  - [ ] Implement proper request/response interceptors
    - Add request interceptors for authentication, logging, etc.
    - Add response interceptors for error handling, data transformation, etc.
  - [ ] Add consistent error handling
    - Use the centralized error handling utility from section 1.1
    - Handle network errors, API errors, and validation errors consistently

### 2.4 Context Management
- [ ] Refactor context usage for better state management
  - Current issue: `JobContext.tsx` (lines 3-77) handles too many responsibilities
  - [ ] Split `JobContext.tsx` into smaller, focused contexts
    - Create separate contexts for jobs, crawl configuration, scraper configuration, and LLM configuration
    - Example: `JobContext`, `CrawlConfigContext`, `ScraperConfigContext`, `LLMConfigContext`
  - [ ] Implement proper memoization for context values
    - Use `useMemo` and `useCallback` to prevent unnecessary re-renders
    - Example: `const value = useMemo(() => ({ jobState, updateJobState }), [jobState]);`
  - [ ] Add proper TypeScript typing for all contexts
    - Ensure all context values and functions are properly typed
    - Use discriminated unions for state types where appropriate
- [ ] Consider implementing a state management library if needed
  - [ ] Evaluate options (Zustand, Jotai, etc.)
    - Consider factors like bundle size, API simplicity, and integration with Remix
    - Zustand is lightweight and has a simple API, while Jotai is more React-oriented
  - [ ] Implement chosen solution if beneficial
    - Start with a small implementation for a specific feature
    - Gradually migrate other state management if successful

## 3. Consistency Improvements

### 3.1 Type Definitions
- [ ] Resolve inconsistencies between frontend types and backend schemas
  - Current issue: Mismatch between frontend `Project` interface in `api.server.ts` (lines 15-22) and backend schema
  - [ ] Update `Project` interface to match backend schema
    - Reference the backend Pydantic models in `backend/api/models/project.py`
    - Ensure all required fields are present and have the correct types
    - Example issue: `urls` must be `List[HttpUrl]` in backend but is `string[]` in frontend
  - [ ] Update `Schema` interface to match backend schema
    - Ensure field types match exactly with backend expectations
    - Pay special attention to nested objects and arrays
  - [ ] Ensure all API response types are properly defined
    - Create proper type definitions for all API responses
    - Use discriminated unions for responses that can have different shapes
    - Example: `type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }`
- [ ] Eliminate duplicate type definitions
  - Current issue: Duplicate type definitions between `api.server.ts` (lines 9-22) and `types.ts` (lines 12-19)
  - [ ] Consolidate types from `api.server.ts` and `types.ts`
    - Move all type definitions to `types.ts`
    - Import types from `types.ts` in `api.server.ts`
  - [ ] Create a single source of truth for types
    - Organize types by domain (projects, schemas, jobs, etc.)
    - Add proper documentation for each type
- [ ] Add proper TypeScript typing for all components and functions
  - [ ] Ensure all props are properly typed
    - Use explicit interface definitions for component props
    - Example: `interface ProjectCardProps { project: Project; onDelete: (projectName: string) => void; }`
  - [ ] Add return types to all functions
    - Specify return types for all functions, especially API functions
    - Use generic types where appropriate
    - Example: `async function getProjects(): Promise<Project[]>`

### 3.2 Naming Conventions
- [ ] Standardize naming conventions across the codebase
  - Current issue: Inconsistent naming conventions throughout the codebase
  - [ ] Use camelCase for variables, functions, and component props
    - Update variables like `llm_type` to `llmType` in frontend code
    - Ensure all function names follow camelCase (e.g., `getProjectByName`)
  - [ ] Use PascalCase for component names and types
    - Ensure all component files and component names use PascalCase
    - Example: `projectCards.tsx` should be `ProjectCards.tsx`
  - [ ] Use kebab-case for file names
    - Update file names to follow kebab-case convention
    - Example: `JobContext.tsx` should be `job-context.tsx`
- [ ] Refactor API interfaces to use consistent naming
  - Current issue: Mix of snake_case (from backend) and camelCase in frontend
  - [ ] Convert snake_case properties to camelCase in frontend code
    - Update all interfaces to use camelCase
    - Example: `llm_type` should be `llmType`
  - [ ] Add proper mapping between frontend camelCase and backend snake_case
    - Create utility functions to convert between naming conventions
    - Example: `function toSnakeCase(obj: Record<string, any>): Record<string, any>`

### 3.3 Styling Approach
- [ ] Implement a more structured approach to component styling
  - Current issue: Direct Tailwind CSS classes in components leading to inconsistency and duplication
  - [ ] Extract common styles into reusable Tailwind classes
    - Create a set of utility classes in `app/styles/utilities.css`
    - Example: `.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg; }`
  - [ ] Create a theme configuration in `app/styles/theme.ts`
    - Define color palette, spacing, typography, and other design tokens
    - Use CSS variables for theme values
    - Example: `--color-primary: theme('colors.blue.600');`
  - [ ] Implement consistent spacing, colors, and typography
    - Update Tailwind configuration in `tailwind.config.ts`
    - Define custom theme extensions
    - Ensure consistent use of spacing, colors, and typography across components
- [ ] Consider implementing a component styling strategy
  - [ ] Evaluate options (CSS Modules, Styled Components, etc.)
    - Consider factors like bundle size, developer experience, and integration with Tailwind
    - CSS Modules work well with Remix and provide good scoping
  - [ ] Implement chosen solution if beneficial
    - Start with a small set of components to test the approach
    - Document the styling approach for consistency

## 4. Remix Best Practices

### 4.1 Route Structure
- [ ] Refactor route structure to leverage Remix's nested routing
  - Current issue: Flat route structure doesn't take advantage of Remix's nested routing capabilities
  - [ ] Implement proper nested routes for related pages
    - Create a `routes/projects` directory for project-related routes
    - Move `projects.$projectId.tsx` to `routes/projects/$projectId.tsx`
    - Create a `routes/projects/_layout.tsx` for shared layout
  - [ ] Create layout routes for shared UI elements
    - Create a `routes/_layout.tsx` for the main application layout
    - Extract the `Layout` component from `_index.tsx` (lines 123-183) to the layout route
- [ ] Implement resource routes for API endpoints
  - Current issue: API routes are mixed with UI routes (e.g., `api.projects.tsx`)
  - [ ] Move API logic from UI routes to resource routes
    - Create a `routes/api` directory for API routes
    - Move `api.projects.tsx` to `routes/api/projects.tsx`
    - Move `api.schema.tsx` to `routes/api/schema.tsx`
  - [ ] Create proper API route naming conventions
    - Use `.server.ts` suffix for server-only code
    - Follow RESTful naming conventions (e.g., `projects.ts` for collection, `projects.$id.ts` for item)
- [ ] Use route conventions for better code organization
  - [ ] Implement index routes for collections
    - Create `routes/projects/index.tsx` for the projects list
    - Create `routes/schemas/index.tsx` for the schemas list
  - [ ] Use dynamic routes for individual items
    - Ensure dynamic routes like `$projectId.tsx` and `$schemaName.tsx` follow Remix conventions
    - Add proper parameter validation in loaders and actions

### 4.2 Data Loading
- [ ] Implement proper error boundaries for loader errors
  - Current issue: No error boundaries for handling loader errors gracefully
  - [ ] Create a reusable error boundary component
    - Create `app/components/common/ErrorBoundary.tsx`
    - Implement both `ErrorBoundary` for client-side errors and `CatchBoundary` for loader/action errors
    - Add proper error display and recovery options
  - [ ] Add error boundaries to all routes
    - Export error boundary components from route modules
    - Example: `export function ErrorBoundary() { return <ErrorBoundaryComponent />; }`
- [ ] Move data fetching logic from components to loaders
  - Current issue: Some data fetching happens in components rather than loaders
  - [ ] Update `_index.tsx` loader to handle all data fetching
    - Move project and schema fetching from components to the loader function (lines 26-52)
    - Return properly typed data from the loader
  - [ ] Update all other route loaders
    - Review all routes to ensure data fetching happens in loaders
    - Use `defer` for non-critical data that can be loaded after initial render
- [ ] Use Remix's `useLoaderData` with proper typing
  - Current issue: Inconsistent typing for loader data
  - [ ] Add proper TypeScript types for all loader data
    - Define explicit return types for all loader functions
    - Example: `export async function loader(): Promise<LoaderData> { ... }`
  - [ ] Ensure type safety throughout the application
    - Use type assertions with `useLoaderData` hook
    - Example: `const data = useLoaderData<typeof loader>();`

### 4.3 Form Handling
- [ ] Replace manual form submissions with Remix's Form component
  - Current issue: Direct `fetcher.submit()` calls in `ProjectCards.tsx` (line 41)
  - [ ] Update all forms to use Remix's Form component
    - Replace `fetcher.Form` with Remix's `Form` component
    - Add proper `method` and `action` attributes
    - Example: `<Form method="post" action="/api/projects">`
  - [ ] Implement proper action functions for form submissions
    - Ensure all routes that handle form submissions have action functions
    - Use proper request parsing and validation
    - Return appropriate responses for success and error cases
- [ ] Use Remix's validation capabilities
  - Current issue: Manual validation in components and actions
  - [ ] Implement server-side validation in action functions
    - Add validation logic to action functions
    - Use a validation library like Zod or Yup if needed
    - Example: `const schema = z.object({ name: z.string().min(3) });`
  - [ ] Return validation errors to the client
    - Return validation errors as part of the action response
    - Use proper error status codes
    - Example: `return json({ errors: { name: 'Name is required' } }, { status: 400 });`
  - [ ] Display validation errors in the UI
    - Use `useActionData` to access validation errors
    - Display errors next to the corresponding form fields
    - Example: `const actionData = useActionData<typeof action>();`

### 4.4 Client-Side Navigation
- [ ] Leverage Remix's prefetching capabilities
  - Current issue: No prefetching for common navigation paths
  - [ ] Add prefetch hints to links
    - Use `prefetch` attribute on `Link` components
    - Example: `<Link to="/projects/123" prefetch="intent">`
  - [ ] Implement data prefetching for common navigation paths
    - Identify common navigation patterns
    - Add prefetch links for these paths
    - Consider using `<link rel="prefetch">` for critical resources
- [ ] Implement proper loading states during navigation
  - Current issue: No loading indicators during navigation
  - [ ] Create a global loading indicator
    - Use Remix's `useTransition` hook to detect loading states
    - Create a loading indicator component that appears during transitions
    - Example: `const transition = useTransition(); const isLoading = transition.state !== 'idle';`
  - [ ] Add skeleton loaders for content
    - Create skeleton components for projects, schemas, etc.
    - Show skeletons during data loading
    - Example: `{isLoading ? <ProjectSkeleton /> : <ProjectCard />}`
- [ ] Use Remix's transition API for better UX
  - Current issue: No optimistic UI updates or transition states
  - [ ] Implement optimistic UI updates
    - Use Remix's optimistic UI patterns for immediate feedback
    - Update the UI optimistically before the server responds
    - Example: Show a new project immediately after creation, then update with server response
  - [ ] Add proper transition states
    - Use `useTransition` to track the state of navigation
    - Add appropriate UI feedback for different transition states
    - Example: Disable buttons during submission, show loading states, etc.

## 5. Additional Improvements

### 5.1 Testing Strategy
- [ ] Implement unit tests for utility functions
  - Current issue: No tests found in the codebase
  - [ ] Add tests for API clients
    - Create tests for each API function in `api.server.ts`
    - Use mock fetch to test API calls without actual network requests
    - Example: Test error handling, response parsing, and edge cases
  - [ ] Add tests for utility functions
    - Focus on pure functions in `utils/` directory
    - Test edge cases and error handling
    - Example: Test environment variable handling in `env.server.ts`
  - [ ] Add tests for custom hooks
    - Use React Testing Library's `renderHook` to test custom hooks
    - Test state updates, side effects, and error handling
    - Example: Test `useProjects` hook for proper data fetching and state management
- [ ] Add component tests for UI components
  - [ ] Set up a testing framework (Jest, Testing Library)
    - Add Jest and React Testing Library to `package.json`
    - Configure Jest for TypeScript and Remix
    - Create a test setup file with common utilities
  - [ ] Create tests for all reusable components
    - Focus on UI components in `components/ui/`
    - Test rendering, user interactions, and accessibility
    - Example: Test `Button` component for proper rendering and click handling
- [ ] Implement integration tests for key user flows
  - [ ] Test project creation flow
    - Create end-to-end tests for project creation
    - Test form submission, validation, and success/error handling
    - Use Playwright or Cypress for browser-based testing
  - [ ] Test schema creation flow
    - Similar to project creation tests
    - Focus on schema-specific validation and interactions
  - [ ] Test job execution flow
    - Test job submission, status polling, and result display
    - Test error handling and recovery

### 5.2 Documentation
- [ ] Add JSDoc comments to functions and components
  - Current issue: Limited or no documentation for functions and components
  - [ ] Document all exported functions and components
    - Add JSDoc comments to all exported functions and components
    - Include parameter descriptions, return types, and examples
    - Example: 
      ```typescript
      /**
       * Fetches all projects from the API
       * @returns {Promise<Project[]>} A promise that resolves to an array of projects
       * @throws {Error} If the API request fails
       */
      export async function getProjects(): Promise<Project[]> { ... }
      ```
  - [ ] Document complex logic and algorithms
    - Add detailed comments for complex logic
    - Explain the reasoning behind implementation decisions
    - Example: Document the job status polling mechanism
- [ ] Create a README with setup and development instructions
  - [ ] Add installation instructions
    - Include prerequisites (Node.js version, etc.)
    - Document environment variables setup
    - Provide step-by-step installation instructions
  - [ ] Add development workflow
    - Document the development server setup
    - Explain the build process
    - Include debugging tips
  - [ ] Add deployment instructions
    - Document the deployment process
    - Include environment-specific configurations
    - Provide troubleshooting tips
- [ ] Document the application architecture
  - [ ] Create an architecture diagram
    - Show the main components and their relationships
    - Include data flow and user interactions
    - Use a tool like draw.io or Mermaid
  - [ ] Document key design decisions
    - Explain the reasoning behind major architectural decisions
    - Document trade-offs and alternatives considered
    - Include future improvement plans

### 5.3 Performance Optimization
- [ ] Implement proper code splitting
  - Current issue: No explicit code splitting strategy
  - [ ] Use Remix's route-based code splitting
    - Leverage Remix's automatic code splitting for routes
    - Ensure routes are properly structured for optimal code splitting
    - Example: Move large components to separate routes
  - [ ] Add dynamic imports for large dependencies
    - Identify large dependencies that aren't needed on initial load
    - Use dynamic imports to load them on demand
    - Example: `const ReactJsonView = React.lazy(() => import('react-json-view'));`
- [ ] Optimize bundle size
  - [ ] Analyze bundle size with tools like Webpack Bundle Analyzer
    - Add bundle analysis to the build process
    - Identify large dependencies and unused code
    - Example: Run `npm run build -- --analyze` to generate a bundle report
  - [ ] Reduce unnecessary dependencies
    - Review dependencies in `package.json`
    - Remove unused or redundant dependencies
    - Consider smaller alternatives for large libraries
  - [ ] Implement tree shaking
    - Ensure proper ES module imports for tree shaking
    - Configure build tools to enable tree shaking
    - Example: Use named imports instead of namespace imports
- [ ] Add proper caching strategies
  - [ ] Implement browser caching for static assets
    - Configure proper cache headers for static assets
    - Use content hashing for cache busting
    - Example: Configure the server to set `Cache-Control` headers
  - [ ] Add proper cache headers to API responses
    - Implement ETag or Last-Modified headers for API responses
    - Use conditional requests to reduce bandwidth
    - Example: Add ETag support to API routes
  - [ ] Implement data caching where appropriate
    - Identify frequently accessed data that rarely changes
    - Implement client-side caching for this data
    - Example: Cache project list with a short TTL

## Implementation Priority

1. **High Priority (Address First)**
   - Security improvements (API error handling, environment variables)
     - Focus on fixing the inconsistencies between frontend and backend types that cause 422 errors
     - Implement proper error handling for API calls
     - Enhance environment variable validation
   - Type definitions and consistency
     - Resolve the mismatch between frontend `Project` interface and backend schema
     - Consolidate duplicate type definitions
     - Standardize naming conventions
   - Route structure and data loading
     - Implement proper nested routes
     - Move data fetching to loaders
     - Add error boundaries

2. **Medium Priority**
   - Component structure refactoring
     - Extract reusable UI components
     - Create a component library
     - Implement proper component props typing
   - API client organization
     - Refactor `api.server.ts` into domain-specific clients
     - Implement consistent error handling
     - Add proper response typing
   - Form handling improvements
     - Replace manual form submissions with Remix's Form component
     - Implement proper validation
     - Add proper error display

3. **Lower Priority (Address Last)**
   - Testing strategy
     - Set up testing framework
     - Add unit tests for critical functions
     - Add component tests for UI components
   - Documentation
     - Add JSDoc comments
     - Create README
     - Document architecture
   - Performance optimization
     - Implement code splitting
     - Optimize bundle size
     - Add caching strategies

## Progress Tracking

- Start Date: _____________
- Target Completion Date: _____________
- Weekly Review Schedule: _____________

## Notes

- This refactoring plan should be implemented incrementally to avoid disrupting ongoing development
- Each section can be tackled independently, but dependencies between tasks should be considered
- Regular code reviews should be conducted to ensure the refactoring meets the established goals
- Pay special attention to the inconsistencies between frontend and backend types that cause 422 errors
- Consider Docker-related issues when testing changes, as there have been previous issues with module resolution in Docker containers
