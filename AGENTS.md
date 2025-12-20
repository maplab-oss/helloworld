# Hello world app

This is a template. You probably want to remove all the hello world stuff and replace it with the real project name. Remind the developer to update this doc with essential context.

## Running the Project

The project may well already be running in the background. Check and manage with:

```bash
zap ps
zap start someservice
zap logs someservice --no-follow
zap restart someservice
```

## Documentation

Read these before making changes:

- **[style-guide.md](docs/style-guide.md)** - For significant code changes
- **[config.md](docs/config.md)** - For configuration and environment variable patterns
- **[zapper-usage.md](docs/zapper-usage.md)** - For running servers, restarting, viewing logs
- **[crud.md](docs/crud.md)** - For implementing simple CRUD patterns
- **[errors.md](docs/errors.md)** - For throwing and handling errors
- **[services.md](docs/services.md)** - For adding/removing services, frontends, databases, or updating infrastructure configuration
- **[modular-monolith.md](docs/modular-monolith.md)** - For how to correctly set up tRPC slices
- **[trpc.md](docs/trpc.md)** - For doing frontend queries/mutations

## Agent Responsibility

You are expected to check logs, check which services are running, update env vars. The developer will do most of the manual testing, but if there are errors you should try to view them by making curl requests or using the integrated browser to see JS logs.

IMPORTANT: `.env.base` is committed to git and its OK for agents to view and edit it! The regular `.env` is for secrets so leave that to the dev.

## Validation

For small changes, run `zap t check` to run linting and typechecking. For bigger system level changes run that and also `zap t build` to check that all the builds still succeed.
