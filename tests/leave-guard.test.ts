import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
// Type-checked against the source; Node resolves the package's own name to the built dist at run time.
import { useLeaveGuard, type ConfirmRequest, type LeaveGuard, type LeaveGuardOptions } from '@ten98/ui';

// Renders one guarded screen on the server and hands back what the router adapter and the screen received.
function guarded(dirty: boolean, options: LeaveGuardOptions = {}) {
  const seen = {} as { guard: LeaveGuard; shouldBlock: () => Promise<boolean>; html: string };
  function Screen() {
    seen.guard = useLeaveGuard(dirty, { ...options, useBlocker: shouldBlock => { seen.shouldBlock = shouldBlock; } });
    return h('div', null, seen.guard.dialog);
  }
  seen.html = renderToStaticMarkup(h(Screen));
  return seen;
}
const answering = (answer: boolean) => {
  const asked: ConfirmRequest[] = [];
  return { asked, confirm: async (request: ConfirmRequest) => { asked.push(request); return answer; } };
};

test('the package imports no router and renders on the server without a prompt', () => {
  const source = readFileSync(new URL('../src/lib/leave-guard.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from '@tanstack|react-router|next\/navigation/);
  const { html, guard, shouldBlock } = guarded(true);
  assert.equal(html, '<div></div>');
  assert.equal(guard.dialog, null);
  assert.equal(guard.pending, false);
  assert.equal(shouldBlock, guard.shouldBlock, 'the adapter receives the guard’s own shouldBlock');
});

test('a clean screen never asks', async () => {
  const { asked, confirm } = answering(false);
  const { guard } = guarded(false, { confirm });
  assert.equal(await guard.shouldBlock(), false);
  let left = 0;
  assert.equal(await guard.leave(() => left++), true);
  assert.equal(left, 1);
  assert.equal(asked.length, 0);
});

test('a dirty screen blocks until the user leaves, with the Dialog discard wording by default', async () => {
  const stay = answering(false);
  const kept = guarded(true, { confirm: stay.confirm }).guard;
  assert.equal(await kept.shouldBlock(), true, 'Keep editing blocks the navigation');
  let left = 0;
  assert.equal(await kept.leave(() => left++), false);
  assert.equal(left, 0, 'Keep editing runs no exit');
  assert.deepEqual(stay.asked[0], { title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', cancelLabel: 'Keep editing', danger: true });

  const go = answering(true);
  const leaving = guarded(true, { confirm: go.confirm, prompt: { title: 'Leave without saving?', confirmLabel: 'Leave' } }).guard;
  assert.equal(await leaving.shouldBlock(), false, 'Discard changes lets the navigation through');
  assert.equal(await leaving.leave(() => left++, { confirmLabel: 'Discard and switch' }), true);
  assert.equal(left, 1);
  assert.equal(go.asked[0].title, 'Leave without saving?');
  assert.equal(go.asked[1].confirmLabel, 'Discard and switch', 'a per-exit prompt overrides the screen’s wording');
  assert.equal(go.asked[1].cancelLabel, 'Keep editing');
});

test('overlapping asks share one question and one answer; prompt passes every ConfirmRequest field', async () => {
  const asked: ConfirmRequest[] = [];
  let answer: (leave: boolean) => void = () => {};
  const confirm = (request: ConfirmRequest) => { asked.push(request); return new Promise<boolean>(resolve => { answer = resolve; }); };
  const { guard } = guarded(true, { confirm, prompt: { danger: false, initialFocus: 'confirm', acknowledgement: 'I understand' } });
  assert.equal(guard.pending, false);
  let left = 0;
  const leaving = guard.leave(() => left++);
  const navigation = guard.shouldBlock();
  const settledEarly = await Promise.race([navigation.then(() => true), new Promise(resolve => setTimeout(resolve, 20, false))]);
  assert.equal(settledEarly, false, 'the first ask is not resolved by the second');
  assert.equal(asked.length, 1, 'one question, not two');
  assert.deepEqual(asked[0], { title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', cancelLabel: 'Keep editing', danger: false, initialFocus: 'confirm', acknowledgement: 'I understand' });
  guard.cancel(); // a dialog the guard does not own is not its to close
  answer(true);
  assert.equal(await leaving, true);
  assert.equal(await navigation, false);
  assert.equal(left, 1);
  // Once answered, leave's own navigation passes and the one after it asks a new question.
  assert.equal(await guard.shouldBlock(), false);
  void guard.shouldBlock();
  await Promise.resolve();
  assert.equal(asked.length, 2);
});

test('a settled exit passes once without asking, then navigation is asked about again', async () => {
  const { asked, confirm } = answering(false);
  const { guard } = guarded(true, { confirm });
  let left = 0;
  guard.pass(() => left++);
  assert.equal(left, 1);
  assert.equal(await guard.shouldBlock(), false, 'the navigation the exit started is not asked about');
  assert.equal(asked.length, 0);
  assert.equal(await guard.shouldBlock(), true, 'the next navigation is');
  assert.equal(asked.length, 1);
});
