# Scoutly Deployment: Dev vs Production Docker Compose Setup

## Key Distinction: Volume Mounts for `/app`

### Why This Matters

- **Next.js production builds** (`npm run build` + `npm run start`) require the build output (`.next/`) to be present inside the container.
- **Development** benefits from live reload and code sync, which requires mounting your local source code into the container.

---

## Production (Pi/Raspberry Pi/Server)

- **Uses only `docker-compose.yml`**
- **No volume mount for `/app`** in the `app` service.
- This ensures the build output created during the Docker image build is preserved and used at runtime.
- **Command:**
  ```sh
  docker compose up -d
  ```

---

## Development (Local Machine)

- **Uses `docker-compose.yml` + `docker-compose.override.yml`**
- The override **adds a volume mount** for `/app` in the `app` service:
  ```yaml
  volumes:
    - .:/app
    - /app/node_modules
  ```
- This enables live reload and local code sync.
- **Command:**
  ```sh
  docker compose up -d
  ```

---

## Summary Table

| Environment | Compose Files Used                     | Volume Mount for `/app` | Build Output Used | Live Reload |
| ----------- | -------------------------------------- | ----------------------- | ----------------- | ----------- |
| Production  | `docker-compose.yml`                   | ❌                      | Docker build      | ❌          |
| Development | `docker-compose.yml` + `.override.yml` | ✅                      | Local build/live  | ✅          |

---

## Troubleshooting

- **If you see errors like `ENOENT: no such file or directory, open '/app/.next/BUILD_ID'` in production:**  
  Make sure you are NOT mounting your local code into the container in production.
- **If you want live reload in dev:**  
  Make sure the override file is present and includes the volume mount.

---

## Example: How to Switch

- **On your dev machine:**  
  Just run `docker compose up -d` (the override is picked up automatically).
- **On the Pi (production):**  
  Only use `docker-compose.yml` (no override), so the app runs from the built image.

---

## Why This Works

- Docker Compose automatically merges `docker-compose.override.yml` in local/dev environments.
- In production, you only use the main compose file, so the build output is preserved and the app starts correctly.

---
