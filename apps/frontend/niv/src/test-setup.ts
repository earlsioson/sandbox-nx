import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Define request handlers and response resolvers
const handlers = [
  // Mock API endpoints
  http.get('/api/patients', () => {
    return HttpResponse.json({
      patients: [
        { id: 1, name: 'John Doe', status: 'WATCHLIST' },
        { id: 2, name: 'Jane Smith', status: 'PENDING' },
      ],
    });
  }),

  http.post('/api/onboarding', () => {
    return HttpResponse.json({
      id: 1,
      status: 'NEW',
      message: 'Onboarding created successfully',
    });
  }),

  // Add more handlers as needed
];

const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
