// Checks fixed content: tracks, quiz shape, and that terminal answers accept valid forms and reject wrong ones.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
// Load only the content section
const content=js.split('/* ===================== STATE')[0];
eval(content+';global.T={TRACKS,CARDS,QUIZ,TERM,IV}');
const {TRACKS,CARDS,QUIZ,TERM,IV}=T;
const ids=TRACKS.map(t=>t.id);
let bad=0;
CARDS.forEach((c,i)=>{ if(!ids.includes(c[0])) {console.log('card track',i);bad++} });
QUIZ.forEach((q,i)=>{ if(!ids.includes(q[0])||q[3].length!==4||q[4]<0||q[4]>3){console.log('quiz bad',i);bad++} });
const norm=x=>x.trim().replace(/\s+/g,' ').replace(/["']/g,'');
const extra={ 'ls -la':['ls -al','ls -a -l'], 'cd ~':['cd','cd ~/'], 'grep "failed" auth.log':['grep -i failed auth.log','cat auth.log | grep failed'],
 'tail -n 20 app.log':['tail -20 app.log','tail -n20 app.log'], 'chmod +x backup.sh':['chmod 755 backup.sh','chmod u+x backup.sh'],
 'ps aux':['ps -ef','top'], 'find ~ -name "report.pdf"':["find ~ -name 'report.pdf'",'find $HOME -name report.pdf'], 'ping -c 4 google.com':['ping -c4 google.com'],
 './deploy.sh':['bash deploy.sh'], 'cat notes.txt':['less notes.txt'], 'wc -l users.txt':['cat users.txt | wc -l'] };
const wrong=['ls','cd /','rm notes.txt','grep failed','tail app.log','chmod backup.sh','ping google.com','find / -name report.pdf'];
TERM.forEach(t=>{
  const tries=[t[2],...(extra[t[2]]||[])];
  tries.forEach(a=>{ if(!t[1].some(re=>re.test(norm(a)))){console.log('REJECTED valid:',t[0],'|',a);bad++} });
  wrong.forEach(w=>{ if(t[1].some(re=>re.test(norm(w)))&&!tries.includes(w)) {console.log('ACCEPTED wrong:',t[0],'|',w);bad++} });
});
console.log(`cards ${CARDS.length}, quiz ${QUIZ.length}, terminal ${TERM.length}, interview ${IV.length}, problems ${bad}`);
process.exitCode = bad ? 1 : 0;
