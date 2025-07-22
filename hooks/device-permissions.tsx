import { useCallback, useRef, useState, useEffect } from 'react';
import Debug from '../lib/debug';

const debug = Debug('device-permissions');

export type DevicePermissionType = 'motion' | 'orientation';
export type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'requesting';

interface DevicePermissionOptions {
  autoRequest?: boolean;
}

interface DevicePermissionHookReturn {
  permissionStatus: PermissionStatus;
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
  needsUserInteraction: boolean;
  hasTriedAutoRequest: boolean;
}

export const useDevicePermissions = (
  type: DevicePermissionType, 
  options: DevicePermissionOptions = {}
): DevicePermissionHookReturn => {
  const { autoRequest = false } = options;
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [hasTriedAutoRequest, setHasTriedAutoRequest] = useState(false);
  const permissionGrantedRef = useRef<boolean>(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    let EventConstructor: any;
    let permissionName: string;

    if (type === 'motion') {
      EventConstructor = typeof DeviceMotionEvent !== 'undefined' ? DeviceMotionEvent : undefined;
      permissionName = 'device motion';
    } else {
      EventConstructor = typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : undefined;
      permissionName = 'device orientation';
    }

    if (EventConstructor && 'requestPermission' in EventConstructor) {
      setPermissionStatus('requesting');
      try {
        const permission = await EventConstructor.requestPermission();
        const granted = permission === 'granted';
        permissionGrantedRef.current = granted;
        setPermissionStatus(granted ? 'granted' : 'denied');
        
        if (!granted) {
          setNeedsUserInteraction(true);
        }
        
        return granted;
      } catch (error) {
        console.error(`Error requesting ${permissionName} permission:`, error);
        setPermissionStatus('denied');
        setNeedsUserInteraction(true);
        return false;
      }
    } else {
      // On non-iOS devices, permission is usually granted by default
      permissionGrantedRef.current = true;
      setPermissionStatus('granted');
      return true;
    }
  }, [type]);

  const isSupported = type === 'motion' 
    ? typeof DeviceMotionEvent !== 'undefined'
    : typeof DeviceOrientationEvent !== 'undefined';

  // Helper function to detect iOS
  const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };

  // Auto-request permission on mount if enabled
  useEffect(() => {
    if (autoRequest && isSupported && typeof window !== 'undefined' && !hasTriedAutoRequest) {
      debug(`Auto-requesting ${type} permission...`);
      setHasTriedAutoRequest(true);
      
      // On iOS, we need user interaction first
      if (isIOS()) {
        debug(`iOS detected, setting needsUserInteraction for ${type}`);
        setNeedsUserInteraction(true);
        return;
      }
      
      // Small delay to ensure component is mounted
      const timer = setTimeout(async () => {
        try {
          const granted = await requestPermission();
          debug(`Auto-request result for ${type}:`, granted);
        } catch (error) {
          debug(`Auto-request failed for ${type}:`, error);
          setNeedsUserInteraction(true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      debug(`Auto-request skipped for ${type}:`, {
        autoRequest,
        isSupported,
        hasWindow: typeof window !== 'undefined',
        hasTriedAutoRequest
      });
    }
  }, [autoRequest, isSupported, requestPermission, type, hasTriedAutoRequest]);

  return {
    permissionStatus,
    requestPermission,
    isSupported,
    needsUserInteraction,
    hasTriedAutoRequest,
  };
};

// Convenience hooks with auto-request enabled
export const useDeviceMotionPermissions = (autoRequest: boolean = true) => 
  useDevicePermissions('motion', { autoRequest });

export const useDeviceOrientationPermissions = (autoRequest: boolean = true) => 
  useDevicePermissions('orientation', { autoRequest }); 