import { style, globalStyle, keyframes } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import type { VeTokens } from './tokens';

export function createVeComponents(t: VeTokens) {
  // 1. Button
  const button = recipe({
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.space[2],
      padding: `${t.space[2]} ${t.space[4]}`,
      borderRadius: t.radius.md,
      fontSize: t.typography.fontSize.sm,
      fontWeight: t.typography.fontWeight.medium,
      fontFamily: t.typography.fontFamily.sans,
      cursor: 'pointer',
      border: 'none',
      transition: `background-color ${t.duration.fast} ${t.easing.standard}`,
      ':hover': { opacity: '0.9' },
      ':focus-visible': { outline: `2px solid ${t.color.borderFocus}`, outlineOffset: '2px' },
      ':disabled': { opacity: '0.5', cursor: 'not-allowed' },
    },
    variants: {
      intent: {
        primary: { backgroundColor: t.color.primary, color: t.color.textOnAccent },
        secondary: {
          backgroundColor: t.color.surfaceOverlay,
          color: t.color.text,
          border: `1px solid ${t.color.border}`,
        },
        ghost: { backgroundColor: 'transparent', color: t.color.text },
        danger: { backgroundColor: t.color.danger, color: t.color.textOnAccent },
      },
      size: {
        sm: { padding: `${t.space[1]} ${t.space[3]}`, fontSize: t.typography.fontSize.xs },
        md: { padding: `${t.space[2]} ${t.space[4]}`, fontSize: t.typography.fontSize.sm },
        lg: { padding: `${t.space[3]} ${t.space[6]}`, fontSize: t.typography.fontSize.md },
      },
    },
    compoundVariants: [
      {
        variants: { intent: 'primary', size: 'lg' },
        style: { fontWeight: t.typography.fontWeight.semibold },
      },
    ],
    defaultVariants: { intent: 'primary', size: 'md' },
  });

  // 2. Card
  const cardBase = style({
    backgroundColor: t.color.surface,
    borderRadius: t.radius.lg,
    border: `1px solid ${t.color.border}`,
    padding: t.space[6],
    fontFamily: t.typography.fontFamily.sans,
  });
  const cardElevated = style({ boxShadow: t.shadow.md });
  const cardInteractive = style({
    cursor: 'pointer',
    ':hover': { borderColor: t.color.borderStrong, boxShadow: t.shadow.sm },
  });
  const cardCompact = style({ padding: t.space[4] });

  // 3. Input
  const input = recipe({
    base: {
      display: 'block',
      width: '100%',
      padding: `${t.space[2]} ${t.space[3]}`,
      borderRadius: t.radius.md,
      border: `1px solid ${t.color.border}`,
      fontSize: t.typography.fontSize.sm,
      fontFamily: t.typography.fontFamily.sans,
      color: t.color.text,
      backgroundColor: t.color.surface,
      transition: `border-color ${t.duration.fast} ${t.easing.standard}`,
      ':focus': {
        borderColor: t.color.borderFocus,
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
      },
      '::placeholder': { color: t.color.textMuted },
    },
    variants: {
      size: {
        sm: { padding: `${t.space[1]} ${t.space[2]}`, fontSize: t.typography.fontSize.xs },
        md: { padding: `${t.space[2]} ${t.space[3]}`, fontSize: t.typography.fontSize.sm },
        lg: { padding: `${t.space[3]} ${t.space[4]}`, fontSize: t.typography.fontSize.md },
      },
      state: {
        error: {
          borderColor: t.color.danger,
          ':focus': { boxShadow: '0 0 0 3px rgba(220,38,38,0.1)' },
        },
        success: { borderColor: t.color.success },
      },
    },
    defaultVariants: { size: 'md' },
  });

  // 4. Badge
  const badge = recipe({
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: t.radius.full,
      fontSize: t.typography.fontSize.xs,
      fontWeight: t.typography.fontWeight.medium,
      fontFamily: t.typography.fontFamily.sans,
      lineHeight: '1',
      whiteSpace: 'nowrap',
    },
    variants: {
      tone: {
        neutral: { backgroundColor: t.color.surfaceOverlay, color: t.color.textSecondary },
        primary: { backgroundColor: '#dbeafe', color: t.color.primary },
        danger: { backgroundColor: t.color.dangerSubtle, color: t.color.danger },
        success: { backgroundColor: t.color.successSubtle, color: t.color.success },
        warning: { backgroundColor: t.color.warningSubtle, color: t.color.warning },
      },
      size: {
        sm: { padding: `${t.space['0_5']} ${t.space[2]}` },
        md: { padding: `${t.space[1]} ${t.space['2_5']}` },
      },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  });

  // 5. Avatar
  const avatar = recipe({
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.full,
      backgroundColor: t.color.surfaceOverlay,
      color: t.color.textSecondary,
      fontWeight: t.typography.fontWeight.medium,
      fontFamily: t.typography.fontFamily.sans,
      overflow: 'hidden',
      flexShrink: '0',
    },
    variants: {
      size: {
        xs: { width: '24px', height: '24px', fontSize: t.typography.fontSize.xs },
        sm: { width: '32px', height: '32px', fontSize: t.typography.fontSize.xs },
        md: { width: '40px', height: '40px', fontSize: t.typography.fontSize.sm },
        lg: { width: '48px', height: '48px', fontSize: t.typography.fontSize.md },
        xl: { width: '64px', height: '64px', fontSize: t.typography.fontSize.xl },
      },
    },
    defaultVariants: { size: 'md' },
  });

  // 6. Checkbox
  const checkboxBase = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    cursor: 'pointer',
    fontSize: t.typography.fontSize.sm,
    fontFamily: t.typography.fontFamily.sans,
  });
  const checkboxDisabled = style({ opacity: '0.5', cursor: 'not-allowed' });

  // 7. Radio
  const radioBase = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    cursor: 'pointer',
    fontSize: t.typography.fontSize.sm,
    fontFamily: t.typography.fontFamily.sans,
  });
  const radioDisabled = style({ opacity: '0.5', cursor: 'not-allowed' });

  // 8. Toggle
  const toggleBase = style({
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    borderRadius: t.radius.full,
    backgroundColor: t.color.surfaceOverlay,
    border: `1px solid ${t.color.border}`,
    cursor: 'pointer',
    transition: `background-color ${t.duration.fast} ${t.easing.standard}`,
  });
  const toggleDisabled = style({ opacity: '0.5', cursor: 'not-allowed' });

  // 9. Select
  const select = recipe({
    base: {
      display: 'block',
      width: '100%',
      padding: `${t.space[2]} ${t.space[3]}`,
      paddingRight: t.space[10],
      borderRadius: t.radius.md,
      border: `1px solid ${t.color.border}`,
      fontSize: t.typography.fontSize.sm,
      fontFamily: t.typography.fontFamily.sans,
      color: t.color.text,
      backgroundColor: t.color.surface,
      appearance: 'none',
      ':focus': { borderColor: t.color.borderFocus, outline: 'none' },
    },
    variants: {
      size: {
        sm: { padding: `${t.space[1]} ${t.space[2]}`, fontSize: t.typography.fontSize.xs },
        md: { padding: `${t.space[2]} ${t.space[3]}` },
        lg: { padding: `${t.space[3]} ${t.space[4]}`, fontSize: t.typography.fontSize.md },
      },
    },
    defaultVariants: { size: 'md' },
  });

  // 10. Textarea
  const textareaBase = style({
    display: 'block',
    width: '100%',
    minHeight: '80px',
    padding: `${t.space[2]} ${t.space[3]}`,
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border}`,
    fontSize: t.typography.fontSize.sm,
    fontFamily: t.typography.fontFamily.sans,
    color: t.color.text,
    backgroundColor: t.color.surface,
    resize: 'vertical',
    ':focus': { borderColor: t.color.borderFocus, outline: 'none' },
  });
  const textareaError = style({ borderColor: t.color.danger });

  // 11. Label
  const labelBase = style({
    display: 'block',
    fontSize: t.typography.fontSize.sm,
    fontWeight: t.typography.fontWeight.medium,
    fontFamily: t.typography.fontFamily.sans,
    color: t.color.text,
    marginBottom: t.space[1],
  });
  const labelRequired = style({ '::after': { content: '" *"', color: t.color.danger } });

  // 12. Alert
  const alert = recipe({
    base: {
      display: 'flex',
      gap: t.space[3],
      padding: t.space[4],
      borderRadius: t.radius.md,
      fontSize: t.typography.fontSize.sm,
      fontFamily: t.typography.fontFamily.sans,
      lineHeight: t.typography.lineHeight.normal,
    },
    variants: {
      tone: {
        info: {
          backgroundColor: t.color.infoSubtle,
          color: t.color.info,
          border: `1px solid ${t.color.info}`,
        },
        success: {
          backgroundColor: t.color.successSubtle,
          color: t.color.success,
          border: `1px solid ${t.color.success}`,
        },
        warning: {
          backgroundColor: t.color.warningSubtle,
          color: t.color.warning,
          border: `1px solid ${t.color.warning}`,
        },
        danger: {
          backgroundColor: t.color.dangerSubtle,
          color: t.color.danger,
          border: `1px solid ${t.color.danger}`,
        },
      },
    },
    defaultVariants: { tone: 'info' },
  });

  // 13. Dialog
  const dialog = recipe({
    base: {
      position: 'fixed',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: t.zIndex.modal,
    },
    variants: {
      size: {
        sm: {},
        md: {},
        lg: {},
        fullscreen: {},
      },
    },
    defaultVariants: { size: 'md' },
  });

  // 14. Dialog overlay
  const dialogOverlay = style({
    position: 'fixed',
    inset: '0',
    backgroundColor: t.color.overlay,
    zIndex: t.zIndex.modal,
  });

  // 15. Dialog content
  const dialogContent = style({
    backgroundColor: t.color.surface,
    borderRadius: t.radius.xl,
    boxShadow: t.shadow.xl,
    padding: t.space[6],
    maxHeight: '85vh',
    overflow: 'auto',
    position: 'relative',
    width: '100%',
  });

  // 16. Dropdown
  const dropdown = recipe({
    base: {
      position: 'absolute',
      backgroundColor: t.color.surface,
      borderRadius: t.radius.lg,
      border: `1px solid ${t.color.border}`,
      boxShadow: t.shadow.lg,
      padding: `${t.space[1]} 0`,
      zIndex: t.zIndex.dropdown,
      minWidth: '180px',
    },
    variants: {
      align: {
        start: { left: '0' },
        end: { right: '0' },
        center: { left: '50%', transform: 'translateX(-50%)' },
      },
    },
    defaultVariants: { align: 'start' },
  });

  // 17. Dropdown item
  const dropdownItem = style({
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
    padding: `${t.space[2]} ${t.space[3]}`,
    fontSize: t.typography.fontSize.sm,
    fontFamily: t.typography.fontFamily.sans,
    color: t.color.text,
    cursor: 'pointer',
    ':hover': { backgroundColor: t.color.surfaceOverlay },
  });

  // 18. Tabs
  const tabs = recipe({
    base: {
      display: 'flex',
      borderBottom: `1px solid ${t.color.border}`,
      gap: t.space[1],
      fontFamily: t.typography.fontFamily.sans,
    },
    variants: {
      variant: {
        underline: {},
        pill: {
          borderBottom: 'none',
          backgroundColor: t.color.surfaceOverlay,
          borderRadius: t.radius.lg,
          padding: t.space[1],
        },
      },
    },
    defaultVariants: { variant: 'underline' },
  });

  // 19. Tab trigger
  const tabTrigger = recipe({
    base: {
      padding: `${t.space[2]} ${t.space[4]}`,
      fontSize: t.typography.fontSize.sm,
      fontWeight: t.typography.fontWeight.medium,
      color: t.color.textSecondary,
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      transition: `color ${t.duration.fast} ${t.easing.standard}`,
      ':hover': { color: t.color.text },
    },
    variants: {
      variant: {
        underline: {},
        pill: { borderRadius: t.radius.md },
      },
    },
    defaultVariants: { variant: 'underline' },
  });

  // 20. Tooltip
  const tooltip = style({
    position: 'absolute',
    backgroundColor: t.color.text,
    color: t.color.surface,
    padding: `${t.space[1]} ${t.space[2]}`,
    borderRadius: t.radius.md,
    fontSize: t.typography.fontSize.xs,
    fontFamily: t.typography.fontFamily.sans,
    whiteSpace: 'nowrap',
    zIndex: t.zIndex.tooltip,
    pointerEvents: 'none',
  });

  // 21. Popover
  const popover = style({
    position: 'absolute',
    backgroundColor: t.color.surface,
    borderRadius: t.radius.lg,
    border: `1px solid ${t.color.border}`,
    boxShadow: t.shadow.lg,
    padding: t.space[4],
    zIndex: t.zIndex.popover,
  });

  // 22. Table
  const table = style({
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: t.typography.fontSize.sm,
    fontFamily: t.typography.fontFamily.sans,
  });

  // 23. Pagination
  const pagination = style({
    display: 'flex',
    alignItems: 'center',
    gap: t.space[1],
    fontFamily: t.typography.fontFamily.sans,
  });

  // 24. Pagination button
  const paginationBtnBase = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: t.radius.md,
    border: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surface,
    fontSize: t.typography.fontSize.sm,
    cursor: 'pointer',
    ':hover': { backgroundColor: t.color.surfaceOverlay },
  });
  const paginationBtnActive = style({
    backgroundColor: t.color.primary,
    color: t.color.textOnAccent,
    borderColor: t.color.primary,
  });
  const paginationBtnDisabled = style({ opacity: '0.5', cursor: 'not-allowed' });

  // 25. Breadcrumb
  const breadcrumb = style({
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
    fontSize: t.typography.fontSize.sm,
    fontFamily: t.typography.fontFamily.sans,
    color: t.color.textSecondary,
  });

  // 26. Sidebar
  const sidebarBase = style({
    display: 'flex',
    flexDirection: 'column',
    width: '240px',
    padding: t.space[4],
    borderRight: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surface,
    fontFamily: t.typography.fontFamily.sans,
    '@media': {
      '(max-width: 768px)': {
        position: 'fixed',
        left: '0',
        top: '0',
        bottom: '0',
        zIndex: t.zIndex.sticky as any,
        transform: 'translateX(-100%)',
      },
    },
  });
  const sidebarExpanded = style({
    '@media': { '(max-width: 768px)': { transform: 'translateX(0)' } },
  });

  // 27. Nav item
  const navItemBase = style({
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
    padding: `${t.space[2]} ${t.space[3]}`,
    borderRadius: t.radius.md,
    fontSize: t.typography.fontSize.sm,
    color: t.color.textSecondary,
    textDecoration: 'none',
    transition: `background-color ${t.duration.fast} ${t.easing.standard}`,
    ':hover': { backgroundColor: t.color.surfaceOverlay, color: t.color.text },
  });
  const navItemActive = style({
    backgroundColor: t.color.surfaceOverlay,
    color: t.color.primary,
    fontWeight: t.typography.fontWeight.medium,
  });

  // 28. Header
  const header = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${t.space[4]} ${t.space[6]}`,
    borderBottom: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surface,
    fontFamily: t.typography.fontFamily.sans,
    position: 'sticky',
    top: '0',
    zIndex: t.zIndex.sticky,
  });

  // 29. Footer
  const footer = style({
    padding: `${t.space[8]} ${t.space[6]}`,
    borderTop: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surfaceRaised,
    fontSize: t.typography.fontSize.sm,
    color: t.color.textSecondary,
    fontFamily: t.typography.fontFamily.sans,
  });

  // 30. Text
  const text = recipe({
    base: {
      fontFamily: t.typography.fontFamily.sans,
      color: t.color.text,
      lineHeight: t.typography.lineHeight.normal,
    },
    variants: {
      size: {
        xs: { fontSize: t.typography.fontSize.xs },
        sm: { fontSize: t.typography.fontSize.sm },
        md: { fontSize: t.typography.fontSize.md },
        lg: { fontSize: t.typography.fontSize.lg },
        xl: { fontSize: t.typography.fontSize.xl },
        '2xl': { fontSize: t.typography.fontSize['2xl'] },
        '3xl': { fontSize: t.typography.fontSize['3xl'] },
      },
      weight: {
        normal: { fontWeight: t.typography.fontWeight.normal },
        medium: { fontWeight: t.typography.fontWeight.medium },
        semibold: { fontWeight: t.typography.fontWeight.semibold },
        bold: { fontWeight: t.typography.fontWeight.bold },
      },
      tone: {
        default: { color: t.color.text },
        secondary: { color: t.color.textSecondary },
        muted: { color: t.color.textMuted },
        danger: { color: t.color.danger },
        success: { color: t.color.success },
      },
      align: {
        left: { textAlign: 'left' },
        center: { textAlign: 'center' },
        right: { textAlign: 'right' },
      },
    },
    defaultVariants: { size: 'md', weight: 'normal', tone: 'default' },
  });

  // 31. Heading
  const heading = recipe({
    base: {
      fontFamily: t.typography.fontFamily.sans,
      fontWeight: t.typography.fontWeight.bold,
      color: t.color.text,
      lineHeight: t.typography.lineHeight.tight,
    },
    variants: {
      level: {
        h1: { fontSize: t.typography.fontSize['4xl'] },
        h2: { fontSize: t.typography.fontSize['3xl'] },
        h3: { fontSize: t.typography.fontSize['2xl'] },
        h4: { fontSize: t.typography.fontSize.xl },
        h5: { fontSize: t.typography.fontSize.lg },
        h6: { fontSize: t.typography.fontSize.md },
      },
    },
    defaultVariants: { level: 'h2' },
  });

  // 32. Link
  const link = recipe({
    base: {
      color: t.color.primary,
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
      fontFamily: t.typography.fontFamily.sans,
      ':hover': { color: t.color.primaryHover },
    },
    variants: {
      variant: {
        default: {},
        subtle: {
          color: t.color.textSecondary,
          textDecoration: 'none',
          ':hover': { textDecoration: 'underline', color: t.color.text },
        },
      },
    },
    defaultVariants: { variant: 'default' },
  });

  // 33. Separator
  const separator = recipe({
    base: { border: 'none', borderTop: `1px solid ${t.color.border}`, margin: `${t.space[4]} 0` },
    variants: {
      orientation: {
        horizontal: { width: '100%' },
        vertical: {
          borderTop: 'none',
          borderLeft: `1px solid ${t.color.border}`,
          height: '100%',
          margin: `0 ${t.space[4]}`,
        },
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  });

  // 34. Skeleton
  const skeleton = recipe({
    base: {
      backgroundColor: t.color.surfaceOverlay,
      borderRadius: t.radius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    variants: {
      variant: {
        text: { height: '1em', width: '100%' },
        circle: { borderRadius: t.radius.full },
        rect: {},
      },
    },
    defaultVariants: { variant: 'text' },
  });

  // 35. Progress
  const progress = recipe({
    base: {
      width: '100%',
      height: '8px',
      backgroundColor: t.color.surfaceOverlay,
      borderRadius: t.radius.full,
      overflow: 'hidden',
    },
    variants: {
      tone: { primary: {}, success: {}, danger: {}, warning: {} },
      size: { sm: { height: '4px' }, md: { height: '8px' }, lg: { height: '12px' } },
    },
    defaultVariants: { tone: 'primary', size: 'md' },
  });

  // 36. Spinner
  const spinner = style({
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid transparent',
    borderTopColor: t.color.primary,
    borderRadius: t.radius.full,
  });

  // 37. Tag
  const tagBase = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[1],
    padding: `${t.space['0_5']} ${t.space[2]}`,
    borderRadius: t.radius.full,
    fontSize: t.typography.fontSize.xs,
    fontFamily: t.typography.fontFamily.sans,
    border: `1px solid ${t.color.border}`,
    backgroundColor: t.color.surface,
    color: t.color.textSecondary,
  });
  const tagRemovable = style({ paddingRight: t.space[1] });

  // 38. Toast
  const toast = recipe({
    base: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: t.space[3],
      padding: t.space[4],
      borderRadius: t.radius.lg,
      backgroundColor: t.color.surface,
      boxShadow: t.shadow.lg,
      border: `1px solid ${t.color.border}`,
      fontFamily: t.typography.fontFamily.sans,
      fontSize: t.typography.fontSize.sm,
      maxWidth: '420px',
    },
    variants: {
      tone: {
        info: { borderLeftWidth: '4px', borderLeftColor: t.color.info },
        success: { borderLeftWidth: '4px', borderLeftColor: t.color.success },
        warning: { borderLeftWidth: '4px', borderLeftColor: t.color.warning },
        danger: { borderLeftWidth: '4px', borderLeftColor: t.color.danger },
      },
    },
    defaultVariants: { tone: 'info' },
  });

  // 39. Accordion
  const accordion = style({
    borderRadius: t.radius.lg,
    border: `1px solid ${t.color.border}`,
    overflow: 'hidden',
    fontFamily: t.typography.fontFamily.sans,
  });

  // 40. Accordion item
  const accordionItemBase = style({ borderBottom: `1px solid ${t.color.border}` });
  const accordionItemOpen = style({});

  // 41. Accordion trigger
  const accordionTrigger = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${t.space[4]} ${t.space[4]}`,
    fontSize: t.typography.fontSize.sm,
    fontWeight: t.typography.fontWeight.medium,
    color: t.color.text,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    ':hover': { backgroundColor: t.color.surfaceRaised },
  });

  // 42. Code block
  const codeBlock = style({
    display: 'block',
    padding: t.space[4],
    borderRadius: t.radius.lg,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    fontSize: t.typography.fontSize.sm,
    fontFamily: t.typography.fontFamily.mono,
    lineHeight: t.typography.lineHeight.relaxed,
    overflow: 'auto',
    whiteSpace: 'pre',
    tabSize: '2',
  });

  // 43. Inline code
  const inlineCode = style({
    padding: `${t.space['0_5']} ${t.space[1]}`,
    borderRadius: t.radius.sm,
    backgroundColor: t.color.surfaceOverlay,
    fontFamily: t.typography.fontFamily.mono,
    fontSize: '0.875em',
    color: t.color.danger,
  });

  // 44. Container
  const container = recipe({
    base: {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: t.space[4],
      paddingRight: t.space[4],
      '@media': {
        '(min-width: 640px)': { maxWidth: '640px' },
        '(min-width: 768px)': { maxWidth: '768px' },
        '(min-width: 1024px)': { maxWidth: '1024px' },
        '(min-width: 1280px)': { maxWidth: '1280px' },
      },
    },
    variants: {
      size: {
        sm: { '@media': { '(min-width: 640px)': { maxWidth: '640px' } } },
        md: { '@media': { '(min-width: 768px)': { maxWidth: '768px' } } },
        lg: { '@media': { '(min-width: 1024px)': { maxWidth: '1024px' } } },
        xl: { '@media': { '(min-width: 1280px)': { maxWidth: '1280px' } } },
      },
    },
  });

  // 45. Grid
  const grid = recipe({
    base: { display: 'grid', gap: t.space[4] },
    variants: {
      cols: {
        '1': { gridTemplateColumns: '1fr' },
        '2': { gridTemplateColumns: 'repeat(2, 1fr)' },
        '3': { gridTemplateColumns: 'repeat(3, 1fr)' },
        '4': { gridTemplateColumns: 'repeat(4, 1fr)' },
      },
    },
    defaultVariants: { cols: '1' },
  });

  // 46. Stack
  const stack = recipe({
    base: { display: 'flex', flexDirection: 'column' },
    variants: {
      gap: {
        xs: { gap: t.space[1] },
        sm: { gap: t.space[2] },
        md: { gap: t.space[4] },
        lg: { gap: t.space[6] },
        xl: { gap: t.space[8] },
      },
      align: {
        start: { alignItems: 'flex-start' },
        center: { alignItems: 'center' },
        end: { alignItems: 'flex-end' },
        stretch: { alignItems: 'stretch' },
      },
    },
    defaultVariants: { gap: 'md', align: 'stretch' },
  });

  // 47. Inline
  const inline = recipe({
    base: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
    variants: {
      gap: {
        xs: { gap: t.space[1] },
        sm: { gap: t.space[2] },
        md: { gap: t.space[4] },
        lg: { gap: t.space[6] },
      },
      justify: {
        start: { justifyContent: 'flex-start' },
        center: { justifyContent: 'center' },
        end: { justifyContent: 'flex-end' },
        between: { justifyContent: 'space-between' },
      },
      wrap: { wrap: { flexWrap: 'wrap' }, nowrap: { flexWrap: 'nowrap' } },
    },
    defaultVariants: { gap: 'md', justify: 'start' },
  });

  // 48. Form field
  const formFieldBase = style({
    display: 'flex',
    flexDirection: 'column',
    gap: t.space[1],
    fontFamily: t.typography.fontFamily.sans,
  });
  const formFieldError = style({});

  // 49. Helper text
  const helperTextBase = style({
    fontSize: t.typography.fontSize.xs,
    fontFamily: t.typography.fontFamily.sans,
    color: t.color.textSecondary,
  });
  const helperTextError = style({ color: t.color.danger });

  // 50. Visually hidden
  const visuallyHidden = style({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  });

  // Keyframes
  const fadeIn = keyframes({ from: { opacity: '0' }, to: { opacity: '1' } });
  const spin = keyframes({
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  });

  // Globals
  globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });
  globalStyle('body', {
    margin: '0',
    fontFamily: t.typography.fontFamily.sans,
    fontSize: t.typography.fontSize.md,
    lineHeight: t.typography.lineHeight.normal,
    color: t.color.text,
    backgroundColor: t.color.background,
  });
  globalStyle('a', { color: t.color.primary, textDecoration: 'none' });
  globalStyle('img, video', { maxWidth: '100%', height: 'auto' });

  return {
    button,
    cardBase,
    cardElevated,
    cardInteractive,
    cardCompact,
    input,
    badge,
    avatar,
    checkboxBase,
    checkboxDisabled,
    radioBase,
    radioDisabled,
    toggleBase,
    toggleDisabled,
    select,
    textareaBase,
    textareaError,
    labelBase,
    labelRequired,
    alert,
    dialog,
    dialogOverlay,
    dialogContent,
    dropdown,
    dropdownItem,
    tabs,
    tabTrigger,
    tooltip,
    popover,
    table,
    pagination,
    paginationBtnBase,
    paginationBtnActive,
    paginationBtnDisabled,
    breadcrumb,
    sidebarBase,
    sidebarExpanded,
    navItemBase,
    navItemActive,
    header,
    footer,
    text,
    heading,
    link,
    separator,
    skeleton,
    progress,
    spinner,
    tagBase,
    tagRemovable,
    toast,
    accordion,
    accordionItemBase,
    accordionItemOpen,
    accordionTrigger,
    codeBlock,
    inlineCode,
    container,
    grid,
    stack,
    inline,
    formFieldBase,
    formFieldError,
    helperTextBase,
    helperTextError,
    visuallyHidden,
    fadeIn,
    spin,
  };
}

export type VeComponents = ReturnType<typeof createVeComponents>;
