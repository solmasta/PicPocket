import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HorseFeatures from './HorseFeatures';

function HorseProfile({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/horses/${id}`, {
      headers: { Authorization: 'Bearer ' + user.token },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load horse profile');
        return res.json();
      })
      .then((data) => {
        setHorse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, user.token]);

  if (loading) return <p>Loading profile…</p>;
  if (error) return <p>Error: {error}</p>;
  if (!horse) return null;

  return (
    <div className="horse-profile">
      <button onClick={() => navigate(-1)}>← Back</button>
      <h2>{horse.name}</h2>
      {horse.photoUrl && <img src={horse.photoUrl} alt={horse.name} />}
      <p><strong>Breed:</strong> {horse.breed}</p>
      <p><strong>Age:</strong> {horse.age}</p>
      <p><strong>Owner:</strong> {horse.owner}</p>
      <HorseFeatures features={horse.features} />
    </div>
  );
}

export default HorseProfile;
