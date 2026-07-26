/**
 * Прокручивает к элементу ТОЛЬКО его собственный контейнер прокрутки.
 *
 * Родной `Element.scrollIntoView()` для этого не годится: он идёт вверх по
 * дереву и подкручивает КАЖДОГО предка, включая те, что скрыты
 * `overflow: hidden` (они прокручиваются программно, просто без полосы) и саму
 * страницу. Пока панель инспектора выезжает, нужный пункт ещё за правым краем
 * — и браузер честно тащит туда всю раскладку: интерфейс уезжает вбок, а после
 * анимации возвращается. Это и есть «дёрганье при открытии по пункту»;
 * открытие без якоря (из плашки договора) его не даёт, потому что там
 * `scrollIntoView` не вызывается вовсе.
 */
export function scrollIntoViewWithin(node: HTMLElement, options?: { behavior?: ScrollBehavior }): void {
  const scroller = findScrollParent(node);
  if (!scroller) return;

  const nodeRect = node.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  // Цель — в центр видимой области контейнера (block: 'center' у оригинала).
  const delta = nodeRect.top + nodeRect.height / 2 - (scrollerRect.top + scrollerRect.height / 2);

  scroller.scrollBy({ top: delta, behavior: options?.behavior ?? 'auto' });
}

/** Ближайший предок, который реально прокручивается по вертикали. */
function findScrollParent(node: HTMLElement): HTMLElement | null {
  let el = node.parentElement;
  while (el) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) return el;
    el = el.parentElement;
  }
  return null;
}
