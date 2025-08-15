import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import "./homepage.css";

function Homepage() {
  const navigate = useNavigate(); // Initialize the navigate hook

  const navigateTo = (path) => {
    navigate(path); // Use navigate for routing
  };

  return (
    <div className="homepage-container">
      {/* This is the new header, which is full-width and styled differently */}
      <header className="main-header">
        <h1>DisasterSphere</h1> {/* Updated title for a modern look */}
        <p>Intelligent Preparedness. Real-time Response.</p> {/* Tagline */}
      </header>

      <section className="panels-grid">
        {/* Panel for AI-Based Disaster Prediction */}
        <div className="panel glassmorphism-effect" onClick={() => navigateTo("/historical-risk")}>
          <span className="panel-icon">📊</span>
          <h2>AI-Based Disaster Prediction</h2>
          <p>Leverage machine learning to forecast disasters and classify risk zones with precision.</p>
        </div>

        {/* Panel for Severity Heatmap */}
        <div className="panel glassmorphism-effect" onClick={() => navigateTo("/heatmap")}>
          <span className="panel-icon">🗺️</span>
          <h2>Severity Heatmap</h2>
          <p>Visualize real-time affected areas and severity levels on interactive maps.</p>
        </div>

        {/* Panel for Resource Dashboard */}
        <div className="panel glassmorphism-effect" onClick={() => navigateTo("/dashboard")}>
          <span className="panel-icon">🗄️</span>
          <h2>Resource Dashboard</h2>
          <p>Efficiently track, allocate, and manage critical resources and volunteer teams.</p>
        </div>

        {/* Panel for Help & Alert System (Existing panel) */}
        <div className="panel glassmorphism-effect" onClick={() => navigateTo("/alerts")}>
          <span className="panel-icon">🚨</span>
          <h2>Help & Alert System</h2>
          <p>Send instant alerts and streamline help requests through automated channels.</p>
        </div>

        {/* Panel for Alert & Help Request (Existing panel) */}
        <div className="panel glassmorphism-effect" onClick={() => navigateTo("/alerts")}>
          <span className="panel-icon">📢</span>
          <h2>Alert & Help Request</h2>
          <p>Send instant alerts and streamline help requests through automated channels.</p>
        </div>

        {/* NEW: Panel for Chatbot */}
        <div className="panel glassmorphism-effect" onClick={() => navigateTo("/chatbot")}>
          <span className="panel-icon">💬</span>
          <h2>Chatbot</h2>
          <p>Communicate directly with our AI assistant for guidance and quick information.</p>
        </div>

      </section>

      <footer className="main-footer">
        <p>© 2025 DisasterSphere | Powered by Team HirePerfect</p>
      </footer>
    </div>
  );
}

export default Homepage;
