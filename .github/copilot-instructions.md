# FollowingSync - AI Coding Guidelines

## Architecture Overview

FollowingSync is a full-stack TypeScript application for managing social media connections across platforms. The codebase uses a **monorepo pattern** with distinct client/server boundaries but shared types.

### Key Architectural Patterns

- **Shared Schema**: Use `shared/schema.ts` for all database models and Zod validation schemas. Always import types from `@shared/schema`
- **Dual Storage**: The app supports both PostgreSQL (production) and in-memory storage (development) via the `IStorage` interface in `server/storage.ts`
- **Route-First API**: All API endpoints are defined in `server/routes.ts` using Express patterns. Follow the `/api/*` convention
- **React Query Integration**: All client-server communication uses TanStack Query with the `queryClient` from `client/src/lib/queryClient.ts`

## Critical Development Workflows

### Database Operations
```bash
npm run db:push          # Push schema changes to database
npm run check           # TypeScript compilation check
```

### Development vs Production
- **Dev**: `npm run dev` - Uses Vite dev server with hot reload
- **Build**: `npm run build` - Outputs to `dist/public` (client) + `dist/index.js` (server)
- **Production**: Server auto-detects Vercel environment and serves static files accordingly

## UI Component System (shadcn/ui)

This project uses shadcn/ui with specific conventions:

### Component Import Pattern
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
```

### Styling Utility
Always use the `cn()` utility from `@/lib/utils` for conditional className merging:
```tsx
className={cn("base-classes", conditionalClass && "extra-class", className)}
```

### Theme System
- Theme configuration in `theme.json` controls shadcn variables
- Uses CSS custom properties pattern: `hsl(var(--primary))`
- Professional variant with 0.5 radius as current theme

## Key Project-Specific Patterns

### Authentication Flow
- Session-based auth using Passport.js with LocalStrategy
- Auth context in `client/src/hooks/useAuth.tsx` manages global auth state
- Protected routes check auth status via `/api/auth/status`

### Data Tables
Use the reusable `DataTable` component from `client/src/components/ui/data-table.tsx` with TanStack Table for consistent table implementations.

### Platform Connections
- Mock OAuth implementation in development (see `mockSocialMediaData` in `server/routes.ts`)
- Platform status managed through `usePlatforms` hook
- Connection states: "not_connected", "connected", "error"

### Path Aliases (Critical)
```typescript
"@": "./client/src"           // Client components/hooks
"@shared": "./shared"         // Shared types/schemas  
"@assets": "./attached_assets" // Static assets
```

## Integration Points

### Database Schema
- Uses Drizzle ORM with PostgreSQL
- Schema definitions in `shared/schema.ts` include relationships between users, platforms, connections, and following data
- Always use `createInsertSchema` from drizzle-zod for form validation

### API Response Pattern
APIs return consistent JSON responses. Error handling follows Express patterns with status codes and message objects.

### Environment-Specific Logic
Server code includes specific Vercel deployment handling in `server/index.ts` - be aware of `isDevelopment` vs `isVercel` conditions when modifying server startup logic.

## Common Gotchas

- **Mock Data**: Social API calls return mock data in development. Real OAuth implementation would go in `client/src/lib/social-api.ts`
- **Port Configuration**: Uses dynamic ports for Vercel (process.env.PORT) vs fixed port 5000 locally
- **Session Storage**: Uses MemoryStore in development, should use persistent store in production
- **Asset Paths**: Vite config sets client as root directory, so paths in client code are relative to `client/`