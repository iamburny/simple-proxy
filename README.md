# HTTP Proxy Service

A simple HTTP proxy service that receives requests and forwards them to specified URLs, returning the response back to the original requester.

## Features

- **Universal Proxy**: Supports all HTTP methods (GET, POST, PUT, DELETE, etc.)
- **Port 80**: Listens on port 80 for incoming requests
- **Docker Support**: Fully containerized with Docker and docker-compose
- **Health Checks**: Built-in health monitoring
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Runs as non-root user in container

## Quick Start

1. **Build and run with docker-compose:**

   ```bash
   docker-compose up --build
   ```

2. **Use the proxy:**

   ```bash
   # GET request example
   curl "http://localhost/proxy?url=https://api.github.com/users/octocat"

   # POST request example
   curl -X POST "http://localhost/proxy?url=https://httpbin.org/post" \
        -H "Content-Type: application/json" \
        -d '{"key": "value"}'
   ```

## API Endpoints

### `/proxy?url=<target_url>`

- **Method**: Any HTTP method
- **Description**: Proxies the request to the specified URL
- **Query Parameters**:
  - `url` (required): The target URL to proxy the request to
  - Any additional query parameters will be forwarded to the target URL

### `/health`

- **Method**: GET
- **Description**: Health check endpoint
- **Response**: `{"status": "OK", "timestamp": "..."}`

## Usage Examples

### GET Request

```bash
curl "http://localhost/proxy?url=https://jsonplaceholder.typicode.com/posts/1"
```

### POST Request

```bash
curl -X POST "http://localhost/proxy?url=https://httpbin.org/post" \
     -H "Content-Type: application/json" \
     -d '{"title": "foo", "body": "bar", "userId": 1}'
```

### With Query Parameters

```bash
curl "http://localhost/proxy?url=https://api.github.com/search/repositories&q=docker&sort=stars"
```

## Configuration

The service can be configured using environment variables:

- `PORT`: Port to listen on (default: 80)
- `NODE_ENV`: Environment mode (default: production)

## Development

To run locally for development:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

## Docker Commands

- **Build and start**: `docker-compose up --build`
- **Start in background**: `docker-compose up -d`
- **Stop**: `docker-compose down`
- **View logs**: `docker-compose logs proxy`
- **Rebuild**: `docker-compose build --no-cache`

## Security Considerations

- The service runs as a non-root user inside the container
- Request timeouts are set to 30 seconds to prevent hanging connections
- Request body size is limited to 10MB
- Sensitive headers are filtered when forwarding requests

## Error Handling

The proxy service handles various error scenarios:

- **400 Bad Request**: Missing or invalid URL parameter
- **503 Service Unavailable**: Target server is unreachable
- **500 Internal Server Error**: Other unexpected errors
- **Forwarded Errors**: HTTP errors from target servers are forwarded with original status codes
