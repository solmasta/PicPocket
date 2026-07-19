import './App.css';
import AuthStatus from './components/AuthStatus';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>PicPocket</h1>
        <AuthStatus />
      </header>
    </div>
  );
}

export default App;
