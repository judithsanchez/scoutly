# Development Commands

This document contains commonly used commands for development, testing, and debugging in the Scoutly project.

## Quick Reference

### Type Checking & Linting
```bash
# Check TypeScript compilation errors (no output files)
docker-compose exec app npx tsc --noEmit

# Run ESLint for code quality checks
docker-compose exec app npm run lint

# Fix auto-fixable ESLint issues
docker-compose exec app npm run lint -- --fix
```

### Testing
```bash
# Run all tests
docker-compose exec app npm test

# Run tests without watch mode (CI-friendly)
docker-compose exec app npm test --run

# Run specific test file
docker-compose exec app npm test src/path/to/test.test.ts

# Run tests with coverage
docker-compose exec app npm run test:coverage

# Run tests matching a pattern
docker-compose exec app npm test -- --grep "pattern"
```

### Building & Compilation
```bash
# Build production bundle
docker-compose exec app npm run build

# Start development server
docker-compose exec app npm run dev

# Start production server
docker-compose exec app npm start
```

### Database Operations
```bash
# Connect to MongoDB shell
docker-compose exec mongodb mongosh mongodb://mongodb:27017/scoutly

# View MongoDB logs
docker-compose logs mongodb

# Reset database (careful!)
docker-compose exec mongodb mongosh --eval "use scoutly; db.dropDatabase()"
```

### Docker Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and start services
docker-compose up --build -d

# View logs for all services
docker-compose logs -f

# View logs for specific service (app)
docker-compose logs app -f

# Alternative syntax for app logs
docker-compose logs -f app

# Reset Docker volumes (nuclear option)
docker-compose down -v && docker-compose up -d
```

### Development Workflow Commands

#### Complete Health Check
```bash
# Run full project health check
docker-compose exec app npx tsc --noEmit && \
docker-compose exec app npm run lint && \
docker-compose exec app npm test --run
```

#### Quick Validation (Type + Lint)
```bash
# Quick validation without tests
docker-compose exec app npx tsc --noEmit && docker-compose exec app npm run lint
```

#### Test Specific Areas
```bash
# Test API endpoints only
docker-compose exec app npm test src/app/api

# Test services only
docker-compose exec app npm test src/services

# Test components only
docker-compose exec app npm test src/components

# Test hooks only
docker-compose exec app npm test src/hooks
```

#### Debug Database Issues
```bash
# Check database collections
docker-compose exec mongodb mongosh --eval "use scoutly; show collections"

# Count documents in collections
docker-compose exec mongodb mongosh --eval "
use scoutly; 
db.users.countDocuments(); 
db.companies.countDocuments(); 
db.usercompanypreferences.countDocuments();
"

# Find user by email
docker-compose exec mongodb mongosh --eval "
use scoutly; 
db.users.findOne({email: 'judithv.sanchezc@gmail.com'});
"
```

### Performance & Monitoring
```bash
# Monitor container resource usage
docker stats

# Check application logs in real-time
docker-compose logs -f app | grep -E "(ERROR|WARN|error|warn)"

# Check database connections
docker-compose exec mongodb mongosh --eval "db.serverStatus().connections"
```

### Troubleshooting Commands

#### Clear Node Modules (if needed)
```bash
# Stop containers, clear node_modules, reinstall
docker-compose down
docker-compose exec app rm -rf node_modules package-lock.json
docker-compose exec app npm install
docker-compose up -d
```

#### Reset Everything (nuclear option)
```bash
# Complete reset: containers, volumes, cache
docker-compose down -v
docker system prune -f
docker-compose up --build -d
```

#### Check Dependencies
```bash
# Check for outdated packages
docker-compose exec app npm outdated

# Audit for security vulnerabilities
docker-compose exec app npm audit

# Fix auto-fixable security issues
docker-compose exec app npm audit fix
```

### Custom Aliases (Optional)

Add these to your shell profile (`.bashrc`, `.zshrc`, etc.) for convenience:

```bash
# Scoutly development aliases
alias scouttsc='cd /home/judithsanchez/dev/scoutly && docker-compose exec app npx tsc --noEmit'
alias scoutlint='cd /home/judithsanchez/dev/scoutly && docker-compose exec app npm run lint'
alias scouttest='cd /home/judithsanchez/dev/scoutly && docker-compose exec app npm test'
alias scoutbuild='cd /home/judithsanchez/dev/scoutly && docker-compose exec app npm run build'
alias scoutlogs='cd /home/judithsanchez/dev/scoutly && docker-compose logs -f app'
alias scoutdb='cd /home/judithsanchez/dev/scoutly && docker-compose exec mongodb mongosh mongodb://mongodb:27017/scoutly'
alias scoutcheck='cd /home/judithsanchez/dev/scoutly && docker-compose exec app npx tsc --noEmit && docker-compose exec app npm run lint'
alias scoutfull='cd /home/judithsanchez/dev/scoutly && docker-compose exec app npx tsc --noEmit && docker-compose exec app npm run lint && docker-compose exec app npm test --run'
```

### Common Issues & Solutions

#### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process using port 3000
sudo kill -9 $(sudo lsof -t -i:3000)
```

#### Database Connection Issues
```bash
# Restart MongoDB container
docker-compose restart mongodb

# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.runCommand({ping: 1})"
```

#### Memory Issues
```bash
# Check container memory usage
docker stats --no-stream

# Increase Node.js memory limit (if needed)
docker-compose exec app node --max-old-space-size=4096 node_modules/.bin/next build
```

### Testing Specific Components

#### Test User Company Preference Migration
```bash
# Test the new user company preference system
docker-compose exec app npm test src/services/__tests__/userCompanyPreferenceService.test.ts
docker-compose exec app npm test src/app/api/user-company-preferences/__tests__/route.test.ts
```

#### Test API Endpoints
```bash
# Test all API endpoints
docker-compose exec app npm test src/app/api

# Test specific API endpoint
docker-compose exec app npm test "src/app/api/**/route.test.ts"
```

## Notes

- Always run commands from the project root directory (`/home/judithsanchez/dev/scoutly`)
- Use `docker-compose exec app` prefix for Node.js/npm commands
- Use `docker-compose exec mongodb` prefix for MongoDB commands
- Add `--run` to test commands to avoid watch mode in CI/automated contexts
- Use `timeout 15s` prefix for commands that might hang (e.g., `timeout 15s docker-compose exec app npm test`)

## Package Scripts Reference

The following scripts are available in `package.json`:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests with Vitest
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript compiler check

---

*Last updated: June 20, 2025*
*For project-specific documentation, see the `/docs` directory and individual `.md` files co-located with source code.*
