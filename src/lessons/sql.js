/* Mini-lessons: SQL (quiz skills and SQL console skills) */
Object.assign(LESSONS, {
'quiz:sql:Filtering': {
  why: `Testers check data with WHERE, support techs look up records, analysts filter reports. It's the most-used part of SQL.`,
  idea: `<ul class="clean"><li><code>SELECT * FROM tickets WHERE status = 'open';</code></li><li>Text goes in single quotes; numbers don't.</li><li>Combine with <code>AND</code> / <code>OR</code>; compare with = &lt;&gt; &lt; &gt; &lt;= &gt;=</li><li>Missing values: <code>IS NULL</code> / <code>IS NOT NULL</code> (never <code>= NULL</code>)</li></ul>`,
  example: `<p>Unassigned high-priority tickets:</p><p><code>SELECT * FROM tickets WHERE priority = 'high' AND assigned_to IS NULL;</code></p>`,
  mistakes: [`Writing <code>= NULL</code>; it never matches. Use IS NULL.`, `Forgetting quotes around text values.`, `Mixing AND and OR without parentheses.`],
  say: `I filter with WHERE, and when I check data quality I specifically look for NULLs with IS NULL.`
},
'quiz:sql:Grouping': {
  why: `"How many tickets per status?" "Which customers have duplicates?" GROUP BY answers the summary questions managers ask.`,
  idea: `<ul class="clean"><li><code>SELECT status, COUNT(*) FROM tickets GROUP BY status;</code> gives one row per status.</li><li><code>WHERE</code> filters rows <b>before</b> grouping; <code>HAVING</code> filters groups <b>after</b>.</li><li>Duplicates: <code>GROUP BY email HAVING COUNT(*) &gt; 1</code></li></ul>`,
  example: `<p>Which assignees have more than 2 open tickets?</p><p><code>SELECT assigned_to, COUNT(*) FROM tickets WHERE status = 'open' GROUP BY assigned_to HAVING COUNT(*) &gt; 2;</code></p>`,
  mistakes: [`Putting COUNT(*) in WHERE. Group conditions go in HAVING.`, `Selecting a column that isn't in GROUP BY and isn't aggregated.`],
  say: `WHERE filters rows, GROUP BY makes the buckets, and HAVING filters the buckets; that's how I find duplicates or overloaded queues.`
},
'quiz:sql:Sorting & limiting': {
  why: `"Show me the newest 10" or "the top offenders" is sorting plus limiting.`,
  idea: `<ul class="clean"><li><code>ORDER BY created_at DESC</code> newest first; ASC (the default) is oldest first.</li><li><code>LIMIT 5</code> keeps the first 5 rows (SQL Server uses <code>SELECT TOP 5</code>).</li><li>Order of clauses: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.</li></ul>`,
  example: `<p>The 3 most recent high-priority tickets:</p><p><code>SELECT * FROM tickets WHERE priority = 'high' ORDER BY created_at DESC LIMIT 3;</code></p>`,
  mistakes: [`LIMIT without ORDER BY: you get "some" rows, not the newest.`, `Forgetting DESC when you want newest or biggest first.`],
  say: `I always pair LIMIT with ORDER BY so the result is predictable.`
},
'quiz:sql:Joins': {
  why: `Real data is split across tables. Joining tickets to users, or claims to patients, is daily work for testers and analysts.`,
  idea: `<ul class="clean"><li><code>JOIN users ON tickets.assigned_to = users.id</code> matches rows across tables.</li><li><b>INNER JOIN</b> (plain JOIN): only rows that match on both sides.</li><li><b>LEFT JOIN</b>: every row from the left table, with NULLs where there's no match.</li></ul>`,
  example: `<p>Every ticket with its assignee's name, including unassigned ones:</p><p><code>SELECT t.title, u.name FROM tickets t LEFT JOIN users u ON t.assigned_to = u.id;</code></p><p>With a plain JOIN the unassigned tickets would disappear.</p>`,
  mistakes: [`Using INNER JOIN and silently losing unmatched rows.`, `Joining on the wrong columns, which multiplies rows.`],
  say: `I use INNER JOIN when both sides must exist and LEFT JOIN when I need everything from the main table, like all tickets even if unassigned.`
},
'sql:sql:Filtering (WHERE)': {
  why: `Writing the WHERE clause yourself, not just recognizing it, is what employers mean by "basic SQL."`,
  idea: `<p><code>SELECT * FROM table WHERE column = 'value';</code> Add conditions with AND. Dates in quotes compare like text: <code>created_at &gt;= '2026-10-21'</code>.</p>`,
  example: `<p><code>SELECT * FROM users WHERE department = 'IT' AND location = 'Katy';</code></p>`,
  mistakes: [`Double quotes for values in strict databases; use single quotes.`, `Using = for "on or after"; that's &gt;=.`],
  say: `I write the WHERE clause first, then check the row count makes sense.`
},
'sql:sql:Searching text (LIKE)': {
  why: `Users never remember exact titles. LIKE finds partial matches.`,
  idea: `<p><code>WHERE title LIKE '%printer%'</code>: <code>%</code> = any characters, <code>_</code> = exactly one. <code>'POS%'</code> = starts with POS.</p>`,
  example: `<p><code>SELECT * FROM tickets WHERE title LIKE '%vpn%';</code></p>`,
  mistakes: [`Forgetting the % signs, which turns LIKE into an exact match.`, `Assuming LIKE is case-insensitive everywhere; it depends on the database.`],
  say: `For partial matches I use LIKE with % wildcards on the side I'm unsure about.`
},
'sql:sql:Sorting & limiting': {
  why: `Dashboards and reports almost always show "top N" or "latest N."`,
  idea: `<p><code>ORDER BY column DESC LIMIT n</code> for the biggest or newest n; <code>ORDER BY column LIMIT n</code> for the smallest or oldest.</p>`,
  example: `<p>Oldest 2 tickets: <code>SELECT * FROM tickets ORDER BY created_at LIMIT 2;</code></p>`,
  mistakes: [`Putting LIMIT before ORDER BY.`, `Expecting DESC to be the default; without it you get oldest or smallest first.`],
  say: `ORDER BY decides which rows come first; LIMIT just cuts the list.`
},
'sql:sql:Choosing columns': {
  why: `Selecting only the columns you need makes queries faster and reports cleaner, and keeps sensitive columns out.`,
  idea: `<p><code>SELECT title, status FROM tickets;</code> Columns are separated by commas; the order you list them is the order shown.</p>`,
  example: `<p><code>SELECT id, priority FROM tickets;</code></p>`,
  mistakes: [`Using SELECT * in reports, which drags in columns nobody needs (and sometimes private data).`, `Forgetting the comma between column names, which some databases read as renaming the first column.`],
  say: `I select only the columns I need, especially when data includes personal information.`
},
'sql:sql:Counting & grouping': {
  why: `Counts and grouped totals are the backbone of every status report.`,
  idea: `<p><code>SELECT COUNT(*) FROM tickets WHERE status = 'open';</code> and <code>SELECT priority, COUNT(*) FROM tickets GROUP BY priority HAVING COUNT(*) &gt; 1;</code></p>`,
  example: `<p>How many closed tickets? <code>SELECT COUNT(*) FROM tickets WHERE status = 'closed';</code></p>`,
  mistakes: [`Using WHERE COUNT(*) instead of HAVING COUNT(*).`, `Using COUNT(column) when you mean COUNT(*); COUNT(column) skips NULLs.`],
  say: `COUNT with GROUP BY gives the breakdown; HAVING filters it.`
},
'sql:sql:Joins': {
  why: `Most real questions need two tables, like "which tickets belong to people in Katy?"`,
  idea: `<p><code>FROM tickets JOIN users ON tickets.assigned_to = users.id</code>, then filter with <code>WHERE users.location = 'Katy'</code>. Write columns as <code>table.column</code>.</p>`,
  example: `<p><code>SELECT tickets.title FROM tickets JOIN users ON tickets.assigned_to = users.id WHERE users.name = 'Maria Lopez';</code></p>`,
  mistakes: [`Forgetting the ON condition.`, `Leaving column names ambiguous when both tables have an id.`],
  say: `I join on the key that links the tables, then filter on the joined table's columns.`
},
'sql:sql:Changing data (UPDATE / DELETE)': {
  why: `Changing data is where SQL mistakes become outages. Employers care that you are careful.`,
  idea: `<p><code>UPDATE tickets SET priority = 'high' WHERE id = 104;</code> and <code>DELETE FROM tickets WHERE id = 104;</code>. Without WHERE, they change <b>every row</b>.</p>`,
  example: `<p>Safe habit: first run <code>SELECT * FROM tickets WHERE id = 104;</code>, confirm it's exactly one row, then run the UPDATE with the same WHERE, ideally inside a transaction you can ROLLBACK.</p>`,
  mistakes: [`Forgetting the WHERE clause.`, `Running changes on production without testing the WHERE as a SELECT first.`],
  say: `Before any UPDATE or DELETE, I run the same WHERE as a SELECT and check the row count, and I use a transaction so I can roll back.`
}
});
