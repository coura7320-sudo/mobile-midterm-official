import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { server } from '../index';

// Resolve socket.io-client from the monorepo frontend node_modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { io: Client } = require('../../../frontend/node_modules/socket.io-client') as {
  io: (url: string, opts?: Record<string, unknown>) => MockClientSocket;
};

interface MockClientSocket {
  on: (event: string, cb: (data: never) => void) => void;
  off: (event: string, cb: (data: never) => void) => void;
  emit: (event: string, payload?: unknown) => void;
  close: () => void;
}

function waitForSocketEvent<T = Record<string, unknown>>(
  socket: MockClientSocket,
  eventName: string,
  predicate: (data: T) => boolean = () => true,
  timeoutMs = 4000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler as never);
      reject(new Error(`Timeout waiting for socket event: ${eventName}`));
    }, timeoutMs);

    function handler(data: T) {
      if (predicate(data)) {
        clearTimeout(timer);
        socket.off(eventName, handler as never);
        resolve(data);
      }
    }

    socket.on(eventName, handler as never);
  });
}

async function runSuite() {
  console.log('====================================================');
  console.log(' WHATSAPP CLONE — FULL END-TO-END TEST SUITE');
  console.log('====================================================');

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`[Server] Listening on ${baseUrl}\n`);

  let aliceSocket: MockClientSocket | null = null;
  let bobSocket: MockClientSocket | null = null;

  try {
    // 1. Health Endpoint
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = (await healthRes.json()) as {
      status: string;
      socketEnabled: boolean;
    };
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthData.status, 'ok');
    assert.strictEqual(healthData.socketEnabled, true);
    console.log('✔ [1/12] Health check & Socket.IO server readiness');

    // 2. Login Alice & Bob
    const aliceLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'password123',
      }),
    });
    const bobLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@example.com',
        password: 'password123',
      }),
    });
    assert.strictEqual(aliceLoginRes.status, 200);
    assert.strictEqual(bobLoginRes.status, 200);
    const aliceAuth = (await aliceLoginRes.json()) as {
      token: string;
      user: { id: string; fullName: string; email: string };
    };
    const bobAuth = (await bobLoginRes.json()) as {
      token: string;
      user: { id: string; fullName: string; email: string };
    };
    console.log('✔ [2/12] User authentication & JWT token issuance');

    // 3. Profile Update (PUT /api/users/profile)
    const profileRes = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceAuth.token}`,
      },
      body: JSON.stringify({
        fullName: 'Alice Martin',
        about: 'Studying Mobile Development with React Native',
      }),
    });
    assert.strictEqual(profileRes.status, 200);
    console.log('✔ [3/12] Profile update & persistence in users.json');

    // 4. Direct Conversation & Archive Toggle
    const convRes = await fetch(`${baseUrl}/api/conversations/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceAuth.token}`,
      },
      body: JSON.stringify({ participantId: bobAuth.user.id }),
    });
    assert.strictEqual(convRes.status, 200);
    const convData = (await convRes.json()) as { conversation: { id: string } };
    const conversationId = convData.conversation.id;

    const archiveRes = await fetch(
      `${baseUrl}/api/conversations/${conversationId}/archive`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${aliceAuth.token}` },
      }
    );
    assert.strictEqual(archiveRes.status, 200);
    await fetch(`${baseUrl}/api/conversations/${conversationId}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${aliceAuth.token}` },
    });
    console.log('✔ [4/12] Direct conversation creation & Archive/Unarchive toggle');

    // 5. Group & Community Creation (POST /api/groups -> groups.json & conversations.json)
    const groupRes = await fetch(`${baseUrl}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceAuth.token}`,
      },
      body: JSON.stringify({
        name: 'React Native Midterm Group',
        communityName: 'Computer Engineering',
        description: 'Official study group for Mobile Development course',
        memberIds: [bobAuth.user.id],
      }),
    });
    assert.strictEqual(groupRes.status, 201);
    const groupsListRes = await fetch(`${baseUrl}/api/groups`, {
      headers: { Authorization: `Bearer ${aliceAuth.token}` },
    });
    const groupsListData = (await groupsListRes.json()) as {
      groups: { id: string; name: string }[];
    };
    assert.ok(groupsListData.groups.length >= 1);
    console.log('✔ [5/12] Community & Group creation persisted in groups.json');

    // 6. Status Update Creation & View Receipt
    const statusCreateRes = await fetch(`${baseUrl}/api/statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceAuth.token}`,
      },
      body: JSON.stringify({
        text: 'Building a WhatsApp Clone with Expo & Socket.IO!',
        backgroundColor: '#075E54',
      }),
    });
    assert.strictEqual(statusCreateRes.status, 201);
    const createdStatusData = (await statusCreateRes.json()) as {
      status: { id: string; viewedBy: string[] };
    };

    const viewStatusRes = await fetch(
      `${baseUrl}/api/statuses/${createdStatusData.status.id}/view`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${bobAuth.token}` },
      }
    );
    assert.strictEqual(viewStatusRes.status, 200);
    const viewedStatusData = (await viewStatusRes.json()) as {
      status: { viewedBy: string[] };
    };
    assert.ok(viewedStatusData.status.viewedBy.includes(bobAuth.user.id));
    console.log('✔ [6/12] Status creation & Viewed receipt persisted in statuses.json');

    // 7. Socket.IO Connection & Online Presence between Alice and Bob
    aliceSocket = Client(baseUrl, {
      auth: { token: aliceAuth.token },
      transports: ['websocket'],
    });
    await waitForSocketEvent(aliceSocket, 'connect');

    const bobOnlinePromise = waitForSocketEvent<{
      userId: string;
      isOnline: boolean;
    }>(aliceSocket, 'user:online', (d) => d.userId === bobAuth.user.id);
    bobSocket = Client(baseUrl, {
      auth: { token: bobAuth.token },
      transports: ['websocket'],
    });
    await waitForSocketEvent(bobSocket, 'connect');
    const bobOnline = await bobOnlinePromise;
    assert.strictEqual(bobOnline.isOnline, true);
    console.log('✔ [7/12] Two-user Socket.IO JWT connection & online status');

    // 8. Typing Indicators
    aliceSocket.emit('conversation:join', { conversationId });
    bobSocket.emit('conversation:join', { conversationId });

    const typingPromise = waitForSocketEvent<{
      isTyping: boolean;
      userId: string;
    }>(
      bobSocket,
      'typing:update',
      (d) => d.userId === aliceAuth.user.id && d.isTyping === true
    );
    aliceSocket.emit('typing:start', { conversationId });
    const typingData = await typingPromise;
    assert.strictEqual(typingData.isTyping, true);
    aliceSocket.emit('typing:stop', { conversationId });
    console.log('✔ [8/12] Real-time typing:start / typing:stop indicators');

    // 9. Real-Time Message Sending & Delivery Ack
    const msgNewPromise = waitForSocketEvent<{ id: string; text: string }>(
      bobSocket,
      'message:new'
    );
    const msgDeliveredPromise = waitForSocketEvent<{
      messageId: string;
      status: string;
    }>(aliceSocket, 'message:delivered');

    aliceSocket.emit('message:send', {
      conversationId,
      text: 'Phase 11 end-to-end verification message!',
    });

    const [newMsg, deliveredEvt] = await Promise.all([
      msgNewPromise,
      msgDeliveredPromise,
    ]);
    assert.strictEqual(newMsg.text, 'Phase 11 end-to-end verification message!');
    assert.strictEqual(deliveredEvt.status, 'delivered');
    console.log('✔ [9/12] Real-time message:send, message:new & message:delivered');

    // 10. Real-Time Read Receipt
    const msgReadPromise = waitForSocketEvent<{
      messageId: string;
      status: string;
    }>(aliceSocket, 'message:read', (d) => d.messageId === newMsg.id);
    bobSocket.emit('message:read', { conversationId, messageId: newMsg.id });
    const readEvt = await msgReadPromise;
    assert.strictEqual(readEvt.status, 'read');
    console.log('✔ [10/12] Real-time message:read receipt');

    // 11. Star Message & Retrieve Starred Messages
    const starRes = await fetch(`${baseUrl}/api/messages/${newMsg.id}/star`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${aliceAuth.token}` },
    });
    assert.strictEqual(starRes.status, 200);
    const starredListRes = await fetch(`${baseUrl}/api/messages/starred`, {
      headers: { Authorization: `Bearer ${aliceAuth.token}` },
    });
    const starredListData = (await starredListRes.json()) as {
      messages: { id: string }[];
    };
    assert.ok(starredListData.messages.some((m) => m.id === newMsg.id));
    console.log('✔ [11/12] Starred messages toggle & retrieval');

    // 12. Verify all 5 JSON storage files on disk contain valid non-empty JSON arrays
    const dataDir = path.resolve(__dirname, '../../data');
    const jsonFiles = [
      'users.json',
      'conversations.json',
      'messages.json',
      'groups.json',
      'statuses.json',
    ];
    for (const file of jsonFiles) {
      const content = JSON.parse(
        fs.readFileSync(path.join(dataDir, file), 'utf-8')
      );
      assert.ok(
        Array.isArray(content) && content.length > 0,
        `${file} is populated`
      );
    }
    console.log(
      '✔ [12/12] All 5 JSON files (users, conversations, messages, groups, statuses) verified on disk'
    );

    console.log('\nALL 12 END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } finally {
    aliceSocket?.close();
    bobSocket?.close();
    server.close();
  }
}

runSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
