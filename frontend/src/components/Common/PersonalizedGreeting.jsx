import React, { useState, useEffect } from 'react';
import './PersonalizedGreeting.css';

const TIME_GREETINGS = {
  morning: { text: 'Good morning', emoji: '🌅' },
  afternoon: { text: 'Good afternoon', emoji: '☀️' },
  evening: { text: 'Good evening', emoji: '🌙' },
  night: { text: 'Hi there', emoji: '✨' },
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return TIME_GREETINGS.morning;
  if (hour >= 12 && hour < 17) return TIME_GREETINGS.afternoon;
  if (hour >= 17 && hour < 21) return TIME_GREETINGS.evening;
  return TIME_GREETINGS.night;
};

function PersonalizedGreeting({ user, photoCount }) {
  const [greeting, setGreeting] = useState(getTimeGreeting);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  const userName = user?.name?.split(' ')[0] || 'Friend';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const messages = [
    { text: `Ready to make some memories today?`, emoji: '📸' },
    { text: `Your photos are waiting!`, emoji: '🖼️' },
    { text: `Let's find some magical moments!`, emoji: '✨' },
    { text: `Time to organize your treasures!`, emoji: '💎' },
    { text: `Your gallery is looking great!`, emoji: '🌟' },
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  if (!show) return null;

  return (
    <div className={`personalized-greeting ${show ? 'visible' : ''}`}>
      <div className="greeting-content">
        <span className="greeting-emoji">{greeting.emoji}</span>
        <div className="greeting-text">
          <span className="greeting-time">{greeting.text}, {displayName}!</span>
          <span className="greeting-message">{randomMessage.text} {randomMessage.emoji}</span>
        </div>
      </div>
      {photoCount > 0 && (
        <div className="greeting-stats">
          <span className="stat-item">
            <span className="stat-icon">📷</span>
            <span className="stat-value">{photoCount}</span>
            <span className="stat-label">photos</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default PersonalizedGreeting;