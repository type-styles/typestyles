# TypeStyles Documentation

This directory contains the documentation website and content for TypeStyles.

## Structure

```
docs/
├── content/
│   └── docs/           # All documentation markdown files
├── src/
│   ├── pages/          # Astro routes
│   ├── layouts/        # Shared Astro layouts
│   ├── lib/            # Markdown/document helpers
│   ├── navigation.ts   # Navigation configuration
│   ├── styles.ts       # Documentation site styles
│   └── tokens.ts       # Documentation site tokens
├── astro.config.mjs    # Astro configuration
├── package.json
└── README.md           # This file
```

## Documentation Files

All documentation content lives in `content/docs/`:

- **Getting Started**: Installation and basic usage
- **Core Concepts**: API documentation for styles, tokens, keyframes, color
- **Advanced Features**: SSR, Vite plugin, custom selectors, theming
- **Guides**: Migration, best practices, testing, performance, troubleshooting
- **Examples**: React integration, component libraries, design systems, animations

## Running the Documentation Site

```bash
# From the docs directory
cd docs

# Install dependencies
pnpm install

# Start Astro development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Adding New Documentation

1. Create a new `.md` file in `content/docs/`
2. Add frontmatter:
   ```yaml
   ---
   title: Your Title
   description: Brief description
   ---
   ```
3. Add the file to the navigation in `src/navigation.ts`
4. Run the dev server to preview

## Generating API Reference

To regenerate the API reference from source code:

```bash
node ../scripts/generate-api-reference.js
```

This reads JSDoc comments from the source and updates `content/docs/api-reference.md`.

## Navigation

The navigation structure is defined in `src/navigation.ts`. Documentation is organized into categories:

- Getting Started
- Core Concepts
- Advanced Features
- Guides
- Examples & Recipes

## Deployment

The documentation site is built as a static site and can be deployed to any static hosting service.

## Contributing

When contributing to documentation:

1. Follow the existing structure and formatting
2. Include code examples where helpful
3. Test all code examples to ensure they work
4. Keep language clear and concise
5. Use proper frontmatter for all markdown files
