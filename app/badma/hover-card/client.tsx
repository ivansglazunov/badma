"use client";

import React, { useState, useEffect } from 'react';
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
    force: 1.3,
    maxRotation: 25,
    maxLift: 50,
    title: 'Strong Effect',
    description: 'Dynamic movement',
    gradient: 'from-red-400 to-red-600'
  }
};

export function HoverCardClient() {
  const [activeLevel, setActiveLevel] = useState<ForceLevel>('medium');
  const [useOrientation, setUseOrientation] = useState(true);
  const [orientationSensitivity, setOrientationSensitivity] = useState(0.8);
  const [orientationData, setOrientationData] = useState<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
    timestamp: number;
    isSupported: boolean;
    isActive: boolean;
  } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');
  const [, forceUpdate] = useState({});
  const config = forceConfigs[activeLevel];

  // Force update every second to show live time since last orientation event
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      setPermissionStatus('requesting');
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        setPermissionStatus(permission === 'granted' ? 'granted' : 'denied');
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        setPermissionStatus('denied');
      }
    } else {
      // On non-iOS devices, permission is usually granted by default
      setPermissionStatus('granted');
    }
  };

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
          <p className="text-xl text-gray-300">
            {useOrientation ? 'Tilt your device or move your mouse over the card' : 'Move your mouse over the card below'}
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Current settings:</p>
            <p>Force: {config.force} | Max Rotation: {config.maxRotation}° | Max Lift: {config.maxLift}px</p>
            <p>Device Orientation: {useOrientation ? 'Enabled' : 'Disabled'} | Sensitivity: {orientationSensitivity}</p>
          </div>
        </div>

        {/* Orientation Controls */}
        <div className="mb-6 p-4 bg-gray-800/30 rounded-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 text-white">
            <div className="flex items-center justify-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useOrientation}
                  onChange={(e) => setUseOrientation(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Enable Device Orientation</span>
              </label>
            </div>
            
            {useOrientation && (
              <div className="flex items-center justify-center gap-4">
                <label className="text-sm">Orientation Sensitivity:</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={orientationSensitivity}
                  onChange={(e) => setOrientationSensitivity(parseFloat(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm w-8">{orientationSensitivity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Orientation Diagnostics */}
        {orientationData && (
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg backdrop-blur-sm border border-gray-700">
            <h3 className="text-white text-sm font-medium mb-3">Device Orientation Diagnostics</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-300 mb-4">
              <div>
                <p><strong>Supported:</strong> {orientationData.isSupported ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Active:</strong> {orientationData.isActive ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Permission:</strong> {
                  permissionStatus === 'unknown' ? '❓ Unknown' :
                  permissionStatus === 'granted' ? '✅ Granted' :
                  permissionStatus === 'denied' ? '❌ Denied' :
                  '⏳ Requesting...'
                }</p>
                <p><strong>Timestamp:</strong> {new Date(orientationData.timestamp).toLocaleTimeString()}</p>
              </div>
              <div>
                <p><strong>Alpha:</strong> {orientationData.alpha !== null ? orientationData.alpha.toFixed(2) : 'null'}</p>
                <p><strong>Beta:</strong> {orientationData.beta !== null ? orientationData.beta.toFixed(2) : 'null'}</p>
                <p><strong>Gamma:</strong> {orientationData.gamma !== null ? orientationData.gamma.toFixed(2) : 'null'}</p>
                <p><strong>Last update:</strong> {Math.round((Date.now() - orientationData.timestamp) / 100) / 10}s ago</p>
              </div>
            </div>
            
            {/* Permission Request Button */}
            {orientationData.isSupported && 
             (orientationData.alpha === null || orientationData.beta === null || orientationData.gamma === null) &&
             permissionStatus !== 'granted' && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-yellow-400 text-xs text-center">
                  📱 On iOS Safari, you need to grant permission to access device orientation sensors
                </p>
                <button
                  onClick={requestOrientationPermission}
                  disabled={permissionStatus === 'requesting'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  {permissionStatus === 'requesting' ? 'Requesting...' : 'Grant Orientation Permission'}
                </button>
              </div>
            )}
          </div>
        )}

        <HoverCard 
          force={config.force}
          maxRotation={config.maxRotation}
          maxLift={config.maxLift}
          useDeviceOrientation={useOrientation}
          orientationSensitivity={orientationSensitivity}
          onOrientationData={setOrientationData}
        >
          <div 
            className={`w-[300px] h-[500px] bg-gradient-to-br ${config.gradient} rounded-lg shadow-xl flex items-center justify-center transition-all duration-300`}
          >
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-4">{config.title}</h2>
              <p className="text-lg mb-2">{config.description}</p>
              <p className="text-sm opacity-70">Force: {config.force}</p>
              
              <div className="mt-8 space-y-2 text-xs opacity-60">
                <p>• Tilt follows mouse or device orientation</p>
                <p>• Card lifts on hover/tilt</p>
                <p>• Automatic size detection</p>
                <p>• Smooth transitions & inertia</p>
                <p>• Returns to center after tilt</p>
              </div>
            </div>
          </div>
        </HoverCard>

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm max-w-md">
          <p>
            This component uses <code className="bg-gray-800 px-2 py-1 rounded">react-resize-detector</code> for 
            automatic sizing, <code className="bg-gray-800 px-2 py-1 rounded">onMouseMove</code> events for hover effects,
            and <code className="bg-gray-800 px-2 py-1 rounded">DeviceOrientationEvent</code> for tilt detection.
            The card responds to device tilting with inertia - tilt your device and watch it return to center!
          </p>
        </div>
      </div>
    </div>
  );
} 