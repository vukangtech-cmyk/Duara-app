import assert from "node:assert/strict";

class RealtimeBus {
  constructor() { this.channels = new Map(); }
  subscribe(userId, handler) { this.channels.set(userId, handler); return () => this.channels.delete(userId); }
  emit(event) { const handler = this.channels.get(event.recipientId); if (handler) handler(event); }
}

const bus = new RealtimeBus();
const inboxA = []; const inboxB = [];
bus.subscribe("user-a", (event) => inboxA.push(event));
bus.subscribe("user-b", (event) => inboxB.push(event));

bus.emit({ kind: "message", conversationId: "conversation-1", senderId: "user-a", recipientId: "user-b", body: "Habari kutoka A" });
bus.emit({ kind: "message", conversationId: "conversation-1", senderId: "user-b", recipientId: "user-a", body: "Nimepokea kutoka B" });
assert.equal(inboxB[0].body, "Habari kutoka A");
assert.equal(inboxA[0].body, "Nimepokea kutoka B");

const signals = [];
const sendSignal = (senderId, recipientId, signalType, payload = {}) => { const event = { kind: "call_signal", senderId, recipientId, signalType, payload }; signals.push(event); bus.emit(event); };
sendSignal("user-a", "user-b", "ringing");
sendSignal("user-a", "user-b", "offer", { type: "offer", sdp: "mock-offer" });
sendSignal("user-b", "user-a", "answer", { type: "answer", sdp: "mock-answer" });
sendSignal("user-b", "user-a", "ice", { candidate: "mock-candidate" });
sendSignal("user-a", "user-b", "hangup");
assert.deepEqual(signals.map((event) => event.signalType), ["ringing", "offer", "answer", "ice", "hangup"]);
assert.equal(inboxB.filter((event) => event.kind === "call_signal").length, 3);
assert.equal(inboxA.filter((event) => event.kind === "call_signal").length, 2);

console.log("DM delivery simulation: PASS");
console.log("WebRTC signaling sequence simulation: PASS");
console.log("Sequence: ringing -> offer -> answer -> ice -> hangup");
