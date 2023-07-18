# Dining API

This Dining API scrapes location data from the CMU dining sites and distributes
it as a RESTful API. Access the API [here](https://apis.scottylabs.org/dining/).

To build and deploy the service, you'll need [Node.js](https://nodejs.org/en),
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

Now install the API's dependencies by 'cd'-ing into the root of the repository and running:
```
npm install
```

Now, run ```npm run build``` to compile the TypeScript code into JavaScript code, which
is now located in the 'dist' folder. 

Then, you can run the server with ```npm start``` and it should work! You can also use 
```npm run start``` since ```npm start``` is its shorthand version. However,
if you're in ScottyLabs, make sure to talk to whomever is running Operations to
tell you the way to properly background this server so it matches everything
else.
