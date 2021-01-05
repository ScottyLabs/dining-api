# Dining API

This Dining API scrapes location data from the CMU dining sites and distributes
it as a RESTful API. Access the API here: https://apis.scottylabs.org/dining/

To build and deploy the service, you'll need Node.js, and Python3
which you should install however it is your operating system chooses to do so.
Then, clone this repository to the target machine, then install dependencies 
by `cd`-ing into the root of the repository and running:

```
npm install
```

After installing the npm dependencies, setup your Python virtual environment
by running:

```
python3 -m venv env
env/bin/pip3 install -r requirements.txt
```

The above commands may vary per operating system but essentially, you need
to initialize a virtual environment named `env` and install the Python libraries
`bs4` and `requests` in that virtual environment.

Make sure to update the port number in `server.js` to match what is required by
your server infrastructure (for ScottyLabs, contact whomever is running
Operations to find where that's currently documented).

Then, you can run the server with `npm start` and it should work! However,
if you're in ScottyLabs make sure to talk to whomever is running Operations to
tell you the way to properly background this server so it matches everything
else.
