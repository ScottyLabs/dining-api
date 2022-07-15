// This file is for testing. Please remove before merge

import DiningParser from "./logic/diningParser";

// import ParsedTime from "./containers/time/parsedTime";
// import ParsedTimeForDate from "./containers/time/parsedTimeForDate";
// import ParsedTimeForDay from "./containers/time/parsedTimeForDay";
// import TimeBuilder from "./containers/timeBuilder";
// import { getHTMLResponse } from "./utils/requestUtils";
// import { determineTimeInfoType } from "./utils/timeUtils";

// const date = new ParsedTimeForDay("sunday ").parse();
// console.log(date.getValue());

// const date1 = new ParsedTimeForDate("jul 31").parse();
// console.log(date1.getValue());

// const date2 = new ParsedTime("12:00 PM - 2:00 AM").parse();
// console.log(date2.getValue());

// console.log(determineTimeInfoType("24 hours"));

// const builder = new TimeBuilder();

// const input = "Thursday, July 14, 8:00 AM - 9:00 PM".split(",");
// builder.addSchedule(input);

(async () => {
  // const google = new URL("https://www.google.com");
  // console.log(await getHTMLResponse(google));
  const parser = new DiningParser();
  await parser.process();
})();
