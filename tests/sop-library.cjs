const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const elements = {};
const element = () => ({ innerHTML: '', textContent: '', value: '', hidden: false, addEventListener() {}, elements: { url: { addEventListener() {} } } });
const context = {
  window: {}, localStorage: { getItem() { return null; } },
  document: { querySelector(selector) { return elements[selector] ??= element(); }, querySelectorAll() { return []; }, addEventListener() {} },
  URL, Blob, setTimeout
};
vm.createContext(context);
for (const file of ['resources.generated.js', 'sop.resources.js', 'app.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
assert.equal(elements['#sopCount'].textContent, '8 documents');
assert.equal(context.window.HUB_SOPS.length, 8);
for (const item of context.window.HUB_SOPS) {
  assert.equal(new URL(item.url).searchParams.get('web'), '1');
  assert.equal(new URL(item.wordUrl).searchParams.has('web'), false);
  assert.equal(decodeURIComponent(new URL(item.url).pathname).split('/').pop(), `${item.fileName}.docx`);
}
assert.ok(context.window.HUB_SOPS[7].url.includes('8.%20%20SOP-%20DB'));
assert.equal(elements['#featuredCount'].textContent, '3 shortcuts');
elements['#sopSearch'].value = 'customer';
vm.runInContext('renderSops()', context);
assert.equal(elements['#sopCount'].textContent, '1 document');
elements['#sopSearch'].value = 'no-such-procedure';
vm.runInContext('renderSops()', context);
assert.equal(elements['#sopEmpty'].hidden, false);
elements['#sopSearch'].value = '';
vm.runInContext('resources.find(item => item.sop).url = "https://example.com/original.docx"; renderSops()', context);
assert.ok(elements['#sopList'].innerHTML.includes('href="https://example.com/original.docx"'));
vm.runInContext('resources.find(item => item.sop).url = "javascript:alert(1)"; renderSops()', context);
assert.ok(!elements['#sopList'].innerHTML.includes('href="javascript:'));
assert.equal(vm.runInContext('getWordLink({format:"Word",url:"https://team.sharepoint.com/sites/Data/SOP.docx"})', context), 'ms-word:ofe|u|https://team.sharepoint.com/sites/Data/SOP.docx');
assert.equal(vm.runInContext('getWordLink({format:"PDF",url:"https://team.sharepoint.com/SOP.pdf"})', context), '');
assert.equal(vm.runInContext('getWordLink({format:"Word",url:"https://team.sharepoint.com/:w:/sharing-token"})', context), '');
assert.equal(vm.runInContext('getWordLink({format:"Word",url:"file:///C:/SOP.docx"})', context), '');
assert.equal(vm.runInContext('filteredResources().some(item => item.sop)', context), false);
const homeHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.ok(homeHtml.includes('href="sop.html"'));
assert.ok(!homeHtml.includes('id="sopList"'));
const sopHtml = fs.readFileSync(path.join(__dirname, '..', 'sop.html'), 'utf8');
context.document.querySelector = (selector) => {
  if (selector.startsWith('#') && !sopHtml.includes(`id="${selector.slice(1)}"`)) return null;
  return elements[selector] ??= element();
};
const sopContext = { ...context };
vm.createContext(sopContext);
for (const file of ['resources.generated.js', 'sop.resources.js', 'app.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sopContext);
}
assert.equal(elements['#sopCount'].textContent, '8 documents');
console.log('PASS: SOP startup, search, empty state, direct links, unsafe link rejection, three weekly shortcuts');
