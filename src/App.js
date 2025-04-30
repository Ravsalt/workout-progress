import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import exercisesData from './exercises'; // Assuming exercises data is imported from './exercises.js'
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import motivationalQuotes from './motivationalQuotes'; // Import motivational quotes
import './App.css'; // Custom CSS for styling

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const App = () => {
  // State variables
  const [difficulty, setDifficulty] = useState('Beginner');
  const [workout, setWorkout] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState(() => {
    const savedHistory = localStorage.getItem('workoutHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Effect to store workout history in local storage
  useEffect(() => {
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  // Function to generate random workout
  const generateRandomWorkout = useCallback((level) => {
    try {
      if (!['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
        throw new Error('Invalid difficulty level');
      }

      const filteredExercises = exercisesData.filter(exercise => exercise.difficulty === level);
      
      if (filteredExercises.length === 0) {
        throw new Error(`No exercises found for ${level} difficulty`);
      }

      const workoutCount = Math.min(4, filteredExercises.length);
      const selectedExercises = [];
      const selectedIndexes = [];

      while (selectedExercises.length < workoutCount) {
        const randomIndex = Math.floor(Math.random() * filteredExercises.length);
        if (!selectedIndexes.includes(randomIndex)) {
          selectedIndexes.push(randomIndex);
          selectedExercises.push({
            ...filteredExercises[randomIndex],
            sets: Math.floor(Math.random() * 3) + 2,
            reps: Math.floor(Math.random() * 10) + 5
          });
        }
      }

      return selectedExercises.map((exercise, index) => ({
        ...exercise,
        day: index + 1,
      }));
    } catch (error) {
      console.error('Workout Generation Error:', error);
      return [];
    }
  }, []);

  // Function to handle workout generation
  const handleGenerateWorkout = () => {
    try {
      const newWorkout = generateRandomWorkout(difficulty);
      if (newWorkout.length === 0) {
        throw new Error('Could not generate workout. Please try again.');
      }
      setWorkout(newWorkout);
    } catch (error) {
      console.error('Workout Generation Error:', error);
      alert(error.message || 'Failed to generate workout');
    }
  };

  // Function to handle workout download
  const handleDownloadWorkout = () => {
    if (workout.length > 0) {
      const motivationalQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      let workoutPlan = `🏋️‍♂️ Your Workout Plan 🏋️‍♀️\n\n`;
      workout.forEach((exercise) => {
        workoutPlan += exercise.restDay ? formatRestDay(exercise) : formatExercise(exercise);
      });
      workoutPlan += formatMotivationalQuote(motivationalQuote);
      downloadFile(workoutPlan);
    }
  };

  // Function to format rest day
  const formatRestDay = (exercise) => {
    return `🌟 Day ${exercise.day}: Rest Day 🌟\n` +
           `Description: ${exercise.description}\n` +
           `Tips: ${exercise.tips}\n\n`;
  };

  // Function to format exercise
  const formatExercise = (exercise) => {
    return `💪 Day ${exercise.day}: ${exercise.name} (${exercise.muscle}) 💪\n` +
           `Sets: ${exercise.sets}\n` +
           `Reps: ${exercise.reps}\n` +
           `Description: ${exercise.description}\n` +
           `Tips: ${exercise.tips}\n\n`;
  };

  // Function to format motivational quote
  const formatMotivationalQuote = (quote) => {
    return `🌟 "${quote}" 🌟\n\n`;
  };

  // Function to download workout plan
  const downloadFile = (content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'workout_plan.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Function to handle workout logging
  const handleLogWorkout = () => {
    try {
      if (workout.length === 0) {
        throw new Error('No workout to log');
      }
      
      const logEntry = { 
        date: selectedDate.toISOString().split('T')[0], 
        workout,
        id: Date.now() // Add unique identifier
      };

      setWorkoutHistory(prev => {
        // Prevent duplicate logging on same date
        const isDuplicate = prev.some(entry => 
          entry.date === logEntry.date && 
          entry.workout.length === logEntry.workout.length
        );

        if (isDuplicate) {
          throw new Error('Workout for this date already logged');
        }

        return [...prev, logEntry];
      });
      
      setWorkout([]);
      alert('Workout logged successfully!');
    } catch (error) {
      console.error('Workout Logging Error:', error);
      alert(error.message || 'Failed to log workout');
    }
  };

  // Function to render workout list
  const renderWorkoutList = useMemo(() => (workoutItems) => {
    return (
      <ul 
        className="list-disc pl-5 space-y-2" 
        aria-label="Generated workout plan"
        role="list"
      >
        {workoutItems.map((exercise, index) => (
          <li 
            key={`${exercise.name}-${index}`} 
            className="text-gray-700"
            aria-label={`${exercise.name} exercise for ${exercise.muscle} muscle group`}
          >
            Day {exercise.day}: {exercise.name} ({exercise.muscle}): {exercise.sets} sets of {exercise.reps} reps
          </li>
        ))}
      </ul>
    );
  }, []);

  // Function to get progress data for chart
  const getProgressData = useMemo(() => {
    const dates = workoutHistory.map(entry => entry.date);
    const totalSets = workoutHistory.map(entry => entry.workout.reduce((sum, ex) => sum + ex.sets, 0));
    const totalReps = workoutHistory.map(entry => entry.workout.reduce((sum, ex) => sum + ex.reps, 0));
    const totalVolume = workoutHistory.map(entry => entry.workout.reduce((sum, ex) => sum + ex.sets * ex.reps, 0));

    return {
      labels: dates,
      datasets: [
        {
          label: 'Total Sets',
          data: totalSets,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: 'Total Reps',
          data: totalReps,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
        },
        {
          label: 'Total Volume',
          data: totalVolume,
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
        },
      ],
    };
  }, [workoutHistory]);

  // Function to handle calendar date change
  const handleCalendarChange = (date) => {
    setSelectedDate(date);
  };

  // Render JSX
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mb-6 border border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Calisthenic Workout Generator</h1>

        <div className="mb-6">
          <label 
            htmlFor="difficulty" 
            className="block text-gray-700 text-sm font-medium mb-2"
            aria-label="Select workout difficulty level"
          >
            Select Difficulty Level:
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby="difficulty-description"
            aria-required="true"
          >
            <option value="Beginner" aria-label="Beginner difficulty level">Beginner</option>
            <option value="Intermediate" aria-label="Intermediate difficulty level">Intermediate</option>
            <option value="Advanced" aria-label="Advanced difficulty level">Advanced</option>
          </select>
          <p id="difficulty-description" className="text-xs text-gray-500 mt-1">
            Choose a workout difficulty that matches your fitness level
          </p>
        </div>

        <button
          onClick={handleGenerateWorkout}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
          aria-label="Generate a new workout plan"
          aria-live="polite"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleGenerateWorkout();
            }
          }}
        >
          Generate Workout
        </button>

        {workout.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Workout Plan:</h2>
            {renderWorkoutList(workout)}
            <button
              onClick={handleDownloadWorkout}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors duration-300 mt-4"
            >
              Download Workout Plan
            </button>
            <button
              onClick={handleLogWorkout}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors duration-300 mt-4"
            >
              Log Workout
            </button>
          </div>
        )}

        {workoutHistory.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Workout History:</h2>
            <ul className="space-y-2">
              {workoutHistory.map((entry, index) => (
                <li key={index} className="text-gray-700">
                  {entry.date}: {entry.workout.length} exercises
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {workoutHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg border border-gray-200 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Training Progress:</h2>
          <Line data={getProgressData()} />
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Calendar:</h2>
        <Calendar
          onChange={handleCalendarChange}
          value={selectedDate}
        />
      </div>
    </div>
  );
};

export default App;
