/* @file server.js
 * @brief Stale-caching-proxy server to proxy between us and Google, where the
 * dataset is hosted.
 *
 * See README for more information.
 *
 * @author Oscar Bezi (bezi@scottylabs.org)
 */

/* Required modules. */
var request = require('request');
var express = require('express');
var keywords = require('./keywords');
var cors = require("cors");

/* The URL of our target data store. */
var url = 'https://script.google.com/macros/s/AKfycbzPAqsRyX5FMXA5BYuYycwSPE4rHX3yfY1z7cdUaNp9b3XJ_ouXrkUl2ysgvwwsep3q/exec';

/* The port to listen on. */
var port = 5010;

/* The cached information that will be sent to the next request. */
var cached = {}

/* Function that reloads the cached information. */
var reload = function(callback) {
  request(url, function (err, response, body) {
    if (!err && response.statusCode == 200) {
      cached = JSON.parse(body);

      /* Manually Adding Keywords to Each Dining Location */ 
      cached.locations.map( function (location) {
        if (Object.keys(keywords).indexOf(location.name) > -1) {
          location.keywords = keywords[location.name]
        }
      })
      
      console.log("Dining API cache reloaded.");
      if (callback) {
        callback();
      }
    }
  });
}

/* Initialize web server. */
var web = express();
web.use(cors());
web.get('/', function (req, res) {
  res.send("ScottyLabs Dining API Homepage");
});

/* Serves out the cached content to anyone who asks. */
web.get('/locations', function (req, res) {
  res.json(cached);
})

/* Serves out location based on the name of the location */
web.get('/location/:name', function (req, res) {
  var filteredLoc = cached.locations.filter(function (location) {
    return location.name.includes(req.params.name)
  })

  res.json(filteredLoc)
})

/* Serves out locations if location is open at specified time */
web.get('/location/time/:day/:hour/:min', function (req, res) {
  var returnedObj = cached.locations.filter(function (el) {
    var returning = false;

    el.times.forEach(function(element) {
      var startMins = element.start.day * 1440 + element.start.hour * 60 + element.start.min;
      var endMins = element.end.day * 1440 + element.end.hour * 60 + element.end.min;
      var currentMins = parseInt(req.params.day) * 1440 + parseInt(req.params.hour) * 60 + parseInt(req.params.min);

      if(currentMins >= startMins && currentMins < endMins) {
        returning = true;
      }
    })

    return returning;
  })
  
  res.json(returnedObj)
})

/* Servers out locations if keyword matches location */
web.get('/location/keyword/:keyword', function (req, res) {
  var returnedObj = cached.locations.filter(function (location) {
    if (location.keywords.indexOf(req.params.keyword) > -1) {
      return true
    }
    return false
  })

  res.json(returnedObj)
})

/* Reload the cache once every five minutes. */
var interval = 1000 * 60 * 5; // 5 minutes in milliseconds.
setInterval(reload, interval);

/* Load initial cache and start listening. */
reload(function () {
  web.listen(port, function () {
    console.log("Dining API cache loaded and listening on port " + port + ".");
  });
});
