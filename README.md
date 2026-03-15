# Bowl

Mobile-first pass-and-play word game built with Next.js.

## Development

```bash
pnpm dev
```

## Checks

```bash
pnpm lint
pnpm build
pnpm exec tsc --module commonjs --moduleResolution node --target es2020 --outDir .tmp-test tests/game-engine.test.ts
node .tmp-test/tests/game-engine.test.js
```

The temporary `.tmp-test` directory is only for running the Sprint 0.3 engine harness and can be removed afterwards.
