export type ComponentRegistryEntry = {
  readonly handle: object;
  readonly themeable: boolean;
};

export type ComponentRegistryApi = {
  getComponent(namespace: string): object | undefined;
  getThemeableComponents(): ReadonlyMap<string, object>;
  listComponentNamespaces(): readonly string[];
};

export type ComponentRegistry = ComponentRegistryApi & {
  register(namespace: string, handle: object, themeable: boolean): void;
};

export function createComponentRegistry(): ComponentRegistry {
  const byNamespace = new Map<string, ComponentRegistryEntry>();

  function register(namespace: string, handle: object, themeable: boolean): void {
    if (byNamespace.has(namespace) && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[typestyles] Duplicate component namespace "${namespace}" on this createTypeStyles / createStyles instance — replacing the previous registration.`,
      );
    }
    byNamespace.set(namespace, { handle, themeable });
  }

  function getComponent(namespace: string): object | undefined {
    return byNamespace.get(namespace)?.handle;
  }

  function getThemeableComponents(): ReadonlyMap<string, object> {
    const map = new Map<string, object>();
    for (const [ns, entry] of byNamespace) {
      if (entry.themeable) map.set(ns, entry.handle);
    }
    return map;
  }

  function listComponentNamespaces(): readonly string[] {
    return [...byNamespace.keys()];
  }

  return { register, getComponent, getThemeableComponents, listComponentNamespaces };
}

export function attachComponentRegistryMethods<T extends object>(
  api: T,
  registry: ComponentRegistryApi,
): T & ComponentRegistryApi {
  return Object.assign(api, {
    getComponent: registry.getComponent.bind(registry),
    getThemeableComponents: registry.getThemeableComponents.bind(registry),
    listComponentNamespaces: registry.listComponentNamespaces.bind(registry),
  });
}

/**
 * Plain object of themeable recipe handles keyed by namespace — import or re-export
 * from CSS extract entries so bundlers retain every registered component's CSS (#219).
 */
export function getRegisteredComponentRefs(
  styles: ComponentRegistryApi,
): Readonly<Record<string, object>> {
  return Object.fromEntries(styles.getThemeableComponents());
}
