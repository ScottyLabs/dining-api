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
const express = require("express")
const { exec } = require("child_process")
const { DateTime } = require("luxon")
const cors = require("cors")

/* The port to listen on. */
var port = 5010

/* The cached information that will be sent to the next request. */
var cached = {}

/* Function that reloads the cached information. */
var reload = function (callback) {
  /* execute python program to obtain data instead of scraping from google sheet directly*/
  exec("env/bin/python3 dining_parser.py", (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return
    }
    var dataToReceive = stdout.toString()
    cached = JSON.parse(dataToReceive)
    
    // Sort time entries
    cached.locations.forEach(location => {
      location.times.sort((timeA, timeB) => {
        const startA = timeA.start;
        const startB = timeB.start;
        if (startA.day < startB.day) return -1;
        else if (startA.day > startB.day) return 1;
        else {
          if (startA.hour < startB.hour) return -1;
          else if (startA.hour > startB.hour) return -1;
          else {
            if (startA.minute < startB.minute) return -1;
            else if (startA.minute > startB.minute) return -1;
            else return 0;
          }
        }
      })
    })
    updateStatus()

    if (callback) {
      callback()
    }
    console.log("Dining API cache reloaded.")
  })
}

/* Sets and updates the `is_open` field for locations based on the
   current date and time */
const updateStatus = () => {
  let date = DateTime.local().setZone("America/New_York")
  const day = date.weekday
  const hour = date.hour
  const minute = date.minute

  for (let location of cached.locations) {
    location.is_open = false
    // Checks each time entry with matching days to account for
    // time hours that span 2 days i.e. across midnight
    for (let hours of location.times) {
      const start = hours.start
      const end = hours.end
      if (start.day <= day && day <= end.day) {
        let hasOpened = false
        let hasClosed = false

        if (start.day < day) {
          hasOpened = true
        } else if (start.hour < hour) {
          hasOpened = true
        } else if (start.minute <= minute) {
          hasOpened = true
        }

        if (end.day < day) {
          hasClosed = true
        } else if (end.hour < hour) {
          hasClosed = true
        } else if (end.minute < minute) {
          hasClosed = true
        }

        if (hasOpened && !hasClosed) {
          location.is_open = true
        }
      } else if (start.day > day) {
        break
      }
    }
  }
}

/* Initialize web server. */
var web = express()

web.use(cors())

web.get("/", function (req, res) {
  res.send("ScottyLabs Dining API Homepage")
})

/* Serves out the cached content to anyone who asks. */
web.get("/locations", function (req, res) {
  updateStatus()
  res.json(cached)
})

/* Serves out location based on the name of the location */
web.get("/location/:name", function (req, res) {
  updateStatus()
  var filteredLoc = cached.locations.filter(function (location) {
    return location.name.toLowerCase().includes(req.params.name.toLowerCase())
  })

  res.json(filteredLoc)
})

/* Serves out locations if location is open at specified time */
web.get("/location/time/:day/:hour/:min", function (req, res) {
  updateStatus()
  var returnedObj = cached.locations.filter(function (el) {
    var returning = false

    el.times.forEach(function (element) {
      var startMins =
        element.start.day * 1440 +
        element.start.hour * 60 +
        element.start.minute
      var endMins =
        element.end.day * 1440 + element.end.hour * 60 + element.end.minute
      var currentMins =
        parseInt(req.params.day) * 1440 +
        parseInt(req.params.hour) * 60 +
        parseInt(req.params.min)

      console.log(element)
      if (currentMins >= startMins && currentMins < endMins) {
        returning = true
      }
    })

    return returning
  })

  res.json(returnedObj)
})

/* Reload the cache twice a day */
var interval = 1000 * 60 * 60 * 12 // 12 hours
setInterval(reload, interval)

/* Load initial cache and start listening. */
reload(function () {
  web.listen(port, function () {
    console.log("Dining API cache loaded and listening on port " + port + ".")
  })
})
