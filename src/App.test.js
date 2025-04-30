import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import App from './App';

describe('Workout Progress App', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('renders main title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Calisthenic Workout Generator/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('allows difficulty selection', () => {
    render(<App />);
    const difficultySelect = screen.getByLabelText(/Select Difficulty Level/i);
    expect(difficultySelect).toHaveValue('Beginner');

    fireEvent.change(difficultySelect, { target: { value: 'Advanced' } });
    expect(difficultySelect).toHaveValue('Advanced');
  });

  test('generates workout on button click', async () => {
    render(<App />);
    const generateButton = screen.getByText(/Generate Workout/i);
    
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      const workoutList = screen.getByRole('list');
      expect(workoutList).toBeInTheDocument();
      expect(workoutList.children.length).toBeGreaterThan(0);
    });
  });

  test('logs workout successfully', async () => {
    render(<App />);
    const generateButton = screen.getByText(/Generate Workout/i);
    const logButton = screen.getByText(/Log Workout/i);
    
    // Generate workout
    fireEvent.click(generateButton);
    
    // Wait for workout to be generated
    await waitFor(() => {
      const workoutList = screen.getByRole('list');
      expect(workoutList).toBeInTheDocument();
    });

    // Log workout
    fireEvent.click(logButton);

    // Check for success alert
    await waitFor(() => {
      const alertText = screen.getByText(/Workout logged successfully!/i);
      expect(alertText).toBeInTheDocument();
    });
  });

  test('prevents duplicate workout logging', async () => {
    render(<App />);
    const generateButton = screen.getByText(/Generate Workout/i);
    const logButton = screen.getByText(/Log Workout/i);
    
    // Generate and log first workout
    fireEvent.click(generateButton);
    await waitFor(() => screen.getByRole('list'));
    fireEvent.click(logButton);

    // Generate and attempt to log same workout again
    fireEvent.click(generateButton);
    await waitFor(() => screen.getByRole('list'));
    fireEvent.click(logButton);

    // Check for error alert
    await waitFor(() => {
      const alertText = screen.getByText(/Workout for this date already logged/i);
      expect(alertText).toBeInTheDocument();
    });
  });
});
