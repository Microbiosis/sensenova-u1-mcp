# sensenova-u1-mcp

[![npm version](https://img.shields.io/npm/v/sensenova-u1-mcp)](https://www.npmjs.com/package/sensenova-u1-mcp)
[![License](https://img.shields.io/npm/l/sensenova-u1-mcp)](LICENSE)

SenseNova U1 Fast MCP Server — 基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 的图像生成服务，接入商汤科技 SenseNova U1 Fast 文生图 API。

## 功能特点

- 🖼️ 通过 MCP 协议调用 SenseNova U1 Fast 图像生成
- 🌏 支持中文提示词
- 📐 支持 11 种分辨率（含 16:9 / 9:16 / 1:1 / 竖屏等多种比例）
- 🔢 单次最多生成 4 张图像
- ⚡ 基于 Fetch API，轻量无额外依赖

## 安装

```bash
npm install -g sensenova-u1-mcp
```

或直接通过 `npx` 运行（无需安装）：

```bash
npx -y sensenova-u1-mcp
```

## 前置条件

需要有效的 **SenseNova API Key**，设置环境变量：

```bash
export SENSENOVA_API_KEY=sk-xxx
```

> Windows 用户：
> ```cmd
> set SENSENOVA_API_KEY=sk-xxx
> ```

## MCP 配置

### 在 Claude Desktop / Cursor / Windsurf 等 MCP 客户端中使用

在 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "sensenova-u1-fast": {
      "command": "npx",
      "args": ["-y", "sensenova-u1-mcp"],
      "env": {
        "SENSENOVA_API_KEY": "sk-xxx"
      }
    }
  }
}
```

## 可用工具

### `generate_image`

使用 SenseNova U1 Fast 生成图像。

**参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | string | ✅ | — | 图像描述文本，支持中文，最大约 4096 token |
| `size` | string | ❌ | `2752x1536` | 分辨率，支持 11 种尺寸 |
| `n` | integer | ❌ | `1` | 生成数量，1~4 |

**支持的分辨率：**

| 尺寸 | 比例 |
|------|------|
| 1344×3136 | 竖屏长图 |
| 1536×2752 | 竖屏长图 |
| 1664×2496 | 3:4 |
| 1760×2368 | ~3:4 |
| 1824×2272 | 4:5 |
| 2048×2048 | 1:1 正方形 |
| 2272×1824 | 5:4 |
| 2368×1760 | ~4:3 |
| 2496×1664 | 4:3 |
| 2752×1536 | 16:9 宽屏 |
| 3072×1376 | 超宽 |

## 开发

```bash
# 克隆后安装依赖
npm install

# 运行
SENSENOVA_API_KEY=sk-xxx node index.js
```

## 发布

```bash
npm publish
```

## License

[MIT](LICENSE)

## 作者

[redmingwei](https://github.com/Microbiosis)