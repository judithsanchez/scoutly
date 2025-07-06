# Docker & Environment Variable Setup

**Scoutly never exposes secrets or database credentials to the client. All sensitive operations are server-side only.**

## Environment Variables

1. Copy `.env.example` to `.env` and `.env.local` as needed:

   ```
   cp .env.example .env
   cp .env.example .env.local
   ```

2. Edit `.env.local` for your secrets (API keys, DB credentials, etc).

3. **Never commit `.env.local` or any file with secrets to git.**

## Docker Configuration

- Docker reads environment variables from your `.env` files.
- After changing environment variables, rebuild your Docker image:

```bash
docker-compose down
docker-compose build --no-cache app
docker-compose up -d
```

## Verifying Environment

- Check environment variables inside the container:

```bash
docker-compose exec app env | grep GEMINI_API_KEY
```

- Check logs for correct environment loading:

```bash
docker-compose logs -f app
```

## Logging

- Logs are stored in `/tmp/scoutly-logs` inside the container.
- Access logs for debugging:

```bash
docker-compose exec app cat /tmp/scoutly-logs/queue-processor.log
```

## Security Reminder

- **Never expose secrets or DB credentials to the client.**
- All database and sensitive operations are handled by API endpoints/server-side code only.
- The client (browser) communicates only with API endpoints, never directly with the database.
