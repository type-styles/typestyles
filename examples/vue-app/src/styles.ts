import { styles } from 'typestyles';

export const button = styles.component('vue-button', {
  base: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#0066ff',
  },
  ghost: {
    color: '#0066ff',
    backgroundColor: 'transparent',
    border: '1px solid #0066ff',
  },
});
