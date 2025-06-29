"use client";

import React, { useState } from 'react';
import { HoverCard } from '../../../components/hover-card';

type ForceLevel = 'low' | 'medium' | 'high';

interface ForceConfig {
  force: number;
  maxRotation: number;
  maxLift: number;
  title: string;
  description: string;
  gradient: string;
}

const forceConfigs: Record<ForceLevel, ForceConfig> = {
  low: {
    force: 0.3,
    maxRotation: 10,
    maxLift: 15,
    title: 'Gentle Effect',
    description: 'Subtle movements',
    gradient: 'from-blue-400 to-blue-600'
  },
  medium: {
    force: 0.6,
    maxRotation: 15,
    maxLift: 30,
    title: 'Medium Effect',
    description: 'Balanced response',
    gradient: 'from-purple-400 to-purple-600'
  },
  high: {
    force: 0.9,
    maxRotation: 20,
    maxLift: 40,
    title: 'Strong Effect',
    description: 'Dynamic movement',
    gradient: 'from-red-400 to-red-600'
  }
};

export function HoverCardClient() {
  const [activeLevel, setActiveLevel] = useState<ForceLevel>('medium');
  const config = forceConfigs[activeLevel];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {/* Navigation Tabs */}
      <div className="mb-12">
        <nav className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg backdrop-blur-sm">
          {Object.keys(forceConfigs).map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level as ForceLevel)}
              className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeLevel === level
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* HoverCard Demo */}
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">HoverCard Demo</h1>
          <p className="text-xl text-gray-300">Move your mouse over the card below</p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Current settings:</p>
            <p>Force: {config.force} | Max Rotation: {config.maxRotation}° | Max Lift: {config.maxLift}px</p>
          </div>
        </div>

        <HoverCard 
          force={config.force}
          maxRotation={config.maxRotation}
          maxLift={config.maxLift}
        >
          <div 
            className={`w-[300px] h-[500px] bg-gradient-to-br ${config.gradient} rounded-lg shadow-xl flex items-center justify-center transition-all duration-300`}
          >
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-4">{config.title}</h2>
              <p className="text-lg mb-2">{config.description}</p>
              <p className="text-sm opacity-70">Force: {config.force}</p>
              
              <div className="mt-8 space-y-2 text-xs opacity-60">
                <p>• Tilt follows mouse movement</p>
                <p>• Card lifts on hover</p>
                <p>• Automatic size detection</p>
                <p>• Smooth transitions</p>
              </div>
            </div>
          </div>
        </HoverCard>

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm max-w-md">
          <p>
            This component uses <code className="bg-gray-800 px-2 py-1 rounded">react-resize-detector</code> to 
            automatically adjust to content size and <code className="bg-gray-800 px-2 py-1 rounded">onMouseMove</code> events 
            for smooth hover effects.
          </p>
        </div>
      </div>
    </div>
  );
} 