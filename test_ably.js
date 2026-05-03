// test_ably.js — run with: node test_ably.js
// Requires ABLY_KEY env var: ABLY_KEY=xxx node test_ably.js
import Ably from 'ably';

const ABLY_KEY = process.env.ABLY_KEY;
if (!ABLY_KEY) {
  console.error('ERROR: set ABLY_KEY env var before running this script');
  process.exit(1);
}

async function run() {
  const client1 = new Ably.Realtime({ key: ABLY_KEY, clientId: 'player_1' });
  const client2 = new Ably.Realtime({ key: ABLY_KEY, clientId: 'player_2' });

  client1.connection.on('connected', () => console.log('Client 1 connected'));
  client2.connection.on('connected', () => console.log('Client 2 connected'));

  const channel1 = client1.channels.get('sudoku-room-TEST');
  const channel2 = client2.channels.get('sudoku-room-TEST');

  channel2.subscribe((msg) => {
    console.log('Client 2 received:', msg.name, msg.data);
  });

  await channel1.presence.enter({ name: 'P1', joinedAt: Date.now() });
  await channel2.presence.enter({ name: 'P2', joinedAt: Date.now() + 100 });
  console.log('Both entered presence');

  channel1.publish('cell-update', { index: 5, value: 3, senderId: 'player_1' }, (err) => {
    if (err) console.error('Publish error:', err);
    else console.log('cell-update published');
  });

  setTimeout(() => { client1.close(); client2.close(); process.exit(0); }, 3000);
}
run();
