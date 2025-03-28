#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NEON_RESOURCES } from '../resources.js';
import { NEON_HANDLERS, NEON_TOOLS, ToolHandlerExtended } from '../tools.js';
import { logger } from '../utils/logger.js';
import { createNeonClient, getPackageJson } from './api.js';

export const createMcpServer = async (apiKey: string) => {
  const server = new McpServer(
    {
      name: 'mcp-server-neon',
      version: getPackageJson().version,
    },
    {
      capabilities: {
        tools: {
          list_projects: undefined,
        },
        resources: {},
      },
    },
  );

  const neonClient = createNeonClient(apiKey);

  // Register tools
  NEON_TOOLS.forEach((tool) => {
    const handler = NEON_HANDLERS[tool.name];
    if (!handler) {
      throw new Error(`Handler for tool ${tool.name} not found`);
    }

    const toolHandler = handler as ToolHandlerExtended<typeof tool.name>;

    server.tool(
      tool.name,
      tool.description,
      { params: tool.inputSchema },
      async ({ params }, extra) => {
        logger.info('Tool called', { tool: tool.name, params });
        return await toolHandler({ params }, neonClient, extra);
      },
    );
  });

  // Register resources
  NEON_RESOURCES.forEach((resource) => {
    server.resource(
      resource.name,
      resource.uri,
      {
        description: resource.description,
        mimeType: resource.mimeType,
      },
      resource.handler,
    );
  });

  // server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  //   const { name, arguments: args } = request.params;
  //   console.log(chalk.green('Tool called:'), name, args);
  //   return {
  //     text: 'Hello, world!',
  //     result: 'success',
  //   };
  // });
  // server.server.onerror = (error) => {
  //   console.error(chalk.red('Server error:'), error);
  // };

  return server;
};
