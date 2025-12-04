import React, { useState, useEffect } from 'react';

export default function QueueItem({ item, getItemImage, getDummyImage }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      if (!item.startTime || !item.duration) return 0;
      const now = Date.now() / 1000;
      const elapsed = now - item.startTime;
      const durationSec = item.duration / 1000;
      return Math.min(100, Math.max(0, (elapsed / durationSec) * 100));
    };

    // Initial calculation
    setProgress(calculateProgress());

    const interval = setInterval(() => {
      const newProgress = calculateProgress();
      setProgress(newProgress);
      
      // Stop updating if complete
      if (newProgress >= 100) {
        clearInterval(interval);
      }
    }, 1000); // Update every 1 second

    return () => clearInterval(interval);
  }, [item.startTime, item.duration]);

  return (
    <div className="queue-item fade-in">
      <div className="queue-icon-frame">
        <img 
          src={getItemImage(item.item)} 
          className="item-icon opacity-80" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getDummyImage(item.item);
          }}
        />
      </div>
      <div className="queue-info">
        <div className="queue-details">
          <span className="truncate">{item.label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
