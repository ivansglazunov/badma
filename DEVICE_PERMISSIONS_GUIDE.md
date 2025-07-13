# Device Permissions Guide

## Обзор

В проекте реализована система автоматического запроса разрешений для доступа к датчикам устройства (акселерометр и гироскоп).

## Файлы и компоненты

### 1. `hooks/device-permissions.tsx`
Основной хук для управления разрешениями устройств:

- **`useDevicePermissions(type, options)`** - базовый хук
- **`useDeviceMotionPermissions(autoRequest)`** - для motion датчиков
- **`useDeviceOrientationPermissions(autoRequest)`** - для orientation датчиков

### 2. `app/app.tsx`
Главная страница с автозапросом разрешений:

- Автоматически запрашивает разрешения при загрузке
- Показывает статус разрешений в правом верхнем углу
- Отображает кнопку для ручного запроса при необходимости
- Показывает уведомление-toast о необходимости разрешений

### 3. Тестовые страницы
- `app/badma/device-permissions-test/` - полная демонстрация работы
- `app/badma/hover-card/` - обновлена для нового API
- `app/badma/shock-hook/` - обновлена для нового API

## Как это работает

### Автоматический запрос
```typescript
// Автоматически запрашивает разрешения при монтировании
const motionPermissions = useDeviceMotionPermissions(true);
const orientationPermissions = useDeviceOrientationPermissions(true);
```

### Ручной запрос
```typescript
// Без автозапроса
const motionPermissions = useDeviceMotionPermissions(false);

// Запрос по клику
onClick={() => motionPermissions.requestPermission()}
```

### Статусы разрешений
- `unknown` - начальное состояние
- `requesting` - в процессе запроса
- `granted` - разрешение получено
- `denied` - разрешение отклонено

## Особенности платформ

### iOS Safari
- Требует пользовательского взаимодействия (клик/тап)
- Автоматический запрос не работает
- Система автоматически определяет iOS и показывает кнопку

### Android Chrome
- Автоматический запрос может работать
- Зависит от настроек браузера

### Desktop
- Обычно разрешения предоставляются автоматически
- Motion/Orientation могут не поддерживаться

## Визуальные индикаторы

### Статус в правом верхнем углу
- 📱 - Motion sensor status
- 🧭 - Orientation sensor status
- Цвета: зелёный (granted), красный (denied), жёлтый (requesting), серый (unknown)

### Toast уведомление
- Появляется когда нужно пользовательское взаимодействие
- Автоматически скрывается через 5 секунд
- Можно закрыть вручную

### Кнопка запроса
- Появляется в правом верхнем углу при необходимости
- Запрашивает все нужные разрешения одновременно

## Отладка

Все события логируются в консоль браузера:
- `[DevicePermissions] Auto-requesting...`
- `[DevicePermissions] iOS detected...`
- `[DevicePermissions] Auto-request result...`

## Использование в компонентах

```typescript
import { useDeviceMotionPermissions } from '@/hooks/device-permissions';

export function MyComponent() {
  const {
    permissionStatus,
    requestPermission,
    isSupported,
    needsUserInteraction,
    hasTriedAutoRequest
  } = useDeviceMotionPermissions(true);

  // Использование данных о разрешениях
  if (permissionStatus === 'granted') {
    // Можно использовать датчики
  }
}
```

## Тестирование

1. Откройте `/badma/device-permissions-test` для полного тестирования
2. Проверьте консоль браузера для отладочной информации
3. Протестируйте на разных устройствах и браузерах
4. Убедитесь что кнопки и уведомления работают корректно

## Рекомендации

1. Всегда проверяйте `isSupported` перед использованием
2. Обрабатывайте случай `denied` разрешений
3. Предоставляйте fallback для устройств без датчиков
4. Информируйте пользователя о необходимости разрешений 