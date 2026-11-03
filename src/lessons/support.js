/* Mini-lessons: IT Support & Microsoft 365 */
Object.assign(LESSONS, {
'quiz:support:Troubleshooting method': {
  why: `Interviewers love "walk me through how you'd troubleshoot X." A clear method shows you won't guess randomly or make things worse.`,
  idea: `<p>The CompTIA 7 steps:</p><ul class="clean"><li>1. Identify the problem (ask questions, reproduce it, check what changed)</li><li>2. Establish a theory of probable cause (start simple)</li><li>3. Test the theory (if wrong, form a new one or escalate)</li><li>4. Make a plan of action</li><li>5. Implement the fix or escalate</li><li>6. Verify it works and prevent repeats</li><li>7. Document everything</li></ul>`,
  example: `<p>"Outlook won't open." 1: Only this user? Since when? Any error? 2: Theory: a corrupt profile. 3: Outlook on the web works, so the account is fine and the theory holds. 4–5: Create a new Outlook profile. 6: User confirms mail loads. 7: Write the steps in the ticket.</p>`,
  mistakes: [`Jumping to step 5 (reinstalling) before identifying the problem.`, `Skipping step 6, so the user calls back.`, `Skipping step 7, so the next tech starts from zero.`],
  say: `I identify the problem first, test the simplest theory, fix it, confirm with the user, and document it so it's faster next time.`
},
'quiz:support:Windows tools': {
  why: `Knowing which built-in tool answers which question makes you fast on the help desk.`,
  idea: `<ul class="clean"><li><b>Task Manager</b> (Ctrl+Shift+Esc): what's using CPU, memory, disk</li><li><b>Event Viewer</b>: system and application errors</li><li><b>Services</b>: restart things like the Print Spooler</li><li><b>Device Manager</b>: drivers · <b>Disk Management</b>: drives and partitions</li><li><code>ipconfig /all</code>, <code>/flushdns</code>, <code>/release</code> + <code>/renew</code> · <code>gpupdate /force</code> · <code>sfc /scannow</code></li></ul>`,
  example: `<p>"Printing is stuck." Open Services, restart <b>Print Spooler</b>, then clear the queue. If it keeps happening, check Event Viewer for spooler or driver errors, and update the driver in Device Manager.</p>`,
  mistakes: [`Rebooting first and losing the evidence in Task Manager.`, `Ignoring Event Viewer, which often names the exact failing component.`],
  say: `I check Task Manager for resource problems and Event Viewer for errors before changing anything.`
},
'quiz:support:Ticket priority': {
  why: `With 20 open tickets, working the right one first protects the business, and SLAs depend on it.`,
  idea: `<p>Priority = <b>impact</b> (how many people or how much of the business) × <b>urgency</b> (how fast it hurts).</p><ul class="clean"><li>High impact + high urgency = <b>P1</b> (e.g. all POS down during dinner)</li><li>One high, one medium = <b>P2</b></li><li>Medium + medium, or high + low = <b>P3</b></li><li>Lower = <b>P4</b> (e.g. one user's cosmetic issue)</li></ul>`,
  example: `<p>One user can't print, but a nearby printer works (low impact, medium urgency) = P4. A whole team can't reach a shared drive with no workaround (medium impact, high urgency) = P2.</p>`,
  mistakes: [`Prioritizing whoever shouts loudest.`, `Ignoring workarounds; a workaround lowers urgency.`],
  say: `I weigh impact and urgency, work P1s immediately, and keep everyone else updated on where their ticket stands.`
},
'quiz:support:ITIL': {
  why: `Most IT teams use ITIL terms. Classifying a ticket correctly decides how it's handled and reported.`,
  idea: `<ul class="clean"><li><b>Incident</b>: something broke; restore service fast.</li><li><b>Service request</b>: a standard ask (new laptop, mailbox access).</li><li><b>Problem</b>: the root cause behind repeated incidents.</li><li><b>Change</b>: a planned, approved modification (upgrades, migrations).</li></ul>`,
  example: `<p>The VPN drops every Monday. Each drop is an <b>incident</b> (restore it now). Opening a <b>problem</b> record investigates why, and the firmware fix is then scheduled as a <b>change</b>.</p>`,
  mistakes: [`Logging a request as an incident, which skews SLAs.`, `Fixing the same incident weekly without opening a problem.`],
  say: `Incidents get service back; problems find root causes; changes go through approval so fixes don't cause new outages.`
},
'quiz:support:Microsoft 365 admin': {
  why: `Most IT support jobs list Microsoft 365, Entra ID and Intune. Knowing which admin center does what saves time.`,
  idea: `<ul class="clean"><li><b>Microsoft 365 admin center</b>: users, password resets, licenses, shared mailboxes</li><li><b>Microsoft Entra admin center</b>: identity, groups, MFA, sign-in logs, Conditional Access</li><li><b>Microsoft Intune admin center</b>: device enrollment, app and policy deployment, remote wipe</li><li><b>Exchange admin center</b>: mail flow, message trace · <b>Teams admin center</b>: Teams policies</li></ul>`,
  example: `<p>"I didn't get the vendor's email." Exchange admin center → <b>Message trace</b> shows whether it arrived, was quarantined, or was never sent.</p>`,
  mistakes: [`Resetting a password without verifying the caller's identity.`, `Removing a license before saving the leaving employee's mailbox and files.`],
  say: `I use the 365 admin center for accounts and licenses, Entra for sign-ins and MFA, Intune for devices, and Exchange message trace for mail delivery.`
}
});
