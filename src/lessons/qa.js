/* Mini-lessons: Software Testing */
Object.assign(LESSONS, {
'quiz:qa:Test design': {
  why: `Testers can't try every input. Boundary values and equivalence partitions find most bugs with the fewest tests, and software-testing interviews ask about them.`,
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
},
'quiz:qa:Pre-registration': {
  why: `It's how you stop fooling yourself. Interviewers ask about it when you say a project was "pre-registered", and it's the same habit as writing test cases before you see the build.`,
  idea: `<ul class="clean"><li><b>Pre-registration</b> = write down the rules, the data, and the pass/fail mark <b>before</b> you see any results.</li><li>Then run the test as written and report every result, including the failures.</li><li>It blocks three traps: <b>moving the goalposts</b> (changing the pass mark after), <b>cherry-picking</b> (reporting only the best run), and <b>overfitting</b> (tuning until the past looks perfect).</li></ul>`,
  example: `<p>In the trading research lab, the evaluation protocol went through 4 reviewed versions <b>before any strategy ran</b>. A daily breakout strategy was profitable but far below simply buying and holding, so by the pre-set rules it was marked DEAD. Nobody got to move the bar afterwards.</p>`,
  mistakes: [`Writing the rules after peeking at results "just to get a feel."`, `Changing a frozen rule quietly instead of making a new, dated version.`],
  say: `Pre-registration means I fix the rules and the pass mark before seeing results, then report every run. If a rule has to change, it becomes a new dated version, so the test can still say no.`
},
'quiz:qa:Walk-forward testing': {
  why: `Testing on data you also built the rules on always looks good. Walk-forward is the standard way to check if a strategy or model holds up on data it hasn't seen.`,
  idea: `<ul class="clean"><li>Split history into steps. <b>Train</b> (develop the rules) on an earlier window, then <b>test</b> on the next period, which is unseen.</li><li><b>Roll forward</b> and repeat. Each step is a <b>fold</b>.</li><li>The test period is never in its own training data, so every fold is a small "future" the rules had to survive.</li></ul>`,
  example: `<p>Data 2016 to 2023, train on 3 years, test on 1, roll 1 year: fold 1 trains on 2016 to 2018 and tests 2019; fold 2 trains on 2017 to 2019 and tests 2020; the last fold tests 2023. That's 5 folds. The lab worked this way: develop on earlier data, freeze the rules, then test the next unseen period.</p>`,
  mistakes: [`Letting an indicator peek at future data (look-ahead bias).`, `Judging a strategy on one pooled number instead of fold by fold.`],
  say: `Walk-forward means I develop on earlier data, freeze the rules, and test on the next unseen period, then roll forward. It shows whether an edge survives on data the rules never saw.`
},
'quiz:qa:Holdout data': {
  why: `A holdout is your one honest final exam. "What were your sealed months?" is a natural follow-up when you describe the trading research.`,
  idea: `<ul class="clean"><li>A <b>holdout</b> (in the lab, the "sealed months") is the most recent data, locked away while you develop.</li><li>It's opened <b>once</b>, after the rules are frozen.</li><li>It's spoiled if you peek and adjust, pick strategies by their holdout score, re-run it after tweaks, or mix it into training.</li></ul>`,
  example: `<p>In the lab, the most recent months of data stayed sealed until the candidate strategies and their full evaluation were registered. All development happened on earlier data, so the sealed months stayed a fair test.</p>`,
  mistakes: [`"Just a quick look" at the holdout before freezing the rules.`, `Running the holdout again after it fails. Now it's training data.`],
  say: `The sealed months were a holdout: the most recent data, untouched until the rules were frozen, then used once as a final test. If I'd peeked or reused it, it would stop being a fair test.`
}
});
