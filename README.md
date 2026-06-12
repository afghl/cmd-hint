# cmd-hint

极简 Bun + TypeScript CLI demo。

安装后使用：

```bash
npm i -g cmd-hint
ch "列出当前目录文件"
```

本地开发：

```bash
bun install
bun run dev
bun run dev -login
bun run dev "列出当前目录文件"
bun run build
```

不带引号也可以，CLI 会把后面的参数按空格拼回一句：

```bash
bun run dev what is this
```

在 zsh 里，`?`、`*` 这类字符会先被 shell 当通配符处理；需要加引号或转义：

```bash
bun run dev "what is this?"
bun run dev what is this\?
```

自然语言输入会通过 pi agent 调用 OpenAI：

```bash
export OPENAI_API_KEY="your_api_key"
bun run dev "列出当前目录文件"
```

也可以使用别名：

```bash
export OPEN_API_KEY="your_api_key"
```

自定义 OpenAI-compatible base URL：

```bash
export OPEN_BASE_URL="https://api.openai.com/v1"
```

也兼容：

```bash
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

可选模型配置：

```bash
export CMD_HINT_MODEL="gpt-4o-mini"
```
