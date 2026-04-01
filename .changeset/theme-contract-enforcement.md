---
"typestyles": minor
---

Add `tokens.createContract()` for TypeScript-enforced theme completeness.

`tokens.createContract(namespace, shape)` defines the required token keys for a namespace without injecting CSS. The returned `ThemeContractRef` can be used anywhere a `TokenRef` is accepted (e.g. in style objects), and when passed to `tokens.createTheme()`, TypeScript errors if any key is missing.

```ts
const colorContract = tokens.createContract('color', {
  primary: '',
  secondary: '',
  surface: '',
});

// TypeScript error if 'secondary' or 'surface' are missing:
const darkTheme = tokens.createTheme('dark', colorContract, {
  primary: '#66b3ff',
  secondary: '#aabbcc',
  surface: '#1a1a2e',
});
```
