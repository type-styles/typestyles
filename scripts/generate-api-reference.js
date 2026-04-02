#!/usr/bin/env node

/**
 * API Reference Generator
 *
 * This script generates API documentation from JSDoc comments in the source code.
 * Run with: node scripts/generate-api-reference.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs', 'content', 'docs');

// Read source files
const srcDir = path.join(rootDir, 'packages', 'typestyles', 'src');

function extractJSDoc(content) {
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
  const matches = [];
  let match;

  while ((match = jsdocRegex.exec(content)) !== null) {
    const jsdoc = match[1];

    // Extract description
    const descriptionMatch = jsdoc.match(/\*\s+([\s\S]*?)(?=\n\s*\*\s*@|\*\/)/);
    const description = descriptionMatch
      ? descriptionMatch[1].replace(/^\s*\*\s?/gm, '').trim()
      : '';

    // Extract @param tags
    const paramMatches = jsdoc.matchAll(/\*\s+@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/g);
    const params = [];
    for (const param of paramMatches) {
      params.push({
        type: param[1],
        name: param[2],
        description: param[3] || '',
      });
    }

    // Extract @returns
    const returnsMatch = jsdoc.match(/\*\s+@returns?\s+\{([^}]+)\}\s*(.*)/);
    const returns = returnsMatch
      ? {
          type: returnsMatch[1],
          description: returnsMatch[2] || '',
        }
      : null;

    // Extract @example
    const exampleMatch = jsdoc.match(/\*\s+@example\s+([\s\S]*?)(?=\n\s*\*(?!\s*\*)|\*\/)/);
    const example = exampleMatch ? exampleMatch[1].replace(/^\s*\*\s?/gm, '').trim() : '';

    if (description) {
      matches.push({
        description,
        params,
        returns,
        example,
        raw: jsdoc,
      });
    }
  }

  return matches;
}

function extractExports(content) {
  const exports = [];

  // Match export const/function
  const exportRegex = /export\s+(?:const|function|type)\s+(\w+)/g;
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  return exports;
}

function generateAPIReference() {
  const indexPath = path.join(srcDir, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    console.error('Source index.ts not found at:', indexPath);
    process.exit(1);
  }

  const content = fs.readFileSync(indexPath, 'utf-8');
  const jsdocs = extractJSDoc(content);
  const exports = extractExports(content);

  let apiDoc = `---
title: API Reference
description: Complete API reference for typestyles
---

# API Reference

Auto-generated documentation for all typestyles APIs.

`;

  // Document main exports
  apiDoc += `## Core Exports\n\n`;

  // Document styles
  const stylesDoc = jsdocs.find((j) => j.description.includes('Style creation'));
  if (stylesDoc) {
    apiDoc += `### \`styles\`\n\n${stylesDoc.description}\n\n`;
    apiDoc += `**Methods:**\n\n`;
    apiDoc += `- \`styles.component(namespace, config)\`: Create multi-variant component styles (CVA-style)\n`;
    apiDoc += `- \`styles.class(name, properties)\`: Create a single class\n`;
    apiDoc += `- \`styles.hashClass(properties, label?)\`: Create a deterministic hashed class\n`;
    apiDoc += `- \`styles.compose(...fns)\`: Compose multiple style functions\n`;
    apiDoc += `- \`styles.withUtils(utils)\`: Create utility-aware styles API\n\n`;
    apiDoc += `\n`;
  }

  // Document tokens
  const tokensDoc = jsdocs.find((j) => j.description.includes('Design token'));
  if (tokensDoc) {
    apiDoc += `### \`tokens\`\n\n${tokensDoc.description}\n\n`;
    apiDoc += `**Methods:**\n\n`;
    apiDoc += `- \`tokens.create(namespace, values)\`: Creates CSS custom properties\n`;
    apiDoc += `- \`tokens.use(namespace)\`: References existing tokens\n`;
    apiDoc += `- \`tokens.createTheme(name, overrides)\`: Creates theme class\n`;
    apiDoc += `\n`;
  }

  // Document keyframes
  const keyframesDoc = jsdocs.find((j) => j.description.includes('Keyframe'));
  if (keyframesDoc) {
    apiDoc += `### \`keyframes\`\n\n${keyframesDoc.description}\n\n`;
    apiDoc += `**Methods:**\n\n`;
    apiDoc += `- \`keyframes.create(name, stops)\`: Creates @keyframes animation\n`;
    apiDoc += `\n`;
  }

  // Document color
  const colorDoc = jsdocs.find((j) => j.description.includes('Color'));
  if (colorDoc) {
    apiDoc += `### \`color\`\n\n${colorDoc.description}\n\n`;
    apiDoc += `**Functions:**\n\n`;
    apiDoc += `- \`color.rgb(r, g, b, alpha?)\`: RGB color\n`;
    apiDoc += `- \`color.hsl(h, s, l, alpha?)\`: HSL color\n`;
    apiDoc += `- \`color.oklch(l, c, h, alpha?)\`: OKLCH color\n`;
    apiDoc += `- \`color.oklab(l, a, b, alpha?)\`: OKLAB color\n`;
    apiDoc += `- \`color.lab(l, a, b, alpha?)\`: LAB color\n`;
    apiDoc += `- \`color.lch(l, c, h, alpha?)\`: LCH color\n`;
    apiDoc += `- \`color.hwb(h, w, b, alpha?)\`: HWB color\n`;
    apiDoc += `- \`color.mix(c1, c2, p?, space?)\`: Mix two colors\n`;
    apiDoc += `- \`color.lightDark(light, dark)\`: Light/dark mode color\n`;
    apiDoc += `- \`color.alpha(color, opacity, space?)\`: Adjust opacity\n`;
    apiDoc += `\n`;
  }

  // Add example usage
  apiDoc += `## Usage Examples\n\n`;
  apiDoc += `### Creating Styles\n\n\`\`\`ts\n`;
  apiDoc += `import { styles } from 'typestyles';\n\n`;
  apiDoc += `const button = styles.component('button', {\n`;
  apiDoc += `  base: { padding: '8px 16px' },\n`;
  apiDoc += `  variants: {\n`;
  apiDoc += `    intent: { primary: { backgroundColor: '#0066ff' } },\n`;
  apiDoc += `  },\n`;
  apiDoc += `  defaultVariants: { intent: 'primary' },\n`;
  apiDoc += `});\n\n`;
  apiDoc += `button(); // "button-base button-intent-primary"\n`;
  apiDoc += `button({ intent: 'primary' }); // same\n`;
  apiDoc += `const { base } = button; // destructure class strings\n`;
  apiDoc += `\`\`\`\n\n`;

  apiDoc += `### Creating Tokens\n\n\`\`\`ts\n`;
  apiDoc += `import { tokens } from 'typestyles';\n\n`;
  apiDoc += `const color = tokens.create('color', {\n`;
  apiDoc += `  primary: '#0066ff',\n`;
  apiDoc += `  secondary: '#6b7280',\n`;
  apiDoc += `});\n\n`;
  apiDoc += `color.primary; // "var(--color-primary)"\n`;
  apiDoc += `\`\`\`\n\n`;

  apiDoc += `### Creating Animations\n\n\`\`\`ts\n`;
  apiDoc += `import { keyframes } from 'typestyles';\n\n`;
  apiDoc += `const fadeIn = keyframes.create('fadeIn', {\n`;
  apiDoc += `  from: { opacity: 0 },\n`;
  apiDoc += `  to: { opacity: 1 },\n`;
  apiDoc += `});\n\n`;
  apiDoc += `// Use in styles\n`;
  apiDoc += `animation: \`\${fadeIn} 300ms ease\`\n`;
  apiDoc += `\`\`\`\n\n`;

  // Add note about auto-generation
  apiDoc += `---\n\n`;
  apiDoc += `*This API reference was auto-generated from source code.*\n`;
  apiDoc += `*Last updated: ${new Date().toISOString().split('T')[0]}*\n`;

  return apiDoc;
}

// Generate and write API reference
const apiReference = generateAPIReference();
const outputPath = path.join(docsDir, 'api-reference.md');

fs.writeFileSync(outputPath, apiReference);
console.log(`✅ API reference generated: ${outputPath}`);

// Also update the main navigation structure
const docStructure = `# Documentation Structure

## Getting Started
- getting-started.md
- api-reference.md

## Core Concepts  
- styles.md
- components.md
- compose.md
- atomic-css.md
- tokens.md
- keyframes.md
- color.md

## Advanced Features
- ssr.md
- vite-plugin.md
- class-naming.md
- custom-at-rules.md
- theming-patterns.md

## Guides
- migration.md
- best-practices.md
- testing.md
- performance.md
- typescript-tips.md
- troubleshooting.md

## Examples
- react-integration.md
- component-library.md
- design-system.md
- animation-patterns.md
`;

fs.writeFileSync(path.join(rootDir, 'docs', 'DOC_STRUCTURE.md'), docStructure);
console.log('✅ Documentation structure updated');
