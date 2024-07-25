# openfeature-flagsmith-boolean-issues

Node 20 or higher is expected.

Please create a `.env` file at the root based off `.env.example` with a valid Flagsmith SDK Key.

Please also create a feature flag in the same environment where the key was obtained:

- Key: `enabled-flag-with-falsey-value`;
- Enabled: `true`;
- Value: `false`;

To run the project in it's buggy state run:

```sh
npm run buggy
```

To run the project in it's fixed (using local fix) state run:

```sh
npm run fixed
```

For more info please refer to this GitHub issue and this pull request.
