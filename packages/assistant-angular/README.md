# @routepilot/assistant-angular

Angular bindings for [`@routepilot/assistant`](https://www.npmjs.com/package/@routepilot/assistant) — renders inside the `@routepilot/angular` tooltip footer.

- `TourAssistantService` (builds and owns the search index)
- `TourAssistantButtonComponent` — robot icon that opens the prompt bar
- `TourAssistantPromptComponent` — input + ranked results list
- `RpTooltipDirective` — portal-to-body tooltip with side flip
- `TOUR_ASSISTANT_CONFIG` injection token for scope, reranker, synonyms

Install:

```bash
npm install @routepilot/engine @routepilot/angular @routepilot/assistant @routepilot/assistant-angular
```

Import the shared CSS once in your app (e.g. `styles.scss`):

```scss
@import '@routepilot/assistant/tour-assistant.css';
```

Docs: https://routepilot.dev/docs#assistant
Source: https://github.com/chrisfeldkircher/routepilot/tree/main/packages/assistant-angular
