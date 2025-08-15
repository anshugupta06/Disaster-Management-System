import React from 'react';
import './HelpPage.css'; // Import the CSS for this component

const HelpPage = () => {
  return (
    <div className="help-page-container">
      <div className="help-card">
        <h1>❓ Help & Support</h1>
        <p>Find answers to common questions or get in touch with our support team.</p>

        <section className="faq-section">
          <h2>Frequently Asked Questions (FAQs)</h2>
          <div className="faq-item">
            <h3>Q: What is the purpose of this Disaster Management System?</h3>
            <p>A: This system aims to provide a centralized platform for managing disaster-related resources, volunteers, and historical risk analysis to aid in preparedness and response efforts.</p>
          </div>
          <div className="faq-item">
            <h3>Q: How is the "Historical Risk Analyzer" data generated?</h3>
            <p>A: The Historical Risk Analyzer processes historical disaster data from the provided `india_disaster_data.csv` file. It identifies locations and disaster types from the text descriptions and provides insights based on past occurrences.</p>
          </div>
          <div className="faq-item">
            <h3>Q: How can I report a new incident?</h3>
            <p>A: You can report a new incident through the "Alerts" section. There will be a form where you can submit details about the disaster, its location, and severity.</p>
          </div>
          <div className="faq-item">
            <h3>Q: What is the "Heatmap" showing?</h3>
            <p>A: The Heatmap visualizes historical disaster zones across India. Locations are marked with colors indicating the most prevalent disaster type historically recorded in that area, based on the `india_disaster_data.csv`.</p>
          </div>
        </section>

        <section className="contact-section">
          <h2>📞 Contact Us</h2>
          <p>If you have further questions or need assistance, please reach out to us:</p>
          <ul>
            <li><strong>Email:</strong> support@disastermanagement.com</li>
            <li><strong>Phone:</strong> +91 12345 67890</li>
            <li><strong>Address:</strong> Disaster Management HQ, New Delhi, India</li>
          </ul>
          <p>Our support team is available during business hours.</p>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;
