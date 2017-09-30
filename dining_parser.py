from bs4 import BeautifulSoup
import requests
import warnings
import json

warnings.filterwarnings("ignore", category=UserWarning, module='bs4')

f = open("result.json", "w")
jsonlocations = []

url = "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=conceptDetails&conceptId="

# ---------------------- Looping through all the places -----------------------------------------------

for placeid in range(70, 140):

	print (placeid)

	# ---------------------- Create the URL -----------------------------------------------------------
	url2 = url + str(placeid)
	r = requests.get(url2)

	# ---------------------- Page not found -----------------------------------------------------------
	if r.status_code != 200:
		continue

	# ---------------------- Making the beautiful soup ------------------------------------------------
	data = r.text
	soup = BeautifulSoup(data)

	# ---------------------- Obtaining name of the place, skip if empty -------------------------------
	h1s = soup.find('h1')
	place = str(h1s.text.encode('utf-8'))[2:-1]
	if place == "":
		continue

	# ---------------------- Obtaining location of the place ------------------------------------------
	loc = soup.find('div', {'class':'location'})
	location = str(loc.a.text.encode('utf-8'))[2:-1].strip()

	# ---------------------- Obtaining coordinates of the place ---------------------------------------
	location_url = loc.a['href']

	at_index = location_url.index('@')
	location_url = location_url[at_index+1:]

	comma_index = location_url.index(',')
	x_coord = location_url[0: comma_index]
	location_url = location_url[comma_index+1:]

	comma_index = location_url.index(',')
	y_coord = location_url[0: comma_index]

	x_coord = float(x_coord);
	y_coord = float(y_coord);

	# ---------------------- Obtaining description of the place ---------------------------------------
	desc = soup.find('div', {'class':'description'}).find(text=True, recursive=False)
	description = str(desc.encode('utf-8'))[3:-1]

	# ---------------------- Initializing variable for timings ----------------------------------------
	tim = soup.find('ul', {'class':'schedule'})
	starttimings = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
	endtimings = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
	opener = [0,0,0,0,0,0,0]
	timingstrings = []


	# ---------------------- Obtaining the timing strings ---------------------------------------------
	for child in tim.children:
		tmp = 0
		for grandchild in child:
			if tmp == 2:
				timingstrings.append(str(grandchild.encode('utf-8'))[3:-1])
			tmp += 1

	# ---------------------- Parsing the timing strings into arrays -----------------------------------
	for i in range(0, 7):

		day = (i+6)%7

		s = timingstrings[i]
		for j in range(2, len(s)):

			# -------------- Finding "CLOSED" or the timings ------------------------------------------
			if s[j] != ' ' and s[j] != '\\' and s[j-1] == ' ' and s[j-2] == ' ':

				# ---------- Not open if the timing says "CLOSED" -------------------------------------
				if s[j] == 'C':
					opener[day] = 0

				# ---------- If open for 24 hours -----------------------------------------------------
				elif s[j] == '2' and s[j+1] == '4':
					opener[day] = 1
					starttimings[day] = [day, 0, 0]
					endtimings[day] = [day, 23, 59]

				# ---------- Parse the timings if open ------------------------------------------------
				else:
					opener[day] = 1

					next_index = 0
					# ------ Parsing the start time ---------------------------------------------------
					nums = [day, 0, 0]
					cur = 1
					for k in range(j, j+20):
						if s[k] == ':':
							cur = 2
							continue
						elif s[k] == ' ':
							continue
						elif s[k] == 'P':
							nums[1] += 12
							next_index = k + 5
							break
						elif s[k] == 'A':
							next_index = k + 5
							break
						nums[cur] *= 10
						nums[cur] += ord(s[k]) - 48

					if starttimings[day][1] == 12 or starttimings[day][1] == 24:
						starttimings[day][1] -= 12

					starttimings[day] = nums

					# ------ Parsing the end time -----------------------------------------------------
					nums = [day, 0, 0]
					cur = 1
					for k in range(next_index, j+20):
						if s[k] == ':':
							cur = 2
							continue
						elif s[k] == ' ':
							continue
						elif s[k] == 'P':
							nums[1] += 12
							break
						elif s[k] == 'A':
							break
						nums[cur] *= 10
						nums[cur] += ord(s[k]) - 48

					# ------ If start time is greater than the end time, then ends at next day --------
					if starttimings[day][1] >= nums[1]:
						nums[0] = (nums[0] + 1) % 7

					if endtimings[day][1] == 12 or endtimings[day][1] == 24:
						endtimings[day][1] -= 12

					endtimings[day] = nums

					break


	# ---------------------- Parsing timings into JSON ------------------------------------------------
	jsontime = []
	for i in range(0, 7):
		tmpjson = {
			"start":
			{
				"day": starttimings[i][0],
				"hour": starttimings[i][1],
				"min": starttimings[i][2]
			},
			"end":
			{
				"day": endtimings[i][0],
				"hour": endtimings[i][1],
				"min": endtimings[i][2]
			}
		}

		# ------------------ Add to JSON only if place open on that day -------------------------------
		if opener[i] == 1:
			jsontime.append(tmpjson)

	# ---------------------- Parsing one place into JSON ----------------------------------------------
	jsonplace = {
		"name":place,
		"description":description,
		"keywords": [""],
		"location":location,
		"coordinates": {
			"lat": x_coord,
			"lng": y_coord
		},
		"times":jsontime
	}

	# ---------------------- Add to locations JSON ----------------------------------------------------
	jsonlocations.append(jsonplace)


jsondata = {
	"locations":jsonlocations
}

jsonfinal = json.dump(jsondata, f)
