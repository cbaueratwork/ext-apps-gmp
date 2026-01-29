/**
 * Google Maps Platform MCP Server
 *
 * Provides tools for:
 * - renderMap: Display an interactive Google Map at a given location
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
  RESOURCE_URI_META_KEY,
} from "@modelcontextprotocol/ext-apps/server";
import { randomUUID } from "crypto";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;
const RESOURCE_URI = "ui://gmp-map/mcp-app.html";

/**
 * Creates a new MCP server instance with tools and resources registered.
 * Each HTTP session needs its own server instance because McpServer only supports one transport.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Google Maps Server",
    version: "1.0.0",
  });

  // CSP configuration for Google Maps
  const cspMeta = {
    ui: {
      csp: {
        connectDomains: [
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://lh3.googleusercontent.com",
          "https://*.googleapis.com",
        ],
        resourceDomains: [
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "https://lh3.googleusercontent.com",
          "https://*.googleapis.com",
          "https://*.ggpht.com", // Street view images
        ],
      },
    },
  };

  // Register the Google Maps resource
  registerAppResource(
    server,
    RESOURCE_URI,
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8",
      );
      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: cspMeta,
          },
        ],
      };
    },
  );

  // renderMap tool
  registerAppTool(
    server,
    "renderMap",
    {
      title: "Render Map",
      description: "Display an interactive Google Map at a specific location.",
      inputSchema: {
        lat: z.number().describe("Latitude (-90 to 90)"),
        lng: z.number().describe("Longitude (-180 to 180)"),
        zoom: z.number().describe("Zoom level (0-21)"),
      },
      _meta: { [RESOURCE_URI_META_KEY]: RESOURCE_URI },
    },
    async ({ lat, lng, zoom }): Promise<CallToolResult> => ({
      content: [
        {
          type: "text",
          text: `Displaying Google Map at: Lat:${lat.toFixed(4)}, Lng:${lng.toFixed(4)}, Zoom:${zoom}`,
        },
      ],
      _meta: {
        viewUUID: randomUUID(),
      },
    }),
  );

  return server;
}
