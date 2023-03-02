import { isObject } from '@/shared';
import { track, trigger } from './effect';

export interface Target {
  [key: string]: any;
  [ReactiveFlags.IS_REACTIVE]?: boolean;
}

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

const reactiveMap = new WeakMap<Target, any>();

const mutableHandlers: ProxyHandler<object> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true;
    // 收集依赖
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    // 触发依赖
    if (oldValue !== value) {
      trigger(target, key);
    }
    return result;
  },
};

export function reactive<T extends object>(target: T): T {
  // 传入的target必须是对象类型
  if (!isObject(target)) {
    return target;
  }
  return createReactiveObject(target, mutableHandlers);
}

// 将对象类型的数据转换为响应式数据 target => Proxy
function createReactiveObject(target: Target, handler: ProxyHandler<any>) {
  // 传入的target已经是响应式数据 则直接返回
  if (target[ReactiveFlags.IS_REACTIVE]) return target;
  // 防止target被重复代理
  if (reactiveMap.has(target)) return reactiveMap.get(target);

  const proxy = new Proxy(target, handler);
  reactiveMap.set(target, proxy);
  return proxy;
}
