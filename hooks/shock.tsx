import { useEffect, useRef, useCallback } from 'react';

interface ShockConfig {
  threshold?: number; // Minimum acceleration to trigger shock
  cooldown?: number; // Cooldown period between shocks in ms
  requirePermission?: boolean; // Whether to require motion permission on iOS
}

interface ShockData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  magnitude: number;
  timestamp: number;
}

export const useShock = (
  onShock: (data: ShockData) => void,
  config: ShockConfig = {}
) => {
  const {
    threshold = 15, // Default threshold for shock detection
    cooldown = 300, // 300ms cooldown between shocks
    requirePermission = true
  } = config;

  const lastShockRef = useRef<number>(0);
  const permissionGrantedRef = useRef<boolean>(false);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const now = Date.now();
    
    // Check cooldown
    if (now - lastShockRef.current < cooldown) return;

    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
      return;
    }

    // Calculate magnitude of acceleration
    const magnitude = Math.sqrt(
      acceleration.x * acceleration.x +
      acceleration.y * acceleration.y +
      acceleration.z * acceleration.z
    );

    // Check if magnitude exceeds threshold
    if (magnitude > threshold) {
      lastShockRef.current = now;
      onShock({
        acceleration: {
          x: acceleration.x,
          y: acceleration.y,
          z: acceleration.z
        },
        magnitude,
        timestamp: now
      });
    }
  }, [onShock, threshold, cooldown]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof DeviceMotionEvent !== 'undefined' && 'requestPermission' in DeviceMotionEvent) {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        permissionGrantedRef.current = permission === 'granted';
        return permissionGrantedRef.current;
      } catch (error) {
        console.error('Error requesting device motion permission:', error);
        return false;
      }
    } else {
      // On non-iOS devices, permission is usually granted by default
      permissionGrantedRef.current = true;
      return true;
    }
  }, []);

  useEffect(() => {
    const setupMotionListener = async () => {
      if (typeof window === 'undefined') return;

      // Request permission if required
      if (requirePermission && !permissionGrantedRef.current) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      window.addEventListener('devicemotion', handleMotion, true);

      return () => {
        window.removeEventListener('devicemotion', handleMotion, true);
      };
    };

    const cleanup = setupMotionListener();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [handleMotion, requirePermission, requestPermission]);

  return {
    requestPermission,
    isSupported: typeof DeviceMotionEvent !== 'undefined',
    permissionGranted: permissionGrantedRef.current
  };
}; 