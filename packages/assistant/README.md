# @routepilot/assistant

Framework-agnostic retrieval core for RoutePilot — turns your tour steps into a searchable index so users can ask questions and jump straight to the answer.

- BM25 ranking in the browser (no LLM, no API key, no backend)
- Tokenizer + light stemmer with query-time synonym expansion
- Per-step `meta.assistant` bag (`keywords`, `aliases`, `intent`, `errorPatterns`)
- Scope rules (`all-tours`, `current-tour-only`, `current-tour-first`)
- Optional async reranker hook for lexical → semantic pipelines
- Ships the shared CSS consumed by the React and Angular bindings

Install:

```bash
npm install @routepilot/assistant
```

Pair with the binding for your stack:

- React: [`@routepilot/assistant-react`](https://www.npmjs.com/package/@routepilot/assistant-react)
- Angular: [`@routepilot/assistant-angular`](https://www.npmjs.com/package/@routepilot/assistant-angular)

Docs: https://routepilot.dev/docs#assistant
Source: https://github.com/chrisfeldkircher/routepilot/tree/main/packages/assistant
