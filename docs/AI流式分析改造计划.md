# AI 流式分析改造计划

## 目标

将智能体的思考过程从硬编码脚本升级为真实 AI 流式生成。数据仍为 mock，但 AI 确实根据遥测数据实时分析并流式输出结果。

## 技术决策

| 项目 | 决定 |
|------|------|
| AI 接入方式 | 前端 → 后端(FastAPI) → OpenAI 兼容接口 |
| 覆盖范围 | supervisor 分析 + agent 执行推演，两阶段都用 AI |
| 流式交互 | 真流式（token 级），SSE 协议 |
| 输出格式 | 纯文本流（类似 ChatGPT 效果） |
| Prompt 数据 | 发送当前 mock 遥测数据作为上下文 |
| 后端技术栈 | Python + FastAPI |
| LLM 服务 | OpenAI 兼容接口（DeepSeek/通义千问等） |

## 后端搭建（从零）

### 文件结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 入口，CORS 配置
│   ├── routers/
│   │   └── ai.py            # SSE 端点 /api/ai/analyze
│   ├── services/
│   │   └── llm.py           # 调用 OpenAI 兼容接口，流式转发
│   └── prompts.py           # system prompt 模板（水处理专家角色）
└── requirements.txt         # fastapi, uvicorn, openai, sse-starlette
```

### 接口设计

**POST /api/ai/analyze** → SSE 流

请求体：
```json
{
  "incident_type": "dosing_abnormal",
  "phase": "supervisor",
  "telemetry": {
    "inflow": 1200,
    "outflow": 1150,
    "turbidityIn": 15.2,
    "turbidityOut": 3.2,
    "dosingPumpFreq": 42.3,
    ...
  }
}
```

响应：SSE 事件流
```
data: {"type": "token", "content": "检测到"}
data: {"type": "token", "content": "加药泵"}
data: {"type": "token", "content": "频率异常"}
...
data: {"type": "done"}
```

## 前端改造（替换式）

### 删除

| 文件 | 原因 |
|------|------|
| `data/thinkingScripts.ts` | 硬编码脚本不再需要 |
| `hooks/useTypewriter.ts` | 被流式 hook 替代 |
| `components/InfoPanel/TypewriterText.tsx` | 被流式渲染组件替代 |
| `DashboardPage.tsx` 中 `buildThinking()` + 相关 useEffect | 不再由前端构造 thinking 内容 |

### 新增

| 文件 | 职责 |
|------|------|
| `api/services/aiService.ts` | SSE 客户端，发起流式请求，解析事件 |
| `hooks/useStreamingAI.ts` | 管理 SSE 连接、累积文本、状态（idle/streaming/done/error） |

### 改造

| 文件 | 改动内容 |
|------|----------|
| `stores/useScenarioStore.ts` | `thinking` 字段从 `ThinkingContent` 改为流式文本结构 |
| `types/scenario.ts` | 调整/新增流式相关类型定义 |
| `components/InfoPanel/InfoPanel.tsx` | Thinking 区域改为渲染流式纯文本（带光标） |
| `DashboardPage.tsx` | phase 变化时触发 AI 请求而非填充硬编码内容 |

### 保留不动

- 场景状态机的 phase 推进逻辑（9 阶段不变）
- DecisionChain 组件
- 3D ThinkingBubble（后续适配，本次先聚焦 InfoPanel）
- 其他 mock 数据（遥测、设备、告警）
- `demoSnapshots.ts`（快照功能独立于 AI 流式）

## 数据流（改造后）

```
用户触发场景 (Ctrl+1-4)
  → startIncident() 设置 phase
  → phase 进入 SUPERVISOR_ANALYZING
  → 触发 AI 请求：POST /api/ai/analyze { incident_type, phase: "supervisor", telemetry }
  → 后端拼 prompt + 遥测数据 → 调 LLM → SSE 流式返回
  → 前端 useStreamingAI 逐 token 累积 → store 更新 → InfoPanel 实时渲染
  → AI 输出完毕 → phase 推进到 DISPATCHING → AGENT_ANALYZING
  → 触发第二次 AI 请求：{ incident_type, phase: "agent", telemetry }
  → 同样流式输出到 InfoPanel
  → AI 输出完毕 → phase 继续推进
```

## 容错设计

- AI 调用失败：显示简短错误提示，不阻塞 phase 推进
- 超时机制：30s 无响应自动断开，显示超时提示
- 用户中途重置（forceIdle）：立即断开 SSE 连接，清空流式文本

## 实施顺序

1. **清理前端旧代码** — 删除 thinkingScripts、useTypewriter、TypewriterText、buildThinking
2. **定义新类型** — 流式文本相关类型、AI 请求/响应类型
3. **搭建后端** — FastAPI + SSE 端点 + LLM 调用
4. **前端新增** — aiService + useStreamingAI hook
5. **改造 Store** — thinking 字段适配流式
6. **改造 InfoPanel** — 流式文本渲染
7. **改造 DashboardPage** — phase 变化触发 AI 请求
8. **联调测试** — 前后端联通，验证流式效果
