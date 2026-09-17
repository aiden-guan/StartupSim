import { describe, expect, it } from 'vitest';
import { OfficeRuntime, chooseSession, stateForPoint } from './behavior';
import { apartmentLayout, layoutFor } from './layout';

describe('OfficeRuntime & Occupancy System', () => {
  it('manages single-capacity claims and atomically frees previous claims on move', () => {
    const runtime = new OfficeRuntime(apartmentLayout, 42);
    const deskA = apartmentLayout.points.find(p => p.id === 'desk-a')!;
    const deskB = apartmentLayout.points.find(p => p.id === 'desk-b')!;
    const coffee = apartmentLayout.points.find(p => p.id === 'coffee')!;

    expect(deskA.capacity).toBe(1);

    // Agent 1 claims deskA
    expect(runtime.claim('worker-1', deskA)).toBe(true);
    expect(runtime.held.get('worker-1')).toBe('desk-a');

    // Agent 2 attempts to claim deskA and is rejected (already occupied)
    expect(runtime.claim('worker-2', deskA)).toBe(false);

    // Agent 2 claims deskB successfully
    expect(runtime.claim('worker-2', deskB)).toBe(true);

    // Agent 1 moves from deskA to coffee
    expect(runtime.claim('worker-1', coffee)).toBe(true);
    expect(runtime.held.get('worker-1')).toBe('coffee');

    // deskA is now free! Agent 2 can now move to deskA
    expect(runtime.claim('worker-2', deskA)).toBe(true);
    expect(runtime.held.get('worker-2')).toBe('desk-a');

    // deskB is now free because Agent 2 moved
    expect(runtime.claim('worker-3', deskB)).toBe(true);
  });

  it('safely releases occupancy when an agent unmounts or departs', () => {
    const runtime = new OfficeRuntime(apartmentLayout, 99);
    const coffee = apartmentLayout.points.find(p => p.id === 'coffee')!;

    expect(runtime.claim('worker-1', coffee)).toBe(true);
    expect(runtime.held.get('worker-1')).toBe('coffee');

    // Agent 2 cannot claim coffee while occupied
    expect(runtime.claim('worker-2', coffee)).toBe(false);

    // Agent 1 unmounts
    runtime.release('worker-1');
    expect(runtime.held.has('worker-1')).toBe(false);

    // Agent 2 can now claim coffee
    expect(runtime.claim('worker-2', coffee)).toBe(true);
    expect(runtime.held.get('worker-2')).toBe('coffee');
  });

  it('assigns stable home desks based on layout order', () => {
    const runtime = new OfficeRuntime(apartmentLayout, 123);
    const home1 = runtime.home('founder');
    const home2 = runtime.home('cofounder');

    expect(home1.id).toBe('desk-a');
    expect(home2.id).toBe('desk-b');

    // Re-calling home() returns the exact same desk
    expect(runtime.home('founder').id).toBe('desk-a');
    expect(runtime.home('cofounder').id).toBe('desk-b');
  });

  it('resets all occupancy cleanly when transitioning office levels', () => {
    const aptRuntime = new OfficeRuntime(apartmentLayout, 1);
    const deskA = apartmentLayout.points.find(p => p.id === 'desk-a')!;
    aptRuntime.claim('founder', deskA);

    // Upgrade to garage office
    const newLayout = layoutFor(1);
    const garageRuntime = new OfficeRuntime(newLayout, 1);

    // The new runtime has zero claims
    expect(garageRuntime.held.size).toBe(0);
    expect(garageRuntime.positions.size).toBe(0);
    expect(garageRuntime.conversations.size).toBe(0);

    const garageDesk = newLayout.points.find(p => p.kind === 'desk')!;
    expect(garageRuntime.claim('founder', garageDesk)).toBe(true);
  });

  it('supports deterministic visual sessions based on task', () => {
    // Assigned to product task on first product: 100% desk
    const session1 = chooseSession(10, 'founder', 0, 'product', false, true);
    expect(session1.kind).toBe('desk');
    expect(session1.seconds).toBeGreaterThanOrEqual(24);

    // Burnout: mostly idle/coffee, occasional resting at desk
    const burnoutSession = chooseSession(10, 'founder', 1, 'product', true, false);
    expect(['idle', 'coffee', 'desk']).toContain(burnoutSession.kind);

    // Regular product task: primarily desk
    let deskCount = 0;
    for (let i = 0; i < 100; i++) {
      const s = chooseSession(100, 'emp-1', i, 'product', false, false);
      if (s.kind === 'desk') deskCount++;
    }
    // Expected ~82% desk
    expect(deskCount).toBeGreaterThan(65);
  });

  it('requires two idle agents in physical proximity with cooldown for conversations', () => {
    const runtime = new OfficeRuntime(apartmentLayout, 7);

    // Neither is idle yet
    expect(runtime.chat('a', 10)).toBeNull();

    runtime.idle.add('a');
    runtime.idle.add('b');
    runtime.positions.set('a', [0, 0, 0]);
    runtime.positions.set('b', [1.2, 0, 0]); // 1.2m away -> within [0.6, 1.8] range

    const partner = runtime.chat('a', 10);
    expect(partner).toBe('b');
    expect(runtime.conversations.get('a')?.partner).toBe('b');
    expect(runtime.conversations.get('b')?.partner).toBe('a');

    // While chatting, another chat request respects until time
    expect(runtime.chat('a', 12)).toBe('b');

    // Canceling chat releases both
    runtime.cancelChat('a');
    expect(runtime.conversations.has('a')).toBe(false);
    expect(runtime.conversations.has('b')).toBe(false);
  });

  it('maps point kinds to explicit agent states', () => {
    expect(stateForPoint('desk', false)).toBe('WORKING');
    expect(stateForPoint('lab', false)).toBe('WORKING');
    expect(stateForPoint('server', false)).toBe('WORKING');
    expect(stateForPoint('board', false)).toBe('WHITEBOARD');
    expect(stateForPoint('meet', false)).toBe('MEETING');
    expect(stateForPoint('coffee', false)).toBe('COFFEE');
    expect(stateForPoint('idle', false)).toBe('IDLE');
    expect(stateForPoint('desk', true)).toBe('BURNED_OUT');
  });
});
