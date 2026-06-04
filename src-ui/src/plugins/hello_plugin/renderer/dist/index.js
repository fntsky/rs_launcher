const s = window.__VUE__, {
  // Reactivity
  ref: n,
  reactive: d,
  computed: p,
  watch: m,
  watchEffect: u,
  shallowRef: v,
  triggerRef: f,
  toRef: g,
  toRefs: h,
  markRaw: w,
  readonly: R,
  shallowReactive: S,
  shallowReadonly: y,
  isRef: x,
  unref: k,
  toRaw: C,
  effectScope: E,
  customRef: V,
  isReactive: N,
  isReadonly: T,
  isProxy: b,
  toValue: M,
  // Lifecycle
  onMounted: P,
  onUnmounted: D,
  onBeforeUnmount: _,
  onScopeDispose: B,
  getCurrentScope: z,
  // Component
  defineProps: U,
  defineEmits: j,
  defineExpose: G,
  defineComponent: c,
  provide: H,
  inject: O,
  // VNode & rendering helpers (required by SFC-compiled templates)
  h: q,
  Fragment: A,
  Text: F,
  Comment: J,
  Static: K,
  createVNode: L,
  createBlock: W,
  openBlock: I,
  createElementBlock: Q,
  createElementVNode: X,
  mergeProps: Y,
  renderSlot: Z,
  resolveComponent: $,
  resolveDirective: ee,
  withDirectives: te,
  renderList: oe,
  toDisplayString: ne,
  createCommentVNode: re,
  createTextVNode: ae,
  createStaticVNode: le,
  normalizeClass: ie,
  normalizeStyle: se,
  normalizeProps: ce,
  createSlots: de,
  render: pe,
  // Directives
  vModelText: me,
  vModelCheckbox: ue,
  vModelRadio: ve,
  vModelSelect: fe,
  vModelDynamic: ge,
  vShow: he,
  // Built-in components
  Transition: we,
  TransitionGroup: Re,
  KeepAlive: Se,
  Teleport: ye,
  Suspense: xe,
  // Utilities
  version: ke,
  warn: Ce,
  nextTick: Ee
} = s, Ve = c({
  name: "HelloPlugin",
  props: {
    context: {
      type: Object,
      required: !0
    }
  },
  setup(l) {
    const r = n(""), e = n(""), t = n(!1);
    async function i() {
      t.value = !0;
      try {
        const o = await l.context.invoke("greet", { name: r.value || "World" }), a = JSON.parse(o);
        e.value = a.message || a.error || "No response";
      } catch (o) {
        e.value = "Error: " + o;
      } finally {
        t.value = !1;
      }
    }
    return {
      name: r,
      message: e,
      loading: t,
      greet: i
    };
  },
  template: `
    <div class="hello-plugin">
      <h3>Hello Plugin</h3>
      <p>{{ message || 'Click the button to greet!' }}</p>
      <input v-model="name" type="text" placeholder="Enter name..." />
      <button @click="greet" :disabled="loading">Greet</button>
    </div>
  `
});
export {
  Ve as default
};
