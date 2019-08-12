/**
 * Google App Script for Dining Locations Spreadsheet
 * currently hosted on Richard Guo's gmail account, also editable by cmu.scottylabs@gmail.com
 * @author: Richard Guo
 */
function doGet() {
  var ss = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/14we6pEGxi17heESjI1JLl4O_mIz39MgDLRBDwYuM-Qo/edit');
  var sheet = ss.getActiveSheet();
  var arr = sheet.getSheetValues(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  var locations = [];

  for (var row = 0; row < arr.length; row++) {
    var location = {};
    location.name = arr[row][0];
    location.description = arr[row][1];
    location.location = arr[row][3];
    var regTime = arr[row][4];
    var startIndex = 5;
    var times = [];

    timeArr = parseTime(timeStr, i);
    times.push.apply(times, timeArr);
    for (var i = 0; i < 7; i++) {
      var timeStr;
      var day;
      // special case: Sunday
      if (i == 6) {
        day = 0;
      }
      else {
        day = i + 1;
      }
      if (arr[row][startIndex + i] == undefined || arr[row][startIndex + i] == null || arr[row][startIndex + i] == "" || arr[row][startIndex + i] == " ") {
        timeStr = regTime;
        Logger.log("path1");
      }
      else if (arr[row][startIndex + i] == "closed") {
        timeStr = "";
        Logger.log("path2")
      }
      else {
        timeStr = arr[row][startIndex + i];
        Logger.log("path3")
      }
      Logger.log(timeStr);
      timeArr = parseTime(timeStr, day);
      times.push.apply(times, timeArr);
    }
    location.times = times;
    locations.push(location);
  }

  return ContentService.createTextOutput(JSON.stringify({
    locations: locations
  }));
}

function parseTime(timeStr, day) {
  // idk why this is needed but somehow its needed...
  if (timeStr == undefined) {
    return [];
  }
  
  if (timeStr == "") {
    return [];
  }
  var result = [];

  var times = timeStr.split(",");
  for (var i = 0; i < times.length; i++) {
    var time = times[i];
    var singleTimes = time.split("-");
    var startTime = singleTimes[0].split(":");
    var endTime = singleTimes[1].split(":");
    var timeObj = {};
    timeObj.start = {
      day: day,
      hour: Number(startTime[0]),
      min: Number(startTime[1])
    }
    timeObj.end = {
      day: day,
      hour: Number(endTime[0]),
      min: Number(endTime[1])
    }
    result[i] = timeObj;
  }
  return result;
}