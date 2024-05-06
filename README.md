# Dining API

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

Then, you can run the server with ```bun start``` and it should work! You can also use 
```bun run start``` since ```bun start``` is its shorthand version.

Note: To add new dependencies, use ```bun add dependency-name```. To remove dependencies, use ```bun remove dependency-name```.
