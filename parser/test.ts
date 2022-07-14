// This file is for testing. Please remove before merge

import ParsedTimeForDate from "./containers/time/parsedTimeForDate";
import ParsedTimeForDay from "./containers/time/parsedTimeForDay";

const date = new ParsedTimeForDay("sunday ").parse();
console.log(date.getValue());

const date1 = new ParsedTimeForDate("jul 31").parse();
console.log(date1.getValue());
