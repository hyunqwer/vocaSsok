// Logic checks without requiring a microphone or browser service.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {value:id==='day'?'all':0, textContent:'', innerHTML:'', hidden:false, disabled:false, children:[], classList:{add(){}}, append(e){this.children.push(e);}, click(){}});
  return elements.get(id);
}
const memory = new Map();
class Recognition { start(){this.onstart?.();} abort(){} stop(){} }
const context = vm.createContext({
  console, structuredClone, Date, Math, JSON, Blob, URL,
  window:{SpeechRecognition:Recognition,isSecureContext:true,addEventListener(){}},
  document:{getElementById:element,querySelectorAll(){return [];},createElement(){return {classList:{add(){}},click(){}};},addEventListener(){},hidden:false},
  localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
  performance:{now:()=>0},setInterval(){},setTimeout(){return 1;},clearTimeout(){}
});
const html = fs.readFileSync('vocabulary_activity.html','utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const run = code => vm.runInContext(code,context);
assert.equal(run('words.length'),39);
assert.equal(run('new Set(words.map(w=>w.id)).size'),39);
assert.equal(run('words.filter(w=>!w.originalQuiz.correct).length'),1);
run('start();read();recognition.onresult({results:[[{transcript:"battery"}]]});choose(current.meaning,{classList:{add(){}}});advance();');
assert.equal(run('session.items.battery.done'),true);
assert.equal(run('db.history[0].independent'),true);
assert.equal(run('db.history[0].reading.firstRecognized'),true);
run('start();rec().reading.selfChecked=true;rec().reading.passed=true;stage="meaning";render();choose("wrong",{classList:{add(){}}});choose(current.meaning,{classList:{add(){}}});advance();');
assert.equal(run('session.items.battery.done'),false);
assert.equal(run('session.items.battery.due'),4);
// Complete three intervening words, then only the failed meaning returns.
run('for(let i=0;i<3;i++){rec().reading.selfChecked=true;rec().reading.passed=true;stage="meaning";render();choose(current.meaning,{classList:{add(){}}});advance();}');
assert.equal(run('current.id'),'battery');
assert.equal(run('stage'),'meaning');
run('choose(current.meaning,{classList:{add(){}}});advance();');
assert.equal(run('session.items.battery.done'),true);
assert.equal(run('session.items.battery.meaning.delayedPassed'),true);
assert.equal(run('db.history.at(-1).independent'),false);
// A wrong answer during delayed checking must schedule another visit.
run('start();rec().visits=2;rec().reading.passed=true;rec().meaning.needsRecheck=true;stage="meaning";render();choose("wrong",{classList:{add(){}}});choose(current.meaning,{classList:{add(){}}});advance();');
assert.equal(run('session.items.battery.done'),false);
run('start();read();recognition.onerror({error:"not-allowed"});');
assert.match(element('status').textContent,/권한이 거부/);
assert.equal(run('busy'),false);
assert.equal(run('rec().reading.firstRecognized'),null);
run('read();');
assert.equal(run('recognition.interimResults'),true);
assert.match(element('micLabel').textContent,/입력 연결 중/);
run('recognition.onaudiostart();');
assert.match(element('read').className,/listening/);
run('recognition.onspeechstart();');
assert.match(element('micLabel').textContent,/목소리가 들려요/);
run('recognition.onspeechend();');
assert.match(element('micLabel').textContent,/확인하고 있어요/);
run('var interim=[{transcript:"bat"}];interim.isFinal=false;recognition.onresult({resultIndex:0,results:[interim]});');
assert.equal(element('transcript').textContent,'bat');
assert.equal(run('stage'),'reading');
assert.equal(run('rec().reading.attempts'),0);
run('var finalResult=[{transcript:"battery"}];finalResult.isFinal=true;recognition.onresult({resultIndex:0,results:[finalResult]});');
assert.equal(run('stage'),'meaning');
assert.match(element('status').textContent,/battery.*잘 읽었어요/);
console.log('PASS: active microphone state, interim transcript, final recognized result and meaning transition');
run('rec().deferred=true;next();');
assert.equal(run('current.id'),'loose');
assert.ok(memory.has('vocassok.review.v1'));
run('start();for(let i=0;i<5;i++){rec().reading.selfChecked=true;rec().reading.passed=true;stage="meaning";render();choose(current.meaning,{classList:{add(){}}});advance();}');
assert.equal(run('stage'),'finish');
assert.equal(run('current'),null);
assert.equal(run('session.roundIndex'),0);
assert.equal(run('session.completed'),false);
assert.equal(run('roundGroups().length'),8);
assert.equal(run('roundGroups().at(-1).length'),4);
assert.equal(run('activeRecords().filter(r=>r.done).length'),5);
assert.equal(run('session.items.hammer.visits'),0);
run('session.roundIndex++;next();');
assert.equal(run('current.id'),'hammer');
assert.equal(run('roundRecords().length'),5);
// Each boundary pauses, and the final round contains only four words.
run('for(let i=0;i<34;i++){if(stage==="finish"){session.roundIndex++;next();}rec().reading.selfChecked=true;rec().reading.passed=true;stage="meaning";render();choose(current.meaning,{classList:{add(){}}});advance();}');
assert.equal(run('stage'),'finish');
assert.equal(run('session.completed'),true);
assert.equal(run('session.roundIndex'),7);
assert.equal(run('activeRecords().filter(r=>r.done).length'),39);
console.log('PASS: five-word round boundaries, explicit continuation, eight rounds, four-word final round, full completion');
console.log('PASS: 39 words, original quiz separation, independent completion, delayed retry, self-check classification, permission denial, deferral, local save');
