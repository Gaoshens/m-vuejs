import { Target } from './reactive';

type Fn = (...args: any[]) => any;
type Dep = Set<ReactiveEffect>;

// 全局的effect类
let activeEffect: ReactiveEffect | null;

class ReactiveEffect {
  private active = true; // 是否未激活状态
  deps: Dep[] = [];
  constructor(public fn: Fn) {}
  run() {
    // 非激活状态,直接调用effect的回调函数,返回结果
    if (!this.active) {
      return this.fn();
    }
    try {
      cleanupEffect(this);
      // 将当前的effect保存到全局
      activeEffect = this;
      // 执行effect传入的回调函数
      // 在执行回调函数前已经将当前的effect类保存到了全局
      // 此时调用回调函数会访问了proxy对象的属性,会触发get方法,在get方法内可以拿到当前effect类(activeEffect)
      return this.fn();
    } finally {
      // 执行完毕清除全局的effect类
      activeEffect = null;
    }
  }
}

export function effect(fn: Fn) {
  const effect = createReactiveEffect(fn);
  effect.run();
}

function createReactiveEffect(fn: Fn) {
  const effect = new ReactiveEffect(fn);
  return effect;
}

const targetWeakMap = new WeakMap<Target, Map<string | symbol, Dep>>();

export function track(target: Target, key: string | symbol) {
  // 从WeakMap中取Map
  let map = targetWeakMap.get(target);
  // 取不到则表示第一次访问 初始化target和空的Map
  if (!map) targetWeakMap.set(target, (map = new Map()));
  // 从map中取Dep
  let dep = map.get(key);
  // 取不到表示第一次访问 初始化key和空的Dep
  if (!dep) map.set(key, (dep = new Set()));

  // 将全局的activeEffect存到Set中
  trackEffect(dep);
}

export function trackEffect(dep: Dep) {
  if (!activeEffect) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function trigger(target: Target, key: string | symbol) {
  // 从WeakMap中取Map
  const map = targetWeakMap.get(target);
  // 找不到说明没有依赖收集 直接退出
  if (!map) return;
  // 从Map中通过key访问Dep
  const dep = map.get(key);
  triggerEffect(dep);
}

export function triggerEffect(dep: Dep) {
  if (!dep || !dep.size) return;
  const effectTorun = new Set<ReactiveEffect>();
  dep.forEach(effectFn => {
    if (activeEffect !== effectFn) effectTorun.add(effectFn);
  });

  if (effectTorun && effectTorun.size) {
    effectTorun.forEach(effectFn => {
      effectFn.run();
    });
  }
}
// 分支切换
function cleanupEffect(effect: ReactiveEffect) {
  for (let i = 0; i < effect.deps.length; i++) {
    effect.deps[i].delete(effect);
  }
  effect.deps.length = 0;
}
