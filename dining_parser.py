from bs4 import BeautifulSoup
from typing import Tuple, Dict, Any
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
    location_url = url[at_index+1:]

    comma_index = location_url.index(',')
    x_coord = location_url[0: comma_index]
    location_url = location_url[comma_index+1:]

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
    except:
        description = str(max(descriptionDiv.contents, key=len)).strip()
    descRegex = re.compile(r'(\r|\n)+')
    shortDesc = descRegex.sub(' ', shortDesc)
    description = descRegex.sub(' ', description)

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
            end = {
                'day': day,
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
    
    return {
        'name': name,
        'short_description': shortDesc,
        'description': description,
        'location': location,
        'coordinates': coordinates,
        'times': times
    }

import sys
def main():
    warnings.filterwarnings("ignore", category=UserWarning, module='bs4')

    f = open("result.json", "w")
    jsonlocations = []

    baseurl = ("https://apps.studentaffairs.cmu.edu")

    url = ("https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=listConcepts")
    listHTML = createRequest(url)

    # Create the beautiful soup
    soup = BeautifulSoup(listHTML, 'html.parser')

    # Load the container
    container = soup.find('div', {'class': 'conceptCards'})

    if container:
        # Retrieve all locations
        conceptLinks = []
        concept = container.find_next('h3', {'class': 'name detailsLink'})
        while concept != None:
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
            location = retrieveInfo(name, link, shortDesc)
            locations.append(location)
    
    # Convert to JSON format
    jsondata = {
        "locations": locations
    }
    jsonfinal = json.dumps(jsondata, ensure_ascii=False).encode('utf-8').decode('utf-8')
    print(jsonfinal)
    
    result = open('result.json', 'w')
    result.write(jsonfinal)
    result.close()

if __name__ == "__main__":
    main()
