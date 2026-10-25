/* Mini-lessons: Code, Git & APIs */
Object.assign(LESSONS, {
'quiz:code:HTTP & APIs': {
  why: `Testers, support techs and developers all read API responses. The status code tells you instantly who is at fault: the client or the server.`,
  idea: `<ul class="clean"><li><b>2xx success</b>: 200 OK, 201 Created, 204 No Content</li><li><b>3xx redirect</b>: 301 moved permanently</li><li><b>4xx your request is wrong</b>: 400 bad input, 401 not logged in, 403 not allowed, 404 not found, 409 conflict, 429 too many requests</li><li><b>5xx the server failed</b>: 500 error, 502 bad gateway (upstream failed), 503 unavailable</li><li>Methods: GET read, POST create, PUT/PATCH update, DELETE remove</li></ul>`,
  example: `<p>Your app shows "something went wrong." The browser's Network tab shows <code>POST /api/orders → 401</code>.</p><p>401 means the request wasn't authenticated: the login token is missing or expired. It's not a server bug, so check the token, not the server logs.</p>`,
  mistakes: [`Mixing up 401 (who are you?) and 403 (I know who you are, but no).`, `Blaming the server for 4xx errors. They mean the request was wrong.`, `Using GET for requests that change data.`],
  say: `4xx means the client sent something wrong, 5xx means the server failed; 401 versus 403 tells me whether it's a login problem or a permissions problem.`
},
'quiz:code:Python': {
  why: `Python is the most common scripting language in IT and security automation, and simple "what does this print?" questions show up in interviews.`,
  idea: `<ul class="clean"><li><code>//</code> floor division: 17 // 5 = 3 · <code>%</code> remainder: 17 % 5 = 2</li><li>Lists count from 0: <code>items[0]</code> is the first, <code>items[-1]</code> is the last</li><li><code>len(x)</code> counts items · <code>print()</code> shows text without quotes</li><li>Dict: <code>{"name": "Alei"}</code>, read with <code>d["name"]</code></li></ul>`,
  example: `<p><code>servers = ["web", "db", "vpn"]</code><br><code>print(servers[-1], len(servers), 7 // 2, 7 % 2)</code></p><p>Prints <b>vpn 3 3 1</b>: last item, 3 items, 7 ÷ 2 rounded down = 3, remainder 1.</p>`,
  mistakes: [`Counting list positions from 1 instead of 0.`, `Expecting <code>7 / 2</code> to give 3; it gives 3.5. Use <code>//</code> for whole numbers.`, `Thinking print shows the quotes around strings.`],
  say: `I use Python to automate repetitive tasks, like parsing logs or calling APIs, and I always test scripts on sample data first.`
},
'quiz:code:Git': {
  why: `Every development and DevOps team uses Git. You need the daily commands and a safe way to undo mistakes.`,
  idea: `<ul class="clean"><li><code>git status</code> what changed · <code>git add .</code> stage · <code>git commit -m "msg"</code> save a snapshot</li><li><code>git pull</code> get others' work · <code>git push</code> share yours</li><li><code>git switch -c name</code> new branch · pull request = ask teammates to review and merge</li><li><code>git log --oneline</code> history · <code>git revert &lt;id&gt;</code> safely undo a pushed commit</li></ul>`,
  example: `<p>You pushed a commit that broke the build. On a shared branch, don't rewrite history. Find it with <code>git log --oneline</code>, then <code>git revert a1b2c3d</code> and push. That adds a new commit that undoes the bad one.</p>`,
  mistakes: [`Using <code>git reset --hard</code> plus a force-push on a shared branch; it erases teammates' work.`, `Committing secrets like API keys. Use .gitignore and environment variables.`, `Huge commits with vague messages. Small, clear commits are easier to review.`],
  say: `I work on a branch, open a pull request for review, and if something bad gets merged I use git revert so history stays intact.`
},
'quiz:code:Regex': {
  why: `Regular expressions power grep, log filters, input validation and SIEM searches.`,
  idea: `<ul class="clean"><li><code>^</code> start of line · <code>$</code> end of line</li><li><code>\\d</code> a digit · <code>\\w</code> a letter, digit or _ · <code>.</code> any character · <code>\\.</code> a real dot</li><li><code>+</code> one or more · <code>*</code> zero or more · <code>{3}</code> exactly three</li></ul>`,
  example: `<p>Find lines that start with ERROR and end with a 3-digit code: <code>^ERROR.*\\d{3}$</code></p><p>Matches "ERROR disk full 507", but not "INFO ERROR 507" (doesn't start with ERROR) or "ERROR 50" (only 2 digits).</p>`,
  mistakes: [`Forgetting that <code>.</code> matches any character; escape it as <code>\\.</code> for a real dot.`, `Leaving off <code>^</code> and <code>$</code>, so the pattern matches in the middle of lines too.`],
  say: `I use anchors like ^ and $ so the pattern matches exactly what I mean, and I test it on sample lines first.`
},
'quiz:code:Logging': {
  why: `Good logs make problems findable. Choosing the right level keeps important messages from drowning in noise.`,
  idea: `<p>Levels from least to most serious: <b>DEBUG</b> (developer detail) → <b>INFO</b> (normal events) → <b>WARNING</b> (not broken yet, needs attention) → <b>ERROR</b> (something failed) → <b>CRITICAL</b> (the whole service is down).</p>`,
  example: `<p>"User logged in" = INFO. "Disk 90% full" = WARNING. "Payment request failed" = ERROR. "Database unreachable, nothing works" = CRITICAL.</p>`,
  mistakes: [`Logging everything as ERROR, so real errors get ignored.`, `Logging passwords or personal data.`, `Using print() instead of a logger with timestamps.`],
  say: `I log at the right level with timestamps and context, and never log secrets or personal data.`
}
});
