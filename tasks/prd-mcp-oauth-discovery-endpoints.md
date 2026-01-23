# PRD: MCP OAuth Discovery Endpoints

## Problem Statement

MCP clients attempting to connect via HTTP+OAuth authentication receive 404 errors because the required OAuth discovery and registration endpoints are not implemented. The existing `/oauth/authorize` and `/oauth/token` endpoints work, but clients cannot discover them.

Additionally, users have no easy way to find the server URL or understand how to connect their MCP client.

## User Stories

### US-1: OAuth Server Discovery
**As an** MCP client  
**I want to** discover the OAuth server metadata at a well-known endpoint  
**So that** I can programmatically find the authorization and token endpoints without hardcoding them

**Acceptance Criteria:**
- `GET /.well-known/oauth-authorization-server` returns 200 with valid JSON
- Response includes `authorization_endpoint`, `token_endpoint`, and `registration_endpoint`
- Response content-type is `application/json`

### US-2: Protected Resource Discovery
**As an** MCP client  
**I want to** discover which authorization server protects the MCP resource  
**So that** I know where to authenticate before accessing the API

**Acceptance Criteria:**
- `GET /.well-known/oauth-protected-resource` returns 200 with valid JSON
- Response includes `authorization_servers` array pointing to the issuer
- Response content-type is `application/json`

### US-3: Dynamic Client Registration
**As an** MCP client  
**I want to** register myself as an OAuth client at runtime  
**So that** I can obtain a `client_id` without manual configuration

**Acceptance Criteria:**
- `POST /register` accepts JSON with `client_name` and `redirect_uris`
- Response includes generated `client_id`
- Registered client can be used in subsequent OAuth flows
- Invalid requests return appropriate error responses

### US-4: End-to-End OAuth Flow
**As an** MCP client  
**I want to** complete the full OAuth authentication flow  
**So that** I can access protected MCP resources over HTTP

**Acceptance Criteria:**
- Client can discover endpoints via well-known URLs
- Client can register dynamically
- Client can complete authorization code flow
- Client receives valid access token

### US-5: MCP Setup Instructions Page
**As a** user setting up an MCP client  
**I want to** visit a page with clear setup instructions and easy URL copying  
**So that** I can quickly configure my MCP client without hunting for documentation

**Acceptance Criteria:**
- Hidden route at `/setup` (or similar) accessible via direct URL
- Not linked from main navigation
- Clean, minimal UI with:
  - Brief explanation of what MCP is and how to connect
  - Server URL displayed prominently with "Copy" button
  - Step-by-step instructions for common MCP clients (e.g., Claude Desktop)
- Copy button provides visual feedback (e.g., "Copied!" tooltip)
- Mobile-friendly layout

## Goals

- Enable MCP clients to complete OAuth authentication flow
- Expose existing OAuth endpoints through standard discovery mechanisms
- Support dynamic client registration for MCP clients
- Provide a user-friendly setup page for configuring MCP clients

## Non-Goals

- Changing the existing OAuth implementation
- Adding new authentication methods
- Supporting the stdio MCP transport (already works)
- Linking setup page from main app navigation

## Solution Overview

### Backend: Add three endpoints for OAuth discovery

| Endpoint | RFC | Purpose |
|----------|-----|---------|
| `GET /.well-known/oauth-authorization-server` | RFC 8414 | Returns OAuth server metadata |
| `GET /.well-known/oauth-protected-resource` | RFC 9728 | Points to the authorization server |
| `POST /register` | RFC 7591 | Dynamic client registration |

### Frontend: Add setup instructions page

| Route | Purpose |
|-------|---------|
| `/setup` | Hidden page with MCP connection instructions |

## Technical Requirements

### 1. OAuth Authorization Server Metadata
**Endpoint:** `GET /.well-known/oauth-authorization-server`

Returns JSON with:
- `issuer`: Server URL
- `authorization_endpoint`: `/oauth/authorize`
- `token_endpoint`: `/oauth/token`
- `registration_endpoint`: `/register`
- `response_types_supported`: `["code"]`
- `grant_types_supported`: `["authorization_code"]`
- `code_challenge_methods_supported`: `["S256"]` (if PKCE supported)

### 2. Protected Resource Metadata
**Endpoint:** `GET /.well-known/oauth-protected-resource`

Returns JSON with:
- `resource`: Server URL
- `authorization_servers`: Array containing issuer URL

### 3. Dynamic Client Registration
**Endpoint:** `POST /register`

Accepts:
- `client_name`: Application name
- `redirect_uris`: Array of callback URLs

Returns:
- `client_id`: Generated unique ID
- `client_name`: Echo back
- `redirect_uris`: Echo back

Storage: In-memory initially (clients re-register on server restart)

### 4. Setup Instructions Page
**Route:** `/setup`

UI Components:
- Header: "Connect Your MCP Client"
- Server URL display with copy button
- Collapsible/tabbed instructions for different clients
- Clean, documentation-style layout (similar to README)

Content:
- What is MCP (1-2 sentences)
- Server URL (with copy button)
- Setup steps for Claude Desktop
- Troubleshooting tips (optional)

## Success Criteria

- MCP client can complete full OAuth flow without 404 errors
- All three endpoints return valid JSON per their respective RFCs
- Existing OAuth flow continues to work unchanged
- Users can find and copy the server URL from `/setup` page
- Setup page renders correctly on desktop and mobile

## Out of Scope

- Persistent client registration storage
- Client authentication/secrets
- Token introspection endpoints
- Linking setup page from main navigation
- Auto-configuration/deep linking to MCP clients