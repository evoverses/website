'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('../../packages/evoverses/src/lib/asset/appearance.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
const {evoAppearance}=context.exports;
test('skin and rarity flags select consistent common, Chroma and Epic accents',()=>{
 for(const value of [undefined,'none','unknown'])assert.equal(evoAppearance(value).tier,'common');
 assert.equal(evoAppearance('Chroma').tier,'chroma');
 for(const value of ['super','epic'])assert.equal(evoAppearance(value).tier,'epic');
 assert.equal(evoAppearance('none','epic').tier,'epic');
 assert.equal(evoAppearance('chroma','epic').tier,'epic');
 assert.notEqual(evoAppearance('chroma').borderFilter,evoAppearance('super').borderFilter);
 assert.match(evoAppearance('chroma').glow,/0\.18/);assert.equal(evoAppearance().glow,'none');
});
