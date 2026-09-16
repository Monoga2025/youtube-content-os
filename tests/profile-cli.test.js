'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const cp=require('node:child_process');
const {open,id,now,root:storeRoot}=require('../lib/store');
const projectRoot=path.join(__dirname,'..'),cli=path.join(projectRoot,'bin','youtube-content-os.js');
function run(home,profile,parts,owner=profile){return cp.spawnSync(process.execPath,[cli,...parts,'--profile',profile],{encoding:'utf8',env:{...process.env,YOUTUBE_CONTENT_OS_HOME:home,YOUTUBE_CONTENT_OS_OWNER:owner}});}
test('profiles isolate human backups, reject cross-profile restore/workbook and invalidate stale exports after restore',()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'ytos-profiles-')),previous=process.env.YOUTUBE_CONTENT_OS_HOME;process.env.YOUTUBE_CONTENT_OS_HOME=home;try{
  assert.match(storeRoot('daniel'),new RegExp(home.replace(/[\\]/g,'\\\\')),'in-process store must use this test temp home');
  assert.equal(run(home,'daniel',['init','--mode','rss']).status,0);assert.equal(run(home,'sebastian',['init','--mode','rss']).status,0);
  assert.equal(run(home,'daniel',['mission','draft','--title','Original']).status,0);
  const db=open('daniel');db.prepare('INSERT INTO evidence(id,source_id,body,created_at) VALUES (?,?,?,?)').run(id(),null,'human proof',now());db.prepare('INSERT INTO feedback VALUES (?,?,?,?,?,?,?,?)').run(id(),'piece','2026-09-15','UP','ICP',12,'human feedback',now());db.close();
  assert.equal(run(home,'daniel',['backup','--file','daniel.json']).status,0);assert.equal(run(home,'daniel',['workbook','export']).status,0);
  const droot=path.join(home,'profiles','daniel'),backup='daniel.json',book=path.join(droot,'workbooks','daniel-youtube-content-os.xlsx');
  assert.notEqual(run(home,'sebastian',['restore','--file',backup]).status,0);assert.notEqual(run(home,'sebastian',['workbook','import','--file',book]).status,0);
  assert.equal(run(home,'daniel',['mission','draft','--title','Changed']).status,0);assert.equal(run(home,'daniel',['restore','--file',backup]).status,0);
  assert.notEqual(run(home,'daniel',['workbook','import','--file',book]).status,0);
  const restored=open('daniel');assert.equal(restored.prepare('SELECT count(*) n FROM feedback').get().n,1);assert.equal(restored.prepare('SELECT body FROM evidence').get().body,'human proof');restored.close();
 }finally{previous===undefined?delete process.env.YOUTUBE_CONTENT_OS_HOME:process.env.YOUTUBE_CONTENT_OS_HOME=previous;fs.rmSync(home,{recursive:true,force:true});}
});
test('wrong owner fails closed across stateful profile commands and traversal profile is rejected without a path leak',()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'ytos-owner-'));try{
  assert.equal(run(home,'daniel',['init']).status,0);
  for(const parts of [['mission','draft','--title','no'],['backup','--human-data-only'],['maintenance'],['run','--scheduled'],['workbook','export'],['refresh','--mode','rss']]){const r=run(home,'daniel',parts,'wrong-owner');assert.notEqual(r.status,0);assert.match(r.stderr,/ownership check failed/);assert.doesNotMatch(r.stderr,/Traceback|[A-Za-z]:\\/);}
  const r=cp.spawnSync(process.execPath,[cli,'init','--profile','..\\daniel'],{encoding:'utf8',env:{...process.env,YOUTUBE_CONTENT_OS_HOME:home}});assert.notEqual(r.status,0);assert.match(r.stderr,/unknown profile/);assert.doesNotMatch(r.stderr,/profiles|home/);
 }finally{fs.rmSync(home,{recursive:true,force:true});}
});