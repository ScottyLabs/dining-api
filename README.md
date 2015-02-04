# Dining API

The Scottylabs Dining API provides information about CMU dining locations and hours.

## Endpoints

### HTTP GET /eateries/

#### Parameters

Parameter | Type | Required | Description
----------|------|----------|------------
time      | int  | No       | Time (represented as a Unix timestamp) to report open/close information in respect to. If not specified, current server time will be used.

#### Sample Request

``HTTP GET /eateries?time=1423080622``

#### Output

Produces a list of all eateries recorded in the API, with descriptive information and current open/close status.

```
{
  "Asiana": {
    "description": "Asiana offers Chinese and Pacific Rim entrées, soups and snacks...",
    "location": "Newell-Simon Hall Atrium",
    "longitude": -79.945681,
    "latitude": 40.443519,
    "isOpen": true,
    "closeTime": 1423098000
  },
  "Breakfast Express": {
    "description": "Breakfast sandwiches, create-your-own waffles and oatmeal, coffee, and fresh fruit...",
    "location": "Resnik Servery",
    "longitude": -79.939793,
    "latitude": 40.442523,
    "isOpen": false,
    "openTime": 1423100000
  },
  ...
}
```

Element                | Type    | Description
-----------------------|---------|------------
\<eatery\>             | key     | Name of the eatery that the associated object describes.
\<eatery\>.description | string  | Long form description provided by the eatery.
\<eatery\>.location  | string  | Human readable location string.
\<eatery\>.longitude | float   | Longitude for location of eatery.
\<eatery\>.latitude  | float   | Latitude for location of eatery.
\<eatery\>.isOpen    | boolean | True if the eatery is open at the time requested, false otherwise.
\<eatery\>.openTime  | int     | Unix timestamp for the eatery's next closing time. Only present if `"\<eatery\>".isOpen` is true.
\<eatery\>.closeTime | int     | Unix timestamp for the eatery's next opening time. Only present if `"\<eatery\>".isOpen` is false.

### GET /eatery/\<eatery\>/

#### Parameters

#### Sample Request

#### Output

#### Sample Output

## Adding Calendars

### Building the JSON calendar

Calendar data to be added should be encoded in a JSON file format. See the `calendars/` directory for examples of what these schedules should look like. New calendars should be stored in the `calendars/` folder as well for archival purposes.

In general, data should be stored in this format:

```
{
  "startDate": "2015-01-12"
  "endDate": "2015-05-08"
  "calendar": {
    "Asiana": [
      {
        "start": {
          "day": 1,
          "time": "10:30"
        },
        "end": {
          "day": 1,
          "time": "19:30"
        }
      },
      ...
    ],
    ...
  }
}
```

Field     | Type       | Description
----------|------------|------------
startDate | string     | Inclusive beginning date for this calendar in ISO YYYY-MM-DD format. Ensure that dates do not overlap with any other calendar. Set to `null` if setting the default calendar. 
endDate   | string     | Inclusive ending date for this calendar in ISO YYYY-MM-DD format. Ensure that dates do not overlap with any other calendar. Set to `null` if setting the default calendar. 
calendar  | object     | Object containing information about each eatery, where attributes are keyed by eatery names.
"name"    | object     | Name this field after the eatery. Set to an array of period objects, each of which specifies a starting and ending time for one week's worth of sessions. These periods should not overlap and should be in order.
start     | object     | Specifies starting time for this period.
end       | object     | Specifies ending time for this period.
day       | int        | Weekday associated with this time, in ISO format (where 1 is Monday, 2 is Tuesday, etc).
time      | string     | Time in 24 hour "HH:MM" format.
