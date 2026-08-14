export interface ShelfEvent {
  timestamp: number;
  cameraId: number;
  type: 'motion_spike' | 'sustained_dwell';
  intensity: number;
}

type Listener = (events: ShelfEvent[]) => void;

class ShelfEventStore {
  private events: ShelfEvent[] = [];
  private listeners: Set<Listener> = new Set();

  logEvent(event: ShelfEvent) {
    this.events.unshift(event);
    if (this.events.length > 50) this.events.pop();
    this.notify();
  }

  getRecentEvents() {
    return this.events;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.events);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.events));
  }
}

export const shelfEventStore = new ShelfEventStore();