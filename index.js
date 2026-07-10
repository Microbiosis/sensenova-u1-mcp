#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = "https://token.sensenova.cn/v1/images/generations";
const VALID_SIZES = new Set([
  "1664x2496", "2496x1664", "1760x2368", "2368x1760",
  "1824x2272", "2272x1824", "2048x2048", "2752x1536",
  "1536x2752", "3072x1376", "1344x3136"
]);

const API_KEY = process.env.SENSENOVA_API_KEY;
if (!API_KEY) {
  console.error("Error: SENSENOVA_API_KEY environment variable is required");
  process.exit(1);
}

const server = new Server(
  { name: "sensenova-u1-fast", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_image",
      description: "使用 SenseNova U1 Fast 根据文本描述生成图像。返回的 URL 仅1小时有效，请及时下载。",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "图像描述文本，支持中文，最大约4096 token。描述越详细效果越好。"
          },
          size: {
            type: "string",
            description: "分辨率，如 2752x1536(16:9)。支持11种尺寸。",
            default: "2752x1536"
          },
          n: {
            type: "integer",
            description: "生成数量，1~4",
            default: 1
          }
        },
        required: ["prompt"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== "generate_image") {
    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true
    };
  }

  const prompt = args.prompt;
  const size = args.size || "2752x1536";
  const n = args.n || 1;

  if (!prompt?.trim()) {
    return {
      content: [{ type: "text", text: "[ERROR] prompt 不能为空" }],
      isError: true
    };
  }

  if (!VALID_SIZES.has(size)) {
    return {
      content: [{ type: "text", text: `[ERROR] 不支持的分辨率 '${size}'。支持: ${Array.from(VALID_SIZES).sort().join(", ")}` }],
      isError: true
    };
  }

  if (n < 1 || n > 4) {
    return {
      content: [{ type: "text", text: "[ERROR] n 必须在 1~4 之间" }],
      isError: true
    };
  }

  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: "sensenova-u1-fast", prompt, size, n })
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        content: [{ type: "text", text: `[ERROR] API 请求失败 (HTTP ${response.status}):\n${text}` }],
        isError: true
      };
    }

    const data = await response.json();
    const images = data.data || [];

    if (images.length === 0) {
      return {
        content: [{ type: "text", text: "[ERROR] API 未返回图片 URL" }],
        isError: true
      };
    }

    const urls = images.map((item, idx) => `${idx + 1}. ${item.url}`).join("\n");
    const result = `[OK] 图像生成成功（${size}）\n\n${urls}\n\n[WARN] 以上链接为临时 URL，有效期仅 1 小时，请及时下载保存。`;

    return { content: [{ type: "text", text: result }] };

  } catch (err) {
    return {
      content: [{ type: "text", text: `[ERROR] 请求异常: ${err.message}` }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
