import React, { useMemo } from 'react';
import PhotoCard from '../Gallery/PhotoCard';
import './MemoryLane.css';

function MemoryLane({ photos }) {
  const today = new Date();

  const memoriesData = useMemo(() => {
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const currentYear = today.getFullYear();

    const memories = photos.filter((photo) => {
      const date = new Date(photo.uploadDate);
      return (
        date.getMonth() === todayMonth &&
        date.getDate() === todayDay &&
        date.getFullYear() < currentYear
      );
    });

    // Group by year
    const byYear = {};
    memories.forEach((photo) => {
      const year = new Date(photo.uploadDate).getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(photo);
    });

    return Object.entries(byYear)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, yearPhotos]) => ({ year: Number(year), photos: yearPhotos }));
  }, [photos, today.toDateString()]);

  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="memory-lane">
      <div className="memory-header">
        <h2>Memory Lane</h2>
        <p className="memory-subtitle">
          Photos you took on <strong>{formattedDate}</strong> in previous years
        </p>
      </div>

      {memoriesData.length === 0 ? (
        <div className="no-memories">
          <span className="memory-icon">🕰️</span>
          <h3>No memories for today (yet!)</h3>
          <p>
            Once you have photos from previous years on this date, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="memories-timeline">
          {memoriesData.map(({ year, photos: yearPhotos }) => {
            const yearsAgo = today.getFullYear() - year;
            return (
              <div key={year} className="memory-year-group">
                <div className="year-header">
                  <div className="year-badge">
                    <span className="year-number">{year}</span>
                    <span className="years-ago">
                      {yearsAgo} year{yearsAgo !== 1 ? 's' : ''} ago
                    </span>
                  </div>
                  <div className="year-line" />
                </div>
                <div className="memory-photos-grid">
                  {yearPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onDelete={() => {}}
                      onSelect={() => {}}
                      viewMode="grid"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MemoryLane;
