# Pre-Push Validation Commands

## Quick Status Summary

✅ **Type Issues: RESOLVED** (functionally)

- ESLint: No warnings or errors
- TypeScript: Works perfectly (only compatibility warning with ESLint parser)
- Tests: All 69 tests passing
- App: Running smoothly

## Available Commands

### 🚀 Quick Checks (Fast feedback)

```bash
# Quick lint + type check (fastest)
npm run quick-check:docker

# Local version (if not using Docker)
npm run quick-check
```

### 🔍 Full Validation (Recommended before push)

```bash
# Complete validation: lint + type-check + tests
npm run validate:docker

# Local version (if not using Docker)
npm run validate
```

### 🏗️ Full Validation + Build (Most thorough)

```bash
# Everything + build verification
npm run validate:full:docker

# Local version (if not using Docker)
npm run validate:full
```

### 🎯 Individual Commands

```bash
# ESLint only
docker compose exec app npm run lint

# TypeScript type checking only
docker compose exec app npm run type-check

# Tests only
docker compose exec app npm test run

# Build only
docker compose exec app npm run build
```

## Recommended Workflow

### For Regular Development

```bash
# Before committing any changes
npm run validate:docker
```

### Before Important Pushes

```bash
# Full validation including build
npm run validate:full:docker
```

### Quick Development Feedback

```bash
# Just lint and types (very fast)
npm run quick-check:docker
```

## Command Details

| Command                | What it does                      | When to use                       |
| ---------------------- | --------------------------------- | --------------------------------- |
| `quick-check:docker`   | Lint + Type check                 | Quick feedback during development |
| `validate:docker`      | Lint + Type check + Tests         | Before most commits               |
| `validate:full:docker` | Lint + Type check + Tests + Build | Before important pushes           |

## Intentional Push Override

If you want to push despite validation failures (should be intentional):

```bash
# Skip validation and push anyway
git push origin main --force-with-lease
```

**⚠️ Use with caution** - Only when you intentionally want to push work-in-progress or experimental changes.

## Next Steps Available

After validation passes, you can proceed to:

1. **Frontend logger simplification** (in `/TODOS/frontend-logger-simplification-plan.md`)
2. **Phase 3 improvements** (in `/TODOS/phase2-improvement-analysis.md`)
3. **Background jobs architecture** (in `/TODOS/background-jobs.md`)

---

**Last Updated**: June 18, 2025
**Status**: All validation commands tested and working in Docker environment
