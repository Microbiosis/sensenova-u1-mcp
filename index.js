#!/usr/bin/env node

// ============================================================================
// SenseNova U1 Fast MCP Server
// ============================================================================
// 基于 Model Context Protocol (MCP) 的图像生成服务
// 接入商汤科技 SenseNova U1 Fast 文生图 API
// ============================================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// 常量配置
// ============================================================================

/** SenseNova 图像生成 API 端点 */
const API_BASE = "https://token.sensenova.cn/v1/images/generations";

/** 服务元信息 */
const SERVER_INFO = {
  name: "sensenova-u1-fast",
  version: "1.0.3",
};

/** 支持的 11 种分辨率集合 */
const VALID_SIZES = new Set([
  "1664x2496",  // 2:3
  "2496x1664",  // 3:2
  "1760x2368",  // 3:4
  "2368x1760",  // 4:3
  "1824x2272",  // 4:5
  "2272x1824",  // 5:4
  "2048x2048",  // 1:1
  "2752x1536",  // 16:9
  "1536x2752",  // 9:16
  "3072x1376",  // 21:9
  "1344x3136",  // 9:21
]);

// ============================================================================
// 环境检查
// ============================================================================

/** 获取 SenseNova API Key，调用时惰性读取 */
function getApiKey() {
  const key = process.env.SENSENOVA_API_KEY;
  if (!key) {
    return null;
  }
  return key;
}

// ============================================================================
// 错误工具函数
// ============================================================================

/**
 * 创建标准错误响应
 * @param {string} code - 错误码
 * @param {string} message - 中文错误描述
 * @param {string} [hint] - 可选的修复提示
 * @returns {{ content: Array<{ type: string, text: string }>, isError: boolean }}
 */
function createError(code, message, hint = "") {
  let text = `[ERROR] ${message}`;
  if (hint) {
    text += `\n\n提示: ${hint}`;
  }
  return { content: [{ type: "text", text }], isError: true };
}

// ============================================================================
// 参数校验函数
// ============================================================================

/**
 * 校验 prompt 参数
 * @param {unknown} prompt
 * @returns {string | null} 校验通过返回空，否则返回错误信息
 */
function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return "prompt 不能为空，请提供图像描述文本。";
  }
  return null;
}

/**
 * 校验 size 参数
 * @param {unknown} size
 * @returns {string | null} 校验通过返回空，否则返回错误信息
 */
function validateSize(size) {
  if (!size || size === "2752x1536") return null; // 默认值
  if (typeof size !== "string" || !VALID_SIZES.has(size)) {
    const supported = Array.from(VALID_SIZES).sort();
    return `不支持的分辨率 '${size}'。\n支持的分辨率：${supported.join(", ")}`;
  }
  return null;
}

/**
 * 校验 n 参数
 * @param {unknown} n
 * @returns {string | null} 校验通过返回空，否则返回错误信息
 */
function validateN(n) {
  if (n === undefined || n === null) return null;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 4) {
    return "n 必须在 1~4 之间。";
  }
  return null;
}

// ============================================================================
// SenseNova API 调用
// ============================================================================

/**
 * 调用 SenseNova U1 Fast 图像生成 API
 * @param {string} prompt - 图像描述文本
 * @param {string} size - 分辨率
 * @param {number} n - 生成数量
 * @param {string} apiKey - API Key
 * @returns {Promise<Array<{ url: string }>>} 生成的图片 URL 列表
 * @throws {Error} API 调用失败时抛出
 */
async function generateImages(prompt, size, n, apiKey) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sensenova-u1-fast",
      prompt,
      size,
      n,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    let hint = "请检查 API Key 是否有效、额度是否充足。";
    if (response.status === 429) {
      hint = "每 5 小时 1500 次调用限制，请稍后重试。";
    } else if (response.status === 400) {
      hint = "请检查参数是否符合 API 文档要求。";
    }
    throw new Error(`API 请求失败 (HTTP ${response.status}):\n${text}\n\n提示: ${hint}`);
  }

  const data = await response.json();
  const images = data.data || [];

  if (images.length === 0) {
    throw new Error("API 未返回图片 URL，请稍后重试。");
  }

  return images;
}

// ============================================================================
// MCP 服务器初始化
// ============================================================================

const server = new Server(
  SERVER_INFO,
  { capabilities: { tools: {} } }
);

// ============================================================================
// 工具列表注册
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_image",
      description: "使用 SenseNova U1 Fast 模型，根据文本描述生成图像。支持中文 prompt，返回临时 URL 请及时下载。",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "图像描述文本，支持中文。描述越详细（构图、色彩、风格、元素）效果越好。最大约 4096 token。",
          },
          size: {
            type: "string",
            description: "图像分辨率，支持 11 种尺寸。默认 2752x1536(16:9)。",
            default: "2752x1536",
          },
          n: {
            type: "integer",
            description: "生成数量，1~4 张。",
            default: 1,
            minimum: 1,
            maximum: 4,
          },
        },
        required: ["prompt"],
      },
    },
  ],
}));

// ============================================================================
// 工具调用处理
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // 工具名检查
  if (name !== "generate_image") {
    return createError(
      "UNKNOWN_TOOL",
      `未知工具: ${name}`,
      `可用工具: generate_image`
    );
  }

  // API Key 检查（调用时惰性检查）
  const apiKey = getApiKey();
  if (!apiKey) {
    return createError(
      "MISSING_API_KEY",
      "环境变量 SENSENOVA_API_KEY 未设置。",
      "请在运行前设置环境变量，或在 MCP 客户端配置中添加该变量。"
    );
  }

  // 参数提取
  const prompt = args?.prompt;
  const size = args?.size || "2752x1536";
  const n = args?.n || 1;

  // 参数校验
  const promptError = validatePrompt(prompt);
  if (promptError) {
    return createError("INVALID_PROMPT", promptError);
  }

  const sizeError = validateSize(size);
  if (sizeError) {
    return createError("INVALID_SIZE", sizeError, "请选择支持的分辨率。");
  }

  const nError = validateN(n);
  if (nError) {
    return createError("INVALID_N", nError, "n 的取值范围为 1~4。");
  }

  // 调用 API
  try {
    const images = await generateImages(prompt, size, n, apiKey);

    const urls = images
      .map((item, idx) => `${idx + 1}. ${item.url}`)
      .join("\n");

    const result = [
      `[OK] 图像生成成功（${size}）\n`,
      urls,
      `\n[WARN] 以上链接为临时 URL，有效期仅 1 小时，请及时下载保存。`,
    ].join("\n");

    return { content: [{ type: "text", text: result }] };

  } catch (err) {
    return createError("API_ERROR", `请求异常: ${err.message}`);
  }
});

// ============================================================================
// 启动服务器
// ============================================================================

try {
  const transport = new StdioServerTransport();
  await server.connect(transport);
} catch (err) {
  console.error(`[FATAL] 服务器启动失败: ${err.message}`);
  process.exit(1);
}