import { AppRouter } from './app/AppRouter';
import { AppHeader } from './components/common/AppHeader';
import { AppTabNavigation } from './components/common/AppTabNavigation';

function App() {
  return (
    <div className="app-frame">
      <AppHeader />
      <div className="app-frame__body">
        <AppTabNavigation />
        <div className="app-frame__content">
          <AppRouter />
        </div>
      </div>
    </div>
  );
}

export default App;
