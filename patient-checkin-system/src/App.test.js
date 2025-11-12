// src/App.test.js
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// --- MOCKS ---
jest.mock('lucide-react', () => ({
  Camera: () => <div data-testid="icon">Camera</div>,
  Check: () => <div data-testid="icon">Check</div>,
  Loader2: () => <div data-testid="icon">Loader</div>,
  Home: () => <div data-testid="icon">Home</div>,
  User: () => <div data-testid="icon">User</div>,
  CheckCircle: () => <div data-testid="icon">CheckCircle</div>,
  UserPlus: () => <div data-testid="icon">UserPlus</div>,
  Video: () => <div data-testid="icon">Video</div>,
  Database: () => <div data-testid="icon">Database</div>,
  FileText: () => <div data-testid="icon">FileText</div>,
  X: () => <div data-testid="icon">X</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  Shield: () => <div data-testid="icon">Shield</div>,
  RefreshCw: () => <div data-testid="icon">Refresh</div>,
  Trash2: () => <div data-testid="icon">Trash</div>,
  LogOut: () => <div data-testid="icon">LogOut</div>,
  Activity: () => <div data-testid="icon">Activity</div>,
  MapPin: () => <div data-testid="icon">MapPin</div>,
  Clock: () => <div data-testid="icon">Clock</div>,
  UserCheck: () => <div data-testid="icon">UserCheck</div>,
  AlertCircle: () => <div data-testid="icon">AlertCircle</div>,
  ArrowLeft: () => <div data-testid="icon">ArrowLeft</div>,
}));

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
};

// --- TESTS ---

test('TEST 1: Kiosk renders main welcome screen', () => {
  render(<App />);
  expect(screen.getByText(/Springfield Medical/i)).toBeInTheDocument();
});

test('TEST 2: Security lock button is present', () => {
  render(<App />);
  // FIX: Changed from "Staff Access Only" to "Staff Login" to match your App.js
  const lockBtn = screen.getByTitle(/Staff Login/i);
  expect(lockBtn).toBeInTheDocument();
});

test('TEST 3: Clicking lock switches to Login Screen', async () => {
  render(<App />);
  // FIX: Updated title here too
  const lockBtn = screen.getByTitle(/Staff Login/i);
  fireEvent.click(lockBtn);
  
  // Use waitFor to allow React time to switch screens
  await waitFor(() => {
      expect(screen.getByText(/Authorized Access Only/i)).toBeInTheDocument();
  });
});