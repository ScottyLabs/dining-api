# Dining API

> [!IMPORTANT]  
> Make sure `bun` is on the latest version! (Earlier versions are rather buggy) Run `bun upgrade` to update.

This Dining API scrapes location data from the CMU dining sites and distributes it as a RESTful API. Access the API [here](https://apis.scottylabs.org/dining/).

To build and deploy the service, you'll need [Bun](https://bun.sh),
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
bun install
```

To start a local instance of the database used by the dining api, run `docker-compose up --build -d postgres`

Then, you can run the server with `bun dev` (or `bun run dev`) and it should work!

Note: To add new dependencies, use `bun add dependency-name`. To remove dependencies, use `bun remove dependency-name`. Run `bun outdated` to see what dependencies are outdated and `bun update` to update all outdated dependencies to the latest version.

## Testing the production build of the backend

Build and run db + api: `docker-compose up --build`
Run bash inside it (for debugging): `docker run --rm -it --entrypoint bash  dining-api-server`
Close dockerfile + delete volumes: `docker-compose down --volumes`

## Under the hood

We get the entire list of locations from `DINING_URL`, fetch location specifics under their corresponding `CONCEPT_BASE_LINK`, and retrieve soups and specials from `DINING_SOUPS_URL` and `DINING_SPECIALS_URL`, respectively. See the `process()` method in `diningParser.ts` for more details.

## Before submitting a PR

- Make sure all tests pass with `bun run test` or `bun run test --watch` for watch mode. (NOTE! `bun test` does something different and does NOT work!)
