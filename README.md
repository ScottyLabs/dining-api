# Dining API

## October 1, 2020
Updated Dining API to automatically scrape from the CMU dining site.

To build and deploy the service, you'll need Node.js, which you should install
however it is your operating system chooses to do so.  Then, clone this
repository to the target machine, then install dependencies by `cd`-ing into the
root of the repository and running:

```
npm install
```

Make sure to update the port number in `server.js` to match what is required by
your server infrastructure (for ScottyLabs, contact whomever is running
Operations to find where that's currently documented).

Then, you can run the server with `npm start` and it should work!  However,
if you're in ScottyLabs make sure to talk to whomever is running Operations to
tell you the way to properly background this server so it matches everything
else.
