'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const core=require('../lib/local-core');
test('profile names are fixed and traversal cannot select storage',()=>{
 assert.equal(core.profileDefinition('daniel').displayName,'Daniel');
 assert.equal(core.profileDefinition('sebastian').displayName,'Sebastián');
 assert.throws(()=>core.profileDefinition('../daniel'),/unknown profile/);
});
test('human backup retains feedback and evidence body without raw signals',()=>{
 const backup=core.humanBackup({profile:'daniel',missions:[{id:'m',title:'T',status:'DRAFT',source_id:null,created_at:'x'}],signal_notes:[{video_id:'v',human_note:'n',created_at:'x'}],evidence:[{id:'e',source_id:null,body:'human proof',created_at:'x'}],feedback:[{id:'f',piece_id:'m',date:'2026-09-15',native_retention:'UP',icp_signal:'ICP',production_minutes:12,notes:'note',created_at:'x'}],signals:[{title:'derived'}]});
 assert.equal(backup.profile,'daniel'); assert.equal(backup.evidence[0].body,'human proof'); assert.equal(backup.feedback[0].notes,'note'); assert.equal(backup.signal_notes[0].human_note,'n');
});
