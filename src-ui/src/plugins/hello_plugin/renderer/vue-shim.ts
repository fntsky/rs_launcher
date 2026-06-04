const _V = (window as any).__VUE__
export default _V

// Re-export all Vue runtime APIs so SFC-compiled code and plugin code share
// the same Vue instance as the main app (no duplicate reactivity system).
export const {
  // Reactivity
  ref, reactive, computed, watch, watchEffect,
  shallowRef, triggerRef, toRef, toRefs,
  markRaw, readonly, shallowReactive, shallowReadonly,
  isRef, unref, toRaw, effectScope, customRef,
  isReactive, isReadonly, isProxy, toValue,

  // Lifecycle
  onMounted, onUnmounted, onBeforeUnmount,
  onScopeDispose, getCurrentScope,

  // Component
  defineProps, defineEmits, defineExpose, defineComponent,
  provide, inject,

  // VNode & rendering helpers (required by SFC-compiled templates)
  h, Fragment, Text, Comment, Static,
  createVNode, createBlock, openBlock, createElementBlock, createElementVNode,
  mergeProps, renderSlot, resolveComponent, resolveDirective,
  withDirectives, renderList, toDisplayString,
  createCommentVNode, createTextVNode, createStaticVNode,
  normalizeClass, normalizeStyle, normalizeProps,
  createSlots, render,

  // Directives
  vModelText, vModelCheckbox, vModelRadio, vModelSelect, vModelDynamic,
  vShow,

  // Built-in components
  Transition, TransitionGroup, KeepAlive, Teleport,
  Suspense,

  // Utilities
  version, warn, nextTick,
} = _V