# Dining API

This is the source code (sort of) for the ScottyLabs Dining API.  The reason
this is 'sort-of' the source code is because our backing data source is actually
Google App Script, allowing us to maintain the schedule in a nice spreadsheet
that we update, which is then parsed and served out by a Google App Script
service.  At some point, we may choose to also open-source this code, but it's a
real pain to get into source control.

The reason we have a server on a different machine is because we need to be able
to cache the requests.  Yes, you can directly call the URL in the repo (and
that's fine), but it'll be pretty slow (latency is ~5s as of the creation of the
service).  To fix that, we've put a stale-caching proxy server in between the
requests.  This means that we'll update our own cache asyncronously every 5
minutes or so, and you'll get speedy quick response times to your Dining API
requests!

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

Then, you can run the server with `node server.js` and it should work!  However,
if you're in ScottyLabs make sure to talk to whomever is running Operations to
tell you the way to properly background this server so it matches everything
else.
