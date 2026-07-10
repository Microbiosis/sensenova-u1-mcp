# sensenova-u1-mcp

[![npm version](https://img.shields.io/npm/v/sensenova-u1-mcp)](https://www.npmjs.com/package/sensenova-u1-mcp)
[![npm downloads](https://img.shields.io/npm/dm/sensenova-u1-mcp)](https://www.npmjs.com/package/sensenova-u1-mcp)
[![License](https://img.shields.io/npm/l/sensenova-u1-mcp)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Microbiosis/sensenova-u1-mcp?style=social)](https://github.com/Microbiosis/sensenova-u1-mcp)

> SenseNova U1 Fast MCP Server -- 基于 Model Context Protocol (MCP) 的图像生成服务，接入商汤科技 SenseNova U1 Fast 文生图 API。

---

## 目录

- [功能特点](#功能特点)
- [快速开始](#快速开始)
- [MCP 配置](#mcp-配置)
- [工具说明](#工具说明)
- [API 参考](#api-参考)
- [开发指南](#开发指南)
- [许可证](#许可证)

---

## 功能特点

- AI 图像生成 -- 通过 MCP 协议调用 SenseNova U1 Fast 文生图 API
- 中文支持 -- 完全支持中文提示词，描述越详细效果越好
- 11 种分辨率 -- 支持 16:9 / 9:16 / 1:1 / 3:4 / 4:3 / 21:9 等多种比例
- 批量生成 -- 单次最多生成 4 张图像
- 轻量无依赖 -- 纯原生 Fetch API，仅依赖 MCP SDK

---

## 快速开始

### 前置条件

1. 注册 [SenseNova 平台](https://platform.sensenova.cn) 并获取 API Key
2. 设置环境变量：

```bash
# macOS / Linux
export SENSENOVA_API_KEY=sk-xxx

# Windows (CMD)
set SENSENOVA_API_KEY=sk-xxx

# Windows (PowerShell)
$env:SENSENOVA_API_KEY="sk-xxx"
```

### 安装

```bash
# 全局安装
npm install -g sensenova-u1-mcp

# 或直接运行（无需安装）
npx -y sensenova-u1-mcp
```

---

## MCP 配置

### Claude Desktop / Cursor / VS Code / Cherry Studio

在 MCP 客户端配置文件中添加：

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

注意：`command` 必须为 `npx`，`args` 中不含任何本地绝对路径，确保配置可移植。

---

## 工具说明

### `generate_image`

使用 SenseNova U1 Fast 模型生成图像。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:----:|:------:|------|
| `prompt` | `string` | 是 | -- | 图像描述文本，支持中文，最大约 4096 token。描述越详细效果越好 |
| `size` | `string` | 否 | `2752x1536` | 分辨率，支持 11 种尺寸（见下方表格） |
| `n` | `integer` | 否 | `1` | 生成数量，范围 1~4 |

#### 支持的分辨率

| 尺寸 | 比例 | 适用场景 |
|------|:----:|----------|
| `1344x3136` | 9:21 | 超长竖屏 |
| `1536x2752` | 9:16 | 手机壁纸/海报 |
| `1664x2496` | 2:3 | 竖屏信息图 |
| `1760x2368` | 3:4 | 竖版卡片 |
| `1824x2272` | 4:5 | 社交媒体图文 |
| `2048x2048` | 1:1 | 正方形封面图 |
| `2272x1824` | 5:4 | 横版卡片 |
| `2368x1760` | 4:3 | 平板/展示 |
| `2496x1664` | 3:2 | 横版海报 |
| **`2752x1536`** | **16:9** | **默认，宽屏/信息图** |
| `3072x1376` | 21:9 | 超宽屏 |

### Prompt 示例

详细的 prompt 能生成更精准的图像。以下是一个完整的示例结构：

```text
主题：[简要描述图像主题]
风格：[卡通/写实/扁平/3D 等]
色调：[主色调描述]
布局：[排版说明]
元素：[关键元素列表]
文本：[需要包含的文字内容]
```

---

## API 参考

本服务基于官方 SenseNova U1 Fast API：

```
POST https://token.sensenova.cn/v1/images/generations
```

| 参数 | 类型 | 必填 | 默认值 |
|------|------|:----:|:------:|
| `model` | `string` | 是 | `sensenova-u1-fast` |
| `prompt` | `string` | 是 | -- |
| `size` | `string` | 否 | `2752x1536` |
| `n` | `integer` | 否 | `1` |

**响应结构**：

```json
{
  "created": 1713167890,
  "data": [
    { "url": "https://cdn.sensenova.dev/gen/..." }
  ]
}
```

### 错误码

| HTTP | 含义 | 处理建议 |
|:----:|------|----------|
| 400 | 参数不合法 | 检查请求参数 |
| 403 | 权限不足 | 检查 API Key |
| 429 | 额度超限 | 每 5 小时 1500 次限制，稍后重试 |
| 500 | 服务端错误 | 稍后重试 |

---

## 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/Microbiosis/sensenova-u1-mcp.git
cd sensenova-u1-mcp

# 安装依赖
npm install

# 设置环境变量
export SENSENOVA_API_KEY=sk-xxx

# 运行
node index.js
```

### 项目结构

```
sensenova-u1-mcp/
├── index.js          # MCP 服务器主入口
├── server.json       # MCP Registry 注册配置
├── package.json
├── README.md
├── LICENSE           # MIT 许可证
├── .editorconfig     # 编辑器代码风格配置
├── .gitignore
└── .npmignore
```

### 发布到 npm

```bash
# 更新版本号
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0

# 发布
npm publish

# 验证
npx -y sensenova-u1-mcp
```

---

## 许可证

[MIT](LICENSE) (c) 2025 [redmingwei](https://github.com/Microbiosis)