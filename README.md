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

Then, you can run the server with `bun dev` and it should work! You can also use
`bun run dev` since `bun dev` is its shorthand version.

Note: To add new dependencies, use `bun add dependency-name`. To remove dependencies, use `bun remove dependency-name`. Run `bun outdated` to see what dependencies are outdated and `bun update` to update all outdated dependencies to the latest version.

## Testing the Dockerfile

Build: `docker build -f Dockerfile . -t dining`
Run the server: `docker run -p 127.0.0.1:5010:5010 dining`
Run bash inside it (for debugging): `docker run --rm -it --entrypoint bash -p 127.0.0.1:5010:5010 dining`

## Under the hood

We get the entire list of locations from `DINING_URL`, fetch location specifics under their corresponding `CONCEPT_BASE_LINK`, and retrieve soups and specials from `DINING_SOUPS_URL` and `DINING_SPECIALS_URL`, respectively. See the `process()` method in `diningParser.ts` for more details.

## Before submitting a PR

- Make sure all tests pass with `bun run test` or `bun run test --watch` for watch mode. (NOTE! `bun test` does something different and does NOT work!)
