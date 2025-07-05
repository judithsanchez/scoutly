# API Endpoint: /api/health

## Purpose

This endpoint serves as a vital health check for the Scoutly application, verifying the operational status of the application and its connection to the MongoDB database.

## Functionality

- **HTTP Method**: `GET`
- **Description**: When a `GET` request is made to this endpoint, it attempts to connect to the MongoDB instance and execute a simple `ping` command against the `admin` database.
- **Success Response**: If the database connection and ping are successful, it returns a JSON object with a `200 OK` status.
  ```json
  {
  	"status": "ok",
  	"database": "connected"
  }
  ```
- **Error Response**: If the application fails to connect to the database, it returns a `503 Service Unavailable` status with a JSON object indicating the failure.
  ```json
  {
  	"status": "error",
  	"database": "disconnected"
  }
  ```

## Usage

This endpoint is primarily used by the Docker health check in the `docker-compose.yml` file to ensure the `app` container is fully operational before other dependent services (like `cloudflared`) are started. It can also be used for external monitoring services to verify application uptime.
