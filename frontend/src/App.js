import './App.css';

const features = [
  'Securely store horse show, trail ride, and barn photos',
  'Organize albums with tags, dates, and favorite moments',
  'Share memorable shots with friends, trainers, and family'
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">PicPals Horses</p>
        <h1>Keep every horse memory close at hand.</h1>
        <p className="summary">
          A simple photo home for your favorite rides, ribbons, and barn-day
          moments.
        </p>
        <ul className="feature-list">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
