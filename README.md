# Dining API

This Dining API scrapes location data from the CMU dining sites and distributes it as a RESTful API. Access the API [here](https://apis.scottylabs.org/dining/).

To build and deploy the service, you'll need pnpm, which you should install beforehand.

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

Then, you can run the server with `pnpm dev` and it should work!

Note: To add new dependencies, use `pnpm install dependency-name`. To remove dependencies, use `pnpm remove dependency-name`.

## Testing the Dockerfile

Build: `docker build -f Dockerfile . -t dining`
Run the server: `docker run -p 127.0.0.1:5010:5010 dining`
Run bash inside it (for debugging): `docker run --rm -it --entrypoint bash -p 127.0.0.1:5010:5010 dining`

## Under the hood

We get the entire list of locations from `DINING_URL`, fetch location specifics under their corresponding `CONCEPT_BASE_LINK`, and retrieve soups and specials from `DINING_SOUPS_URL` and `DINING_SPECIALS_URL`, respectively. See the `process()` method in `diningParser.ts` for more details.

## Before submitting a PR

- Make sure all tests pass with `pnpm run test` or `pnpm run test --watch` for watch mode.
