# AGENTS.md

## 项目概览

`cmd-hint` 是一个使用 Bun 管理的 TypeScript 终端工具。

当前阶段只保留极简 CLI 入口：

- `-login`：登录分支占位
- 自然语言输入：命令提示分支占位

当前不要在 CLI 入口里实现核心逻辑、LLM 调用或复杂交互。后续新增能力时，入口只负责参数解析和调度。

## 指令优先级

冲突时按以下优先级执行：

1. 当前任务中的用户直接要求
2. 本文件 `AGENTS.md`
3. 可执行配置：`package.json` scripts、`eslint.config.js`、`tsconfig.json`

说明：

- 文档与脚本不一致时，以可执行配置为准。
- 若任务要求与现有架构冲突，先说明冲突，再做最小必要改动。

## 常用命令

这里仅列出入口命令；其余命令以 `package.json` scripts 为准。

```bash
bun install
bun run dev
bun run dev -login
bun run dev "列出当前目录文件"
bun run lint
bun run lint:fix
bunx tsc --noEmit
```

交付代码改动前优先运行：

```bash
bun run lint
bunx tsc --noEmit
```

## 仓库地图

- CLI 入口：`src/bin/index.ts`
- 包配置：`package.json`
- TypeScript 配置：`tsconfig.json`
- ESLint 配置：`eslint.config.js`
- Bun 锁文件：`bun.lock`
- 使用说明：`README.md`

## 代码风格（仅非默认规则）

- 使用 ES modules（`import` / `export`），不要使用 `require`。
- 使用 TypeScript 严格模式，保持类型清晰。
- CLI 入口保持薄：只做参数读取、分支判断和调用下层模块。
- 当前只处理 `-login` 和自然语言输入；新增参数时同步更新 `README.md` 和本文件。
- 优先最小改动，避免无关重构。
- 无明确理由时不要新增运行时依赖。
- 不把 API key、token 或其他密钥写入源码、日志或文档示例。

## 工作流

- 开始改动前先看相关文件和 `package.json` scripts。
- 改 CLI 行为时，至少手动验证：

```bash
bun run dev
bun run dev -login
bun run dev "列出当前目录文件"
```

- 改 TypeScript、配置或依赖后，至少运行：

```bash
bun run lint
bunx tsc --noEmit
```

- 新增依赖必须通过 Bun 管理，并提交对应 `bun.lock` 变化。
- 文档变更应保持简洁，避免把实现计划写成长期承诺。

## 仓库协作约定

- 分支命名建议：`feat/*`、`fix/*`、`chore/*`。
- PR 或交付说明应包含：做了什么、如何验证。
- 未被任务要求时，不做纯格式化改动。
- 不回滚用户已有改动；遇到相关未提交改动时，先理解再继续。

## 注意事项 / 不要触碰

- 不要手动编辑或提交：
  - `node_modules`
  - `.env`
  - 临时输出目录或本地缓存
- 不要在 `src/bin/index.ts` 中直接堆叠 LLM/API/业务逻辑。
- 不要让命令生成工具默认执行 shell 命令；未来若支持执行，必须有显式确认。
- 不要把 secret、个人配置或本地机器路径写入可提交文件。
