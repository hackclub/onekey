<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets.hackclub.com/flag-standalone-wtransparent.svg" />
    <img src="https://assets.hackclub.com/flag-standalone-bw.svg" width="100" alt="Hack Club flag" />
  </picture>
  <h1>onekey</h1>
  <p>the platform for onekey, a hack club YSWS, written in sveltekit 5 + drizzle.</p>
</div>

## features

- login and authentication with HCA
- connection to hackatime
- submit projects
- explore others' projects
- purchase accessories and other goodies from a shop
- customize your macropad - coming soon!

## stack

- [sveltekit 5](https://kit.svelte.dev/) for frontend, routing, and SSR
- [drizzle ORM](https://orm.drizzle.team/) + postgreSQL for the database
- encrypted session tokens stored server-side

## running locally

you need bun, docker, and a `.env` file with your credentials.

```sh
bun install
bun run db:start     # spins up postgres via docker compose
bun run db:push      # applies the schema
bun run dev          # starts the dev server
```

to inspect the database:

```sh
bun run db:studio
```

## deployment

this app builds to a plain node server.

```sh
bun run build
node build
```

set all env vars from `.env.example` in your `.env` file before running. key ones for prod:

- `DATABASE_URL` - your postgres connection string
- `HCA_CLIENT_ID` / `HCA_CLIENT_SECRET` / `HCA_REDIRECT_URI` - hack club oauth app
- `HACKATIME_CLIENT_ID` / `HACKATIME_CLIENT_SECRET` - hackatime oauth app
- `TOKEN_ENCRYPTION_KEY` - generate with `openssl rand -hex 32`
- `ADMIN_IDS` / `REVIEWER_IDS` - space-separated HCA user IDs

run schema migrations against the prod database before starting:

```sh
bun run db:push
```

the server listens on port `3000` by default. set `PORT` to override.

## contributing

pull requests are welcome! poke me (@maxstellar) in #onekey or dm me on slack if you have questions!
