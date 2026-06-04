# Use Yarn

Always use **Yarn** as the package manager. Do not use npm.

## Rules

- Use `pnpm add` instead of `npm install`
- Use `pnpm remove` instead of `npm uninstall`
- Use `pnpm dev`, `pnpm build`, `pnpm start` instead of `npm run dev`, `npm run build`, `npm run start`
- Never generate `package-lock.json` — only `yarn.lock` is used
