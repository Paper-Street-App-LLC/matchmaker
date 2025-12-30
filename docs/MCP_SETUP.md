# MCP Server Setup Guide

This guide will help you set up the Matchmaker MCP server for use with Claude Desktop.

## Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher
- Backend API running (see [SETUP.md](SETUP.md) for Supabase setup)
- [Claude Desktop](https://claude.ai/download) installed

## 1. Build the MCP Server

Navigate to the MCP server directory and build:

```bash
cd mcp-server
bun install
bun run build
```

This creates a production-ready bundle at `dist/index.js`.

**Verify**: Check that `dist/index.js` was created successfully.

## 2. Obtain JWT Authentication Token

The MCP server requires a JWT token to authenticate with the backend API. Choose the approach that fits your use case:

### Option A: Dev Script (Easiest - Recommended)

For quick local testing, use the included JWT dev tool:

1. **Ensure backend .env is configured** with your Supabase credentials

2. **Run the dev script**:
   ```bash
   bun run get-jwt
   ```

   This creates a test user (`test@matchmaker.dev`) and outputs a valid JWT token.

3. **Copy the JWT token** from the output, or update your MCP config automatically:
   ```bash
   bun run get-jwt --update-config
   ```

**Advanced usage**:
```bash
# Use custom email/password
bun run get-jwt --email me@example.com --password mypass123 --name "My Name"

# Get JWT for existing user (skip creation)
bun run get-jwt --existing --email me@example.com --password mypass123
```

### Option B: Development (Service Role Key)

For local development, you can use the Supabase service role key:

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Get the service role key:
   ```bash
   supabase status
   ```

   Look for the `service_role key` in the output.

3. Use this key as your `auth_token` in the configuration (step 3).

**Important**: The service role key bypasses Row Level Security (RLS) policies. Only use this in local development environments. Never commit or expose this key.

### Option C: Production (User JWT Token)

For production or when you want to test with proper authentication:

1. **Sign up a user** via Supabase Auth:
   - Use the Supabase Dashboard UI
   - Or use the Auth API endpoints

2. **Create a matchmaker profile** for the user:
   ```sql
   INSERT INTO matchmakers (id, name)
   VALUES ('<user-uuid-from-auth.users>', 'Your Name');
   ```

   Replace `<user-uuid-from-auth.users>` with the actual user ID from the `auth.users` table.

3. **Get the user's JWT token**:
   - Via Supabase client: `supabase.auth.getSession()`
   - Via Auth API: Make a POST request to `/auth/v1/token`
   - From an authenticated session in your application

4. Use this JWT as your `auth_token` in the configuration.

**Note**: User JWT tokens expire and need to be refreshed periodically. The service role key does not expire.

## 3. Create MCP Configuration

Create the configuration file:

```bash
mkdir -p ~/.config/matchmaker-mcp
cat > ~/.config/matchmaker-mcp/config.json << 'EOF'
{
  "api_base_url": "http://localhost:3000",
  "auth_token": "YOUR_JWT_TOKEN_HERE"
}
EOF
```

**Configuration options**:

- `api_base_url`: The URL where your backend API is running
  - Local development: `http://localhost:3000`
  - Production: Your deployed backend URL (e.g., `https://api.matchmaker.example.com`)
- `auth_token`: The JWT token from step 2 (either service role key or user JWT)

**Important**: Replace `YOUR_JWT_TOKEN_HERE` with the actual token from step 2.

## 4. Configure Claude Desktop

Edit the Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the matchmaker MCP server to the `mcpServers` object:

```json
{
  "mcpServers": {
    "matchmaker": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/matchmaker/mcp-server/dist/index.js"]
    }
  }
}
```

**Important**: Replace `/absolute/path/to/matchmaker` with the actual absolute path to your project directory.

### Development Alternative

If you want to run the MCP server directly from source (useful for development with hot reload):

```json
{
  "mcpServers": {
    "matchmaker": {
      "command": "bun",
      "args": ["--watch", "run", "/absolute/path/to/matchmaker/mcp-server/src/index.ts"]
    }
  }
}
```

This runs the TypeScript source directly and reloads automatically when files change.

## 5. Restart and Test

### Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. Start a new conversation

### Test the MCP Tools

The MCP server provides two tools for managing your matchmaking network:

#### Test adding a person

In a new Claude Desktop conversation, say:

```
Add a person named Sarah to my matchmaking network
```

**Expected behavior**: Claude will call the `add_person` tool and confirm that Sarah was added successfully.

#### Test listing people

Then ask:

```
Show me all people in my network
```

**Expected behavior**: Claude will call the `list_people` tool and display a list of all people, including Sarah.

## 6. Troubleshooting

### Tools don't appear in Claude Desktop

- **Check Claude Desktop logs**: Look for errors related to MCP server initialization
- **Verify path is absolute**: The path in `claude_desktop_config.json` must be absolute, not relative
- **Check MCP server starts**: Run `bun run /path/to/mcp-server/dist/index.js` manually to see if there are errors

### Authentication fails

- **Verify JWT token is valid**: Tokens expire - get a fresh one if needed
- **Check backend is running**: Ensure your backend API is accessible at the `api_base_url`
- **Verify token format**: The token should be passed as a Bearer token (the MCP server handles this automatically)

### API calls fail

- **Check api_base_url**: Ensure it points to your running backend server
- **Verify backend health**: Test the backend directly with `curl http://localhost:3000/api/health` (or similar)
- **Check network connectivity**: Ensure the MCP server can reach the backend API

### Config file not found

- **Verify path**: Ensure `~/.config/matchmaker-mcp/config.json` exists
- **Check JSON validity**: Validate the JSON syntax using a JSON validator
- **Check permissions**: Ensure the file is readable by the user running Claude Desktop

### Other issues

If you encounter other issues:

1. Check the MCP server logs (if running with `--watch`)
2. Verify all prerequisites are installed (Bun, Claude Desktop)
3. Ensure the backend API is properly configured and running
4. Review the [SETUP.md](SETUP.md) guide for backend and database setup

## Advanced Usage

### Using Multiple Matchmakers

If you have multiple matchmaker accounts, you can create separate JWT tokens for each and switch between them by updating the `auth_token` in the config file.

### Custom API Endpoints

If you're running the backend on a different port or domain, update the `api_base_url` in your config file accordingly.

### Production Deployment

For production use:

1. Use a production Supabase instance (not local)
2. Use real user JWT tokens (not service role key)
3. Update `api_base_url` to your production API URL
4. Consider implementing token refresh logic for long-running sessions

## Next Steps

- Learn about the available MCP tools in the main [README.md](../README.md)
- Explore the backend API documentation
- Set up additional matchmakers and test introductions

## Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Supabase Authentication Guide](https://supabase.com/docs/guides/auth)
- [Claude Desktop Documentation](https://claude.ai/docs)
