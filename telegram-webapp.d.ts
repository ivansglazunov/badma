// Telegram WebApp API type definitions

interface TelegramWebAppHapticFeedback {
  /**
   * A method that tells that an impact occurred. The Telegram app may play the appropriate haptics based on style value passed.
   * @param style - The style of impact occurred. Can be one of these values:
   *   - light, indicates a collision between small or lightweight UI objects,
   *   - medium, indicates a collision between medium-sized or medium-weight UI objects,
   *   - heavy, indicates a collision between large or heavyweight UI objects,
   *   - rigid, indicates a collision between hard or inflexible UI objects,
   *   - soft, indicates a collision between soft or flexible UI objects.
   */
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;

  /**
   * A method tells that a task or action has succeeded, failed, or produced a warning. The Telegram app may play the appropriate haptics based on type value passed.
   * @param type - The type of notification feedback. Can be one of these values:
   *   - error, indicates that a task or action has failed,
   *   - success, indicates that a task or action has completed successfully,
   *   - warning, indicates that a task or action produced a warning.
   */
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;

  /**
   * A method tells that the user has changed a selection. The Telegram app may play the appropriate haptics.
   */
  selectionChanged(): void;
}

interface TelegramWebApp {
  /**
   * An object for controlling haptic feedback.
   */
  HapticFeedback: TelegramWebAppHapticFeedback;
  
  // Other WebApp properties can be added here as needed
  [key: string]: any;
}

interface TelegramObject {
  WebApp: TelegramWebApp;
  [key: string]: any;
}

declare global {
  interface Window {
    Telegram?: TelegramObject;
  }
}

export {};
