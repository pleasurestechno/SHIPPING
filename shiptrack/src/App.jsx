import './index.css'
import ShippingDashboard from './components/ShippingDashboard';

// Supabase client setup - IMPORTANT: The actual client MUST be passed as a prop
// because the component needs to be fully self-contained without direct access
// to the global supabase instance in the default vite setup.
import { supabase } from './supabaseClient'; 

function App() {
  return (
    <div className="App bg-gradient-to-br from-blue-500 to-blue-700 min-h-screen flex items-center justify-center p-4">
      <ShippingDashboard supabaseClient={supabase} />
    </div>
  );
}

export default App;
