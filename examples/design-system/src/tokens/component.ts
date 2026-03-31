export type DesignCodeBlockValues = {
  background: string;
  backgroundHeader: string;
  backgroundInline: string;
  backgroundLineHighlight: string;
  border: string;
};

export type DesignComponentValues = {
  codeBlock: DesignCodeBlockValues;
};

export const codeBlockValues: DesignCodeBlockValues = {
  background: 'var(--color-background-surface)',
  backgroundHeader: 'var(--color-background-subtle)',
  backgroundInline: 'var(--color-background-subtle)',
  backgroundLineHighlight: 'var(--color-background-subtle)',
  border: 'var(--color-border-default)',
};
