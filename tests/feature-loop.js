// Daily learning loop: today's 3 lessons follow the path (cloud security + red team, foundations first) plus one
// slipping skill; lessons come back when a skill slips; a full day needs learn + practice + apply + reviews;
// plus the 14-day strip, the suggested lab and the apply rep.
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const [before, app] = js.split('/* ===================== STATE');
const grab = n => { const i = app.indexOf('function ' + n + '('); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n}', i) + 2); };
const line = n => { const i = app.indexOf(n); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n', i)); };

const ctx = { console, structuredClone };
vm.createContext(ctx);
vm.runInContext(before + '\n' + [
  'var TODAY = "2026-10-29"; var S;',
  line('const KEY'), line('const DEFAULT'), line('let saveBlocked'), line('const QUIZ_FADE'),
  'function toast(){} function header(){} function save(){} function addXP(n){ S.xp += n; }',
  line('function dayStr(').replace('d = d || new Date();', 'if(!d) return TODAY;'), line('function addDays('), line('function dayNum('), line('function esc('),
  line('function cardId('), line('function quizId('), line('function cardDue('), grab('quizStatus'), line('function fadingQuiz('),
  line('const PATH'), line('const PRACTICE_N'), line('function pathSkills('), line('const skillLevel'), grab('trackL1Avg'), line('function hashStr('),
  grab('dailyPlan'), line('const SCEN_TRACK'), grab('applyRep'), grab('lessonNeeded'), grab('todaySteps'), grab('syncPlanFlags'), line('function afterStep('),
  grab('finishMission'), grab('completeMission'), line('const REVIEW_CAP'), line('const STEP_KEYS'), grab('isFullDay'), line('function dueReviewCount('), line('const reviewsOk'),
  grab('checkReviews'), line('function noteReview('), grab('checkFullDay'), grab('dayState'), line('const LAB_FOR'), app.slice(app.indexOf('const LAB_FOR'), app.indexOf('function labPick(')).split('\n').slice(1).join('\n'), grab('labPick'),
  'globalThis.T = { dailyPlan, finishMission, addDays, lessonNeeded, todaySteps, syncPlanFlags, completeMission, isFullDay, dayState, labPick, applyRep, pathSkills, skillLevel, skillById, allSkills, DEFAULT, PATH, LAB_FOR, SCEN,',
  '  get S(){ return S; }, set S(v){ S = v; }, set today(v){ TODAY = v; } };'
].join('\n'), ctx);
const T = ctx.T;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const today = '2026-10-29', yday = '2026-10-28';
const fresh = extra => { T.today = today; T.S = Object.assign(structuredClone(T.DEFAULT), { journal: [] }, extra || {}); };
const sk = id => T.skillById(id);
const strong = (n = 10) => ({ s: 90, n, right: n, last: today });

/* 1. a beginner's plan: 3 path skills, Level 1, the first two from different core tracks; fixed for the day */
fresh();
const p = T.dailyPlan();
if (p.ids.length !== 3) fail('plan should have 3 skills', p.ids);
if (p.ids.some(id => !T.PATH.weights[sk(id).tid])) fail('plan skills must be on the path (no Software Testing)', p.ids);
if (p.ids.some(id => T.skillLevel(sk(id)) !== 1)) fail('a beginner plan should be all Level 1', p.ids);
if (sk(p.ids[0]).tid === sk(p.ids[1]).tid) fail('the first two lessons should come from different tracks', p.ids);
if (p.ids.slice(0, 2).some(id => T.PATH.weights[sk(id).tid] !== 3)) fail('new learners start with the core tracks (Linux, networking, security)', p.ids);
if (T.dailyPlan() !== p) fail('the plan must stay the same all day');
if (!p.apply || !['ticket', 'iv'].includes(p.apply.kind)) fail('the plan should include an apply rep');

/* 2. Level 2 opens per track only once that track's Level 1 skills are solid */
for (let k = 0; k < 6; k++) { fresh(); T.today = '2026-11-0' + (k + 1); if (T.dailyPlan().ids.some(id => T.skillLevel(sk(id)) === 2)) fail('Level 2 skills must wait for solid Level 1'); }
fresh(); const mastery = {};
T.pathSkills().filter(s => T.skillLevel(s) === 1).forEach(s => { mastery[s.id] = strong(); });
T.S.mastery = mastery;
const p2 = T.dailyPlan();
if (!p2.ids.slice(0, 2).every(id => T.skillLevel(sk(id)) === 2)) fail('once every Level 1 skill is solid, the plan moves to Level 2', p2.ids.map(id => sk(id).sk));

/* 3. started-but-weak skills come first, and the third slot is the slipping one */
fresh();
const linux = T.pathSkills().filter(s => s.tid === 'linux' && T.skillLevel(s) === 1);
const [A, B] = linux;
T.S.mastery = { [A.id]: { s: 40, n: 5, right: 2, last: today }, [B.id]: { s: 60, n: 5, right: 3, last: today } };
const p3 = T.dailyPlan();
if (p3.ids[0] !== A.id) fail('the weakest started skill should be first', p3.ids);
if (sk(p3.ids[1]).tid === 'linux') fail('the second lesson should come from another track', p3.ids);
if (p3.ids[2] !== B.id) fail('the third slot should be the other slipping skill', p3.ids);

/* 4. when lessons come back */
fresh({ mastery: { [A.id]: strong() }, lessons: {} });
if (!T.lessonNeeded(A.id)) fail('an unread lesson is needed');
T.S.lessons[A.id] = today; if (T.lessonNeeded(A.id)) fail('a lesson read today is not needed again today');
T.S.lessons[A.id] = yday; if (T.lessonNeeded(A.id)) fail('a lesson read before is skipped while the skill is healthy');
T.S.mastery[A.id] = { s: 40, n: 5, right: 2, last: today }; if (T.lessonNeeded(A.id)) fail('a still-weak skill read yesterday is not re-assigned its lesson the next day');
T.S.lessons[A.id] = T.addDays(today, -3); if (!T.lessonNeeded(A.id)) fail('a skill still under 50% three days after its lesson gets the lesson again');
T.S.lessons[A.id] = yday; T.S.mastery[A.id] = { s: 70, n: 1, right: 1, last: T.addDays(today, -20) };
if (!T.lessonNeeded(A.id)) fail('a skill that was solid (60%+) and has faded under 50% has slipped: the lesson comes back');
T.S.lessons[A.id] = yday;
T.S.mastery[A.id] = strong(); T.S.slip = { [A.id]: { day: today, n: 1 } }; if (T.lessonNeeded(A.id)) fail('one miss is not enough to bring a lesson back');
T.S.slip[A.id].n = 2; if (!T.lessonNeeded(A.id)) fail('2 misses in a day bring the lesson back');

/* 5. full days: the loop needs reviews handled; old 3-mission days still count */
if (!T.isFullDay({ learn: true, practice: true, apply: true, rev: true })) fail('learn + practice + apply + reviews is a full day');
if (T.isFullDay({ learn: true, practice: true, apply: true })) fail('the loop without handled reviews is not a full day');
if (!T.isFullDay({ quiz: true, skill: true, iv: true })) fail('an old 3-mission day still counts');
if (T.isFullDay({ quiz: true, skill: true, iv: true, rev: false })) fail('an old-style day with reviews not handled does not count');

/* 6. step flags: practice when all 3 slots are done; learn only when no needed lesson is left */
fresh(); const p6 = T.dailyPlan();
T.S.days[today] = { p0: true, p1: true, p2: true };
T.syncPlanFlags();
if (!T.S.days[today].practice) fail('finishing all 3 practice slots sets practice');
if (T.S.days[today].learn) fail('learn must not be set while lessons are unread');
p6.ids.forEach(id => { T.S.lessons[id] = today; }); T.syncPlanFlags();
if (!T.S.days[today].learn) fail('reading the needed lessons sets learn');
T.completeMission('apply');
if (T.S.lastFull !== today) fail('with nothing due, finishing the loop makes a full day');

/* 7. the 14-day strip */
fresh({ days: { [yday]: { learn: true, practice: true, apply: true, rev: true }, '2026-10-27': { p0: true }, [today]: {} } });
if (T.dayState(yday) !== 'full' || T.dayState('2026-10-27') !== 'part' || T.dayState('2026-10-26') !== 'miss' || T.dayState(today, true) !== 'today') fail('day states: full / part / miss / today');

/* 8. the suggested lab fits today's tracks and rotates away from one used this week */
fresh(); const p8 = T.dailyPlan();
const names = new Set(p8.ids.flatMap(id => T.LAB_FOR[sk(id).tid] || []));
const lab = T.labPick(p8);
if (!lab || !names.has(lab.name)) fail('the lab should match today\'s tracks', lab && lab.name);
T.S.practice = { [lab.name]: today };
const lab2 = T.labPick(p8);
if (names.size > 1 && lab2.name === lab.name) fail('a lab used today should not be suggested again when others fit');

/* 9. the rep: a ticket in the main area until its best score reaches 90, then an interview question */
fresh();
const r1 = T.applyRep(A.id);
if (r1.kind !== 'ticket' || T.SCEN[r1.i].id !== 'disk') fail('a Linux day should apply the Linux ticket', JSON.stringify(r1));
T.S.tickets = { disk: 95 };
if (T.applyRep(A.id).kind !== 'iv') fail('after mastering the ticket, the rep should be an interview question');

/* 10. every path skill strong: still 3 unique path skills with lessons, different tracks, and cached for the day */
fresh(); const all = {}; T.pathSkills().forEach(s => { all[s.id] = strong(); }); T.S.mastery = all;
const p10 = T.dailyPlan();
if (p10.ids.length !== 3 || new Set(p10.ids).size !== 3) fail('a strong learner still gets 3 different skills', p10.ids);
if (p10.ids.some(id => !T.PATH.weights[sk(id).tid])) fail('a strong learner\'s plan must stay on the path (no Software Testing)', p10.ids);
if (new Set(p10.ids.map(id => sk(id).tid)).size < 3) fail('a strong learner\'s 3 skills should come from 3 tracks', p10.ids);
if (T.dailyPlan() !== p10) fail('the plan must be cached for the day');

/* 11. a stale plan (yesterday, or a skill id that no longer exists) is rebuilt */
fresh({ plan: { day: yday, ids: ['x', 'y', 'z'] } });
if (T.dailyPlan().day !== today) fail('yesterday\'s plan should be replaced');
fresh({ plan: { day: today, ids: ['quiz:gone:Nope'] } });
if (T.dailyPlan().ids.includes('quiz:gone:Nope')) fail('a plan with a missing skill should be rebuilt');

/* 12. a skill that held a slot 3 days running steps aside for another one */
fresh({ mastery: { [A.id]: { s: 30, n: 5, right: 1, last: today } } });
let heldA = 0;
for (const day of ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']) { T.today = day; T.S.mastery[A.id].last = day; if (T.dailyPlan().ids.slice(0, 2).includes(A.id)) heldA++; }
if (heldA > 3) fail('a skill should not hold a path slot more than 3 days in a row');

/* 13. a practice slot needs at least one right answer; other missions don't */
fresh();
if (T.finishMission({ mission: 'p0', right: 0 }) !== false || (T.S.days[today] || {}).p0) fail('a slot with no right answers must not count');
if (T.finishMission({ mission: 'p0', right: 1 }) !== true || !T.S.days[today].p0) fail('a slot with a right answer counts');
if (T.finishMission({ mission: 'apply', right: 0 }) !== true) fail('the apply rep does not need right answers');

/* 14. a lesson read outside the plan screen still completes Learn once Today syncs */
fresh(); const p14 = T.dailyPlan();
T.S.days[today] = { p0: true, p1: true, p2: true, apply: true };
p14.ids.forEach(id => { T.S.lessons[id] = today; });
T.syncPlanFlags();
if (!T.S.days[today].learn) fail('lessons read from Study should still complete Learn when Today syncs');

console.log('loop checks | problems', bad);
process.exitCode = bad ? 1 : 0;
