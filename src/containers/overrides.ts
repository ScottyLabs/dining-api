import type { ITimeRange } from "types";

/*
Separated from locationBuilder for cleanliness. 
- Format used to export changes from SQL database to concept cards
- go to db.ts to change SQL export command ("getChanges(...)")
- go to locationBuilder.ts to change manner of overrides ("applyOverride(...)")
    -Currently, if it detects anything other than null 
    -it gets overridden completely
- go to diningParser.ts to change way it is being parsed
*/

export interface ChangeOverride {
  conceptid: number;
  name?: string;
  description?: string;
  shortdescription?: string;
  times?: ITimeRange[];
  menu?: string;
  accepts_online_orders?: boolean;
}
