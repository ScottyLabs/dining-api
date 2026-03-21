import axios from "axios";
import {infer, z} from "zod";
import { DateTime } from "luxon";


enum PeriodName {
    Breakfast,
    Lunch,
    Dinner,
    Brunch,
    Everyday,
}

const LocationPeriod = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
})

const LocationPeriods = z.object({
    locationId: z.string(),
    date: z.string().transform(x => new Date(x)),
    periods: z.array(LocationPeriod)
})

async function getLocationPeriods(locationId: string, date: DateTime) {
    let periods = await axios.get(`https://apiv4.dineoncampus.com/locations/${locationId}/periods/`, {
        params: {
            "date": date.toFormat("yyyy-MM-dd"),
        },
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0",
            "Accept": "application/json, text/plain, */*",
        },
    })

    return LocationPeriods.parse(periods.data)
}

let id = "68090ce5c625af06506c71de"
let x = await getLocationPeriods(id, DateTime.now())

// console.log(x)

async function getMenu(locationId: string, date: DateTime, periodId: string) {
    let lol = await axios.get(`https://apiv4.dineoncampus.com/locations/${locationId}/menu`,
      {
        params: {
            "date": date.toFormat("yyyy-MM-dd"),
            "period": periodId,
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0",
          "Accept": "application/json, text/plain, */*",
        }
      })

  return lol.data
}
let y = await getMenu(id, DateTime.now(), x.periods[0].id)
console.log(JSON.stringify(y))
