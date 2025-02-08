import './App.css';
import Home from './screens/Home';
import PilotsList from './screens/PilotsList';
import BottomNavigation from "./components/BottomNavigation";

function App() {
  return (
    <div className="App" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PilotsList />
      <BottomNavigation />
    </div>
  );
}

export default App;
