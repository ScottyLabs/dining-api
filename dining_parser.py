from bs4 import BeautifulSoup
from typing import Tuple, Dict, Any
from datetime import datetime
import requests
import warnings
import json
import re

daysConversion = {
    "Sunday": 0,
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6
}


def createRequest(url: str) -> str:
    """Create a GET request and return the HTML as a string"""
    res = requests.get(url)
    if res.status_code == 200:
        return res.text


def retrieveLocation(url: str) -> Tuple[float, float]:
    """Retrieve the lat and lng coordinates from a Google Maps URL"""
    at_index = url.index('@')
    location_url = url[at_index + 1:]

    comma_index = location_url.index(',')
    x_coord = location_url[0: comma_index]
    location_url = location_url[comma_index + 1:]

    comma_index = location_url.index(',')
    y_coord = location_url[0: comma_index]

    x_coord = float(x_coord)
    y_coord = float(y_coord)

    return (x_coord, y_coord)


def HourConvert(hours: int, minutes: int, period: str) -> Tuple[int, int]:
    """Convert 12H clock format into 24H clock format"""
    if period == "AM":
        if hours == 12:
            hours = 0
        return (hours, minutes)
    else:
        if hours != 12:
            hours = hours + 12
        return (hours, minutes)


def timeCompare(hour1: int, min1: int, hour2: int, min2: int) -> int:
    """
    If time 1 > time 2, return 1.
    If time 1 == time 2, return 0.
    If time 1 < time 2, return -1.
    """
    if hour1 == hour2:
        if min1 > min2:
            return 1
        elif min1 == min2:
            return 0
        else:
            return -1
    elif hour1 < hour2:
        return -1
    else:
        return 1


def retrieveInfo(name: str, link: str, shortDesc: str) -> Dict[str, Any]:
    """Retrieve the location info from the URL of a location's info page"""
    conceptHTML = createRequest(link)
    conceptSoup = BeautifulSoup(conceptHTML, 'html.parser')

    # Populate location info
    locationDiv = conceptSoup.find('div', {'class': 'location'})
    locationLink = locationDiv.find('a')
    location = str(locationLink.contents[0]).strip()
    lat, lng = retrieveLocation(locationLink["href"])
    coordinates = {"lat": lat, "lng": lng}

    # Populate description info
    descriptionDiv = conceptSoup.find('div', {'class': 'description'})
    try:
        descriptionPar = descriptionDiv.find('p')
        description = str(max(descriptionPar.contents, key=len)).strip()
    except Exception as e:
        with open('error.log', 'a') as file:
            file.write("[{timestamp}] {err}\n".format(timestamp=str(
                datetime.now().strftime("%m/%d/%Y %H:%M:%S")), err=str(e)))
        description = str(max(descriptionDiv.contents, key=len)).strip()
    descRegex = re.compile(r'(\r|\n)+')
    shortDesc = descRegex.sub(' ', shortDesc)
    description = descRegex.sub(' ', description)

    # Populate menu info
    siteScripts = conceptSoup.find_all('script')
    siteScript = None
    for script in siteScripts:
        if len(script.contents) > 0 and '#getMenu' in script.contents[0]:
            siteScript = script.contents[0]
    menuRelLink = re.findall(r"'(conceptAssets\/.*)'", str(siteScript))
    menuLink = None
    if menuRelLink and len(menuRelLink) > 0:
        menuLink = 'https://apps.studentaffairs.cmu.edu/dining/conceptinfo/' +\
            menuRelLink[0]

    # Populate hours info
    times = []
    scheduleList = conceptSoup.find('ul', {'class': 'schedule'})
    timeList = scheduleList.find_all('li')
    for time in timeList:
        day = daysConversion[str(time.find('strong').contents[0]).strip()]

        timeStr = str(time.contents[2]).strip().replace("\xa0\r\n", "")
        timeregex = re.compile(r'\W+')
        timeArray = timeregex.sub(' ', timeStr).split(" ")
        splits = (len(timeArray) - 2) // 6
        for i in range(splits):
            startTime = HourConvert(
                int(timeArray[2 + 2 * i * 3]),
                int(timeArray[2 + 2 * i * 3 + 1]),
                timeArray[2 + 2 * i * 3 + 2])
            start = {
                'day': day,
                'hour': startTime[0],
                'minute': startTime[1]
            }
            endTime = HourConvert(
                int(timeArray[2 + 2 * i * 3 + 3]),
                int(timeArray[2 + 2 * i * 3 + 4]),
                timeArray[2 + 2 * i * 3 + 5])
            offsetDay = timeCompare(
                endTime[0], endTime[1], startTime[0], startTime[1])
            end = {
                'day': (day + 1) % 7 if offsetDay <= 0 else day,
                'hour': endTime[0],
                'minute': endTime[1]
            }
            times.append({'start': start, 'end': end})

        # 24 hours check
        if splits == 0 and '24' in timeArray and 'hours' in timeArray:
            start = {
                'day': day,
                'hour': 0,
                'minute': 0
            }
            end = {
                'day': day,
                'hour': 23,
                'minute': 59
            }
            times.append({'start': start, 'end': end})

    # Check if Online Ordering is Available for this location
    onlineDiv = conceptSoup.find('div', {'class': 'navItems orderOnline'})

    locationDict = {
        'name': name,
        'short_description': shortDesc,
        'description': description,
        'location': location,
        'coordinates': coordinates,
        'times': times,
        'acceptsOnlineOrders': True if onlineDiv else False
    }
    if menuLink and menuLink.endswith('.pdf'):
        locationDict['menu'] = menuLink
    return locationDict


def retrieveSpecials():
    url = "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/" + \
        "?page=specials"

    listHTML = createRequest(url)

    # Create the beautiful soup
    soup = BeautifulSoup(listHTML, 'html.parser')

    # Load the container
    containers = soup.find_all('div', {'class': 'card'})

    specials = dict()
    for container in containers:
        name = container.find_next('h3', {'class': 'name'}).contents[0].strip()
        specials_list = container.find_all('div', {'class': 'specialDetails'})

        location_specials = []
        for special in specials_list:
            header = special.find('strong').contents[0].strip()
            special_item_list = special.find('li')
            if len(special_item_list) > 2:
                desc = special_item_list.contents[-1].strip()
            current_special = {
                "title": header
            }
            if desc is not None:
                current_special["description"] = desc
            location_specials.append(current_special)
        specials[name] = location_specials

    return specials


def retrieveSoups():
    url = "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/" + \
        "?page=soups"

    listHTML = createRequest(url)

    # Create the beautiful soup
    bsoup = BeautifulSoup(listHTML, 'html.parser')

    # Load the container
    containers = bsoup.find_all('div', {'class': 'card'})

    soups = dict()
    for container in containers:
        name = container.find_next('h3', {'class': 'name'}).contents[0].strip()
        soups_list = container.find_all('div', {'class': 'specialDetails'})

        location_soups = []
        for soup in soups_list:
            header = soup.find('strong').contents[0].strip()
            soup_item_list = soup.find('li')
            if len(soup_item_list) > 2:
                desc = soup_item_list.contents[-1].strip()
            current_soup = {
                "title": header
            }
            if desc is not None and len(desc) > 0:
                current_soup["description"] = desc
            location_soups.append(current_soup)
        soups[name] = location_soups

    return soups


def main():
    warnings.filterwarnings("ignore", category=UserWarning, module='bs4')

    # f = open("result.json", "w")
    # jsonlocations = []

    baseurl = ("https://apps.studentaffairs.cmu.edu")

    url = "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/" + \
        "?page=listConcepts"
    listHTML = createRequest(url)

    # Create the beautiful soup
    soup = BeautifulSoup(listHTML, 'html.parser')

    # Load the container
    container = soup.find('div', {'class': 'conceptCards'})

    today_specials = retrieveSpecials()
    today_soups = retrieveSoups()

    if container:
        # Retrieve all locations
        conceptLinks = []
        concept = container.find_next('h3', {'class': 'name detailsLink'})
        while concept is not None:
            name = str(concept.contents[0]).strip()
            link = str(concept["onclick"]).strip().replace(
                "location.href=", "")
            link = baseurl + link[1:-1]
            shortDescDiv = concept.find_next('div', {'class': 'description'})
            shortDesc = str(shortDescDiv.contents[0]).strip()
            conceptLinks.append((name, link, shortDesc))
            concept = concept.find_next('h3', {'class': 'name detailsLink'})

        # Retrieve info for each location
        locations = []
        for concept in conceptLinks:
            name, link, shortDesc = concept
            location_specials = None
            if name in today_specials:
                location_specials = today_specials[name]
            location_soups = None
            if name in today_soups:
                location_soups = today_soups[name]
            location = retrieveInfo(name, link, shortDesc)
            if location_specials is not None:
                location["todaysSpecials"] = location_specials
            if location_soups is not None:
                location["todaysSoups"] = location_soups
            locations.append(location)

    # Convert to JSON format
    jsondata = {
        "locations": locations
    }
    jsonfinal = json.dumps(jsondata, ensure_ascii=False).encode(
        'utf-8').decode('utf-8')
    print(jsonfinal)

    result = open('result.json', 'w')
    result.write(jsonfinal)
    result.close()


if __name__ == "__main__":
    main()
