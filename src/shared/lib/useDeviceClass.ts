import { useEffect, useState } from 'react';
import { classifyViewport, type DeviceClass } from './breakpoints';

/**
 * Класс устройства по текущим размерам окна, с пересчётом при изменении.
 *
 * Не через `useMediaQuery`: там пришлось бы держать три подписки и сводить их
 * ответы, а классы взаимоисключающие. Здесь одна подписка на `resize` и одна
 * чистая функция `classifyViewport`, которую можно проверить тестами без
 * браузера.
 *
 * `visualViewport` слушаем отдельно: на телефоне открытая клавиатура меняет
 * именно его, а `resize` окна при этом может не прийти.
 */
export function useDeviceClass(): DeviceClass {
  const [device, setDevice] = useState<DeviceClass>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return classifyViewport(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    function update() {
      setDevice(classifyViewport(window.innerWidth, window.innerHeight));
    }

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return device;
}
