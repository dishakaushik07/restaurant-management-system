import assert from 'node:assert/strict';
import test from 'node:test';
import { createMlClient, MlServiceError } from '../src/lib/ml-client.js';
import { elapsedMinutes, isSafetyEligibleRobot, selectEligibleRobot, toPriorityTask } from '../src/lib/ml-mappers.js';

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('ML client sends every inference request to the FastAPI service', async () => {
  const calls = [];
  const client = createMlClient({ baseUrl: 'http://ml.test', fetchImpl: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return response({ ok: true });
  } });
  await client.rerank({ tasks: [] }); await client.demand({ hour: 12, day_of_week: 1, month: 1 }); await client.kitchenLoad({ predicted_orders: 1 }); await client.serviceTime({ item_count: 1 }); await client.waste({ item: 'rice', stock_quantity: 1, historical_daily_demand: 1, days_to_expiry: 1 }); await client.anomaly({}); await client.intent({ message: 'where is my order' }); await client.sentiment({ message: 'great food' });
  assert.deepEqual(calls.map((call) => call.url.replace('http://ml.test', '')), ['/api/ml/priority/rerank', '/api/ml/demand/predict', '/api/ml/kitchen-load/predict', '/api/ml/service-time/predict', '/api/ml/waste/predict', '/api/ml/anomaly/check', '/api/ml/intent', '/api/ml/sentiment']);
});

test('ML client reports invalid responses and service failures without leaking a raw fetch error', async () => {
  const invalidClient = createMlClient({ fetchImpl: async () => response(null) });
  await assert.rejects(() => invalidClient.demand({}), (error) => error instanceof MlServiceError && error.code === 'ML_INVALID_RESPONSE');
  const unavailableClient = createMlClient({ fetchImpl: async () => { throw new Error('network'); } });
  await assert.rejects(() => unavailableClient.anomaly({}), (error) => error instanceof MlServiceError && error.code === 'ML_SERVICE_UNAVAILABLE');
});

test('priority mapper preserves real order context and deterministic robot safety gates', () => {
  const safeRobot = { id: 'robot-a', status: 'idle', battery: 75 }; const unsafeRobot = { id: 'robot-b', status: 'idle', battery: 10 };
  assert.equal(isSafetyEligibleRobot(safeRobot), true); assert.equal(isSafetyEligibleRobot(unsafeRobot), false); assert.equal(selectEligibleRobot([unsafeRobot, safeRobot]).id, 'robot-a');
  const task = toPriorityTask({ taskId: 'qr-1', orderId: '1', tableId: '7', taskType: 'delivery', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), urgency: true }, safeRobot);
  assert.equal(task.task_id, 'qr-1'); assert.equal(task.table_id, '7'); assert.equal(task.robot_available, true); assert.equal(task.robot_battery_percent, 75); assert.equal(task.urgency_flag, true); assert.ok(task.waiting_time_minutes >= 19);
});

test('priority mapper treats an unavailable robot as an availability gate, not a fake zero battery reading', () => {
  const now = new Date('2026-09-09T12:20:00.000Z');
  const task = toPriorityTask({ taskId: 'task-1', timestamp: { seconds: 1788956400 } }, null, now);
  assert.equal(task.robot_available, false);
  assert.equal(task.robot_battery_percent, 100);
  assert.equal(elapsedMinutes({ seconds: 1788956400 }, now), 0);
});
