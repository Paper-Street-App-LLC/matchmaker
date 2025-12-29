import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

let server = new Server(
  {
    name: "matchmaker-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let transport = new StdioServerTransport();

await server.connect(transport);

export { server };
