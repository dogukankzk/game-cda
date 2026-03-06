import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import GameScreen from './components/GameScreen';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameScreen />
  </StrictMode>,
);
