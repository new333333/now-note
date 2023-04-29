
## Install dependencies

Before doing anything install dependencies.

```bash
npm install
```

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

## Testing

Build, start jest tests, start playwright tests

```bash
rmdir /s release\app\dist
npm run build
npm test
npx playwright test
```

