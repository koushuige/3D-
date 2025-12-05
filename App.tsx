import React, { useState } from 'react';
import ParticleScene from './components/ParticleScene';
import HandManager from './components/HandManager';
import UIOverlay from './components/UIOverlay';
import { HandData } from './types';

const App: React.FC = () => {
  const [handData, setHandData] = useState<HandData | null>(null);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene Layer */}
      <ParticleScene handData={handData} />
      
      {/* UI & HUD Layer */}
      <UIOverlay handData={handData} />
      
      {/* Logic Layer (Invisible/Minimally visible) */}
      <HandManager onHandUpdate={setHandData} />
      
      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
    </div>
  );
};

export default App;
