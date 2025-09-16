import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Mock external APIs (PointClickCare, notifications, etc.)
const handlers = [
  // Mock PointClickCare API
  http.get('*/pcc/api/patients/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
      medicalRecord: '12345',
      diagnosis: 'COPD',
      labResults: {
        oxygenSat: 85,
        co2Level: 50,
      },
    });
  }),

  // Mock notification service
  http.post('*/notifications', () => {
    return HttpResponse.json({ success: true, notificationId: 'abc123' });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
