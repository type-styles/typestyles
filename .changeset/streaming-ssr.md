---
"typestyles": minor
---

Add `createUseServerInsertedHTML()` for React 18 streaming SSR.

Returns a stateful function that emits only the new CSS rules generated since the previous call. Use with `useServerInsertedHTML` from Next.js App Router or a similar framework hook to inject styles incrementally as Suspense boundaries resolve.

```tsx
import { createUseServerInsertedHTML } from 'typestyles/server';
import { useServerInsertedHTML } from 'next/navigation';

function TypestylesProvider({ children }) {
  const getInsertedHTML = createUseServerInsertedHTML();

  useServerInsertedHTML(() => {
    const styles = getInsertedHTML();
    if (!styles) return null;
    return <style id="typestyles" dangerouslySetInnerHTML={{ __html: styles }} />;
  });

  return <>{children}</>;
}
```
