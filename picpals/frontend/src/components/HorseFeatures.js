import React from 'react';

function HorseFeatures({ features }) {
  if (!features || features.length === 0) {
    return <p>No features listed.</p>;
  }

  return (
    <div className="horse-features">
      <h3>Features</h3>
      <ul>
        {features.map((feature, index) => (
          <li key={index}>
            <strong>{feature.label}:</strong> {feature.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HorseFeatures;
