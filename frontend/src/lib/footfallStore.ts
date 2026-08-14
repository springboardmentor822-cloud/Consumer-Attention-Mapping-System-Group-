type Listener = (currentCount: number) => void;

class FootfallStore {
  private currentCount: number = 0;
  private listeners: Set<Listener> = new Set();

  reportDetection(count: number) {
    if (this.currentCount === 0) {
      this.currentCount = count;
    } else {
      this.currentCount = Math.round((this.currentCount * 0.8) + (count * 0.2));
    }
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.currentCount);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.currentCount));
  }
}

export const footfallStore = new FootfallStore();