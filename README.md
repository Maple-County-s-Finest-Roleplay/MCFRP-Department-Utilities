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
MCFRP Department Utilities featured a leave of absense system for departments.
- `/loa view`: View a user's current or past LOAs
- `/loa edit`: Edit a user's active LOA
- `/loa setup`: Setup LOA for the current guild. Takes the following options:
 - `leave_approval_channel`: The channel for leave approval. New leave requests will be sent here pending approval from a department high-rank.
 - `leave_panel_channel`: The channel where the leave panel will be sent. This panel will show all active and upcoming LOAs for the current guild.
 - `leave_request_panel_channel`: The channel where the LOA Request panel will be sent. This is where users can request a Leave of Absense.
- `/loa end`: End a user's active LOA before its set end time. I believe the leave panel will not refresh to reflect this until 12 am the next day, but I could be wrong.
- `/loa delete`: Delete an LOA from the database.
- `/loa reset`: Reset the LOA configuration for the current guild.

### Applications / AP Requests
For the final few months of the bots existence, the Maple County Sheriff's Office of MCFRP was able to use an exclusive beta application system. This system was a fork of the application system used by the main MCFRP Utilities bot, and was never used by other departments due to a lack of interest from them.
- `/mcsoentryapplicationpanel`: Sends the MCSO Entry Application panel
- `/mcsoaprequestpanel`: Sends the MCSO AP Request panel

### Other Features
**Investigation Notice:** The Maple County Sheriff's Office's CID team used a special investigation notice feature. Basically, the bot would listen to the MCFRP CAD Logs channel for investigation reports, and it would mirror the report to the MCSO Department Discord for investigators to begin their investigation.

**Role Sync:** For a few months in August-September, we expiremented with a Role Syncing feature to sync roles between department servers and the main server and vice versa. This feature never saw the light of day as it was very broken and, interestingly enough, would only work properly for Fairfield Police Department roles. If you can get this to work, I'd be happy to merge your PR.

**Sync Leaves and Bans:** This was another broken system designed to make MCFRP Moderators' lives easier. Basically, if a user was banned from the main server it would ban them from all Department Discords, and if a user was kicked or left the main server, it would also remove from all Department Discords. I'm unsure why this feature didn't work, as I've compared it to other working versions of the same feature and my code should have worked. If you can get this to work, I'd be happy to merge your PR.

**Time Parser:** MCFRP Department Utilities featured a full time parser for the Shifts and LOA modules. It was a fork of the time parser from the main MCFRP Utilities bot.

---

**Issues?** Open an issue and I'll take a look at it, but there's no garauntee I'll be able to fix it or be willing to fix it. If you have any questions, DM me on Discord @thedylanator or email me [here](mailto:dylan+github@thedylanator.com). I hope you can enjoy this piece of work even if my server can't :)