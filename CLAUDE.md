# Trenddit Client Development Guidelines

## Project Context
Trenddit Client is an AI engineering advisory platform built with **feature-slice architecture** for rapid solo development. Each feature is a complete vertical slice that can be shipped independently.

**Current Status**: Pre-MVP foundation phase
**Target**: Ship one feature per week with real user feedback
**Philosophy**: Vibe coding - ship fast, learn faster, revenue over features

## Core Commands

### Development
```bash
npm run dev                 # Start development server
npm run build              # Build for production
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript compiler check
npm run test:feature       # Test specific feature slice
```

### Feature Management
```bash
npm run feature:new [name]  # Create new feature from template
npm run feature:toggle [name] # Toggle feature flag
npm run feature:deploy [name] # Deploy single feature
```

### Database
```bash
npx supabase db push       # Push schema changes
npx supabase db reset      # Reset database
npx supabase functions deploy # Deploy edge functions
```

## Code Style

### TypeScript
- **ALWAYS** use strict mode - no `any` types
- **PREFER** type inference over explicit types when obvious
- **USE** Zod schemas for all API inputs and form validation
- **EXPORT** only what's needed from feature modules

### Imports
- **USE** absolute imports from `@/` for cross-feature imports
- **USE** relative imports within features
- **NEVER** import directly from another feature's internals
- **ALWAYS** import from feature's index.ts barrel export

Example:
```typescript
// Good
import { Button } from '@/packages/ui'
import { useEvents } from '@/lib/events'

// Bad  
import { TrendCard } from '@/features/trends/components/TrendCard'

// Good
import { TrendCard } from '@/features/trends'
```

### React Components
- **USE** function components with TypeScript
- **PREFER** single responsibility - one component, one job
- **USE** CVA for variant styling
- **AVOID** inline styles - use Tailwind classes

### Feature Structure
Each feature MUST follow this structure:
```
/features/[feature-name]/
  /components/       # UI components
  /server/          # tRPC routers
  /stores/          # Zustand stores  
  /hooks/           # Custom React hooks
  /types/           # TypeScript types
  /utils/           # Helper functions
  index.ts          # Public API exports
```

## Workflow

### Adding New Features
1. **ALWAYS** create feature behind flag (0% rollout)
2. **START** with tRPC router to define API contract
3. **BUILD** minimal UI to test core interaction
4. **SHIP** to preview URL for testing
5. **ITERATE** based on user feedback same day

### Before Committing
- **RUN** `npm run lint` and fix all errors
- **RUN** `npm run typecheck` and fix all errors
- **TEST** feature in isolation at preview URL
- **CHECK** no direct dependencies on other features

### Event Communication
Features MUST communicate via events, not direct calls:
```typescript
// Publish event
events.emit('trend.analyzed', { trendId, analysis })

// Subscribe to event
events.on('trend.analyzed', async (data) => {
  // React to event
})
```

### AI Integration
- **CACHE** all AI responses in Vercel KV
- **USE** streaming for long-running AI operations
- **PROVIDE** loading states with progress indicators
- **HANDLE** rate limits gracefully with backoff

## Architecture Rules

### Feature Independence
**IMPORTANT**: Features must be deletable without breaking others
- No compile-time dependencies between features
- All communication via events
- Shared code only in `/lib` or `/packages`

### Database Schema
- Each feature owns its database tables
- Prefix tables with feature name: `trends_*`, `needs_*`
- Foreign keys only to platform tables (users, events)

### API Design
- Each feature has ONE tRPC router in `/features/[name]/server/`
- Server-side tRPC setup in `/server/trpc.ts`
- Client-side tRPC setup in `/lib/trpc/client.tsx`
- **NEVER** import server tRPC code into client components
- Procedures follow pattern: `[action][Entity]`
- Always validate with Zod schemas
- Return consistent error shapes

### State Management
- Each feature has isolated Zustand store
- No global state except user session
- Persist only essential data

## Performance Guidelines

### Speed Targets
- Page load: < 3 seconds
- API response: < 500ms
- AI operations: < 10 seconds with streaming

### Optimization Rules
- **LAZY LOAD** features not on critical path
- **PREFETCH** next likely user action
- **CACHE** expensive computations
- **DEBOUNCE** user inputs

## Testing Approach

### What to Test
- **CRITICAL** user paths only
- **API** contracts with integration tests
- **AI** prompts with snapshot tests

### What NOT to Test
- UI implementation details
- Styling/layout
- Third-party integrations (mock them)

## Deployment

### Preview Deployments
Every push creates preview at: `[branch-name].trenddit.vercel.app`

### Feature Rollout
```typescript
// Progressive rollout percentages
Day 1: 0% (team only)
Day 2: 5% (early adopters)  
Day 3: 25% (if metrics good)
Day 4: 50% (if stable)
Day 5: 100% (full rollout)
```

### Rollback Procedure
1. Set feature flag to 0%
2. Investigate issue
3. Fix and test on preview
4. Resume rollout

## Common Patterns

### Loading States
```typescript
// Always show loading for async operations
if (isLoading) return <Skeleton />
if (error) return <ErrorBoundary error={error} />
return <Content data={data} />
```

### Error Handling
```typescript
// Wrap all async operations
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  captureException(error) // Send to Sentry
  return { success: false, error: error.message }
}
```

### Feature Flags
```typescript
// Check flag before rendering
if (!flags.trends.enabled) return null
return <TrendsDashboard />
```

## Environment Variables

Required in `.env.local`:
```bash
# Database
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI
OPENAI_API_KEY=

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true
```

### OpenAI API Key Configuration

The system uses `OPENAI_API_KEY` from:
1. `.env.local` file (project-specific) - preferred for development
2. User environment variables (global) - preferred for production/deployment

To set a user environment variable:
```bash
# macOS/Linux
export OPENAI_API_KEY=sk-your-actual-openai-key

# Windows
set OPENAI_API_KEY=sk-your-actual-openai-key
```

## Debugging Tips

### Common Issues
1. **Feature not showing**: Check feature flag in PostHog
2. **Type errors**: Run `npm run typecheck`
3. **API failing**: Check tRPC error in Network tab
4. **Events not firing**: Check event log in Supabase

### Useful Commands
```bash
# View real-time logs
vercel logs --follow

# Check feature flags
curl https://api.posthog.com/flags

# Reset local database
npx supabase db reset

# Clear cache
rm -rf .next
```

## AI Prompts Library

### Trend Analysis
```
Analyze this trend for enterprise impact:
- Business implications
- Technical requirements  
- Implementation timeline
- Risk factors
Keep response under 200 words.
```

### Need Generation
```
Based on this trend and company context, identify 3 specific needs:
- Each need should be actionable
- Include stakeholder impact
- Estimate complexity (low/medium/high)
Format as JSON array.
```

### Solution Matching
```
Match this need to solution patterns:
- Consider build vs buy vs partner
- Estimate implementation effort
- Calculate rough ROI
Return top 3 matches with confidence scores.
```

## IMPORTANT Reminders

- **NEVER** commit API keys or secrets
- **ALWAYS** test on preview before merging
- **PREFER** shipping broken over not shipping
- **FOCUS** on user value, not code perfection
- **MEASURE** everything - usage, errors, performance
- **TALK** to users daily - their feedback drives development

## Error Handling Rules

### API Key Management
- **ALWAYS** check for API keys in project `.env.local` first, then user environment variables
- **NEVER** use hardcoded fallback data when API keys are missing
- **THROW** clear, actionable errors when API services are unavailable

### Fallback Strategy
- **NEVER** create mock or hardcoded fallback responses
- **ALWAYS** surface actual errors to users with clear instructions
- **PROVIDE** actionable error messages (e.g., "Set OPENAI_API_KEY in .env.local or environment")
- **FAIL FAST** - let users know exactly what needs to be configured

### Error Messages
- Include timestamp and context in error messages
- Provide copy functionality for easy error reporting
- Show clear next steps for resolution

## Questions or Issues?
- Check `.claude/specs/` for detailed documentation
- Review recent commits for patterns
- When in doubt, ship and iterate

---
*Last updated: Today*
*Version: 1.0*