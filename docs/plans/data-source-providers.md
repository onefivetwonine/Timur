# External data providers (engineering companion)

Canonical product tracker (strategy, how we achieve it, status):  
**[Data sources](../architecture/data-sources.md)**

This page stays a short engineering pointer so plans and package READMEs do not drift.

## Pull

```sh
cp config/environments/providers.env.example .local/providers.env
# fill keys you have — never commit .local/
npm run providers:pull
```

Snapshots write only under `.local/provider-snapshots/`. Adapter table and checklist live on the architecture tracker page.
