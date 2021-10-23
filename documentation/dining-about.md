# ScottyLabs Dining API

## Overview
The ScottyLabs Dining API scrapes location data from the [CMU dining sites]() and distributes it as a [RESTful API](#api).

## So what kinds of things could you use this API for?

Our API is currently being used by the [CMU Eats](https://cmueats.com/) website, developed by ScottyLabs. The website, which is updated constantly, allows users to see all the dining locations with information about their hours, food offerings, and location. The currently open dining locations are at the top of the page, with the time until the eatery closes in green. At the bottom of the page, the dining locations which are currently closed are listed along with the remaining time from now until they open.

You can checkout the website below:
<iframe
  src="https://cmueats.com/"
  style="width:100%; height:300px;"
></iframe>

## What does this API support?
- Obtaining all location information for all eateries
- Extracting the names and locations of eateries open at a specified time
- Learning the location of one or several specific eateries (search by name)

Alright! If you want to learn more about APIs continue reading. Otherwise, now you're ready to head over to the [Get Started]() page to see how to access the API and begin using it!
<a name="api"> 
## What if I don't even know what an API is? 
</a>
An API, short for Application Programming Interface, allows computers or computer programs to communicate with each other without knowing any details about how the other is implemented. This allows the programmer to focus on what features are useful to them and use them in the same way even if some under-the-hood details about how they work change. APIs are usually made up of multiple tools or services available for the programmer to "call" or use. You can think of it as a set of functions that allows applications to access data from and interact with external software components or devices.

This API is a web API and specifically a RESTful API. A web API is an API for a web server or web browser and can be accessed through the internet. It essentailly receives requests from client devices (mobile, laptop, etc), sends those requests to the webserver to process, and then returns the desired output to the client. "RESTful" simply means that it satisfies certain constraints, called "REST constraints".