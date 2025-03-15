## MCFRP Department Utilities
This is the source code for the MCFRP Department Utilities that you may have seen or used as a member of MCFRP. This bot featured applications, shift logging, LOA logging, and utility functions for roleplay communities. 

📖 This bot is designed to work with a MongoDB database using the mongoose package. If you are smart enough to do it, you can convert it to work with other databases.

⚠️ This bot was customized and tailored to the needs of MCFRP and the code has not been changed (except for removing sensitive information) prior to publishing. You are free to take snippets, however cloning the entire bot and expecting it to work for your needs is bound to fail. Issues and PRs are open, however if future Discord.js updates or major updates to packages utilized by this bot affect its functionality, this repository will be archived.

### Shifts
This bot featured a full-fledged shift logging system for MCFRP departments. The shift commands offered include:
- `/shift start`: Starts a shift.
- `/shift break`: Starts or ends a break during a shift.
- `/shift end`: Ends the user's current shift.
- `/shift leaderboard`: Displays the shift leaderboard, with options including time interval and shift type, for the current guild. Staff members in the main MCFRP server had the ability to use this command in the main server for any department, which is what the `guild` option is used for.
- `/shift wipe`: Allowed for the department head to clear all shifts for their department.
- `/shift admin add`: Allowed a department admin to manually add a shift to a user.
- `/shift admin remove`: Allowed a department admin to manually remove a shift from a user.
- `/shift admin active`: Allowed department admins to view all active shifts.
- `/shift admin end-shift`: Allowed a department admin to end a user's shift by their username or a shift ID.
- `/shift admin view`: View a user's shifts.
- `/shift admin edit`: Edit a user's shift by its shift ID.
If there's any more commands I don't remember them.

### Leave of Absense
