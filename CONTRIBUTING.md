# Contributing to TypeStyles

Thanks for helping improve TypeStyles.

## How to contribute

- Start with a small, focused change when possible.
- For docs and examples, update the relevant markdown or example package directly.
- For code changes, read `ARCHITECTURE.md` first to understand the repository structure.
- If you are unsure where a change belongs, open an issue before sending a large pull request.

## Local setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Use the repo scripts from the root `package.json` during development:
   - `pnpm test`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm format:check`

## Running tests and linters

Run the relevant checks before opening a pull request:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm format:check
```

If you change only one package, it is still a good idea to run the matching package command plus the root checks above.

## Commit message conventions

Use short, imperative commit messages.

Examples:

- `Add contributor guide`
- `Fix docs link`
- `Update build script`

## PR process

- Create a feature branch with a descriptive name, such as `docs/contributing-guide` or `fix/package-scripts`.
- Keep pull requests focused and easy to review.
- Make sure CI passes before requesting review.
- Address review comments promptly and re-run checks after making changes.

## Issue reporting

Open an issue when you find a bug, documentation gap, or missing feature.

Please include:

- A clear description of the problem
- Steps to reproduce, if applicable
- Expected versus actual behavior
- Any relevant logs, screenshots, or code samples

## Code of Conduct

Please be respectful and constructive in all interactions.

If a dedicated code of conduct file is added later, follow that document as the source of truth.

## PR template

Use this template in your pull request description:

```md
## Summary

What does this change do?

## Checklist

- [ ] I ran the relevant tests
- [ ] I ran the relevant linters/formatters
- [ ] I updated docs or examples if needed
- [ ] CI is green or I know why it is not

## Notes

Anything a reviewer should know?
```
