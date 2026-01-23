# PRD: MCP Streamable HTTP Transport Layer

## Overview

Add HTTP transport with Streamable HTTP to the MCP server, enabling Claude.ai users to connect remotely. This transforms the currently local-only (stdio) MCP server into a production-ready remote service deployed on Railway.

## Problem Statement

The OAuth 2.0 implementation is production-ready for Claude integration, but the MCP server only supports local stdio transport. Claude.ai users cannot connect remotely without an HTTP-based transport layer.

## User Stories

### End User (Claude.ai User)

1. **As a Claude.ai user**, I want to connect to the MCP server from Claude.ai so that I can access its tools and resources without running anything locally.

2. **As a Claude.ai user**, I want to authenticate securely via OAuth so that my connection is protected and I control access to my account.

3. **As a Claude.ai user**, I want clear setup instructions so that I can connect to the MCP server without technical difficulty.

4. **As a Claude.ai user**, I want to see my connection status so that I know if my MCP server is properly connected.

### Developer/Administrator

5. **As a developer**, I want the MCP server to support Streamable HTTP transport so that Claude.ai can connect remotely.

6. **As a developer**, I want the HTTP transport to integrate with the existing OAuth implementation so that I don't need separate authentication systems.

7. **As a developer**, I want basic error logging so that I can diagnose connection issues when they occur.

8. **As an administrator**, I want to deploy the HTTP-enabled MCP server to Railway so that it's accessible to Claude.ai users.

9. **As an administrator**, I want CORS restricted to Claude.ai so that only authorized clients can connect.

## Goals

- Enable remote MCP connections from Claude.ai via Streamable HTTP transport
- Leverage existing OAuth 2.0 flow for authentication
- Deploy seamlessly on Railway with built-in TLS termination
- Provide clear setup instructions in the web interface

## Non-Goals

- SSE or WebSocket fallback transports (future consideration)
- Rate limiting (future consideration)
- Multi-instance session storage (future consideration)
- High-scale load balancing (future consideration)

## Technical Requirements

### 1. Streamable HTTP Transport Endpoint

| Attribute | Specification |
|-----------|---------------|
| Endpoint | `POST /mcp` |
| Protocol | MCP Streamable HTTP (latest spec) |
| Content-Type | `application/json` (requests), `text/event-stream` (streaming responses) |
| Authentication | OAuth 2.0 Bearer tokens (full flow with PKCE) |
| Session Model | Stateless |

### 2. Authentication Integration

- All MCP HTTP requests require valid OAuth 2.0 access tokens
- Tokens validated against existing OAuth implementation
- Use `Authorization: Bearer <token>` header
- Return `401 Unauthorized` for missing/invalid tokens
- Return `403 Forbidden` for insufficient scopes

### 3. CORS Configuration

- Allow origin: `https://claude.ai`
- Support preflight requests (`OPTIONS /mcp`)
- Headers: `Authorization`, `Content-Type`, `Accept`
- Design for easy expansion to additional origins later

### 4. Error Handling & Logging

- Basic error logging for failed requests
- Log: timestamp, error type, request path, response status
- Return appropriate MCP error responses per specification

### 5. HTTPS/TLS

- Rely on Railway's built-in TLS termination
- Application serves HTTP; Railway handles HTTPS

### 6. Web Setup Page Updates (`/web`)

Update the setup page to include:

- **Public MCP Endpoint URL**: Display the Railway endpoint URL for users to copy
- **Connection Status**: Health indicator showing if the MCP server is reachable
- **Claude.ai Instructions**: Step-by-step guide for connecting from Claude.ai
  - How to add the MCP server in Claude.ai settings
  - OAuth authentication flow walkthrough
  - Troubleshooting tips

## Implementation Approach

### Phase 1: HTTP Transport Layer

1. Add Streamable HTTP handler at `/mcp` endpoint
2. Integrate OAuth token validation middleware
3. Implement stateless request/response handling per MCP spec
4. Configure CORS for `https://claude.ai`

### Phase 2: Web Interface Updates

1. Add MCP endpoint URL display to setup page
2. Implement health check endpoint (`GET /mcp` or `/health`)
3. Add connection status indicator
4. Write Claude.ai connection instructions

### Phase 3: Deployment & Testing

1. Configure Railway environment for HTTP transport
2. Test end-to-end OAuth + MCP flow with Claude.ai
3. Verify TLS termination works correctly
4. Document deployment configuration

## API Specification

### MCP Endpoint

```
POST /mcp
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "...",
  "params": {...},
  "id": 1
}
```

### Response (Streaming)

```
Content-Type: text/event-stream

data: {"jsonrpc": "2.0", "result": {...}, "id": 1}

```

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid token |
| 403 | Insufficient scope |
| 400 | Malformed MCP request |
| 500 | Internal server error |

## Success Criteria

- [ ] Claude.ai can discover and connect to the MCP server via Streamable HTTP
- [ ] OAuth flow completes successfully from Claude.ai
- [ ] MCP tools/resources accessible after authentication
- [ ] Setup page displays correct endpoint URL and connection status
- [ ] Deployment on Railway works with TLS termination

## Future Considerations

- Add SSE transport for backwards compatibility
- Implement rate limiting per user/IP
- Add Redis-backed sessions for multi-instance deployment
- Expand CORS to support additional clients
- Add metrics and advanced observability

## Dependencies

- Existing OAuth 2.0 implementation (complete)
- Railway deployment infrastructure (complete)
- MCP SDK with Streamable HTTP support

## Timeline

Small team deployment with iterative improvements as usage grows.