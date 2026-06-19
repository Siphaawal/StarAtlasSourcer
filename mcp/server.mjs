#!/usr/bin/env node
/**
 * Star Atlas Sourcer — MCP server
 *
 * Exposes tools that let an LLM agent (Claude, etc.) create and list collab
 * requests. It's a thin wrapper over the REST API (POST/GET /api/v1/requests)
 * and authenticates with an API key generated in the Admin dashboard.
 *
 * Configure in your MCP client (e.g. Claude Desktop / Claude Code):
 *   {
 *     "mcpServers": {
 *       "star-atlas-sourcer": {
 *         "command": "node",
 *         "args": ["C:/Users/clawd/Desktop/StarAtlasSourcer/mcp/server.mjs"],
 *         "env": { "SAS_BASE_URL": "http://localhost:3000", "SAS_API_KEY": "sas_..." }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = (process.env.SAS_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const API_KEY = process.env.SAS_API_KEY || "";

async function api(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}`, ...(init.headers || {}) },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

const server = new McpServer({ name: "star-atlas-sourcer", version: "1.0.0" });

server.registerTool(
  "create_collab_request",
  {
    title: "Create collab request",
    description:
      "Create a Star Atlas Sourcer collab request (asset bounty). Set publish=true to go live immediately, " +
      "false to save as a draft for a human to confirm; omit to use the admin default.",
    inputSchema: {
      title: z.string().describe("Request title, e.g. 'Warp Drive — Tiers 1-5'"),
      description: z.string().optional(),
      assetType: z.string().optional().describe("e.g. 'Warp Drive'"),
      outputFileName: z.string().optional().describe("Base filename used when an accepted asset is committed"),
      imageCount: z.number().int().min(1).max(5).optional().describe("Images required per submission (1-5)"),
      targetWeb: z.boolean().optional().describe("Target the Web platform (default true)"),
      targetUE5: z.boolean().optional().describe("Target Unreal Engine 5"),
      tierMin: z.number().int().optional(),
      tierMax: z.number().int().optional(),
      aspectRatio: z.string().optional().describe("e.g. '1:1', '16:9'"),
      resolution: z.string().optional().describe("e.g. '1024x1024'"),
      format: z.string().optional().describe("PNG / JPG / WEBP / SVG"),
      colorPalette: z.string().optional(),
      styleNotes: z.string().optional(),
      maxFileSizeMB: z.number().int().min(1).max(50).optional(),
      backgroundUrl: z.string().optional().describe("URL of a reference background image to attach"),
      publish: z.boolean().optional().describe("true=publish now, false=draft, omit=admin default"),
    },
  },
  async (args) => {
    try {
      const result = await api("/api/v1/requests", { method: "POST", body: JSON.stringify(args) });
      return {
        content: [
          {
            type: "text",
            text: `Created "${result.title}" (${result.status}).\n${result.url}`,
          },
        ],
      };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Failed: ${e.message}` }] };
    }
  }
);

server.registerTool(
  "list_collab_requests",
  { title: "List collab requests", description: "List recent Star Atlas Sourcer collab requests.", inputSchema: {} },
  async () => {
    try {
      const { requests } = await api("/api/v1/requests");
      const lines = requests.map(
        (r) => `- ${r.title} [${r.status}] ${r.targetWeb ? "Web" : ""}${r.targetUE5 ? " UE5" : ""} · ${r._count.submissions} submissions (id ${r.id})`
      );
      return { content: [{ type: "text", text: lines.join("\n") || "No requests." }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Failed: ${e.message}` }] };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Star Atlas Sourcer MCP server running (stdio).");
