---
'@typestyles/vite': patch
---

Auto-inject `<link rel="stylesheet">` for extracted `typestyles.css` into HTML entry points during dev and build, fixing silent unstyled production builds when the manual link step is skipped ([#133](https://github.com/type-styles/typestyles/issues/133)).
