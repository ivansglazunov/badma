"use client";

import React, { useState, useEffect } from 'react';
import { useShock } from '../../../hooks/shock';

export function ShockHookClient() {
  const [isGlowing, setIsGlowing] = useState(false);
  const [shockData, setShockData] = useState<{
    magnitude: number;
    acceleration: { x: number; y: number; z: number };
    timestamp: number;
  } | null>(null);
  const [shockCount, setShockCount] = useState(0);
  const [lastShockTime, setLastShockTime] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');

  const { requestPermission, isSupported, permissionGranted } = useShock(
    (data) => {
      // Trigger glow effect
      setIsGlowing(true);
      setShockData(data);
      setShockCount(prev => prev + 1);
      setLastShockTime(new Date().toLocaleTimeString());

      // Auto fade after 100ms
      setTimeout(() => {
        setIsGlowing(false);
      }, 100);
    },
    {
      threshold: 15, // Sensitivity to shake
      cooldown: 300, // 300ms between shocks
      requirePermission: true
    }
  );

  const handleRequestPermission = async () => {
    setPermissionStatus('requesting');
    try {
      const granted = await requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermissionStatus('denied');
    }
  };

  // Update permission status
  useEffect(() => {
    if (permissionGranted) {
      setPermissionStatus('granted');
    }
  }, [permissionGranted]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Shock Hook Demo</h1>
        <p className="text-xl text-gray-300 mb-2">
          Shake your device to trigger the shock effect!
        </p>
        <p className="text-sm text-gray-400">
          The crystal will glow bright when you shake your device and then fade smoothly
        </p>
      </div>

      {/* Glowing Crystal/Object */}
      <div className="mb-12 relative">
        <div 
          className={`
            w-48 h-48 rounded-full relative
            transition-all duration-75 ease-out
            ${isGlowing 
              ? 'bg-cyan-400 shadow-[0_0_100px_20px_rgba(34,211,238,0.8)] scale-110' 
              : 'bg-gray-700 shadow-lg scale-100'
            }
          `}
          style={{
            background: isGlowing 
              ? 'radial-gradient(circle, #06b6d4, #0891b2, #0e7490)'
              : 'radial-gradient(circle, #374151, #1f2937, #111827)',
            transition: isGlowing 
              ? 'all 75ms ease-out'
              : 'all 2000ms cubic-bezier(0.23, 1, 0.320, 1)', // Slow fade out
          }}
        >
          {/* Inner glow */}
          <div 
            className={`
              absolute inset-4 rounded-full
              transition-all duration-75
              ${isGlowing 
                ? 'bg-white/30 shadow-inner' 
                : 'bg-gray-600/20'
              }
            `}
            style={{
              transition: isGlowing 
                ? 'all 75ms ease-out'
                : 'all 2000ms cubic-bezier(0.23, 1, 0.320, 1)',
            }}
          />
          
          {/* Center core */}
          <div 
            className={`
              absolute inset-16 rounded-full
              transition-all duration-75
              ${isGlowing 
                ? 'bg-white shadow-lg' 
                : 'bg-gray-500'
              }
            `}
            style={{
              transition: isGlowing 
                ? 'all 75ms ease-out'
                : 'all 2000ms cubic-bezier(0.23, 1, 0.320, 1)',
            }}
          />
        </div>
      </div>

      {/* Status Info */}
      <div className="mb-8 p-6 bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700 max-w-md w-full">
        <h3 className="text-white text-lg font-medium mb-4 text-center">Shock Status</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Supported:</span>
            <span className={isSupported ? 'text-green-400' : 'text-red-400'}>
              {isSupported ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Permission:</span>
            <span className={
              permissionStatus === 'granted' ? 'text-green-400' :
              permissionStatus === 'denied' ? 'text-red-400' :
              permissionStatus === 'requesting' ? 'text-yellow-400' :
              'text-gray-400'
            }>
              {permissionStatus === 'unknown' ? '❓ Unknown' :
               permissionStatus === 'granted' ? '✅ Granted' :
               permissionStatus === 'denied' ? '❌ Denied' :
               '⏳ Requesting...'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Shock Count:</span>
            <span className="text-white font-mono">{shockCount}</span>
          </div>
          
          {lastShockTime && (
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Last Shock:</span>
              <span className="text-white font-mono text-xs">{lastShockTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shock Data */}
      {shockData && (
        <div className="mb-8 p-4 bg-gray-900/50 rounded-lg backdrop-blur-sm border border-gray-700 max-w-md w-full">
          <h3 className="text-white text-sm font-medium mb-3">Last Shock Data</h3>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
            <div>
              <p><strong>Magnitude:</strong> {shockData.magnitude.toFixed(2)}</p>
              <p><strong>X:</strong> {shockData.acceleration.x.toFixed(2)}</p>
            </div>
            <div>
              <p><strong>Y:</strong> {shockData.acceleration.y.toFixed(2)}</p>
              <p><strong>Z:</strong> {shockData.acceleration.z.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Request Button */}
      {isSupported && permissionStatus !== 'granted' && (
        <div className="text-center">
          <p className="text-yellow-400 text-sm mb-4">
            📱 Grant motion permission to detect device shakes
          </p>
          <button
            onClick={handleRequestPermission}
            disabled={permissionStatus === 'requesting'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {permissionStatus === 'requesting' ? 'Requesting...' : 'Grant Motion Permission'}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 text-center text-gray-400 text-xs max-w-md">
        <p>
          <strong>How to use:</strong> Hold your device and give it a quick shake or tap.
          The crystal will instantly glow bright and then slowly fade back to normal.
          Works best on mobile devices with motion sensors.
        </p>
      </div>
    </div>
  );
} 