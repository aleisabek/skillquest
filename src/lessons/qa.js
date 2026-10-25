/* Mini-lessons: Software Testing */
Object.assign(LESSONS, {
'quiz:qa:Test design': {
  why: `Testers can't try every input. Boundary values and equivalence partitions find most bugs with the fewest tests, and Healthcare billing-style interviews ask about them.`,
  idea: `<ul class="clean"><li><b>Equivalence partitioning</b>: split inputs into groups that should behave the same (too low, valid, too high) and test one value from each.</li><li><b>Boundary value analysis</b>: bugs hide at the edges, so test just outside and just inside each edge.</li><li>Always add <b>negative tests</b>: wrong types, empty input, special characters.</li></ul>`,
  example: `<p>An age field accepts 18 to 65.</p><p>Partitions: under 18, 18–65, over 65 → test 10, 40, 80. Boundaries: <b>17, 18, 65, 66</b>. Negative: "abc", empty, -1.</p>`,
  mistakes: [`Testing only "happy path" values like 30.`, `Testing 18 and 65 but not 17 and 66.`],
  say: `I use equivalence partitions to cover each kind of input once, and boundary values because off-by-one bugs live at the edges.`
},
'quiz:qa:Test types': {
  why: `Knowing which test to run when keeps releases safe without wasting time.`,
  idea: `<ul class="clean"><li><b>Unit</b>: one function on its own</li><li><b>Integration</b>: parts working together (app + payment API)</li><li><b>Smoke</b>: quick check that a new build's main features work</li><li><b>Regression</b>: re-run existing tests after a change</li><li><b>UAT</b>: business users confirm it meets their needs</li><li><b>Load/performance</b>: behavior under many users · <b>Exploratory</b>: time-boxed, unscripted</li></ul>`,
  example: `<p>A new build arrives. Run a <b>smoke</b> test (does it start, can you log in, does the main screen load?). If it passes, run the <b>regression</b> suite around the changed areas, then <b>exploratory</b> testing on the new feature.</p>`,
  mistakes: [`Running a full regression on a build that fails smoke testing.`, `Calling every test a "unit test."`],
  say: `Smoke first to see if the build is testable, then targeted regression, then exploratory testing on what's new.`
},
'quiz:qa:Testing process': {
  why: `Teams expect testers to follow a process, so testing is planned and measurable, not random clicking.`,
  idea: `<p>Software Testing Life Cycle (STLC):</p><ul class="clean"><li>1. Requirement analysis (what should it do?)</li><li>2. Test planning (scope, approach, entry and exit criteria)</li><li>3. Test case design</li><li>4. Test environment setup</li><li>5. Test execution (run, log defects)</li><li>6. Test closure (report, lessons learned)</li></ul>`,
  example: `<p>For a "claims export to CSV" feature: read the requirement (which columns, who can export), plan (scope, test data, done when no open critical bugs), write cases (empty export, 10,000 rows, commas in fields, permissions), set up a test environment with fake data, execute, then report results.</p>`,
  mistakes: [`Writing test cases before understanding the requirement.`, `Using real patient or customer data instead of synthetic data.`],
  say: `I start from the requirements, plan with clear exit criteria, design cases, run them in a proper test environment, and close with a report.`
},
'quiz:qa:Defect life cycle': {
  why: `Every bug tracker (Jira, Azure DevOps, SpiraTeam) follows a life cycle. Testers own the retest and close steps.`,
  idea: `<p>New → Assigned → Open → Fixed → <b>Retest</b> → Verified → Closed. If the retest fails, it's <b>Reopened</b> and goes back to the developer.</p>`,
  example: `<p>A developer marks "Total wrong for 11+ line items" as Fixed. You retest with 11 items (passes), check the boundaries 10 and 12, run regression on reports that use totals, then mark it Verified and Closed. If 12 items still fails: Reopened, with notes.</p>`,
  mistakes: [`Closing a bug because the developer said "fixed," without retesting.`, `Reopening without notes on what still fails.`],
  say: `When a bug is fixed I retest the exact case, check nearby boundaries and related features, and only then close it, or reopen it with clear evidence.`
}
});
