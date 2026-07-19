import React, { useState } from 'react';
import { getCurrentPosition, reverseGeocode, formatCoordinates } from '../../utils/geolocation';
import './LocationTag.css';

function LocationTag({ enabled, onToggle }) {
  const [loading, setLoading] = useState(false);
  const [previewLocation, setPreviewLocation] = useState(null);
  const [error, setError] = useState(null);

  const handleToggle = async (checked) => {
    onToggle(checked);
    setError(null);

    if (checked) {
      setLoading(true);
      try {
        const coords = await getCurrentPosition();
        const name = await reverseGeocode(coords.lat, coords.lng);
        setPreviewLocation({ ...coords, name });
      } catch (err) {
        setError(err.message);
        onToggle(false);
      } finally {
        setLoading(false);
      }
    } else {
      setPreviewLocation(null);
    }
  };

  return (
    <div className="location-tag">
      <div className="location-toggle-row">
        <label className="location-label" htmlFor="location-toggle">
          📍 Tag with Location
        </label>
        <label className="toggle-switch">
          <input
            id="location-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={loading}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {loading && (
        <p className="location-status">Getting your location...</p>
      )}

      {error && (
        <p className="location-error">⚠️ {error}</p>
      )}

      {previewLocation && enabled && (
        <div className="location-preview">
          <p className="location-name">📍 {previewLocation.name}</p>
          <p className="location-coords">
            {formatCoordinates(previewLocation.lat, previewLocation.lng)}
          </p>
        </div>
      )}
    </div>
  );
}

export default LocationTag;
