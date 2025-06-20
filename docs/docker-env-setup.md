# Setting Up Environment Variables and Docker Configuration

When working with the Scoutly background jobs system, proper environment configuration is crucial, especially for API keys and Docker setup.

## Environment Variables

1. Create a `.env` file in the project root by copying `.env.example`:

   ```
   cp .env.example .env
   ```

2. Edit the `.env` file to set your GEMINI_API_KEY:

   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Other important settings to configure:
   - `USE_PIPELINE_ARCHITECTURE`: Set to true (default) to use the new pipeline architecture
   - `LOG_LEVEL`: Configure logging verbosity (DEBUG, INFO, SUCCESS, WARN, ERROR)
   - `LOG_TO_FILE`: Enable file-based logging for better debugging
   - `LOG_DIR`: Directory for log files (default: /tmp/scoutly-logs)

## Docker Configuration

The Docker setup is configured to read environment variables from your host system's `.env` file. When you change environment variables, you need to rebuild the Docker image for the changes to take effect.

### When to Rebuild Docker

You need to rebuild the Docker image in these scenarios:

1. When changing the `GEMINI_API_KEY`
2. When switching between pipeline and legacy architecture
3. After updating code that affects the job processing system

### How to Rebuild Docker

```bash
# Stop existing containers
docker-compose down

# Rebuild the image with the new environment variables
docker-compose build --no-cache app

# Start the containers
docker-compose up -d
```

### Verifying Configuration

To verify that your environment variables are correctly loaded:

```bash
# Check environment variables in the container
docker-compose exec app env | grep GEMINI_API_KEY

# Check if the API key is accessible (length only, for security)
docker-compose exec app node -e 'console.log(`API Key length: ${process.env.GEMINI_API_KEY?.length || "not set"}`)'
```

## Logging and Debugging

Enhanced logging has been set up in the `/tmp/scoutly-logs` directory. You can access these logs from within the container or map this directory to your host system.

To check the logs:

```bash
# View logs inside the container
docker-compose exec app cat /tmp/scoutly-logs/queue-processor.log

# View job matching orchestrator logs
docker-compose exec app cat /tmp/scoutly-logs/job-matching-orchestrator.log

# View results storage logs (critical for debugging job saving issues)
docker-compose exec app cat /tmp/scoutly-logs/job-results-storage.log
```

Remember that whenever you change environment variables, especially the GEMINI_API_KEY, you need to rebuild the Docker image to ensure the changes take effect within the container.
