const Lt = window.__VUE__, {
  ref: re,
  reactive: Pi,
  computed: Fi,
  watch: wn,
  watchEffect: $i,
  onMounted: Dt,
  onUnmounted: zi,
  defineProps: Ki,
  defineEmits: Gi,
  defineExpose: qi,
  defineComponent: Bt,
  shallowRef: Hi,
  triggerRef: Wi,
  nextTick: Yi,
  h: Zi,
  Fragment: Ut,
  Comment: Vi,
  Text: Xi,
  Static: Qi,
  openBlock: se,
  createBlock: Ji,
  createElementBlock: oe,
  createElementVNode: ce,
  createVNode: ji,
  createCommentVNode: ve,
  createTextVNode: er,
  renderList: Pt,
  toDisplayString: me,
  renderSlot: nr,
  resolveComponent: tr,
  resolveDirective: ar,
  withDirectives: ir,
  mergeProps: rr,
  normalizeClass: Ft,
  normalizeStyle: sr,
  vModelText: or,
  vShow: cr,
  Transition: lr,
  TransitionGroup: dr,
  KeepAlive: ur,
  Teleport: gr,
  readonly: br,
  isRef: pr,
  unref: mr,
  provide: fr,
  inject: _r,
  version: Er
} = Lt;
function $t(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
function mt(n) {
  return n instanceof Map ? n.clear = n.delete = n.set = function() {
    throw new Error("map is read-only");
  } : n instanceof Set && (n.add = n.clear = n.delete = function() {
    throw new Error("set is read-only");
  }), Object.freeze(n), Object.getOwnPropertyNames(n).forEach((e) => {
    const t = n[e], i = typeof t;
    (i === "object" || i === "function") && !Object.isFrozen(t) && mt(t);
  }), n;
}
class Sn {
  /**
   * @param {CompiledMode} mode
   */
  constructor(e) {
    e.data === void 0 && (e.data = {}), this.data = e.data, this.isMatchIgnored = !1;
  }
  ignoreMatch() {
    this.isMatchIgnored = !0;
  }
}
function ft(n) {
  return n.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function pe(n, ...e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const i in n)
    t[i] = n[i];
  return e.forEach(function(i) {
    for (const d in i)
      t[d] = i[d];
  }), /** @type {T} */
  t;
}
const zt = "</span>", On = (n) => !!n.scope, Kt = (n, { prefix: e }) => {
  if (n.startsWith("language:"))
    return n.replace("language:", "language-");
  if (n.includes(".")) {
    const t = n.split(".");
    return [
      `${e}${t.shift()}`,
      ...t.map((i, d) => `${i}${"_".repeat(d + 1)}`)
    ].join(" ");
  }
  return `${e}${n}`;
};
class Gt {
  /**
   * Creates a new HTMLRenderer
   *
   * @param {Tree} parseTree - the parse tree (must support `walk` API)
   * @param {{classPrefix: string}} options
   */
  constructor(e, t) {
    this.buffer = "", this.classPrefix = t.classPrefix, e.walk(this);
  }
  /**
   * Adds texts to the output stream
   *
   * @param {string} text */
  addText(e) {
    this.buffer += ft(e);
  }
  /**
   * Adds a node open to the output stream (if needed)
   *
   * @param {Node} node */
  openNode(e) {
    if (!On(e)) return;
    const t = Kt(
      e.scope,
      { prefix: this.classPrefix }
    );
    this.span(t);
  }
  /**
   * Adds a node close to the output stream (if needed)
   *
   * @param {Node} node */
  closeNode(e) {
    On(e) && (this.buffer += zt);
  }
  /**
   * returns the accumulated buffer
  */
  value() {
    return this.buffer;
  }
  // helpers
  /**
   * Builds a span element
   *
   * @param {string} className */
  span(e) {
    this.buffer += `<span class="${e}">`;
  }
}
const An = (n = {}) => {
  const e = { children: [] };
  return Object.assign(e, n), e;
};
class vn {
  constructor() {
    this.rootNode = An(), this.stack = [this.rootNode];
  }
  get top() {
    return this.stack[this.stack.length - 1];
  }
  get root() {
    return this.rootNode;
  }
  /** @param {Node} node */
  add(e) {
    this.top.children.push(e);
  }
  /** @param {string} scope */
  openNode(e) {
    const t = An({ scope: e });
    this.add(t), this.stack.push(t);
  }
  closeNode() {
    if (this.stack.length > 1)
      return this.stack.pop();
  }
  closeAllNodes() {
    for (; this.closeNode(); ) ;
  }
  toJSON() {
    return JSON.stringify(this.rootNode, null, 4);
  }
  /**
   * @typedef { import("./html_renderer").Renderer } Renderer
   * @param {Renderer} builder
   */
  walk(e) {
    return this.constructor._walk(e, this.rootNode);
  }
  /**
   * @param {Renderer} builder
   * @param {Node} node
   */
  static _walk(e, t) {
    return typeof t == "string" ? e.addText(t) : t.children && (e.openNode(t), t.children.forEach((i) => this._walk(e, i)), e.closeNode(t)), e;
  }
  /**
   * @param {Node} node
   */
  static _collapse(e) {
    typeof e != "string" && e.children && (e.children.every((t) => typeof t == "string") ? e.children = [e.children.join("")] : e.children.forEach((t) => {
      vn._collapse(t);
    }));
  }
}
class qt extends vn {
  /**
   * @param {*} options
   */
  constructor(e) {
    super(), this.options = e;
  }
  /**
   * @param {string} text
   */
  addText(e) {
    e !== "" && this.add(e);
  }
  /** @param {string} scope */
  startScope(e) {
    this.openNode(e);
  }
  endScope() {
    this.closeNode();
  }
  /**
   * @param {Emitter & {root: DataNode}} emitter
   * @param {string} name
   */
  __addSublanguage(e, t) {
    const i = e.root;
    t && (i.scope = `language:${t}`), this.add(i);
  }
  toHTML() {
    return new Gt(this, this.options).value();
  }
  finalize() {
    return this.closeAllNodes(), !0;
  }
}
function Ae(n) {
  return n ? typeof n == "string" ? n : n.source : null;
}
function _t(n) {
  return _e("(?=", n, ")");
}
function Ht(n) {
  return _e("(?:", n, ")*");
}
function Wt(n) {
  return _e("(?:", n, ")?");
}
function _e(...n) {
  return n.map((t) => Ae(t)).join("");
}
function Yt(n) {
  const e = n[n.length - 1];
  return typeof e == "object" && e.constructor === Object ? (n.splice(n.length - 1, 1), e) : {};
}
function Nn(...n) {
  return "(" + (Yt(n).capture ? "" : "?:") + n.map((i) => Ae(i)).join("|") + ")";
}
function Et(n) {
  return new RegExp(n.toString() + "|").exec("").length - 1;
}
function Zt(n, e) {
  const t = n && n.exec(e);
  return t && t.index === 0;
}
const Vt = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function yn(n, { joinWith: e }) {
  let t = 0;
  return n.map((i) => {
    t += 1;
    const d = t;
    let l = Ae(i), r = "";
    for (; l.length > 0; ) {
      const s = Vt.exec(l);
      if (!s) {
        r += l;
        break;
      }
      r += l.substring(0, s.index), l = l.substring(s.index + s[0].length), s[0][0] === "\\" && s[1] ? r += "\\" + String(Number(s[1]) + d) : (r += s[0], s[0] === "(" && t++);
    }
    return r;
  }).map((i) => `(${i})`).join(e);
}
const Xt = /\b\B/, ht = "[a-zA-Z]\\w*", Tn = "[a-zA-Z_]\\w*", vt = "\\b\\d+(\\.\\d+)?", Nt = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", yt = "\\b(0b[01]+)", Qt = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", Jt = (n = {}) => {
  const e = /^#![ ]*\//;
  return n.binary && (n.begin = _e(
    e,
    /.*\b/,
    n.binary,
    /\b.*/
  )), pe({
    scope: "meta",
    begin: e,
    end: /$/,
    relevance: 0,
    /** @type {ModeCallback} */
    "on:begin": (t, i) => {
      t.index !== 0 && i.ignoreMatch();
    }
  }, n);
}, Re = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, jt = {
  scope: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [Re]
}, ea = {
  scope: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [Re]
}, na = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
}, Le = function(n, e, t = {}) {
  const i = pe(
    {
      scope: "comment",
      begin: n,
      end: e,
      contains: []
    },
    t
  );
  i.contains.push({
    scope: "doctag",
    // hack to avoid the space from being included. the space is necessary to
    // match here to prevent the plain text rule below from gobbling up doctags
    begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
    end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
    excludeBegin: !0,
    relevance: 0
  });
  const d = Nn(
    // list of common 1 and 2 letter words in English
    "I",
    "a",
    "is",
    "so",
    "us",
    "to",
    "at",
    "if",
    "in",
    "it",
    "on",
    // note: this is not an exhaustive list of contractions, just popular ones
    /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
    // contractions - can't we'd they're let's, etc
    /[A-Za-z]+[-][a-z]+/,
    // `no-way`, etc.
    /[A-Za-z][a-z]{2,}/
    // allow capitalized words at beginning of sentences
  );
  return i.contains.push(
    {
      // TODO: how to include ", (, ) without breaking grammars that use these for
      // comment delimiters?
      // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
      // ---
      // this tries to find sequences of 3 english words in a row (without any
      // "programming" type syntax) this gives us a strong signal that we've
      // TRULY found a comment - vs perhaps scanning with the wrong language.
      // It's possible to find something that LOOKS like the start of the
      // comment - but then if there is no readable text - good chance it is a
      // false match and not a comment.
      //
      // for a visual example please see:
      // https://github.com/highlightjs/highlight.js/issues/2827
      begin: _e(
        /[ ]+/,
        // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
        "(",
        d,
        /[.]?[:]?([.][ ]|[ ])/,
        "){3}"
      )
      // look for 3 words in a row
    }
  ), i;
}, ta = Le("//", "$"), aa = Le("/\\*", "\\*/"), ia = Le("#", "$"), ra = {
  scope: "number",
  begin: vt,
  relevance: 0
}, sa = {
  scope: "number",
  begin: Nt,
  relevance: 0
}, oa = {
  scope: "number",
  begin: yt,
  relevance: 0
}, ca = {
  scope: "regexp",
  begin: /\/(?=[^/\n]*\/)/,
  end: /\/[gimuy]*/,
  contains: [
    Re,
    {
      begin: /\[/,
      end: /\]/,
      relevance: 0,
      contains: [Re]
    }
  ]
}, la = {
  scope: "title",
  begin: ht,
  relevance: 0
}, da = {
  scope: "title",
  begin: Tn,
  relevance: 0
}, ua = {
  // excludes method names from keyword processing
  begin: "\\.\\s*" + Tn,
  relevance: 0
}, ga = function(n) {
  return Object.assign(
    n,
    {
      /** @type {ModeCallback} */
      "on:begin": (e, t) => {
        t.data._beginMatch = e[1];
      },
      /** @type {ModeCallback} */
      "on:end": (e, t) => {
        t.data._beginMatch !== e[1] && t.ignoreMatch();
      }
    }
  );
};
var Ce = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  APOS_STRING_MODE: jt,
  BACKSLASH_ESCAPE: Re,
  BINARY_NUMBER_MODE: oa,
  BINARY_NUMBER_RE: yt,
  COMMENT: Le,
  C_BLOCK_COMMENT_MODE: aa,
  C_LINE_COMMENT_MODE: ta,
  C_NUMBER_MODE: sa,
  C_NUMBER_RE: Nt,
  END_SAME_AS_BEGIN: ga,
  HASH_COMMENT_MODE: ia,
  IDENT_RE: ht,
  MATCH_NOTHING_RE: Xt,
  METHOD_GUARD: ua,
  NUMBER_MODE: ra,
  NUMBER_RE: vt,
  PHRASAL_WORDS_MODE: na,
  QUOTE_STRING_MODE: ea,
  REGEXP_MODE: ca,
  RE_STARTERS_RE: Qt,
  SHEBANG: Jt,
  TITLE_MODE: la,
  UNDERSCORE_IDENT_RE: Tn,
  UNDERSCORE_TITLE_MODE: da
});
function ba(n, e) {
  n.input[n.index - 1] === "." && e.ignoreMatch();
}
function pa(n, e) {
  n.className !== void 0 && (n.scope = n.className, delete n.className);
}
function ma(n, e) {
  e && n.beginKeywords && (n.begin = "\\b(" + n.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", n.__beforeBegin = ba, n.keywords = n.keywords || n.beginKeywords, delete n.beginKeywords, n.relevance === void 0 && (n.relevance = 0));
}
function fa(n, e) {
  Array.isArray(n.illegal) && (n.illegal = Nn(...n.illegal));
}
function _a(n, e) {
  if (n.match) {
    if (n.begin || n.end) throw new Error("begin & end are not supported with match");
    n.begin = n.match, delete n.match;
  }
}
function Ea(n, e) {
  n.relevance === void 0 && (n.relevance = 1);
}
const ha = (n, e) => {
  if (!n.beforeMatch) return;
  if (n.starts) throw new Error("beforeMatch cannot be used with starts");
  const t = Object.assign({}, n);
  Object.keys(n).forEach((i) => {
    delete n[i];
  }), n.keywords = t.keywords, n.begin = _e(t.beforeMatch, _t(t.begin)), n.starts = {
    relevance: 0,
    contains: [
      Object.assign(t, { endsParent: !0 })
    ]
  }, n.relevance = 0, delete t.beforeMatch;
}, va = [
  "of",
  "and",
  "for",
  "in",
  "not",
  "or",
  "if",
  "then",
  "parent",
  // common variable name
  "list",
  // common variable name
  "value"
  // common variable name
], Na = "keyword";
function Tt(n, e, t = Na) {
  const i = /* @__PURE__ */ Object.create(null);
  return typeof n == "string" ? d(t, n.split(" ")) : Array.isArray(n) ? d(t, n) : Object.keys(n).forEach(function(l) {
    Object.assign(
      i,
      Tt(n[l], e, l)
    );
  }), i;
  function d(l, r) {
    e && (r = r.map((s) => s.toLowerCase())), r.forEach(function(s) {
      const c = s.split("|");
      i[c[0]] = [l, ya(c[0], c[1])];
    });
  }
}
function ya(n, e) {
  return e ? Number(e) : Ta(n) ? 0 : 1;
}
function Ta(n) {
  return va.includes(n.toLowerCase());
}
const Rn = {}, fe = (n) => {
  console.error(n);
}, kn = (n, ...e) => {
  console.log(`WARN: ${n}`, ...e);
}, Ne = (n, e) => {
  Rn[`${n}/${e}`] || (console.log(`Deprecated as of ${n}. ${e}`), Rn[`${n}/${e}`] = !0);
}, Ie = new Error();
function wt(n, e, { key: t }) {
  let i = 0;
  const d = n[t], l = {}, r = {};
  for (let s = 1; s <= e.length; s++)
    r[s + i] = d[s], l[s + i] = !0, i += Et(e[s - 1]);
  n[t] = r, n[t]._emit = l, n[t]._multi = !0;
}
function wa(n) {
  if (Array.isArray(n.begin)) {
    if (n.skip || n.excludeBegin || n.returnBegin)
      throw fe("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), Ie;
    if (typeof n.beginScope != "object" || n.beginScope === null)
      throw fe("beginScope must be object"), Ie;
    wt(n, n.begin, { key: "beginScope" }), n.begin = yn(n.begin, { joinWith: "" });
  }
}
function Sa(n) {
  if (Array.isArray(n.end)) {
    if (n.skip || n.excludeEnd || n.returnEnd)
      throw fe("skip, excludeEnd, returnEnd not compatible with endScope: {}"), Ie;
    if (typeof n.endScope != "object" || n.endScope === null)
      throw fe("endScope must be object"), Ie;
    wt(n, n.end, { key: "endScope" }), n.end = yn(n.end, { joinWith: "" });
  }
}
function Oa(n) {
  n.scope && typeof n.scope == "object" && n.scope !== null && (n.beginScope = n.scope, delete n.scope);
}
function Aa(n) {
  Oa(n), typeof n.beginScope == "string" && (n.beginScope = { _wrap: n.beginScope }), typeof n.endScope == "string" && (n.endScope = { _wrap: n.endScope }), wa(n), Sa(n);
}
function Ra(n) {
  function e(r, s) {
    return new RegExp(
      Ae(r),
      "m" + (n.case_insensitive ? "i" : "") + (n.unicodeRegex ? "u" : "") + (s ? "g" : "")
    );
  }
  class t {
    constructor() {
      this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
    }
    // @ts-ignore
    addRule(s, c) {
      c.position = this.position++, this.matchIndexes[this.matchAt] = c, this.regexes.push([c, s]), this.matchAt += Et(s) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const s = this.regexes.map((c) => c[1]);
      this.matcherRe = e(yn(s, { joinWith: "|" }), !0), this.lastIndex = 0;
    }
    /** @param {string} s */
    exec(s) {
      this.matcherRe.lastIndex = this.lastIndex;
      const c = this.matcherRe.exec(s);
      if (!c)
        return null;
      const o = c.findIndex((u, b) => b > 0 && u !== void 0), a = this.matchIndexes[o];
      return c.splice(0, o), Object.assign(c, a);
    }
  }
  class i {
    constructor() {
      this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
    }
    // @ts-ignore
    getMatcher(s) {
      if (this.multiRegexes[s]) return this.multiRegexes[s];
      const c = new t();
      return this.rules.slice(s).forEach(([o, a]) => c.addRule(o, a)), c.compile(), this.multiRegexes[s] = c, c;
    }
    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }
    considerAll() {
      this.regexIndex = 0;
    }
    // @ts-ignore
    addRule(s, c) {
      this.rules.push([s, c]), c.type === "begin" && this.count++;
    }
    /** @param {string} s */
    exec(s) {
      const c = this.getMatcher(this.regexIndex);
      c.lastIndex = this.lastIndex;
      let o = c.exec(s);
      if (this.resumingScanAtSamePosition() && !(o && o.index === this.lastIndex)) {
        const a = this.getMatcher(0);
        a.lastIndex = this.lastIndex + 1, o = a.exec(s);
      }
      return o && (this.regexIndex += o.position + 1, this.regexIndex === this.count && this.considerAll()), o;
    }
  }
  function d(r) {
    const s = new i();
    return r.contains.forEach((c) => s.addRule(c.begin, { rule: c, type: "begin" })), r.terminatorEnd && s.addRule(r.terminatorEnd, { type: "end" }), r.illegal && s.addRule(r.illegal, { type: "illegal" }), s;
  }
  function l(r, s) {
    const c = (
      /** @type CompiledMode */
      r
    );
    if (r.isCompiled) return c;
    [
      pa,
      // do this early so compiler extensions generally don't have to worry about
      // the distinction between match/begin
      _a,
      Aa,
      ha
    ].forEach((a) => a(r, s)), n.compilerExtensions.forEach((a) => a(r, s)), r.__beforeBegin = null, [
      ma,
      // do this later so compiler extensions that come earlier have access to the
      // raw array if they wanted to perhaps manipulate it, etc.
      fa,
      // default to 1 relevance if not specified
      Ea
    ].forEach((a) => a(r, s)), r.isCompiled = !0;
    let o = null;
    return typeof r.keywords == "object" && r.keywords.$pattern && (r.keywords = Object.assign({}, r.keywords), o = r.keywords.$pattern, delete r.keywords.$pattern), o = o || /\w+/, r.keywords && (r.keywords = Tt(r.keywords, n.case_insensitive)), c.keywordPatternRe = e(o, !0), s && (r.begin || (r.begin = /\B|\b/), c.beginRe = e(c.begin), !r.end && !r.endsWithParent && (r.end = /\B|\b/), r.end && (c.endRe = e(c.end)), c.terminatorEnd = Ae(c.end) || "", r.endsWithParent && s.terminatorEnd && (c.terminatorEnd += (r.end ? "|" : "") + s.terminatorEnd)), r.illegal && (c.illegalRe = e(
      /** @type {RegExp | string} */
      r.illegal
    )), r.contains || (r.contains = []), r.contains = [].concat(...r.contains.map(function(a) {
      return ka(a === "self" ? r : a);
    })), r.contains.forEach(function(a) {
      l(
        /** @type Mode */
        a,
        c
      );
    }), r.starts && l(r.starts, s), c.matcher = d(c), c;
  }
  if (n.compilerExtensions || (n.compilerExtensions = []), n.contains && n.contains.includes("self"))
    throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  return n.classNameAliases = pe(n.classNameAliases || {}), l(
    /** @type Mode */
    n
  );
}
function St(n) {
  return n ? n.endsWithParent || St(n.starts) : !1;
}
function ka(n) {
  return n.variants && !n.cachedVariants && (n.cachedVariants = n.variants.map(function(e) {
    return pe(n, { variants: null }, e);
  })), n.cachedVariants ? n.cachedVariants : St(n) ? pe(n, { starts: n.starts ? pe(n.starts) : null }) : Object.isFrozen(n) ? pe(n) : n;
}
var Ma = "11.11.1";
class xa extends Error {
  constructor(e, t) {
    super(e), this.name = "HTMLInjectionError", this.html = t;
  }
}
const Be = ft, Mn = pe, xn = Symbol("nomatch"), Ca = 7, Ot = function(n) {
  const e = /* @__PURE__ */ Object.create(null), t = /* @__PURE__ */ Object.create(null), i = [];
  let d = !0;
  const l = "Could not find the language '{}', did you forget to load/include a language module?", r = { disableAutodetect: !0, name: "Plain text", contains: [] };
  let s = {
    ignoreUnescapedHTML: !1,
    throwUnescapedHTML: !1,
    noHighlightRe: /^(no-?highlight)$/i,
    languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
    classPrefix: "hljs-",
    cssSelector: "pre code",
    languages: null,
    // beta configuration options, subject to change, welcome to discuss
    // https://github.com/highlightjs/highlight.js/issues/1086
    __emitter: qt
  };
  function c(g) {
    return s.noHighlightRe.test(g);
  }
  function o(g) {
    let E = g.className + " ";
    E += g.parentNode ? g.parentNode.className : "";
    const O = s.languageDetectRe.exec(E);
    if (O) {
      const U = S(O[1]);
      return U || (kn(l.replace("{}", O[1])), kn("Falling back to no-highlight mode for this block.", g)), U ? O[1] : "no-highlight";
    }
    return E.split(/\s+/).find((U) => c(U) || S(U));
  }
  function a(g, E, O) {
    let U = "", q = "";
    typeof E == "object" ? (U = g, O = E.ignoreIllegals, q = E.language) : (Ne("10.7.0", "highlight(lang, code, ...args) has been deprecated."), Ne("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), q = g, U = E), O === void 0 && (O = !0);
    const X = {
      code: U,
      language: q
    };
    F("before:highlight", X);
    const j = X.result ? X.result : u(X.language, X.code, O);
    return j.code = X.code, F("after:highlight", j), j;
  }
  function u(g, E, O, U) {
    const q = /* @__PURE__ */ Object.create(null);
    function X(f, y) {
      return f.keywords[y];
    }
    function j() {
      if (!A.keywords) {
        Q.addText($);
        return;
      }
      let f = 0;
      A.keywordPatternRe.lastIndex = 0;
      let y = A.keywordPatternRe.exec($), M = "";
      for (; y; ) {
        M += $.substring(f, y.index);
        const P = ie.case_insensitive ? y[0].toLowerCase() : y[0], V = X(A, P);
        if (V) {
          const [le, Me] = V;
          if (Q.addText(M), M = "", q[P] = (q[P] || 0) + 1, q[P] <= Ca && (he += Me), le.startsWith("_"))
            M += y[0];
          else {
            const De = ie.classNameAliases[le] || le;
            Z(y[0], De);
          }
        } else
          M += y[0];
        f = A.keywordPatternRe.lastIndex, y = A.keywordPatternRe.exec($);
      }
      M += $.substring(f), Q.addText(M);
    }
    function de() {
      if ($ === "") return;
      let f = null;
      if (typeof A.subLanguage == "string") {
        if (!e[A.subLanguage]) {
          Q.addText($);
          return;
        }
        f = u(A.subLanguage, $, !0, ke[A.subLanguage]), ke[A.subLanguage] = /** @type {CompiledMode} */
        f._top;
      } else
        f = p($, A.subLanguage.length ? A.subLanguage : null);
      A.relevance > 0 && (he += f.relevance), Q.__addSublanguage(f._emitter, f.language);
    }
    function W() {
      A.subLanguage != null ? de() : j(), $ = "";
    }
    function Z(f, y) {
      f !== "" && (Q.startScope(y), Q.addText(f), Q.endScope());
    }
    function ue(f, y) {
      let M = 1;
      const P = y.length - 1;
      for (; M <= P; ) {
        if (!f._emit[M]) {
          M++;
          continue;
        }
        const V = ie.classNameAliases[f[M]] || f[M], le = y[M];
        V ? Z(le, V) : ($ = le, j(), $ = ""), M++;
      }
    }
    function Y(f, y) {
      return f.scope && typeof f.scope == "string" && Q.openNode(ie.classNameAliases[f.scope] || f.scope), f.beginScope && (f.beginScope._wrap ? (Z($, ie.classNameAliases[f.beginScope._wrap] || f.beginScope._wrap), $ = "") : f.beginScope._multi && (ue(f.beginScope, y), $ = "")), A = Object.create(f, { parent: { value: A } }), A;
    }
    function H(f, y, M) {
      let P = Zt(f.endRe, M);
      if (P) {
        if (f["on:end"]) {
          const V = new Sn(f);
          f["on:end"](y, V), V.isMatchIgnored && (P = !1);
        }
        if (P) {
          for (; f.endsParent && f.parent; )
            f = f.parent;
          return f;
        }
      }
      if (f.endsWithParent)
        return H(f.parent, y, M);
    }
    function J(f) {
      return A.matcher.regexIndex === 0 ? ($ += f[0], 1) : (be = !0, 0);
    }
    function ee(f) {
      const y = f[0], M = f.rule, P = new Sn(M), V = [M.__beforeBegin, M["on:begin"]];
      for (const le of V)
        if (le && (le(f, P), P.isMatchIgnored))
          return J(y);
      return M.skip ? $ += y : (M.excludeBegin && ($ += y), W(), !M.returnBegin && !M.excludeBegin && ($ = y)), Y(M, f), M.returnBegin ? 0 : y.length;
    }
    function ne(f) {
      const y = f[0], M = E.substring(f.index), P = H(A, f, M);
      if (!P)
        return xn;
      const V = A;
      A.endScope && A.endScope._wrap ? (W(), Z(y, A.endScope._wrap)) : A.endScope && A.endScope._multi ? (W(), ue(A.endScope, f)) : V.skip ? $ += y : (V.returnEnd || V.excludeEnd || ($ += y), W(), V.excludeEnd && ($ = y));
      do
        A.scope && Q.closeNode(), !A.skip && !A.subLanguage && (he += A.relevance), A = A.parent;
      while (A !== P.parent);
      return P.starts && Y(P.starts, f), V.returnEnd ? 0 : y.length;
    }
    function ae() {
      const f = [];
      for (let y = A; y !== ie; y = y.parent)
        y.scope && f.unshift(y.scope);
      f.forEach((y) => Q.openNode(y));
    }
    let te = {};
    function Te(f, y) {
      const M = y && y[0];
      if ($ += f, M == null)
        return W(), 0;
      if (te.type === "begin" && y.type === "end" && te.index === y.index && M === "") {
        if ($ += E.slice(y.index, y.index + 1), !d) {
          const P = new Error(`0 width match regex (${g})`);
          throw P.languageName = g, P.badRule = te.rule, P;
        }
        return 1;
      }
      if (te = y, y.type === "begin")
        return ee(y);
      if (y.type === "illegal" && !O) {
        const P = new Error('Illegal lexeme "' + M + '" for mode "' + (A.scope || "<unnamed>") + '"');
        throw P.mode = A, P;
      } else if (y.type === "end") {
        const P = ne(y);
        if (P !== xn)
          return P;
      }
      if (y.type === "illegal" && M === "")
        return $ += `
`, 1;
      if (Se > 1e5 && Se > y.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return $ += M, M.length;
    }
    const ie = S(g);
    if (!ie)
      throw fe(l.replace("{}", g)), new Error('Unknown language: "' + g + '"');
    const we = Ra(ie);
    let Ee = "", A = U || we;
    const ke = {}, Q = new s.__emitter(s);
    ae();
    let $ = "", he = 0, ge = 0, Se = 0, be = !1;
    try {
      if (ie.__emitTokens)
        ie.__emitTokens(E, Q);
      else {
        for (A.matcher.considerAll(); ; ) {
          Se++, be ? be = !1 : A.matcher.considerAll(), A.matcher.lastIndex = ge;
          const f = A.matcher.exec(E);
          if (!f) break;
          const y = E.substring(ge, f.index), M = Te(y, f);
          ge = f.index + M;
        }
        Te(E.substring(ge));
      }
      return Q.finalize(), Ee = Q.toHTML(), {
        language: g,
        value: Ee,
        relevance: he,
        illegal: !1,
        _emitter: Q,
        _top: A
      };
    } catch (f) {
      if (f.message && f.message.includes("Illegal"))
        return {
          language: g,
          value: Be(E),
          illegal: !0,
          relevance: 0,
          _illegalBy: {
            message: f.message,
            index: ge,
            context: E.slice(ge - 100, ge + 100),
            mode: f.mode,
            resultSoFar: Ee
          },
          _emitter: Q
        };
      if (d)
        return {
          language: g,
          value: Be(E),
          illegal: !1,
          relevance: 0,
          errorRaised: f,
          _emitter: Q,
          _top: A
        };
      throw f;
    }
  }
  function b(g) {
    const E = {
      value: Be(g),
      illegal: !1,
      relevance: 0,
      _top: r,
      _emitter: new s.__emitter(s)
    };
    return E._emitter.addText(g), E;
  }
  function p(g, E) {
    E = E || s.languages || Object.keys(e);
    const O = b(g), U = E.filter(S).filter(K).map(
      (W) => u(W, g, !1)
    );
    U.unshift(O);
    const q = U.sort((W, Z) => {
      if (W.relevance !== Z.relevance) return Z.relevance - W.relevance;
      if (W.language && Z.language) {
        if (S(W.language).supersetOf === Z.language)
          return 1;
        if (S(Z.language).supersetOf === W.language)
          return -1;
      }
      return 0;
    }), [X, j] = q, de = X;
    return de.secondBest = j, de;
  }
  function _(g, E, O) {
    const U = E && t[E] || O;
    g.classList.add("hljs"), g.classList.add(`language-${U}`);
  }
  function h(g) {
    let E = null;
    const O = o(g);
    if (c(O)) return;
    if (F(
      "before:highlightElement",
      { el: g, language: O }
    ), g.dataset.highlighted) {
      console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", g);
      return;
    }
    if (g.children.length > 0 && (s.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(g)), s.throwUnescapedHTML))
      throw new xa(
        "One of your code blocks includes unescaped HTML.",
        g.innerHTML
      );
    E = g;
    const U = E.textContent, q = O ? a(U, { language: O, ignoreIllegals: !0 }) : p(U);
    g.innerHTML = q.value, g.dataset.highlighted = "yes", _(g, O, q.language), g.result = {
      language: q.language,
      // TODO: remove with version 11.0
      re: q.relevance,
      relevance: q.relevance
    }, q.secondBest && (g.secondBest = {
      language: q.secondBest.language,
      relevance: q.secondBest.relevance
    }), F("after:highlightElement", { el: g, result: q, text: U });
  }
  function m(g) {
    s = Mn(s, g);
  }
  const v = () => {
    B(), Ne("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
  };
  function T() {
    B(), Ne("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
  }
  let w = !1;
  function B() {
    function g() {
      B();
    }
    if (document.readyState === "loading") {
      w || window.addEventListener("DOMContentLoaded", g, !1), w = !0;
      return;
    }
    document.querySelectorAll(s.cssSelector).forEach(h);
  }
  function R(g, E) {
    let O = null;
    try {
      O = E(n);
    } catch (U) {
      if (fe("Language definition for '{}' could not be registered.".replace("{}", g)), d)
        fe(U);
      else
        throw U;
      O = r;
    }
    O.name || (O.name = g), e[g] = O, O.rawDefinition = E.bind(null, n), O.aliases && I(O.aliases, { languageName: g });
  }
  function C(g) {
    delete e[g];
    for (const E of Object.keys(t))
      t[E] === g && delete t[E];
  }
  function L() {
    return Object.keys(e);
  }
  function S(g) {
    return g = (g || "").toLowerCase(), e[g] || e[t[g]];
  }
  function I(g, { languageName: E }) {
    typeof g == "string" && (g = [g]), g.forEach((O) => {
      t[O.toLowerCase()] = E;
    });
  }
  function K(g) {
    const E = S(g);
    return E && !E.disableAutodetect;
  }
  function N(g) {
    g["before:highlightBlock"] && !g["before:highlightElement"] && (g["before:highlightElement"] = (E) => {
      g["before:highlightBlock"](
        Object.assign({ block: E.el }, E)
      );
    }), g["after:highlightBlock"] && !g["after:highlightElement"] && (g["after:highlightElement"] = (E) => {
      g["after:highlightBlock"](
        Object.assign({ block: E.el }, E)
      );
    });
  }
  function k(g) {
    N(g), i.push(g);
  }
  function D(g) {
    const E = i.indexOf(g);
    E !== -1 && i.splice(E, 1);
  }
  function F(g, E) {
    const O = g;
    i.forEach(function(U) {
      U[O] && U[O](E);
    });
  }
  function z(g) {
    return Ne("10.7.0", "highlightBlock will be removed entirely in v12.0"), Ne("10.7.0", "Please use highlightElement now."), h(g);
  }
  Object.assign(n, {
    highlight: a,
    highlightAuto: p,
    highlightAll: B,
    highlightElement: h,
    // TODO: Remove with v12 API
    highlightBlock: z,
    configure: m,
    initHighlighting: v,
    initHighlightingOnLoad: T,
    registerLanguage: R,
    unregisterLanguage: C,
    listLanguages: L,
    getLanguage: S,
    registerAliases: I,
    autoDetection: K,
    inherit: Mn,
    addPlugin: k,
    removePlugin: D
  }), n.debugMode = function() {
    d = !1;
  }, n.safeMode = function() {
    d = !0;
  }, n.versionString = Ma, n.regex = {
    concat: _e,
    lookahead: _t,
    either: Nn,
    optional: Wt,
    anyNumberOfTimes: Ht
  };
  for (const g in Ce)
    typeof Ce[g] == "object" && mt(Ce[g]);
  return Object.assign(n, Ce), n;
}, ye = Ot({});
ye.newInstance = () => Ot({});
var Ia = ye;
ye.HighlightJS = ye;
ye.default = ye;
var Ue, Cn;
function La() {
  if (Cn) return Ue;
  Cn = 1;
  function n(e) {
    const t = e.regex, i = t.concat(/[\p{L}_]/u, t.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u), d = /[\p{L}0-9._:-]+/u, l = {
      className: "symbol",
      begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
    }, r = {
      begin: /\s/,
      contains: [
        {
          className: "keyword",
          begin: /#?[a-z_][a-z1-9_-]+/,
          illegal: /\n/
        }
      ]
    }, s = e.inherit(r, {
      begin: /\(/,
      end: /\)/
    }), c = e.inherit(e.APOS_STRING_MODE, { className: "string" }), o = e.inherit(e.QUOTE_STRING_MODE, { className: "string" }), a = {
      endsWithParent: !0,
      illegal: /</,
      relevance: 0,
      contains: [
        {
          className: "attr",
          begin: d,
          relevance: 0
        },
        {
          begin: /=\s*/,
          relevance: 0,
          contains: [
            {
              className: "string",
              endsParent: !0,
              variants: [
                {
                  begin: /"/,
                  end: /"/,
                  contains: [l]
                },
                {
                  begin: /'/,
                  end: /'/,
                  contains: [l]
                },
                { begin: /[^\s"'=<>`]+/ }
              ]
            }
          ]
        }
      ]
    };
    return {
      name: "HTML, XML",
      aliases: [
        "html",
        "xhtml",
        "rss",
        "atom",
        "xjb",
        "xsd",
        "xsl",
        "plist",
        "wsf",
        "svg"
      ],
      case_insensitive: !0,
      unicodeRegex: !0,
      contains: [
        {
          className: "meta",
          begin: /<![a-z]/,
          end: />/,
          relevance: 10,
          contains: [
            r,
            o,
            c,
            s,
            {
              begin: /\[/,
              end: /\]/,
              contains: [
                {
                  className: "meta",
                  begin: /<![a-z]/,
                  end: />/,
                  contains: [
                    r,
                    s,
                    o,
                    c
                  ]
                }
              ]
            }
          ]
        },
        e.COMMENT(
          /<!--/,
          /-->/,
          { relevance: 10 }
        ),
        {
          begin: /<!\[CDATA\[/,
          end: /\]\]>/,
          relevance: 10
        },
        l,
        // xml processing instructions
        {
          className: "meta",
          end: /\?>/,
          variants: [
            {
              begin: /<\?xml/,
              relevance: 10,
              contains: [
                o
              ]
            },
            {
              begin: /<\?[a-z][a-z0-9]+/
            }
          ]
        },
        {
          className: "tag",
          /*
          The lookahead pattern (?=...) ensures that 'begin' only matches
          '<style' as a single word, followed by a whitespace or an
          ending bracket.
          */
          begin: /<style(?=\s|>)/,
          end: />/,
          keywords: { name: "style" },
          contains: [a],
          starts: {
            end: /<\/style>/,
            returnEnd: !0,
            subLanguage: [
              "css",
              "xml"
            ]
          }
        },
        {
          className: "tag",
          // See the comment in the <style tag about the lookahead pattern
          begin: /<script(?=\s|>)/,
          end: />/,
          keywords: { name: "script" },
          contains: [a],
          starts: {
            end: /<\/script>/,
            returnEnd: !0,
            subLanguage: [
              "javascript",
              "handlebars",
              "xml"
            ]
          }
        },
        // we need this for now for jSX
        {
          className: "tag",
          begin: /<>|<\/>/
        },
        // open tag
        {
          className: "tag",
          begin: t.concat(
            /</,
            t.lookahead(t.concat(
              i,
              // <tag/>
              // <tag>
              // <tag ...
              t.either(/\/>/, />/, /\s/)
            ))
          ),
          end: /\/?>/,
          contains: [
            {
              className: "name",
              begin: i,
              relevance: 0,
              starts: a
            }
          ]
        },
        // close tag
        {
          className: "tag",
          begin: t.concat(
            /<\//,
            t.lookahead(t.concat(
              i,
              />/
            ))
          ),
          contains: [
            {
              className: "name",
              begin: i,
              relevance: 0
            },
            {
              begin: />/,
              relevance: 0,
              endsParent: !0
            }
          ]
        }
      ]
    };
  }
  return Ue = n, Ue;
}
var Pe, In;
function Da() {
  if (In) return Pe;
  In = 1;
  function n(e) {
    const t = e.regex, i = {}, d = {
      begin: /\$\{/,
      end: /\}/,
      contains: [
        "self",
        {
          begin: /:-/,
          contains: [i]
        }
        // default values
      ]
    };
    Object.assign(i, {
      className: "variable",
      variants: [
        { begin: t.concat(
          /\$[\w\d#@][\w\d_]*/,
          // negative look-ahead tries to avoid matching patterns that are not
          // Perl at all like $ident$, @ident@, etc.
          "(?![\\w\\d])(?![$])"
        ) },
        d
      ]
    });
    const l = {
      className: "subst",
      begin: /\$\(/,
      end: /\)/,
      contains: [e.BACKSLASH_ESCAPE]
    }, r = e.inherit(
      e.COMMENT(),
      {
        match: [
          /(^|\s)/,
          /#.*$/
        ],
        scope: {
          2: "comment"
        }
      }
    ), s = {
      begin: /<<-?\s*(?=\w+)/,
      starts: { contains: [
        e.END_SAME_AS_BEGIN({
          begin: /(\w+)/,
          end: /(\w+)/,
          className: "string"
        })
      ] }
    }, c = {
      className: "string",
      begin: /"/,
      end: /"/,
      contains: [
        e.BACKSLASH_ESCAPE,
        i,
        l
      ]
    };
    l.contains.push(c);
    const o = {
      match: /\\"/
    }, a = {
      className: "string",
      begin: /'/,
      end: /'/
    }, u = {
      match: /\\'/
    }, b = {
      begin: /\$?\(\(/,
      end: /\)\)/,
      contains: [
        {
          begin: /\d+#[0-9a-f]+/,
          className: "number"
        },
        e.NUMBER_MODE,
        i
      ]
    }, p = [
      "fish",
      "bash",
      "zsh",
      "sh",
      "csh",
      "ksh",
      "tcsh",
      "dash",
      "scsh"
    ], _ = e.SHEBANG({
      binary: `(${p.join("|")})`,
      relevance: 10
    }), h = {
      className: "function",
      begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
      returnBegin: !0,
      contains: [e.inherit(e.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
      relevance: 0
    }, m = [
      "if",
      "then",
      "else",
      "elif",
      "fi",
      "time",
      "for",
      "while",
      "until",
      "in",
      "do",
      "done",
      "case",
      "esac",
      "coproc",
      "function",
      "select"
    ], v = [
      "true",
      "false"
    ], T = { match: /(\/[a-z._-]+)+/ }, w = [
      "break",
      "cd",
      "continue",
      "eval",
      "exec",
      "exit",
      "export",
      "getopts",
      "hash",
      "pwd",
      "readonly",
      "return",
      "shift",
      "test",
      "times",
      "trap",
      "umask",
      "unset"
    ], B = [
      "alias",
      "bind",
      "builtin",
      "caller",
      "command",
      "declare",
      "echo",
      "enable",
      "help",
      "let",
      "local",
      "logout",
      "mapfile",
      "printf",
      "read",
      "readarray",
      "source",
      "sudo",
      "type",
      "typeset",
      "ulimit",
      "unalias"
    ], R = [
      "autoload",
      "bg",
      "bindkey",
      "bye",
      "cap",
      "chdir",
      "clone",
      "comparguments",
      "compcall",
      "compctl",
      "compdescribe",
      "compfiles",
      "compgroups",
      "compquote",
      "comptags",
      "comptry",
      "compvalues",
      "dirs",
      "disable",
      "disown",
      "echotc",
      "echoti",
      "emulate",
      "fc",
      "fg",
      "float",
      "functions",
      "getcap",
      "getln",
      "history",
      "integer",
      "jobs",
      "kill",
      "limit",
      "log",
      "noglob",
      "popd",
      "print",
      "pushd",
      "pushln",
      "rehash",
      "sched",
      "setcap",
      "setopt",
      "stat",
      "suspend",
      "ttyctl",
      "unfunction",
      "unhash",
      "unlimit",
      "unsetopt",
      "vared",
      "wait",
      "whence",
      "where",
      "which",
      "zcompile",
      "zformat",
      "zftp",
      "zle",
      "zmodload",
      "zparseopts",
      "zprof",
      "zpty",
      "zregexparse",
      "zsocket",
      "zstyle",
      "ztcp"
    ], C = [
      "chcon",
      "chgrp",
      "chown",
      "chmod",
      "cp",
      "dd",
      "df",
      "dir",
      "dircolors",
      "ln",
      "ls",
      "mkdir",
      "mkfifo",
      "mknod",
      "mktemp",
      "mv",
      "realpath",
      "rm",
      "rmdir",
      "shred",
      "sync",
      "touch",
      "truncate",
      "vdir",
      "b2sum",
      "base32",
      "base64",
      "cat",
      "cksum",
      "comm",
      "csplit",
      "cut",
      "expand",
      "fmt",
      "fold",
      "head",
      "join",
      "md5sum",
      "nl",
      "numfmt",
      "od",
      "paste",
      "ptx",
      "pr",
      "sha1sum",
      "sha224sum",
      "sha256sum",
      "sha384sum",
      "sha512sum",
      "shuf",
      "sort",
      "split",
      "sum",
      "tac",
      "tail",
      "tr",
      "tsort",
      "unexpand",
      "uniq",
      "wc",
      "arch",
      "basename",
      "chroot",
      "date",
      "dirname",
      "du",
      "echo",
      "env",
      "expr",
      "factor",
      // "false", // keyword literal already
      "groups",
      "hostid",
      "id",
      "link",
      "logname",
      "nice",
      "nohup",
      "nproc",
      "pathchk",
      "pinky",
      "printenv",
      "printf",
      "pwd",
      "readlink",
      "runcon",
      "seq",
      "sleep",
      "stat",
      "stdbuf",
      "stty",
      "tee",
      "test",
      "timeout",
      // "true", // keyword literal already
      "tty",
      "uname",
      "unlink",
      "uptime",
      "users",
      "who",
      "whoami",
      "yes"
    ];
    return {
      name: "Bash",
      aliases: [
        "sh",
        "zsh"
      ],
      keywords: {
        $pattern: /\b[a-z][a-z0-9._-]+\b/,
        keyword: m,
        literal: v,
        built_in: [
          ...w,
          ...B,
          // Shell modifiers
          "set",
          "shopt",
          ...R,
          ...C
        ]
      },
      contains: [
        _,
        // to catch known shells and boost relevancy
        e.SHEBANG(),
        // to catch unknown shells but still highlight the shebang
        h,
        b,
        r,
        s,
        T,
        c,
        o,
        a,
        u,
        i
      ]
    };
  }
  return Pe = n, Pe;
}
var Fe, Ln;
function Ba() {
  if (Ln) return Fe;
  Ln = 1;
  function n(e) {
    const t = e.regex, i = e.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] }), d = "decltype\\(auto\\)", l = "[a-zA-Z_]\\w*::", s = "(" + d + "|" + t.optional(l) + "[a-zA-Z_]\\w*" + t.optional("<[^<>]+>") + ")", c = {
      className: "type",
      variants: [
        { begin: "\\b[a-z\\d_]*_t\\b" },
        { match: /\batomic_[a-z]{3,6}\b/ }
      ]
    }, a = {
      className: "string",
      variants: [
        {
          begin: '(u8?|U|L)?"',
          end: '"',
          illegal: "\\n",
          contains: [e.BACKSLASH_ESCAPE]
        },
        {
          begin: "(u8?|U|L)?'(" + "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)" + "|.)",
          end: "'",
          illegal: "."
        },
        e.END_SAME_AS_BEGIN({
          begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
          end: /\)([^()\\ ]{0,16})"/
        })
      ]
    }, u = {
      className: "number",
      variants: [
        { match: /\b(0b[01']+)/ },
        { match: /(-?)\b([\d']+(\.[\d']*)?|\.[\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)/ },
        { match: /(-?)\b(0[xX][a-fA-F0-9]+(?:'[a-fA-F0-9]+)*(?:\.[a-fA-F0-9]*(?:'[a-fA-F0-9]*)*)?(?:[pP][-+]?[0-9]+)?(l|L)?(u|U)?)/ },
        { match: /(-?)\b\d+(?:'\d+)*(?:\.\d*(?:'\d*)*)?(?:[eE][-+]?\d+)?/ }
      ],
      relevance: 0
    }, b = {
      className: "meta",
      begin: /#\s*[a-z]+\b/,
      end: /$/,
      keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef elifdef elifndef include" },
      contains: [
        {
          begin: /\\\n/,
          relevance: 0
        },
        e.inherit(a, { className: "string" }),
        {
          className: "string",
          begin: /<.*?>/
        },
        i,
        e.C_BLOCK_COMMENT_MODE
      ]
    }, p = {
      className: "title",
      begin: t.optional(l) + e.IDENT_RE,
      relevance: 0
    }, _ = t.optional(l) + e.IDENT_RE + "\\s*\\(", v = {
      keyword: [
        "asm",
        "auto",
        "break",
        "case",
        "continue",
        "default",
        "do",
        "else",
        "enum",
        "extern",
        "for",
        "fortran",
        "goto",
        "if",
        "inline",
        "register",
        "restrict",
        "return",
        "sizeof",
        "typeof",
        "typeof_unqual",
        "struct",
        "switch",
        "typedef",
        "union",
        "volatile",
        "while",
        "_Alignas",
        "_Alignof",
        "_Atomic",
        "_Generic",
        "_Noreturn",
        "_Static_assert",
        "_Thread_local",
        // aliases
        "alignas",
        "alignof",
        "noreturn",
        "static_assert",
        "thread_local",
        // not a C keyword but is, for all intents and purposes, treated exactly like one.
        "_Pragma"
      ],
      type: [
        "float",
        "double",
        "signed",
        "unsigned",
        "int",
        "short",
        "long",
        "char",
        "void",
        "_Bool",
        "_BitInt",
        "_Complex",
        "_Imaginary",
        "_Decimal32",
        "_Decimal64",
        "_Decimal96",
        "_Decimal128",
        "_Decimal64x",
        "_Decimal128x",
        "_Float16",
        "_Float32",
        "_Float64",
        "_Float128",
        "_Float32x",
        "_Float64x",
        "_Float128x",
        // modifiers
        "const",
        "static",
        "constexpr",
        // aliases
        "complex",
        "bool",
        "imaginary"
      ],
      literal: "true false NULL",
      // TODO: apply hinting work similar to what was done in cpp.js
      built_in: "std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
    }, T = [
      b,
      c,
      i,
      e.C_BLOCK_COMMENT_MODE,
      u,
      a
    ], w = {
      // This mode covers expression context where we can't expect a function
      // definition and shouldn't highlight anything that looks like one:
      // `return some()`, `else if()`, `(x*sum(1, 2))`
      variants: [
        {
          begin: /=/,
          end: /;/
        },
        {
          begin: /\(/,
          end: /\)/
        },
        {
          beginKeywords: "new throw return else",
          end: /;/
        }
      ],
      keywords: v,
      contains: T.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: v,
          contains: T.concat(["self"]),
          relevance: 0
        }
      ]),
      relevance: 0
    }, B = {
      begin: "(" + s + "[\\*&\\s]+)+" + _,
      returnBegin: !0,
      end: /[{;=]/,
      excludeEnd: !0,
      keywords: v,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [
        {
          // to prevent it from being confused as the function title
          begin: d,
          keywords: v,
          relevance: 0
        },
        {
          begin: _,
          returnBegin: !0,
          contains: [e.inherit(p, { className: "title.function" })],
          relevance: 0
        },
        // allow for multiple declarations, e.g.:
        // extern void f(int), g(char);
        {
          relevance: 0,
          match: /,/
        },
        {
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: v,
          relevance: 0,
          contains: [
            i,
            e.C_BLOCK_COMMENT_MODE,
            a,
            u,
            c,
            // Count matching parentheses.
            {
              begin: /\(/,
              end: /\)/,
              keywords: v,
              relevance: 0,
              contains: [
                "self",
                i,
                e.C_BLOCK_COMMENT_MODE,
                a,
                u,
                c
              ]
            }
          ]
        },
        c,
        i,
        e.C_BLOCK_COMMENT_MODE,
        b
      ]
    };
    return {
      name: "C",
      aliases: ["h"],
      keywords: v,
      // Until differentiations are added between `c` and `cpp`, `c` will
      // not be auto-detected to avoid auto-detect conflicts between C and C++
      disableAutodetect: !0,
      illegal: "</",
      contains: [].concat(
        w,
        B,
        T,
        [
          b,
          {
            begin: e.IDENT_RE + "::",
            keywords: v
          },
          {
            className: "class",
            beginKeywords: "enum class struct union",
            end: /[{;:<>=]/,
            contains: [
              { beginKeywords: "final class struct" },
              e.TITLE_MODE
            ]
          }
        ]
      ),
      exports: {
        preprocessor: b,
        strings: a,
        keywords: v
      }
    };
  }
  return Fe = n, Fe;
}
var $e, Dn;
function Ua() {
  if (Dn) return $e;
  Dn = 1;
  function n(e) {
    const t = e.regex, i = e.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] }), d = "decltype\\(auto\\)", l = "[a-zA-Z_]\\w*::", s = "(?!struct)(" + d + "|" + t.optional(l) + "[a-zA-Z_]\\w*" + t.optional("<[^<>]+>") + ")", c = {
      className: "type",
      begin: "\\b[a-z\\d_]*_t\\b"
    }, a = {
      className: "string",
      variants: [
        {
          begin: '(u8?|U|L)?"',
          end: '"',
          illegal: "\\n",
          contains: [e.BACKSLASH_ESCAPE]
        },
        {
          begin: "(u8?|U|L)?'(" + "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)" + "|.)",
          end: "'",
          illegal: "."
        },
        e.END_SAME_AS_BEGIN({
          begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
          end: /\)([^()\\ ]{0,16})"/
        })
      ]
    }, u = {
      className: "number",
      variants: [
        // Floating-point literal.
        {
          begin: "[+-]?(?:(?:[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
        },
        // Integer literal.
        {
          begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
          // Note: there are user-defined literal suffixes too, but perhaps having the custom suffix not part of the
          // literal highlight actually makes it stand out more.
        }
      ],
      relevance: 0
    }, b = {
      className: "meta",
      begin: /#\s*[a-z]+\b/,
      end: /$/,
      keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include" },
      contains: [
        {
          begin: /\\\n/,
          relevance: 0
        },
        e.inherit(a, { className: "string" }),
        {
          className: "string",
          begin: /<.*?>/
        },
        i,
        e.C_BLOCK_COMMENT_MODE
      ]
    }, p = {
      className: "title",
      begin: t.optional(l) + e.IDENT_RE,
      relevance: 0
    }, _ = t.optional(l) + e.IDENT_RE + "\\s*\\(", h = [
      "alignas",
      "alignof",
      "and",
      "and_eq",
      "asm",
      "atomic_cancel",
      "atomic_commit",
      "atomic_noexcept",
      "auto",
      "bitand",
      "bitor",
      "break",
      "case",
      "catch",
      "class",
      "co_await",
      "co_return",
      "co_yield",
      "compl",
      "concept",
      "const_cast|10",
      "consteval",
      "constexpr",
      "constinit",
      "continue",
      "decltype",
      "default",
      "delete",
      "do",
      "dynamic_cast|10",
      "else",
      "enum",
      "explicit",
      "export",
      "extern",
      "false",
      "final",
      "for",
      "friend",
      "goto",
      "if",
      "import",
      "inline",
      "module",
      "mutable",
      "namespace",
      "new",
      "noexcept",
      "not",
      "not_eq",
      "nullptr",
      "operator",
      "or",
      "or_eq",
      "override",
      "private",
      "protected",
      "public",
      "reflexpr",
      "register",
      "reinterpret_cast|10",
      "requires",
      "return",
      "sizeof",
      "static_assert",
      "static_cast|10",
      "struct",
      "switch",
      "synchronized",
      "template",
      "this",
      "thread_local",
      "throw",
      "transaction_safe",
      "transaction_safe_dynamic",
      "true",
      "try",
      "typedef",
      "typeid",
      "typename",
      "union",
      "using",
      "virtual",
      "volatile",
      "while",
      "xor",
      "xor_eq"
    ], m = [
      "bool",
      "char",
      "char16_t",
      "char32_t",
      "char8_t",
      "double",
      "float",
      "int",
      "long",
      "short",
      "void",
      "wchar_t",
      "unsigned",
      "signed",
      "const",
      "static"
    ], v = [
      "any",
      "auto_ptr",
      "barrier",
      "binary_semaphore",
      "bitset",
      "complex",
      "condition_variable",
      "condition_variable_any",
      "counting_semaphore",
      "deque",
      "false_type",
      "flat_map",
      "flat_set",
      "future",
      "imaginary",
      "initializer_list",
      "istringstream",
      "jthread",
      "latch",
      "lock_guard",
      "multimap",
      "multiset",
      "mutex",
      "optional",
      "ostringstream",
      "packaged_task",
      "pair",
      "promise",
      "priority_queue",
      "queue",
      "recursive_mutex",
      "recursive_timed_mutex",
      "scoped_lock",
      "set",
      "shared_future",
      "shared_lock",
      "shared_mutex",
      "shared_timed_mutex",
      "shared_ptr",
      "stack",
      "string_view",
      "stringstream",
      "timed_mutex",
      "thread",
      "true_type",
      "tuple",
      "unique_lock",
      "unique_ptr",
      "unordered_map",
      "unordered_multimap",
      "unordered_multiset",
      "unordered_set",
      "variant",
      "vector",
      "weak_ptr",
      "wstring",
      "wstring_view"
    ], T = [
      "abort",
      "abs",
      "acos",
      "apply",
      "as_const",
      "asin",
      "atan",
      "atan2",
      "calloc",
      "ceil",
      "cerr",
      "cin",
      "clog",
      "cos",
      "cosh",
      "cout",
      "declval",
      "endl",
      "exchange",
      "exit",
      "exp",
      "fabs",
      "floor",
      "fmod",
      "forward",
      "fprintf",
      "fputs",
      "free",
      "frexp",
      "fscanf",
      "future",
      "invoke",
      "isalnum",
      "isalpha",
      "iscntrl",
      "isdigit",
      "isgraph",
      "islower",
      "isprint",
      "ispunct",
      "isspace",
      "isupper",
      "isxdigit",
      "labs",
      "launder",
      "ldexp",
      "log",
      "log10",
      "make_pair",
      "make_shared",
      "make_shared_for_overwrite",
      "make_tuple",
      "make_unique",
      "malloc",
      "memchr",
      "memcmp",
      "memcpy",
      "memset",
      "modf",
      "move",
      "pow",
      "printf",
      "putchar",
      "puts",
      "realloc",
      "scanf",
      "sin",
      "sinh",
      "snprintf",
      "sprintf",
      "sqrt",
      "sscanf",
      "std",
      "stderr",
      "stdin",
      "stdout",
      "strcat",
      "strchr",
      "strcmp",
      "strcpy",
      "strcspn",
      "strlen",
      "strncat",
      "strncmp",
      "strncpy",
      "strpbrk",
      "strrchr",
      "strspn",
      "strstr",
      "swap",
      "tan",
      "tanh",
      "terminate",
      "to_underlying",
      "tolower",
      "toupper",
      "vfprintf",
      "visit",
      "vprintf",
      "vsprintf"
    ], R = {
      type: m,
      keyword: h,
      literal: [
        "NULL",
        "false",
        "nullopt",
        "nullptr",
        "true"
      ],
      built_in: ["_Pragma"],
      _type_hints: v
    }, C = {
      className: "function.dispatch",
      relevance: 0,
      keywords: {
        // Only for relevance, not highlighting.
        _hint: T
      },
      begin: t.concat(
        /\b/,
        /(?!decltype)/,
        /(?!if)/,
        /(?!for)/,
        /(?!switch)/,
        /(?!while)/,
        e.IDENT_RE,
        t.lookahead(/(<[^<>]+>|)\s*\(/)
      )
    }, L = [
      C,
      b,
      c,
      i,
      e.C_BLOCK_COMMENT_MODE,
      u,
      a
    ], S = {
      // This mode covers expression context where we can't expect a function
      // definition and shouldn't highlight anything that looks like one:
      // `return some()`, `else if()`, `(x*sum(1, 2))`
      variants: [
        {
          begin: /=/,
          end: /;/
        },
        {
          begin: /\(/,
          end: /\)/
        },
        {
          beginKeywords: "new throw return else",
          end: /;/
        }
      ],
      keywords: R,
      contains: L.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: R,
          contains: L.concat(["self"]),
          relevance: 0
        }
      ]),
      relevance: 0
    }, I = {
      className: "function",
      begin: "(" + s + "[\\*&\\s]+)+" + _,
      returnBegin: !0,
      end: /[{;=]/,
      excludeEnd: !0,
      keywords: R,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [
        {
          // to prevent it from being confused as the function title
          begin: d,
          keywords: R,
          relevance: 0
        },
        {
          begin: _,
          returnBegin: !0,
          contains: [p],
          relevance: 0
        },
        // needed because we do not have look-behind on the below rule
        // to prevent it from grabbing the final : in a :: pair
        {
          begin: /::/,
          relevance: 0
        },
        // initializers
        {
          begin: /:/,
          endsWithParent: !0,
          contains: [
            a,
            u
          ]
        },
        // allow for multiple declarations, e.g.:
        // extern void f(int), g(char);
        {
          relevance: 0,
          match: /,/
        },
        {
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: R,
          relevance: 0,
          contains: [
            i,
            e.C_BLOCK_COMMENT_MODE,
            a,
            u,
            c,
            // Count matching parentheses.
            {
              begin: /\(/,
              end: /\)/,
              keywords: R,
              relevance: 0,
              contains: [
                "self",
                i,
                e.C_BLOCK_COMMENT_MODE,
                a,
                u,
                c
              ]
            }
          ]
        },
        c,
        i,
        e.C_BLOCK_COMMENT_MODE,
        b
      ]
    };
    return {
      name: "C++",
      aliases: [
        "cc",
        "c++",
        "h++",
        "hpp",
        "hh",
        "hxx",
        "cxx"
      ],
      keywords: R,
      illegal: "</",
      classNameAliases: { "function.dispatch": "built_in" },
      contains: [].concat(
        S,
        I,
        C,
        L,
        [
          b,
          {
            // containers: ie, `vector <int> rooms (9);`
            begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
            end: ">",
            keywords: R,
            contains: [
              "self",
              c
            ]
          },
          {
            begin: e.IDENT_RE + "::",
            keywords: R
          },
          {
            match: [
              // extra complexity to deal with `enum class` and `enum struct`
              /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
              /\s+/,
              /\w+/
            ],
            className: {
              1: "keyword",
              3: "title.class"
            }
          }
        ]
      )
    };
  }
  return $e = n, $e;
}
var ze, Bn;
function Pa() {
  if (Bn) return ze;
  Bn = 1;
  function n(e) {
    const t = [
      "bool",
      "byte",
      "char",
      "decimal",
      "delegate",
      "double",
      "dynamic",
      "enum",
      "float",
      "int",
      "long",
      "nint",
      "nuint",
      "object",
      "sbyte",
      "short",
      "string",
      "ulong",
      "uint",
      "ushort"
    ], i = [
      "public",
      "private",
      "protected",
      "static",
      "internal",
      "protected",
      "abstract",
      "async",
      "extern",
      "override",
      "unsafe",
      "virtual",
      "new",
      "sealed",
      "partial"
    ], d = [
      "default",
      "false",
      "null",
      "true"
    ], l = [
      "abstract",
      "as",
      "base",
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "do",
      "else",
      "event",
      "explicit",
      "extern",
      "finally",
      "fixed",
      "for",
      "foreach",
      "goto",
      "if",
      "implicit",
      "in",
      "interface",
      "internal",
      "is",
      "lock",
      "namespace",
      "new",
      "operator",
      "out",
      "override",
      "params",
      "private",
      "protected",
      "public",
      "readonly",
      "record",
      "ref",
      "return",
      "scoped",
      "sealed",
      "sizeof",
      "stackalloc",
      "static",
      "struct",
      "switch",
      "this",
      "throw",
      "try",
      "typeof",
      "unchecked",
      "unsafe",
      "using",
      "virtual",
      "void",
      "volatile",
      "while"
    ], r = [
      "add",
      "alias",
      "and",
      "ascending",
      "args",
      "async",
      "await",
      "by",
      "descending",
      "dynamic",
      "equals",
      "file",
      "from",
      "get",
      "global",
      "group",
      "init",
      "into",
      "join",
      "let",
      "nameof",
      "not",
      "notnull",
      "on",
      "or",
      "orderby",
      "partial",
      "record",
      "remove",
      "required",
      "scoped",
      "select",
      "set",
      "unmanaged",
      "value|0",
      "var",
      "when",
      "where",
      "with",
      "yield"
    ], s = {
      keyword: l.concat(r),
      built_in: t,
      literal: d
    }, c = e.inherit(e.TITLE_MODE, { begin: "[a-zA-Z](\\.?\\w)*" }), o = {
      className: "number",
      variants: [
        { begin: "\\b(0b[01']+)" },
        { begin: "(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)(u|U|l|L|ul|UL|f|F|b|B)" },
        { begin: "(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)" }
      ],
      relevance: 0
    }, a = {
      className: "string",
      begin: /"""("*)(?!")(.|\n)*?"""\1/,
      relevance: 1
    }, u = {
      className: "string",
      begin: '@"',
      end: '"',
      contains: [{ begin: '""' }]
    }, b = e.inherit(u, { illegal: /\n/ }), p = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: s
    }, _ = e.inherit(p, { illegal: /\n/ }), h = {
      className: "string",
      begin: /\$"/,
      end: '"',
      illegal: /\n/,
      contains: [
        { begin: /\{\{/ },
        { begin: /\}\}/ },
        e.BACKSLASH_ESCAPE,
        _
      ]
    }, m = {
      className: "string",
      begin: /\$@"/,
      end: '"',
      contains: [
        { begin: /\{\{/ },
        { begin: /\}\}/ },
        { begin: '""' },
        p
      ]
    }, v = e.inherit(m, {
      illegal: /\n/,
      contains: [
        { begin: /\{\{/ },
        { begin: /\}\}/ },
        { begin: '""' },
        _
      ]
    });
    p.contains = [
      m,
      h,
      u,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      o,
      e.C_BLOCK_COMMENT_MODE
    ], _.contains = [
      v,
      h,
      b,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      o,
      e.inherit(e.C_BLOCK_COMMENT_MODE, { illegal: /\n/ })
    ];
    const T = { variants: [
      a,
      m,
      h,
      u,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE
    ] }, w = {
      begin: "<",
      end: ">",
      contains: [
        { beginKeywords: "in out" },
        c
      ]
    }, B = e.IDENT_RE + "(<" + e.IDENT_RE + "(\\s*,\\s*" + e.IDENT_RE + ")*>)?(\\[\\])?", R = {
      // prevents expressions like `@class` from incorrect flagging
      // `class` as a keyword
      begin: "@" + e.IDENT_RE,
      relevance: 0
    };
    return {
      name: "C#",
      aliases: [
        "cs",
        "c#"
      ],
      keywords: s,
      illegal: /::/,
      contains: [
        e.COMMENT(
          "///",
          "$",
          {
            returnBegin: !0,
            contains: [
              {
                className: "doctag",
                variants: [
                  {
                    begin: "///",
                    relevance: 0
                  },
                  { begin: "<!--|-->" },
                  {
                    begin: "</?",
                    end: ">"
                  }
                ]
              }
            ]
          }
        ),
        e.C_LINE_COMMENT_MODE,
        e.C_BLOCK_COMMENT_MODE,
        {
          className: "meta",
          begin: "#",
          end: "$",
          keywords: { keyword: "if else elif endif define undef warning error line region endregion pragma checksum" }
        },
        T,
        o,
        {
          beginKeywords: "class interface",
          relevance: 0,
          end: /[{;=]/,
          illegal: /[^\s:,]/,
          contains: [
            { beginKeywords: "where class" },
            c,
            w,
            e.C_LINE_COMMENT_MODE,
            e.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          beginKeywords: "namespace",
          relevance: 0,
          end: /[{;=]/,
          illegal: /[^\s:]/,
          contains: [
            c,
            e.C_LINE_COMMENT_MODE,
            e.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          beginKeywords: "record",
          relevance: 0,
          end: /[{;=]/,
          illegal: /[^\s:]/,
          contains: [
            c,
            w,
            e.C_LINE_COMMENT_MODE,
            e.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          // [Attributes("")]
          className: "meta",
          begin: "^\\s*\\[(?=[\\w])",
          excludeBegin: !0,
          end: "\\]",
          excludeEnd: !0,
          contains: [
            {
              className: "string",
              begin: /"/,
              end: /"/
            }
          ]
        },
        {
          // Expression keywords prevent 'keyword Name(...)' from being
          // recognized as a function definition
          beginKeywords: "new return throw await else",
          relevance: 0
        },
        {
          className: "function",
          begin: "(" + B + "\\s+)+" + e.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
          returnBegin: !0,
          end: /\s*[{;=]/,
          excludeEnd: !0,
          keywords: s,
          contains: [
            // prevents these from being highlighted `title`
            {
              beginKeywords: i.join(" "),
              relevance: 0
            },
            {
              begin: e.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
              returnBegin: !0,
              contains: [
                e.TITLE_MODE,
                w
              ],
              relevance: 0
            },
            { match: /\(\)/ },
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              excludeBegin: !0,
              excludeEnd: !0,
              keywords: s,
              relevance: 0,
              contains: [
                T,
                o,
                e.C_BLOCK_COMMENT_MODE
              ]
            },
            e.C_LINE_COMMENT_MODE,
            e.C_BLOCK_COMMENT_MODE
          ]
        },
        R
      ]
    };
  }
  return ze = n, ze;
}
var Ke, Un;
function Fa() {
  if (Un) return Ke;
  Un = 1;
  const n = (o) => ({
    IMPORTANT: {
      scope: "meta",
      begin: "!important"
    },
    BLOCK_COMMENT: o.C_BLOCK_COMMENT_MODE,
    HEXCOLOR: {
      scope: "number",
      begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
    },
    FUNCTION_DISPATCH: {
      className: "built_in",
      begin: /[\w-]+(?=\()/
    },
    ATTRIBUTE_SELECTOR_MODE: {
      scope: "selector-attr",
      begin: /\[/,
      end: /\]/,
      illegal: "$",
      contains: [
        o.APOS_STRING_MODE,
        o.QUOTE_STRING_MODE
      ]
    },
    CSS_NUMBER_MODE: {
      scope: "number",
      begin: o.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
      relevance: 0
    },
    CSS_VARIABLE: {
      className: "attr",
      begin: /--[A-Za-z_][A-Za-z0-9_-]*/
    }
  }), e = [
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "audio",
    "b",
    "blockquote",
    "body",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "dd",
    "del",
    "details",
    "dfn",
    "div",
    "dl",
    "dt",
    "em",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "main",
    "mark",
    "menu",
    "nav",
    "object",
    "ol",
    "optgroup",
    "option",
    "p",
    "picture",
    "q",
    "quote",
    "samp",
    "section",
    "select",
    "source",
    "span",
    "strong",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "tr",
    "ul",
    "var",
    "video"
  ], t = [
    "defs",
    "g",
    "marker",
    "mask",
    "pattern",
    "svg",
    "switch",
    "symbol",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feFlood",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMorphology",
    "feOffset",
    "feSpecularLighting",
    "feTile",
    "feTurbulence",
    "linearGradient",
    "radialGradient",
    "stop",
    "circle",
    "ellipse",
    "image",
    "line",
    "path",
    "polygon",
    "polyline",
    "rect",
    "text",
    "use",
    "textPath",
    "tspan",
    "foreignObject",
    "clipPath"
  ], i = [
    ...e,
    ...t
  ], d = [
    "any-hover",
    "any-pointer",
    "aspect-ratio",
    "color",
    "color-gamut",
    "color-index",
    "device-aspect-ratio",
    "device-height",
    "device-width",
    "display-mode",
    "forced-colors",
    "grid",
    "height",
    "hover",
    "inverted-colors",
    "monochrome",
    "orientation",
    "overflow-block",
    "overflow-inline",
    "pointer",
    "prefers-color-scheme",
    "prefers-contrast",
    "prefers-reduced-motion",
    "prefers-reduced-transparency",
    "resolution",
    "scan",
    "scripting",
    "update",
    "width",
    // TODO: find a better solution?
    "min-width",
    "max-width",
    "min-height",
    "max-height"
  ].sort().reverse(), l = [
    "active",
    "any-link",
    "blank",
    "checked",
    "current",
    "default",
    "defined",
    "dir",
    // dir()
    "disabled",
    "drop",
    "empty",
    "enabled",
    "first",
    "first-child",
    "first-of-type",
    "fullscreen",
    "future",
    "focus",
    "focus-visible",
    "focus-within",
    "has",
    // has()
    "host",
    // host or host()
    "host-context",
    // host-context()
    "hover",
    "indeterminate",
    "in-range",
    "invalid",
    "is",
    // is()
    "lang",
    // lang()
    "last-child",
    "last-of-type",
    "left",
    "link",
    "local-link",
    "not",
    // not()
    "nth-child",
    // nth-child()
    "nth-col",
    // nth-col()
    "nth-last-child",
    // nth-last-child()
    "nth-last-col",
    // nth-last-col()
    "nth-last-of-type",
    //nth-last-of-type()
    "nth-of-type",
    //nth-of-type()
    "only-child",
    "only-of-type",
    "optional",
    "out-of-range",
    "past",
    "placeholder-shown",
    "read-only",
    "read-write",
    "required",
    "right",
    "root",
    "scope",
    "target",
    "target-within",
    "user-invalid",
    "valid",
    "visited",
    "where"
    // where()
  ].sort().reverse(), r = [
    "after",
    "backdrop",
    "before",
    "cue",
    "cue-region",
    "first-letter",
    "first-line",
    "grammar-error",
    "marker",
    "part",
    "placeholder",
    "selection",
    "slotted",
    "spelling-error"
  ].sort().reverse(), s = [
    "accent-color",
    "align-content",
    "align-items",
    "align-self",
    "alignment-baseline",
    "all",
    "anchor-name",
    "animation",
    "animation-composition",
    "animation-delay",
    "animation-direction",
    "animation-duration",
    "animation-fill-mode",
    "animation-iteration-count",
    "animation-name",
    "animation-play-state",
    "animation-range",
    "animation-range-end",
    "animation-range-start",
    "animation-timeline",
    "animation-timing-function",
    "appearance",
    "aspect-ratio",
    "backdrop-filter",
    "backface-visibility",
    "background",
    "background-attachment",
    "background-blend-mode",
    "background-clip",
    "background-color",
    "background-image",
    "background-origin",
    "background-position",
    "background-position-x",
    "background-position-y",
    "background-repeat",
    "background-size",
    "baseline-shift",
    "block-size",
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-end-color",
    "border-block-end-style",
    "border-block-end-width",
    "border-block-start",
    "border-block-start-color",
    "border-block-start-style",
    "border-block-start-width",
    "border-block-style",
    "border-block-width",
    "border-bottom",
    "border-bottom-color",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-bottom-style",
    "border-bottom-width",
    "border-collapse",
    "border-color",
    "border-end-end-radius",
    "border-end-start-radius",
    "border-image",
    "border-image-outset",
    "border-image-repeat",
    "border-image-slice",
    "border-image-source",
    "border-image-width",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-end-color",
    "border-inline-end-style",
    "border-inline-end-width",
    "border-inline-start",
    "border-inline-start-color",
    "border-inline-start-style",
    "border-inline-start-width",
    "border-inline-style",
    "border-inline-width",
    "border-left",
    "border-left-color",
    "border-left-style",
    "border-left-width",
    "border-radius",
    "border-right",
    "border-right-color",
    "border-right-style",
    "border-right-width",
    "border-spacing",
    "border-start-end-radius",
    "border-start-start-radius",
    "border-style",
    "border-top",
    "border-top-color",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-top-style",
    "border-top-width",
    "border-width",
    "bottom",
    "box-align",
    "box-decoration-break",
    "box-direction",
    "box-flex",
    "box-flex-group",
    "box-lines",
    "box-ordinal-group",
    "box-orient",
    "box-pack",
    "box-shadow",
    "box-sizing",
    "break-after",
    "break-before",
    "break-inside",
    "caption-side",
    "caret-color",
    "clear",
    "clip",
    "clip-path",
    "clip-rule",
    "color",
    "color-interpolation",
    "color-interpolation-filters",
    "color-profile",
    "color-rendering",
    "color-scheme",
    "column-count",
    "column-fill",
    "column-gap",
    "column-rule",
    "column-rule-color",
    "column-rule-style",
    "column-rule-width",
    "column-span",
    "column-width",
    "columns",
    "contain",
    "contain-intrinsic-block-size",
    "contain-intrinsic-height",
    "contain-intrinsic-inline-size",
    "contain-intrinsic-size",
    "contain-intrinsic-width",
    "container",
    "container-name",
    "container-type",
    "content",
    "content-visibility",
    "counter-increment",
    "counter-reset",
    "counter-set",
    "cue",
    "cue-after",
    "cue-before",
    "cursor",
    "cx",
    "cy",
    "direction",
    "display",
    "dominant-baseline",
    "empty-cells",
    "enable-background",
    "field-sizing",
    "fill",
    "fill-opacity",
    "fill-rule",
    "filter",
    "flex",
    "flex-basis",
    "flex-direction",
    "flex-flow",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "float",
    "flood-color",
    "flood-opacity",
    "flow",
    "font",
    "font-display",
    "font-family",
    "font-feature-settings",
    "font-kerning",
    "font-language-override",
    "font-optical-sizing",
    "font-palette",
    "font-size",
    "font-size-adjust",
    "font-smooth",
    "font-smoothing",
    "font-stretch",
    "font-style",
    "font-synthesis",
    "font-synthesis-position",
    "font-synthesis-small-caps",
    "font-synthesis-style",
    "font-synthesis-weight",
    "font-variant",
    "font-variant-alternates",
    "font-variant-caps",
    "font-variant-east-asian",
    "font-variant-emoji",
    "font-variant-ligatures",
    "font-variant-numeric",
    "font-variant-position",
    "font-variation-settings",
    "font-weight",
    "forced-color-adjust",
    "gap",
    "glyph-orientation-horizontal",
    "glyph-orientation-vertical",
    "grid",
    "grid-area",
    "grid-auto-columns",
    "grid-auto-flow",
    "grid-auto-rows",
    "grid-column",
    "grid-column-end",
    "grid-column-start",
    "grid-gap",
    "grid-row",
    "grid-row-end",
    "grid-row-start",
    "grid-template",
    "grid-template-areas",
    "grid-template-columns",
    "grid-template-rows",
    "hanging-punctuation",
    "height",
    "hyphenate-character",
    "hyphenate-limit-chars",
    "hyphens",
    "icon",
    "image-orientation",
    "image-rendering",
    "image-resolution",
    "ime-mode",
    "initial-letter",
    "initial-letter-align",
    "inline-size",
    "inset",
    "inset-area",
    "inset-block",
    "inset-block-end",
    "inset-block-start",
    "inset-inline",
    "inset-inline-end",
    "inset-inline-start",
    "isolation",
    "justify-content",
    "justify-items",
    "justify-self",
    "kerning",
    "left",
    "letter-spacing",
    "lighting-color",
    "line-break",
    "line-height",
    "line-height-step",
    "list-style",
    "list-style-image",
    "list-style-position",
    "list-style-type",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "margin-trim",
    "marker",
    "marker-end",
    "marker-mid",
    "marker-start",
    "marks",
    "mask",
    "mask-border",
    "mask-border-mode",
    "mask-border-outset",
    "mask-border-repeat",
    "mask-border-slice",
    "mask-border-source",
    "mask-border-width",
    "mask-clip",
    "mask-composite",
    "mask-image",
    "mask-mode",
    "mask-origin",
    "mask-position",
    "mask-repeat",
    "mask-size",
    "mask-type",
    "masonry-auto-flow",
    "math-depth",
    "math-shift",
    "math-style",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "mix-blend-mode",
    "nav-down",
    "nav-index",
    "nav-left",
    "nav-right",
    "nav-up",
    "none",
    "normal",
    "object-fit",
    "object-position",
    "offset",
    "offset-anchor",
    "offset-distance",
    "offset-path",
    "offset-position",
    "offset-rotate",
    "opacity",
    "order",
    "orphans",
    "outline",
    "outline-color",
    "outline-offset",
    "outline-style",
    "outline-width",
    "overflow",
    "overflow-anchor",
    "overflow-block",
    "overflow-clip-margin",
    "overflow-inline",
    "overflow-wrap",
    "overflow-x",
    "overflow-y",
    "overlay",
    "overscroll-behavior",
    "overscroll-behavior-block",
    "overscroll-behavior-inline",
    "overscroll-behavior-x",
    "overscroll-behavior-y",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "page",
    "page-break-after",
    "page-break-before",
    "page-break-inside",
    "paint-order",
    "pause",
    "pause-after",
    "pause-before",
    "perspective",
    "perspective-origin",
    "place-content",
    "place-items",
    "place-self",
    "pointer-events",
    "position",
    "position-anchor",
    "position-visibility",
    "print-color-adjust",
    "quotes",
    "r",
    "resize",
    "rest",
    "rest-after",
    "rest-before",
    "right",
    "rotate",
    "row-gap",
    "ruby-align",
    "ruby-position",
    "scale",
    "scroll-behavior",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-block-end",
    "scroll-margin-block-start",
    "scroll-margin-bottom",
    "scroll-margin-inline",
    "scroll-margin-inline-end",
    "scroll-margin-inline-start",
    "scroll-margin-left",
    "scroll-margin-right",
    "scroll-margin-top",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-block-end",
    "scroll-padding-block-start",
    "scroll-padding-bottom",
    "scroll-padding-inline",
    "scroll-padding-inline-end",
    "scroll-padding-inline-start",
    "scroll-padding-left",
    "scroll-padding-right",
    "scroll-padding-top",
    "scroll-snap-align",
    "scroll-snap-stop",
    "scroll-snap-type",
    "scroll-timeline",
    "scroll-timeline-axis",
    "scroll-timeline-name",
    "scrollbar-color",
    "scrollbar-gutter",
    "scrollbar-width",
    "shape-image-threshold",
    "shape-margin",
    "shape-outside",
    "shape-rendering",
    "speak",
    "speak-as",
    "src",
    // @font-face
    "stop-color",
    "stop-opacity",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "tab-size",
    "table-layout",
    "text-align",
    "text-align-all",
    "text-align-last",
    "text-anchor",
    "text-combine-upright",
    "text-decoration",
    "text-decoration-color",
    "text-decoration-line",
    "text-decoration-skip",
    "text-decoration-skip-ink",
    "text-decoration-style",
    "text-decoration-thickness",
    "text-emphasis",
    "text-emphasis-color",
    "text-emphasis-position",
    "text-emphasis-style",
    "text-indent",
    "text-justify",
    "text-orientation",
    "text-overflow",
    "text-rendering",
    "text-shadow",
    "text-size-adjust",
    "text-transform",
    "text-underline-offset",
    "text-underline-position",
    "text-wrap",
    "text-wrap-mode",
    "text-wrap-style",
    "timeline-scope",
    "top",
    "touch-action",
    "transform",
    "transform-box",
    "transform-origin",
    "transform-style",
    "transition",
    "transition-behavior",
    "transition-delay",
    "transition-duration",
    "transition-property",
    "transition-timing-function",
    "translate",
    "unicode-bidi",
    "user-modify",
    "user-select",
    "vector-effect",
    "vertical-align",
    "view-timeline",
    "view-timeline-axis",
    "view-timeline-inset",
    "view-timeline-name",
    "view-transition-name",
    "visibility",
    "voice-balance",
    "voice-duration",
    "voice-family",
    "voice-pitch",
    "voice-range",
    "voice-rate",
    "voice-stress",
    "voice-volume",
    "white-space",
    "white-space-collapse",
    "widows",
    "width",
    "will-change",
    "word-break",
    "word-spacing",
    "word-wrap",
    "writing-mode",
    "x",
    "y",
    "z-index",
    "zoom"
  ].sort().reverse();
  function c(o) {
    const a = o.regex, u = n(o), b = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, p = "and or not only", _ = /@-?\w[\w]*(-\w+)*/, h = "[a-zA-Z-][a-zA-Z0-9_-]*", m = [
      o.APOS_STRING_MODE,
      o.QUOTE_STRING_MODE
    ];
    return {
      name: "CSS",
      case_insensitive: !0,
      illegal: /[=|'\$]/,
      keywords: { keyframePosition: "from to" },
      classNameAliases: {
        // for visual continuity with `tag {}` and because we
        // don't have a great class for this?
        keyframePosition: "selector-tag"
      },
      contains: [
        u.BLOCK_COMMENT,
        b,
        // to recognize keyframe 40% etc which are outside the scope of our
        // attribute value mode
        u.CSS_NUMBER_MODE,
        {
          className: "selector-id",
          begin: /#[A-Za-z0-9_-]+/,
          relevance: 0
        },
        {
          className: "selector-class",
          begin: "\\." + h,
          relevance: 0
        },
        u.ATTRIBUTE_SELECTOR_MODE,
        {
          className: "selector-pseudo",
          variants: [
            { begin: ":(" + l.join("|") + ")" },
            { begin: ":(:)?(" + r.join("|") + ")" }
          ]
        },
        // we may actually need this (12/2020)
        // { // pseudo-selector params
        //   begin: /\(/,
        //   end: /\)/,
        //   contains: [ hljs.CSS_NUMBER_MODE ]
        // },
        u.CSS_VARIABLE,
        {
          className: "attribute",
          begin: "\\b(" + s.join("|") + ")\\b"
        },
        // attribute values
        {
          begin: /:/,
          end: /[;}{]/,
          contains: [
            u.BLOCK_COMMENT,
            u.HEXCOLOR,
            u.IMPORTANT,
            u.CSS_NUMBER_MODE,
            ...m,
            // needed to highlight these as strings and to avoid issues with
            // illegal characters that might be inside urls that would tigger the
            // languages illegal stack
            {
              begin: /(url|data-uri)\(/,
              end: /\)/,
              relevance: 0,
              // from keywords
              keywords: { built_in: "url data-uri" },
              contains: [
                ...m,
                {
                  className: "string",
                  // any character other than `)` as in `url()` will be the start
                  // of a string, which ends with `)` (from the parent mode)
                  begin: /[^)]/,
                  endsWithParent: !0,
                  excludeEnd: !0
                }
              ]
            },
            u.FUNCTION_DISPATCH
          ]
        },
        {
          begin: a.lookahead(/@/),
          end: "[{;]",
          relevance: 0,
          illegal: /:/,
          // break on Less variables @var: ...
          contains: [
            {
              className: "keyword",
              begin: _
            },
            {
              begin: /\s/,
              endsWithParent: !0,
              excludeEnd: !0,
              relevance: 0,
              keywords: {
                $pattern: /[a-z-]+/,
                keyword: p,
                attribute: d.join(" ")
              },
              contains: [
                {
                  begin: /[a-z-]+(?=:)/,
                  className: "attribute"
                },
                ...m,
                u.CSS_NUMBER_MODE
              ]
            }
          ]
        },
        {
          className: "selector-tag",
          begin: "\\b(" + i.join("|") + ")\\b"
        }
      ]
    };
  }
  return Ke = c, Ke;
}
var Ge, Pn;
function $a() {
  if (Pn) return Ge;
  Pn = 1;
  function n(e) {
    const t = e.regex, i = {
      begin: /<\/?[A-Za-z_]/,
      end: ">",
      subLanguage: "xml",
      relevance: 0
    }, d = {
      begin: "^[-\\*]{3,}",
      end: "$"
    }, l = {
      className: "code",
      variants: [
        // TODO: fix to allow these to work with sublanguage also
        { begin: "(`{3,})[^`](.|\\n)*?\\1`*[ ]*" },
        { begin: "(~{3,})[^~](.|\\n)*?\\1~*[ ]*" },
        // needed to allow markdown as a sublanguage to work
        {
          begin: "```",
          end: "```+[ ]*$"
        },
        {
          begin: "~~~",
          end: "~~~+[ ]*$"
        },
        { begin: "`.+?`" },
        {
          begin: "(?=^( {4}|\\t))",
          // use contains to gobble up multiple lines to allow the block to be whatever size
          // but only have a single open/close tag vs one per line
          contains: [
            {
              begin: "^( {4}|\\t)",
              end: "(\\n)$"
            }
          ],
          relevance: 0
        }
      ]
    }, r = {
      className: "bullet",
      begin: "^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",
      end: "\\s+",
      excludeEnd: !0
    }, s = {
      begin: /^\[[^\n]+\]:/,
      returnBegin: !0,
      contains: [
        {
          className: "symbol",
          begin: /\[/,
          end: /\]/,
          excludeBegin: !0,
          excludeEnd: !0
        },
        {
          className: "link",
          begin: /:\s*/,
          end: /$/,
          excludeBegin: !0
        }
      ]
    }, c = /[A-Za-z][A-Za-z0-9+.-]*/, o = {
      variants: [
        // too much like nested array access in so many languages
        // to have any real relevance
        {
          begin: /\[.+?\]\[.*?\]/,
          relevance: 0
        },
        // popular internet URLs
        {
          begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
          relevance: 2
        },
        {
          begin: t.concat(/\[.+?\]\(/, c, /:\/\/.*?\)/),
          relevance: 2
        },
        // relative urls
        {
          begin: /\[.+?\]\([./?&#].*?\)/,
          relevance: 1
        },
        // whatever else, lower relevance (might not be a link at all)
        {
          begin: /\[.*?\]\(.*?\)/,
          relevance: 0
        }
      ],
      returnBegin: !0,
      contains: [
        {
          // empty strings for alt or link text
          match: /\[(?=\])/
        },
        {
          className: "string",
          relevance: 0,
          begin: "\\[",
          end: "\\]",
          excludeBegin: !0,
          returnEnd: !0
        },
        {
          className: "link",
          relevance: 0,
          begin: "\\]\\(",
          end: "\\)",
          excludeBegin: !0,
          excludeEnd: !0
        },
        {
          className: "symbol",
          relevance: 0,
          begin: "\\]\\[",
          end: "\\]",
          excludeBegin: !0,
          excludeEnd: !0
        }
      ]
    }, a = {
      className: "strong",
      contains: [],
      // defined later
      variants: [
        {
          begin: /_{2}(?!\s)/,
          end: /_{2}/
        },
        {
          begin: /\*{2}(?!\s)/,
          end: /\*{2}/
        }
      ]
    }, u = {
      className: "emphasis",
      contains: [],
      // defined later
      variants: [
        {
          begin: /\*(?![*\s])/,
          end: /\*/
        },
        {
          begin: /_(?![_\s])/,
          end: /_/,
          relevance: 0
        }
      ]
    }, b = e.inherit(a, { contains: [] }), p = e.inherit(u, { contains: [] });
    a.contains.push(p), u.contains.push(b);
    let _ = [
      i,
      o
    ];
    return [
      a,
      u,
      b,
      p
    ].forEach((T) => {
      T.contains = T.contains.concat(_);
    }), _ = _.concat(a, u), {
      name: "Markdown",
      aliases: [
        "md",
        "mkdown",
        "mkd"
      ],
      contains: [
        {
          className: "section",
          variants: [
            {
              begin: "^#{1,6}",
              end: "$",
              contains: _
            },
            {
              begin: "(?=^.+?\\n[=-]{2,}$)",
              contains: [
                { begin: "^[=-]*$" },
                {
                  begin: "^",
                  end: "\\n",
                  contains: _
                }
              ]
            }
          ]
        },
        i,
        r,
        a,
        u,
        {
          className: "quote",
          begin: "^>\\s+",
          contains: _,
          end: "$"
        },
        l,
        d,
        o,
        s,
        {
          //https://spec.commonmark.org/0.31.2/#entity-references
          scope: "literal",
          match: /&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/
        }
      ]
    };
  }
  return Ge = n, Ge;
}
var qe, Fn;
function za() {
  if (Fn) return qe;
  Fn = 1;
  function n(e) {
    const t = e.regex;
    return {
      name: "Diff",
      aliases: ["patch"],
      contains: [
        {
          className: "meta",
          relevance: 10,
          match: t.either(
            /^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,
            /^\*\*\* +\d+,\d+ +\*\*\*\*$/,
            /^--- +\d+,\d+ +----$/
          )
        },
        {
          className: "comment",
          variants: [
            {
              begin: t.either(
                /Index: /,
                /^index/,
                /={3,}/,
                /^-{3}/,
                /^\*{3} /,
                /^\+{3}/,
                /^diff --git/
              ),
              end: /$/
            },
            { match: /^\*{15}$/ }
          ]
        },
        {
          className: "addition",
          begin: /^\+/,
          end: /$/
        },
        {
          className: "deletion",
          begin: /^-/,
          end: /$/
        },
        {
          className: "addition",
          begin: /^!/,
          end: /$/
        }
      ]
    };
  }
  return qe = n, qe;
}
var He, $n;
function Ka() {
  if ($n) return He;
  $n = 1;
  function n(e) {
    const t = e.regex, i = "([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)", d = t.either(
      /\b([A-Z]+[a-z0-9]+)+/,
      // ends in caps
      /\b([A-Z]+[a-z0-9]+)+[A-Z]+/
    ), l = t.concat(d, /(::\w+)*/), s = {
      "variable.constant": [
        "__FILE__",
        "__LINE__",
        "__ENCODING__"
      ],
      "variable.language": [
        "self",
        "super"
      ],
      keyword: [
        "alias",
        "and",
        "begin",
        "BEGIN",
        "break",
        "case",
        "class",
        "defined",
        "do",
        "else",
        "elsif",
        "end",
        "END",
        "ensure",
        "for",
        "if",
        "in",
        "module",
        "next",
        "not",
        "or",
        "redo",
        "require",
        "rescue",
        "retry",
        "return",
        "then",
        "undef",
        "unless",
        "until",
        "when",
        "while",
        "yield",
        ...[
          "include",
          "extend",
          "prepend",
          "public",
          "private",
          "protected",
          "raise",
          "throw"
        ]
      ],
      built_in: [
        "proc",
        "lambda",
        "attr_accessor",
        "attr_reader",
        "attr_writer",
        "define_method",
        "private_constant",
        "module_function"
      ],
      literal: [
        "true",
        "false",
        "nil"
      ]
    }, c = {
      className: "doctag",
      begin: "@[A-Za-z]+"
    }, o = {
      begin: "#<",
      end: ">"
    }, a = [
      e.COMMENT(
        "#",
        "$",
        { contains: [c] }
      ),
      e.COMMENT(
        "^=begin",
        "^=end",
        {
          contains: [c],
          relevance: 10
        }
      ),
      e.COMMENT("^__END__", e.MATCH_NOTHING_RE)
    ], u = {
      className: "subst",
      begin: /#\{/,
      end: /\}/,
      keywords: s
    }, b = {
      className: "string",
      contains: [
        e.BACKSLASH_ESCAPE,
        u
      ],
      variants: [
        {
          begin: /'/,
          end: /'/
        },
        {
          begin: /"/,
          end: /"/
        },
        {
          begin: /`/,
          end: /`/
        },
        {
          begin: /%[qQwWx]?\(/,
          end: /\)/
        },
        {
          begin: /%[qQwWx]?\[/,
          end: /\]/
        },
        {
          begin: /%[qQwWx]?\{/,
          end: /\}/
        },
        {
          begin: /%[qQwWx]?</,
          end: />/
        },
        {
          begin: /%[qQwWx]?\//,
          end: /\//
        },
        {
          begin: /%[qQwWx]?%/,
          end: /%/
        },
        {
          begin: /%[qQwWx]?-/,
          end: /-/
        },
        {
          begin: /%[qQwWx]?\|/,
          end: /\|/
        },
        // in the following expressions, \B in the beginning suppresses recognition of ?-sequences
        // where ? is the last character of a preceding identifier, as in: `func?4`
        { begin: /\B\?(\\\d{1,3})/ },
        { begin: /\B\?(\\x[A-Fa-f0-9]{1,2})/ },
        { begin: /\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/ },
        { begin: /\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/ },
        { begin: /\B\?\\(c|C-)[\x20-\x7e]/ },
        { begin: /\B\?\\?\S/ },
        // heredocs
        {
          // this guard makes sure that we have an entire heredoc and not a false
          // positive (auto-detect, etc.)
          begin: t.concat(
            /<<[-~]?'?/,
            t.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)
          ),
          contains: [
            e.END_SAME_AS_BEGIN({
              begin: /(\w+)/,
              end: /(\w+)/,
              contains: [
                e.BACKSLASH_ESCAPE,
                u
              ]
            })
          ]
        }
      ]
    }, p = "[1-9](_?[0-9])*|0", _ = "[0-9](_?[0-9])*", h = {
      className: "number",
      relevance: 0,
      variants: [
        // decimal integer/float, optionally exponential or rational, optionally imaginary
        { begin: `\\b(${p})(\\.(${_}))?([eE][+-]?(${_})|r)?i?\\b` },
        // explicit decimal/binary/octal/hexadecimal integer,
        // optionally rational and/or imaginary
        { begin: "\\b0[dD][0-9](_?[0-9])*r?i?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*r?i?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*r?i?\\b" },
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b" },
        // 0-prefixed implicit octal integer, optionally rational and/or imaginary
        { begin: "\\b0(_?[0-7])+r?i?\\b" }
      ]
    }, m = {
      variants: [
        {
          match: /\(\)/
        },
        {
          className: "params",
          begin: /\(/,
          end: /(?=\))/,
          excludeBegin: !0,
          endsParent: !0,
          keywords: s
        }
      ]
    }, L = [
      b,
      {
        variants: [
          {
            match: [
              /class\s+/,
              l,
              /\s+<\s+/,
              l
            ]
          },
          {
            match: [
              /\b(class|module)\s+/,
              l
            ]
          }
        ],
        scope: {
          2: "title.class",
          4: "title.class.inherited"
        },
        keywords: s
      },
      {
        match: [
          /(include|extend)\s+/,
          l
        ],
        scope: {
          2: "title.class"
        },
        keywords: s
      },
      {
        relevance: 0,
        match: [
          l,
          /\.new[. (]/
        ],
        scope: {
          1: "title.class"
        }
      },
      {
        relevance: 0,
        match: /\b[A-Z][A-Z_0-9]+\b/,
        className: "variable.constant"
      },
      {
        relevance: 0,
        match: d,
        scope: "title.class"
      },
      {
        match: [
          /def/,
          /\s+/,
          i
        ],
        scope: {
          1: "keyword",
          3: "title.function"
        },
        contains: [
          m
        ]
      },
      {
        // swallow namespace qualifiers before symbols
        begin: e.IDENT_RE + "::"
      },
      {
        className: "symbol",
        begin: e.UNDERSCORE_IDENT_RE + "(!|\\?)?:",
        relevance: 0
      },
      {
        className: "symbol",
        begin: ":(?!\\s)",
        contains: [
          b,
          { begin: i }
        ],
        relevance: 0
      },
      h,
      {
        // negative-look forward attempts to prevent false matches like:
        // @ident@ or $ident$ that might indicate this is not ruby at all
        className: "variable",
        begin: "(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"
      },
      {
        className: "params",
        begin: /\|(?!=)/,
        end: /\|/,
        excludeBegin: !0,
        excludeEnd: !0,
        relevance: 0,
        // this could be a lot of things (in other languages) other than params
        keywords: s
      },
      {
        // regexp container
        begin: "(" + e.RE_STARTERS_RE + "|unless)\\s*",
        keywords: "unless",
        contains: [
          {
            className: "regexp",
            contains: [
              e.BACKSLASH_ESCAPE,
              u
            ],
            illegal: /\n/,
            variants: [
              {
                begin: "/",
                end: "/[a-z]*"
              },
              {
                begin: /%r\{/,
                end: /\}[a-z]*/
              },
              {
                begin: "%r\\(",
                end: "\\)[a-z]*"
              },
              {
                begin: "%r!",
                end: "![a-z]*"
              },
              {
                begin: "%r\\[",
                end: "\\][a-z]*"
              }
            ]
          }
        ].concat(o, a),
        relevance: 0
      }
    ].concat(o, a);
    u.contains = L, m.contains = L;
    const N = [
      {
        begin: /^\s*=>/,
        starts: {
          end: "$",
          contains: L
        }
      },
      {
        className: "meta.prompt",
        begin: "^(" + "[>?]>" + "|" + "[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]" + "|" + "(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>" + ")(?=[ ])",
        starts: {
          end: "$",
          keywords: s,
          contains: L
        }
      }
    ];
    return a.unshift(o), {
      name: "Ruby",
      aliases: [
        "rb",
        "gemspec",
        "podspec",
        "thor",
        "irb"
      ],
      keywords: s,
      illegal: /\/\*/,
      contains: [e.SHEBANG({ binary: "ruby" })].concat(N).concat(a).concat(L)
    };
  }
  return He = n, He;
}
var We, zn;
function Ga() {
  if (zn) return We;
  zn = 1;
  function n(e) {
    const r = {
      keyword: [
        "break",
        "case",
        "chan",
        "const",
        "continue",
        "default",
        "defer",
        "else",
        "fallthrough",
        "for",
        "func",
        "go",
        "goto",
        "if",
        "import",
        "interface",
        "map",
        "package",
        "range",
        "return",
        "select",
        "struct",
        "switch",
        "type",
        "var"
      ],
      type: [
        "bool",
        "byte",
        "complex64",
        "complex128",
        "error",
        "float32",
        "float64",
        "int8",
        "int16",
        "int32",
        "int64",
        "string",
        "uint8",
        "uint16",
        "uint32",
        "uint64",
        "int",
        "uint",
        "uintptr",
        "rune"
      ],
      literal: [
        "true",
        "false",
        "iota",
        "nil"
      ],
      built_in: [
        "append",
        "cap",
        "close",
        "complex",
        "copy",
        "imag",
        "len",
        "make",
        "new",
        "panic",
        "print",
        "println",
        "real",
        "recover",
        "delete"
      ]
    };
    return {
      name: "Go",
      aliases: ["golang"],
      keywords: r,
      illegal: "</",
      contains: [
        e.C_LINE_COMMENT_MODE,
        e.C_BLOCK_COMMENT_MODE,
        {
          className: "string",
          variants: [
            e.QUOTE_STRING_MODE,
            e.APOS_STRING_MODE,
            {
              begin: "`",
              end: "`"
            }
          ]
        },
        {
          className: "number",
          variants: [
            {
              match: /-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,
              // hex without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,
              // hex with a present digit before . (making a digit afterwards optional)
              relevance: 0
            },
            {
              match: /-?\b0[oO](_?[0-7])*i?/,
              // leading 0o octal
              relevance: 0
            },
            {
              match: /-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,
              // decimal without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,
              // decimal with a present digit before . (making a digit afterwards optional)
              relevance: 0
            }
          ]
        },
        {
          begin: /:=/
          // relevance booster
        },
        {
          className: "function",
          beginKeywords: "func",
          end: "\\s*(\\{|$)",
          excludeEnd: !0,
          contains: [
            e.TITLE_MODE,
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              endsParent: !0,
              keywords: r,
              illegal: /["']/
            }
          ]
        }
      ]
    };
  }
  return We = n, We;
}
var Ye, Kn;
function qa() {
  if (Kn) return Ye;
  Kn = 1;
  function n(e) {
    const t = e.regex, i = /[_A-Za-z][_0-9A-Za-z]*/;
    return {
      name: "GraphQL",
      aliases: ["gql"],
      case_insensitive: !0,
      disableAutodetect: !1,
      keywords: {
        keyword: [
          "query",
          "mutation",
          "subscription",
          "type",
          "input",
          "schema",
          "directive",
          "interface",
          "union",
          "scalar",
          "fragment",
          "enum",
          "on"
        ],
        literal: [
          "true",
          "false",
          "null"
        ]
      },
      contains: [
        e.HASH_COMMENT_MODE,
        e.QUOTE_STRING_MODE,
        e.NUMBER_MODE,
        {
          scope: "punctuation",
          match: /[.]{3}/,
          relevance: 0
        },
        {
          scope: "punctuation",
          begin: /[\!\(\)\:\=\[\]\{\|\}]{1}/,
          relevance: 0
        },
        {
          scope: "variable",
          begin: /\$/,
          end: /\W/,
          excludeEnd: !0,
          relevance: 0
        },
        {
          scope: "meta",
          match: /@\w+/,
          excludeEnd: !0
        },
        {
          scope: "symbol",
          begin: t.concat(i, t.lookahead(/\s*:/)),
          relevance: 0
        }
      ],
      illegal: [
        /[;<']/,
        /BEGIN/
      ]
    };
  }
  return Ye = n, Ye;
}
var Ze, Gn;
function Ha() {
  if (Gn) return Ze;
  Gn = 1;
  function n(e) {
    const t = e.regex, i = {
      className: "number",
      relevance: 0,
      variants: [
        { begin: /([+-]+)?[\d]+_[\d_]+/ },
        { begin: e.NUMBER_RE }
      ]
    }, d = e.COMMENT();
    d.variants = [
      {
        begin: /;/,
        end: /$/
      },
      {
        begin: /#/,
        end: /$/
      }
    ];
    const l = {
      className: "variable",
      variants: [
        { begin: /\$[\w\d"][\w\d_]*/ },
        { begin: /\$\{(.*?)\}/ }
      ]
    }, r = {
      className: "literal",
      begin: /\bon|off|true|false|yes|no\b/
    }, s = {
      className: "string",
      contains: [e.BACKSLASH_ESCAPE],
      variants: [
        {
          begin: "'''",
          end: "'''",
          relevance: 10
        },
        {
          begin: '"""',
          end: '"""',
          relevance: 10
        },
        {
          begin: '"',
          end: '"'
        },
        {
          begin: "'",
          end: "'"
        }
      ]
    }, c = {
      begin: /\[/,
      end: /\]/,
      contains: [
        d,
        r,
        l,
        s,
        i,
        "self"
      ],
      relevance: 0
    }, o = /[A-Za-z0-9_-]+/, a = /"(\\"|[^"])*"/, u = /'[^']*'/, b = t.either(
      o,
      a,
      u
    ), p = t.concat(
      b,
      "(\\s*\\.\\s*",
      b,
      ")*",
      t.lookahead(/\s*=\s*[^#\s]/)
    );
    return {
      name: "TOML, also INI",
      aliases: ["toml"],
      case_insensitive: !0,
      illegal: /\S/,
      contains: [
        d,
        {
          className: "section",
          begin: /\[+/,
          end: /\]+/
        },
        {
          begin: p,
          className: "attr",
          starts: {
            end: /$/,
            contains: [
              d,
              c,
              r,
              l,
              s,
              i
            ]
          }
        }
      ]
    };
  }
  return Ze = n, Ze;
}
var Ve, qn;
function Wa() {
  if (qn) return Ve;
  qn = 1;
  var n = "[0-9](_*[0-9])*", e = `\\.(${n})`, t = "[0-9a-fA-F](_*[0-9a-fA-F])*", i = {
    className: "number",
    variants: [
      // DecimalFloatingPointLiteral
      // including ExponentPart
      { begin: `(\\b(${n})((${e})|\\.)?|(${e}))[eE][+-]?(${n})[fFdD]?\\b` },
      // excluding ExponentPart
      { begin: `\\b(${n})((${e})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
      { begin: `(${e})[fFdD]?\\b` },
      { begin: `\\b(${n})[fFdD]\\b` },
      // HexadecimalFloatingPointLiteral
      { begin: `\\b0[xX]((${t})\\.?|(${t})?\\.(${t}))[pP][+-]?(${n})[fFdD]?\\b` },
      // DecimalIntegerLiteral
      { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
      // HexIntegerLiteral
      { begin: `\\b0[xX](${t})[lL]?\\b` },
      // OctalIntegerLiteral
      { begin: "\\b0(_*[0-7])*[lL]?\\b" },
      // BinaryIntegerLiteral
      { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
    ],
    relevance: 0
  };
  function d(r, s, c) {
    return c === -1 ? "" : r.replace(s, (o) => d(r, s, c - 1));
  }
  function l(r) {
    const s = r.regex, c = "[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*", o = c + d("(?:<" + c + "~~~(?:\\s*,\\s*" + c + "~~~)*>)?", /~~~/g, 2), _ = {
      keyword: [
        "synchronized",
        "abstract",
        "private",
        "var",
        "static",
        "if",
        "const ",
        "for",
        "while",
        "strictfp",
        "finally",
        "protected",
        "import",
        "native",
        "final",
        "void",
        "enum",
        "else",
        "break",
        "transient",
        "catch",
        "instanceof",
        "volatile",
        "case",
        "assert",
        "package",
        "default",
        "public",
        "try",
        "switch",
        "continue",
        "throws",
        "protected",
        "public",
        "private",
        "module",
        "requires",
        "exports",
        "do",
        "sealed",
        "yield",
        "permits",
        "goto",
        "when"
      ],
      literal: [
        "false",
        "true",
        "null"
      ],
      type: [
        "char",
        "boolean",
        "long",
        "float",
        "int",
        "byte",
        "short",
        "double"
      ],
      built_in: [
        "super",
        "this"
      ]
    }, h = {
      className: "meta",
      begin: "@" + c,
      contains: [
        {
          begin: /\(/,
          end: /\)/,
          contains: ["self"]
          // allow nested () inside our annotation
        }
      ]
    }, m = {
      className: "params",
      begin: /\(/,
      end: /\)/,
      keywords: _,
      relevance: 0,
      contains: [r.C_BLOCK_COMMENT_MODE],
      endsParent: !0
    };
    return {
      name: "Java",
      aliases: ["jsp"],
      keywords: _,
      illegal: /<\/|#/,
      contains: [
        r.COMMENT(
          "/\\*\\*",
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                // eat up @'s in emails to prevent them to be recognized as doctags
                begin: /\w+@/,
                relevance: 0
              },
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              }
            ]
          }
        ),
        // relevance boost
        {
          begin: /import java\.[a-z]+\./,
          keywords: "import",
          relevance: 2
        },
        r.C_LINE_COMMENT_MODE,
        r.C_BLOCK_COMMENT_MODE,
        {
          begin: /"""/,
          end: /"""/,
          className: "string",
          contains: [r.BACKSLASH_ESCAPE]
        },
        r.APOS_STRING_MODE,
        r.QUOTE_STRING_MODE,
        {
          match: [
            /\b(?:class|interface|enum|extends|implements|new)/,
            /\s+/,
            c
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          // Exceptions for hyphenated keywords
          match: /non-sealed/,
          scope: "keyword"
        },
        {
          begin: [
            s.concat(/(?!else)/, c),
            /\s+/,
            c,
            /\s+/,
            /=(?!=)/
          ],
          className: {
            1: "type",
            3: "variable",
            5: "operator"
          }
        },
        {
          begin: [
            /record/,
            /\s+/,
            c
          ],
          className: {
            1: "keyword",
            3: "title.class"
          },
          contains: [
            m,
            r.C_LINE_COMMENT_MODE,
            r.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          // Expression keywords prevent 'keyword Name(...)' from being
          // recognized as a function definition
          beginKeywords: "new throw return else",
          relevance: 0
        },
        {
          begin: [
            "(?:" + o + "\\s+)",
            r.UNDERSCORE_IDENT_RE,
            /\s*(?=\()/
          ],
          className: { 2: "title.function" },
          keywords: _,
          contains: [
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              keywords: _,
              relevance: 0,
              contains: [
                h,
                r.APOS_STRING_MODE,
                r.QUOTE_STRING_MODE,
                i,
                r.C_BLOCK_COMMENT_MODE
              ]
            },
            r.C_LINE_COMMENT_MODE,
            r.C_BLOCK_COMMENT_MODE
          ]
        },
        i,
        h
      ]
    };
  }
  return Ve = l, Ve;
}
var Xe, Hn;
function Ya() {
  if (Hn) return Xe;
  Hn = 1;
  const n = "[A-Za-z$_][0-9A-Za-z$_]*", e = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ], t = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ], i = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ], d = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ], l = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ], r = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "global"
    // Node.js
  ], s = [].concat(
    l,
    i,
    d
  );
  function c(o) {
    const a = o.regex, u = (Y, { after: H }) => {
      const J = "</" + Y[0].slice(1);
      return Y.input.indexOf(J, H) !== -1;
    }, b = n, p = {
      begin: "<>",
      end: "</>"
    }, _ = /<[A-Za-z0-9\\._:-]+\s*\/>/, h = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (Y, H) => {
        const J = Y[0].length + Y.index, ee = Y.input[J];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          ee === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          ee === ","
        ) {
          H.ignoreMatch();
          return;
        }
        ee === ">" && (u(Y, { after: J }) || H.ignoreMatch());
        let ne;
        const ae = Y.input.substring(J);
        if (ne = ae.match(/^\s*=/)) {
          H.ignoreMatch();
          return;
        }
        if ((ne = ae.match(/^\s+extends\s+/)) && ne.index === 0) {
          H.ignoreMatch();
          return;
        }
      }
    }, m = {
      $pattern: n,
      keyword: e,
      literal: t,
      built_in: s,
      "variable.language": r
    }, v = "[0-9](_?[0-9])*", T = `\\.(${v})`, w = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", B = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${w})((${T})|\\.)?|(${T}))[eE][+-]?(${v})\\b` },
        { begin: `\\b(${w})\\b((${T})\\b|\\.)?|(${T})\\b` },
        // DecimalBigIntegerLiteral
        { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    }, R = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: m,
      contains: []
      // defined later
    }, C = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: !1,
        contains: [
          o.BACKSLASH_ESCAPE,
          R
        ],
        subLanguage: "xml"
      }
    }, L = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: !1,
        contains: [
          o.BACKSLASH_ESCAPE,
          R
        ],
        subLanguage: "css"
      }
    }, S = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: !1,
        contains: [
          o.BACKSLASH_ESCAPE,
          R
        ],
        subLanguage: "graphql"
      }
    }, I = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        o.BACKSLASH_ESCAPE,
        R
      ]
    }, N = {
      className: "comment",
      variants: [
        o.COMMENT(
          /\/\*\*(?!\/)/,
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                begin: "(?=@[A-Za-z]+)",
                relevance: 0,
                contains: [
                  {
                    className: "doctag",
                    begin: "@[A-Za-z]+"
                  },
                  {
                    className: "type",
                    begin: "\\{",
                    end: "\\}",
                    excludeEnd: !0,
                    excludeBegin: !0,
                    relevance: 0
                  },
                  {
                    className: "variable",
                    begin: b + "(?=\\s*(-)|$)",
                    endsParent: !0,
                    relevance: 0
                  },
                  // eat spaces (not newlines) so we can find
                  // types or variables
                  {
                    begin: /(?=[^\n])\s/,
                    relevance: 0
                  }
                ]
              }
            ]
          }
        ),
        o.C_BLOCK_COMMENT_MODE,
        o.C_LINE_COMMENT_MODE
      ]
    }, k = [
      o.APOS_STRING_MODE,
      o.QUOTE_STRING_MODE,
      C,
      L,
      S,
      I,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      B
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    R.contains = k.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: m,
      contains: [
        "self"
      ].concat(k)
    });
    const D = [].concat(N, R.contains), F = D.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: m,
        contains: ["self"].concat(D)
      }
    ]), z = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: !0,
      excludeEnd: !0,
      keywords: m,
      contains: F
    }, g = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            b,
            /\s+/,
            /extends/,
            /\s+/,
            a.concat(b, "(", a.concat(/\./, b), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            b
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    }, E = {
      relevance: 0,
      match: a.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...i,
          ...d
        ]
      }
    }, O = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    }, U = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            b,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [z],
      illegal: /%/
    }, q = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function X(Y) {
      return a.concat("(?!", Y.join("|"), ")");
    }
    const j = {
      match: a.concat(
        /\b/,
        X([
          ...l,
          "super",
          "import"
        ].map((Y) => `${Y}\\s*\\(`)),
        b,
        a.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    }, de = {
      begin: a.concat(/\./, a.lookahead(
        a.concat(b, /(?![0-9A-Za-z$_(])/)
      )),
      end: b,
      excludeBegin: !0,
      keywords: "prototype",
      className: "property",
      relevance: 0
    }, W = {
      match: [
        /get|set/,
        /\s+/,
        b,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        z
      ]
    }, Z = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + o.UNDERSCORE_IDENT_RE + ")\\s*=>", ue = {
      match: [
        /const|var|let/,
        /\s+/,
        b,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        a.lookahead(Z)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        z
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: m,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS: F, CLASS_REFERENCE: E },
      illegal: /#(?![$_A-z])/,
      contains: [
        o.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        O,
        o.APOS_STRING_MODE,
        o.QUOTE_STRING_MODE,
        C,
        L,
        S,
        I,
        N,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        B,
        E,
        {
          scope: "attr",
          match: b + a.lookahead(":"),
          relevance: 0
        },
        ue,
        {
          // "value" container
          begin: "(" + o.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            N,
            o.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: Z,
              returnBegin: !0,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: o.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: !0
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: !0,
                      excludeEnd: !0,
                      keywords: m,
                      contains: F
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: p.begin, end: p.end },
                { match: _ },
                {
                  begin: h.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": h.isTrulyOpeningTag,
                  end: h.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: h.begin,
                  end: h.end,
                  skip: !0,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        U,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + o.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: !0,
          label: "func.def",
          contains: [
            z,
            o.inherit(o.TITLE_MODE, { begin: b, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        de,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + b,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [z]
        },
        j,
        q,
        g,
        W,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }
  return Xe = c, Xe;
}
var Qe, Wn;
function Za() {
  if (Wn) return Qe;
  Wn = 1;
  function n(e) {
    const t = {
      className: "attr",
      begin: /"(\\.|[^\\"\r\n])*"(?=\s*:)/,
      relevance: 1.01
    }, i = {
      match: /[{}[\],:]/,
      className: "punctuation",
      relevance: 0
    }, d = [
      "true",
      "false",
      "null"
    ], l = {
      scope: "literal",
      beginKeywords: d.join(" ")
    };
    return {
      name: "JSON",
      aliases: ["jsonc"],
      keywords: {
        literal: d
      },
      contains: [
        t,
        i,
        e.QUOTE_STRING_MODE,
        l,
        e.C_NUMBER_MODE,
        e.C_LINE_COMMENT_MODE,
        e.C_BLOCK_COMMENT_MODE
      ],
      illegal: "\\S"
    };
  }
  return Qe = n, Qe;
}
var Je, Yn;
function Va() {
  if (Yn) return Je;
  Yn = 1;
  var n = "[0-9](_*[0-9])*", e = `\\.(${n})`, t = "[0-9a-fA-F](_*[0-9a-fA-F])*", i = {
    className: "number",
    variants: [
      // DecimalFloatingPointLiteral
      // including ExponentPart
      { begin: `(\\b(${n})((${e})|\\.)?|(${e}))[eE][+-]?(${n})[fFdD]?\\b` },
      // excluding ExponentPart
      { begin: `\\b(${n})((${e})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
      { begin: `(${e})[fFdD]?\\b` },
      { begin: `\\b(${n})[fFdD]\\b` },
      // HexadecimalFloatingPointLiteral
      { begin: `\\b0[xX]((${t})\\.?|(${t})?\\.(${t}))[pP][+-]?(${n})[fFdD]?\\b` },
      // DecimalIntegerLiteral
      { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
      // HexIntegerLiteral
      { begin: `\\b0[xX](${t})[lL]?\\b` },
      // OctalIntegerLiteral
      { begin: "\\b0(_*[0-7])*[lL]?\\b" },
      // BinaryIntegerLiteral
      { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
    ],
    relevance: 0
  };
  function d(l) {
    const r = {
      keyword: "abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
      built_in: "Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
      literal: "true false null"
    }, s = {
      className: "keyword",
      begin: /\b(break|continue|return|this)\b/,
      starts: { contains: [
        {
          className: "symbol",
          begin: /@\w+/
        }
      ] }
    }, c = {
      className: "symbol",
      begin: l.UNDERSCORE_IDENT_RE + "@"
    }, o = {
      className: "subst",
      begin: /\$\{/,
      end: /\}/,
      contains: [l.C_NUMBER_MODE]
    }, a = {
      className: "variable",
      begin: "\\$" + l.UNDERSCORE_IDENT_RE
    }, u = {
      className: "string",
      variants: [
        {
          begin: '"""',
          end: '"""(?=[^"])',
          contains: [
            a,
            o
          ]
        },
        // Can't use built-in modes easily, as we want to use STRING in the meta
        // context as 'meta-string' and there's no syntax to remove explicitly set
        // classNames in built-in modes.
        {
          begin: "'",
          end: "'",
          illegal: /\n/,
          contains: [l.BACKSLASH_ESCAPE]
        },
        {
          begin: '"',
          end: '"',
          illegal: /\n/,
          contains: [
            l.BACKSLASH_ESCAPE,
            a,
            o
          ]
        }
      ]
    };
    o.contains.push(u);
    const b = {
      className: "meta",
      begin: "@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*" + l.UNDERSCORE_IDENT_RE + ")?"
    }, p = {
      className: "meta",
      begin: "@" + l.UNDERSCORE_IDENT_RE,
      contains: [
        {
          begin: /\(/,
          end: /\)/,
          contains: [
            l.inherit(u, { className: "string" }),
            "self"
          ]
        }
      ]
    }, _ = i, h = l.COMMENT(
      "/\\*",
      "\\*/",
      { contains: [l.C_BLOCK_COMMENT_MODE] }
    ), m = { variants: [
      {
        className: "type",
        begin: l.UNDERSCORE_IDENT_RE
      },
      {
        begin: /\(/,
        end: /\)/,
        contains: []
        // defined later
      }
    ] }, v = m;
    return v.variants[1].contains = [m], m.variants[1].contains = [v], {
      name: "Kotlin",
      aliases: [
        "kt",
        "kts"
      ],
      keywords: r,
      contains: [
        l.COMMENT(
          "/\\*\\*",
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              }
            ]
          }
        ),
        l.C_LINE_COMMENT_MODE,
        h,
        s,
        c,
        b,
        p,
        {
          className: "function",
          beginKeywords: "fun",
          end: "[(]|$",
          returnBegin: !0,
          excludeEnd: !0,
          keywords: r,
          relevance: 5,
          contains: [
            {
              begin: l.UNDERSCORE_IDENT_RE + "\\s*\\(",
              returnBegin: !0,
              relevance: 0,
              contains: [l.UNDERSCORE_TITLE_MODE]
            },
            {
              className: "type",
              begin: /</,
              end: />/,
              keywords: "reified",
              relevance: 0
            },
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              endsParent: !0,
              keywords: r,
              relevance: 0,
              contains: [
                {
                  begin: /:/,
                  end: /[=,\/]/,
                  endsWithParent: !0,
                  contains: [
                    m,
                    l.C_LINE_COMMENT_MODE,
                    h
                  ],
                  relevance: 0
                },
                l.C_LINE_COMMENT_MODE,
                h,
                b,
                p,
                u,
                l.C_NUMBER_MODE
              ]
            },
            h
          ]
        },
        {
          begin: [
            /class|interface|trait/,
            /\s+/,
            l.UNDERSCORE_IDENT_RE
          ],
          beginScope: {
            3: "title.class"
          },
          keywords: "class interface trait",
          end: /[:\{(]|$/,
          excludeEnd: !0,
          illegal: "extends implements",
          contains: [
            { beginKeywords: "public protected internal private constructor" },
            l.UNDERSCORE_TITLE_MODE,
            {
              className: "type",
              begin: /</,
              end: />/,
              excludeBegin: !0,
              excludeEnd: !0,
              relevance: 0
            },
            {
              className: "type",
              begin: /[,:]\s*/,
              end: /[<\(,){\s]|$/,
              excludeBegin: !0,
              returnEnd: !0
            },
            b,
            p
          ]
        },
        u,
        {
          className: "meta",
          begin: "^#!/usr/bin/env",
          end: "$",
          illegal: `
`
        },
        _
      ]
    };
  }
  return Je = d, Je;
}
var je, Zn;
function Xa() {
  if (Zn) return je;
  Zn = 1;
  const n = (a) => ({
    IMPORTANT: {
      scope: "meta",
      begin: "!important"
    },
    BLOCK_COMMENT: a.C_BLOCK_COMMENT_MODE,
    HEXCOLOR: {
      scope: "number",
      begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
    },
    FUNCTION_DISPATCH: {
      className: "built_in",
      begin: /[\w-]+(?=\()/
    },
    ATTRIBUTE_SELECTOR_MODE: {
      scope: "selector-attr",
      begin: /\[/,
      end: /\]/,
      illegal: "$",
      contains: [
        a.APOS_STRING_MODE,
        a.QUOTE_STRING_MODE
      ]
    },
    CSS_NUMBER_MODE: {
      scope: "number",
      begin: a.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
      relevance: 0
    },
    CSS_VARIABLE: {
      className: "attr",
      begin: /--[A-Za-z_][A-Za-z0-9_-]*/
    }
  }), e = [
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "audio",
    "b",
    "blockquote",
    "body",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "dd",
    "del",
    "details",
    "dfn",
    "div",
    "dl",
    "dt",
    "em",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "main",
    "mark",
    "menu",
    "nav",
    "object",
    "ol",
    "optgroup",
    "option",
    "p",
    "picture",
    "q",
    "quote",
    "samp",
    "section",
    "select",
    "source",
    "span",
    "strong",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "tr",
    "ul",
    "var",
    "video"
  ], t = [
    "defs",
    "g",
    "marker",
    "mask",
    "pattern",
    "svg",
    "switch",
    "symbol",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feFlood",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMorphology",
    "feOffset",
    "feSpecularLighting",
    "feTile",
    "feTurbulence",
    "linearGradient",
    "radialGradient",
    "stop",
    "circle",
    "ellipse",
    "image",
    "line",
    "path",
    "polygon",
    "polyline",
    "rect",
    "text",
    "use",
    "textPath",
    "tspan",
    "foreignObject",
    "clipPath"
  ], i = [
    ...e,
    ...t
  ], d = [
    "any-hover",
    "any-pointer",
    "aspect-ratio",
    "color",
    "color-gamut",
    "color-index",
    "device-aspect-ratio",
    "device-height",
    "device-width",
    "display-mode",
    "forced-colors",
    "grid",
    "height",
    "hover",
    "inverted-colors",
    "monochrome",
    "orientation",
    "overflow-block",
    "overflow-inline",
    "pointer",
    "prefers-color-scheme",
    "prefers-contrast",
    "prefers-reduced-motion",
    "prefers-reduced-transparency",
    "resolution",
    "scan",
    "scripting",
    "update",
    "width",
    // TODO: find a better solution?
    "min-width",
    "max-width",
    "min-height",
    "max-height"
  ].sort().reverse(), l = [
    "active",
    "any-link",
    "blank",
    "checked",
    "current",
    "default",
    "defined",
    "dir",
    // dir()
    "disabled",
    "drop",
    "empty",
    "enabled",
    "first",
    "first-child",
    "first-of-type",
    "fullscreen",
    "future",
    "focus",
    "focus-visible",
    "focus-within",
    "has",
    // has()
    "host",
    // host or host()
    "host-context",
    // host-context()
    "hover",
    "indeterminate",
    "in-range",
    "invalid",
    "is",
    // is()
    "lang",
    // lang()
    "last-child",
    "last-of-type",
    "left",
    "link",
    "local-link",
    "not",
    // not()
    "nth-child",
    // nth-child()
    "nth-col",
    // nth-col()
    "nth-last-child",
    // nth-last-child()
    "nth-last-col",
    // nth-last-col()
    "nth-last-of-type",
    //nth-last-of-type()
    "nth-of-type",
    //nth-of-type()
    "only-child",
    "only-of-type",
    "optional",
    "out-of-range",
    "past",
    "placeholder-shown",
    "read-only",
    "read-write",
    "required",
    "right",
    "root",
    "scope",
    "target",
    "target-within",
    "user-invalid",
    "valid",
    "visited",
    "where"
    // where()
  ].sort().reverse(), r = [
    "after",
    "backdrop",
    "before",
    "cue",
    "cue-region",
    "first-letter",
    "first-line",
    "grammar-error",
    "marker",
    "part",
    "placeholder",
    "selection",
    "slotted",
    "spelling-error"
  ].sort().reverse(), s = [
    "accent-color",
    "align-content",
    "align-items",
    "align-self",
    "alignment-baseline",
    "all",
    "anchor-name",
    "animation",
    "animation-composition",
    "animation-delay",
    "animation-direction",
    "animation-duration",
    "animation-fill-mode",
    "animation-iteration-count",
    "animation-name",
    "animation-play-state",
    "animation-range",
    "animation-range-end",
    "animation-range-start",
    "animation-timeline",
    "animation-timing-function",
    "appearance",
    "aspect-ratio",
    "backdrop-filter",
    "backface-visibility",
    "background",
    "background-attachment",
    "background-blend-mode",
    "background-clip",
    "background-color",
    "background-image",
    "background-origin",
    "background-position",
    "background-position-x",
    "background-position-y",
    "background-repeat",
    "background-size",
    "baseline-shift",
    "block-size",
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-end-color",
    "border-block-end-style",
    "border-block-end-width",
    "border-block-start",
    "border-block-start-color",
    "border-block-start-style",
    "border-block-start-width",
    "border-block-style",
    "border-block-width",
    "border-bottom",
    "border-bottom-color",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-bottom-style",
    "border-bottom-width",
    "border-collapse",
    "border-color",
    "border-end-end-radius",
    "border-end-start-radius",
    "border-image",
    "border-image-outset",
    "border-image-repeat",
    "border-image-slice",
    "border-image-source",
    "border-image-width",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-end-color",
    "border-inline-end-style",
    "border-inline-end-width",
    "border-inline-start",
    "border-inline-start-color",
    "border-inline-start-style",
    "border-inline-start-width",
    "border-inline-style",
    "border-inline-width",
    "border-left",
    "border-left-color",
    "border-left-style",
    "border-left-width",
    "border-radius",
    "border-right",
    "border-right-color",
    "border-right-style",
    "border-right-width",
    "border-spacing",
    "border-start-end-radius",
    "border-start-start-radius",
    "border-style",
    "border-top",
    "border-top-color",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-top-style",
    "border-top-width",
    "border-width",
    "bottom",
    "box-align",
    "box-decoration-break",
    "box-direction",
    "box-flex",
    "box-flex-group",
    "box-lines",
    "box-ordinal-group",
    "box-orient",
    "box-pack",
    "box-shadow",
    "box-sizing",
    "break-after",
    "break-before",
    "break-inside",
    "caption-side",
    "caret-color",
    "clear",
    "clip",
    "clip-path",
    "clip-rule",
    "color",
    "color-interpolation",
    "color-interpolation-filters",
    "color-profile",
    "color-rendering",
    "color-scheme",
    "column-count",
    "column-fill",
    "column-gap",
    "column-rule",
    "column-rule-color",
    "column-rule-style",
    "column-rule-width",
    "column-span",
    "column-width",
    "columns",
    "contain",
    "contain-intrinsic-block-size",
    "contain-intrinsic-height",
    "contain-intrinsic-inline-size",
    "contain-intrinsic-size",
    "contain-intrinsic-width",
    "container",
    "container-name",
    "container-type",
    "content",
    "content-visibility",
    "counter-increment",
    "counter-reset",
    "counter-set",
    "cue",
    "cue-after",
    "cue-before",
    "cursor",
    "cx",
    "cy",
    "direction",
    "display",
    "dominant-baseline",
    "empty-cells",
    "enable-background",
    "field-sizing",
    "fill",
    "fill-opacity",
    "fill-rule",
    "filter",
    "flex",
    "flex-basis",
    "flex-direction",
    "flex-flow",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "float",
    "flood-color",
    "flood-opacity",
    "flow",
    "font",
    "font-display",
    "font-family",
    "font-feature-settings",
    "font-kerning",
    "font-language-override",
    "font-optical-sizing",
    "font-palette",
    "font-size",
    "font-size-adjust",
    "font-smooth",
    "font-smoothing",
    "font-stretch",
    "font-style",
    "font-synthesis",
    "font-synthesis-position",
    "font-synthesis-small-caps",
    "font-synthesis-style",
    "font-synthesis-weight",
    "font-variant",
    "font-variant-alternates",
    "font-variant-caps",
    "font-variant-east-asian",
    "font-variant-emoji",
    "font-variant-ligatures",
    "font-variant-numeric",
    "font-variant-position",
    "font-variation-settings",
    "font-weight",
    "forced-color-adjust",
    "gap",
    "glyph-orientation-horizontal",
    "glyph-orientation-vertical",
    "grid",
    "grid-area",
    "grid-auto-columns",
    "grid-auto-flow",
    "grid-auto-rows",
    "grid-column",
    "grid-column-end",
    "grid-column-start",
    "grid-gap",
    "grid-row",
    "grid-row-end",
    "grid-row-start",
    "grid-template",
    "grid-template-areas",
    "grid-template-columns",
    "grid-template-rows",
    "hanging-punctuation",
    "height",
    "hyphenate-character",
    "hyphenate-limit-chars",
    "hyphens",
    "icon",
    "image-orientation",
    "image-rendering",
    "image-resolution",
    "ime-mode",
    "initial-letter",
    "initial-letter-align",
    "inline-size",
    "inset",
    "inset-area",
    "inset-block",
    "inset-block-end",
    "inset-block-start",
    "inset-inline",
    "inset-inline-end",
    "inset-inline-start",
    "isolation",
    "justify-content",
    "justify-items",
    "justify-self",
    "kerning",
    "left",
    "letter-spacing",
    "lighting-color",
    "line-break",
    "line-height",
    "line-height-step",
    "list-style",
    "list-style-image",
    "list-style-position",
    "list-style-type",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "margin-trim",
    "marker",
    "marker-end",
    "marker-mid",
    "marker-start",
    "marks",
    "mask",
    "mask-border",
    "mask-border-mode",
    "mask-border-outset",
    "mask-border-repeat",
    "mask-border-slice",
    "mask-border-source",
    "mask-border-width",
    "mask-clip",
    "mask-composite",
    "mask-image",
    "mask-mode",
    "mask-origin",
    "mask-position",
    "mask-repeat",
    "mask-size",
    "mask-type",
    "masonry-auto-flow",
    "math-depth",
    "math-shift",
    "math-style",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "mix-blend-mode",
    "nav-down",
    "nav-index",
    "nav-left",
    "nav-right",
    "nav-up",
    "none",
    "normal",
    "object-fit",
    "object-position",
    "offset",
    "offset-anchor",
    "offset-distance",
    "offset-path",
    "offset-position",
    "offset-rotate",
    "opacity",
    "order",
    "orphans",
    "outline",
    "outline-color",
    "outline-offset",
    "outline-style",
    "outline-width",
    "overflow",
    "overflow-anchor",
    "overflow-block",
    "overflow-clip-margin",
    "overflow-inline",
    "overflow-wrap",
    "overflow-x",
    "overflow-y",
    "overlay",
    "overscroll-behavior",
    "overscroll-behavior-block",
    "overscroll-behavior-inline",
    "overscroll-behavior-x",
    "overscroll-behavior-y",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "page",
    "page-break-after",
    "page-break-before",
    "page-break-inside",
    "paint-order",
    "pause",
    "pause-after",
    "pause-before",
    "perspective",
    "perspective-origin",
    "place-content",
    "place-items",
    "place-self",
    "pointer-events",
    "position",
    "position-anchor",
    "position-visibility",
    "print-color-adjust",
    "quotes",
    "r",
    "resize",
    "rest",
    "rest-after",
    "rest-before",
    "right",
    "rotate",
    "row-gap",
    "ruby-align",
    "ruby-position",
    "scale",
    "scroll-behavior",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-block-end",
    "scroll-margin-block-start",
    "scroll-margin-bottom",
    "scroll-margin-inline",
    "scroll-margin-inline-end",
    "scroll-margin-inline-start",
    "scroll-margin-left",
    "scroll-margin-right",
    "scroll-margin-top",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-block-end",
    "scroll-padding-block-start",
    "scroll-padding-bottom",
    "scroll-padding-inline",
    "scroll-padding-inline-end",
    "scroll-padding-inline-start",
    "scroll-padding-left",
    "scroll-padding-right",
    "scroll-padding-top",
    "scroll-snap-align",
    "scroll-snap-stop",
    "scroll-snap-type",
    "scroll-timeline",
    "scroll-timeline-axis",
    "scroll-timeline-name",
    "scrollbar-color",
    "scrollbar-gutter",
    "scrollbar-width",
    "shape-image-threshold",
    "shape-margin",
    "shape-outside",
    "shape-rendering",
    "speak",
    "speak-as",
    "src",
    // @font-face
    "stop-color",
    "stop-opacity",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "tab-size",
    "table-layout",
    "text-align",
    "text-align-all",
    "text-align-last",
    "text-anchor",
    "text-combine-upright",
    "text-decoration",
    "text-decoration-color",
    "text-decoration-line",
    "text-decoration-skip",
    "text-decoration-skip-ink",
    "text-decoration-style",
    "text-decoration-thickness",
    "text-emphasis",
    "text-emphasis-color",
    "text-emphasis-position",
    "text-emphasis-style",
    "text-indent",
    "text-justify",
    "text-orientation",
    "text-overflow",
    "text-rendering",
    "text-shadow",
    "text-size-adjust",
    "text-transform",
    "text-underline-offset",
    "text-underline-position",
    "text-wrap",
    "text-wrap-mode",
    "text-wrap-style",
    "timeline-scope",
    "top",
    "touch-action",
    "transform",
    "transform-box",
    "transform-origin",
    "transform-style",
    "transition",
    "transition-behavior",
    "transition-delay",
    "transition-duration",
    "transition-property",
    "transition-timing-function",
    "translate",
    "unicode-bidi",
    "user-modify",
    "user-select",
    "vector-effect",
    "vertical-align",
    "view-timeline",
    "view-timeline-axis",
    "view-timeline-inset",
    "view-timeline-name",
    "view-transition-name",
    "visibility",
    "voice-balance",
    "voice-duration",
    "voice-family",
    "voice-pitch",
    "voice-range",
    "voice-rate",
    "voice-stress",
    "voice-volume",
    "white-space",
    "white-space-collapse",
    "widows",
    "width",
    "will-change",
    "word-break",
    "word-spacing",
    "word-wrap",
    "writing-mode",
    "x",
    "y",
    "z-index",
    "zoom"
  ].sort().reverse(), c = l.concat(r).sort().reverse();
  function o(a) {
    const u = n(a), b = c, p = "and or not only", _ = "[\\w-]+", h = "(" + _ + "|@\\{" + _ + "\\})", m = [], v = [], T = function(D) {
      return {
        // Less strings are not multiline (also include '~' for more consistent coloring of "escaped" strings)
        className: "string",
        begin: "~?" + D + ".*?" + D
      };
    }, w = function(D, F, z) {
      return {
        className: D,
        begin: F,
        relevance: z
      };
    }, B = {
      $pattern: /[a-z-]+/,
      keyword: p,
      attribute: d.join(" ")
    }, R = {
      // used only to properly balance nested parens inside mixin call, def. arg list
      begin: "\\(",
      end: "\\)",
      contains: v,
      keywords: B,
      relevance: 0
    };
    v.push(
      a.C_LINE_COMMENT_MODE,
      a.C_BLOCK_COMMENT_MODE,
      T("'"),
      T('"'),
      u.CSS_NUMBER_MODE,
      // fixme: it does not include dot for numbers like .5em :(
      {
        begin: "(url|data-uri)\\(",
        starts: {
          className: "string",
          end: "[\\)\\n]",
          excludeEnd: !0
        }
      },
      u.HEXCOLOR,
      R,
      w("variable", "@@?" + _, 10),
      w("variable", "@\\{" + _ + "\\}"),
      w("built_in", "~?`[^`]*?`"),
      // inline javascript (or whatever host language) *multiline* string
      {
        // @media features (it’s here to not duplicate things in AT_RULE_MODE with extra PARENS_MODE overriding):
        className: "attribute",
        begin: _ + "\\s*:",
        end: ":",
        returnBegin: !0,
        excludeEnd: !0
      },
      u.IMPORTANT,
      { beginKeywords: "and not" },
      u.FUNCTION_DISPATCH
    );
    const C = v.concat({
      begin: /\{/,
      end: /\}/,
      contains: m
    }), L = {
      beginKeywords: "when",
      endsWithParent: !0,
      contains: [{ beginKeywords: "and not" }].concat(v)
      // using this form to override VALUE’s 'function' match
    }, S = {
      begin: h + "\\s*:",
      returnBegin: !0,
      end: /[;}]/,
      relevance: 0,
      contains: [
        { begin: /-(webkit|moz|ms|o)-/ },
        u.CSS_VARIABLE,
        {
          className: "attribute",
          begin: "\\b(" + s.join("|") + ")\\b",
          end: /(?=:)/,
          starts: {
            endsWithParent: !0,
            illegal: "[<=$]",
            relevance: 0,
            contains: v
          }
        }
      ]
    }, I = {
      className: "keyword",
      begin: "@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b",
      starts: {
        end: "[;{}]",
        keywords: B,
        returnEnd: !0,
        contains: v,
        relevance: 0
      }
    }, K = {
      className: "variable",
      variants: [
        // using more strict pattern for higher relevance to increase chances of Less detection.
        // this is *the only* Less specific statement used in most of the sources, so...
        // (we’ll still often loose to the css-parser unless there's '//' comment,
        // simply because 1 variable just can't beat 99 properties :)
        {
          begin: "@" + _ + "\\s*:",
          relevance: 15
        },
        { begin: "@" + _ }
      ],
      starts: {
        end: "[;}]",
        returnEnd: !0,
        contains: C
      }
    }, N = {
      // first parse unambiguous selectors (i.e. those not starting with tag)
      // then fall into the scary lookahead-discriminator variant.
      // this mode also handles mixin definitions and calls
      variants: [
        {
          begin: "[\\.#:&\\[>]",
          end: "[;{}]"
          // mixin calls end with ';'
        },
        {
          begin: h,
          end: /\{/
        }
      ],
      returnBegin: !0,
      returnEnd: !0,
      illegal: `[<='$"]`,
      relevance: 0,
      contains: [
        a.C_LINE_COMMENT_MODE,
        a.C_BLOCK_COMMENT_MODE,
        L,
        w("keyword", "all\\b"),
        w("variable", "@\\{" + _ + "\\}"),
        // otherwise it’s identified as tag
        {
          begin: "\\b(" + i.join("|") + ")\\b",
          className: "selector-tag"
        },
        u.CSS_NUMBER_MODE,
        w("selector-tag", h, 0),
        w("selector-id", "#" + h),
        w("selector-class", "\\." + h, 0),
        w("selector-tag", "&", 0),
        u.ATTRIBUTE_SELECTOR_MODE,
        {
          className: "selector-pseudo",
          begin: ":(" + l.join("|") + ")"
        },
        {
          className: "selector-pseudo",
          begin: ":(:)?(" + r.join("|") + ")"
        },
        {
          begin: /\(/,
          end: /\)/,
          relevance: 0,
          contains: C
        },
        // argument list of parametric mixins
        { begin: "!important" },
        // eat !important after mixin call or it will be colored as tag
        u.FUNCTION_DISPATCH
      ]
    }, k = {
      begin: _ + `:(:)?(${b.join("|")})`,
      returnBegin: !0,
      contains: [N]
    };
    return m.push(
      a.C_LINE_COMMENT_MODE,
      a.C_BLOCK_COMMENT_MODE,
      I,
      K,
      k,
      S,
      N,
      L,
      u.FUNCTION_DISPATCH
    ), {
      name: "Less",
      case_insensitive: !0,
      illegal: `[=>'/<($"]`,
      contains: m
    };
  }
  return je = o, je;
}
var en, Vn;
function Qa() {
  if (Vn) return en;
  Vn = 1;
  function n(e) {
    const t = "\\[=*\\[", i = "\\]=*\\]", d = {
      begin: t,
      end: i,
      contains: ["self"]
    }, l = [
      e.COMMENT("--(?!" + t + ")", "$"),
      e.COMMENT(
        "--" + t,
        i,
        {
          contains: [d],
          relevance: 10
        }
      )
    ];
    return {
      name: "Lua",
      aliases: ["pluto"],
      keywords: {
        $pattern: e.UNDERSCORE_IDENT_RE,
        literal: "true false nil",
        keyword: "and break do else elseif end for goto if in local not or repeat return then until while",
        built_in: (
          // Metatags and globals:
          "_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"
        )
      },
      contains: l.concat([
        {
          className: "function",
          beginKeywords: "function",
          end: "\\)",
          contains: [
            e.inherit(e.TITLE_MODE, { begin: "([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*" }),
            {
              className: "params",
              begin: "\\(",
              endsWithParent: !0,
              contains: l
            }
          ].concat(l)
        },
        e.C_NUMBER_MODE,
        e.APOS_STRING_MODE,
        e.QUOTE_STRING_MODE,
        {
          className: "string",
          begin: t,
          end: i,
          contains: [d],
          relevance: 5
        }
      ])
    };
  }
  return en = n, en;
}
var nn, Xn;
function Ja() {
  if (Xn) return nn;
  Xn = 1;
  function n(e) {
    const t = {
      className: "variable",
      variants: [
        {
          begin: "\\$\\(" + e.UNDERSCORE_IDENT_RE + "\\)",
          contains: [e.BACKSLASH_ESCAPE]
        },
        { begin: /\$[@%<?\^\+\*]/ }
      ]
    }, i = {
      className: "string",
      begin: /"/,
      end: /"/,
      contains: [
        e.BACKSLASH_ESCAPE,
        t
      ]
    }, d = {
      className: "variable",
      begin: /\$\([\w-]+\s/,
      end: /\)/,
      keywords: { built_in: "subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value" },
      contains: [
        t,
        i
        // Added QUOTE_STRING as they can be a part of functions
      ]
    }, l = { begin: "^" + e.UNDERSCORE_IDENT_RE + "\\s*(?=[:+?]?=)" }, r = {
      className: "meta",
      begin: /^\.PHONY:/,
      end: /$/,
      keywords: {
        $pattern: /[\.\w]+/,
        keyword: ".PHONY"
      }
    }, s = {
      className: "section",
      begin: /^[^\s]+:/,
      end: /$/,
      contains: [t]
    };
    return {
      name: "Makefile",
      aliases: [
        "mk",
        "mak",
        "make"
      ],
      keywords: {
        $pattern: /[\w-]+/,
        keyword: "define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"
      },
      contains: [
        e.HASH_COMMENT_MODE,
        t,
        i,
        d,
        l,
        r,
        s
      ]
    };
  }
  return nn = n, nn;
}
var tn, Qn;
function ja() {
  if (Qn) return tn;
  Qn = 1;
  function n(e) {
    const t = e.regex, i = [
      "abs",
      "accept",
      "alarm",
      "and",
      "atan2",
      "bind",
      "binmode",
      "bless",
      "break",
      "caller",
      "chdir",
      "chmod",
      "chomp",
      "chop",
      "chown",
      "chr",
      "chroot",
      "class",
      "close",
      "closedir",
      "connect",
      "continue",
      "cos",
      "crypt",
      "dbmclose",
      "dbmopen",
      "defined",
      "delete",
      "die",
      "do",
      "dump",
      "each",
      "else",
      "elsif",
      "endgrent",
      "endhostent",
      "endnetent",
      "endprotoent",
      "endpwent",
      "endservent",
      "eof",
      "eval",
      "exec",
      "exists",
      "exit",
      "exp",
      "fcntl",
      "field",
      "fileno",
      "flock",
      "for",
      "foreach",
      "fork",
      "format",
      "formline",
      "getc",
      "getgrent",
      "getgrgid",
      "getgrnam",
      "gethostbyaddr",
      "gethostbyname",
      "gethostent",
      "getlogin",
      "getnetbyaddr",
      "getnetbyname",
      "getnetent",
      "getpeername",
      "getpgrp",
      "getpriority",
      "getprotobyname",
      "getprotobynumber",
      "getprotoent",
      "getpwent",
      "getpwnam",
      "getpwuid",
      "getservbyname",
      "getservbyport",
      "getservent",
      "getsockname",
      "getsockopt",
      "given",
      "glob",
      "gmtime",
      "goto",
      "grep",
      "gt",
      "hex",
      "if",
      "index",
      "int",
      "ioctl",
      "join",
      "keys",
      "kill",
      "last",
      "lc",
      "lcfirst",
      "length",
      "link",
      "listen",
      "local",
      "localtime",
      "log",
      "lstat",
      "lt",
      "ma",
      "map",
      "method",
      "mkdir",
      "msgctl",
      "msgget",
      "msgrcv",
      "msgsnd",
      "my",
      "ne",
      "next",
      "no",
      "not",
      "oct",
      "open",
      "opendir",
      "or",
      "ord",
      "our",
      "pack",
      "package",
      "pipe",
      "pop",
      "pos",
      "print",
      "printf",
      "prototype",
      "push",
      "q|0",
      "qq",
      "quotemeta",
      "qw",
      "qx",
      "rand",
      "read",
      "readdir",
      "readline",
      "readlink",
      "readpipe",
      "recv",
      "redo",
      "ref",
      "rename",
      "require",
      "reset",
      "return",
      "reverse",
      "rewinddir",
      "rindex",
      "rmdir",
      "say",
      "scalar",
      "seek",
      "seekdir",
      "select",
      "semctl",
      "semget",
      "semop",
      "send",
      "setgrent",
      "sethostent",
      "setnetent",
      "setpgrp",
      "setpriority",
      "setprotoent",
      "setpwent",
      "setservent",
      "setsockopt",
      "shift",
      "shmctl",
      "shmget",
      "shmread",
      "shmwrite",
      "shutdown",
      "sin",
      "sleep",
      "socket",
      "socketpair",
      "sort",
      "splice",
      "split",
      "sprintf",
      "sqrt",
      "srand",
      "stat",
      "state",
      "study",
      "sub",
      "substr",
      "symlink",
      "syscall",
      "sysopen",
      "sysread",
      "sysseek",
      "system",
      "syswrite",
      "tell",
      "telldir",
      "tie",
      "tied",
      "time",
      "times",
      "tr",
      "truncate",
      "uc",
      "ucfirst",
      "umask",
      "undef",
      "unless",
      "unlink",
      "unpack",
      "unshift",
      "untie",
      "until",
      "use",
      "utime",
      "values",
      "vec",
      "wait",
      "waitpid",
      "wantarray",
      "warn",
      "when",
      "while",
      "write",
      "x|0",
      "xor",
      "y|0"
    ], d = /[dualxmsipngr]{0,12}/, l = {
      $pattern: /[\w.]+/,
      keyword: i.join(" ")
    }, r = {
      className: "subst",
      begin: "[$@]\\{",
      end: "\\}",
      keywords: l
    }, s = {
      begin: /->\{/,
      end: /\}/
      // contains defined later
    }, c = {
      scope: "attr",
      match: /\s+:\s*\w+(\s*\(.*?\))?/
    }, o = {
      scope: "variable",
      variants: [
        { begin: /\$\d/ },
        {
          begin: t.concat(
            /[$%@](?!")(\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/,
            // negative look-ahead tries to avoid matching patterns that are not
            // Perl at all like $ident$, @ident@, etc.
            "(?![A-Za-z])(?![@$%])"
          )
        },
        {
          // Only $= is a special Perl variable and one can't declare @= or %=.
          begin: /[$%@](?!")[^\s\w{=]|\$=/,
          relevance: 0
        }
      ],
      contains: [c]
    }, a = {
      className: "number",
      variants: [
        // decimal numbers:
        // include the case where a number starts with a dot (eg. .9), and
        // the leading 0? avoids mixing the first and second match on 0.x cases
        { match: /0?\.[0-9][0-9_]+\b/ },
        // include the special versioned number (eg. v5.38)
        { match: /\bv?(0|[1-9][0-9_]*(\.[0-9_]+)?|[1-9][0-9_]*)\b/ },
        // non-decimal numbers:
        { match: /\b0[0-7][0-7_]*\b/ },
        { match: /\b0x[0-9a-fA-F][0-9a-fA-F_]*\b/ },
        { match: /\b0b[0-1][0-1_]*\b/ }
      ],
      relevance: 0
    }, u = [
      e.BACKSLASH_ESCAPE,
      r,
      o
    ], b = [
      /!/,
      /\//,
      /\|/,
      /\?/,
      /'/,
      /"/,
      // valid but infrequent and weird
      /#/
      // valid but infrequent and weird
    ], p = (m, v, T = "\\1") => {
      const w = T === "\\1" ? T : t.concat(T, v);
      return t.concat(
        t.concat("(?:", m, ")"),
        v,
        /(?:\\.|[^\\\/])*?/,
        w,
        /(?:\\.|[^\\\/])*?/,
        T,
        d
      );
    }, _ = (m, v, T) => t.concat(
      t.concat("(?:", m, ")"),
      v,
      /(?:\\.|[^\\\/])*?/,
      T,
      d
    ), h = [
      o,
      e.HASH_COMMENT_MODE,
      e.COMMENT(
        /^=\w/,
        /=cut/,
        { endsWithParent: !0 }
      ),
      s,
      {
        className: "string",
        contains: u,
        variants: [
          {
            begin: "q[qwxr]?\\s*\\(",
            end: "\\)",
            relevance: 5
          },
          {
            begin: "q[qwxr]?\\s*\\[",
            end: "\\]",
            relevance: 5
          },
          {
            begin: "q[qwxr]?\\s*\\{",
            end: "\\}",
            relevance: 5
          },
          {
            begin: "q[qwxr]?\\s*\\|",
            end: "\\|",
            relevance: 5
          },
          {
            begin: "q[qwxr]?\\s*<",
            end: ">",
            relevance: 5
          },
          {
            begin: "qw\\s+q",
            end: "q",
            relevance: 5
          },
          {
            begin: "'",
            end: "'",
            contains: [e.BACKSLASH_ESCAPE]
          },
          {
            begin: '"',
            end: '"'
          },
          {
            begin: "`",
            end: "`",
            contains: [e.BACKSLASH_ESCAPE]
          },
          {
            begin: /\{\w+\}/,
            relevance: 0
          },
          {
            begin: "-?\\w+\\s*=>",
            relevance: 0
          }
        ]
      },
      a,
      {
        // regexp container
        begin: "(\\/\\/|" + e.RE_STARTERS_RE + "|\\b(split|return|print|reverse|grep)\\b)\\s*",
        keywords: "split return print reverse grep",
        relevance: 0,
        contains: [
          e.HASH_COMMENT_MODE,
          {
            className: "regexp",
            variants: [
              // allow matching common delimiters
              { begin: p("s|tr|y", t.either(...b, { capture: !0 })) },
              // and then paired delmis
              { begin: p("s|tr|y", "\\(", "\\)") },
              { begin: p("s|tr|y", "\\[", "\\]") },
              { begin: p("s|tr|y", "\\{", "\\}") }
            ],
            relevance: 2
          },
          {
            className: "regexp",
            variants: [
              {
                // could be a comment in many languages so do not count
                // as relevant
                begin: /(m|qr)\/\//,
                relevance: 0
              },
              // prefix is optional with /regex/
              { begin: _("(?:m|qr)?", /\//, /\//) },
              // allow matching common delimiters
              { begin: _("m|qr", t.either(...b, { capture: !0 }), /\1/) },
              // allow common paired delmins
              { begin: _("m|qr", /\(/, /\)/) },
              { begin: _("m|qr", /\[/, /\]/) },
              { begin: _("m|qr", /\{/, /\}/) }
            ]
          }
        ]
      },
      {
        className: "function",
        beginKeywords: "sub method",
        end: "(\\s*\\(.*?\\))?[;{]",
        excludeEnd: !0,
        relevance: 5,
        contains: [e.TITLE_MODE, c]
      },
      {
        className: "class",
        beginKeywords: "class",
        end: "[;{]",
        excludeEnd: !0,
        relevance: 5,
        contains: [e.TITLE_MODE, c, a]
      },
      {
        begin: "-\\w\\b",
        relevance: 0
      },
      {
        begin: "^__DATA__$",
        end: "^__END__$",
        subLanguage: "mojolicious",
        contains: [
          {
            begin: "^@@.*",
            end: "$",
            className: "comment"
          }
        ]
      }
    ];
    return r.contains = h, s.contains = h, {
      name: "Perl",
      aliases: [
        "pl",
        "pm"
      ],
      keywords: l,
      contains: h
    };
  }
  return tn = n, tn;
}
var an, Jn;
function ei() {
  if (Jn) return an;
  Jn = 1;
  function n(e) {
    const t = {
      className: "built_in",
      begin: "\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+"
    }, i = /[a-zA-Z@][a-zA-Z0-9_]*/, c = {
      "variable.language": [
        "this",
        "super"
      ],
      $pattern: i,
      keyword: [
        "while",
        "export",
        "sizeof",
        "typedef",
        "const",
        "struct",
        "for",
        "union",
        "volatile",
        "static",
        "mutable",
        "if",
        "do",
        "return",
        "goto",
        "enum",
        "else",
        "break",
        "extern",
        "asm",
        "case",
        "default",
        "register",
        "explicit",
        "typename",
        "switch",
        "continue",
        "inline",
        "readonly",
        "assign",
        "readwrite",
        "self",
        "@synchronized",
        "id",
        "typeof",
        "nonatomic",
        "IBOutlet",
        "IBAction",
        "strong",
        "weak",
        "copy",
        "in",
        "out",
        "inout",
        "bycopy",
        "byref",
        "oneway",
        "__strong",
        "__weak",
        "__block",
        "__autoreleasing",
        "@private",
        "@protected",
        "@public",
        "@try",
        "@property",
        "@end",
        "@throw",
        "@catch",
        "@finally",
        "@autoreleasepool",
        "@synthesize",
        "@dynamic",
        "@selector",
        "@optional",
        "@required",
        "@encode",
        "@package",
        "@import",
        "@defs",
        "@compatibility_alias",
        "__bridge",
        "__bridge_transfer",
        "__bridge_retained",
        "__bridge_retain",
        "__covariant",
        "__contravariant",
        "__kindof",
        "_Nonnull",
        "_Nullable",
        "_Null_unspecified",
        "__FUNCTION__",
        "__PRETTY_FUNCTION__",
        "__attribute__",
        "getter",
        "setter",
        "retain",
        "unsafe_unretained",
        "nonnull",
        "nullable",
        "null_unspecified",
        "null_resettable",
        "class",
        "instancetype",
        "NS_DESIGNATED_INITIALIZER",
        "NS_UNAVAILABLE",
        "NS_REQUIRES_SUPER",
        "NS_RETURNS_INNER_POINTER",
        "NS_INLINE",
        "NS_AVAILABLE",
        "NS_DEPRECATED",
        "NS_ENUM",
        "NS_OPTIONS",
        "NS_SWIFT_UNAVAILABLE",
        "NS_ASSUME_NONNULL_BEGIN",
        "NS_ASSUME_NONNULL_END",
        "NS_REFINED_FOR_SWIFT",
        "NS_SWIFT_NAME",
        "NS_SWIFT_NOTHROW",
        "NS_DURING",
        "NS_HANDLER",
        "NS_ENDHANDLER",
        "NS_VALUERETURN",
        "NS_VOIDRETURN"
      ],
      literal: [
        "false",
        "true",
        "FALSE",
        "TRUE",
        "nil",
        "YES",
        "NO",
        "NULL"
      ],
      built_in: [
        "dispatch_once_t",
        "dispatch_queue_t",
        "dispatch_sync",
        "dispatch_async",
        "dispatch_once"
      ],
      type: [
        "int",
        "float",
        "char",
        "unsigned",
        "signed",
        "short",
        "long",
        "double",
        "wchar_t",
        "unichar",
        "void",
        "bool",
        "BOOL",
        "id|0",
        "_Bool"
      ]
    }, o = {
      $pattern: i,
      keyword: [
        "@interface",
        "@class",
        "@protocol",
        "@implementation"
      ]
    };
    return {
      name: "Objective-C",
      aliases: [
        "mm",
        "objc",
        "obj-c",
        "obj-c++",
        "objective-c++"
      ],
      keywords: c,
      illegal: "</",
      contains: [
        t,
        e.C_LINE_COMMENT_MODE,
        e.C_BLOCK_COMMENT_MODE,
        e.C_NUMBER_MODE,
        e.QUOTE_STRING_MODE,
        e.APOS_STRING_MODE,
        {
          className: "string",
          variants: [
            {
              begin: '@"',
              end: '"',
              illegal: "\\n",
              contains: [e.BACKSLASH_ESCAPE]
            }
          ]
        },
        {
          className: "meta",
          begin: /#\s*[a-z]+\b/,
          end: /$/,
          keywords: { keyword: "if else elif endif define undef warning error line pragma ifdef ifndef include" },
          contains: [
            {
              begin: /\\\n/,
              relevance: 0
            },
            e.inherit(e.QUOTE_STRING_MODE, { className: "string" }),
            {
              className: "string",
              begin: /<.*?>/,
              end: /$/,
              illegal: "\\n"
            },
            e.C_LINE_COMMENT_MODE,
            e.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          className: "class",
          begin: "(" + o.keyword.join("|") + ")\\b",
          end: /(\{|$)/,
          excludeEnd: !0,
          keywords: o,
          contains: [e.UNDERSCORE_TITLE_MODE]
        },
        {
          begin: "\\." + e.UNDERSCORE_IDENT_RE,
          relevance: 0
        }
      ]
    };
  }
  return an = n, an;
}
var rn, jn;
function ni() {
  if (jn) return rn;
  jn = 1;
  function n(e) {
    const t = e.regex, i = /(?![A-Za-z0-9])(?![$])/, d = t.concat(
      /[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,
      i
    ), l = t.concat(
      /(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,
      i
    ), r = t.concat(
      /[A-Z]+/,
      i
    ), s = {
      scope: "variable",
      match: "\\$+" + d
    }, c = {
      scope: "meta",
      variants: [
        { begin: /<\?php/, relevance: 10 },
        // boost for obvious PHP
        { begin: /<\?=/ },
        // less relevant per PSR-1 which says not to use short-tags
        { begin: /<\?/, relevance: 0.1 },
        { begin: /\?>/ }
        // end php tag
      ]
    }, o = {
      scope: "subst",
      variants: [
        { begin: /\$\w+/ },
        {
          begin: /\{\$/,
          end: /\}/
        }
      ]
    }, a = e.inherit(e.APOS_STRING_MODE, { illegal: null }), u = e.inherit(e.QUOTE_STRING_MODE, {
      illegal: null,
      contains: e.QUOTE_STRING_MODE.contains.concat(o)
    }), b = {
      begin: /<<<[ \t]*(?:(\w+)|"(\w+)")\n/,
      end: /[ \t]*(\w+)\b/,
      contains: e.QUOTE_STRING_MODE.contains.concat(o),
      "on:begin": (z, g) => {
        g.data._beginMatch = z[1] || z[2];
      },
      "on:end": (z, g) => {
        g.data._beginMatch !== z[1] && g.ignoreMatch();
      }
    }, p = e.END_SAME_AS_BEGIN({
      begin: /<<<[ \t]*'(\w+)'\n/,
      end: /[ \t]*(\w+)\b/
    }), _ = `[ 	
]`, h = {
      scope: "string",
      variants: [
        u,
        a,
        b,
        p
      ]
    }, m = {
      scope: "number",
      variants: [
        { begin: "\\b0[bB][01]+(?:_[01]+)*\\b" },
        // Binary w/ underscore support
        { begin: "\\b0[oO][0-7]+(?:_[0-7]+)*\\b" },
        // Octals w/ underscore support
        { begin: "\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b" },
        // Hex w/ underscore support
        // Decimals w/ underscore support, with optional fragments and scientific exponent (e) suffix.
        { begin: "(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?" }
      ],
      relevance: 0
    }, v = [
      "false",
      "null",
      "true"
    ], T = [
      // Magic constants:
      // <https://www.php.net/manual/en/language.constants.predefined.php>
      "__CLASS__",
      "__DIR__",
      "__FILE__",
      "__FUNCTION__",
      "__COMPILER_HALT_OFFSET__",
      "__LINE__",
      "__METHOD__",
      "__NAMESPACE__",
      "__TRAIT__",
      // Function that look like language construct or language construct that look like function:
      // List of keywords that may not require parenthesis
      "die",
      "echo",
      "exit",
      "include",
      "include_once",
      "print",
      "require",
      "require_once",
      // These are not language construct (function) but operate on the currently-executing function and can access the current symbol table
      // 'compact extract func_get_arg func_get_args func_num_args get_called_class get_parent_class ' +
      // Other keywords:
      // <https://www.php.net/manual/en/reserved.php>
      // <https://www.php.net/manual/en/language.types.type-juggling.php>
      "array",
      "abstract",
      "and",
      "as",
      "binary",
      "bool",
      "boolean",
      "break",
      "callable",
      "case",
      "catch",
      "class",
      "clone",
      "const",
      "continue",
      "declare",
      "default",
      "do",
      "double",
      "else",
      "elseif",
      "empty",
      "enddeclare",
      "endfor",
      "endforeach",
      "endif",
      "endswitch",
      "endwhile",
      "enum",
      "eval",
      "extends",
      "final",
      "finally",
      "float",
      "for",
      "foreach",
      "from",
      "global",
      "goto",
      "if",
      "implements",
      "instanceof",
      "insteadof",
      "int",
      "integer",
      "interface",
      "isset",
      "iterable",
      "list",
      "match|0",
      "mixed",
      "new",
      "never",
      "object",
      "or",
      "private",
      "protected",
      "public",
      "readonly",
      "real",
      "return",
      "string",
      "switch",
      "throw",
      "trait",
      "try",
      "unset",
      "use",
      "var",
      "void",
      "while",
      "xor",
      "yield"
    ], w = [
      // Standard PHP library:
      // <https://www.php.net/manual/en/book.spl.php>
      "Error|0",
      "AppendIterator",
      "ArgumentCountError",
      "ArithmeticError",
      "ArrayIterator",
      "ArrayObject",
      "AssertionError",
      "BadFunctionCallException",
      "BadMethodCallException",
      "CachingIterator",
      "CallbackFilterIterator",
      "CompileError",
      "Countable",
      "DirectoryIterator",
      "DivisionByZeroError",
      "DomainException",
      "EmptyIterator",
      "ErrorException",
      "Exception",
      "FilesystemIterator",
      "FilterIterator",
      "GlobIterator",
      "InfiniteIterator",
      "InvalidArgumentException",
      "IteratorIterator",
      "LengthException",
      "LimitIterator",
      "LogicException",
      "MultipleIterator",
      "NoRewindIterator",
      "OutOfBoundsException",
      "OutOfRangeException",
      "OuterIterator",
      "OverflowException",
      "ParentIterator",
      "ParseError",
      "RangeException",
      "RecursiveArrayIterator",
      "RecursiveCachingIterator",
      "RecursiveCallbackFilterIterator",
      "RecursiveDirectoryIterator",
      "RecursiveFilterIterator",
      "RecursiveIterator",
      "RecursiveIteratorIterator",
      "RecursiveRegexIterator",
      "RecursiveTreeIterator",
      "RegexIterator",
      "RuntimeException",
      "SeekableIterator",
      "SplDoublyLinkedList",
      "SplFileInfo",
      "SplFileObject",
      "SplFixedArray",
      "SplHeap",
      "SplMaxHeap",
      "SplMinHeap",
      "SplObjectStorage",
      "SplObserver",
      "SplPriorityQueue",
      "SplQueue",
      "SplStack",
      "SplSubject",
      "SplTempFileObject",
      "TypeError",
      "UnderflowException",
      "UnexpectedValueException",
      "UnhandledMatchError",
      // Reserved interfaces:
      // <https://www.php.net/manual/en/reserved.interfaces.php>
      "ArrayAccess",
      "BackedEnum",
      "Closure",
      "Fiber",
      "Generator",
      "Iterator",
      "IteratorAggregate",
      "Serializable",
      "Stringable",
      "Throwable",
      "Traversable",
      "UnitEnum",
      "WeakReference",
      "WeakMap",
      // Reserved classes:
      // <https://www.php.net/manual/en/reserved.classes.php>
      "Directory",
      "__PHP_Incomplete_Class",
      "parent",
      "php_user_filter",
      "self",
      "static",
      "stdClass"
    ], R = {
      keyword: T,
      literal: ((z) => {
        const g = [];
        return z.forEach((E) => {
          g.push(E), E.toLowerCase() === E ? g.push(E.toUpperCase()) : g.push(E.toLowerCase());
        }), g;
      })(v),
      built_in: w
    }, C = (z) => z.map((g) => g.replace(/\|\d+$/, "")), L = { variants: [
      {
        match: [
          /new/,
          t.concat(_, "+"),
          // to prevent built ins from being confused as the class constructor call
          t.concat("(?!", C(w).join("\\b|"), "\\b)"),
          l
        ],
        scope: {
          1: "keyword",
          4: "title.class"
        }
      }
    ] }, S = t.concat(d, "\\b(?!\\()"), I = { variants: [
      {
        match: [
          t.concat(
            /::/,
            t.lookahead(/(?!class\b)/)
          ),
          S
        ],
        scope: { 2: "variable.constant" }
      },
      {
        match: [
          /::/,
          /class/
        ],
        scope: { 2: "variable.language" }
      },
      {
        match: [
          l,
          t.concat(
            /::/,
            t.lookahead(/(?!class\b)/)
          ),
          S
        ],
        scope: {
          1: "title.class",
          3: "variable.constant"
        }
      },
      {
        match: [
          l,
          t.concat(
            "::",
            t.lookahead(/(?!class\b)/)
          )
        ],
        scope: { 1: "title.class" }
      },
      {
        match: [
          l,
          /::/,
          /class/
        ],
        scope: {
          1: "title.class",
          3: "variable.language"
        }
      }
    ] }, K = {
      scope: "attr",
      match: t.concat(d, t.lookahead(":"), t.lookahead(/(?!::)/))
    }, N = {
      relevance: 0,
      begin: /\(/,
      end: /\)/,
      keywords: R,
      contains: [
        K,
        s,
        I,
        e.C_BLOCK_COMMENT_MODE,
        h,
        m,
        L
      ]
    }, k = {
      relevance: 0,
      match: [
        /\b/,
        // to prevent keywords from being confused as the function title
        t.concat("(?!fn\\b|function\\b|", C(T).join("\\b|"), "|", C(w).join("\\b|"), "\\b)"),
        d,
        t.concat(_, "*"),
        t.lookahead(/(?=\()/)
      ],
      scope: { 3: "title.function.invoke" },
      contains: [N]
    };
    N.contains.push(k);
    const D = [
      K,
      I,
      e.C_BLOCK_COMMENT_MODE,
      h,
      m,
      L
    ], F = {
      begin: t.concat(
        /#\[\s*\\?/,
        t.either(
          l,
          r
        )
      ),
      beginScope: "meta",
      end: /]/,
      endScope: "meta",
      keywords: {
        literal: v,
        keyword: [
          "new",
          "array"
        ]
      },
      contains: [
        {
          begin: /\[/,
          end: /]/,
          keywords: {
            literal: v,
            keyword: [
              "new",
              "array"
            ]
          },
          contains: [
            "self",
            ...D
          ]
        },
        ...D,
        {
          scope: "meta",
          variants: [
            { match: l },
            { match: r }
          ]
        }
      ]
    };
    return {
      case_insensitive: !1,
      keywords: R,
      contains: [
        F,
        e.HASH_COMMENT_MODE,
        e.COMMENT("//", "$"),
        e.COMMENT(
          "/\\*",
          "\\*/",
          { contains: [
            {
              scope: "doctag",
              match: "@[A-Za-z]+"
            }
          ] }
        ),
        {
          match: /__halt_compiler\(\);/,
          keywords: "__halt_compiler",
          starts: {
            scope: "comment",
            end: e.MATCH_NOTHING_RE,
            contains: [
              {
                match: /\?>/,
                scope: "meta",
                endsParent: !0
              }
            ]
          }
        },
        c,
        {
          scope: "variable.language",
          match: /\$this\b/
        },
        s,
        k,
        I,
        {
          match: [
            /const/,
            /\s/,
            d
          ],
          scope: {
            1: "keyword",
            3: "variable.constant"
          }
        },
        L,
        {
          scope: "function",
          relevance: 0,
          beginKeywords: "fn function",
          end: /[;{]/,
          excludeEnd: !0,
          illegal: "[$%\\[]",
          contains: [
            { beginKeywords: "use" },
            e.UNDERSCORE_TITLE_MODE,
            {
              begin: "=>",
              // No markup, just a relevance booster
              endsParent: !0
            },
            {
              scope: "params",
              begin: "\\(",
              end: "\\)",
              excludeBegin: !0,
              excludeEnd: !0,
              keywords: R,
              contains: [
                "self",
                F,
                s,
                I,
                e.C_BLOCK_COMMENT_MODE,
                h,
                m
              ]
            }
          ]
        },
        {
          scope: "class",
          variants: [
            {
              beginKeywords: "enum",
              illegal: /[($"]/
            },
            {
              beginKeywords: "class interface trait",
              illegal: /[:($"]/
            }
          ],
          relevance: 0,
          end: /\{/,
          excludeEnd: !0,
          contains: [
            { beginKeywords: "extends implements" },
            e.UNDERSCORE_TITLE_MODE
          ]
        },
        // both use and namespace still use "old style" rules (vs multi-match)
        // because the namespace name can include `\` and we still want each
        // element to be treated as its own *individual* title
        {
          beginKeywords: "namespace",
          relevance: 0,
          end: ";",
          illegal: /[.']/,
          contains: [e.inherit(e.UNDERSCORE_TITLE_MODE, { scope: "title.class" })]
        },
        {
          beginKeywords: "use",
          relevance: 0,
          end: ";",
          contains: [
            // TODO: title.function vs title.class
            {
              match: /\b(as|const|function)\b/,
              scope: "keyword"
            },
            // TODO: could be title.class or title.function
            e.UNDERSCORE_TITLE_MODE
          ]
        },
        h,
        m
      ]
    };
  }
  return rn = n, rn;
}
var sn, et;
function ti() {
  if (et) return sn;
  et = 1;
  function n(e) {
    return {
      name: "PHP template",
      subLanguage: "xml",
      contains: [
        {
          begin: /<\?(php|=)?/,
          end: /\?>/,
          subLanguage: "php",
          contains: [
            // We don't want the php closing tag ?> to close the PHP block when
            // inside any of the following blocks:
            {
              begin: "/\\*",
              end: "\\*/",
              skip: !0
            },
            {
              begin: 'b"',
              end: '"',
              skip: !0
            },
            {
              begin: "b'",
              end: "'",
              skip: !0
            },
            e.inherit(e.APOS_STRING_MODE, {
              illegal: null,
              className: null,
              contains: null,
              skip: !0
            }),
            e.inherit(e.QUOTE_STRING_MODE, {
              illegal: null,
              className: null,
              contains: null,
              skip: !0
            })
          ]
        }
      ]
    };
  }
  return sn = n, sn;
}
var on, nt;
function ai() {
  if (nt) return on;
  nt = 1;
  function n(e) {
    return {
      name: "Plain text",
      aliases: [
        "text",
        "txt"
      ],
      disableAutodetect: !0
    };
  }
  return on = n, on;
}
var cn, tt;
function ii() {
  if (tt) return cn;
  tt = 1;
  function n(e) {
    const t = e.regex, i = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u"), d = [
      "and",
      "as",
      "assert",
      "async",
      "await",
      "break",
      "case",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "match",
      "nonlocal|10",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield"
    ], c = {
      $pattern: /[A-Za-z]\w+|__\w+__/,
      keyword: d,
      built_in: [
        "__import__",
        "abs",
        "all",
        "any",
        "ascii",
        "bin",
        "bool",
        "breakpoint",
        "bytearray",
        "bytes",
        "callable",
        "chr",
        "classmethod",
        "compile",
        "complex",
        "delattr",
        "dict",
        "dir",
        "divmod",
        "enumerate",
        "eval",
        "exec",
        "filter",
        "float",
        "format",
        "frozenset",
        "getattr",
        "globals",
        "hasattr",
        "hash",
        "help",
        "hex",
        "id",
        "input",
        "int",
        "isinstance",
        "issubclass",
        "iter",
        "len",
        "list",
        "locals",
        "map",
        "max",
        "memoryview",
        "min",
        "next",
        "object",
        "oct",
        "open",
        "ord",
        "pow",
        "print",
        "property",
        "range",
        "repr",
        "reversed",
        "round",
        "set",
        "setattr",
        "slice",
        "sorted",
        "staticmethod",
        "str",
        "sum",
        "super",
        "tuple",
        "type",
        "vars",
        "zip"
      ],
      literal: [
        "__debug__",
        "Ellipsis",
        "False",
        "None",
        "NotImplemented",
        "True"
      ],
      type: [
        "Any",
        "Callable",
        "Coroutine",
        "Dict",
        "List",
        "Literal",
        "Generic",
        "Optional",
        "Sequence",
        "Set",
        "Tuple",
        "Type",
        "Union"
      ]
    }, o = {
      className: "meta",
      begin: /^(>>>|\.\.\.) /
    }, a = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: c,
      illegal: /#/
    }, u = {
      begin: /\{\{/,
      relevance: 0
    }, b = {
      className: "string",
      contains: [e.BACKSLASH_ESCAPE],
      variants: [
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
          end: /'''/,
          contains: [
            e.BACKSLASH_ESCAPE,
            o
          ],
          relevance: 10
        },
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
          end: /"""/,
          contains: [
            e.BACKSLASH_ESCAPE,
            o
          ],
          relevance: 10
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])'''/,
          end: /'''/,
          contains: [
            e.BACKSLASH_ESCAPE,
            o,
            u,
            a
          ]
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])"""/,
          end: /"""/,
          contains: [
            e.BACKSLASH_ESCAPE,
            o,
            u,
            a
          ]
        },
        {
          begin: /([uU]|[rR])'/,
          end: /'/,
          relevance: 10
        },
        {
          begin: /([uU]|[rR])"/,
          end: /"/,
          relevance: 10
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])'/,
          end: /'/
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])"/,
          end: /"/
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])'/,
          end: /'/,
          contains: [
            e.BACKSLASH_ESCAPE,
            u,
            a
          ]
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])"/,
          end: /"/,
          contains: [
            e.BACKSLASH_ESCAPE,
            u,
            a
          ]
        },
        e.APOS_STRING_MODE,
        e.QUOTE_STRING_MODE
      ]
    }, p = "[0-9](_?[0-9])*", _ = `(\\b(${p}))?\\.(${p})|\\b(${p})\\.`, h = `\\b|${d.join("|")}`, m = {
      className: "number",
      relevance: 0,
      variants: [
        // exponentfloat, pointfloat
        // https://docs.python.org/3.9/reference/lexical_analysis.html#floating-point-literals
        // optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        // Note: no leading \b because floats can start with a decimal point
        // and we don't want to mishandle e.g. `fn(.5)`,
        // no trailing \b for pointfloat because it can end with a decimal point
        // and we don't want to mishandle e.g. `0..hex()`; this should be safe
        // because both MUST contain a decimal point and so cannot be confused with
        // the interior part of an identifier
        {
          begin: `(\\b(${p})|(${_}))[eE][+-]?(${p})[jJ]?(?=${h})`
        },
        {
          begin: `(${_})[jJ]?`
        },
        // decinteger, bininteger, octinteger, hexinteger
        // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
        // optionally "long" in Python 2
        // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
        // decinteger is optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${h})`
        },
        {
          begin: `\\b0[bB](_?[01])+[lL]?(?=${h})`
        },
        {
          begin: `\\b0[oO](_?[0-7])+[lL]?(?=${h})`
        },
        {
          begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${h})`
        },
        // imagnumber (digitpart-based)
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b(${p})[jJ](?=${h})`
        }
      ]
    }, v = {
      className: "comment",
      begin: t.lookahead(/# type:/),
      end: /$/,
      keywords: c,
      contains: [
        {
          // prevent keywords from coloring `type`
          begin: /# type:/
        },
        // comment within a datatype comment includes no keywords
        {
          begin: /#/,
          end: /\b\B/,
          endsWithParent: !0
        }
      ]
    }, T = {
      className: "params",
      variants: [
        // Exclude params in functions without params
        {
          className: "",
          begin: /\(\s*\)/,
          skip: !0
        },
        {
          begin: /\(/,
          end: /\)/,
          excludeBegin: !0,
          excludeEnd: !0,
          keywords: c,
          contains: [
            "self",
            o,
            m,
            b,
            e.HASH_COMMENT_MODE
          ]
        }
      ]
    };
    return a.contains = [
      b,
      m,
      o
    ], {
      name: "Python",
      aliases: [
        "py",
        "gyp",
        "ipython"
      ],
      unicodeRegex: !0,
      keywords: c,
      illegal: /(<\/|\?)|=>/,
      contains: [
        o,
        m,
        {
          // very common convention
          scope: "variable.language",
          match: /\bself\b/
        },
        {
          // eat "if" prior to string so that it won't accidentally be
          // labeled as an f-string
          beginKeywords: "if",
          relevance: 0
        },
        { match: /\bor\b/, scope: "keyword" },
        b,
        v,
        e.HASH_COMMENT_MODE,
        {
          match: [
            /\bdef/,
            /\s+/,
            i
          ],
          scope: {
            1: "keyword",
            3: "title.function"
          },
          contains: [T]
        },
        {
          variants: [
            {
              match: [
                /\bclass/,
                /\s+/,
                i,
                /\s*/,
                /\(\s*/,
                i,
                /\s*\)/
              ]
            },
            {
              match: [
                /\bclass/,
                /\s+/,
                i
              ]
            }
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            6: "title.class.inherited"
          }
        },
        {
          className: "meta",
          begin: /^[\t ]*@/,
          end: /(?=#)|$/,
          contains: [
            m,
            T,
            b
          ]
        }
      ]
    };
  }
  return cn = n, cn;
}
var ln, at;
function ri() {
  if (at) return ln;
  at = 1;
  function n(e) {
    return {
      aliases: ["pycon"],
      contains: [
        {
          className: "meta.prompt",
          starts: {
            // a space separates the REPL prefix from the actual code
            // this is purely for cleaner HTML output
            end: / |$/,
            starts: {
              end: "$",
              subLanguage: "python"
            }
          },
          variants: [
            { begin: /^>>>(?=[ ]|$)/ },
            { begin: /^\.\.\.(?=[ ]|$)/ }
          ]
        }
      ]
    };
  }
  return ln = n, ln;
}
var dn, it;
function si() {
  if (it) return dn;
  it = 1;
  function n(e) {
    const t = e.regex, i = /(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/, d = t.either(
      // Special case: only hexadecimal binary powers can contain fractions
      /0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/,
      // Hexadecimal numbers without fraction and optional binary power
      /0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/,
      // Decimal numbers
      /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/
    ), l = /[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/, r = t.either(
      /[()]/,
      /[{}]/,
      /\[\[/,
      /[[\]]/,
      /\\/,
      /,/
    );
    return {
      name: "R",
      keywords: {
        $pattern: i,
        keyword: "function if in break next repeat else for while",
        literal: "NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",
        built_in: (
          // Builtin constants
          "LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"
        )
      },
      contains: [
        // Roxygen comments
        e.COMMENT(
          /#'/,
          /$/,
          { contains: [
            {
              // Handle `@examples` separately to cause all subsequent code
              // until the next `@`-tag on its own line to be kept as-is,
              // preventing highlighting. This code is example R code, so nested
              // doctags shouldn’t be treated as such. See
              // `test/markup/r/roxygen.txt` for an example.
              scope: "doctag",
              match: /@examples/,
              starts: {
                end: t.lookahead(t.either(
                  // end if another doc comment
                  /\n^#'\s*(?=@[a-zA-Z]+)/,
                  // or a line with no comment
                  /\n^(?!#')/
                )),
                endsParent: !0
              }
            },
            {
              // Handle `@param` to highlight the parameter name following
              // after.
              scope: "doctag",
              begin: "@param",
              end: /$/,
              contains: [
                {
                  scope: "variable",
                  variants: [
                    { match: i },
                    { match: /`(?:\\.|[^`\\])+`/ }
                  ],
                  endsParent: !0
                }
              ]
            },
            {
              scope: "doctag",
              match: /@[a-zA-Z]+/
            },
            {
              scope: "keyword",
              match: /\\[a-zA-Z]+/
            }
          ] }
        ),
        e.HASH_COMMENT_MODE,
        {
          scope: "string",
          contains: [e.BACKSLASH_ESCAPE],
          variants: [
            e.END_SAME_AS_BEGIN({
              begin: /[rR]"(-*)\(/,
              end: /\)(-*)"/
            }),
            e.END_SAME_AS_BEGIN({
              begin: /[rR]"(-*)\{/,
              end: /\}(-*)"/
            }),
            e.END_SAME_AS_BEGIN({
              begin: /[rR]"(-*)\[/,
              end: /\](-*)"/
            }),
            e.END_SAME_AS_BEGIN({
              begin: /[rR]'(-*)\(/,
              end: /\)(-*)'/
            }),
            e.END_SAME_AS_BEGIN({
              begin: /[rR]'(-*)\{/,
              end: /\}(-*)'/
            }),
            e.END_SAME_AS_BEGIN({
              begin: /[rR]'(-*)\[/,
              end: /\](-*)'/
            }),
            {
              begin: '"',
              end: '"',
              relevance: 0
            },
            {
              begin: "'",
              end: "'",
              relevance: 0
            }
          ]
        },
        // Matching numbers immediately following punctuation and operators is
        // tricky since we need to look at the character ahead of a number to
        // ensure the number is not part of an identifier, and we cannot use
        // negative look-behind assertions. So instead we explicitly handle all
        // possible combinations of (operator|punctuation), number.
        // TODO: replace with negative look-behind when available
        // { begin: /(?<![a-zA-Z0-9._])0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/ },
        // { begin: /(?<![a-zA-Z0-9._])0[xX][0-9a-fA-F]+([pP][+-]?\d+)?[Li]?/ },
        // { begin: /(?<![a-zA-Z0-9._])(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?[Li]?/ }
        {
          relevance: 0,
          variants: [
            {
              scope: {
                1: "operator",
                2: "number"
              },
              match: [
                l,
                d
              ]
            },
            {
              scope: {
                1: "operator",
                2: "number"
              },
              match: [
                /%[^%]*%/,
                d
              ]
            },
            {
              scope: {
                1: "punctuation",
                2: "number"
              },
              match: [
                r,
                d
              ]
            },
            {
              scope: { 2: "number" },
              match: [
                /[^a-zA-Z0-9._]|^/,
                // not part of an identifier, or start of document
                d
              ]
            }
          ]
        },
        // Operators/punctuation when they're not directly followed by numbers
        {
          // Relevance boost for the most common assignment form.
          scope: { 3: "operator" },
          match: [
            i,
            /\s+/,
            /<-/,
            /\s+/
          ]
        },
        {
          scope: "operator",
          relevance: 0,
          variants: [
            { match: l },
            { match: /%[^%]*%/ }
          ]
        },
        {
          scope: "punctuation",
          relevance: 0,
          match: r
        },
        {
          // Escaped identifier
          begin: "`",
          end: "`",
          contains: [{ begin: /\\./ }]
        }
      ]
    };
  }
  return dn = n, dn;
}
var un, rt;
function oi() {
  if (rt) return un;
  rt = 1;
  function n(e) {
    const t = e.regex, i = /(r#)?/, d = t.concat(i, e.UNDERSCORE_IDENT_RE), l = t.concat(i, e.IDENT_RE), r = {
      className: "title.function.invoke",
      relevance: 0,
      begin: t.concat(
        /\b/,
        /(?!let|for|while|if|else|match\b)/,
        l,
        t.lookahead(/\s*\(/)
      )
    }, s = "([ui](8|16|32|64|128|size)|f(32|64))?", c = [
      "abstract",
      "as",
      "async",
      "await",
      "become",
      "box",
      "break",
      "const",
      "continue",
      "crate",
      "do",
      "dyn",
      "else",
      "enum",
      "extern",
      "false",
      "final",
      "fn",
      "for",
      "if",
      "impl",
      "in",
      "let",
      "loop",
      "macro",
      "match",
      "mod",
      "move",
      "mut",
      "override",
      "priv",
      "pub",
      "ref",
      "return",
      "self",
      "Self",
      "static",
      "struct",
      "super",
      "trait",
      "true",
      "try",
      "type",
      "typeof",
      "union",
      "unsafe",
      "unsized",
      "use",
      "virtual",
      "where",
      "while",
      "yield"
    ], o = [
      "true",
      "false",
      "Some",
      "None",
      "Ok",
      "Err"
    ], a = [
      // functions
      "drop ",
      // traits
      "Copy",
      "Send",
      "Sized",
      "Sync",
      "Drop",
      "Fn",
      "FnMut",
      "FnOnce",
      "ToOwned",
      "Clone",
      "Debug",
      "PartialEq",
      "PartialOrd",
      "Eq",
      "Ord",
      "AsRef",
      "AsMut",
      "Into",
      "From",
      "Default",
      "Iterator",
      "Extend",
      "IntoIterator",
      "DoubleEndedIterator",
      "ExactSizeIterator",
      "SliceConcatExt",
      "ToString",
      // macros
      "assert!",
      "assert_eq!",
      "bitflags!",
      "bytes!",
      "cfg!",
      "col!",
      "concat!",
      "concat_idents!",
      "debug_assert!",
      "debug_assert_eq!",
      "env!",
      "eprintln!",
      "panic!",
      "file!",
      "format!",
      "format_args!",
      "include_bytes!",
      "include_str!",
      "line!",
      "local_data_key!",
      "module_path!",
      "option_env!",
      "print!",
      "println!",
      "select!",
      "stringify!",
      "try!",
      "unimplemented!",
      "unreachable!",
      "vec!",
      "write!",
      "writeln!",
      "macro_rules!",
      "assert_ne!",
      "debug_assert_ne!"
    ], u = [
      "i8",
      "i16",
      "i32",
      "i64",
      "i128",
      "isize",
      "u8",
      "u16",
      "u32",
      "u64",
      "u128",
      "usize",
      "f32",
      "f64",
      "str",
      "char",
      "bool",
      "Box",
      "Option",
      "Result",
      "String",
      "Vec"
    ];
    return {
      name: "Rust",
      aliases: ["rs"],
      keywords: {
        $pattern: e.IDENT_RE + "!?",
        type: u,
        keyword: c,
        literal: o,
        built_in: a
      },
      illegal: "</",
      contains: [
        e.C_LINE_COMMENT_MODE,
        e.COMMENT("/\\*", "\\*/", { contains: ["self"] }),
        e.inherit(e.QUOTE_STRING_MODE, {
          begin: /b?"/,
          illegal: null
        }),
        {
          className: "symbol",
          // negative lookahead to avoid matching `'`
          begin: /'[a-zA-Z_][a-zA-Z0-9_]*(?!')/
        },
        {
          scope: "string",
          variants: [
            { begin: /b?r(#*)"(.|\n)*?"\1(?!#)/ },
            {
              begin: /b?'/,
              end: /'/,
              contains: [
                {
                  scope: "char.escape",
                  match: /\\('|\w|x\w{2}|u\w{4}|U\w{8})/
                }
              ]
            }
          ]
        },
        {
          className: "number",
          variants: [
            { begin: "\\b0b([01_]+)" + s },
            { begin: "\\b0o([0-7_]+)" + s },
            { begin: "\\b0x([A-Fa-f0-9_]+)" + s },
            { begin: "\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)" + s }
          ],
          relevance: 0
        },
        {
          begin: [
            /fn/,
            /\s+/,
            d
          ],
          className: {
            1: "keyword",
            3: "title.function"
          }
        },
        {
          className: "meta",
          begin: "#!?\\[",
          end: "\\]",
          contains: [
            {
              className: "string",
              begin: /"/,
              end: /"/,
              contains: [
                e.BACKSLASH_ESCAPE
              ]
            }
          ]
        },
        {
          begin: [
            /let/,
            /\s+/,
            /(?:mut\s+)?/,
            d
          ],
          className: {
            1: "keyword",
            3: "keyword",
            4: "variable"
          }
        },
        // must come before impl/for rule later
        {
          begin: [
            /for/,
            /\s+/,
            d,
            /\s+/,
            /in/
          ],
          className: {
            1: "keyword",
            3: "variable",
            5: "keyword"
          }
        },
        {
          begin: [
            /type/,
            /\s+/,
            d
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          begin: [
            /(?:trait|enum|struct|union|impl|for)/,
            /\s+/,
            d
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          begin: e.IDENT_RE + "::",
          keywords: {
            keyword: "Self",
            built_in: a,
            type: u
          }
        },
        {
          className: "punctuation",
          begin: "->"
        },
        r
      ]
    };
  }
  return un = n, un;
}
var gn, st;
function ci() {
  if (st) return gn;
  st = 1;
  const n = (o) => ({
    IMPORTANT: {
      scope: "meta",
      begin: "!important"
    },
    BLOCK_COMMENT: o.C_BLOCK_COMMENT_MODE,
    HEXCOLOR: {
      scope: "number",
      begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
    },
    FUNCTION_DISPATCH: {
      className: "built_in",
      begin: /[\w-]+(?=\()/
    },
    ATTRIBUTE_SELECTOR_MODE: {
      scope: "selector-attr",
      begin: /\[/,
      end: /\]/,
      illegal: "$",
      contains: [
        o.APOS_STRING_MODE,
        o.QUOTE_STRING_MODE
      ]
    },
    CSS_NUMBER_MODE: {
      scope: "number",
      begin: o.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
      relevance: 0
    },
    CSS_VARIABLE: {
      className: "attr",
      begin: /--[A-Za-z_][A-Za-z0-9_-]*/
    }
  }), e = [
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "audio",
    "b",
    "blockquote",
    "body",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "dd",
    "del",
    "details",
    "dfn",
    "div",
    "dl",
    "dt",
    "em",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "main",
    "mark",
    "menu",
    "nav",
    "object",
    "ol",
    "optgroup",
    "option",
    "p",
    "picture",
    "q",
    "quote",
    "samp",
    "section",
    "select",
    "source",
    "span",
    "strong",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "tr",
    "ul",
    "var",
    "video"
  ], t = [
    "defs",
    "g",
    "marker",
    "mask",
    "pattern",
    "svg",
    "switch",
    "symbol",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feFlood",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMorphology",
    "feOffset",
    "feSpecularLighting",
    "feTile",
    "feTurbulence",
    "linearGradient",
    "radialGradient",
    "stop",
    "circle",
    "ellipse",
    "image",
    "line",
    "path",
    "polygon",
    "polyline",
    "rect",
    "text",
    "use",
    "textPath",
    "tspan",
    "foreignObject",
    "clipPath"
  ], i = [
    ...e,
    ...t
  ], d = [
    "any-hover",
    "any-pointer",
    "aspect-ratio",
    "color",
    "color-gamut",
    "color-index",
    "device-aspect-ratio",
    "device-height",
    "device-width",
    "display-mode",
    "forced-colors",
    "grid",
    "height",
    "hover",
    "inverted-colors",
    "monochrome",
    "orientation",
    "overflow-block",
    "overflow-inline",
    "pointer",
    "prefers-color-scheme",
    "prefers-contrast",
    "prefers-reduced-motion",
    "prefers-reduced-transparency",
    "resolution",
    "scan",
    "scripting",
    "update",
    "width",
    // TODO: find a better solution?
    "min-width",
    "max-width",
    "min-height",
    "max-height"
  ].sort().reverse(), l = [
    "active",
    "any-link",
    "blank",
    "checked",
    "current",
    "default",
    "defined",
    "dir",
    // dir()
    "disabled",
    "drop",
    "empty",
    "enabled",
    "first",
    "first-child",
    "first-of-type",
    "fullscreen",
    "future",
    "focus",
    "focus-visible",
    "focus-within",
    "has",
    // has()
    "host",
    // host or host()
    "host-context",
    // host-context()
    "hover",
    "indeterminate",
    "in-range",
    "invalid",
    "is",
    // is()
    "lang",
    // lang()
    "last-child",
    "last-of-type",
    "left",
    "link",
    "local-link",
    "not",
    // not()
    "nth-child",
    // nth-child()
    "nth-col",
    // nth-col()
    "nth-last-child",
    // nth-last-child()
    "nth-last-col",
    // nth-last-col()
    "nth-last-of-type",
    //nth-last-of-type()
    "nth-of-type",
    //nth-of-type()
    "only-child",
    "only-of-type",
    "optional",
    "out-of-range",
    "past",
    "placeholder-shown",
    "read-only",
    "read-write",
    "required",
    "right",
    "root",
    "scope",
    "target",
    "target-within",
    "user-invalid",
    "valid",
    "visited",
    "where"
    // where()
  ].sort().reverse(), r = [
    "after",
    "backdrop",
    "before",
    "cue",
    "cue-region",
    "first-letter",
    "first-line",
    "grammar-error",
    "marker",
    "part",
    "placeholder",
    "selection",
    "slotted",
    "spelling-error"
  ].sort().reverse(), s = [
    "accent-color",
    "align-content",
    "align-items",
    "align-self",
    "alignment-baseline",
    "all",
    "anchor-name",
    "animation",
    "animation-composition",
    "animation-delay",
    "animation-direction",
    "animation-duration",
    "animation-fill-mode",
    "animation-iteration-count",
    "animation-name",
    "animation-play-state",
    "animation-range",
    "animation-range-end",
    "animation-range-start",
    "animation-timeline",
    "animation-timing-function",
    "appearance",
    "aspect-ratio",
    "backdrop-filter",
    "backface-visibility",
    "background",
    "background-attachment",
    "background-blend-mode",
    "background-clip",
    "background-color",
    "background-image",
    "background-origin",
    "background-position",
    "background-position-x",
    "background-position-y",
    "background-repeat",
    "background-size",
    "baseline-shift",
    "block-size",
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-end-color",
    "border-block-end-style",
    "border-block-end-width",
    "border-block-start",
    "border-block-start-color",
    "border-block-start-style",
    "border-block-start-width",
    "border-block-style",
    "border-block-width",
    "border-bottom",
    "border-bottom-color",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-bottom-style",
    "border-bottom-width",
    "border-collapse",
    "border-color",
    "border-end-end-radius",
    "border-end-start-radius",
    "border-image",
    "border-image-outset",
    "border-image-repeat",
    "border-image-slice",
    "border-image-source",
    "border-image-width",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-end-color",
    "border-inline-end-style",
    "border-inline-end-width",
    "border-inline-start",
    "border-inline-start-color",
    "border-inline-start-style",
    "border-inline-start-width",
    "border-inline-style",
    "border-inline-width",
    "border-left",
    "border-left-color",
    "border-left-style",
    "border-left-width",
    "border-radius",
    "border-right",
    "border-right-color",
    "border-right-style",
    "border-right-width",
    "border-spacing",
    "border-start-end-radius",
    "border-start-start-radius",
    "border-style",
    "border-top",
    "border-top-color",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-top-style",
    "border-top-width",
    "border-width",
    "bottom",
    "box-align",
    "box-decoration-break",
    "box-direction",
    "box-flex",
    "box-flex-group",
    "box-lines",
    "box-ordinal-group",
    "box-orient",
    "box-pack",
    "box-shadow",
    "box-sizing",
    "break-after",
    "break-before",
    "break-inside",
    "caption-side",
    "caret-color",
    "clear",
    "clip",
    "clip-path",
    "clip-rule",
    "color",
    "color-interpolation",
    "color-interpolation-filters",
    "color-profile",
    "color-rendering",
    "color-scheme",
    "column-count",
    "column-fill",
    "column-gap",
    "column-rule",
    "column-rule-color",
    "column-rule-style",
    "column-rule-width",
    "column-span",
    "column-width",
    "columns",
    "contain",
    "contain-intrinsic-block-size",
    "contain-intrinsic-height",
    "contain-intrinsic-inline-size",
    "contain-intrinsic-size",
    "contain-intrinsic-width",
    "container",
    "container-name",
    "container-type",
    "content",
    "content-visibility",
    "counter-increment",
    "counter-reset",
    "counter-set",
    "cue",
    "cue-after",
    "cue-before",
    "cursor",
    "cx",
    "cy",
    "direction",
    "display",
    "dominant-baseline",
    "empty-cells",
    "enable-background",
    "field-sizing",
    "fill",
    "fill-opacity",
    "fill-rule",
    "filter",
    "flex",
    "flex-basis",
    "flex-direction",
    "flex-flow",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "float",
    "flood-color",
    "flood-opacity",
    "flow",
    "font",
    "font-display",
    "font-family",
    "font-feature-settings",
    "font-kerning",
    "font-language-override",
    "font-optical-sizing",
    "font-palette",
    "font-size",
    "font-size-adjust",
    "font-smooth",
    "font-smoothing",
    "font-stretch",
    "font-style",
    "font-synthesis",
    "font-synthesis-position",
    "font-synthesis-small-caps",
    "font-synthesis-style",
    "font-synthesis-weight",
    "font-variant",
    "font-variant-alternates",
    "font-variant-caps",
    "font-variant-east-asian",
    "font-variant-emoji",
    "font-variant-ligatures",
    "font-variant-numeric",
    "font-variant-position",
    "font-variation-settings",
    "font-weight",
    "forced-color-adjust",
    "gap",
    "glyph-orientation-horizontal",
    "glyph-orientation-vertical",
    "grid",
    "grid-area",
    "grid-auto-columns",
    "grid-auto-flow",
    "grid-auto-rows",
    "grid-column",
    "grid-column-end",
    "grid-column-start",
    "grid-gap",
    "grid-row",
    "grid-row-end",
    "grid-row-start",
    "grid-template",
    "grid-template-areas",
    "grid-template-columns",
    "grid-template-rows",
    "hanging-punctuation",
    "height",
    "hyphenate-character",
    "hyphenate-limit-chars",
    "hyphens",
    "icon",
    "image-orientation",
    "image-rendering",
    "image-resolution",
    "ime-mode",
    "initial-letter",
    "initial-letter-align",
    "inline-size",
    "inset",
    "inset-area",
    "inset-block",
    "inset-block-end",
    "inset-block-start",
    "inset-inline",
    "inset-inline-end",
    "inset-inline-start",
    "isolation",
    "justify-content",
    "justify-items",
    "justify-self",
    "kerning",
    "left",
    "letter-spacing",
    "lighting-color",
    "line-break",
    "line-height",
    "line-height-step",
    "list-style",
    "list-style-image",
    "list-style-position",
    "list-style-type",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "margin-trim",
    "marker",
    "marker-end",
    "marker-mid",
    "marker-start",
    "marks",
    "mask",
    "mask-border",
    "mask-border-mode",
    "mask-border-outset",
    "mask-border-repeat",
    "mask-border-slice",
    "mask-border-source",
    "mask-border-width",
    "mask-clip",
    "mask-composite",
    "mask-image",
    "mask-mode",
    "mask-origin",
    "mask-position",
    "mask-repeat",
    "mask-size",
    "mask-type",
    "masonry-auto-flow",
    "math-depth",
    "math-shift",
    "math-style",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "mix-blend-mode",
    "nav-down",
    "nav-index",
    "nav-left",
    "nav-right",
    "nav-up",
    "none",
    "normal",
    "object-fit",
    "object-position",
    "offset",
    "offset-anchor",
    "offset-distance",
    "offset-path",
    "offset-position",
    "offset-rotate",
    "opacity",
    "order",
    "orphans",
    "outline",
    "outline-color",
    "outline-offset",
    "outline-style",
    "outline-width",
    "overflow",
    "overflow-anchor",
    "overflow-block",
    "overflow-clip-margin",
    "overflow-inline",
    "overflow-wrap",
    "overflow-x",
    "overflow-y",
    "overlay",
    "overscroll-behavior",
    "overscroll-behavior-block",
    "overscroll-behavior-inline",
    "overscroll-behavior-x",
    "overscroll-behavior-y",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "page",
    "page-break-after",
    "page-break-before",
    "page-break-inside",
    "paint-order",
    "pause",
    "pause-after",
    "pause-before",
    "perspective",
    "perspective-origin",
    "place-content",
    "place-items",
    "place-self",
    "pointer-events",
    "position",
    "position-anchor",
    "position-visibility",
    "print-color-adjust",
    "quotes",
    "r",
    "resize",
    "rest",
    "rest-after",
    "rest-before",
    "right",
    "rotate",
    "row-gap",
    "ruby-align",
    "ruby-position",
    "scale",
    "scroll-behavior",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-block-end",
    "scroll-margin-block-start",
    "scroll-margin-bottom",
    "scroll-margin-inline",
    "scroll-margin-inline-end",
    "scroll-margin-inline-start",
    "scroll-margin-left",
    "scroll-margin-right",
    "scroll-margin-top",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-block-end",
    "scroll-padding-block-start",
    "scroll-padding-bottom",
    "scroll-padding-inline",
    "scroll-padding-inline-end",
    "scroll-padding-inline-start",
    "scroll-padding-left",
    "scroll-padding-right",
    "scroll-padding-top",
    "scroll-snap-align",
    "scroll-snap-stop",
    "scroll-snap-type",
    "scroll-timeline",
    "scroll-timeline-axis",
    "scroll-timeline-name",
    "scrollbar-color",
    "scrollbar-gutter",
    "scrollbar-width",
    "shape-image-threshold",
    "shape-margin",
    "shape-outside",
    "shape-rendering",
    "speak",
    "speak-as",
    "src",
    // @font-face
    "stop-color",
    "stop-opacity",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "tab-size",
    "table-layout",
    "text-align",
    "text-align-all",
    "text-align-last",
    "text-anchor",
    "text-combine-upright",
    "text-decoration",
    "text-decoration-color",
    "text-decoration-line",
    "text-decoration-skip",
    "text-decoration-skip-ink",
    "text-decoration-style",
    "text-decoration-thickness",
    "text-emphasis",
    "text-emphasis-color",
    "text-emphasis-position",
    "text-emphasis-style",
    "text-indent",
    "text-justify",
    "text-orientation",
    "text-overflow",
    "text-rendering",
    "text-shadow",
    "text-size-adjust",
    "text-transform",
    "text-underline-offset",
    "text-underline-position",
    "text-wrap",
    "text-wrap-mode",
    "text-wrap-style",
    "timeline-scope",
    "top",
    "touch-action",
    "transform",
    "transform-box",
    "transform-origin",
    "transform-style",
    "transition",
    "transition-behavior",
    "transition-delay",
    "transition-duration",
    "transition-property",
    "transition-timing-function",
    "translate",
    "unicode-bidi",
    "user-modify",
    "user-select",
    "vector-effect",
    "vertical-align",
    "view-timeline",
    "view-timeline-axis",
    "view-timeline-inset",
    "view-timeline-name",
    "view-transition-name",
    "visibility",
    "voice-balance",
    "voice-duration",
    "voice-family",
    "voice-pitch",
    "voice-range",
    "voice-rate",
    "voice-stress",
    "voice-volume",
    "white-space",
    "white-space-collapse",
    "widows",
    "width",
    "will-change",
    "word-break",
    "word-spacing",
    "word-wrap",
    "writing-mode",
    "x",
    "y",
    "z-index",
    "zoom"
  ].sort().reverse();
  function c(o) {
    const a = n(o), u = r, b = l, p = "@[a-z-]+", _ = "and or not only", m = {
      className: "variable",
      begin: "(\\$" + "[a-zA-Z-][a-zA-Z0-9_-]*" + ")\\b",
      relevance: 0
    };
    return {
      name: "SCSS",
      case_insensitive: !0,
      illegal: "[=/|']",
      contains: [
        o.C_LINE_COMMENT_MODE,
        o.C_BLOCK_COMMENT_MODE,
        // to recognize keyframe 40% etc which are outside the scope of our
        // attribute value mode
        a.CSS_NUMBER_MODE,
        {
          className: "selector-id",
          begin: "#[A-Za-z0-9_-]+",
          relevance: 0
        },
        {
          className: "selector-class",
          begin: "\\.[A-Za-z0-9_-]+",
          relevance: 0
        },
        a.ATTRIBUTE_SELECTOR_MODE,
        {
          className: "selector-tag",
          begin: "\\b(" + i.join("|") + ")\\b",
          // was there, before, but why?
          relevance: 0
        },
        {
          className: "selector-pseudo",
          begin: ":(" + b.join("|") + ")"
        },
        {
          className: "selector-pseudo",
          begin: ":(:)?(" + u.join("|") + ")"
        },
        m,
        {
          // pseudo-selector params
          begin: /\(/,
          end: /\)/,
          contains: [a.CSS_NUMBER_MODE]
        },
        a.CSS_VARIABLE,
        {
          className: "attribute",
          begin: "\\b(" + s.join("|") + ")\\b"
        },
        { begin: "\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b" },
        {
          begin: /:/,
          end: /[;}{]/,
          relevance: 0,
          contains: [
            a.BLOCK_COMMENT,
            m,
            a.HEXCOLOR,
            a.CSS_NUMBER_MODE,
            o.QUOTE_STRING_MODE,
            o.APOS_STRING_MODE,
            a.IMPORTANT,
            a.FUNCTION_DISPATCH
          ]
        },
        // matching these here allows us to treat them more like regular CSS
        // rules so everything between the {} gets regular rule highlighting,
        // which is what we want for page and font-face
        {
          begin: "@(page|font-face)",
          keywords: {
            $pattern: p,
            keyword: "@page @font-face"
          }
        },
        {
          begin: "@",
          end: "[{;]",
          returnBegin: !0,
          keywords: {
            $pattern: /[a-z-]+/,
            keyword: _,
            attribute: d.join(" ")
          },
          contains: [
            {
              begin: p,
              className: "keyword"
            },
            {
              begin: /[a-z-]+(?=:)/,
              className: "attribute"
            },
            m,
            o.QUOTE_STRING_MODE,
            o.APOS_STRING_MODE,
            a.HEXCOLOR,
            a.CSS_NUMBER_MODE
          ]
        },
        a.FUNCTION_DISPATCH
      ]
    };
  }
  return gn = c, gn;
}
var bn, ot;
function li() {
  if (ot) return bn;
  ot = 1;
  function n(e) {
    return {
      name: "Shell Session",
      aliases: [
        "console",
        "shellsession"
      ],
      contains: [
        {
          className: "meta.prompt",
          // We cannot add \s (spaces) in the regular expression otherwise it will be too broad and produce unexpected result.
          // For instance, in the following example, it would match "echo /path/to/home >" as a prompt:
          // echo /path/to/home > t.exe
          begin: /^\s{0,3}[/~\w\d[\]()@-]*[>%$#][ ]?/,
          starts: {
            end: /[^\\](?=\s*$)/,
            subLanguage: "bash"
          }
        }
      ]
    };
  }
  return bn = n, bn;
}
var pn, ct;
function di() {
  if (ct) return pn;
  ct = 1;
  function n(e) {
    const t = e.regex, i = e.COMMENT("--", "$"), d = {
      scope: "string",
      variants: [
        {
          begin: /'/,
          end: /'/,
          contains: [{ match: /''/ }]
        }
      ]
    }, l = {
      begin: /"/,
      end: /"/,
      contains: [{ match: /""/ }]
    }, r = [
      "true",
      "false",
      // Not sure it's correct to call NULL literal, and clauses like IS [NOT] NULL look strange that way.
      // "null",
      "unknown"
    ], s = [
      "double precision",
      "large object",
      "with timezone",
      "without timezone"
    ], c = [
      "bigint",
      "binary",
      "blob",
      "boolean",
      "char",
      "character",
      "clob",
      "date",
      "dec",
      "decfloat",
      "decimal",
      "float",
      "int",
      "integer",
      "interval",
      "nchar",
      "nclob",
      "national",
      "numeric",
      "real",
      "row",
      "smallint",
      "time",
      "timestamp",
      "varchar",
      "varying",
      // modifier (character varying)
      "varbinary"
    ], o = [
      "add",
      "asc",
      "collation",
      "desc",
      "final",
      "first",
      "last",
      "view"
    ], a = [
      "abs",
      "acos",
      "all",
      "allocate",
      "alter",
      "and",
      "any",
      "are",
      "array",
      "array_agg",
      "array_max_cardinality",
      "as",
      "asensitive",
      "asin",
      "asymmetric",
      "at",
      "atan",
      "atomic",
      "authorization",
      "avg",
      "begin",
      "begin_frame",
      "begin_partition",
      "between",
      "bigint",
      "binary",
      "blob",
      "boolean",
      "both",
      "by",
      "call",
      "called",
      "cardinality",
      "cascaded",
      "case",
      "cast",
      "ceil",
      "ceiling",
      "char",
      "char_length",
      "character",
      "character_length",
      "check",
      "classifier",
      "clob",
      "close",
      "coalesce",
      "collate",
      "collect",
      "column",
      "commit",
      "condition",
      "connect",
      "constraint",
      "contains",
      "convert",
      "copy",
      "corr",
      "corresponding",
      "cos",
      "cosh",
      "count",
      "covar_pop",
      "covar_samp",
      "create",
      "cross",
      "cube",
      "cume_dist",
      "current",
      "current_catalog",
      "current_date",
      "current_default_transform_group",
      "current_path",
      "current_role",
      "current_row",
      "current_schema",
      "current_time",
      "current_timestamp",
      "current_path",
      "current_role",
      "current_transform_group_for_type",
      "current_user",
      "cursor",
      "cycle",
      "date",
      "day",
      "deallocate",
      "dec",
      "decimal",
      "decfloat",
      "declare",
      "default",
      "define",
      "delete",
      "dense_rank",
      "deref",
      "describe",
      "deterministic",
      "disconnect",
      "distinct",
      "double",
      "drop",
      "dynamic",
      "each",
      "element",
      "else",
      "empty",
      "end",
      "end_frame",
      "end_partition",
      "end-exec",
      "equals",
      "escape",
      "every",
      "except",
      "exec",
      "execute",
      "exists",
      "exp",
      "external",
      "extract",
      "false",
      "fetch",
      "filter",
      "first_value",
      "float",
      "floor",
      "for",
      "foreign",
      "frame_row",
      "free",
      "from",
      "full",
      "function",
      "fusion",
      "get",
      "global",
      "grant",
      "group",
      "grouping",
      "groups",
      "having",
      "hold",
      "hour",
      "identity",
      "in",
      "indicator",
      "initial",
      "inner",
      "inout",
      "insensitive",
      "insert",
      "int",
      "integer",
      "intersect",
      "intersection",
      "interval",
      "into",
      "is",
      "join",
      "json_array",
      "json_arrayagg",
      "json_exists",
      "json_object",
      "json_objectagg",
      "json_query",
      "json_table",
      "json_table_primitive",
      "json_value",
      "lag",
      "language",
      "large",
      "last_value",
      "lateral",
      "lead",
      "leading",
      "left",
      "like",
      "like_regex",
      "listagg",
      "ln",
      "local",
      "localtime",
      "localtimestamp",
      "log",
      "log10",
      "lower",
      "match",
      "match_number",
      "match_recognize",
      "matches",
      "max",
      "member",
      "merge",
      "method",
      "min",
      "minute",
      "mod",
      "modifies",
      "module",
      "month",
      "multiset",
      "national",
      "natural",
      "nchar",
      "nclob",
      "new",
      "no",
      "none",
      "normalize",
      "not",
      "nth_value",
      "ntile",
      "null",
      "nullif",
      "numeric",
      "octet_length",
      "occurrences_regex",
      "of",
      "offset",
      "old",
      "omit",
      "on",
      "one",
      "only",
      "open",
      "or",
      "order",
      "out",
      "outer",
      "over",
      "overlaps",
      "overlay",
      "parameter",
      "partition",
      "pattern",
      "per",
      "percent",
      "percent_rank",
      "percentile_cont",
      "percentile_disc",
      "period",
      "portion",
      "position",
      "position_regex",
      "power",
      "precedes",
      "precision",
      "prepare",
      "primary",
      "procedure",
      "ptf",
      "range",
      "rank",
      "reads",
      "real",
      "recursive",
      "ref",
      "references",
      "referencing",
      "regr_avgx",
      "regr_avgy",
      "regr_count",
      "regr_intercept",
      "regr_r2",
      "regr_slope",
      "regr_sxx",
      "regr_sxy",
      "regr_syy",
      "release",
      "result",
      "return",
      "returns",
      "revoke",
      "right",
      "rollback",
      "rollup",
      "row",
      "row_number",
      "rows",
      "running",
      "savepoint",
      "scope",
      "scroll",
      "search",
      "second",
      "seek",
      "select",
      "sensitive",
      "session_user",
      "set",
      "show",
      "similar",
      "sin",
      "sinh",
      "skip",
      "smallint",
      "some",
      "specific",
      "specifictype",
      "sql",
      "sqlexception",
      "sqlstate",
      "sqlwarning",
      "sqrt",
      "start",
      "static",
      "stddev_pop",
      "stddev_samp",
      "submultiset",
      "subset",
      "substring",
      "substring_regex",
      "succeeds",
      "sum",
      "symmetric",
      "system",
      "system_time",
      "system_user",
      "table",
      "tablesample",
      "tan",
      "tanh",
      "then",
      "time",
      "timestamp",
      "timezone_hour",
      "timezone_minute",
      "to",
      "trailing",
      "translate",
      "translate_regex",
      "translation",
      "treat",
      "trigger",
      "trim",
      "trim_array",
      "true",
      "truncate",
      "uescape",
      "union",
      "unique",
      "unknown",
      "unnest",
      "update",
      "upper",
      "user",
      "using",
      "value",
      "values",
      "value_of",
      "var_pop",
      "var_samp",
      "varbinary",
      "varchar",
      "varying",
      "versioning",
      "when",
      "whenever",
      "where",
      "width_bucket",
      "window",
      "with",
      "within",
      "without",
      "year"
    ], u = [
      "abs",
      "acos",
      "array_agg",
      "asin",
      "atan",
      "avg",
      "cast",
      "ceil",
      "ceiling",
      "coalesce",
      "corr",
      "cos",
      "cosh",
      "count",
      "covar_pop",
      "covar_samp",
      "cume_dist",
      "dense_rank",
      "deref",
      "element",
      "exp",
      "extract",
      "first_value",
      "floor",
      "json_array",
      "json_arrayagg",
      "json_exists",
      "json_object",
      "json_objectagg",
      "json_query",
      "json_table",
      "json_table_primitive",
      "json_value",
      "lag",
      "last_value",
      "lead",
      "listagg",
      "ln",
      "log",
      "log10",
      "lower",
      "max",
      "min",
      "mod",
      "nth_value",
      "ntile",
      "nullif",
      "percent_rank",
      "percentile_cont",
      "percentile_disc",
      "position",
      "position_regex",
      "power",
      "rank",
      "regr_avgx",
      "regr_avgy",
      "regr_count",
      "regr_intercept",
      "regr_r2",
      "regr_slope",
      "regr_sxx",
      "regr_sxy",
      "regr_syy",
      "row_number",
      "sin",
      "sinh",
      "sqrt",
      "stddev_pop",
      "stddev_samp",
      "substring",
      "substring_regex",
      "sum",
      "tan",
      "tanh",
      "translate",
      "translate_regex",
      "treat",
      "trim",
      "trim_array",
      "unnest",
      "upper",
      "value_of",
      "var_pop",
      "var_samp",
      "width_bucket"
    ], b = [
      "current_catalog",
      "current_date",
      "current_default_transform_group",
      "current_path",
      "current_role",
      "current_schema",
      "current_transform_group_for_type",
      "current_user",
      "session_user",
      "system_time",
      "system_user",
      "current_time",
      "localtime",
      "current_timestamp",
      "localtimestamp"
    ], p = [
      "create table",
      "insert into",
      "primary key",
      "foreign key",
      "not null",
      "alter table",
      "add constraint",
      "grouping sets",
      "on overflow",
      "character set",
      "respect nulls",
      "ignore nulls",
      "nulls first",
      "nulls last",
      "depth first",
      "breadth first"
    ], _ = u, h = [
      ...a,
      ...o
    ].filter((C) => !u.includes(C)), m = {
      scope: "variable",
      match: /@[a-z0-9][a-z0-9_]*/
    }, v = {
      scope: "operator",
      match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
      relevance: 0
    }, T = {
      match: t.concat(/\b/, t.either(..._), /\s*\(/),
      relevance: 0,
      keywords: { built_in: _ }
    };
    function w(C) {
      return t.concat(
        /\b/,
        t.either(...C.map((L) => L.replace(/\s+/, "\\s+"))),
        /\b/
      );
    }
    const B = {
      scope: "keyword",
      match: w(p),
      relevance: 0
    };
    function R(C, {
      exceptions: L,
      when: S
    } = {}) {
      const I = S;
      return L = L || [], C.map((K) => K.match(/\|\d+$/) || L.includes(K) ? K : I(K) ? `${K}|0` : K);
    }
    return {
      name: "SQL",
      case_insensitive: !0,
      // does not include {} or HTML tags `</`
      illegal: /[{}]|<\//,
      keywords: {
        $pattern: /\b[\w\.]+/,
        keyword: R(h, { when: (C) => C.length < 3 }),
        literal: r,
        type: c,
        built_in: b
      },
      contains: [
        {
          scope: "type",
          match: w(s)
        },
        B,
        T,
        m,
        d,
        l,
        e.C_NUMBER_MODE,
        e.C_BLOCK_COMMENT_MODE,
        i,
        v
      ]
    };
  }
  return pn = n, pn;
}
var mn, lt;
function ui() {
  if (lt) return mn;
  lt = 1;
  function n(S) {
    return S ? typeof S == "string" ? S : S.source : null;
  }
  function e(S) {
    return t("(?=", S, ")");
  }
  function t(...S) {
    return S.map((K) => n(K)).join("");
  }
  function i(S) {
    const I = S[S.length - 1];
    return typeof I == "object" && I.constructor === Object ? (S.splice(S.length - 1, 1), I) : {};
  }
  function d(...S) {
    return "(" + (i(S).capture ? "" : "?:") + S.map((N) => n(N)).join("|") + ")";
  }
  const l = (S) => t(
    /\b/,
    S,
    /\w$/.test(S) ? /\b/ : /\B/
  ), r = [
    "Protocol",
    // contextual
    "Type"
    // contextual
  ].map(l), s = [
    "init",
    "self"
  ].map(l), c = [
    "Any",
    "Self"
  ], o = [
    // strings below will be fed into the regular `keywords` engine while regex
    // will result in additional modes being created to scan for those keywords to
    // avoid conflicts with other rules
    "actor",
    "any",
    // contextual
    "associatedtype",
    "async",
    "await",
    /as\?/,
    // operator
    /as!/,
    // operator
    "as",
    // operator
    "borrowing",
    // contextual
    "break",
    "case",
    "catch",
    "class",
    "consume",
    // contextual
    "consuming",
    // contextual
    "continue",
    "convenience",
    // contextual
    "copy",
    // contextual
    "default",
    "defer",
    "deinit",
    "didSet",
    // contextual
    "distributed",
    "do",
    "dynamic",
    // contextual
    "each",
    "else",
    "enum",
    "extension",
    "fallthrough",
    /fileprivate\(set\)/,
    "fileprivate",
    "final",
    // contextual
    "for",
    "func",
    "get",
    // contextual
    "guard",
    "if",
    "import",
    "indirect",
    // contextual
    "infix",
    // contextual
    /init\?/,
    /init!/,
    "inout",
    /internal\(set\)/,
    "internal",
    "in",
    "is",
    // operator
    "isolated",
    // contextual
    "nonisolated",
    // contextual
    "lazy",
    // contextual
    "let",
    "macro",
    "mutating",
    // contextual
    "nonmutating",
    // contextual
    /open\(set\)/,
    // contextual
    "open",
    // contextual
    "operator",
    "optional",
    // contextual
    "override",
    // contextual
    "package",
    "postfix",
    // contextual
    "precedencegroup",
    "prefix",
    // contextual
    /private\(set\)/,
    "private",
    "protocol",
    /public\(set\)/,
    "public",
    "repeat",
    "required",
    // contextual
    "rethrows",
    "return",
    "set",
    // contextual
    "some",
    // contextual
    "static",
    "struct",
    "subscript",
    "super",
    "switch",
    "throws",
    "throw",
    /try\?/,
    // operator
    /try!/,
    // operator
    "try",
    // operator
    "typealias",
    /unowned\(safe\)/,
    // contextual
    /unowned\(unsafe\)/,
    // contextual
    "unowned",
    // contextual
    "var",
    "weak",
    // contextual
    "where",
    "while",
    "willSet"
    // contextual
  ], a = [
    "false",
    "nil",
    "true"
  ], u = [
    "assignment",
    "associativity",
    "higherThan",
    "left",
    "lowerThan",
    "none",
    "right"
  ], b = [
    "#colorLiteral",
    "#column",
    "#dsohandle",
    "#else",
    "#elseif",
    "#endif",
    "#error",
    "#file",
    "#fileID",
    "#fileLiteral",
    "#filePath",
    "#function",
    "#if",
    "#imageLiteral",
    "#keyPath",
    "#line",
    "#selector",
    "#sourceLocation",
    "#warning"
  ], p = [
    "abs",
    "all",
    "any",
    "assert",
    "assertionFailure",
    "debugPrint",
    "dump",
    "fatalError",
    "getVaList",
    "isKnownUniquelyReferenced",
    "max",
    "min",
    "numericCast",
    "pointwiseMax",
    "pointwiseMin",
    "precondition",
    "preconditionFailure",
    "print",
    "readLine",
    "repeatElement",
    "sequence",
    "stride",
    "swap",
    "swift_unboxFromSwiftValueWithType",
    "transcode",
    "type",
    "unsafeBitCast",
    "unsafeDowncast",
    "withExtendedLifetime",
    "withUnsafeMutablePointer",
    "withUnsafePointer",
    "withVaList",
    "withoutActuallyEscaping",
    "zip"
  ], _ = d(
    /[/=\-+!*%<>&|^~?]/,
    /[\u00A1-\u00A7]/,
    /[\u00A9\u00AB]/,
    /[\u00AC\u00AE]/,
    /[\u00B0\u00B1]/,
    /[\u00B6\u00BB\u00BF\u00D7\u00F7]/,
    /[\u2016-\u2017]/,
    /[\u2020-\u2027]/,
    /[\u2030-\u203E]/,
    /[\u2041-\u2053]/,
    /[\u2055-\u205E]/,
    /[\u2190-\u23FF]/,
    /[\u2500-\u2775]/,
    /[\u2794-\u2BFF]/,
    /[\u2E00-\u2E7F]/,
    /[\u3001-\u3003]/,
    /[\u3008-\u3020]/,
    /[\u3030]/
  ), h = d(
    _,
    /[\u0300-\u036F]/,
    /[\u1DC0-\u1DFF]/,
    /[\u20D0-\u20FF]/,
    /[\uFE00-\uFE0F]/,
    /[\uFE20-\uFE2F]/
    // TODO: The following characters are also allowed, but the regex isn't supported yet.
    // /[\u{E0100}-\u{E01EF}]/u
  ), m = t(_, h, "*"), v = d(
    /[a-zA-Z_]/,
    /[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,
    /[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,
    /[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,
    /[\u1E00-\u1FFF]/,
    /[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,
    /[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,
    /[\u2C00-\u2DFF\u2E80-\u2FFF]/,
    /[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,
    /[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,
    /[\uFE47-\uFEFE\uFF00-\uFFFD]/
    // Should be /[\uFE47-\uFFFD]/, but we have to exclude FEFF.
    // The following characters are also allowed, but the regexes aren't supported yet.
    // /[\u{10000}-\u{1FFFD}\u{20000-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}]/u,
    // /[\u{50000}-\u{5FFFD}\u{60000-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}]/u,
    // /[\u{90000}-\u{9FFFD}\u{A0000-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}]/u,
    // /[\u{D0000}-\u{DFFFD}\u{E0000-\u{EFFFD}]/u
  ), T = d(
    v,
    /\d/,
    /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/
  ), w = t(v, T, "*"), B = t(/[A-Z]/, T, "*"), R = [
    "attached",
    "autoclosure",
    t(/convention\(/, d("swift", "block", "c"), /\)/),
    "discardableResult",
    "dynamicCallable",
    "dynamicMemberLookup",
    "escaping",
    "freestanding",
    "frozen",
    "GKInspectable",
    "IBAction",
    "IBDesignable",
    "IBInspectable",
    "IBOutlet",
    "IBSegueAction",
    "inlinable",
    "main",
    "nonobjc",
    "NSApplicationMain",
    "NSCopying",
    "NSManaged",
    t(/objc\(/, w, /\)/),
    "objc",
    "objcMembers",
    "propertyWrapper",
    "requires_stored_property_inits",
    "resultBuilder",
    "Sendable",
    "testable",
    "UIApplicationMain",
    "unchecked",
    "unknown",
    "usableFromInline",
    "warn_unqualified_access"
  ], C = [
    "iOS",
    "iOSApplicationExtension",
    "macOS",
    "macOSApplicationExtension",
    "macCatalyst",
    "macCatalystApplicationExtension",
    "watchOS",
    "watchOSApplicationExtension",
    "tvOS",
    "tvOSApplicationExtension",
    "swift"
  ];
  function L(S) {
    const I = {
      match: /\s+/,
      relevance: 0
    }, K = S.COMMENT(
      "/\\*",
      "\\*/",
      { contains: ["self"] }
    ), N = [
      S.C_LINE_COMMENT_MODE,
      K
    ], k = {
      match: [
        /\./,
        d(...r, ...s)
      ],
      className: { 2: "keyword" }
    }, D = {
      // Consume .keyword to prevent highlighting properties and methods as keywords.
      match: t(/\./, d(...o)),
      relevance: 0
    }, F = o.filter((G) => typeof G == "string").concat(["_|0"]), z = o.filter((G) => typeof G != "string").concat(c).map(l), g = { variants: [
      {
        className: "keyword",
        match: d(...z, ...s)
      }
    ] }, E = {
      $pattern: d(
        /\b\w+/,
        // regular keywords
        /#\w+/
        // number keywords
      ),
      keyword: F.concat(b),
      literal: a
    }, O = [
      k,
      D,
      g
    ], U = {
      // Consume .built_in to prevent highlighting properties and methods.
      match: t(/\./, d(...p)),
      relevance: 0
    }, q = {
      className: "built_in",
      match: t(/\b/, d(...p), /(?=\()/)
    }, X = [
      U,
      q
    ], j = {
      // Prevent -> from being highlighting as an operator.
      match: /->/,
      relevance: 0
    }, de = {
      className: "operator",
      relevance: 0,
      variants: [
        { match: m },
        {
          // dot-operator: only operators that start with a dot are allowed to use dots as
          // characters (..., ...<, .*, etc). So there rule here is: a dot followed by one or more
          // characters that may also include dots.
          match: `\\.(\\.|${h})+`
        }
      ]
    }, W = [
      j,
      de
    ], Z = "([0-9]_*)+", ue = "([0-9a-fA-F]_*)+", Y = {
      className: "number",
      relevance: 0,
      variants: [
        // decimal floating-point-literal (subsumes decimal-literal)
        { match: `\\b(${Z})(\\.(${Z}))?([eE][+-]?(${Z}))?\\b` },
        // hexadecimal floating-point-literal (subsumes hexadecimal-literal)
        { match: `\\b0x(${ue})(\\.(${ue}))?([pP][+-]?(${Z}))?\\b` },
        // octal-literal
        { match: /\b0o([0-7]_*)+\b/ },
        // binary-literal
        { match: /\b0b([01]_*)+\b/ }
      ]
    }, H = (G = "") => ({
      className: "subst",
      variants: [
        { match: t(/\\/, G, /[0\\tnr"']/) },
        { match: t(/\\/, G, /u\{[0-9a-fA-F]{1,8}\}/) }
      ]
    }), J = (G = "") => ({
      className: "subst",
      match: t(/\\/, G, /[\t ]*(?:[\r\n]|\r\n)/)
    }), ee = (G = "") => ({
      className: "subst",
      label: "interpol",
      begin: t(/\\/, G, /\(/),
      end: /\)/
    }), ne = (G = "") => ({
      begin: t(G, /"""/),
      end: t(/"""/, G),
      contains: [
        H(G),
        J(G),
        ee(G)
      ]
    }), ae = (G = "") => ({
      begin: t(G, /"/),
      end: t(/"/, G),
      contains: [
        H(G),
        ee(G)
      ]
    }), te = {
      className: "string",
      variants: [
        ne(),
        ne("#"),
        ne("##"),
        ne("###"),
        ae(),
        ae("#"),
        ae("##"),
        ae("###")
      ]
    }, Te = [
      S.BACKSLASH_ESCAPE,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [S.BACKSLASH_ESCAPE]
      }
    ], ie = {
      begin: /\/[^\s](?=[^/\n]*\/)/,
      end: /\//,
      contains: Te
    }, we = (G) => {
      const xe = t(G, /\//), Oe = t(/\//, G);
      return {
        begin: xe,
        end: Oe,
        contains: [
          ...Te,
          {
            scope: "comment",
            begin: `#(?!.*${Oe})`,
            end: /$/
          }
        ]
      };
    }, Ee = {
      scope: "regexp",
      variants: [
        we("###"),
        we("##"),
        we("#"),
        ie
      ]
    }, A = { match: t(/`/, w, /`/) }, ke = {
      className: "variable",
      match: /\$\d+/
    }, Q = {
      className: "variable",
      match: `\\$${T}+`
    }, $ = [
      A,
      ke,
      Q
    ], he = {
      match: /(@|#(un)?)available/,
      scope: "keyword",
      starts: { contains: [
        {
          begin: /\(/,
          end: /\)/,
          keywords: C,
          contains: [
            ...W,
            Y,
            te
          ]
        }
      ] }
    }, ge = {
      scope: "keyword",
      match: t(/@/, d(...R), e(d(/\(/, /\s+/)))
    }, Se = {
      scope: "meta",
      match: t(/@/, w)
    }, be = [
      he,
      ge,
      Se
    ], f = {
      match: e(/\b[A-Z]/),
      relevance: 0,
      contains: [
        {
          // Common Apple frameworks, for relevance boost
          className: "type",
          match: t(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/, T, "+")
        },
        {
          // Type identifier
          className: "type",
          match: B,
          relevance: 0
        },
        {
          // Optional type
          match: /[?!]+/,
          relevance: 0
        },
        {
          // Variadic parameter
          match: /\.\.\./,
          relevance: 0
        },
        {
          // Protocol composition
          match: t(/\s+&\s+/, e(B)),
          relevance: 0
        }
      ]
    }, y = {
      begin: /</,
      end: />/,
      keywords: E,
      contains: [
        ...N,
        ...O,
        ...be,
        j,
        f
      ]
    };
    f.contains.push(y);
    const M = {
      match: t(w, /\s*:/),
      keywords: "_|0",
      relevance: 0
    }, P = {
      begin: /\(/,
      end: /\)/,
      relevance: 0,
      keywords: E,
      contains: [
        "self",
        M,
        ...N,
        Ee,
        ...O,
        ...X,
        ...W,
        Y,
        te,
        ...$,
        ...be,
        f
      ]
    }, V = {
      begin: /</,
      end: />/,
      keywords: "repeat each",
      contains: [
        ...N,
        f
      ]
    }, le = {
      begin: d(
        e(t(w, /\s*:/)),
        e(t(w, /\s+/, w, /\s*:/))
      ),
      end: /:/,
      relevance: 0,
      contains: [
        {
          className: "keyword",
          match: /\b_\b/
        },
        {
          className: "params",
          match: w
        }
      ]
    }, Me = {
      begin: /\(/,
      end: /\)/,
      keywords: E,
      contains: [
        le,
        ...N,
        ...O,
        ...W,
        Y,
        te,
        ...be,
        f,
        P
      ],
      endsParent: !0,
      illegal: /["']/
    }, De = {
      match: [
        /(func|macro)/,
        /\s+/,
        d(A.match, w, m)
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        V,
        Me,
        I
      ],
      illegal: [
        /\[/,
        /%/
      ]
    }, At = {
      match: [
        /\b(?:subscript|init[?!]?)/,
        /\s*(?=[<(])/
      ],
      className: { 1: "keyword" },
      contains: [
        V,
        Me,
        I
      ],
      illegal: /\[|%/
    }, Rt = {
      match: [
        /operator/,
        /\s+/,
        m
      ],
      className: {
        1: "keyword",
        3: "title"
      }
    }, kt = {
      begin: [
        /precedencegroup/,
        /\s+/,
        B
      ],
      className: {
        1: "keyword",
        3: "title"
      },
      contains: [f],
      keywords: [
        ...u,
        ...a
      ],
      end: /}/
    }, Mt = {
      match: [
        /class\b/,
        /\s+/,
        /func\b/,
        /\s+/,
        /\b[A-Za-z_][A-Za-z0-9_]*\b/
      ],
      scope: {
        1: "keyword",
        3: "keyword",
        5: "title.function"
      }
    }, xt = {
      match: [
        /class\b/,
        /\s+/,
        /var\b/
      ],
      scope: {
        1: "keyword",
        3: "keyword"
      }
    }, Ct = {
      begin: [
        /(struct|protocol|class|extension|enum|actor)/,
        /\s+/,
        w,
        /\s*/
      ],
      beginScope: {
        1: "keyword",
        3: "title.class"
      },
      keywords: E,
      contains: [
        V,
        ...O,
        {
          begin: /:/,
          end: /\{/,
          keywords: E,
          contains: [
            {
              scope: "title.class.inherited",
              match: B
            },
            ...O
          ],
          relevance: 0
        }
      ]
    };
    for (const G of te.variants) {
      const xe = G.contains.find((It) => It.label === "interpol");
      xe.keywords = E;
      const Oe = [
        ...O,
        ...X,
        ...W,
        Y,
        te,
        ...$
      ];
      xe.contains = [
        ...Oe,
        {
          begin: /\(/,
          end: /\)/,
          contains: [
            "self",
            ...Oe
          ]
        }
      ];
    }
    return {
      name: "Swift",
      keywords: E,
      contains: [
        ...N,
        De,
        At,
        Mt,
        xt,
        Ct,
        Rt,
        kt,
        {
          beginKeywords: "import",
          end: /$/,
          contains: [...N],
          relevance: 0
        },
        Ee,
        ...O,
        ...X,
        ...W,
        Y,
        te,
        ...$,
        ...be,
        f,
        P
      ]
    };
  }
  return mn = L, mn;
}
var fn, dt;
function gi() {
  if (dt) return fn;
  dt = 1;
  function n(e) {
    const t = "true false yes no null", i = "[\\w#;/?:@&=+$,.~*'()[\\]]+", d = {
      className: "attr",
      variants: [
        // added brackets support and special char support
        { begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ },
        {
          // double quoted keys - with brackets and special char support
          begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/
        },
        {
          // single quoted keys - with brackets and special char support
          begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/
        }
      ]
    }, l = {
      className: "template-variable",
      variants: [
        {
          // jinja templates Ansible
          begin: /\{\{/,
          end: /\}\}/
        },
        {
          // Ruby i18n
          begin: /%\{/,
          end: /\}/
        }
      ]
    }, r = {
      className: "string",
      relevance: 0,
      begin: /'/,
      end: /'/,
      contains: [
        {
          match: /''/,
          scope: "char.escape",
          relevance: 0
        }
      ]
    }, s = {
      className: "string",
      relevance: 0,
      variants: [
        {
          begin: /"/,
          end: /"/
        },
        { begin: /\S+/ }
      ],
      contains: [
        e.BACKSLASH_ESCAPE,
        l
      ]
    }, c = e.inherit(s, { variants: [
      {
        begin: /'/,
        end: /'/,
        contains: [
          {
            begin: /''/,
            relevance: 0
          }
        ]
      },
      {
        begin: /"/,
        end: /"/
      },
      { begin: /[^\s,{}[\]]+/ }
    ] }), p = {
      className: "number",
      begin: "\\b" + "[0-9]{4}(-[0-9][0-9]){0,2}" + "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?" + "(\\.[0-9]*)?" + "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?" + "\\b"
    }, _ = {
      end: ",",
      endsWithParent: !0,
      excludeEnd: !0,
      keywords: t,
      relevance: 0
    }, h = {
      begin: /\{/,
      end: /\}/,
      contains: [_],
      illegal: "\\n",
      relevance: 0
    }, m = {
      begin: "\\[",
      end: "\\]",
      contains: [_],
      illegal: "\\n",
      relevance: 0
    }, v = [
      d,
      {
        className: "meta",
        begin: "^---\\s*$",
        relevance: 10
      },
      {
        // multi line string
        // Blocks start with a | or > followed by a newline
        //
        // Indentation of subsequent lines must be the same to
        // be considered part of the block
        className: "string",
        begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
      },
      {
        // Ruby/Rails erb
        begin: "<%[%=-]?",
        end: "[%-]?%>",
        subLanguage: "ruby",
        excludeBegin: !0,
        excludeEnd: !0,
        relevance: 0
      },
      {
        // named tags
        className: "type",
        begin: "!\\w+!" + i
      },
      // https://yaml.org/spec/1.2/spec.html#id2784064
      {
        // verbatim tags
        className: "type",
        begin: "!<" + i + ">"
      },
      {
        // primary tags
        className: "type",
        begin: "!" + i
      },
      {
        // secondary tags
        className: "type",
        begin: "!!" + i
      },
      {
        // fragment id &ref
        className: "meta",
        begin: "&" + e.UNDERSCORE_IDENT_RE + "$"
      },
      {
        // fragment reference *ref
        className: "meta",
        begin: "\\*" + e.UNDERSCORE_IDENT_RE + "$"
      },
      {
        // array listing
        className: "bullet",
        // TODO: remove |$ hack when we have proper look-ahead support
        begin: "-(?=[ ]|$)",
        relevance: 0
      },
      e.HASH_COMMENT_MODE,
      {
        beginKeywords: t,
        keywords: { literal: t }
      },
      p,
      // numbers are any valid C-style number that
      // sit isolated from other words
      {
        className: "number",
        begin: e.C_NUMBER_RE + "\\b",
        relevance: 0
      },
      h,
      m,
      r,
      s
    ], T = [...v];
    return T.pop(), T.push(c), _.contains = T, {
      name: "YAML",
      case_insensitive: !0,
      aliases: ["yml"],
      contains: v
    };
  }
  return fn = n, fn;
}
var _n, ut;
function bi() {
  if (ut) return _n;
  ut = 1;
  const n = "[A-Za-z$_][0-9A-Za-z$_]*", e = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ], t = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ], i = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ], d = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ], l = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ], r = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "global"
    // Node.js
  ], s = [].concat(
    l,
    i,
    d
  );
  function c(a) {
    const u = a.regex, b = (H, { after: J }) => {
      const ee = "</" + H[0].slice(1);
      return H.input.indexOf(ee, J) !== -1;
    }, p = n, _ = {
      begin: "<>",
      end: "</>"
    }, h = /<[A-Za-z0-9\\._:-]+\s*\/>/, m = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (H, J) => {
        const ee = H[0].length + H.index, ne = H.input[ee];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          ne === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          ne === ","
        ) {
          J.ignoreMatch();
          return;
        }
        ne === ">" && (b(H, { after: ee }) || J.ignoreMatch());
        let ae;
        const te = H.input.substring(ee);
        if (ae = te.match(/^\s*=/)) {
          J.ignoreMatch();
          return;
        }
        if ((ae = te.match(/^\s+extends\s+/)) && ae.index === 0) {
          J.ignoreMatch();
          return;
        }
      }
    }, v = {
      $pattern: n,
      keyword: e,
      literal: t,
      built_in: s,
      "variable.language": r
    }, T = "[0-9](_?[0-9])*", w = `\\.(${T})`, B = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", R = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${B})((${w})|\\.)?|(${w}))[eE][+-]?(${T})\\b` },
        { begin: `\\b(${B})\\b((${w})\\b|\\.)?|(${w})\\b` },
        // DecimalBigIntegerLiteral
        { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    }, C = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: v,
      contains: []
      // defined later
    }, L = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: !1,
        contains: [
          a.BACKSLASH_ESCAPE,
          C
        ],
        subLanguage: "xml"
      }
    }, S = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: !1,
        contains: [
          a.BACKSLASH_ESCAPE,
          C
        ],
        subLanguage: "css"
      }
    }, I = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: !1,
        contains: [
          a.BACKSLASH_ESCAPE,
          C
        ],
        subLanguage: "graphql"
      }
    }, K = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        a.BACKSLASH_ESCAPE,
        C
      ]
    }, k = {
      className: "comment",
      variants: [
        a.COMMENT(
          /\/\*\*(?!\/)/,
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                begin: "(?=@[A-Za-z]+)",
                relevance: 0,
                contains: [
                  {
                    className: "doctag",
                    begin: "@[A-Za-z]+"
                  },
                  {
                    className: "type",
                    begin: "\\{",
                    end: "\\}",
                    excludeEnd: !0,
                    excludeBegin: !0,
                    relevance: 0
                  },
                  {
                    className: "variable",
                    begin: p + "(?=\\s*(-)|$)",
                    endsParent: !0,
                    relevance: 0
                  },
                  // eat spaces (not newlines) so we can find
                  // types or variables
                  {
                    begin: /(?=[^\n])\s/,
                    relevance: 0
                  }
                ]
              }
            ]
          }
        ),
        a.C_BLOCK_COMMENT_MODE,
        a.C_LINE_COMMENT_MODE
      ]
    }, D = [
      a.APOS_STRING_MODE,
      a.QUOTE_STRING_MODE,
      L,
      S,
      I,
      K,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      R
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    C.contains = D.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: v,
      contains: [
        "self"
      ].concat(D)
    });
    const F = [].concat(k, C.contains), z = F.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: v,
        contains: ["self"].concat(F)
      }
    ]), g = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: !0,
      excludeEnd: !0,
      keywords: v,
      contains: z
    }, E = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            p,
            /\s+/,
            /extends/,
            /\s+/,
            u.concat(p, "(", u.concat(/\./, p), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            p
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    }, O = {
      relevance: 0,
      match: u.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...i,
          ...d
        ]
      }
    }, U = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    }, q = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            p,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [g],
      illegal: /%/
    }, X = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function j(H) {
      return u.concat("(?!", H.join("|"), ")");
    }
    const de = {
      match: u.concat(
        /\b/,
        j([
          ...l,
          "super",
          "import"
        ].map((H) => `${H}\\s*\\(`)),
        p,
        u.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    }, W = {
      begin: u.concat(/\./, u.lookahead(
        u.concat(p, /(?![0-9A-Za-z$_(])/)
      )),
      end: p,
      excludeBegin: !0,
      keywords: "prototype",
      className: "property",
      relevance: 0
    }, Z = {
      match: [
        /get|set/,
        /\s+/,
        p,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        g
      ]
    }, ue = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + a.UNDERSCORE_IDENT_RE + ")\\s*=>", Y = {
      match: [
        /const|var|let/,
        /\s+/,
        p,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        u.lookahead(ue)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        g
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: v,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS: z, CLASS_REFERENCE: O },
      illegal: /#(?![$_A-z])/,
      contains: [
        a.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        U,
        a.APOS_STRING_MODE,
        a.QUOTE_STRING_MODE,
        L,
        S,
        I,
        K,
        k,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        R,
        O,
        {
          scope: "attr",
          match: p + u.lookahead(":"),
          relevance: 0
        },
        Y,
        {
          // "value" container
          begin: "(" + a.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            k,
            a.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: ue,
              returnBegin: !0,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: a.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: !0
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: !0,
                      excludeEnd: !0,
                      keywords: v,
                      contains: z
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: _.begin, end: _.end },
                { match: h },
                {
                  begin: m.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": m.isTrulyOpeningTag,
                  end: m.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: m.begin,
                  end: m.end,
                  skip: !0,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        q,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + a.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: !0,
          label: "func.def",
          contains: [
            g,
            a.inherit(a.TITLE_MODE, { begin: p, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        W,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + p,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [g]
        },
        de,
        X,
        E,
        Z,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }
  function o(a) {
    const u = a.regex, b = c(a), p = n, _ = [
      "any",
      "void",
      "number",
      "boolean",
      "string",
      "object",
      "never",
      "symbol",
      "bigint",
      "unknown"
    ], h = {
      begin: [
        /namespace/,
        /\s+/,
        a.IDENT_RE
      ],
      beginScope: {
        1: "keyword",
        3: "title.class"
      }
    }, m = {
      beginKeywords: "interface",
      end: /\{/,
      excludeEnd: !0,
      keywords: {
        keyword: "interface extends",
        built_in: _
      },
      contains: [b.exports.CLASS_REFERENCE]
    }, v = {
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use strict['"]/
    }, T = [
      "type",
      // "namespace",
      "interface",
      "public",
      "private",
      "protected",
      "implements",
      "declare",
      "abstract",
      "readonly",
      "enum",
      "override",
      "satisfies"
    ], w = {
      $pattern: n,
      keyword: e.concat(T),
      literal: t,
      built_in: s.concat(_),
      "variable.language": r
    }, B = {
      className: "meta",
      begin: "@" + p
    }, R = (I, K, N) => {
      const k = I.contains.findIndex((D) => D.label === K);
      if (k === -1)
        throw new Error("can not find mode to replace");
      I.contains.splice(k, 1, N);
    };
    Object.assign(b.keywords, w), b.exports.PARAMS_CONTAINS.push(B);
    const C = b.contains.find((I) => I.scope === "attr"), L = Object.assign(
      {},
      C,
      { match: u.concat(p, u.lookahead(/\s*\?:/)) }
    );
    b.exports.PARAMS_CONTAINS.push([
      b.exports.CLASS_REFERENCE,
      // class reference for highlighting the params types
      C,
      // highlight the params key
      L
      // Added for optional property assignment highlighting
    ]), b.contains = b.contains.concat([
      B,
      h,
      m,
      L
      // Added for optional property assignment highlighting
    ]), R(b, "shebang", a.SHEBANG()), R(b, "use_strict", v);
    const S = b.contains.find((I) => I.label === "func.def");
    return S.relevance = 0, Object.assign(b, {
      name: "TypeScript",
      aliases: [
        "ts",
        "tsx",
        "mts",
        "cts"
      ]
    }), b;
  }
  return _n = o, _n;
}
var En, gt;
function pi() {
  if (gt) return En;
  gt = 1;
  function n(e) {
    const t = e.regex, i = {
      className: "string",
      begin: /"(""|[^/n])"C\b/
    }, d = {
      className: "string",
      begin: /"/,
      end: /"/,
      illegal: /\n/,
      contains: [
        {
          // double quote escape
          begin: /""/
        }
      ]
    }, l = /\d{1,2}\/\d{1,2}\/\d{4}/, r = /\d{4}-\d{1,2}-\d{1,2}/, s = /(\d|1[012])(:\d+){0,2} *(AM|PM)/, c = /\d{1,2}(:\d{1,2}){1,2}/, o = {
      className: "literal",
      variants: [
        {
          // #YYYY-MM-DD# (ISO-Date) or #M/D/YYYY# (US-Date)
          begin: t.concat(/# */, t.either(r, l), / *#/)
        },
        {
          // #H:mm[:ss]# (24h Time)
          begin: t.concat(/# */, c, / *#/)
        },
        {
          // #h[:mm[:ss]] A# (12h Time)
          begin: t.concat(/# */, s, / *#/)
        },
        {
          // date plus time
          begin: t.concat(
            /# */,
            t.either(r, l),
            / +/,
            t.either(s, c),
            / *#/
          )
        }
      ]
    }, a = {
      className: "number",
      relevance: 0,
      variants: [
        {
          // Float
          begin: /\b\d[\d_]*((\.[\d_]+(E[+-]?[\d_]+)?)|(E[+-]?[\d_]+))[RFD@!#]?/
        },
        {
          // Integer (base 10)
          begin: /\b\d[\d_]*((U?[SIL])|[%&])?/
        },
        {
          // Integer (base 16)
          begin: /&H[\dA-F_]+((U?[SIL])|[%&])?/
        },
        {
          // Integer (base 8)
          begin: /&O[0-7_]+((U?[SIL])|[%&])?/
        },
        {
          // Integer (base 2)
          begin: /&B[01_]+((U?[SIL])|[%&])?/
        }
      ]
    }, u = {
      className: "label",
      begin: /^\w+:/
    }, b = e.COMMENT(/'''/, /$/, { contains: [
      {
        className: "doctag",
        begin: /<\/?/,
        end: />/
      }
    ] }), p = e.COMMENT(null, /$/, { variants: [
      { begin: /'/ },
      {
        // TODO: Use multi-class for leading spaces
        begin: /([\t ]|^)REM(?=\s)/
      }
    ] });
    return {
      name: "Visual Basic .NET",
      aliases: ["vb"],
      case_insensitive: !0,
      classNameAliases: { label: "symbol" },
      keywords: {
        keyword: "addhandler alias aggregate ansi as async assembly auto binary by byref byval call case catch class compare const continue custom declare default delegate dim distinct do each equals else elseif end enum erase error event exit explicit finally for friend from function get global goto group handles if implements imports in inherits interface into iterator join key let lib loop me mid module mustinherit mustoverride mybase myclass namespace narrowing new next notinheritable notoverridable of off on operator option optional order overloads overridable overrides paramarray partial preserve private property protected public raiseevent readonly redim removehandler resume return select set shadows shared skip static step stop structure strict sub synclock take text then throw to try unicode until using when where while widening with withevents writeonly yield",
        built_in: (
          // Operators https://docs.microsoft.com/dotnet/visual-basic/language-reference/operators
          "addressof and andalso await directcast gettype getxmlnamespace is isfalse isnot istrue like mod nameof new not or orelse trycast typeof xor cbool cbyte cchar cdate cdbl cdec cint clng cobj csbyte cshort csng cstr cuint culng cushort"
        ),
        type: (
          // Data types https://docs.microsoft.com/dotnet/visual-basic/language-reference/data-types
          "boolean byte char date decimal double integer long object sbyte short single string uinteger ulong ushort"
        ),
        literal: "true false nothing"
      },
      illegal: "//|\\{|\\}|endif|gosub|variant|wend|^\\$ ",
      contains: [
        i,
        d,
        o,
        a,
        u,
        b,
        p,
        {
          className: "meta",
          // TODO: Use multi-class for indentation once available
          begin: /[\t ]*#(const|disable|else|elseif|enable|end|externalsource|if|region)\b/,
          end: /$/,
          keywords: { keyword: "const disable else elseif enable end externalsource if region then" },
          contains: [p]
        }
      ]
    };
  }
  return En = n, En;
}
var hn, bt;
function mi() {
  if (bt) return hn;
  bt = 1;
  function n(e) {
    e.regex;
    const t = e.COMMENT(/\(;/, /;\)/);
    t.contains.push("self");
    const i = e.COMMENT(/;;/, /$/), d = [
      "anyfunc",
      "block",
      "br",
      "br_if",
      "br_table",
      "call",
      "call_indirect",
      "data",
      "drop",
      "elem",
      "else",
      "end",
      "export",
      "func",
      "global.get",
      "global.set",
      "local.get",
      "local.set",
      "local.tee",
      "get_global",
      "get_local",
      "global",
      "if",
      "import",
      "local",
      "loop",
      "memory",
      "memory.grow",
      "memory.size",
      "module",
      "mut",
      "nop",
      "offset",
      "param",
      "result",
      "return",
      "select",
      "set_global",
      "set_local",
      "start",
      "table",
      "tee_local",
      "then",
      "type",
      "unreachable"
    ], l = {
      begin: [
        /(?:func|call|call_indirect)/,
        /\s+/,
        /\$[^\s)]+/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      }
    }, r = {
      className: "variable",
      begin: /\$[\w_]+/
    }, s = {
      match: /(\((?!;)|\))+/,
      className: "punctuation",
      relevance: 0
    }, c = {
      className: "number",
      relevance: 0,
      // borrowed from Prism, TODO: split out into variants
      match: /[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/
    }, o = {
      // look-ahead prevents us from gobbling up opcodes
      match: /(i32|i64|f32|f64)(?!\.)/,
      className: "type"
    }, a = {
      className: "keyword",
      // borrowed from Prism, TODO: split out into variants
      match: /\b(f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|nearest|neg?|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|store(?:8|16|32)?|sqrt|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))\b/
    };
    return {
      name: "WebAssembly",
      keywords: {
        $pattern: /[\w.]+/,
        keyword: d
      },
      contains: [
        i,
        t,
        {
          match: [
            /(?:offset|align)/,
            /\s*/,
            /=/
          ],
          className: {
            1: "keyword",
            3: "operator"
          }
        },
        r,
        s,
        l,
        e.QUOTE_STRING_MODE,
        o,
        a,
        c
      ]
    };
  }
  return hn = n, hn;
}
var x = Ia;
x.registerLanguage("xml", La());
x.registerLanguage("bash", Da());
x.registerLanguage("c", Ba());
x.registerLanguage("cpp", Ua());
x.registerLanguage("csharp", Pa());
x.registerLanguage("css", Fa());
x.registerLanguage("markdown", $a());
x.registerLanguage("diff", za());
x.registerLanguage("ruby", Ka());
x.registerLanguage("go", Ga());
x.registerLanguage("graphql", qa());
x.registerLanguage("ini", Ha());
x.registerLanguage("java", Wa());
x.registerLanguage("javascript", Ya());
x.registerLanguage("json", Za());
x.registerLanguage("kotlin", Va());
x.registerLanguage("less", Xa());
x.registerLanguage("lua", Qa());
x.registerLanguage("makefile", Ja());
x.registerLanguage("perl", ja());
x.registerLanguage("objectivec", ei());
x.registerLanguage("php", ni());
x.registerLanguage("php-template", ti());
x.registerLanguage("plaintext", ai());
x.registerLanguage("python", ii());
x.registerLanguage("python-repl", ri());
x.registerLanguage("r", si());
x.registerLanguage("rust", oi());
x.registerLanguage("scss", ci());
x.registerLanguage("shell", li());
x.registerLanguage("sql", di());
x.registerLanguage("swift", ui());
x.registerLanguage("yaml", gi());
x.registerLanguage("typescript", bi());
x.registerLanguage("vbnet", pi());
x.registerLanguage("wasm", mi());
x.HighlightJS = x;
x.default = x;
var fi = x;
const pt = /* @__PURE__ */ $t(fi), _i = { class: "everything-search" }, Ei = { class: "ev-main" }, hi = { class: "ev-results" }, vi = {
  key: 0,
  class: "ev-empty"
}, Ni = ["onClick"], yi = ["src"], Ti = {
  key: 1,
  class: "ev-icon"
}, wi = { class: "ev-info" }, Si = { class: "ev-title" }, Oi = { class: "ev-sidebar" }, Ai = {
  key: 0,
  class: "ev-status"
}, Ri = {
  key: 1,
  class: "ev-preview ev-preview-image"
}, ki = { class: "ev-image-wrap" }, Mi = ["src"], xi = ["innerHTML"], Ci = { class: "ev-file-info" }, Ii = { key: 0 }, Li = { class: "ev-info-value" }, Di = { key: 1 }, Bi = { class: "ev-info-value" }, Ui = {
  key: 0,
  class: "ev-path-bar"
}, hr = /* @__PURE__ */ Bt({
  __name: "main",
  props: {
    context: {}
  },
  setup(n, { expose: e }) {
    const t = /* @__PURE__ */ new Set([
      "txt",
      "md",
      "json",
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "scss",
      "less",
      "py",
      "rs",
      "go",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "cs",
      "php",
      "rb",
      "swift",
      "kt",
      "scala",
      "sh",
      "bash",
      "zsh",
      "fish",
      "ps1",
      "bat",
      "cmd",
      "xml",
      "yaml",
      "yml",
      "toml",
      "ini",
      "conf",
      "cfg",
      "log",
      "sql",
      "graphql",
      "vue",
      "svelte",
      "dart",
      "lua",
      "r",
      "pl",
      "pm",
      "dockerfile",
      "gitignore",
      "env",
      "properties"
    ]), i = /* @__PURE__ */ new Set([
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "svg",
      "ico",
      "tiff",
      "tif"
    ]);
    function d(N) {
      const k = N.lastIndexOf(".");
      return k > 0 ? N.slice(k + 1).toLowerCase() : "";
    }
    function l(N) {
      return t.has(d(N));
    }
    function r(N) {
      return i.has(d(N));
    }
    function s(N) {
      return {
        js: "javascript",
        ts: "typescript",
        jsx: "javascript",
        tsx: "typescript",
        vue: "html",
        svelte: "html",
        html: "xml",
        svg: "xml",
        py: "python",
        rs: "rust",
        go: "go",
        java: "java",
        c: "c",
        cpp: "cpp",
        h: "c",
        hpp: "cpp",
        cs: "csharp",
        php: "php",
        rb: "ruby",
        swift: "swift",
        kt: "kotlin",
        scala: "scala",
        dart: "dart",
        lua: "lua",
        r: "r",
        pl: "perl",
        pm: "perl",
        sh: "bash",
        bash: "bash",
        zsh: "bash",
        fish: "bash",
        ps1: "powershell",
        bat: "dos",
        sql: "sql",
        graphql: "graphql",
        json: "json",
        yml: "yaml",
        yaml: "yaml",
        toml: "ini",
        xml: "xml",
        md: "markdown",
        css: "css",
        scss: "scss",
        less: "less",
        dockerfile: "dockerfile",
        ini: "ini"
      }[d(N)];
    }
    function c(N, k) {
      const D = s(k);
      try {
        return (D ? pt.highlight(N, { language: D }) : pt.highlightAuto(N)).value;
      } catch {
        return N.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
    }
    const o = n, a = re(""), u = re([]), b = re(-1), p = re(""), _ = re(""), h = re(""), m = re(!1), v = re(!1), T = re(!1), w = re("init"), B = re(0), R = re(0);
    async function C() {
      var k;
      if (!a.value.trim()) {
        u.value = [], b.value = -1;
        return;
      }
      const N = ++B.value;
      w.value = `[#${N}] loading...`, T.value = !0;
      try {
        const D = await o.context.invoke("search", { query: a.value }), F = JSON.parse(D);
        w.value = `[#${N}] done, error=${F.error}, count=${((k = F.results) == null ? void 0 : k.length) ?? -1}`, F.error ? (p.value = F.error, u.value = []) : (p.value = "", u.value = F.results || []), b.value = u.value.length > 0 ? 0 : -1;
      } catch (D) {
        p.value = "搜索出错: " + D, w.value = `[#${N}] err: ${D}`, u.value = [];
      } finally {
        T.value = !1;
      }
    }
    function L(N) {
      N.key === "ArrowDown" ? (N.preventDefault(), u.value.length > 0 && (b.value = Math.min(b.value + 1, u.value.length - 1), S())) : N.key === "ArrowUp" ? (N.preventDefault(), u.value.length > 0 && (b.value = Math.max(b.value - 1, 0), S())) : N.key === "Enter" && (N.preventDefault(), b.value >= 0 && I(b.value));
    }
    async function S() {
      const N = u.value[b.value];
      if (!N) {
        m.value = !1;
        return;
      }
      if (r(N.subtitle)) {
        try {
          const k = await o.context.invoke("read_image", { path: N.subtitle }), D = JSON.parse(k);
          D.error ? m.value = !1 : (h.value = D.url, v.value = !0, m.value = !0);
        } catch {
          m.value = !1;
        }
        return;
      }
      if (v.value = !1, !l(N.subtitle)) {
        m.value = !1;
        return;
      }
      try {
        const k = await o.context.invoke("read_file", { path: N.subtitle }), D = JSON.parse(k);
        D.error ? m.value = !1 : (_.value = c(D.content, N.subtitle), v.value = !1, m.value = !0);
      } catch {
        m.value = !1;
      }
    }
    async function I(N) {
      const k = u.value[N];
      k && (await o.context.openFile(k.subtitle), await o.context.hideWindow());
    }
    function K(N) {
      a.value = N, u.value = [], b.value = -1, C();
    }
    return e({ onSearch: K, onKeyDown: L }), wn(() => o.context.query, (N) => {
      console.log("Context query changed:", N), N !== a.value && (a.value = N);
    }), wn(() => b.value, () => {
      S();
    }), Dt(() => {
      R.value++, w.value = `mount#${R.value}:` + (o.context.query || "empty"), o.context.query && (a.value = o.context.query, C());
    }), (N, k) => {
      var D;
      return se(), oe("div", _i, [
        ce("div", Ei, [
          ce("div", hi, [
            u.value.length === 0 ? (se(), oe("div", vi, me(T.value ? "搜索中..." : "输入关键词搜索文件和文件夹"), 1)) : ve("", !0),
            (se(!0), oe(Ut, null, Pt(u.value, (F, z) => (se(), oe("div", {
              key: z,
              class: Ft(["ev-item", { selected: z === b.value }]),
              onClick: (g) => {
                b.value = z, I(z);
              }
            }, [
              F.icon ? (se(), oe("img", {
                key: 0,
                class: "ev-icon-img",
                src: F.icon
              }, null, 8, yi)) : (se(), oe("span", Ti, me(F.is_folder ? "📁" : "📄"), 1)),
              ce("div", wi, [
                ce("div", Si, me(F.title), 1)
              ])
            ], 10, Ni))), 128))
          ])
        ]),
        ce("div", Oi, [
          p.value ? (se(), oe("div", Ai, me(p.value), 1)) : ve("", !0),
          m.value && v.value ? (se(), oe("div", Ri, [
            ce("div", ki, [
              ce("img", {
                class: "ev-image-img",
                src: h.value,
                alt: "preview"
              }, null, 8, Mi)
            ])
          ])) : m.value && !v.value ? (se(), oe("div", {
            key: 2,
            class: "ev-preview ev-preview-text",
            innerHTML: _.value
          }, null, 8, xi)) : ve("", !0),
          ce("div", Ci, [
            (D = u.value[b.value]) != null && D.size ? (se(), oe("div", Ii, [
              k[0] || (k[0] = ce("div", { class: "ev-info-label" }, "大小", -1)),
              ce("div", Li, me(u.value[b.value].size), 1)
            ])) : ve("", !0),
            u.value[b.value] ? (se(), oe("div", Di, [
              k[1] || (k[1] = ce("div", { class: "ev-info-label" }, "类型", -1)),
              ce("div", Bi, me(u.value[b.value].is_folder ? "文件夹" : "文件"), 1)
            ])) : ve("", !0)
          ])
        ]),
        u.value[b.value] ? (se(), oe("div", Ui, me(u.value[b.value].subtitle), 1)) : ve("", !0)
      ]);
    };
  }
});
export {
  hr as default
};
