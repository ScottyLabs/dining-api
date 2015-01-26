# Dining API

The Scottylabs Dining API provides information about CMU dining locations and hours.

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
