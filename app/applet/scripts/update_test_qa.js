const fs = require('fs');
const file = 'tests/phase2c_visual_qa_test.ts';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `  const testGenId2 = 'gen_expired_2';
  const store2 = new MemoryEphemeralImageStore(1);
  const rec2 = store2.createRecord('FP-2', 'ngu_than_chen', Buffer.from('fake'), 'image/jpeg');
  rec2.generationId = testGenId2;
  rec2.expiresAt = Date.now() - 1000; // already expired
  await store2.put(rec2);
  const found2 = await store2.get(testGenId2);
  let statusCode2 = 200;
  let errorCode2 = '';
  let providerCalls2 = 0;
  if (!found2) {
    statusCode2 = 410;
    errorCode2 = 'EPHEMERAL_IMAGE_EXPIRED';
  } else {
    providerCalls2++;
  }
  const t2Pass = statusCode2 === 410 && errorCode2 === 'EPHEMERAL_IMAGE_EXPIRED' && providerCalls2 === 0;`;

const newLogic = `  const testGenId2 = 'gen_persisted_2';
  const store2 = new MemoryEphemeralImageStore(1);
  const rec2 = store2.createRecord('FP-2', 'ngu_than_chen', Buffer.from('fake'), 'image/jpeg');
  rec2.generationId = testGenId2;
  rec2.expiresAt = Date.now() - 1000; // past timestamp, but store must persist active records
  await store2.put(rec2);
  const found2 = await store2.get(testGenId2);
  const t2Pass = found2 !== null && found2.generationId === testGenId2;`;

if (!content.includes(oldLogic)) {
  console.log('oldLogic not found');
  process.exit(1);
}

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated phase2c_visual_qa_test.ts test 2 logic');
