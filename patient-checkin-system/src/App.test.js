import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

const CONFIG = {
  clinic_name: 'Test Clinic', timezone: 'America/New_York', today: '2026-09-25', now: '09:00',
  departments: [{ name: 'Cardiology', physicians: ['Dr. A'] }], time_slots: ['09:00'],
  open_weekdays: [0, 1, 2, 3, 4], booking_window_days: 30, forms: [],
};

function mockApi(faceStatus = 'ready') {
  global.fetch = jest.fn((url) => {
    const body = url.includes('/kiosk/config') ? CONFIG
      : url.includes('/health') ? { status: 'online', clinic_name: 'Test Clinic', face: { status: faceStatus, message: '' } }
        : {};
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  });
}

afterEach(() => jest.restoreAllMocks());

test('shows the welcome screen once the clinic config loads', async () => {
  mockApi();
  render(<App />);
  expect(await screen.findByText('Welcome')).toBeInTheDocument();
  expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0);
});

test('language can be switched on the welcome screen', async () => {
  mockApi();
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Español' }));
  expect(screen.getByText('Bienvenido')).toBeInTheDocument();
});

test('face check-in is disabled until face recognition is ready', async () => {
  mockApi('loading');
  render(<App />);
  fireEvent.click(await screen.findByText('Tap to begin'));
  expect(await screen.findByText(/starting up/)).toBeInTheDocument();
  expect(screen.getByText('Scan my face').closest('button')).toBeDisabled();
  expect(screen.getByText('Enter my details').closest('button')).toBeEnabled();
});

test('staff lock button opens the staff sign-in', async () => {
  mockApi();
  render(<App />);
  fireEvent.click(await screen.findByLabelText('Staff sign in'));
  expect(screen.getByText('Authorized clinic staff only. All access is logged.')).toBeInTheDocument();
});
