/* @file server.js
 * @brief Stale-caching-proxy server to proxy between us and Google, where the
 * dataset is hosted.
 *
 * See README for more information.
 *
 * @author Oscar Bezi (bezi@scottylabs.org)
 * @editor Gram Liu (gdl2), Trevor Leong (tmleong)
 * @since 1 October 2020
 */

/* Required modules. */
var express = require("express");

const { exec } = require("child_process");

/* The port to listen on. */
var port = 5010;

/* The cached information that will be sent to the next request. */
var cached = {};

/* Function that reloads the cached information. */
var reload = function (callback) {
  /* execute python program to obtain data instead of scraping from google sheet directly*/
  exec("env/bin/python3 dining_parser.py", (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
    var dataToReceive = stdout.toString();
    cached = JSON.parse(dataToReceive);

    /* Manually Adding Keywords to Each Dining Location */
    cached.locations.map(function (location) {
      if (Object.keys(keywords).indexOf(location.name) > -1) {
        location.keywords = keywords[location.name];
      }
    });
    if (callback) {
      callback();
    }
    console.log("Dining API cache reloaded.");
  });
};

/* Initialize web server. */
var web = express();

web.get("/", function (req, res) {
  res.send("ScottyLabs Dining API Homepage");
});

/* Serves out the cached content to anyone who asks. */
web.get("/locations", function (req, res) {
  res.json(cached);
});

/* Serves out location based on the name of the location */
web.get("/location/:name", function (req, res) {
  var filteredLoc = cached.locations.filter(function (location) {
    return location.name.includes(req.params.name);
  });

  res.json(filteredLoc);
});

/* Serves out locations if location is open at specified time */
web.get("/location/time/:day/:hour/:min", function (req, res) {
  var returnedObj = cached.locations.filter(function (el) {
    var returning = false;

    el.times.forEach(function (element) {
      var startMins =
        element.start.day * 1440 + element.start.hour * 60 + element.start.min;
      var endMins =
        element.end.day * 1440 + element.end.hour * 60 + element.end.min;
      var currentMins =
        parseInt(req.params.day) * 1440 +
        parseInt(req.params.hour) * 60 +
        parseInt(req.params.min);

      if (currentMins >= startMins && currentMins < endMins) {
        returning = true;
      }
    });

    return returning;
  });

  res.json(returnedObj);
});

/* Reload the cache once a day */
var interval = 1000 * 60 * 60 * 24; // 24 hours
setInterval(reload, interval);

/* Load initial cache and start listening. */
reload(function () {
  web.listen(port, function () {
    console.log("Dining API cache loaded and listening on port " + port + ".");
  });
});
