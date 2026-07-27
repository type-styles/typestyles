/**
 * Compile-time assertions for styles.component() overload discrimination (Issue #166).
 */
import { createStyles } from './styles';

const styles = createStyles();

// Avatar-like slot names that do not overlap CSS properties
const avatar = styles.component('avatar', {
  slots: ['root', 'image', 'initials', 'status'] as const,
  base: {
    root: { display: 'flex' },
    image: { width: '100%', height: '100%' },
    initials: { fontSize: '14px' },
    status: { position: 'absolute' },
  },
  variants: {
    size: {
      xs: { root: { width: '20px' } },
      md: { root: { width: '40px' } },
    },
  },
  defaultVariants: { size: 'md' },
});

const avatarClasses = avatar({ size: 'xs' });
void avatarClasses.root;
void avatarClasses.image;
void avatarClasses.initials;
void avatarClasses.status;

// @ts-expect-error — unknown variant option
avatar({ size: 'xl' });

// Callback form (var-ui pattern) — must not fall through to dimensioned overload
const avatarCb = styles.component('avatar-cb', () => ({
  slots: ['root', 'image', 'initials', 'status'] as const,
  base: {
    root: { display: 'flex' },
    image: { width: '100%' },
    initials: { fontSize: '14px' },
    status: { position: 'absolute' },
  },
  variants: {
    size: {
      xs: { root: { width: '20px' } },
      md: { root: { width: '40px' } },
    },
  },
  defaultVariants: { size: 'md' as const },
}));

const avatarCbClasses = avatarCb({ size: 'md' });
void avatarCbClasses.root;

// Layered callback + slots (var-ui with cascade layers)
const layered = createStyles({ layers: ['components'] as const });
const layeredAvatar = layered.component(
  'layered-avatar',
  () => ({
    slots: ['root', 'image'] as const,
    base: { root: { display: 'flex' }, image: { width: '100%' } },
    variants: {
      size: {
        sm: { root: { width: '24px' } },
        lg: { root: { width: '48px' } },
      },
    },
  }),
  { layer: 'components' },
);
void layeredAvatar({ size: 'sm' }).root;

// Explicit generic escape hatch when inference still needs help
type AvatarSlots = readonly ['root', 'image', 'initials', 'status'];
type AvatarVariantDefs = {
  size: {
    xs: { root: { width: string } };
    md: { root: { width: string } };
  };
};

const pinned = styles.component<AvatarSlots, AvatarVariantDefs>('avatar-pinned', {
  slots: ['root', 'image', 'initials', 'status'] as const,
  base: { root: { display: 'flex' } },
  variants: { size: { xs: { root: { width: '20px' } }, md: { root: { width: '40px' } } } },
});
void pinned({ size: 'md' }).root;

// Flat variant still works
const badge = styles.component('badge', {
  base: { display: 'inline-flex' },
  elevated: { boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
});
void badge.base;
void badge.elevated;
void badge({ elevated: true });

// Dimensioned variant still works
const button = styles.component('button', {
  base: { padding: '8px' },
  variants: {
    intent: { primary: { color: 'blue' }, ghost: { color: 'gray' } },
    size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } },
  },
});
void button.base;
void button({ intent: 'primary', size: 'lg' });

// Multi-slot without variants
const card = styles.component('card', {
  slots: ['root', 'header', 'body'] as const,
  root: { display: 'grid' },
  header: { fontWeight: 600 },
  body: { padding: '8px' },
});
void card().root;
void card.header;

void avatar;
void avatarCb;
void layeredAvatar;
void pinned;
void badge;
void button;
void card;
