export type ITimeOverwrites = { [date: string]: string[] | undefined };

export type IAllTimeOverwrites = {
  [conceptId: string]: ITimeOverwrites;
};

/**
 * key is in the format of MM/DD/YYYY (omit the first digit of the month if it's 0. same thing for day. (ex: Miku day is represented as 3/9/25))
 * NOTE: There is no coalescing between the existing time string for that day and the overwritten time string.
 * If you choose to overwrite that day, you must do so completely.
 */
export const timeSlotOverwrites: IAllTimeOverwrites = {
  // capital grains override
  // won't be open until 9/13
  179: {
    "8/22/2025": ["CLOSED"],
    "8/23/2025": ["CLOSED"],
    "8/24/2025": ["CLOSED"],
    "8/25/2025": ["CLOSED"],
    "8/26/2025": ["CLOSED"],
    "8/27/2025": ["CLOSED"],
    "8/28/2025": ["CLOSED"],
    "8/29/2025": ["CLOSED"],
    "8/30/2025": ["CLOSED"],
    "8/31/2025": ["CLOSED"],
    "9/1/2025": ["CLOSED"],
    "9/2/2025": ["CLOSED"],
    "9/3/2025": ["CLOSED"],
    "9/4/2025": ["CLOSED"],
    "9/5/2025": ["CLOSED"],
    "9/6/2025": ["CLOSED"],
    "9/7/2025": ["CLOSED"],
    "9/8/2025": ["CLOSED"],
    "9/9/2025": ["CLOSED"],
    "9/10/2025": ["CLOSED"],
    "9/11/2025": ["CLOSED"],
    "9/12/2025": ["CLOSED"],
  },
};
