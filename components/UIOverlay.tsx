import React from 'react';
import { GestureState, HandData } from '../types';
import { Activity, Move, Maximize, RotateCw } from 'lucide-react';

interface UIOverlayProps {
  handData: HandData | null;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ handData }) => {
  const currentGesture = handData?.gesture || GestureState.IDLE;

  const getStatusColor = (state: GestureState) => {
    switch (state) {
      case GestureState.ZOOM_EXPLODE: return 'text-rose-500 border-rose-500 shadow-rose-500/50';
      case GestureState.ROTATE_XY: return 'text-cyan-500 border-cyan-500 shadow-cyan-500/50';
      case GestureState.ROTATE_Z: return 'text-amber-500 border-amber-500 shadow-amber-500/50';
      default: return 'text-gray-400 border-gray-700';
    }
  };

  const getStatusText = (state: GestureState) => {
    switch (state) {
      case GestureState.ZOOM_EXPLODE: return 'PARTICLE DYNAMICS';
      case GestureState.ROTATE_XY: return 'XY AXIS LOCK';
      case GestureState.ROTATE_Z: return 'Z-ROLL LOCK';
      default: return 'AWAITING INPUT';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-bold tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            Neuro<span className="text-cyan-400">Particle</span>
            </h1>
            <p className="text-gray-400 text-sm tracking-widest mt-1">SPATIAL GESTURE INTERFACE v1.0</p>
        </div>
        
        {/* Current Mode Indicator */}
        <div className={`flex items-center gap-3 px-6 py-3 border-2 bg-black/40 backdrop-blur-md rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${getStatusColor(currentGesture)}`}>
            {currentGesture === GestureState.IDLE && <Activity className="w-6 h-6 animate-pulse" />}
            {currentGesture === GestureState.ZOOM_EXPLODE && <Maximize className="w-6 h-6 animate-pulse" />}
            {currentGesture === GestureState.ROTATE_XY && <Move className="w-6 h-6" />}
            {currentGesture === GestureState.ROTATE_Z && <RotateCw className="w-6 h-6" />}
            
            <div className="flex flex-col">
                <span className="text-xs font-bold opacity-70">SYSTEM STATUS</span>
                <span className="text-xl font-bold tracking-wider">{getStatusText(currentGesture)}</span>
            </div>
        </div>
      </div>

      {/* Instructions / Footer HUD */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-4">
            <InstructionItem 
                active={currentGesture === GestureState.ZOOM_EXPLODE}
                label="ZOOM / EXPLODE"
                desc="Open Hand / Fist"
                color="border-rose-500"
            />
            <InstructionItem 
                active={currentGesture === GestureState.ROTATE_XY}
                label="ROTATE VIEW"
                desc="Index Finger Only"
                color="border-cyan-500"
            />
            <InstructionItem 
                active={currentGesture === GestureState.ROTATE_Z}
                label="ROLL AXIS"
                desc="Index + Middle (Peace)"
                color="border-amber-500"
            />
        </div>

        {/* Live Metrics */}
        <div className="text-right font-mono text-xs text-gray-500">
            {handData && (
                <div className="flex flex-col gap-1">
                   <p>LANDMARKS: {handData.landmarks.length} DETECTED</p>
                   <p>VAL_EXP: {handData.values.expansion.toFixed(2)}</p>
                   <p>ROT_XY: [{handData.values.rotationX.toFixed(2)}, {handData.values.rotationY.toFixed(2)}]</p>
                   <p>ROT_Z: {(handData.values.rotationZ * (180/Math.PI)).toFixed(0)}°</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const InstructionItem = ({ active, label, desc, color }: { active: boolean, label: string, desc: string, color: string }) => (
    <div className={`flex items-center gap-3 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>
        <div className={`w-1 h-8 ${active ? `bg-current ${color.replace('border', 'bg')}` : 'bg-gray-700'}`}></div>
        <div>
            <div className={`text-sm font-bold text-white`}>{label}</div>
            <div className="text-xs text-cyan-200">{desc}</div>
        </div>
    </div>
);

export default UIOverlay;
