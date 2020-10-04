from bs4 import BeautifulSoup
import requests
import warnings
import json
import re

warnings.filterwarnings("ignore", category=UserWarning, module='bs4')

f = open("result.json", "w")
jsonlocations = []

url = ("https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=conceptDetails&conceptId=")

# ---------------------- Looping through all the places -----------------------
#70-140
for placeid in range(70, 140):

    #print(placeid)

    # ---------------------- Create the URL -----------------------------------

    url2 = url + str(placeid)
    r = requests.get(url2)
    #print(r.status_code)
    # ---------------------- Page not found -----------------------------------
    if r.status_code != 200:
        print("SKIP")
        continue

    # ---------------------- Making the beautiful soup ------------------------
    data = r.text
    soup = BeautifulSoup(data)

    # ---------------------- Obtaining name of the place, skip if empty -------
    h1s = soup.find('h1')
    if h1s == None:
        continue

    place = h1s.text.strip()
    if place == "":
        continue

    # ---------------------- Obtaining location of the place ------------------
    loc = soup.find('div', {'class': 'location'})
    location = loc.a.text.strip()
    #print(location)

    # ---------------------- Obtaining coordinates of the place ---------------
    location_url = loc.a['href']

    at_index = location_url.index('@')
    location_url = location_url[at_index+1:]

    comma_index = location_url.index(',')
    x_coord = location_url[0: comma_index]
    location_url = location_url[comma_index+1:]

    comma_index = location_url.index(',')
    y_coord = location_url[0: comma_index]

    x_coord = float(x_coord)
    y_coord = float(y_coord)

    # ---------------------- Obtaining description of the place ---------------
    desc = soup.find('div', {'class': 'description'}).find(text=True,
                                                           recursive=False)
    description = desc.strip()

    # ---------------------- Initializing variable for timings ----------------
    tim = soup.find('ul', {'class': 'schedule'})
    timingstrings = []

    # ---------------------- Obtaining the timing strings ---------------------
    #THE FOLLOWING SCRIPT SHOULD ONLY BE RUN ON SUNDAY

    remove = ['\\xc2','\\xa0','\\r','\\n']
    for child in tim.children:
        #print(child)
        tmp = 0
        for grandchild in child:
            #print("___")
            if tmp == 2:
                all_times = str(grandchild.encode('utf-8'))[3:-1]
                for character in remove:
                    all_times = all_times.replace(character,"")
                days = all_times.split(",")
                for i in range(len(days)):
                    days[i] = days[i].replace(" ","")
                
                #print(days)
                timingstrings.append(days[1::])
            tmp += 1
    #print(timingstrings)
    # ---------------------- Parsing timings into JSON ------------------------
    jsontime = []
    for i in range(len(timingstrings)):
        for times in timingstrings[i]:
            #print(times)
            if times == "CLOSED":
                continue
            if times == "24hours":
                tmpjson = {
                    "start":
                    {
                        "day": (i)%7,
                        "hour": 0,
                        "min": 0
                    },
                    "end":
                    {
                        "day": (i)%7,
                        "hour": 23,
                        "min": 59
                    }
                }
                jsontime.append(tmpjson)
                continue

            time_split = times.split("-")
            start_time = time_split[0]
            end_time = time_split[1]

            start_pm_flag = False
            start_time_json = []
            end_time_json = []

            if start_time[-2::] == "AM":
                hour_min = start_time.replace("AM","").split(":")
                start_time_json.append((i)%7)
                start_time_json.append(int(hour_min[0]))
                start_time_json.append(int(hour_min[1]))
            if start_time[-2::] == "PM":
                start_pm_flag = True
                hour_min = start_time.replace("PM","").split(":")
                start_time_json.append((i)%7)
                start_time_json.append(int(hour_min[0]) + 12)
                start_time_json.append(int(hour_min[1]))
            if end_time[-2::] == "AM":
                hour_min = end_time.replace("AM","").split(":")
                if start_pm_flag:
                    end_time_json.append((i+1)%7)
                else:
                    end_time_json.append((i)%7)
                end_time_json.append(int(hour_min[0]))
                end_time_json.append(int(hour_min[1]))
            if end_time[-2::] == "PM":
                hour_min = end_time.replace("PM","").split(":")
                end_time_json.append((i+2)%7)
                end_time_json.append(int(hour_min[0]) + 12)
                end_time_json.append(int(hour_min[1]))
            
            #print(start_time_json)
            #print(end_time_json)
            
            tmpjson = {
                "start":
                {
                    "day": start_time_json[0],
                    "hour": start_time_json[1],
                    "min": start_time_json[2]
                },
                "end":
                {
                    "day": end_time_json[0],
                    "hour": end_time_json[1],
                    "min": end_time_json[2]
                }
            }
            jsontime.append(tmpjson)

    #print(jsontime)
    # ---------------------- Parsing one place into JSON ----------------------
    jsonplace = {
        "name": place,
        "description": description,
        "keywords": [""],
        "location": location,
        "coordinates": {
            "lat": x_coord,
            "lng": y_coord
        },
        "times": jsontime
    }

    # ---------------------- Add to locations JSON ----------------------------
    jsonlocations.append(jsonplace)


jsondata = {
    "locations": jsonlocations
}
print(json.dumps(jsondata))
jsonfinal = json.dump(jsondata, f)
#print(jsonfinal)
