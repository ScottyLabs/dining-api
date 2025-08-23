export type ITimeOverwrites = { [date: string]: string[] | undefined };

export type IAllTimeOverwrites = {
  [conceptId: string]: ITimeOverwrites;
};

/**
 * key is in the format of MM/DD/YY (omit the first digit of the month if it's 0. same thing for day. (ex: Miku day is represented as 3/9/25))
 * NOTE: There is no coalescing between the existing time string for that day and the overwritten time string.
 * If you choose to overwrite that day, you must do so completely.
 */
export const timeSlotOverwrites: IAllTimeOverwrites = {
  // capital grains override
  // won't be open until 9/13
  179: {
    "8/22/25": ["CLOSED"],
    "8/23/25": ["CLOSED"],
    "8/24/25": ["CLOSED"],
    "8/25/25": ["CLOSED"],
    "8/26/25": ["CLOSED"],
    "8/27/25": ["CLOSED"],
    "8/28/25": ["CLOSED"],
    "8/29/25": ["CLOSED"],
    "8/30/25": ["CLOSED"],
    "8/31/25": ["CLOSED"],
    "9/1/25": ["CLOSED"],
    "9/2/25": ["CLOSED"],
    "9/3/25": ["CLOSED"],
    "9/4/25": ["CLOSED"],
    "9/5/25": ["CLOSED"],
    "9/6/25": ["CLOSED"],
    "9/7/25": ["CLOSED"],
    "9/8/25": ["CLOSED"],
    "9/9/25": ["CLOSED"],
    "9/10/25": ["CLOSED"],
    "9/11/25": ["CLOSED"],
    "9/12/25": ["CLOSED"],
  },
};
