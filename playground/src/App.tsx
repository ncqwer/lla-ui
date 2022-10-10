import { SharedScope, SSRSupportWrapper } from '@lla-ui/signal';
import { ColorThemeProvider } from '@lla-ui/theme';

import Routes from './pages/routes';

function App() {
  return (
    <SSRSupportWrapper>
      <SharedScope scopeName="global">
        <ColorThemeProvider>
          <Routes></Routes>
        </ColorThemeProvider>
      </SharedScope>
    </SSRSupportWrapper>
  );
}

export default App;
