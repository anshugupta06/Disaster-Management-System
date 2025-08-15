import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css'; // Import the CSS for styling

const Chatbot = () => {
  const [messages, setMessages] = useState([]); // Stores chat history
  const [inputMessage, setInputMessage] = useState(''); // Stores current message input
  const [loading, setLoading] = useState(false); // Indicates if waiting for AI response
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to bottom

  // Scroll to the latest message whenever messages state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    const userMessage = { sender: 'user', text: inputMessage.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setLoading(true); // Start loading indicator

    try {
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!response.ok) {
        // This block will run if the status code is NOT 2xx (e.g., 400, 500)
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // If response.ok is true (status 200 OK)
      const data = await response.json();
      let botResponseText = data.response; // Get the 'response' field from the JSON

      // Handle cases where the AI might return an empty or null response
      if (!botResponseText || botResponseText.trim() === '') {
        botResponseText = "I'm sorry, I couldn't generate a response at this moment. Please try again or rephrase your query.";
      }

      const botMessage = { sender: 'bot', text: botResponseText };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      // Display a user-friendly error message in the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: `Error: ${error.message}. Please check your network or try again.` },
      ]);
    } finally {
      setLoading(false); // Always stop loading indicator
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h1>💬 DisasterSphere Chatbot</h1>
        <p>Your AI assistant for immediate help and information during disasters.</p>
      </div>
      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="chatbot-welcome">
            <p>Hi there! How can I assist you today?</p>
            <p>You can ask for help, report an incident, or inquire about resources.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="message-bubble bot loading">
            <span></span><span></span><span></span>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Element to scroll to */}
      </div>
      <form onSubmit={handleSendMessage} className="chatbot-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
