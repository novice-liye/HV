// ============================================================
// EventBus - 模块间通信机制
// 发布/订阅模式，支持模块间松耦合通信
// ============================================================

type EventCallback = (payload?: unknown) => void;

interface Subscription {
  callback: EventCallback;
  source?: string;
}

class EventBus {
  private listeners: Map<string, Set<Subscription>> = new Map();

  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param callback 回调函数
   * @param source 来源模块标识（可选）
   */
  on(eventType: string, callback: EventCallback, source?: string): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const sub: Subscription = { callback, source };
    this.listeners.get(eventType)!.add(sub);

    // 返回取消订阅函数
    return () => {
      const subs = this.listeners.get(eventType);
      if (subs) {
        subs.delete(sub);
        if (subs.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * 单次订阅
   */
  once(eventType: string, callback: EventCallback, source?: string): () => void {
    const unsubscribe = this.on(eventType, (payload) => {
      callback(payload);
      unsubscribe();
    }, source);
    return unsubscribe;
  }

  /**
   * 发布事件
   * @param eventType 事件类型
   * @param payload 事件数据
   * @param source 来源模块标识
   */
  emit(eventType: string, payload?: unknown, _source?: string): void {
    const subs = this.listeners.get(eventType);
    if (subs) {
      subs.forEach((sub) => {
        try {
          sub.callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error in handler for "${eventType}":`, err);
        }
      });
    }
  }

  /**
   * 移除指定来源的所有订阅
   */
  offBySource(source: string): void {
    this.listeners.forEach((subs, eventType) => {
      subs.forEach((sub) => {
        if (sub.source === source) {
          subs.delete(sub);
        }
      });
      if (subs.size === 0) {
        this.listeners.delete(eventType);
      }
    });
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取某事件类型的监听器数量
   */
  listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }
}

// 全局单例
export const eventBus = new EventBus();
export default EventBus;
