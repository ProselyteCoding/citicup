import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/RiskSignals/RiskSignals';
import Home from './pages/Home/Home';
import OneClickDecision from './pages/OneClickDecision/OneClickDecision'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/RiskSignals" element={<Dashboard />} />
        <Route path="/OneClickDecision" element={<OneClickDecision />} />
      </Routes>
    </Router>
  );
}

export default App;
