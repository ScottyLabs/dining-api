# Dining API

This Dining API scrapes location data from the CMU dining sites and distributes it as a RESTful API. Access the API [here](https://dining.apis.scottylabs.org/).

To build and deploy the service, you'll need [pnpm](https://pnpm.io/),
which you should install beforehand.

Then, clone this repository to your computer by running

```
git clone https://github.com/ScottyLabs/dining-api.git
```

after making sure you have [git](https://git-scm.com/downloads) downloaded or running

```
gh repo clone ScottyLabs/dining-api
```

if you have the [Github CLI](https://cli.github.com/).

If you already have the node_modules folder or package-lock.json from previous versions of the Dining API, please remove them before continuing.

Now install the API's dependencies by 'cd'-ing into the root of the repository and running:

```
pnpm install
```

Start your local database with `pnpm db:start` and then start the server with `pnpm dev` and it should work, assuming you have the correct env variables. (To see the contents of the database, I recommend using DBeaver. You can also run `pnpm db:studio` to start up drizzle studio)

## Database schema changes (important!)

When you make changes to the database schema, be sure to run `pnpm db:push` to keep your local db in sync.

Before merging your PR, be sure to run `pnpm db:generate` to generate a migration file, which will then be automatically applied to the staging and production databases when deployed. (You should do this before running tests as well!)

To test if the migration files work, you can run `pnpm run-prod`, which will spin up a production version of the server and a postgres database mounted on a new volume. The server is created using the same Dockerfile used in our Railway deployments, so if it works locally, it (probably) works in production as well.

## Extra docker commands

Run bash inside it (for debugging): `docker run --rm -it --entrypoint bash  dining-api-server`
Close dockerfile + delete volumes: `docker-compose down --volumes`

## Under the hood

We get the entire list of locations from `DINING_URL`, fetch location specifics under their corresponding `CONCEPT_BASE_LINK`, and retrieve soups and specials from `DINING_SOUPS_URL` and `DINING_SPECIALS_URL`, respectively. See the `process()` method in `diningParser.ts` for more details.

## Before submitting a PR

- Make sure all tests pass with `pnpm test` or `pnpm test --watch` for watch mode.

## Random notes

the "cheerio" package is pinned at version "1.0.0-rc.12" because newer versions seem to be incompatible with jest.
