type IdleTaskWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
};

interface ScheduleIdleTaskOptions {
  delay?: number;
  timeout?: number;
}

export const scheduleIdleTask = (
  callback: () => void,
  { delay = 0, timeout = 800 }: ScheduleIdleTaskOptions = {},
) => {
  if (typeof window === 'undefined') return () => undefined;

  const idleWindow = window as IdleTaskWindow;
  let cancelled = false;
  let delayHandle: number | undefined;
  let frameHandle: number | undefined;
  let idleHandle: number | undefined;

  const run = () => {
    if (!cancelled) callback();
  };

  const queueIdle = () => {
    if (cancelled) return;

    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(run, { timeout });
      return;
    }

    frameHandle = window.requestAnimationFrame(run);
  };

  if (delay > 0) {
    delayHandle = window.setTimeout(queueIdle, delay);
  } else {
    frameHandle = window.requestAnimationFrame(queueIdle);
  }

  return () => {
    cancelled = true;

    if (delayHandle !== undefined) window.clearTimeout(delayHandle);
    if (frameHandle !== undefined) window.cancelAnimationFrame(frameHandle);
    if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
  };
};
