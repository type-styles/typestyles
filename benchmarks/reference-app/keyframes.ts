import { keyframes } from 'typestyles';

export function createReferenceKeyframes() {
  const fadeIn = keyframes.create('fadeIn', {
    from: { opacity: 0 },
    to: { opacity: 1 },
  });

  const spin = keyframes.create('spin', {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  });

  return { fadeIn, spin };
}
