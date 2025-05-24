// components/AuthTest.jsx - Create this component to test authentication
'use client';

import { useState } from 'react';

export default function AuthTest() {
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testToken = () => {
    const token = localStorage.getItem('token');
    addResult(`Token exists: ${!!token}`, token ? 'success' : 'error');
    
    if (token) {
      addResult(`Token length: ${token.length}`, 'info');
      addResult(`Token preview: ${token.substring(0, 50)}...`, 'info');
      
      // Try to decode JWT payload (basic check)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        addResult(`Token payload: ${JSON.stringify(payload)}`, 'info');
        addResult(`Token expires: ${new Date(payload.exp * 1000).toLocaleString()}`, 'info');
      } catch (e) {
        addResult(`Token decode error: ${e.message}`, 'error');
      }
    }
  };

  const testDebugEndpoint = async () => {
    try {
      const token = localStorage.getItem('token');
      addResult('Testing debug endpoint...', 'info');

      const response = await fetch('http://localhost:5000/api/products/debug-connection', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });

      const result = await response.json();
      addResult(`Debug response: ${JSON.stringify(result)}`, response.ok ? 'success' : 'error');
    } catch (error) {
      addResult(`Debug test failed: ${error.message}`, 'error');
    }
  };

  const testProductsEndpoint = async () => {
    try {
      const token = localStorage.getItem('token');
      addResult('Testing products endpoint...', 'info');

      const response = await fetch('http://localhost:5000/api/products/my-products', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        addResult(`Products loaded: ${data.length} items`, 'success');
      } else {
        const errorText = await response.text();
        addResult(`Products failed: ${response.status} - ${errorText}`, 'error');
      }
    } catch (error) {
      addResult(`Products test failed: ${error.message}`, 'error');
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Authentication Test Panel</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={testToken}
          className="px-3 py-2 bg-blue-500 text-white rounded text-sm"
        >
          Check Token
        </button>
        <button 
          onClick={testDebugEndpoint}
          className="px-3 py-2 bg-green-500 text-white rounded text-sm"
        >
          Test Debug Endpoint
        </button>
        <button 
          onClick={testProductsEndpoint}
          className="px-3 py-2 bg-purple-500 text-white rounded text-sm"
        >
          Test Products Endpoint
        </button>
        <button 
          onClick={clearResults}
          className="px-3 py-2 bg-gray-500 text-white rounded text-sm"
        >
          Clear Results
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto bg-gray-50 p-3 rounded">
        {results.length === 0 ? (
          <p className="text-gray-500">No test results yet. Click a button above to start testing.</p>
        ) : (
          results.map((result, index) => (
            <div 
              key={index} 
              className={`mb-2 p-2 rounded text-sm ${
                result.type === 'success' ? 'bg-green-100 text-green-800' :
                result.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              <span className="font-mono text-xs text-gray-500">[{result.timestamp}]</span>
              <br />
              {result.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}