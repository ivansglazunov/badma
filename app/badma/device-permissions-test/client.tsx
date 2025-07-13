"use client";

import React, { useState, useEffect } from 'react';
import { 
  useDeviceMotionPermissions, 
  useDeviceOrientationPermissions,
  useDevicePermissions 
} from '../../../hooks/device-permissions';

export function DevicePermissionsTestClient() {
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Test auto-request permissions
  const motionPermissionsAuto = useDeviceMotionPermissions(true);
  const orientationPermissionsAuto = useDeviceOrientationPermissions(true);
  
  // Test manual permissions
  const motionPermissionsManual = useDevicePermissions('motion', { autoRequest: false });
  const orientationPermissionsManual = useDevicePermissions('orientation', { autoRequest: false });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog(`Auto Motion Permission: ${motionPermissionsAuto.permissionStatus}`);
  }, [motionPermissionsAuto.permissionStatus]);

  useEffect(() => {
    addLog(`Auto Orientation Permission: ${orientationPermissionsAuto.permissionStatus}`);
  }, [orientationPermissionsAuto.permissionStatus]);

  useEffect(() => {
    addLog(`Manual Motion Permission: ${motionPermissionsManual.permissionStatus}`);
  }, [motionPermissionsManual.permissionStatus]);

  useEffect(() => {
    addLog(`Manual Orientation Permission: ${orientationPermissionsManual.permissionStatus}`);
  }, [orientationPermissionsManual.permissionStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'bg-green-500';
      case 'denied': return 'bg-red-500';
      case 'requesting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Device Permissions Test</h1>
          <p className="text-xl text-gray-300">
            Testing auto-request and manual permission handling
          </p>
        </div>

        {/* Auto-Request Permissions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Auto-Request Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Motion (Auto)</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Supported:</span>
                  <span className={motionPermissionsAuto.isSupported ? 'text-green-400' : 'text-red-400'}>
                    {motionPermissionsAuto.isSupported ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(motionPermissionsAuto.permissionStatus)}`}>
                    {motionPermissionsAuto.permissionStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Orientation (Auto)</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Supported:</span>
                  <span className={orientationPermissionsAuto.isSupported ? 'text-green-400' : 'text-red-400'}>
                    {orientationPermissionsAuto.isSupported ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(orientationPermissionsAuto.permissionStatus)}`}>
                    {orientationPermissionsAuto.permissionStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Permissions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Manual Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Motion (Manual)</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span>Supported:</span>
                  <span className={motionPermissionsManual.isSupported ? 'text-green-400' : 'text-red-400'}>
                    {motionPermissionsManual.isSupported ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(motionPermissionsManual.permissionStatus)}`}>
                    {motionPermissionsManual.permissionStatus}
                  </span>
                </div>
              </div>
              <button
                onClick={motionPermissionsManual.requestPermission}
                disabled={motionPermissionsManual.permissionStatus === 'requesting'}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {motionPermissionsManual.permissionStatus === 'requesting' ? 'Requesting...' : 'Request Permission'}
              </button>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Orientation (Manual)</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span>Supported:</span>
                  <span className={orientationPermissionsManual.isSupported ? 'text-green-400' : 'text-red-400'}>
                    {orientationPermissionsManual.isSupported ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(orientationPermissionsManual.permissionStatus)}`}>
                    {orientationPermissionsManual.permissionStatus}
                  </span>
                </div>
              </div>
              <button
                onClick={orientationPermissionsManual.requestPermission}
                disabled={orientationPermissionsManual.permissionStatus === 'requesting'}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {orientationPermissionsManual.permissionStatus === 'requesting' ? 'Requesting...' : 'Request Permission'}
              </button>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Permission Logs</h2>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              {showLogs ? 'Hide' : 'Show'} Logs
            </button>
          </div>
          {showLogs && (
            <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="space-y-1 text-sm font-mono">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Instructions</h2>
          <ul className="space-y-2 text-sm">
            <li>• The <strong>Auto-Request</strong> permissions should automatically request on page load</li>
            <li>• The <strong>Manual</strong> permissions require button clicks to request</li>
            <li>• On iOS Safari, you may need to interact with the page first before permissions can be requested</li>
            <li>• Check the logs to see permission status changes</li>
            <li>• Open browser console to see additional debug information</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 