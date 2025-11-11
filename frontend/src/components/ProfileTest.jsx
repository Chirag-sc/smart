import React, { useState } from 'react';
import profileAPI from '../services/profileAPI';

const ProfileTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testGetPreferences = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getUserPreferences();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdatePreferences = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.updateUserPreferences({
        preferences: {
          theme: 'dark',
          accentColor: '#EF4444',
          fontSize: 'large'
        }
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Profile API Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testGetPreferences}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Test Get Preferences'}
        </button>
        
        <button
          onClick={testUpdatePreferences}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Test Update Preferences'}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Result:</h3>
          <pre className="bg-white p-4 rounded border overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ProfileTest;
