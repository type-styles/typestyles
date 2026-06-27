import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react';
import type {
  ComponentConfigInput,
  ComponentReturn,
  ComponentVariants,
  FlatComponentConfigInput,
  FlatComponentReturn,
  StylesApi,
  VariantDefinitions,
} from 'typestyles';
import { cx } from 'typestyles';
import { getVariantKeysFromConfig, splitVariantProps } from './split-props';

type StyledComponentType<Tag extends ElementType, Recipe> = ForwardRefExoticComponent<
  ComponentPropsWithoutRef<Tag> & ComponentVariants<Recipe> & RefAttributes<Element>
>;

export type StyledFactory = {
  <Tag extends ElementType, const V extends VariantDefinitions>(
    tag: Tag,
    config: ComponentConfigInput<V>,
  ): StyledComponentType<Tag, ComponentReturn<V>>;
  <Tag extends ElementType, const V extends VariantDefinitions, const N extends string>(
    tag: Tag,
    namespace: N,
    config: ComponentConfigInput<V>,
  ): StyledComponentType<Tag, ComponentReturn<V>>;
  <Tag extends ElementType, const K extends string>(
    tag: Tag,
    config: FlatComponentConfigInput<K>,
  ): StyledComponentType<Tag, FlatComponentReturn<K>>;
  <Tag extends ElementType, const K extends string, const N extends string>(
    tag: Tag,
    namespace: N,
    config: FlatComponentConfigInput<K>,
  ): StyledComponentType<Tag, FlatComponentReturn<K>>;
};

function resolveStyledArgs(
  tag: ElementType,
  configOrNamespace:
    | string
    | ComponentConfigInput<VariantDefinitions>
    | FlatComponentConfigInput<string>,
  maybeConfig?: ComponentConfigInput<VariantDefinitions> | FlatComponentConfigInput<string>,
): {
  tag: ElementType;
  namespace: string;
  config: ComponentConfigInput<VariantDefinitions> | FlatComponentConfigInput<string>;
} {
  if (typeof configOrNamespace === 'string' && maybeConfig != null) {
    return { tag, namespace: configOrNamespace, config: maybeConfig };
  }

  const namespace = typeof tag === 'string' ? tag : 'styled';
  return {
    tag,
    namespace,
    config: configOrNamespace as
      | ComponentConfigInput<VariantDefinitions>
      | FlatComponentConfigInput<string>,
  };
}

export function createStyled(styles: StylesApi): StyledFactory {
  function styled<Tag extends ElementType>(
    tag: Tag,
    configOrNamespace:
      | string
      | ComponentConfigInput<VariantDefinitions>
      | FlatComponentConfigInput<string>,
    maybeConfig?: ComponentConfigInput<VariantDefinitions> | FlatComponentConfigInput<string>,
  ) {
    const {
      tag: element,
      namespace,
      config,
    } = resolveStyledArgs(tag, configOrNamespace, maybeConfig);
    const recipe = styles.component(namespace, config as ComponentConfigInput<VariantDefinitions>);
    const variantKeys = getVariantKeysFromConfig(
      config as Record<string, unknown> | ((ctx: unknown) => Record<string, unknown>),
    );

    const Component = forwardRef<Element, ComponentPropsWithoutRef<Tag> & Record<string, unknown>>(
      function StyledComponent(props, ref) {
        const { className, ...propsWithoutClassName } = props;
        const { variants, rest } = splitVariantProps(
          propsWithoutClassName as Record<string, unknown>,
          variantKeys,
        );
        const mergedClassName = cx(
          (recipe as (selections?: Record<string, unknown>) => string)(variants),
          className,
        );
        const Element = element;

        return <Element {...rest} ref={ref} className={mergedClassName} />;
      },
    );

    Component.displayName = namespace.charAt(0).toUpperCase() + namespace.slice(1);

    return Component;
  }

  return styled as StyledFactory;
}
