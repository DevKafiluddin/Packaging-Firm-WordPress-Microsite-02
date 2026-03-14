(function() {
    const l = document.createElement("link").relList;
    if (l && l.supports && l.supports("modulepreload"))
        return;
    for (const c of document.querySelectorAll('link[rel="modulepreload"]'))
        s(c);
    new MutationObserver(c => {
        for (const f of c)
            if (f.type === "childList")
                for (const d of f.addedNodes)
                    d.tagName === "LINK" && d.rel === "modulepreload" && s(d)
    }
    ).observe(document, {
        childList: !0,
        subtree: !0
    });
    function r(c) {
        const f = {};
        return c.integrity && (f.integrity = c.integrity),
        c.referrerPolicy && (f.referrerPolicy = c.referrerPolicy),
        c.crossOrigin === "use-credentials" ? f.credentials = "include" : c.crossOrigin === "anonymous" ? f.credentials = "omit" : f.credentials = "same-origin",
        f
    }
    function s(c) {
        if (c.ep)
            return;
        c.ep = !0;
        const f = r(c);
        fetch(c.href, f)
    }
}
)();
const Ru = [];
let dg = !0;
const hg = console.error;
function em(i) {
    Ru.length > 5 || !dg || Ru.push(i)
}
function mg(i) {
    Ru.push({
        type: "runtime",
        args: i
    })
}
function gg(i) {
    i.preventDefault()
}
function Uy(i) {
    try {
        const l = i.find(r => r instanceof Error);
        if (l && l.stack)
            em({
                type: "console.error",
                args: l
            });
        else if (i.length > 0) {
            const r = i.map(c => typeof c == "object" ? JSON.stringify(c) : String(c)).join(" ")
              , s = new Error(r);
            em({
                type: "console.error",
                args: s
            })
        }
    } catch (l) {
        console.warn(l)
    }
}
window.addEventListener("error", mg);
window.addEventListener("unhandledrejection", gg);
console.error = function(...l) {
    Uy(l),
    hg.apply(this, l)
}
;
function Hy() {
    return window.removeEventListener("error", mg),
    window.removeEventListener("unhandledrejection", gg),
    console.error = hg,
    dg = !1,
    Ru
}
const By = 1e3
  , tm = Symbol("postMessageResponseTimeout");
let xu = 0;
const ao = "*";
class ka {
    client;
    baseTimeout;
    waitRes = new Map;
    removeListeners = new Set;
    clear;
    constructor(l, r) {
        this.client = l,
        this.baseTimeout = r?.timeout || By;
        const s = this.emitResponse.bind(this);
        this.clear = () => {
            window.removeEventListener("message", s)
        }
        ,
        window.addEventListener("message", s)
    }
    destroy() {
        this.clear(),
        this.removeListeners.forEach(l => l())
    }
    isTimeout(l) {
        return l === tm
    }
    post(l, r, s) {
        xu++;
        const {timeout: c, origin: f=ao} = s || {};
        return this.client.postMessage({
            data: r,
            id: xu,
            type: l
        }, f),
        new Promise(d => {
            this.waitRes.set(xu, m => {
                d(m)
            }
            ),
            setTimeout( () => {
                this.waitRes.delete(xu),
                d(tm)
            }
            , c || this.baseTimeout)
        }
        )
    }
    on(l, r, s) {
        const {once: c, origin: f=ao} = s || {}
          , d = async g => {
            const {id: p, type: b, data: v} = g.data;
            let S;
            b === l && (S = await r(v),
            console.log(l, c, S, v),
            (p && f === g.origin || f === ao) && g.source?.postMessage({
                fromType: l,
                id: p,
                data: S
            }, g.origin),
            c && m())
        }
        ;
        window.addEventListener("message", d);
        const m = () => {
            window.removeEventListener("message", d),
            this.removeListeners.delete(m)
        }
        ;
        return this.removeListeners.add(m),
        m
    }
    emitResponse(l) {
        const r = l.data
          , {id: s, data: c} = r
          , f = this.waitRes.get(s);
        f && f(c)
    }
}
class qy {
    #e = new WeakMap;
    #n;
    #a;
    #t = !1;
    constructor() {
        this.#n = HTMLElement.prototype.addEventListener,
        this.#a = HTMLElement.prototype.removeEventListener
    }
    patch() {
        if (this.#t)
            return;
        const l = this;
        HTMLElement.prototype.addEventListener = function(r, s, c) {
            return l.#l(this, r, s),
            l.#n.call(this, r, s, c)
        }
        ,
        HTMLElement.prototype.removeEventListener = function(r, s, c) {
            return l.#i(this, r, s),
            l.#a.call(this, r, s, c)
        }
        ,
        this.#t = !0,
        console.log("[EventListenerRegistry] ✅ addEventListener patched")
    }
    unpatch() {
        this.#t && (HTMLElement.prototype.addEventListener = this.#n,
        HTMLElement.prototype.removeEventListener = this.#a,
        this.#t = !1,
        console.log("[EventListenerRegistry] ⚠️ addEventListener unpatched"))
    }
    #l(l, r, s) {
        let c = this.#e.get(l);
        c || (c = new Map,
        this.#e.set(l, c));
        let f = c.get(r);
        f || (f = new Set,
        c.set(r, f)),
        f.add(s)
    }
    #i(l, r, s) {
        const c = this.#e.get(l);
        if (!c)
            return;
        const f = c.get(r);
        f && (f.delete(s),
        f.size === 0 && c.delete(r))
    }
    hasListeners(l, r) {
        const s = this.#e.get(l);
        return !s || s.size === 0 ? !1 : r ? r.some(c => {
            const f = s.get(c);
            return f && f.size > 0
        }
        ) : !0
    }
    getEventTypes(l) {
        const r = this.#e.get(l);
        return r ? Array.from(r.keys()) : []
    }
    getListenerCount(l, r) {
        const s = this.#e.get(l);
        if (!s)
            return 0;
        const c = s.get(r);
        return c ? c.size : 0
    }
    getDebugInfo() {
        return {
            patched: this.#t,
            note: "WeakMap is used for automatic memory cleanup. Cannot enumerate elements."
        }
    }
    getElementDebugInfo(l) {
        const r = this.#e.get(l);
        return r ? {
            element: l,
            tag: l.tagName,
            className: l.className,
            hasListeners: !0,
            eventTypes: Array.from(r.keys()),
            totalListeners: Array.from(r.values()).reduce( (s, c) => s + c.size, 0)
        } : {
            element: l,
            hasListeners: !1,
            eventTypes: [],
            totalListeners: 0
        }
    }
}
const Xa = new qy
  , pg = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mousemove", "mouseenter", "mouseleave", "mouseover", "mouseout", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointerup", "pointermove", "pointerenter", "pointerleave", "pointerover", "pointerout", "pointercancel"];
function Uo(i) {
    return Xa.hasListeners(i, pg)
}
function yg(i) {
    return Xa.getEventTypes(i).filter(r => pg.includes(r))
}
function vg(i) {
    const l = yg(i)
      , r = {};
    return l.forEach(s => {
        r[s] = Xa.getListenerCount(i, s)
    }
    ),
    {
        hasEvents: l.length > 0,
        eventTypes: l,
        listeners: r
    }
}
function Gy(i) {
    return Xa.getElementDebugInfo(i)
}
function bg(i=window) {
    Xa.patch(),
    i.__eventListenerRegistry__ = {
        hasListeners: Uo,
        getEventTypes: yg,
        getDetail: vg,
        getDebugInfo: () => Xa.getDebugInfo(),
        getElementDebugInfo: Gy
    },
    console.log("[EnhancedEventDetector] ✅ Initialized and patched addEventListener")
}
typeof window < "u" && bg(window);
const Ho = ["onClick", "onDoubleClick", "onContextMenu", "onMouseDown", "onMouseUp", "onPointerDown", "onPointerUp", "onTouchStart", "onTouchEnd", "onDragStart", "onDrop", "onChange", "onSubmit", "onKeyDown", "onKeyUp"];
function Bo(i) {
    const l = Object.keys(i).find(r => r.startsWith("__reactFiber$") || r.startsWith("__reactInternalInstance$"));
    return l ? i[l] : null
}
function xg(i) {
    return !i || typeof i != "object" ? !1 : Ho.some(l => typeof i[l] == "function")
}
function Yy(i) {
    return !i || typeof i != "object" ? [] : Ho.filter(l => typeof i[l] == "function")
}
function Sg(i) {
    let l = Bo(i);
    for (; l; ) {
        if (l.memoizedProps && xg(l.memoizedProps))
            return !0;
        l = l.return || null
    }
    return !1
}
function Eg(i) {
    const l = {
        hasEvents: !1,
        events: []
    };
    let r = Bo(i);
    for (; r; ) {
        if (r.memoizedProps) {
            const s = Yy(r.memoizedProps);
            if (s.length > 0) {
                l.hasEvents = !0;
                const c = r.type?.displayName || r.type?.name || r.elementType?.name || "Unknown";
                l.events.push({
                    componentName: c,
                    eventNames: s,
                    props: r.memoizedProps
                })
            }
        }
        r = r.return || null
    }
    return l
}
function wg(i) {
    const l = Bo(i);
    return !l || !l.memoizedProps ? !1 : xg(l.memoizedProps)
}
function _g(i=window) {
    i.__reactEventDetector__ = {
        hasReactInteractionEvents: Sg,
        getReactInteractionEventsDetail: Eg,
        hasReactInteractionEventsOnSelf: wg,
        REACT_EVENT_PROPS: Ho
    },
    console.log("[ReactEventDetector] Injected to window.__reactEventDetector__")
}
typeof window < "u" && _g(window);
function Cg(i) {
    return i ? Sg(i) || Uo(i) : !1
}
function Vy(i) {
    return i ? wg(i) || Uo(i) : !1
}
function qo(i) {
    const l = Eg(i)
      , r = vg(i);
    return {
        hasEvents: l.hasEvents || r.hasEvents,
        react: l,
        native: r
    }
}
function Go(i) {
    if (!i)
        return {
            error: "selector is required"
        };
    const l = document.querySelector(i);
    if (!l)
        return {
            error: "Element not found",
            selector: i
        };
    const r = qo(l);
    return {
        selector: i,
        hasEvents: r.hasEvents
    }
}
function Tg(i, l) {
    if (typeof i != "number" || typeof l != "number")
        return {
            error: "x and y must be numbers"
        };
    const r = document.elementFromPoint(i, l);
    if (!r)
        return {
            error: "No element at point",
            x: i,
            y: l
        };
    const s = qo(r);
    return {
        x: i,
        y: l,
        hasEvents: s.hasEvents
    }
}
function Qy(i) {
    return i.map(l => ({
        element: l,
        hasEvents: Cg(l)
    }))
}
function Og(i) {
    return i.map(l => ({
        selector: l,
        result: Go(l)
    }))
}
const nm = "1.0.0";
function Xy() {
    window.__interactionDetector__ = {
        hasInteractionEvents: Cg,
        hasInteractionEventsOnSelf: Vy,
        getDetail: qo,
        checkBySelector: Go,
        checkByPoint: Tg,
        checkMultiple: Qy,
        checkMultipleSelectors: Og,
        version: nm
    },
    console.log(`[InteractionDetector] Global API initialized (v${nm})`)
}
function ky() {
    const i = new ka(window.parent);
    i.on("checkInteraction", l => {
        const {selector: r, x: s, y: c} = l || {};
        return r ? Go(r) : typeof s == "number" && typeof c == "number" ? Tg(s, c) : {
            error: "Invalid params: need selector or (x, y)"
        }
    }
    ),
    i.on("checkMultipleSelectors", l => {
        const {selectors: r} = l || {};
        return !r || !Array.isArray(r) ? {
            error: "selectors array is required"
        } : Og(r)
    }
    ),
    console.log("[InteractionDetector] PostMessage listener initialized")
}
function Zy() {
    bg(),
    _g(),
    Xy(),
    ky(),
    console.log("[Continue] Module fully initialized")
}
function Ky(i) {
    return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i
}
function Jy(i) {
    if (Object.prototype.hasOwnProperty.call(i, "__esModule"))
        return i;
    var l = i.default;
    if (typeof l == "function") {
        var r = function s() {
            var c = !1;
            try {
                c = this instanceof s
            } catch {}
            return c ? Reflect.construct(l, arguments, this.constructor) : l.apply(this, arguments)
        };
        r.prototype = l.prototype
    } else
        r = {};
    return Object.defineProperty(r, "__esModule", {
        value: !0
    }),
    Object.keys(i).forEach(function(s) {
        var c = Object.getOwnPropertyDescriptor(i, s);
        Object.defineProperty(r, s, c.get ? c : {
            enumerable: !0,
            get: function() {
                return i[s]
            }
        })
    }),
    r
}
var Gl = {}, lo = {}, io = {}, uo = {}, am;
function $y() {
    if (am)
        return uo;
    am = 1;
    const i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    return uo.encode = function(l) {
        if (0 <= l && l < i.length)
            return i[l];
        throw new TypeError("Must be between 0 and 63: " + l)
    }
    ,
    uo
}
var lm;
function Ag() {
    if (lm)
        return io;
    lm = 1;
    const i = $y()
      , l = 5
      , r = 1 << l
      , s = r - 1
      , c = r;
    function f(d) {
        return d < 0 ? (-d << 1) + 1 : (d << 1) + 0
    }
    return io.encode = function(m) {
        let g = "", p, b = f(m);
        do
            p = b & s,
            b >>>= l,
            b > 0 && (p |= c),
            g += i.encode(p);
        while (b > 0);
        return g
    }
    ,
    io
}
var Dt = {};
const Fy = {}
  , Wy = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: Fy
}, Symbol.toStringTag, {
    value: "Module"
}))
  , Iy = Jy(Wy);
var ro, im;
function Py() {
    return im || (im = 1,
    ro = typeof URL == "function" ? URL : Iy.URL),
    ro
}
var um;
function zu() {
    if (um)
        return Dt;
    um = 1;
    const i = Py();
    function l(Q, k, K) {
        if (k in Q)
            return Q[k];
        if (arguments.length === 3)
            return K;
        throw new Error('"' + k + '" is a required argument.')
    }
    Dt.getArg = l;
    const r = (function() {
        return !("__proto__"in Object.create(null))
    }
    )();
    function s(Q) {
        return Q
    }
    function c(Q) {
        return d(Q) ? "$" + Q : Q
    }
    Dt.toSetString = r ? s : c;
    function f(Q) {
        return d(Q) ? Q.slice(1) : Q
    }
    Dt.fromSetString = r ? s : f;
    function d(Q) {
        if (!Q)
            return !1;
        const k = Q.length;
        if (k < 9 || Q.charCodeAt(k - 1) !== 95 || Q.charCodeAt(k - 2) !== 95 || Q.charCodeAt(k - 3) !== 111 || Q.charCodeAt(k - 4) !== 116 || Q.charCodeAt(k - 5) !== 111 || Q.charCodeAt(k - 6) !== 114 || Q.charCodeAt(k - 7) !== 112 || Q.charCodeAt(k - 8) !== 95 || Q.charCodeAt(k - 9) !== 95)
            return !1;
        for (let K = k - 10; K >= 0; K--)
            if (Q.charCodeAt(K) !== 36)
                return !1;
        return !0
    }
    function m(Q, k) {
        return Q === k ? 0 : Q === null ? 1 : k === null ? -1 : Q > k ? 1 : -1
    }
    function g(Q, k) {
        let K = Q.generatedLine - k.generatedLine;
        return K !== 0 || (K = Q.generatedColumn - k.generatedColumn,
        K !== 0) || (K = m(Q.source, k.source),
        K !== 0) || (K = Q.originalLine - k.originalLine,
        K !== 0) || (K = Q.originalColumn - k.originalColumn,
        K !== 0) ? K : m(Q.name, k.name)
    }
    Dt.compareByGeneratedPositionsInflated = g;
    function p(Q) {
        return JSON.parse(Q.replace(/^\)]}'[^\n]*\n/, ""))
    }
    Dt.parseSourceMapInput = p;
    const b = "http:"
      , v = `${b}//host`;
    function S(Q) {
        return k => {
            const K = j(k)
              , ne = A(k)
              , oe = new i(k,ne);
            Q(oe);
            const fe = oe.toString();
            return K === "absolute" ? fe : K === "scheme-relative" ? fe.slice(b.length) : K === "path-absolute" ? fe.slice(v.length) : G(ne, fe)
        }
    }
    function x(Q, k) {
        return new i(Q,k).toString()
    }
    function E(Q, k) {
        let K = 0;
        do {
            const ne = Q + K++;
            if (k.indexOf(ne) === -1)
                return ne
        } while (!0)
    }
    function A(Q) {
        const k = Q.split("..").length - 1
          , K = E("p", Q);
        let ne = `${v}/`;
        for (let oe = 0; oe < k; oe++)
            ne += `${K}/`;
        return ne
    }
    const _ = /^[A-Za-z0-9\+\-\.]+:/;
    function j(Q) {
        return Q[0] === "/" ? Q[1] === "/" ? "scheme-relative" : "path-absolute" : _.test(Q) ? "absolute" : "path-relative"
    }
    function G(Q, k) {
        typeof Q == "string" && (Q = new i(Q)),
        typeof k == "string" && (k = new i(k));
        const K = k.pathname.split("/")
          , ne = Q.pathname.split("/");
        for (ne.length > 0 && !ne[ne.length - 1] && ne.pop(); K.length > 0 && ne.length > 0 && K[0] === ne[0]; )
            K.shift(),
            ne.shift();
        return ne.map( () => "..").concat(K).join("/") + k.search + k.hash
    }
    const V = S(Q => {
        Q.pathname = Q.pathname.replace(/\/?$/, "/")
    }
    )
      , J = S(Q => {
        Q.href = new i(".",Q.toString()).toString()
    }
    )
      , W = S(Q => {}
    );
    Dt.normalize = W;
    function se(Q, k) {
        const K = j(k)
          , ne = j(Q);
        if (Q = V(Q),
        K === "absolute")
            return x(k, void 0);
        if (ne === "absolute")
            return x(k, Q);
        if (K === "scheme-relative")
            return W(k);
        if (ne === "scheme-relative")
            return x(k, x(Q, v)).slice(b.length);
        if (K === "path-absolute")
            return W(k);
        if (ne === "path-absolute")
            return x(k, x(Q, v)).slice(v.length);
        const oe = A(k + Q)
          , fe = x(k, x(Q, oe));
        return G(oe, fe)
    }
    Dt.join = se;
    function I(Q, k) {
        const K = ye(Q, k);
        return typeof K == "string" ? K : W(k)
    }
    Dt.relative = I;
    function ye(Q, k) {
        if (j(Q) !== j(k))
            return null;
        const ne = A(Q + k)
          , oe = new i(Q,ne)
          , fe = new i(k,ne);
        try {
            new i("",fe.toString())
        } catch {
            return null
        }
        return fe.protocol !== oe.protocol || fe.user !== oe.user || fe.password !== oe.password || fe.hostname !== oe.hostname || fe.port !== oe.port ? null : G(oe, fe)
    }
    function Ce(Q, k, K) {
        Q && j(k) === "path-absolute" && (k = k.replace(/^\//, ""));
        let ne = W(k || "");
        return Q && (ne = se(Q, ne)),
        K && (ne = se(J(K), ne)),
        ne
    }
    return Dt.computeSourceURL = Ce,
    Dt
}
var so = {}, rm;
function Rg() {
    if (rm)
        return so;
    rm = 1;
    class i {
        constructor() {
            this._array = [],
            this._set = new Map
        }
        static fromArray(r, s) {
            const c = new i;
            for (let f = 0, d = r.length; f < d; f++)
                c.add(r[f], s);
            return c
        }
        size() {
            return this._set.size
        }
        add(r, s) {
            const c = this.has(r)
              , f = this._array.length;
            (!c || s) && this._array.push(r),
            c || this._set.set(r, f)
        }
        has(r) {
            return this._set.has(r)
        }
        indexOf(r) {
            const s = this._set.get(r);
            if (s >= 0)
                return s;
            throw new Error('"' + r + '" is not in the set.')
        }
        at(r) {
            if (r >= 0 && r < this._array.length)
                return this._array[r];
            throw new Error("No element indexed by " + r)
        }
        toArray() {
            return this._array.slice()
        }
    }
    return so.ArraySet = i,
    so
}
var oo = {}, sm;
function ev() {
    if (sm)
        return oo;
    sm = 1;
    const i = zu();
    function l(s, c) {
        const f = s.generatedLine
          , d = c.generatedLine
          , m = s.generatedColumn
          , g = c.generatedColumn;
        return d > f || d == f && g >= m || i.compareByGeneratedPositionsInflated(s, c) <= 0
    }
    class r {
        constructor() {
            this._array = [],
            this._sorted = !0,
            this._last = {
                generatedLine: -1,
                generatedColumn: 0
            }
        }
        unsortedForEach(c, f) {
            this._array.forEach(c, f)
        }
        add(c) {
            l(this._last, c) ? (this._last = c,
            this._array.push(c)) : (this._sorted = !1,
            this._array.push(c))
        }
        toArray() {
            return this._sorted || (this._array.sort(i.compareByGeneratedPositionsInflated),
            this._sorted = !0),
            this._array
        }
    }
    return oo.MappingList = r,
    oo
}
var om;
function Ng() {
    if (om)
        return lo;
    om = 1;
    const i = Ag()
      , l = zu()
      , r = Rg().ArraySet
      , s = ev().MappingList;
    class c {
        constructor(d) {
            d || (d = {}),
            this._file = l.getArg(d, "file", null),
            this._sourceRoot = l.getArg(d, "sourceRoot", null),
            this._skipValidation = l.getArg(d, "skipValidation", !1),
            this._sources = new r,
            this._names = new r,
            this._mappings = new s,
            this._sourcesContents = null
        }
        static fromSourceMap(d) {
            const m = d.sourceRoot
              , g = new c({
                file: d.file,
                sourceRoot: m
            });
            return d.eachMapping(function(p) {
                const b = {
                    generated: {
                        line: p.generatedLine,
                        column: p.generatedColumn
                    }
                };
                p.source != null && (b.source = p.source,
                m != null && (b.source = l.relative(m, b.source)),
                b.original = {
                    line: p.originalLine,
                    column: p.originalColumn
                },
                p.name != null && (b.name = p.name)),
                g.addMapping(b)
            }),
            d.sources.forEach(function(p) {
                let b = p;
                m != null && (b = l.relative(m, p)),
                g._sources.has(b) || g._sources.add(b);
                const v = d.sourceContentFor(p);
                v != null && g.setSourceContent(p, v)
            }),
            g
        }
        addMapping(d) {
            const m = l.getArg(d, "generated")
              , g = l.getArg(d, "original", null);
            let p = l.getArg(d, "source", null)
              , b = l.getArg(d, "name", null);
            this._skipValidation || this._validateMapping(m, g, p, b),
            p != null && (p = String(p),
            this._sources.has(p) || this._sources.add(p)),
            b != null && (b = String(b),
            this._names.has(b) || this._names.add(b)),
            this._mappings.add({
                generatedLine: m.line,
                generatedColumn: m.column,
                originalLine: g && g.line,
                originalColumn: g && g.column,
                source: p,
                name: b
            })
        }
        setSourceContent(d, m) {
            let g = d;
            this._sourceRoot != null && (g = l.relative(this._sourceRoot, g)),
            m != null ? (this._sourcesContents || (this._sourcesContents = Object.create(null)),
            this._sourcesContents[l.toSetString(g)] = m) : this._sourcesContents && (delete this._sourcesContents[l.toSetString(g)],
            Object.keys(this._sourcesContents).length === 0 && (this._sourcesContents = null))
        }
        applySourceMap(d, m, g) {
            let p = m;
            if (m == null) {
                if (d.file == null)
                    throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);
                p = d.file
            }
            const b = this._sourceRoot;
            b != null && (p = l.relative(b, p));
            const v = this._mappings.toArray().length > 0 ? new r : this._sources
              , S = new r;
            this._mappings.unsortedForEach(function(x) {
                if (x.source === p && x.originalLine != null) {
                    const _ = d.originalPositionFor({
                        line: x.originalLine,
                        column: x.originalColumn
                    });
                    _.source != null && (x.source = _.source,
                    g != null && (x.source = l.join(g, x.source)),
                    b != null && (x.source = l.relative(b, x.source)),
                    x.originalLine = _.line,
                    x.originalColumn = _.column,
                    _.name != null && (x.name = _.name))
                }
                const E = x.source;
                E != null && !v.has(E) && v.add(E);
                const A = x.name;
                A != null && !S.has(A) && S.add(A)
            }, this),
            this._sources = v,
            this._names = S,
            d.sources.forEach(function(x) {
                const E = d.sourceContentFor(x);
                E != null && (g != null && (x = l.join(g, x)),
                b != null && (x = l.relative(b, x)),
                this.setSourceContent(x, E))
            }, this)
        }
        _validateMapping(d, m, g, p) {
            if (m && typeof m.line != "number" && typeof m.column != "number")
                throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");
            if (!(d && "line"in d && "column"in d && d.line > 0 && d.column >= 0 && !m && !g && !p)) {
                if (!(d && "line"in d && "column"in d && m && "line"in m && "column"in m && d.line > 0 && d.column >= 0 && m.line > 0 && m.column >= 0 && g))
                    throw new Error("Invalid mapping: " + JSON.stringify({
                        generated: d,
                        source: g,
                        original: m,
                        name: p
                    }))
            }
        }
        _serializeMappings() {
            let d = 0, m = 1, g = 0, p = 0, b = 0, v = 0, S = "", x, E, A, _;
            const j = this._mappings.toArray();
            for (let G = 0, V = j.length; G < V; G++) {
                if (E = j[G],
                x = "",
                E.generatedLine !== m)
                    for (d = 0; E.generatedLine !== m; )
                        x += ";",
                        m++;
                else if (G > 0) {
                    if (!l.compareByGeneratedPositionsInflated(E, j[G - 1]))
                        continue;
                    x += ","
                }
                x += i.encode(E.generatedColumn - d),
                d = E.generatedColumn,
                E.source != null && (_ = this._sources.indexOf(E.source),
                x += i.encode(_ - v),
                v = _,
                x += i.encode(E.originalLine - 1 - p),
                p = E.originalLine - 1,
                x += i.encode(E.originalColumn - g),
                g = E.originalColumn,
                E.name != null && (A = this._names.indexOf(E.name),
                x += i.encode(A - b),
                b = A)),
                S += x
            }
            return S
        }
        _generateSourcesContent(d, m) {
            return d.map(function(g) {
                if (!this._sourcesContents)
                    return null;
                m != null && (g = l.relative(m, g));
                const p = l.toSetString(g);
                return Object.prototype.hasOwnProperty.call(this._sourcesContents, p) ? this._sourcesContents[p] : null
            }, this)
        }
        toJSON() {
            const d = {
                version: this._version,
                sources: this._sources.toArray(),
                names: this._names.toArray(),
                mappings: this._serializeMappings()
            };
            return this._file != null && (d.file = this._file),
            this._sourceRoot != null && (d.sourceRoot = this._sourceRoot),
            this._sourcesContents && (d.sourcesContent = this._generateSourcesContent(d.sources, d.sourceRoot)),
            d
        }
        toString() {
            return JSON.stringify(this.toJSON())
        }
    }
    return c.prototype._version = 3,
    lo.SourceMapGenerator = c,
    lo
}
var Yl = {}, co = {}, cm;
function tv() {
    return cm || (cm = 1,
    (function(i) {
        i.GREATEST_LOWER_BOUND = 1,
        i.LEAST_UPPER_BOUND = 2;
        function l(r, s, c, f, d, m) {
            const g = Math.floor((s - r) / 2) + r
              , p = d(c, f[g], !0);
            return p === 0 ? g : p > 0 ? s - g > 1 ? l(g, s, c, f, d, m) : m === i.LEAST_UPPER_BOUND ? s < f.length ? s : -1 : g : g - r > 1 ? l(r, g, c, f, d, m) : m == i.LEAST_UPPER_BOUND ? g : r < 0 ? -1 : r
        }
        i.search = function(s, c, f, d) {
            if (c.length === 0)
                return -1;
            let m = l(-1, c.length, s, c, f, d || i.GREATEST_LOWER_BOUND);
            if (m < 0)
                return -1;
            for (; m - 1 >= 0 && f(c[m], c[m - 1], !0) === 0; )
                --m;
            return m
        }
    }
    )(co)),
    co
}
var Su = {
    exports: {}
}, fm;
function Lg() {
    if (fm)
        return Su.exports;
    fm = 1;
    let i = null;
    return Su.exports = function() {
        if (typeof i == "string")
            return fetch(i).then(r => r.arrayBuffer());
        if (i instanceof ArrayBuffer)
            return Promise.resolve(i);
        throw new Error("You must provide the string URL or ArrayBuffer contents of lib/mappings.wasm by calling SourceMapConsumer.initialize({ 'lib/mappings.wasm': ... }) before using SourceMapConsumer")
    }
    ,
    Su.exports.initialize = l => {
        i = l
    }
    ,
    Su.exports
}
var fo, dm;
function nv() {
    if (dm)
        return fo;
    dm = 1;
    const i = Lg();
    function l() {
        this.generatedLine = 0,
        this.generatedColumn = 0,
        this.lastGeneratedColumn = null,
        this.source = null,
        this.originalLine = null,
        this.originalColumn = null,
        this.name = null
    }
    let r = null;
    return fo = function() {
        if (r)
            return r;
        const c = [];
        return r = i().then(f => WebAssembly.instantiate(f, {
            env: {
                mapping_callback(d, m, g, p, b, v, S, x, E, A) {
                    const _ = new l;
                    _.generatedLine = d + 1,
                    _.generatedColumn = m,
                    g && (_.lastGeneratedColumn = p - 1),
                    b && (_.source = v,
                    _.originalLine = S + 1,
                    _.originalColumn = x,
                    E && (_.name = A)),
                    c[c.length - 1](_)
                },
                start_all_generated_locations_for() {
                    console.time("all_generated_locations_for")
                },
                end_all_generated_locations_for() {
                    console.timeEnd("all_generated_locations_for")
                },
                start_compute_column_spans() {
                    console.time("compute_column_spans")
                },
                end_compute_column_spans() {
                    console.timeEnd("compute_column_spans")
                },
                start_generated_location_for() {
                    console.time("generated_location_for")
                },
                end_generated_location_for() {
                    console.timeEnd("generated_location_for")
                },
                start_original_location_for() {
                    console.time("original_location_for")
                },
                end_original_location_for() {
                    console.timeEnd("original_location_for")
                },
                start_parse_mappings() {
                    console.time("parse_mappings")
                },
                end_parse_mappings() {
                    console.timeEnd("parse_mappings")
                },
                start_sort_by_generated_location() {
                    console.time("sort_by_generated_location")
                },
                end_sort_by_generated_location() {
                    console.timeEnd("sort_by_generated_location")
                },
                start_sort_by_original_location() {
                    console.time("sort_by_original_location")
                },
                end_sort_by_original_location() {
                    console.timeEnd("sort_by_original_location")
                }
            }
        })).then(f => ({
            exports: f.instance.exports,
            withMappingCallback: (d, m) => {
                c.push(d);
                try {
                    m()
                } finally {
                    c.pop()
                }
            }
        })).then(null, f => {
            throw r = null,
            f
        }
        ),
        r
    }
    ,
    fo
}
var hm;
function av() {
    if (hm)
        return Yl;
    hm = 1;
    const i = zu()
      , l = tv()
      , r = Rg().ArraySet;
    Ag();
    const s = Lg()
      , c = nv()
      , f = Symbol("smcInternal");
    class d {
        constructor(S, x) {
            return S == f ? Promise.resolve(this) : p(S, x)
        }
        static initialize(S) {
            s.initialize(S["lib/mappings.wasm"])
        }
        static fromSourceMap(S, x) {
            return b(S, x)
        }
        static async with(S, x, E) {
            const A = await new d(S,x);
            try {
                return await E(A)
            } finally {
                A.destroy()
            }
        }
        eachMapping(S, x, E) {
            throw new Error("Subclasses must implement eachMapping")
        }
        allGeneratedPositionsFor(S) {
            throw new Error("Subclasses must implement allGeneratedPositionsFor")
        }
        destroy() {
            throw new Error("Subclasses must implement destroy")
        }
    }
    d.prototype._version = 3,
    d.GENERATED_ORDER = 1,
    d.ORIGINAL_ORDER = 2,
    d.GREATEST_LOWER_BOUND = 1,
    d.LEAST_UPPER_BOUND = 2,
    Yl.SourceMapConsumer = d;
    class m extends d {
        constructor(S, x) {
            return super(f).then(E => {
                let A = S;
                typeof S == "string" && (A = i.parseSourceMapInput(S));
                const _ = i.getArg(A, "version")
                  , j = i.getArg(A, "sources").map(String)
                  , G = i.getArg(A, "names", [])
                  , V = i.getArg(A, "sourceRoot", null)
                  , J = i.getArg(A, "sourcesContent", null)
                  , W = i.getArg(A, "mappings")
                  , se = i.getArg(A, "file", null)
                  , I = i.getArg(A, "x_google_ignoreList", null);
                if (_ != E._version)
                    throw new Error("Unsupported version: " + _);
                return E._sourceLookupCache = new Map,
                E._names = r.fromArray(G.map(String), !0),
                E._sources = r.fromArray(j, !0),
                E._absoluteSources = r.fromArray(E._sources.toArray().map(function(ye) {
                    return i.computeSourceURL(V, ye, x)
                }), !0),
                E.sourceRoot = V,
                E.sourcesContent = J,
                E._mappings = W,
                E._sourceMapURL = x,
                E.file = se,
                E.x_google_ignoreList = I,
                E._computedColumnSpans = !1,
                E._mappingsPtr = 0,
                E._wasm = null,
                c().then(ye => (E._wasm = ye,
                E))
            }
            )
        }
        _findSourceIndex(S) {
            const x = this._sourceLookupCache.get(S);
            if (typeof x == "number")
                return x;
            const E = i.computeSourceURL(null, S, this._sourceMapURL);
            if (this._absoluteSources.has(E)) {
                const _ = this._absoluteSources.indexOf(E);
                return this._sourceLookupCache.set(S, _),
                _
            }
            const A = i.computeSourceURL(this.sourceRoot, S, this._sourceMapURL);
            if (this._absoluteSources.has(A)) {
                const _ = this._absoluteSources.indexOf(A);
                return this._sourceLookupCache.set(S, _),
                _
            }
            return -1
        }
        static fromSourceMap(S, x) {
            return new m(S.toString())
        }
        get sources() {
            return this._absoluteSources.toArray()
        }
        _getMappingsPtr() {
            return this._mappingsPtr === 0 && this._parseMappings(),
            this._mappingsPtr
        }
        _parseMappings() {
            const S = this._mappings
              , x = S.length
              , E = this._wasm.exports.allocate_mappings(x) >>> 0
              , A = new Uint8Array(this._wasm.exports.memory.buffer,E,x);
            for (let j = 0; j < x; j++)
                A[j] = S.charCodeAt(j);
            const _ = this._wasm.exports.parse_mappings(E);
            if (!_) {
                const j = this._wasm.exports.get_last_error();
                let G = `Error parsing mappings (code ${j}): `;
                switch (j) {
                case 1:
                    G += "the mappings contained a negative line, column, source index, or name index";
                    break;
                case 2:
                    G += "the mappings contained a number larger than 2**32";
                    break;
                case 3:
                    G += "reached EOF while in the middle of parsing a VLQ";
                    break;
                case 4:
                    G += "invalid base 64 character while parsing a VLQ";
                    break;
                default:
                    G += "unknown error code";
                    break
                }
                throw new Error(G)
            }
            this._mappingsPtr = _
        }
        eachMapping(S, x, E) {
            const A = x || null
              , _ = E || d.GENERATED_ORDER;
            this._wasm.withMappingCallback(j => {
                j.source !== null && (j.source = this._absoluteSources.at(j.source),
                j.name !== null && (j.name = this._names.at(j.name))),
                this._computedColumnSpans && j.lastGeneratedColumn === null && (j.lastGeneratedColumn = 1 / 0),
                S.call(A, j)
            }
            , () => {
                switch (_) {
                case d.GENERATED_ORDER:
                    this._wasm.exports.by_generated_location(this._getMappingsPtr());
                    break;
                case d.ORIGINAL_ORDER:
                    this._wasm.exports.by_original_location(this._getMappingsPtr());
                    break;
                default:
                    throw new Error("Unknown order of iteration.")
                }
            }
            )
        }
        allGeneratedPositionsFor(S) {
            let x = i.getArg(S, "source");
            const E = i.getArg(S, "line")
              , A = S.column || 0;
            if (x = this._findSourceIndex(x),
            x < 0)
                return [];
            if (E < 1)
                throw new Error("Line numbers must be >= 1");
            if (A < 0)
                throw new Error("Column numbers must be >= 0");
            const _ = [];
            return this._wasm.withMappingCallback(j => {
                let G = j.lastGeneratedColumn;
                this._computedColumnSpans && G === null && (G = 1 / 0),
                _.push({
                    line: j.generatedLine,
                    column: j.generatedColumn,
                    lastColumn: G
                })
            }
            , () => {
                this._wasm.exports.all_generated_locations_for(this._getMappingsPtr(), x, E - 1, "column"in S, A)
            }
            ),
            _
        }
        destroy() {
            this._mappingsPtr !== 0 && (this._wasm.exports.free_mappings(this._mappingsPtr),
            this._mappingsPtr = 0)
        }
        computeColumnSpans() {
            this._computedColumnSpans || (this._wasm.exports.compute_column_spans(this._getMappingsPtr()),
            this._computedColumnSpans = !0)
        }
        originalPositionFor(S) {
            const x = {
                generatedLine: i.getArg(S, "line"),
                generatedColumn: i.getArg(S, "column")
            };
            if (x.generatedLine < 1)
                throw new Error("Line numbers must be >= 1");
            if (x.generatedColumn < 0)
                throw new Error("Column numbers must be >= 0");
            let E = i.getArg(S, "bias", d.GREATEST_LOWER_BOUND);
            E == null && (E = d.GREATEST_LOWER_BOUND);
            let A;
            if (this._wasm.withMappingCallback(_ => A = _, () => {
                this._wasm.exports.original_location_for(this._getMappingsPtr(), x.generatedLine - 1, x.generatedColumn, E)
            }
            ),
            A && A.generatedLine === x.generatedLine) {
                let _ = i.getArg(A, "source", null);
                _ !== null && (_ = this._absoluteSources.at(_));
                let j = i.getArg(A, "name", null);
                return j !== null && (j = this._names.at(j)),
                {
                    source: _,
                    line: i.getArg(A, "originalLine", null),
                    column: i.getArg(A, "originalColumn", null),
                    name: j
                }
            }
            return {
                source: null,
                line: null,
                column: null,
                name: null
            }
        }
        hasContentsOfAllSources() {
            return this.sourcesContent ? this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(S) {
                return S == null
            }) : !1
        }
        sourceContentFor(S, x) {
            if (!this.sourcesContent)
                return null;
            const E = this._findSourceIndex(S);
            if (E >= 0)
                return this.sourcesContent[E];
            if (x)
                return null;
            throw new Error('"' + S + '" is not in the SourceMap.')
        }
        generatedPositionFor(S) {
            let x = i.getArg(S, "source");
            if (x = this._findSourceIndex(x),
            x < 0)
                return {
                    line: null,
                    column: null,
                    lastColumn: null
                };
            const E = {
                source: x,
                originalLine: i.getArg(S, "line"),
                originalColumn: i.getArg(S, "column")
            };
            if (E.originalLine < 1)
                throw new Error("Line numbers must be >= 1");
            if (E.originalColumn < 0)
                throw new Error("Column numbers must be >= 0");
            let A = i.getArg(S, "bias", d.GREATEST_LOWER_BOUND);
            A == null && (A = d.GREATEST_LOWER_BOUND);
            let _;
            if (this._wasm.withMappingCallback(j => _ = j, () => {
                this._wasm.exports.generated_location_for(this._getMappingsPtr(), E.source, E.originalLine - 1, E.originalColumn, A)
            }
            ),
            _ && _.source === E.source) {
                let j = _.lastGeneratedColumn;
                return this._computedColumnSpans && j === null && (j = 1 / 0),
                {
                    line: i.getArg(_, "generatedLine", null),
                    column: i.getArg(_, "generatedColumn", null),
                    lastColumn: j
                }
            }
            return {
                line: null,
                column: null,
                lastColumn: null
            }
        }
    }
    m.prototype.consumer = d,
    Yl.BasicSourceMapConsumer = m;
    class g extends d {
        constructor(S, x) {
            return super(f).then(E => {
                let A = S;
                typeof S == "string" && (A = i.parseSourceMapInput(S));
                const _ = i.getArg(A, "version")
                  , j = i.getArg(A, "sections");
                if (_ != E._version)
                    throw new Error("Unsupported version: " + _);
                let G = {
                    line: -1,
                    column: 0
                };
                return Promise.all(j.map(V => {
                    if (V.url)
                        throw new Error("Support for url field in sections not implemented.");
                    const J = i.getArg(V, "offset")
                      , W = i.getArg(J, "line")
                      , se = i.getArg(J, "column");
                    if (W < G.line || W === G.line && se < G.column)
                        throw new Error("Section offsets must be ordered and non-overlapping.");
                    return G = J,
                    new d(i.getArg(V, "map"),x).then(ye => ({
                        generatedOffset: {
                            generatedLine: W + 1,
                            generatedColumn: se + 1
                        },
                        consumer: ye
                    }))
                }
                )).then(V => (E._sections = V,
                E))
            }
            )
        }
        get sources() {
            const S = [];
            for (let x = 0; x < this._sections.length; x++)
                for (let E = 0; E < this._sections[x].consumer.sources.length; E++)
                    S.push(this._sections[x].consumer.sources[E]);
            return S
        }
        originalPositionFor(S) {
            const x = {
                generatedLine: i.getArg(S, "line"),
                generatedColumn: i.getArg(S, "column")
            }
              , E = l.search(x, this._sections, function(_, j) {
                const G = _.generatedLine - j.generatedOffset.generatedLine;
                return G || _.generatedColumn - (j.generatedOffset.generatedColumn - 1)
            })
              , A = this._sections[E];
            return A ? A.consumer.originalPositionFor({
                line: x.generatedLine - (A.generatedOffset.generatedLine - 1),
                column: x.generatedColumn - (A.generatedOffset.generatedLine === x.generatedLine ? A.generatedOffset.generatedColumn - 1 : 0),
                bias: S.bias
            }) : {
                source: null,
                line: null,
                column: null,
                name: null
            }
        }
        hasContentsOfAllSources() {
            return this._sections.every(function(S) {
                return S.consumer.hasContentsOfAllSources()
            })
        }
        sourceContentFor(S, x) {
            for (let E = 0; E < this._sections.length; E++) {
                const _ = this._sections[E].consumer.sourceContentFor(S, !0);
                if (_)
                    return _
            }
            if (x)
                return null;
            throw new Error('"' + S + '" is not in the SourceMap.')
        }
        _findSectionIndex(S) {
            for (let x = 0; x < this._sections.length; x++) {
                const {consumer: E} = this._sections[x];
                if (E._findSourceIndex(S) !== -1)
                    return x
            }
            return -1
        }
        generatedPositionFor(S) {
            const x = this._findSectionIndex(i.getArg(S, "source"))
              , E = x >= 0 ? this._sections[x] : null
              , A = x >= 0 && x + 1 < this._sections.length ? this._sections[x + 1] : null
              , _ = E && E.consumer.generatedPositionFor(S);
            if (_ && _.line !== null) {
                const j = E.generatedOffset.generatedLine - 1
                  , G = E.generatedOffset.generatedColumn - 1;
                return _.line === 1 && (_.column += G,
                typeof _.lastColumn == "number" && (_.lastColumn += G)),
                _.lastColumn === 1 / 0 && A && _.line === A.generatedOffset.generatedLine && (_.lastColumn = A.generatedOffset.generatedColumn - 2),
                _.line += j,
                _
            }
            return {
                line: null,
                column: null,
                lastColumn: null
            }
        }
        allGeneratedPositionsFor(S) {
            const x = this._findSectionIndex(i.getArg(S, "source"))
              , E = x >= 0 ? this._sections[x] : null
              , A = x >= 0 && x + 1 < this._sections.length ? this._sections[x + 1] : null;
            return E ? E.consumer.allGeneratedPositionsFor(S).map(_ => {
                const j = E.generatedOffset.generatedLine - 1
                  , G = E.generatedOffset.generatedColumn - 1;
                return _.line === 1 && (_.column += G,
                typeof _.lastColumn == "number" && (_.lastColumn += G)),
                _.lastColumn === 1 / 0 && A && _.line === A.generatedOffset.generatedLine && (_.lastColumn = A.generatedOffset.generatedColumn - 2),
                _.line += j,
                _
            }
            ) : []
        }
        eachMapping(S, x, E) {
            this._sections.forEach( (A, _) => {
                const j = _ + 1 < this._sections.length ? this._sections[_ + 1] : null
                  , {generatedOffset: G} = A
                  , V = G.generatedLine - 1
                  , J = G.generatedColumn - 1;
                A.consumer.eachMapping(function(W) {
                    W.generatedLine === 1 && (W.generatedColumn += J,
                    typeof W.lastGeneratedColumn == "number" && (W.lastGeneratedColumn += J)),
                    W.lastGeneratedColumn === 1 / 0 && j && W.generatedLine === j.generatedOffset.generatedLine && (W.lastGeneratedColumn = j.generatedOffset.generatedColumn - 2),
                    W.generatedLine += V,
                    S.call(this, W)
                }, x, E)
            }
            )
        }
        computeColumnSpans() {
            for (let S = 0; S < this._sections.length; S++)
                this._sections[S].consumer.computeColumnSpans()
        }
        destroy() {
            for (let S = 0; S < this._sections.length; S++)
                this._sections[S].consumer.destroy()
        }
    }
    Yl.IndexedSourceMapConsumer = g;
    function p(v, S) {
        let x = v;
        typeof v == "string" && (x = i.parseSourceMapInput(v));
        const E = x.sections != null ? new g(x,S) : new m(x,S);
        return Promise.resolve(E)
    }
    function b(v, S) {
        return m.fromSourceMap(v, S)
    }
    return Yl
}
var ho = {}, mm;
function lv() {
    if (mm)
        return ho;
    mm = 1;
    const i = Ng().SourceMapGenerator
      , l = zu()
      , r = /(\r?\n)/
      , s = 10
      , c = "$$$isSourceNode$$$";
    class f {
        constructor(m, g, p, b, v) {
            this.children = [],
            this.sourceContents = {},
            this.line = m ?? null,
            this.column = g ?? null,
            this.source = p ?? null,
            this.name = v ?? null,
            this[c] = !0,
            b != null && this.add(b)
        }
        static fromStringWithSourceMap(m, g, p) {
            const b = new f
              , v = m.split(r);
            let S = 0;
            const x = function() {
                const V = W()
                  , J = W() || "";
                return V + J;
                function W() {
                    return S < v.length ? v[S++] : void 0
                }
            };
            let E = 1, A = 0, _ = null, j;
            return g.eachMapping(function(V) {
                if (_ !== null)
                    if (E < V.generatedLine)
                        G(_, x()),
                        E++,
                        A = 0;
                    else {
                        j = v[S] || "";
                        const J = j.substr(0, V.generatedColumn - A);
                        v[S] = j.substr(V.generatedColumn - A),
                        A = V.generatedColumn,
                        G(_, J),
                        _ = V;
                        return
                    }
                for (; E < V.generatedLine; )
                    b.add(x()),
                    E++;
                A < V.generatedColumn && (j = v[S] || "",
                b.add(j.substr(0, V.generatedColumn)),
                v[S] = j.substr(V.generatedColumn),
                A = V.generatedColumn),
                _ = V
            }, this),
            S < v.length && (_ && G(_, x()),
            b.add(v.splice(S).join(""))),
            g.sources.forEach(function(V) {
                const J = g.sourceContentFor(V);
                J != null && (p != null && (V = l.join(p, V)),
                b.setSourceContent(V, J))
            }),
            b;
            function G(V, J) {
                if (V === null || V.source === void 0)
                    b.add(J);
                else {
                    const W = p ? l.join(p, V.source) : V.source;
                    b.add(new f(V.originalLine,V.originalColumn,W,J,V.name))
                }
            }
        }
        add(m) {
            if (Array.isArray(m))
                m.forEach(function(g) {
                    this.add(g)
                }, this);
            else if (m[c] || typeof m == "string")
                m && this.children.push(m);
            else
                throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + m);
            return this
        }
        prepend(m) {
            if (Array.isArray(m))
                for (let g = m.length - 1; g >= 0; g--)
                    this.prepend(m[g]);
            else if (m[c] || typeof m == "string")
                this.children.unshift(m);
            else
                throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + m);
            return this
        }
        walk(m) {
            let g;
            for (let p = 0, b = this.children.length; p < b; p++)
                g = this.children[p],
                g[c] ? g.walk(m) : g !== "" && m(g, {
                    source: this.source,
                    line: this.line,
                    column: this.column,
                    name: this.name
                })
        }
        join(m) {
            let g, p;
            const b = this.children.length;
            if (b > 0) {
                for (g = [],
                p = 0; p < b - 1; p++)
                    g.push(this.children[p]),
                    g.push(m);
                g.push(this.children[p]),
                this.children = g
            }
            return this
        }
        replaceRight(m, g) {
            const p = this.children[this.children.length - 1];
            return p[c] ? p.replaceRight(m, g) : typeof p == "string" ? this.children[this.children.length - 1] = p.replace(m, g) : this.children.push("".replace(m, g)),
            this
        }
        setSourceContent(m, g) {
            this.sourceContents[l.toSetString(m)] = g
        }
        walkSourceContents(m) {
            for (let p = 0, b = this.children.length; p < b; p++)
                this.children[p][c] && this.children[p].walkSourceContents(m);
            const g = Object.keys(this.sourceContents);
            for (let p = 0, b = g.length; p < b; p++)
                m(l.fromSetString(g[p]), this.sourceContents[g[p]])
        }
        toString() {
            let m = "";
            return this.walk(function(g) {
                m += g
            }),
            m
        }
        toStringWithSourceMap(m) {
            const g = {
                code: "",
                line: 1,
                column: 0
            }
              , p = new i(m);
            let b = !1
              , v = null
              , S = null
              , x = null
              , E = null;
            return this.walk(function(A, _) {
                g.code += A,
                _.source !== null && _.line !== null && _.column !== null ? ((v !== _.source || S !== _.line || x !== _.column || E !== _.name) && p.addMapping({
                    source: _.source,
                    original: {
                        line: _.line,
                        column: _.column
                    },
                    generated: {
                        line: g.line,
                        column: g.column
                    },
                    name: _.name
                }),
                v = _.source,
                S = _.line,
                x = _.column,
                E = _.name,
                b = !0) : b && (p.addMapping({
                    generated: {
                        line: g.line,
                        column: g.column
                    }
                }),
                v = null,
                b = !1);
                for (let j = 0, G = A.length; j < G; j++)
                    A.charCodeAt(j) === s ? (g.line++,
                    g.column = 0,
                    j + 1 === G ? (v = null,
                    b = !1) : b && p.addMapping({
                        source: _.source,
                        original: {
                            line: _.line,
                            column: _.column
                        },
                        generated: {
                            line: g.line,
                            column: g.column
                        },
                        name: _.name
                    })) : g.column++
            }),
            this.walkSourceContents(function(A, _) {
                p.setSourceContent(A, _)
            }),
            {
                code: g.code,
                map: p
            }
        }
    }
    return ho.SourceNode = f,
    ho
}
var gm;
function iv() {
    return gm || (gm = 1,
    Gl.SourceMapGenerator = Ng().SourceMapGenerator,
    Gl.SourceMapConsumer = av().SourceMapConsumer,
    Gl.SourceNode = lv().SourceNode),
    Gl
}
var Lo = iv();
function uv(i, l, r) {
    const s = i[l];
    if (!s)
        return {
            lineIndex: l,
            column: r
        };
    const c = s.trim()
      , f = /^<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(c)
      , d = /<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(c);
    let m = !1;
    if (r != null) {
        const g = s.substring(0, r);
        m = /<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(g)
    }
    if (f || d || m) {
        if (r != null) {
            const g = s.substring(r)
              , p = g.match(/<([A-Za-z][A-Za-z0-9\-_.]*)/);
            if (p && g[p.index + 1] !== "/")
                return {
                    lineIndex: l,
                    column: r + p.index + 1
                }
        }
        for (let g = l + 1; g < i.length && g < l + 50; g++) {
            const p = i[g]
              , b = p.match(/<([A-Za-z][A-Za-z0-9\-_.]*)/);
            if (b && p[b.index + 1] !== "/")
                return {
                    lineIndex: g,
                    column: b.index + 1
                }
        }
    }
    return {
        lineIndex: l,
        column: r
    }
}
function Yo(i, l, r) {
    let s = 0;
    for (let c = l; c < i.length; c++) {
        const f = i[c]
          , d = c === l ? r : 0;
        for (let m = d; m < f.length; m++) {
            const g = f[m];
            if (g === "{")
                s++;
            else if (g === "}")
                s--;
            else if (s === 0) {
                if (g === "/" && f[m + 1] === ">")
                    return {
                        lineIndex: c,
                        columnEnd: m + 2,
                        isSelfClosing: !0
                    };
                if (g === ">")
                    return {
                        lineIndex: c,
                        columnEnd: m + 1,
                        isSelfClosing: !1
                    }
            }
        }
    }
}
function Mg(i, l, r, s) {
    let c = 1;
    const f = new RegExp(`<${l}(?=\\s|>|/>)`,"g")
      , d = new RegExp(`</${l}\\s*>`,"g");
    for (let m = r; m < i.length; m++) {
        const g = m === r ? s : 0
          , p = i[m].substring(g)
          , b = [];
        let v;
        for (f.lastIndex = 0; (v = f.exec(p)) !== null; ) {
            const S = Yo([p], 0, v.index + v[0].length);
            S && !S.isSelfClosing && b.push({
                type: "open",
                index: v.index,
                length: v[0].length
            })
        }
        for (d.lastIndex = 0; (v = d.exec(p)) !== null; )
            b.push({
                type: "close",
                index: v.index,
                length: v[0].length
            });
        b.sort( (S, x) => S.index - x.index);
        for (const S of b)
            if (S.type === "open")
                c++;
            else if (S.type === "close" && (c--,
            c === 0))
                return {
                    lineIndex: m,
                    columnEnd: g + S.index + S.length
                }
    }
}
function pm(i, l, r) {
    let s;
    for (let c = l; c >= 0; c--) {
        const f = i[c]
          , d = /<([A-Za-z][A-Za-z0-9\-_.]*)/g;
        let m;
        for (; (m = d.exec(f)) !== null; ) {
            const g = m.index
              , p = m[1];
            if (f[g + 1] === "/" || !(c < l || c === l && g <= (r ?? f.length)))
                continue;
            const v = g + m[0].length
              , S = Yo(i, c, v);
            if (!S)
                continue;
            let x = c
              , E = S.columnEnd;
            if (!S.isSelfClosing) {
                const _ = Mg(i, p, c, S.columnEnd);
                if (!_)
                    continue;
                x = _.lineIndex,
                E = _.columnEnd
            }
            (c < l || c === l && g <= (r ?? f.length)) && (x > l || x === l && E >= (r ?? 0)) && (!s || x - c < s.closeLineIndex - s.lineIndex || x - c === s.closeLineIndex - s.lineIndex && E - g < s.closeColumnEnd - s.columnStart) && (s = {
                tagName: p,
                lineIndex: c,
                columnStart: g,
                columnEnd: S.columnEnd,
                isSelfClosing: S.isSelfClosing,
                closeLineIndex: x,
                closeColumnEnd: E
            })
        }
    }
    return s
}
function rv(i, l, r) {
    const s = new RegExp(`<(${r})(?=\\s|>|/>)`,"i");
    for (let c = l + 1; c < i.length && c < l + 50; c++) {
        const f = i[c]
          , d = s.exec(f);
        if (d) {
            const m = d.index
              , g = d[1]
              , p = m + d[0].length
              , b = Yo(i, c, p);
            if (!b)
                continue;
            let v = c
              , S = b.columnEnd;
            if (!b.isSelfClosing) {
                const x = Mg(i, g, c, b.columnEnd);
                if (!x)
                    continue;
                v = x.lineIndex,
                S = x.columnEnd
            }
            return {
                tagName: g,
                lineIndex: c,
                columnStart: m,
                columnEnd: b.columnEnd,
                isSelfClosing: b.isSelfClosing,
                closeLineIndex: v,
                closeColumnEnd: S
            }
        }
    }
}
function sv(i, l, r, s, c) {
    if (l === s)
        return i[l].substring(r, c);
    let f = i[l].substring(r);
    for (let d = l + 1; d < s; d++)
        f += `
` + i[d];
    return f += `
` + i[s].substring(0, c),
    f
}
function ov(i, l, r=10) {
    const s = i.split(`
`)
      , c = Math.max(0, l - r - 1)
      , f = Math.min(s.length - 1, l + r - 1)
      , d = [];
    for (let m = c; m <= f; m++) {
        const g = m + 1
          , v = `${g === l ? ">>>" : "   "} ${g.toString().padStart(4, " ")} | ${s[m] || ""}`;
        d.push(v)
    }
    return d.join(`
`)
}
async function cv(i) {
    try {
        const l = await fetch(i);
        if (!l.ok)
            throw new Error(`Failed to load source map: ${l.status}`);
        return await l.json()
    } catch (l) {
        const r = l instanceof Error ? l.message : String(l);
        console.warn("Error loading source map from", i, r)
    }
}
let mo = !1;
const Qa = new Map
  , fv = 300 * 1e3
  , dv = 1e3;
setInterval( () => {
    const i = Date.now();
    for (const [l,r] of Qa.entries())
        i - r.timestamp > fv && Qa.delete(l)
}
, 6e4);
async function hv() {
    if (!mo)
        try {
            await Lo.SourceMapConsumer.initialize({
                "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.6/lib/mappings.wasm"
            }),
            mo = !0
        } catch (i) {
            console.warn("Failed to initialize SourceMapConsumer:", i);
            try {
                await Lo.SourceMapConsumer.initialize({}),
                mo = !0
            } catch (l) {
                throw console.error("SourceMapConsumer initialization failed completely:", l),
                l
            }
        }
}
function mv(i) {
    if (!i || !i.stack)
        return `no-stack-${i?.message || "unknown"}`;
    const s = i.stack.split(`
`).slice(0, 6).map(c => c.replace(/\?t=\d+/g, "").replace(/\?v=[\w\d]+/g, "").replace(/\d{13,}/g, "TIMESTAMP"));
    return `${i.name || "Error"}-${i.message}-${s.join("|")}`
}
const gv = "preview-inject/";
async function Zl(i, l=10, r) {
    if (!i || !i.stack)
        return {
            errorMessage: i?.message || "",
            mappedStack: i?.stack || "",
            sourceContext: []
        };
    const s = mv(i);
    if (Qa.has(s)) {
        const v = Qa.get(s);
        return console.log("Using cached error mapping for:", s),
        v
    }
    if (Qa.size >= dv)
        return null;
    await hv();
    const c = i.stack.split(`
`)
      , f = []
      , d = []
      , m = new Map
      , g = new Map;
    let p = 0;
    for (const v of c) {
        const S = v.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)|at\s+(.+?):(\d+):(\d+)|([^@]*)@(.+?):(\d+):(\d+)/);
        if (!S) {
            f.push(v);
            continue
        }
        let x, E, A, _;
        S[1] ? (x = S[1],
        E = S[2],
        A = parseInt(S[3]),
        _ = parseInt(S[4])) : S[5] ? (x = "<anonymous>",
        E = S[5],
        A = parseInt(S[6]),
        _ = parseInt(S[7])) : (x = S[8],
        E = S[9],
        A = parseInt(S[10]),
        _ = parseInt(S[11]));
        try {
            const j = `${E}.map`;
            let G = m.get(j);
            if (!G) {
                const J = await cv(j);
                G = await new Lo.SourceMapConsumer(J),
                m.set(j, G)
            }
            const V = G.originalPositionFor({
                line: A,
                column: _
            });
            if (V.source) {
                if (V.source.includes(gv))
                    continue;
                const J = V.source.split("/").filter(I => I !== "..").join("/")
                  , se = `    at ${V.name || x} (${J}:${V.line}:${V.column})`;
                if (f.push(se),
                V.line && V.column && p < l) {
                    p++;
                    try {
                        const I = await pv(G, V.source, g);
                        if (I) {
                            const ye = J.includes("node_modules")
                              , Ce = /\.(tsx|jsx)$/.test(J);
                            let Q;
                            if (!ye && Ce) {
                                const K = yv(I, V.line, V.column, r);
                                K && (Q = {
                                    tagName: K.tagName,
                                    code: K.code,
                                    context: K.context,
                                    startLine: K.startLine,
                                    endLine: K.endLine
                                })
                            }
                            const k = ov(I, V.line, ye ? 1 : 10);
                            d.push({
                                file: J,
                                line: V.line,
                                column: V.column,
                                context: k,
                                closedBlock: Q
                            })
                        }
                    } catch (I) {
                        console.warn("Failed to extract source context:", I)
                    }
                }
            } else
                f.push(v)
        } catch (j) {
            console.warn("Failed to map stack line:", v, j),
            f.push(v)
        }
    }
    for (const v of m.values())
        v.destroy();
    const b = {
        errorMessage: i?.message || "",
        mappedStack: f.join(`
`),
        sourceContext: d
    };
    return b.timestamp = Date.now(),
    Qa.set(s, b),
    b
}
async function pv(i, l, r) {
    if (r.has(l))
        return r.get(l) || null;
    const s = i.sourceContentFor(l);
    return s ? (r.set(l, s),
    s) : null
}
function yv(i, l, r, s) {
    const c = i.split(`
`);
    let f = l - 1;
    if (f < 0 || f >= c.length)
        return;
    let d = pm(c, f, r);
    if (s && d) {
        const x = s.toLowerCase()
          , E = d.tagName.toLowerCase();
        if (x !== E) {
            const A = rv(c, f, x);
            A && (d = A)
        }
    } else if (!d) {
        const x = uv(c, f, r);
        d = pm(c, x.lineIndex, x.column)
    }
    if (!d)
        return;
    const {tagName: m, lineIndex: g, columnStart: p, closeLineIndex: b, closeColumnEnd: v, isSelfClosing: S} = d;
    return {
        tagName: m,
        code: sv(c, g, p, b, v),
        context: c.slice(g, b + 1).join(`
`),
        startLine: g + 1,
        endLine: b + 1,
        isSelfClosing: S
    }
}
class vv {
    client;
    originalConsoleError;
    constructor() {
        const l = Hy();
        l.length > 0 && l.forEach(r => {
            r.type === "console.error" ? this.handleConsoleError(r.args) : r.type === "runtime" && this.handleError(r.args)
        }
        ),
        this.client = new ka(window.parent),
        this.originalConsoleError = console.error,
        this.initErrorHandlers()
    }
    initErrorHandlers() {
        window.addEventListener("error", this.handleError.bind(this)),
        window.addEventListener("unhandledrejection", this.handlePromiseRejection.bind(this)),
        this.interceptConsoleError()
    }
    async handleError(l) {
        const r = l.target;
        if (!(r && r instanceof HTMLElement && r.tagName && ["IMG", "SCRIPT", "LINK", "VIDEO", "AUDIO", "SOURCE", "IFRAME"].includes(r.tagName)) && l.error && l.error.stack)
            try {
                const s = await Zl(l.error);
                this.sendError(s)
            } catch (s) {
                console.warn("Failed to map error stack:", s)
            }
    }
    async handlePromiseRejection(l) {
        const r = l.reason instanceof Error ? l.reason : new Error(String(l.reason));
        if (r.stack)
            try {
                const s = await Zl(r);
                this.sendError(s)
            } catch (s) {
                console.warn("Failed to map promise rejection stack:", s)
            }
    }
    interceptConsoleError() {
        console.error = (...l) => {
            this.originalConsoleError.apply(console, l);
            const r = l.find(s => s instanceof Error);
            if (r && r.stack)
                this.handleConsoleError(r);
            else if (l.length > 0) {
                const s = l.map(f => typeof f == "object" ? JSON.stringify(f) : String(f)).join(" ")
                  , c = new Error(s);
                this.handleConsoleError(c)
            }
        }
    }
    async handleConsoleError(l) {
        try {
            const r = await Zl(l);
            this.sendError(r)
        } catch (r) {
            console.warn("Failed to map console error stack:", r)
        }
    }
    reportError(l) {
        this.handleReactError(l)
    }
    async handleReactError(l) {
        try {
            const r = await Zl(l);
            this.sendError(r)
        } catch (r) {
            console.warn("Failed to map React error stack:", r)
        }
    }
    async sendError(l) {
        if (!l) {
            console.warn("error is too many");
            return
        }
        if (l.sourceContext.length !== 0)
            try {
                await this.client.post("runtime-error", l)
            } catch (r) {
                console.warn("Failed to send error to parent:", r)
            }
    }
    destroy() {
        console.error = this.originalConsoleError,
        this.client.destroy()
    }
}
function bv() {
    const i = new vv;
    return window.runtimeErrorCollector = i,
    i
}
class xv {
    _client;
    constructor() {
        this._client = new ka(window.parent),
        this._domContentLoadedListener()
    }
    _domContentLoadedListener() {
        const l = () => {
            console.log("DOMContentLoaded"),
            this._client.post("DOMContentLoaded"),
            document.removeEventListener("DOMContentLoaded", l)
        }
        ;
        document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", l) : (console.log("DOMContentLoaded"),
        this._client.post("DOMContentLoaded"))
    }
}
function Sv() {
    return new xv
}
const Vo = i => {
    const l = "/preview/b1b3bb04-634a-436e-a6b8-70bfe20f98ab/7313310";
    return i.startsWith(l) ? i.replaceAll(l, "") || "/" : i || "/"
}
  , Ev = "modulepreload"
  , wv = function(i) {
    return "/preview/b1b3bb04-634a-436e-a6b8-70bfe20f98ab/7313310/" + i
}
  , ym = {}
  , jg = function(l, r, s) {
    let c = Promise.resolve();
    if (r && r.length > 0) {
        let p = function(b) {
            return Promise.all(b.map(v => Promise.resolve(v).then(S => ({
                status: "fulfilled",
                value: S
            }), S => ({
                status: "rejected",
                reason: S
            }))))
        };
        var d = p;
        document.getElementsByTagName("link");
        const m = document.querySelector("meta[property=csp-nonce]")
          , g = m?.nonce || m?.getAttribute("nonce");
        c = p(r.map(b => {
            if (b = wv(b),
            b in ym)
                return;
            ym[b] = !0;
            const v = b.endsWith(".css")
              , S = v ? '[rel="stylesheet"]' : "";
            if (document.querySelector(`link[href="${b}"]${S}`))
                return;
            const x = document.createElement("link");
            if (x.rel = v ? "stylesheet" : Ev,
            v || (x.as = "script"),
            x.crossOrigin = "",
            x.href = b,
            g && x.setAttribute("nonce", g),
            document.head.appendChild(x),
            v)
                return new Promise( (E, A) => {
                    x.addEventListener("load", E),
                    x.addEventListener("error", () => A(new Error(`Unable to preload CSS for ${b}`)))
                }
                )
        }
        ))
    }
    function f(m) {
        const g = new Event("vite:preloadError",{
            cancelable: !0
        });
        if (g.payload = m,
        window.dispatchEvent(g),
        !g.defaultPrevented)
            throw m
    }
    return c.then(m => {
        for (const g of m || [])
            g.status === "rejected" && f(g.reason);
        return l().catch(f)
    }
    )
};
async function _v() {
    await await jg( () => Promise.resolve().then( () => jx), []).then(l => l.navigatePromise).catch(l => (console.error(l),
    Promise.resolve( () => {}
    ))),
    window.REACT_APP_ROUTER = {
        push: (l, r) => {
            window.REACT_APP_NAVIGATE(l, r)
        }
        ,
        replace: (l, r, s) => {
            window.REACT_APP_NAVIGATE(l, {
                replace: !0,
                ...s
            })
        }
        ,
        forward: () => {
            window.REACT_APP_NAVIGATE(1)
        }
        ,
        back: () => {
            window.REACT_APP_NAVIGATE(-1)
        }
        ,
        refresh: () => {
            window.REACT_APP_NAVIGATE(0)
        }
        ,
        prefetch: (l, r) => {
            window.REACT_APP_NAVIGATE(l, r)
        }
    }
}
const zg = new Promise(i => {
    _v().then( () => {
        i(window.REACT_APP_ROUTER)
    }
    )
}
)
  , Qo = () => window.REACT_APP_ROUTER
  , Xo = new ka(window.parent)
  , Mo = async (i, l) => {
    await Xo.post("routeWillChange", {
        next: Vo(i)
    }, l)
}
;
function Cv(i) {
    const l = document.querySelector(i);
    l && l.scrollIntoView({
        behavior: "smooth"
    })
}
function Tv() {
    const i = window.open;
    return window.open = function(l, r, s) {
        return l && typeof l == "string" && l.startsWith("#") ? (Cv(l),
        null) : (i(l, "_blank", s),
        null)
    }
    ,
    () => {
        window.open = i
    }
}
function Ov() {
    const i = async l => {
        const s = l.target.closest("a");
        if (!s || s.tagName !== "A")
            return;
        const c = s.getAttribute("href");
        if (c && !["#", "javascript:void(0)", ""].includes(c) && !c.startsWith("#")) {
            if (l.preventDefault(),
            c.startsWith("/")) {
                const f = Qo();
                await Mo(c, {
                    timeout: 500
                });
                const d = Vo(c);
                f.push(d);
                return
            }
            window.open(s.href, "_blank")
        }
    }
    ;
    return window.addEventListener("click", i, !0),
    () => {
        window.removeEventListener("click", i, !0)
    }
}
const vm = i => i.startsWith("http://") || i.startsWith("https://");
function Av(i) {
    return !i || typeof i != "string" ? !1 : i.indexOf("accounts.google.com") !== -1 || i.indexOf("googleapis.com/oauth") !== -1 || i.indexOf("/auth/") !== -1 && i.indexOf("provider=google") !== -1
}
function Rv() {
    const i = () => {
        const l = Qo()
          , r = l.push;
        l.push = async function(c, f, d) {
            return vm(c) ? (window.open(c, "_blank"),
            Promise.resolve(!1)) : (await Mo(c, {
                timeout: 500
            }),
            r.call(this, c, f, d))
        }
        ;
        const s = l.replace;
        l.replace = async function(c, f, d) {
            return vm(c) ? (window.open(c, "_blank"),
            Promise.resolve(!1)) : (await Mo(c, {
                timeout: 500
            }),
            s.call(this, c, f, d))
        }
    }
    ;
    return window.addEventListener("load", i),
    () => {
        window.removeEventListener("load", i)
    }
}
function Nv() {
    if (!("navigation"in window))
        return () => {}
        ;
    const i = l => {
        Av(l.destination.url) && Xo.post("google-auth-blocked", {
            url: l.destination.url || ""
        })
    }
    ;
    return window.navigation.addEventListener("navigate", i),
    () => {
        window.navigation.removeEventListener("navigate", i)
    }
}
async function Lv() {
    await zg;
    const i = Tv()
      , l = Ov()
      , r = Rv()
      , s = Nv();
    return () => {
        Xo.destroy(),
        i(),
        l(),
        r(),
        s()
    }
}
async function Mv() {
    const i = await jg( () => Promise.resolve().then( () => Lx), void 0).then(f => f.default).catch(f => []);
    let l = []
      , r = 0;
    function s(f, d) {
        const {path: m="", children: g, index: p} = f;
        r++;
        const b = p === !0 || m === ""
          , v = m && m[0] === "/"
          , S = b ? d.path : `${d.path}/${m}`
          , x = v && !b ? m : S
          , E = {
            id: r,
            parentId: d.id,
            path: "/" + x.split("/").filter(Boolean).join("/")
        };
        /\*/.test(E.path) || l.push(E),
        g && g.forEach(A => s(A, E))
    }
    i.forEach(f => s(f, {
        id: 0,
        path: ""
    }));
    const c = new Set;
    return l = l.filter(f => c.has(f.path) ? !1 : (c.add(f.path),
    !0)),
    l
}
async function jv() {
    const i = new ka(window.parent)
      , l = await Mv();
    window.REACT_APP_ROUTES = l,
    i.post("routes", {
        routes: l
    }),
    i.on("getRouteInfo", async v => l),
    await zg,
    i.on("routeAction", async v => {
        const S = Qo()
          , {action: x, route: E} = v;
        switch (x) {
        case "goForward":
            S.forward();
            break;
        case "goBack":
            S.back();
            break;
        case "refresh":
            S.refresh();
            break;
        case "goTo":
            E && S.push(E);
            break;
        default:
            console.warn("Unknown action:", x)
        }
    }
    );
    function r() {
        const v = window.history.state?.index ?? 0
          , S = window.history.length > v + 1
          , x = v > 0
          , E = window.location.pathname;
        i.post("updateNavigationState", {
            canGoForward: S,
            canGoBack: x,
            currentRoute: Vo(E)
        })
    }
    function s() {
        const v = new MutationObserver(x => {
            x.forEach(E => {
                (E.type === "childList" || E.type === "characterData") && i.post("titleChanged", {
                    title: document.title
                })
            }
            )
        }
        )
          , S = document.querySelector("title");
        return i.post("titleChanged", {
            title: document.title
        }),
        S && v.observe(S, {
            childList: !0,
            characterData: !0,
            subtree: !0
        }),
        v
    }
    let c = s();
    function f() {
        c.disconnect(),
        setTimeout( () => {
            c = s()
        }
        , 100)
    }
    const d = window.history.pushState
      , m = window.history.replaceState
      , g = window.history.go
      , p = window.history.back
      , b = window.history.forward;
    return window.history.pushState = function(v, S, x) {
        d.apply(this, arguments),
        r(),
        f()
    }
    ,
    window.history.replaceState = function(v, S, x) {
        m.apply(this, arguments),
        r(),
        f()
    }
    ,
    window.history.go = function(v) {
        g.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    window.history.back = function() {
        p.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    window.history.forward = function() {
        b.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    {
        destroy: () => {
            i.destroy(),
            c.disconnect()
        }
    }
}
var go = {
    exports: {}
}
  , ie = {};
var bm;
function zv() {
    if (bm)
        return ie;
    bm = 1;
    var i = Symbol.for("react.transitional.element")
      , l = Symbol.for("react.portal")
      , r = Symbol.for("react.fragment")
      , s = Symbol.for("react.strict_mode")
      , c = Symbol.for("react.profiler")
      , f = Symbol.for("react.consumer")
      , d = Symbol.for("react.context")
      , m = Symbol.for("react.forward_ref")
      , g = Symbol.for("react.suspense")
      , p = Symbol.for("react.memo")
      , b = Symbol.for("react.lazy")
      , v = Symbol.for("react.activity")
      , S = Symbol.iterator;
    function x(T) {
        return T === null || typeof T != "object" ? null : (T = S && T[S] || T["@@iterator"],
        typeof T == "function" ? T : null)
    }
    var E = {
        isMounted: function() {
            return !1
        },
        enqueueForceUpdate: function() {},
        enqueueReplaceState: function() {},
        enqueueSetState: function() {}
    }
      , A = Object.assign
      , _ = {};
    function j(T, B, Z) {
        this.props = T,
        this.context = B,
        this.refs = _,
        this.updater = Z || E
    }
    j.prototype.isReactComponent = {},
    j.prototype.setState = function(T, B) {
        if (typeof T != "object" && typeof T != "function" && T != null)
            throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, T, B, "setState")
    }
    ,
    j.prototype.forceUpdate = function(T) {
        this.updater.enqueueForceUpdate(this, T, "forceUpdate")
    }
    ;
    function G() {}
    G.prototype = j.prototype;
    function V(T, B, Z) {
        this.props = T,
        this.context = B,
        this.refs = _,
        this.updater = Z || E
    }
    var J = V.prototype = new G;
    J.constructor = V,
    A(J, j.prototype),
    J.isPureReactComponent = !0;
    var W = Array.isArray;
    function se() {}
    var I = {
        H: null,
        A: null,
        T: null,
        S: null
    }
      , ye = Object.prototype.hasOwnProperty;
    function Ce(T, B, Z) {
        var $ = Z.ref;
        return {
            $$typeof: i,
            type: T,
            key: B,
            ref: $ !== void 0 ? $ : null,
            props: Z
        }
    }
    function Q(T, B) {
        return Ce(T.type, B, T.props)
    }
    function k(T) {
        return typeof T == "object" && T !== null && T.$$typeof === i
    }
    function K(T) {
        var B = {
            "=": "=0",
            ":": "=2"
        };
        return "$" + T.replace(/[=:]/g, function(Z) {
            return B[Z]
        })
    }
    var ne = /\/+/g;
    function oe(T, B) {
        return typeof T == "object" && T !== null && T.key != null ? K("" + T.key) : B.toString(36)
    }
    function fe(T) {
        switch (T.status) {
        case "fulfilled":
            return T.value;
        case "rejected":
            throw T.reason;
        default:
            switch (typeof T.status == "string" ? T.then(se, se) : (T.status = "pending",
            T.then(function(B) {
                T.status === "pending" && (T.status = "fulfilled",
                T.value = B)
            }, function(B) {
                T.status === "pending" && (T.status = "rejected",
                T.reason = B)
            })),
            T.status) {
            case "fulfilled":
                return T.value;
            case "rejected":
                throw T.reason
            }
        }
        throw T
    }
    function D(T, B, Z, $, ue) {
        var de = typeof T;
        (de === "undefined" || de === "boolean") && (T = null);
        var _e = !1;
        if (T === null)
            _e = !0;
        else
            switch (de) {
            case "bigint":
            case "string":
            case "number":
                _e = !0;
                break;
            case "object":
                switch (T.$$typeof) {
                case i:
                case l:
                    _e = !0;
                    break;
                case b:
                    return _e = T._init,
                    D(_e(T._payload), B, Z, $, ue)
                }
            }
        if (_e)
            return ue = ue(T),
            _e = $ === "" ? "." + oe(T, 0) : $,
            W(ue) ? (Z = "",
            _e != null && (Z = _e.replace(ne, "$&/") + "/"),
            D(ue, B, Z, "", function(Ka) {
                return Ka
            })) : ue != null && (k(ue) && (ue = Q(ue, Z + (ue.key == null || T && T.key === ue.key ? "" : ("" + ue.key).replace(ne, "$&/") + "/") + _e)),
            B.push(ue)),
            1;
        _e = 0;
        var nt = $ === "" ? "." : $ + ":";
        if (W(T))
            for (var He = 0; He < T.length; He++)
                $ = T[He],
                de = nt + oe($, He),
                _e += D($, B, Z, de, ue);
        else if (He = x(T),
        typeof He == "function")
            for (T = He.call(T),
            He = 0; !($ = T.next()).done; )
                $ = $.value,
                de = nt + oe($, He++),
                _e += D($, B, Z, de, ue);
        else if (de === "object") {
            if (typeof T.then == "function")
                return D(fe(T), B, Z, $, ue);
            throw B = String(T),
            Error("Objects are not valid as a React child (found: " + (B === "[object Object]" ? "object with keys {" + Object.keys(T).join(", ") + "}" : B) + "). If you meant to render a collection of children, use an array instead.")
        }
        return _e
    }
    function X(T, B, Z) {
        if (T == null)
            return T;
        var $ = []
          , ue = 0;
        return D(T, $, "", "", function(de) {
            return B.call(Z, de, ue++)
        }),
        $
    }
    function te(T) {
        if (T._status === -1) {
            var B = T._result;
            B = B(),
            B.then(function(Z) {
                (T._status === 0 || T._status === -1) && (T._status = 1,
                T._result = Z)
            }, function(Z) {
                (T._status === 0 || T._status === -1) && (T._status = 2,
                T._result = Z)
            }),
            T._status === -1 && (T._status = 0,
            T._result = B)
        }
        if (T._status === 1)
            return T._result.default;
        throw T._result
    }
    var be = typeof reportError == "function" ? reportError : function(T) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var B = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof T == "object" && T !== null && typeof T.message == "string" ? String(T.message) : String(T),
                error: T
            });
            if (!window.dispatchEvent(B))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", T);
            return
        }
        console.error(T)
    }
      , we = {
        map: X,
        forEach: function(T, B, Z) {
            X(T, function() {
                B.apply(this, arguments)
            }, Z)
        },
        count: function(T) {
            var B = 0;
            return X(T, function() {
                B++
            }),
            B
        },
        toArray: function(T) {
            return X(T, function(B) {
                return B
            }) || []
        },
        only: function(T) {
            if (!k(T))
                throw Error("React.Children.only expected to receive a single React element child.");
            return T
        }
    };
    return ie.Activity = v,
    ie.Children = we,
    ie.Component = j,
    ie.Fragment = r,
    ie.Profiler = c,
    ie.PureComponent = V,
    ie.StrictMode = s,
    ie.Suspense = g,
    ie.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = I,
    ie.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(T) {
            return I.H.useMemoCache(T)
        }
    },
    ie.cache = function(T) {
        return function() {
            return T.apply(null, arguments)
        }
    }
    ,
    ie.cacheSignal = function() {
        return null
    }
    ,
    ie.cloneElement = function(T, B, Z) {
        if (T == null)
            throw Error("The argument must be a React element, but you passed " + T + ".");
        var $ = A({}, T.props)
          , ue = T.key;
        if (B != null)
            for (de in B.key !== void 0 && (ue = "" + B.key),
            B)
                !ye.call(B, de) || de === "key" || de === "__self" || de === "__source" || de === "ref" && B.ref === void 0 || ($[de] = B[de]);
        var de = arguments.length - 2;
        if (de === 1)
            $.children = Z;
        else if (1 < de) {
            for (var _e = Array(de), nt = 0; nt < de; nt++)
                _e[nt] = arguments[nt + 2];
            $.children = _e
        }
        return Ce(T.type, ue, $)
    }
    ,
    ie.createContext = function(T) {
        return T = {
            $$typeof: d,
            _currentValue: T,
            _currentValue2: T,
            _threadCount: 0,
            Provider: null,
            Consumer: null
        },
        T.Provider = T,
        T.Consumer = {
            $$typeof: f,
            _context: T
        },
        T
    }
    ,
    ie.createElement = function(T, B, Z) {
        var $, ue = {}, de = null;
        if (B != null)
            for ($ in B.key !== void 0 && (de = "" + B.key),
            B)
                ye.call(B, $) && $ !== "key" && $ !== "__self" && $ !== "__source" && (ue[$] = B[$]);
        var _e = arguments.length - 2;
        if (_e === 1)
            ue.children = Z;
        else if (1 < _e) {
            for (var nt = Array(_e), He = 0; He < _e; He++)
                nt[He] = arguments[He + 2];
            ue.children = nt
        }
        if (T && T.defaultProps)
            for ($ in _e = T.defaultProps,
            _e)
                ue[$] === void 0 && (ue[$] = _e[$]);
        return Ce(T, de, ue)
    }
    ,
    ie.createRef = function() {
        return {
            current: null
        }
    }
    ,
    ie.forwardRef = function(T) {
        return {
            $$typeof: m,
            render: T
        }
    }
    ,
    ie.isValidElement = k,
    ie.lazy = function(T) {
        return {
            $$typeof: b,
            _payload: {
                _status: -1,
                _result: T
            },
            _init: te
        }
    }
    ,
    ie.memo = function(T, B) {
        return {
            $$typeof: p,
            type: T,
            compare: B === void 0 ? null : B
        }
    }
    ,
    ie.startTransition = function(T) {
        var B = I.T
          , Z = {};
        I.T = Z;
        try {
            var $ = T()
              , ue = I.S;
            ue !== null && ue(Z, $),
            typeof $ == "object" && $ !== null && typeof $.then == "function" && $.then(se, be)
        } catch (de) {
            be(de)
        } finally {
            B !== null && Z.types !== null && (B.types = Z.types),
            I.T = B
        }
    }
    ,
    ie.unstable_useCacheRefresh = function() {
        return I.H.useCacheRefresh()
    }
    ,
    ie.use = function(T) {
        return I.H.use(T)
    }
    ,
    ie.useActionState = function(T, B, Z) {
        return I.H.useActionState(T, B, Z)
    }
    ,
    ie.useCallback = function(T, B) {
        return I.H.useCallback(T, B)
    }
    ,
    ie.useContext = function(T) {
        return I.H.useContext(T)
    }
    ,
    ie.useDebugValue = function() {}
    ,
    ie.useDeferredValue = function(T, B) {
        return I.H.useDeferredValue(T, B)
    }
    ,
    ie.useEffect = function(T, B) {
        return I.H.useEffect(T, B)
    }
    ,
    ie.useEffectEvent = function(T) {
        return I.H.useEffectEvent(T)
    }
    ,
    ie.useId = function() {
        return I.H.useId()
    }
    ,
    ie.useImperativeHandle = function(T, B, Z) {
        return I.H.useImperativeHandle(T, B, Z)
    }
    ,
    ie.useInsertionEffect = function(T, B) {
        return I.H.useInsertionEffect(T, B)
    }
    ,
    ie.useLayoutEffect = function(T, B) {
        return I.H.useLayoutEffect(T, B)
    }
    ,
    ie.useMemo = function(T, B) {
        return I.H.useMemo(T, B)
    }
    ,
    ie.useOptimistic = function(T, B) {
        return I.H.useOptimistic(T, B)
    }
    ,
    ie.useReducer = function(T, B, Z) {
        return I.H.useReducer(T, B, Z)
    }
    ,
    ie.useRef = function(T) {
        return I.H.useRef(T)
    }
    ,
    ie.useState = function(T) {
        return I.H.useState(T)
    }
    ,
    ie.useSyncExternalStore = function(T, B, Z) {
        return I.H.useSyncExternalStore(T, B, Z)
    }
    ,
    ie.useTransition = function() {
        return I.H.useTransition()
    }
    ,
    ie.version = "19.2.4",
    ie
}
var xm;
function ko() {
    return xm || (xm = 1,
    go.exports = zv()),
    go.exports
}
var U = ko();
const Sm = Ky(U);
var po = {
    exports: {}
}
  , Vl = {};
var Em;
function Dv() {
    if (Em)
        return Vl;
    Em = 1;
    var i = Symbol.for("react.transitional.element")
      , l = Symbol.for("react.fragment");
    function r(s, c, f) {
        var d = null;
        if (f !== void 0 && (d = "" + f),
        c.key !== void 0 && (d = "" + c.key),
        "key"in c) {
            f = {};
            for (var m in c)
                m !== "key" && (f[m] = c[m])
        } else
            f = c;
        return c = f.ref,
        {
            $$typeof: i,
            type: s,
            key: d,
            ref: c !== void 0 ? c : null,
            props: f
        }
    }
    return Vl.Fragment = l,
    Vl.jsx = r,
    Vl.jsxs = r,
    Vl
}
var wm;
function Uv() {
    return wm || (wm = 1,
    po.exports = Dv()),
    po.exports
}
var w = Uv()
  , yo = {
    exports: {}
}
  , Eu = {};
var _m;
function Hv() {
    if (_m)
        return Eu;
    _m = 1;
    var i = Symbol.for("react.fragment");
    return Eu.Fragment = i,
    Eu.jsxDEV = void 0,
    Eu
}
var Cm;
function Bv() {
    return Cm || (Cm = 1,
    yo.exports = Hv()),
    yo.exports
}
var Tm = Bv();
class Dg {
    static getFiberFromDOMNode(l) {
        if (!l)
            return null;
        const r = Object.keys(l).find(s => s.startsWith("__reactFiber$") || s.startsWith("__reactInternalInstance$"));
        return r ? l[r] : null
    }
}
const Ug = new WeakMap
  , Hg = new WeakMap
  , Om = new WeakMap
  , vo = new WeakMap
  , Am = new WeakMap
  , Rm = new WeakMap
  , bo = (i, l) => {
    try {
        Hg.set(i, l);
        const r = Dg.getFiberFromDOMNode(i);
        r && Ug.set(r, l)
    } catch {}
}
  , wu = (i, l) => {
    if (!i)
        return r => {
            r instanceof HTMLElement && bo(r, l)
        }
        ;
    if (typeof i == "function") {
        let r = vo.get(i);
        r || (r = [],
        vo.set(i, r)),
        r.push(l);
        let s = Om.get(i);
        return s || (s = c => {
            if (c instanceof HTMLElement) {
                const f = vo.get(i);
                if (f && f.length > 0) {
                    const d = f.shift();
                    bo(c, d)
                }
            }
            i(c)
        }
        ,
        Om.set(i, s)),
        s
    }
    if (i && typeof i == "object" && "current"in i) {
        Rm.set(i, l);
        let r = Am.get(i);
        return r || (r = s => {
            if (s instanceof HTMLElement) {
                const c = Rm.get(i);
                c && bo(s, c)
            }
            i.current = s
        }
        ,
        Am.set(i, r)),
        r
    }
}
;
function qv() {
    const i = Sm.createElement
      , l = w.jsx
      , r = w.jsxs
      , s = Tm.jsxDEV
      , c = () => {
        const d = new Error;
        return () => d
    }
      , f = d => typeof d == "string";
    Sm.createElement = function(d, m, ...g) {
        if (!f(d) && typeof d != "function")
            return i(d, m, ...g);
        const p = c()
          , b = m ? {
            ...m
        } : {}
          , v = wu(b.ref, p);
        return v && (b.ref = v),
        i(d, b, ...g)
    }
    ,
    w.jsx = function(d, m, g) {
        if (!f(d) && typeof d != "function")
            return l(d, m, g);
        const p = c()
          , b = m ? {
            ...m
        } : {}
          , v = wu(b.ref, p);
        return v && (b.ref = v),
        l(d, b, g)
    }
    ,
    w.jsxs = function(d, m, g) {
        if (!f(d) && typeof d != "function")
            return r(d, m, g);
        const p = c()
          , b = m ? {
            ...m
        } : {}
          , v = wu(b.ref, p);
        return v && (b.ref = v),
        r(d, b, g)
    }
    ,
    s && (Tm.jsxDEV = function(d, m, g, p, b, v) {
        if (!f(d) && typeof d != "function")
            return s(d, m, g, p, b, v);
        const S = c()
          , x = m ? {
            ...m
        } : {}
          , E = wu(x.ref, S);
        return E && (x.ref = E),
        s(d, x, g, p, b, v)
    }
    )
}
function Gv(i) {
    const l = document.querySelector(i);
    if (!l)
        return null;
    const r = l.tagName.toLowerCase()
      , s = Hg.get(l);
    if (s)
        return {
            element: l,
            tagName: r,
            debugError: s()
        };
    const c = Dg.getFiberFromDOMNode(l);
    if (c) {
        const f = Ug.get(c);
        if (f)
            return {
                element: l,
                tagName: r,
                debugError: f()
            }
    }
    return null
}
qv();
function Yv() {
    const i = new WeakMap
      , l = new ka(window.parent);
    return l.on("get-element-source", async ({selector: r}) => {
        const s = Gv(r);
        if (!s)
            return null;
        const {element: c, tagName: f, debugError: d} = s;
        if (i.has(c))
            return i.get(c);
        const m = await Zl(d, 10, f);
        if (!m)
            return null;
        const p = {
            ...m.sourceContext.filter(b => !b.file.includes("node_modules"))[0],
            domInfo: {
                tagName: c.tagName,
                textContent: c.textContent.slice(0, 300)
            }
        };
        return i.set(c, p),
        p
    }
    ),
    () => {
        l.destroy()
    }
}
const Vv = !0;
console.log("Is preview build:", Vv);
async function Qv() {
    Zy(),
    bv(),
    Lv(),
    Sv(),
    jv(),
    Yv()
}
Qv();
const Xv = "phc_V7JMHB0fVJGRu8UHyrsj6pSL1BS76P5zD8qCi7lrTTV"
  , Je = {
    colors: {
        text: "#5D5D5D",
        white: "#FFFFFF",
        border: "rgba(0, 10, 36, 0.08)"
    },
    font: {
        family: '"Geist"',
        weight: "600",
        size: {
            normal: "14px",
            button: "18px"
        },
        lineHeight: "20px"
    },
    button: {
        gradient: "linear-gradient(180deg, #A797FF 0%, #7057FF 100%)"
    },
    shadow: "0px 8px 12px 0px rgba(9, 10, 20, 0.06)",
    zIndex: `${Number.MAX_SAFE_INTEGER}`
}
  , Nm = {
    close: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D303D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>')}`,
    generate: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.87 4.94c.227-.71 1.21-.723 1.456-.02l1.177 3.378 3.101 1.013c.708.231.714 1.216.01 1.455l-3.183 1.082-1.105 3.17c-.245.704-1.23.69-1.455-.02l-.989-3.107-3.367-1.203c-.702-.25-.68-1.234.04-1.455l3.282-1.016 1.043-3.277Z" fill="#FFF"/><path fill-rule="evenodd" d="M12.238 1.3c.167-.667 1.1-.667 1.266 0l.388 1.551 1.55.388c.666.166.667 1.1 0 1.266l-1.55.388-.388 1.55c-.167.666-1.1.667-1.266 0l-.388-1.55-1.55-.388c-.667-.166-.667-1.1 0-1.266l1.55-.388.388-1.551Z" fill="#FFF"/></svg>')}`
}
  , Kl = {
  
  , Lm = {
    en: {
        prefix: "This Website is Made with",
        suffix: ". You can also get one like this in minutes",
        button: "Get one for FREE"
    },
    zh: {
        prefix: "本网站来自",
        suffix: "你也可以在几分钟内拥有同样的页面",
        button: "立即免费拥有"
    }
}
  , kv = () => navigator.language?.toLowerCase().startsWith("zh") ?? !1
  , xo = () => kv() ? Lm.zh : Lm.en
  , Zv = () => window.innerWidth > 768 && !("ontouchstart"in window)
  , Kv = () => {
    const i = window.location.hostname;
 
}
;
function Jv() {
    if (window.posthog)
        return;
    const i = document.createElement("script");
    i.src = Kl.posthogCDN,
    i.async = !0,
    i.onload = () => {
        window.posthog?.init(Xv, {
            api_host: "https://us.i.posthog.com",
            autocapture: !1,
            capture_pageview: !1,
            capture_pageleave: !1,
            disable_session_recording: !0,
            disable_scroll_properties: !0,
            capture_performance: {
                web_vitals: !1
            },
            rageclick: !1,
            loaded: function(l) {
                l.sessionRecording && l.sessionRecording.stopRecording()
            }
        })
    }
    ,
    document.head.appendChild(i)
}
function Mm(i, l) {
    window.posthog?.capture(i, {
        ...l,
        version: 2
    })
}
function Gt(i, l) {
    Object.assign(i.style, l)
}
function So(i, l="0") {
    Gt(i, {
        color: Je.colors.text,
        fontFamily: Je.font.family,
        fontSize: Je.font.size.normal,
        lineHeight: Je.font.lineHeight,
        fontWeight: Je.font.weight,
        whiteSpace: "nowrap",
        marginRight: l
    })
}
function _u(i, l="row") {
    Gt(i, {
        display: "flex",
        flexDirection: l,
        alignItems: "center",
        justifyContent: "center"
    })
}
function $v() {
    if (Kv())
        return;
    
      , l = "b1b3bb04-634a-436e-a6b8-70bfe20f98ab";
    async function r(x) {
        try {
            return !(await (await fetch(`${i}?projectId=${x}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })).json()).data.is_free
        } catch {
            return !0
        }
    }
    function s() {
        document.querySelector('link[rel="icon"]')?.remove();
        const x = document.createElement("link");
        x.type = "image/png",
        x.rel = "icon",
       
        document.head.appendChild(x);
        const E = document.createElement("link");
        E.rel = "stylesheet",
        E.href = Kl.fontStylesheet,
        document.head.appendChild(E)
    }
    function c(x) {
        Mm(x),
       
    function f() {
        const x = document.createElement("div");
        x.id = "close-button",
        Gt(x, {
            position: "absolute",
            top: "-12px",
            right: "-12px",
            width: "32px",
            height: "32px",
            backgroundColor: Je.colors.white,
            borderRadius: "50%",
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: Je.colors.border,
            cursor: "pointer",
            boxShadow: Je.shadow
        }),
        _u(x);
        const E = document.createElement("img");
        return E.src = Nm.close,
        Gt(E, {
            width: "24px",
            height: "24px"
        }),
        x.appendChild(E),
        x.addEventListener("click", A => {
            A.stopPropagation(),
            Mm("watermark_close_button_click"),
            document.getElementById("watermark")?.remove()
        }
        ),
        x
    }
    function d(x) {
        const E = document.createElement("div");
        E.id = "generate-button",
        Gt(E, {
            padding: x ? "8px 16px" : "10px 20px",
            background: Je.button.gradient,
            borderRadius: "999px",
            border: "none",
            gap: "6px",
            cursor: "pointer",
            marginLeft: x ? "12px" : "0",
            whiteSpace: "nowrap",
            width: x ? "auto" : "100%"
        }),
        _u(E);
        const A = document.createElement("img");
        A.src = Nm.generate,
        Gt(A, {
            width: "16px",
            height: "16px",
            flexShrink: "0"
        });
        const _ = document.createElement("span");
        return _.textContent = xo().button,
        Gt(_, {
            color: Je.colors.white,
            fontFamily: Je.font.family,
            fontSize: Je.font.size.button,
            fontWeight: Je.font.weight,
            lineHeight: Je.font.lineHeight
        }),
        E.append(A, _),
        E.addEventListener("click", j => {
            j.stopPropagation(),
            c("watermark_create_button_click")
        }
        ),
        E
    }
    function m() {
        const x = document.createElement("img");
        return x.src = Kl.watermarkLogo,
        Gt(x, {
            width: "92px",
            height: "auto",
            paddingLeft: "8px",
            flexShrink: "0"
        }),
        x
    }
    function g(x) {
        const E = xo()
          , A = document.createElement("div");
        A.textContent = E.prefix,
        So(A);
        const _ = m()
          , j = document.createElement("div");
        j.textContent = E.suffix,
        So(j, "12px"),
        x.append(A, _, j, d(!0))
    }
    function p(x, E) {
        const A = document.createElement("div");
        return A.textContent = x,
        So(A),
        E && Gt(A, E),
        A
    }
    function b(x) {
        const {prefix: E, suffix: A} = xo()
          , [_,j] = A.startsWith(".") ? [".", A.slice(1).trim()] : ["", A]
          , G = document.createElement("div");
        _u(G),
        G.style.marginBottom = "4px",
        G.append(p(E, {
            marginRight: "6px"
        }), m(), ..._ ? [p(_)] : []),
        x.append(G, p(j, {
            textAlign: "center",
            marginBottom: "12px"
        }), d(!1))
    }
    function v() {
        const x = Zv()
          , E = document.createElement("div");
        return E.id = "watermark",
        Gt(E, {
            zIndex: Je.zIndex,
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: x ? "fit-content" : "calc(100% - 32px)",
            maxWidth: x ? "none" : "100%",
            backgroundColor: Je.colors.white,
            borderStyle: "solid",
            borderWidth: "1px",
            borderRadius: x ? "999px" : "36px",
            borderColor: Je.colors.border,
            padding: x ? "12px 20px" : "16px",
            boxShadow: Je.shadow,
            cursor: "pointer"
        }),
        _u(E, x ? "row" : "column"),
        E.appendChild(f()),
        x ? g(E) : b(E),
        E.addEventListener("click", A => {
            A.target.closest("#generate-button, #close-button") || c("watermark_create_button_click")
        }
        ),
        E
    }
    function S(x) {
        const E = document.getElementById("watermark");
        !E && !x ? (document.body.appendChild(v()),
        s(),
        Jv()) : x && E && E.remove()
    }
    r(l).then(S)
}
$v();
const le = i => typeof i == "string"
  , Ql = () => {
    let i, l;
    const r = new Promise( (s, c) => {
        i = s,
        l = c
    }
    );
    return r.resolve = i,
    r.reject = l,
    r
}
  , jm = i => i == null ? "" : "" + i
  , Fv = (i, l, r) => {
    i.forEach(s => {
        l[s] && (r[s] = l[s])
    }
    )
}
  , Wv = /###/g
  , zm = i => i && i.indexOf("###") > -1 ? i.replace(Wv, ".") : i
  , Dm = i => !i || le(i)
  , $l = (i, l, r) => {
    const s = le(l) ? l.split(".") : l;
    let c = 0;
    for (; c < s.length - 1; ) {
        if (Dm(i))
            return {};
        const f = zm(s[c]);
        !i[f] && r && (i[f] = new r),
        Object.prototype.hasOwnProperty.call(i, f) ? i = i[f] : i = {},
        ++c
    }
    return Dm(i) ? {} : {
        obj: i,
        k: zm(s[c])
    }
}
  , Um = (i, l, r) => {
    const {obj: s, k: c} = $l(i, l, Object);
    if (s !== void 0 || l.length === 1) {
        s[c] = r;
        return
    }
    let f = l[l.length - 1]
      , d = l.slice(0, l.length - 1)
      , m = $l(i, d, Object);
    for (; m.obj === void 0 && d.length; )
        f = `${d[d.length - 1]}.${f}`,
        d = d.slice(0, d.length - 1),
        m = $l(i, d, Object),
        m?.obj && typeof m.obj[`${m.k}.${f}`] < "u" && (m.obj = void 0);
    m.obj[`${m.k}.${f}`] = r
}
  , Iv = (i, l, r, s) => {
    const {obj: c, k: f} = $l(i, l, Object);
    c[f] = c[f] || [],
    c[f].push(r)
}
  , Nu = (i, l) => {
    const {obj: r, k: s} = $l(i, l);
    if (r && Object.prototype.hasOwnProperty.call(r, s))
        return r[s]
}
  , Pv = (i, l, r) => {
    const s = Nu(i, r);
    return s !== void 0 ? s : Nu(l, r)
}
  , Bg = (i, l, r) => {
    for (const s in l)
        s !== "__proto__" && s !== "constructor" && (s in i ? le(i[s]) || i[s]instanceof String || le(l[s]) || l[s]instanceof String ? r && (i[s] = l[s]) : Bg(i[s], l[s], r) : i[s] = l[s]);
    return i
}
  , Ga = i => i.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var eb = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
};
const tb = i => le(i) ? i.replace(/[&<>"'\/]/g, l => eb[l]) : i;
class nb {
    constructor(l) {
        this.capacity = l,
        this.regExpMap = new Map,
        this.regExpQueue = []
    }
    getRegExp(l) {
        const r = this.regExpMap.get(l);
        if (r !== void 0)
            return r;
        const s = new RegExp(l);
        return this.regExpQueue.length === this.capacity && this.regExpMap.delete(this.regExpQueue.shift()),
        this.regExpMap.set(l, s),
        this.regExpQueue.push(l),
        s
    }
}
const ab = [" ", ",", "?", "!", ";"]
  , lb = new nb(20)
  , ib = (i, l, r) => {
    l = l || "",
    r = r || "";
    const s = ab.filter(d => l.indexOf(d) < 0 && r.indexOf(d) < 0);
    if (s.length === 0)
        return !0;
    const c = lb.getRegExp(`(${s.map(d => d === "?" ? "\\?" : d).join("|")})`);
    let f = !c.test(i);
    if (!f) {
        const d = i.indexOf(r);
        d > 0 && !c.test(i.substring(0, d)) && (f = !0)
    }
    return f
}
  , jo = (i, l, r=".") => {
    if (!i)
        return;
    if (i[l])
        return Object.prototype.hasOwnProperty.call(i, l) ? i[l] : void 0;
    const s = l.split(r);
    let c = i;
    for (let f = 0; f < s.length; ) {
        if (!c || typeof c != "object")
            return;
        let d, m = "";
        for (let g = f; g < s.length; ++g)
            if (g !== f && (m += r),
            m += s[g],
            d = c[m],
            d !== void 0) {
                if (["string", "number", "boolean"].indexOf(typeof d) > -1 && g < s.length - 1)
                    continue;
                f += g - f + 1;
                break
            }
        c = d
    }
    return c
}
  , Fl = i => i?.replace("_", "-")
  , ub = {
    type: "logger",
    log(i) {
        this.output("log", i)
    },
    warn(i) {
        this.output("warn", i)
    },
    error(i) {
        this.output("error", i)
    },
    output(i, l) {
        console?.[i]?.apply?.(console, l)
    }
};
class Lu {
    constructor(l, r={}) {
        this.init(l, r)
    }
    init(l, r={}) {
        this.prefix = r.prefix || "i18next:",
        this.logger = l || ub,
        this.options = r,
        this.debug = r.debug
    }
    log(...l) {
        return this.forward(l, "log", "", !0)
    }
    warn(...l) {
        return this.forward(l, "warn", "", !0)
    }
    error(...l) {
        return this.forward(l, "error", "")
    }
    deprecate(...l) {
        return this.forward(l, "warn", "WARNING DEPRECATED: ", !0)
    }
    forward(l, r, s, c) {
        return c && !this.debug ? null : (le(l[0]) && (l[0] = `${s}${this.prefix} ${l[0]}`),
        this.logger[r](l))
    }
    create(l) {
        return new Lu(this.logger,{
            prefix: `${this.prefix}:${l}:`,
            ...this.options
        })
    }
    clone(l) {
        return l = l || this.options,
        l.prefix = l.prefix || this.prefix,
        new Lu(this.logger,l)
    }
}
var Yt = new Lu;
class Du {
    constructor() {
        this.observers = {}
    }
    on(l, r) {
        return l.split(" ").forEach(s => {
            this.observers[s] || (this.observers[s] = new Map);
            const c = this.observers[s].get(r) || 0;
            this.observers[s].set(r, c + 1)
        }
        ),
        this
    }
    off(l, r) {
        if (this.observers[l]) {
            if (!r) {
                delete this.observers[l];
                return
            }
            this.observers[l].delete(r)
        }
    }
    emit(l, ...r) {
        this.observers[l] && Array.from(this.observers[l].entries()).forEach( ([c,f]) => {
            for (let d = 0; d < f; d++)
                c(...r)
        }
        ),
        this.observers["*"] && Array.from(this.observers["*"].entries()).forEach( ([c,f]) => {
            for (let d = 0; d < f; d++)
                c.apply(c, [l, ...r])
        }
        )
    }
}
class Hm extends Du {
    constructor(l, r={
        ns: ["translation"],
        defaultNS: "translation"
    }) {
        super(),
        this.data = l || {},
        this.options = r,
        this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
        this.options.ignoreJSONStructure === void 0 && (this.options.ignoreJSONStructure = !0)
    }
    addNamespaces(l) {
        this.options.ns.indexOf(l) < 0 && this.options.ns.push(l)
    }
    removeNamespaces(l) {
        const r = this.options.ns.indexOf(l);
        r > -1 && this.options.ns.splice(r, 1)
    }
    getResource(l, r, s, c={}) {
        const f = c.keySeparator !== void 0 ? c.keySeparator : this.options.keySeparator
          , d = c.ignoreJSONStructure !== void 0 ? c.ignoreJSONStructure : this.options.ignoreJSONStructure;
        let m;
        l.indexOf(".") > -1 ? m = l.split(".") : (m = [l, r],
        s && (Array.isArray(s) ? m.push(...s) : le(s) && f ? m.push(...s.split(f)) : m.push(s)));
        const g = Nu(this.data, m);
        return !g && !r && !s && l.indexOf(".") > -1 && (l = m[0],
        r = m[1],
        s = m.slice(2).join(".")),
        g || !d || !le(s) ? g : jo(this.data?.[l]?.[r], s, f)
    }
    addResource(l, r, s, c, f={
        silent: !1
    }) {
        const d = f.keySeparator !== void 0 ? f.keySeparator : this.options.keySeparator;
        let m = [l, r];
        s && (m = m.concat(d ? s.split(d) : s)),
        l.indexOf(".") > -1 && (m = l.split("."),
        c = r,
        r = m[1]),
        this.addNamespaces(r),
        Um(this.data, m, c),
        f.silent || this.emit("added", l, r, s, c)
    }
    addResources(l, r, s, c={
        silent: !1
    }) {
        for (const f in s)
            (le(s[f]) || Array.isArray(s[f])) && this.addResource(l, r, f, s[f], {
                silent: !0
            });
        c.silent || this.emit("added", l, r, s)
    }
    addResourceBundle(l, r, s, c, f, d={
        silent: !1,
        skipCopy: !1
    }) {
        let m = [l, r];
        l.indexOf(".") > -1 && (m = l.split("."),
        c = s,
        s = r,
        r = m[1]),
        this.addNamespaces(r);
        let g = Nu(this.data, m) || {};
        d.skipCopy || (s = JSON.parse(JSON.stringify(s))),
        c ? Bg(g, s, f) : g = {
            ...g,
            ...s
        },
        Um(this.data, m, g),
        d.silent || this.emit("added", l, r, s)
    }
    removeResourceBundle(l, r) {
        this.hasResourceBundle(l, r) && delete this.data[l][r],
        this.removeNamespaces(r),
        this.emit("removed", l, r)
    }
    hasResourceBundle(l, r) {
        return this.getResource(l, r) !== void 0
    }
    getResourceBundle(l, r) {
        return r || (r = this.options.defaultNS),
        this.getResource(l, r)
    }
    getDataByLanguage(l) {
        return this.data[l]
    }
    hasLanguageSomeTranslations(l) {
        const r = this.getDataByLanguage(l);
        return !!(r && Object.keys(r) || []).find(c => r[c] && Object.keys(r[c]).length > 0)
    }
    toJSON() {
        return this.data
    }
}
var qg = {
    processors: {},
    addPostProcessor(i) {
        this.processors[i.name] = i
    },
    handle(i, l, r, s, c) {
        return i.forEach(f => {
            l = this.processors[f]?.process(l, r, s, c) ?? l
        }
        ),
        l
    }
};
const Gg = Symbol("i18next/PATH_KEY");
function rb() {
    const i = []
      , l = Object.create(null);
    let r;
    return l.get = (s, c) => (r?.revoke?.(),
    c === Gg ? i : (i.push(c),
    r = Proxy.revocable(s, l),
    r.proxy)),
    Proxy.revocable(Object.create(null), l).proxy
}
function zo(i, l) {
    const {[Gg]: r} = i(rb());
    return r.join(l?.keySeparator ?? ".")
}
const Bm = {}
  , qm = i => !le(i) && typeof i != "boolean" && typeof i != "number";
class Mu extends Du {
    constructor(l, r={}) {
        super(),
        Fv(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], l, this),
        this.options = r,
        this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
        this.logger = Yt.create("translator")
    }
    changeLanguage(l) {
        l && (this.language = l)
    }
    exists(l, r={
        interpolation: {}
    }) {
        const s = {
            ...r
        };
        return l == null ? !1 : this.resolve(l, s)?.res !== void 0
    }
    extractFromKey(l, r) {
        let s = r.nsSeparator !== void 0 ? r.nsSeparator : this.options.nsSeparator;
        s === void 0 && (s = ":");
        const c = r.keySeparator !== void 0 ? r.keySeparator : this.options.keySeparator;
        let f = r.ns || this.options.defaultNS || [];
        const d = s && l.indexOf(s) > -1
          , m = !this.options.userDefinedKeySeparator && !r.keySeparator && !this.options.userDefinedNsSeparator && !r.nsSeparator && !ib(l, s, c);
        if (d && !m) {
            const g = l.match(this.interpolator.nestingRegexp);
            if (g && g.length > 0)
                return {
                    key: l,
                    namespaces: le(f) ? [f] : f
                };
            const p = l.split(s);
            (s !== c || s === c && this.options.ns.indexOf(p[0]) > -1) && (f = p.shift()),
            l = p.join(c)
        }
        return {
            key: l,
            namespaces: le(f) ? [f] : f
        }
    }
    translate(l, r, s) {
        let c = typeof r == "object" ? {
            ...r
        } : r;
        if (typeof c != "object" && this.options.overloadTranslationOptionHandler && (c = this.options.overloadTranslationOptionHandler(arguments)),
        typeof options == "object" && (c = {
            ...c
        }),
        c || (c = {}),
        l == null)
            return "";
        typeof l == "function" && (l = zo(l, c)),
        Array.isArray(l) || (l = [String(l)]);
        const f = c.returnDetails !== void 0 ? c.returnDetails : this.options.returnDetails
          , d = c.keySeparator !== void 0 ? c.keySeparator : this.options.keySeparator
          , {key: m, namespaces: g} = this.extractFromKey(l[l.length - 1], c)
          , p = g[g.length - 1];
        let b = c.nsSeparator !== void 0 ? c.nsSeparator : this.options.nsSeparator;
        b === void 0 && (b = ":");
        const v = c.lng || this.language
          , S = c.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
        if (v?.toLowerCase() === "cimode")
            return S ? f ? {
                res: `${p}${b}${m}`,
                usedKey: m,
                exactUsedKey: m,
                usedLng: v,
                usedNS: p,
                usedParams: this.getUsedParamsDetails(c)
            } : `${p}${b}${m}` : f ? {
                res: m,
                usedKey: m,
                exactUsedKey: m,
                usedLng: v,
                usedNS: p,
                usedParams: this.getUsedParamsDetails(c)
            } : m;
        const x = this.resolve(l, c);
        let E = x?.res;
        const A = x?.usedKey || m
          , _ = x?.exactUsedKey || m
          , j = ["[object Number]", "[object Function]", "[object RegExp]"]
          , G = c.joinArrays !== void 0 ? c.joinArrays : this.options.joinArrays
          , V = !this.i18nFormat || this.i18nFormat.handleAsObject
          , J = c.count !== void 0 && !le(c.count)
          , W = Mu.hasDefaultValue(c)
          , se = J ? this.pluralResolver.getSuffix(v, c.count, c) : ""
          , I = c.ordinal && J ? this.pluralResolver.getSuffix(v, c.count, {
            ordinal: !1
        }) : ""
          , ye = J && !c.ordinal && c.count === 0
          , Ce = ye && c[`defaultValue${this.options.pluralSeparator}zero`] || c[`defaultValue${se}`] || c[`defaultValue${I}`] || c.defaultValue;
        let Q = E;
        V && !E && W && (Q = Ce);
        const k = qm(Q)
          , K = Object.prototype.toString.apply(Q);
        if (V && Q && k && j.indexOf(K) < 0 && !(le(G) && Array.isArray(Q))) {
            if (!c.returnObjects && !this.options.returnObjects) {
                this.options.returnedObjectHandler || this.logger.warn("accessing an object - but returnObjects options is not enabled!");
                const ne = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(A, Q, {
                    ...c,
                    ns: g
                }) : `key '${m} (${this.language})' returned an object instead of string.`;
                return f ? (x.res = ne,
                x.usedParams = this.getUsedParamsDetails(c),
                x) : ne
            }
            if (d) {
                const ne = Array.isArray(Q)
                  , oe = ne ? [] : {}
                  , fe = ne ? _ : A;
                for (const D in Q)
                    if (Object.prototype.hasOwnProperty.call(Q, D)) {
                        const X = `${fe}${d}${D}`;
                        W && !E ? oe[D] = this.translate(X, {
                            ...c,
                            defaultValue: qm(Ce) ? Ce[D] : void 0,
                            joinArrays: !1,
                            ns: g
                        }) : oe[D] = this.translate(X, {
                            ...c,
                            joinArrays: !1,
                            ns: g
                        }),
                        oe[D] === X && (oe[D] = Q[D])
                    }
                E = oe
            }
        } else if (V && le(G) && Array.isArray(E))
            E = E.join(G),
            E && (E = this.extendTranslation(E, l, c, s));
        else {
            let ne = !1
              , oe = !1;
            !this.isValidLookup(E) && W && (ne = !0,
            E = Ce),
            this.isValidLookup(E) || (oe = !0,
            E = m);
            const D = (c.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey) && oe ? void 0 : E
              , X = W && Ce !== E && this.options.updateMissing;
            if (oe || ne || X) {
                if (this.logger.log(X ? "updateKey" : "missingKey", v, p, m, X ? Ce : E),
                d) {
                    const T = this.resolve(m, {
                        ...c,
                        keySeparator: !1
                    });
                    T && T.res && this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.")
                }
                let te = [];
                const be = this.languageUtils.getFallbackCodes(this.options.fallbackLng, c.lng || this.language);
                if (this.options.saveMissingTo === "fallback" && be && be[0])
                    for (let T = 0; T < be.length; T++)
                        te.push(be[T]);
                else
                    this.options.saveMissingTo === "all" ? te = this.languageUtils.toResolveHierarchy(c.lng || this.language) : te.push(c.lng || this.language);
                const we = (T, B, Z) => {
                    const $ = W && Z !== E ? Z : D;
                    this.options.missingKeyHandler ? this.options.missingKeyHandler(T, p, B, $, X, c) : this.backendConnector?.saveMissing && this.backendConnector.saveMissing(T, p, B, $, X, c),
                    this.emit("missingKey", T, p, B, E)
                }
                ;
                this.options.saveMissing && (this.options.saveMissingPlurals && J ? te.forEach(T => {
                    const B = this.pluralResolver.getSuffixes(T, c);
                    ye && c[`defaultValue${this.options.pluralSeparator}zero`] && B.indexOf(`${this.options.pluralSeparator}zero`) < 0 && B.push(`${this.options.pluralSeparator}zero`),
                    B.forEach(Z => {
                        we([T], m + Z, c[`defaultValue${Z}`] || Ce)
                    }
                    )
                }
                ) : we(te, m, Ce))
            }
            E = this.extendTranslation(E, l, c, x, s),
            oe && E === m && this.options.appendNamespaceToMissingKey && (E = `${p}${b}${m}`),
            (oe || ne) && this.options.parseMissingKeyHandler && (E = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${p}${b}${m}` : m, ne ? E : void 0, c))
        }
        return f ? (x.res = E,
        x.usedParams = this.getUsedParamsDetails(c),
        x) : E
    }
    extendTranslation(l, r, s, c, f) {
        if (this.i18nFormat?.parse)
            l = this.i18nFormat.parse(l, {
                ...this.options.interpolation.defaultVariables,
                ...s
            }, s.lng || this.language || c.usedLng, c.usedNS, c.usedKey, {
                resolved: c
            });
        else if (!s.skipInterpolation) {
            s.interpolation && this.interpolator.init({
                ...s,
                interpolation: {
                    ...this.options.interpolation,
                    ...s.interpolation
                }
            });
            const g = le(l) && (s?.interpolation?.skipOnVariables !== void 0 ? s.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
            let p;
            if (g) {
                const v = l.match(this.interpolator.nestingRegexp);
                p = v && v.length
            }
            let b = s.replace && !le(s.replace) ? s.replace : s;
            if (this.options.interpolation.defaultVariables && (b = {
                ...this.options.interpolation.defaultVariables,
                ...b
            }),
            l = this.interpolator.interpolate(l, b, s.lng || this.language || c.usedLng, s),
            g) {
                const v = l.match(this.interpolator.nestingRegexp)
                  , S = v && v.length;
                p < S && (s.nest = !1)
            }
            !s.lng && c && c.res && (s.lng = this.language || c.usedLng),
            s.nest !== !1 && (l = this.interpolator.nest(l, (...v) => f?.[0] === v[0] && !s.context ? (this.logger.warn(`It seems you are nesting recursively key: ${v[0]} in key: ${r[0]}`),
            null) : this.translate(...v, r), s)),
            s.interpolation && this.interpolator.reset()
        }
        const d = s.postProcess || this.options.postProcess
          , m = le(d) ? [d] : d;
        return l != null && m?.length && s.applyPostProcessor !== !1 && (l = qg.handle(m, l, r, this.options && this.options.postProcessPassResolved ? {
            i18nResolved: {
                ...c,
                usedParams: this.getUsedParamsDetails(s)
            },
            ...s
        } : s, this)),
        l
    }
    resolve(l, r={}) {
        let s, c, f, d, m;
        return le(l) && (l = [l]),
        l.forEach(g => {
            if (this.isValidLookup(s))
                return;
            const p = this.extractFromKey(g, r)
              , b = p.key;
            c = b;
            let v = p.namespaces;
            this.options.fallbackNS && (v = v.concat(this.options.fallbackNS));
            const S = r.count !== void 0 && !le(r.count)
              , x = S && !r.ordinal && r.count === 0
              , E = r.context !== void 0 && (le(r.context) || typeof r.context == "number") && r.context !== ""
              , A = r.lngs ? r.lngs : this.languageUtils.toResolveHierarchy(r.lng || this.language, r.fallbackLng);
            v.forEach(_ => {
                this.isValidLookup(s) || (m = _,
                !Bm[`${A[0]}-${_}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(m) && (Bm[`${A[0]}-${_}`] = !0,
                this.logger.warn(`key "${c}" for languages "${A.join(", ")}" won't get resolved as namespace "${m}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!")),
                A.forEach(j => {
                    if (this.isValidLookup(s))
                        return;
                    d = j;
                    const G = [b];
                    if (this.i18nFormat?.addLookupKeys)
                        this.i18nFormat.addLookupKeys(G, b, j, _, r);
                    else {
                        let J;
                        S && (J = this.pluralResolver.getSuffix(j, r.count, r));
                        const W = `${this.options.pluralSeparator}zero`
                          , se = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                        if (S && (r.ordinal && J.indexOf(se) === 0 && G.push(b + J.replace(se, this.options.pluralSeparator)),
                        G.push(b + J),
                        x && G.push(b + W)),
                        E) {
                            const I = `${b}${this.options.contextSeparator || "_"}${r.context}`;
                            G.push(I),
                            S && (r.ordinal && J.indexOf(se) === 0 && G.push(I + J.replace(se, this.options.pluralSeparator)),
                            G.push(I + J),
                            x && G.push(I + W))
                        }
                    }
                    let V;
                    for (; V = G.pop(); )
                        this.isValidLookup(s) || (f = V,
                        s = this.getResource(j, _, V, r))
                }
                ))
            }
            )
        }
        ),
        {
            res: s,
            usedKey: c,
            exactUsedKey: f,
            usedLng: d,
            usedNS: m
        }
    }
    isValidLookup(l) {
        return l !== void 0 && !(!this.options.returnNull && l === null) && !(!this.options.returnEmptyString && l === "")
    }
    getResource(l, r, s, c={}) {
        return this.i18nFormat?.getResource ? this.i18nFormat.getResource(l, r, s, c) : this.resourceStore.getResource(l, r, s, c)
    }
    getUsedParamsDetails(l={}) {
        const r = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"]
          , s = l.replace && !le(l.replace);
        let c = s ? l.replace : l;
        if (s && typeof l.count < "u" && (c.count = l.count),
        this.options.interpolation.defaultVariables && (c = {
            ...this.options.interpolation.defaultVariables,
            ...c
        }),
        !s) {
            c = {
                ...c
            };
            for (const f of r)
                delete c[f]
        }
        return c
    }
    static hasDefaultValue(l) {
        const r = "defaultValue";
        for (const s in l)
            if (Object.prototype.hasOwnProperty.call(l, s) && r === s.substring(0, r.length) && l[s] !== void 0)
                return !0;
        return !1
    }
}
class Gm {
    constructor(l) {
        this.options = l,
        this.supportedLngs = this.options.supportedLngs || !1,
        this.logger = Yt.create("languageUtils")
    }
    getScriptPartFromCode(l) {
        if (l = Fl(l),
        !l || l.indexOf("-") < 0)
            return null;
        const r = l.split("-");
        return r.length === 2 || (r.pop(),
        r[r.length - 1].toLowerCase() === "x") ? null : this.formatLanguageCode(r.join("-"))
    }
    getLanguagePartFromCode(l) {
        if (l = Fl(l),
        !l || l.indexOf("-") < 0)
            return l;
        const r = l.split("-");
        return this.formatLanguageCode(r[0])
    }
    formatLanguageCode(l) {
        if (le(l) && l.indexOf("-") > -1) {
            let r;
            try {
                r = Intl.getCanonicalLocales(l)[0]
            } catch {}
            return r && this.options.lowerCaseLng && (r = r.toLowerCase()),
            r || (this.options.lowerCaseLng ? l.toLowerCase() : l)
        }
        return this.options.cleanCode || this.options.lowerCaseLng ? l.toLowerCase() : l
    }
    isSupportedCode(l) {
        return (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) && (l = this.getLanguagePartFromCode(l)),
        !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(l) > -1
    }
    getBestMatchFromCodes(l) {
        if (!l)
            return null;
        let r;
        return l.forEach(s => {
            if (r)
                return;
            const c = this.formatLanguageCode(s);
            (!this.options.supportedLngs || this.isSupportedCode(c)) && (r = c)
        }
        ),
        !r && this.options.supportedLngs && l.forEach(s => {
            if (r)
                return;
            const c = this.getScriptPartFromCode(s);
            if (this.isSupportedCode(c))
                return r = c;
            const f = this.getLanguagePartFromCode(s);
            if (this.isSupportedCode(f))
                return r = f;
            r = this.options.supportedLngs.find(d => {
                if (d === f)
                    return d;
                if (!(d.indexOf("-") < 0 && f.indexOf("-") < 0) && (d.indexOf("-") > 0 && f.indexOf("-") < 0 && d.substring(0, d.indexOf("-")) === f || d.indexOf(f) === 0 && f.length > 1))
                    return d
            }
            )
        }
        ),
        r || (r = this.getFallbackCodes(this.options.fallbackLng)[0]),
        r
    }
    getFallbackCodes(l, r) {
        if (!l)
            return [];
        if (typeof l == "function" && (l = l(r)),
        le(l) && (l = [l]),
        Array.isArray(l))
            return l;
        if (!r)
            return l.default || [];
        let s = l[r];
        return s || (s = l[this.getScriptPartFromCode(r)]),
        s || (s = l[this.formatLanguageCode(r)]),
        s || (s = l[this.getLanguagePartFromCode(r)]),
        s || (s = l.default),
        s || []
    }
    toResolveHierarchy(l, r) {
        const s = this.getFallbackCodes((r === !1 ? [] : r) || this.options.fallbackLng || [], l)
          , c = []
          , f = d => {
            d && (this.isSupportedCode(d) ? c.push(d) : this.logger.warn(`rejecting language code not found in supportedLngs: ${d}`))
        }
        ;
        return le(l) && (l.indexOf("-") > -1 || l.indexOf("_") > -1) ? (this.options.load !== "languageOnly" && f(this.formatLanguageCode(l)),
        this.options.load !== "languageOnly" && this.options.load !== "currentOnly" && f(this.getScriptPartFromCode(l)),
        this.options.load !== "currentOnly" && f(this.getLanguagePartFromCode(l))) : le(l) && f(this.formatLanguageCode(l)),
        s.forEach(d => {
            c.indexOf(d) < 0 && f(this.formatLanguageCode(d))
        }
        ),
        c
    }
}
const Ym = {
    zero: 0,
    one: 1,
    two: 2,
    few: 3,
    many: 4,
    other: 5
}
  , Vm = {
    select: i => i === 1 ? "one" : "other",
    resolvedOptions: () => ({
        pluralCategories: ["one", "other"]
    })
};
class sb {
    constructor(l, r={}) {
        this.languageUtils = l,
        this.options = r,
        this.logger = Yt.create("pluralResolver"),
        this.pluralRulesCache = {}
    }
    addRule(l, r) {
        this.rules[l] = r
    }
    clearCache() {
        this.pluralRulesCache = {}
    }
    getRule(l, r={}) {
        const s = Fl(l === "dev" ? "en" : l)
          , c = r.ordinal ? "ordinal" : "cardinal"
          , f = JSON.stringify({
            cleanedCode: s,
            type: c
        });
        if (f in this.pluralRulesCache)
            return this.pluralRulesCache[f];
        let d;
        try {
            d = new Intl.PluralRules(s,{
                type: c
            })
        } catch {
            if (!Intl)
                return this.logger.error("No Intl support, please use an Intl polyfill!"),
                Vm;
            if (!l.match(/-|_/))
                return Vm;
            const g = this.languageUtils.getLanguagePartFromCode(l);
            d = this.getRule(g, r)
        }
        return this.pluralRulesCache[f] = d,
        d
    }
    needsPlural(l, r={}) {
        let s = this.getRule(l, r);
        return s || (s = this.getRule("dev", r)),
        s?.resolvedOptions().pluralCategories.length > 1
    }
    getPluralFormsOfKey(l, r, s={}) {
        return this.getSuffixes(l, s).map(c => `${r}${c}`)
    }
    getSuffixes(l, r={}) {
        let s = this.getRule(l, r);
        return s || (s = this.getRule("dev", r)),
        s ? s.resolvedOptions().pluralCategories.sort( (c, f) => Ym[c] - Ym[f]).map(c => `${this.options.prepend}${r.ordinal ? `ordinal${this.options.prepend}` : ""}${c}`) : []
    }
    getSuffix(l, r, s={}) {
        const c = this.getRule(l, s);
        return c ? `${this.options.prepend}${s.ordinal ? `ordinal${this.options.prepend}` : ""}${c.select(r)}` : (this.logger.warn(`no plural rule found for: ${l}`),
        this.getSuffix("dev", r, s))
    }
}
const Qm = (i, l, r, s=".", c=!0) => {
    let f = Pv(i, l, r);
    return !f && c && le(r) && (f = jo(i, r, s),
    f === void 0 && (f = jo(l, r, s))),
    f
}
  , Eo = i => i.replace(/\$/g, "$$$$");
class ob {
    constructor(l={}) {
        this.logger = Yt.create("interpolator"),
        this.options = l,
        this.format = l?.interpolation?.format || (r => r),
        this.init(l)
    }
    init(l={}) {
        l.interpolation || (l.interpolation = {
            escapeValue: !0
        });
        const {escape: r, escapeValue: s, useRawValueToEscape: c, prefix: f, prefixEscaped: d, suffix: m, suffixEscaped: g, formatSeparator: p, unescapeSuffix: b, unescapePrefix: v, nestingPrefix: S, nestingPrefixEscaped: x, nestingSuffix: E, nestingSuffixEscaped: A, nestingOptionsSeparator: _, maxReplaces: j, alwaysFormat: G} = l.interpolation;
        this.escape = r !== void 0 ? r : tb,
        this.escapeValue = s !== void 0 ? s : !0,
        this.useRawValueToEscape = c !== void 0 ? c : !1,
        this.prefix = f ? Ga(f) : d || "{{",
        this.suffix = m ? Ga(m) : g || "}}",
        this.formatSeparator = p || ",",
        this.unescapePrefix = b ? "" : v || "-",
        this.unescapeSuffix = this.unescapePrefix ? "" : b || "",
        this.nestingPrefix = S ? Ga(S) : x || Ga("$t("),
        this.nestingSuffix = E ? Ga(E) : A || Ga(")"),
        this.nestingOptionsSeparator = _ || ",",
        this.maxReplaces = j || 1e3,
        this.alwaysFormat = G !== void 0 ? G : !1,
        this.resetRegExp()
    }
    reset() {
        this.options && this.init(this.options)
    }
    resetRegExp() {
        const l = (r, s) => r?.source === s ? (r.lastIndex = 0,
        r) : new RegExp(s,"g");
        this.regexp = l(this.regexp, `${this.prefix}(.+?)${this.suffix}`),
        this.regexpUnescape = l(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`),
        this.nestingRegexp = l(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`)
    }
    interpolate(l, r, s, c) {
        let f, d, m;
        const g = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {}
          , p = x => {
            if (x.indexOf(this.formatSeparator) < 0) {
                const j = Qm(r, g, x, this.options.keySeparator, this.options.ignoreJSONStructure);
                return this.alwaysFormat ? this.format(j, void 0, s, {
                    ...c,
                    ...r,
                    interpolationkey: x
                }) : j
            }
            const E = x.split(this.formatSeparator)
              , A = E.shift().trim()
              , _ = E.join(this.formatSeparator).trim();
            return this.format(Qm(r, g, A, this.options.keySeparator, this.options.ignoreJSONStructure), _, s, {
                ...c,
                ...r,
                interpolationkey: A
            })
        }
        ;
        this.resetRegExp();
        const b = c?.missingInterpolationHandler || this.options.missingInterpolationHandler
          , v = c?.interpolation?.skipOnVariables !== void 0 ? c.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
        return [{
            regex: this.regexpUnescape,
            safeValue: x => Eo(x)
        }, {
            regex: this.regexp,
            safeValue: x => this.escapeValue ? Eo(this.escape(x)) : Eo(x)
        }].forEach(x => {
            for (m = 0; f = x.regex.exec(l); ) {
                const E = f[1].trim();
                if (d = p(E),
                d === void 0)
                    if (typeof b == "function") {
                        const _ = b(l, f, c);
                        d = le(_) ? _ : ""
                    } else if (c && Object.prototype.hasOwnProperty.call(c, E))
                        d = "";
                    else if (v) {
                        d = f[0];
                        continue
                    } else
                        this.logger.warn(`missed to pass in variable ${E} for interpolating ${l}`),
                        d = "";
                else
                    !le(d) && !this.useRawValueToEscape && (d = jm(d));
                const A = x.safeValue(d);
                if (l = l.replace(f[0], A),
                v ? (x.regex.lastIndex += d.length,
                x.regex.lastIndex -= f[0].length) : x.regex.lastIndex = 0,
                m++,
                m >= this.maxReplaces)
                    break
            }
        }
        ),
        l
    }
    nest(l, r, s={}) {
        let c, f, d;
        const m = (g, p) => {
            const b = this.nestingOptionsSeparator;
            if (g.indexOf(b) < 0)
                return g;
            const v = g.split(new RegExp(`${b}[ ]*{`));
            let S = `{${v[1]}`;
            g = v[0],
            S = this.interpolate(S, d);
            const x = S.match(/'/g)
              , E = S.match(/"/g);
            ((x?.length ?? 0) % 2 === 0 && !E || E.length % 2 !== 0) && (S = S.replace(/'/g, '"'));
            try {
                d = JSON.parse(S),
                p && (d = {
                    ...p,
                    ...d
                })
            } catch (A) {
                return this.logger.warn(`failed parsing options string in nesting for key ${g}`, A),
                `${g}${b}${S}`
            }
            return d.defaultValue && d.defaultValue.indexOf(this.prefix) > -1 && delete d.defaultValue,
            g
        }
        ;
        for (; c = this.nestingRegexp.exec(l); ) {
            let g = [];
            d = {
                ...s
            },
            d = d.replace && !le(d.replace) ? d.replace : d,
            d.applyPostProcessor = !1,
            delete d.defaultValue;
            const p = /{.*}/.test(c[1]) ? c[1].lastIndexOf("}") + 1 : c[1].indexOf(this.formatSeparator);
            if (p !== -1 && (g = c[1].slice(p).split(this.formatSeparator).map(b => b.trim()).filter(Boolean),
            c[1] = c[1].slice(0, p)),
            f = r(m.call(this, c[1].trim(), d), d),
            f && c[0] === l && !le(f))
                return f;
            le(f) || (f = jm(f)),
            f || (this.logger.warn(`missed to resolve ${c[1]} for nesting ${l}`),
            f = ""),
            g.length && (f = g.reduce( (b, v) => this.format(b, v, s.lng, {
                ...s,
                interpolationkey: c[1].trim()
            }), f.trim())),
            l = l.replace(c[0], f),
            this.regexp.lastIndex = 0
        }
        return l
    }
}
const cb = i => {
    let l = i.toLowerCase().trim();
    const r = {};
    if (i.indexOf("(") > -1) {
        const s = i.split("(");
        l = s[0].toLowerCase().trim();
        const c = s[1].substring(0, s[1].length - 1);
        l === "currency" && c.indexOf(":") < 0 ? r.currency || (r.currency = c.trim()) : l === "relativetime" && c.indexOf(":") < 0 ? r.range || (r.range = c.trim()) : c.split(";").forEach(d => {
            if (d) {
                const [m,...g] = d.split(":")
                  , p = g.join(":").trim().replace(/^'+|'+$/g, "")
                  , b = m.trim();
                r[b] || (r[b] = p),
                p === "false" && (r[b] = !1),
                p === "true" && (r[b] = !0),
                isNaN(p) || (r[b] = parseInt(p, 10))
            }
        }
        )
    }
    return {
        formatName: l,
        formatOptions: r
    }
}
  , Xm = i => {
    const l = {};
    return (r, s, c) => {
        let f = c;
        c && c.interpolationkey && c.formatParams && c.formatParams[c.interpolationkey] && c[c.interpolationkey] && (f = {
            ...f,
            [c.interpolationkey]: void 0
        });
        const d = s + JSON.stringify(f);
        let m = l[d];
        return m || (m = i(Fl(s), c),
        l[d] = m),
        m(r)
    }
}
  , fb = i => (l, r, s) => i(Fl(r), s)(l);
class db {
    constructor(l={}) {
        this.logger = Yt.create("formatter"),
        this.options = l,
        this.init(l)
    }
    init(l, r={
        interpolation: {}
    }) {
        this.formatSeparator = r.interpolation.formatSeparator || ",";
        const s = r.cacheInBuiltFormats ? Xm : fb;
        this.formats = {
            number: s( (c, f) => {
                const d = new Intl.NumberFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            ),
            currency: s( (c, f) => {
                const d = new Intl.NumberFormat(c,{
                    ...f,
                    style: "currency"
                });
                return m => d.format(m)
            }
            ),
            datetime: s( (c, f) => {
                const d = new Intl.DateTimeFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            ),
            relativetime: s( (c, f) => {
                const d = new Intl.RelativeTimeFormat(c,{
                    ...f
                });
                return m => d.format(m, f.range || "day")
            }
            ),
            list: s( (c, f) => {
                const d = new Intl.ListFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            )
        }
    }
    add(l, r) {
        this.formats[l.toLowerCase().trim()] = r
    }
    addCached(l, r) {
        this.formats[l.toLowerCase().trim()] = Xm(r)
    }
    format(l, r, s, c={}) {
        const f = r.split(this.formatSeparator);
        if (f.length > 1 && f[0].indexOf("(") > 1 && f[0].indexOf(")") < 0 && f.find(m => m.indexOf(")") > -1)) {
            const m = f.findIndex(g => g.indexOf(")") > -1);
            f[0] = [f[0], ...f.splice(1, m)].join(this.formatSeparator)
        }
        return f.reduce( (m, g) => {
            const {formatName: p, formatOptions: b} = cb(g);
            if (this.formats[p]) {
                let v = m;
                try {
                    const S = c?.formatParams?.[c.interpolationkey] || {}
                      , x = S.locale || S.lng || c.locale || c.lng || s;
                    v = this.formats[p](m, x, {
                        ...b,
                        ...c,
                        ...S
                    })
                } catch (S) {
                    this.logger.warn(S)
                }
                return v
            } else
                this.logger.warn(`there was no format function for ${p}`);
            return m
        }
        , l)
    }
}
const hb = (i, l) => {
    i.pending[l] !== void 0 && (delete i.pending[l],
    i.pendingCount--)
}
;
class mb extends Du {
    constructor(l, r, s, c={}) {
        super(),
        this.backend = l,
        this.store = r,
        this.services = s,
        this.languageUtils = s.languageUtils,
        this.options = c,
        this.logger = Yt.create("backendConnector"),
        this.waitingReads = [],
        this.maxParallelReads = c.maxParallelReads || 10,
        this.readingCalls = 0,
        this.maxRetries = c.maxRetries >= 0 ? c.maxRetries : 5,
        this.retryTimeout = c.retryTimeout >= 1 ? c.retryTimeout : 350,
        this.state = {},
        this.queue = [],
        this.backend?.init?.(s, c.backend, c)
    }
    queueLoad(l, r, s, c) {
        const f = {}
          , d = {}
          , m = {}
          , g = {};
        return l.forEach(p => {
            let b = !0;
            r.forEach(v => {
                const S = `${p}|${v}`;
                !s.reload && this.store.hasResourceBundle(p, v) ? this.state[S] = 2 : this.state[S] < 0 || (this.state[S] === 1 ? d[S] === void 0 && (d[S] = !0) : (this.state[S] = 1,
                b = !1,
                d[S] === void 0 && (d[S] = !0),
                f[S] === void 0 && (f[S] = !0),
                g[v] === void 0 && (g[v] = !0)))
            }
            ),
            b || (m[p] = !0)
        }
        ),
        (Object.keys(f).length || Object.keys(d).length) && this.queue.push({
            pending: d,
            pendingCount: Object.keys(d).length,
            loaded: {},
            errors: [],
            callback: c
        }),
        {
            toLoad: Object.keys(f),
            pending: Object.keys(d),
            toLoadLanguages: Object.keys(m),
            toLoadNamespaces: Object.keys(g)
        }
    }
    loaded(l, r, s) {
        const c = l.split("|")
          , f = c[0]
          , d = c[1];
        r && this.emit("failedLoading", f, d, r),
        !r && s && this.store.addResourceBundle(f, d, s, void 0, void 0, {
            skipCopy: !0
        }),
        this.state[l] = r ? -1 : 2,
        r && s && (this.state[l] = 0);
        const m = {};
        this.queue.forEach(g => {
            Iv(g.loaded, [f], d),
            hb(g, l),
            r && g.errors.push(r),
            g.pendingCount === 0 && !g.done && (Object.keys(g.loaded).forEach(p => {
                m[p] || (m[p] = {});
                const b = g.loaded[p];
                b.length && b.forEach(v => {
                    m[p][v] === void 0 && (m[p][v] = !0)
                }
                )
            }
            ),
            g.done = !0,
            g.errors.length ? g.callback(g.errors) : g.callback())
        }
        ),
        this.emit("loaded", m),
        this.queue = this.queue.filter(g => !g.done)
    }
    read(l, r, s, c=0, f=this.retryTimeout, d) {
        if (!l.length)
            return d(null, {});
        if (this.readingCalls >= this.maxParallelReads) {
            this.waitingReads.push({
                lng: l,
                ns: r,
                fcName: s,
                tried: c,
                wait: f,
                callback: d
            });
            return
        }
        this.readingCalls++;
        const m = (p, b) => {
            if (this.readingCalls--,
            this.waitingReads.length > 0) {
                const v = this.waitingReads.shift();
                this.read(v.lng, v.ns, v.fcName, v.tried, v.wait, v.callback)
            }
            if (p && b && c < this.maxRetries) {
                setTimeout( () => {
                    this.read.call(this, l, r, s, c + 1, f * 2, d)
                }
                , f);
                return
            }
            d(p, b)
        }
          , g = this.backend[s].bind(this.backend);
        if (g.length === 2) {
            try {
                const p = g(l, r);
                p && typeof p.then == "function" ? p.then(b => m(null, b)).catch(m) : m(null, p)
            } catch (p) {
                m(p)
            }
            return
        }
        return g(l, r, m)
    }
    prepareLoading(l, r, s={}, c) {
        if (!this.backend)
            return this.logger.warn("No backend was added via i18next.use. Will not load resources."),
            c && c();
        le(l) && (l = this.languageUtils.toResolveHierarchy(l)),
        le(r) && (r = [r]);
        const f = this.queueLoad(l, r, s, c);
        if (!f.toLoad.length)
            return f.pending.length || c(),
            null;
        f.toLoad.forEach(d => {
            this.loadOne(d)
        }
        )
    }
    load(l, r, s) {
        this.prepareLoading(l, r, {}, s)
    }
    reload(l, r, s) {
        this.prepareLoading(l, r, {
            reload: !0
        }, s)
    }
    loadOne(l, r="") {
        const s = l.split("|")
          , c = s[0]
          , f = s[1];
        this.read(c, f, "read", void 0, void 0, (d, m) => {
            d && this.logger.warn(`${r}loading namespace ${f} for language ${c} failed`, d),
            !d && m && this.logger.log(`${r}loaded namespace ${f} for language ${c}`, m),
            this.loaded(l, d, m)
        }
        )
    }
    saveMissing(l, r, s, c, f, d={}, m= () => {}
    ) {
        if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(r)) {
            this.logger.warn(`did not save key "${s}" as the namespace "${r}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
            return
        }
        if (!(s == null || s === "")) {
            if (this.backend?.create) {
                const g = {
                    ...d,
                    isUpdate: f
                }
                  , p = this.backend.create.bind(this.backend);
                if (p.length < 6)
                    try {
                        let b;
                        p.length === 5 ? b = p(l, r, s, c, g) : b = p(l, r, s, c),
                        b && typeof b.then == "function" ? b.then(v => m(null, v)).catch(m) : m(null, b)
                    } catch (b) {
                        m(b)
                    }
                else
                    p(l, r, s, c, m, g)
            }
            !l || !l[0] || this.store.addResource(l[0], r, s, c)
        }
    }
}
const km = () => ({
    debug: !1,
    initAsync: !0,
    ns: ["translation"],
    defaultNS: ["translation"],
    fallbackLng: ["dev"],
    fallbackNS: !1,
    supportedLngs: !1,
    nonExplicitSupportedLngs: !1,
    load: "all",
    preload: !1,
    simplifyPluralSuffix: !0,
    keySeparator: ".",
    nsSeparator: ":",
    pluralSeparator: "_",
    contextSeparator: "_",
    partialBundledLanguages: !1,
    saveMissing: !1,
    updateMissing: !1,
    saveMissingTo: "fallback",
    saveMissingPlurals: !0,
    missingKeyHandler: !1,
    missingInterpolationHandler: !1,
    postProcess: !1,
    postProcessPassResolved: !1,
    returnNull: !1,
    returnEmptyString: !0,
    returnObjects: !1,
    joinArrays: !1,
    returnedObjectHandler: !1,
    parseMissingKeyHandler: !1,
    appendNamespaceToMissingKey: !1,
    appendNamespaceToCIMode: !1,
    overloadTranslationOptionHandler: i => {
        let l = {};
        if (typeof i[1] == "object" && (l = i[1]),
        le(i[1]) && (l.defaultValue = i[1]),
        le(i[2]) && (l.tDescription = i[2]),
        typeof i[2] == "object" || typeof i[3] == "object") {
            const r = i[3] || i[2];
            Object.keys(r).forEach(s => {
                l[s] = r[s]
            }
            )
        }
        return l
    }
    ,
    interpolation: {
        escapeValue: !0,
        format: i => i,
        prefix: "{{",
        suffix: "}}",
        formatSeparator: ",",
        unescapePrefix: "-",
        nestingPrefix: "$t(",
        nestingSuffix: ")",
        nestingOptionsSeparator: ",",
        maxReplaces: 1e3,
        skipOnVariables: !0
    },
    cacheInBuiltFormats: !0
})
  , Zm = i => (le(i.ns) && (i.ns = [i.ns]),
le(i.fallbackLng) && (i.fallbackLng = [i.fallbackLng]),
le(i.fallbackNS) && (i.fallbackNS = [i.fallbackNS]),
i.supportedLngs?.indexOf?.("cimode") < 0 && (i.supportedLngs = i.supportedLngs.concat(["cimode"])),
typeof i.initImmediate == "boolean" && (i.initAsync = i.initImmediate),
i)
  , Cu = () => {}
  , gb = i => {
    Object.getOwnPropertyNames(Object.getPrototypeOf(i)).forEach(r => {
        typeof i[r] == "function" && (i[r] = i[r].bind(i))
    }
    )
}
;
class Wl extends Du {
    constructor(l={}, r) {
        if (super(),
        this.options = Zm(l),
        this.services = {},
        this.logger = Yt,
        this.modules = {
            external: []
        },
        gb(this),
        r && !this.isInitialized && !l.isClone) {
            if (!this.options.initAsync)
                return this.init(l, r),
                this;
            setTimeout( () => {
                this.init(l, r)
            }
            , 0)
        }
    }
    init(l={}, r) {
        this.isInitializing = !0,
        typeof l == "function" && (r = l,
        l = {}),
        l.defaultNS == null && l.ns && (le(l.ns) ? l.defaultNS = l.ns : l.ns.indexOf("translation") < 0 && (l.defaultNS = l.ns[0]));
        const s = km();
        this.options = {
            ...s,
            ...this.options,
            ...Zm(l)
        },
        this.options.interpolation = {
            ...s.interpolation,
            ...this.options.interpolation
        },
        l.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = l.keySeparator),
        l.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = l.nsSeparator);
        const c = p => p ? typeof p == "function" ? new p : p : null;
        if (!this.options.isClone) {
            this.modules.logger ? Yt.init(c(this.modules.logger), this.options) : Yt.init(null, this.options);
            let p;
            this.modules.formatter ? p = this.modules.formatter : p = db;
            const b = new Gm(this.options);
            this.store = new Hm(this.options.resources,this.options);
            const v = this.services;
            v.logger = Yt,
            v.resourceStore = this.store,
            v.languageUtils = b,
            v.pluralResolver = new sb(b,{
                prepend: this.options.pluralSeparator,
                simplifyPluralSuffix: this.options.simplifyPluralSuffix
            }),
            this.options.interpolation.format && this.options.interpolation.format !== s.interpolation.format && this.logger.deprecate("init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting"),
            p && (!this.options.interpolation.format || this.options.interpolation.format === s.interpolation.format) && (v.formatter = c(p),
            v.formatter.init && v.formatter.init(v, this.options),
            this.options.interpolation.format = v.formatter.format.bind(v.formatter)),
            v.interpolator = new ob(this.options),
            v.utils = {
                hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
            },
            v.backendConnector = new mb(c(this.modules.backend),v.resourceStore,v,this.options),
            v.backendConnector.on("*", (x, ...E) => {
                this.emit(x, ...E)
            }
            ),
            this.modules.languageDetector && (v.languageDetector = c(this.modules.languageDetector),
            v.languageDetector.init && v.languageDetector.init(v, this.options.detection, this.options)),
            this.modules.i18nFormat && (v.i18nFormat = c(this.modules.i18nFormat),
            v.i18nFormat.init && v.i18nFormat.init(this)),
            this.translator = new Mu(this.services,this.options),
            this.translator.on("*", (x, ...E) => {
                this.emit(x, ...E)
            }
            ),
            this.modules.external.forEach(x => {
                x.init && x.init(this)
            }
            )
        }
        if (this.format = this.options.interpolation.format,
        r || (r = Cu),
        this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
            const p = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
            p.length > 0 && p[0] !== "dev" && (this.options.lng = p[0])
        }
        !this.services.languageDetector && !this.options.lng && this.logger.warn("init: no languageDetector is used and no lng is defined"),
        ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"].forEach(p => {
            this[p] = (...b) => this.store[p](...b)
        }
        ),
        ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"].forEach(p => {
            this[p] = (...b) => (this.store[p](...b),
            this)
        }
        );
        const m = Ql()
          , g = () => {
            const p = (b, v) => {
                this.isInitializing = !1,
                this.isInitialized && !this.initializedStoreOnce && this.logger.warn("init: i18next is already initialized. You should call init just once!"),
                this.isInitialized = !0,
                this.options.isClone || this.logger.log("initialized", this.options),
                this.emit("initialized", this.options),
                m.resolve(v),
                r(b, v)
            }
            ;
            if (this.languages && !this.isInitialized)
                return p(null, this.t.bind(this));
            this.changeLanguage(this.options.lng, p)
        }
        ;
        return this.options.resources || !this.options.initAsync ? g() : setTimeout(g, 0),
        m
    }
    loadResources(l, r=Cu) {
        let s = r;
        const c = le(l) ? l : this.language;
        if (typeof l == "function" && (s = l),
        !this.options.resources || this.options.partialBundledLanguages) {
            if (c?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0))
                return s();
            const f = []
              , d = m => {
                if (!m || m === "cimode")
                    return;
                this.services.languageUtils.toResolveHierarchy(m).forEach(p => {
                    p !== "cimode" && f.indexOf(p) < 0 && f.push(p)
                }
                )
            }
            ;
            c ? d(c) : this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach(g => d(g)),
            this.options.preload?.forEach?.(m => d(m)),
            this.services.backendConnector.load(f, this.options.ns, m => {
                !m && !this.resolvedLanguage && this.language && this.setResolvedLanguage(this.language),
                s(m)
            }
            )
        } else
            s(null)
    }
    reloadResources(l, r, s) {
        const c = Ql();
        return typeof l == "function" && (s = l,
        l = void 0),
        typeof r == "function" && (s = r,
        r = void 0),
        l || (l = this.languages),
        r || (r = this.options.ns),
        s || (s = Cu),
        this.services.backendConnector.reload(l, r, f => {
            c.resolve(),
            s(f)
        }
        ),
        c
    }
    use(l) {
        if (!l)
            throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
        if (!l.type)
            throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
        return l.type === "backend" && (this.modules.backend = l),
        (l.type === "logger" || l.log && l.warn && l.error) && (this.modules.logger = l),
        l.type === "languageDetector" && (this.modules.languageDetector = l),
        l.type === "i18nFormat" && (this.modules.i18nFormat = l),
        l.type === "postProcessor" && qg.addPostProcessor(l),
        l.type === "formatter" && (this.modules.formatter = l),
        l.type === "3rdParty" && this.modules.external.push(l),
        this
    }
    setResolvedLanguage(l) {
        if (!(!l || !this.languages) && !(["cimode", "dev"].indexOf(l) > -1)) {
            for (let r = 0; r < this.languages.length; r++) {
                const s = this.languages[r];
                if (!(["cimode", "dev"].indexOf(s) > -1) && this.store.hasLanguageSomeTranslations(s)) {
                    this.resolvedLanguage = s;
                    break
                }
            }
            !this.resolvedLanguage && this.languages.indexOf(l) < 0 && this.store.hasLanguageSomeTranslations(l) && (this.resolvedLanguage = l,
            this.languages.unshift(l))
        }
    }
    changeLanguage(l, r) {
        this.isLanguageChangingTo = l;
        const s = Ql();
        this.emit("languageChanging", l);
        const c = m => {
            this.language = m,
            this.languages = this.services.languageUtils.toResolveHierarchy(m),
            this.resolvedLanguage = void 0,
            this.setResolvedLanguage(m)
        }
          , f = (m, g) => {
            g ? this.isLanguageChangingTo === l && (c(g),
            this.translator.changeLanguage(g),
            this.isLanguageChangingTo = void 0,
            this.emit("languageChanged", g),
            this.logger.log("languageChanged", g)) : this.isLanguageChangingTo = void 0,
            s.resolve( (...p) => this.t(...p)),
            r && r(m, (...p) => this.t(...p))
        }
          , d = m => {
            !l && !m && this.services.languageDetector && (m = []);
            const g = le(m) ? m : m && m[0]
              , p = this.store.hasLanguageSomeTranslations(g) ? g : this.services.languageUtils.getBestMatchFromCodes(le(m) ? [m] : m);
            p && (this.language || c(p),
            this.translator.language || this.translator.changeLanguage(p),
            this.services.languageDetector?.cacheUserLanguage?.(p)),
            this.loadResources(p, b => {
                f(b, p)
            }
            )
        }
        ;
        return !l && this.services.languageDetector && !this.services.languageDetector.async ? d(this.services.languageDetector.detect()) : !l && this.services.languageDetector && this.services.languageDetector.async ? this.services.languageDetector.detect.length === 0 ? this.services.languageDetector.detect().then(d) : this.services.languageDetector.detect(d) : d(l),
        s
    }
    getFixedT(l, r, s) {
        const c = (f, d, ...m) => {
            let g;
            typeof d != "object" ? g = this.options.overloadTranslationOptionHandler([f, d].concat(m)) : g = {
                ...d
            },
            g.lng = g.lng || c.lng,
            g.lngs = g.lngs || c.lngs,
            g.ns = g.ns || c.ns,
            g.keyPrefix !== "" && (g.keyPrefix = g.keyPrefix || s || c.keyPrefix);
            const p = this.options.keySeparator || ".";
            let b;
            return g.keyPrefix && Array.isArray(f) ? b = f.map(v => (typeof v == "function" && (v = zo(v, d)),
            `${g.keyPrefix}${p}${v}`)) : (typeof f == "function" && (f = zo(f, d)),
            b = g.keyPrefix ? `${g.keyPrefix}${p}${f}` : f),
            this.t(b, g)
        }
        ;
        return le(l) ? c.lng = l : c.lngs = l,
        c.ns = r,
        c.keyPrefix = s,
        c
    }
    t(...l) {
        return this.translator?.translate(...l)
    }
    exists(...l) {
        return this.translator?.exists(...l)
    }
    setDefaultNamespace(l) {
        this.options.defaultNS = l
    }
    hasLoadedNamespace(l, r={}) {
        if (!this.isInitialized)
            return this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages),
            !1;
        if (!this.languages || !this.languages.length)
            return this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages),
            !1;
        const s = r.lng || this.resolvedLanguage || this.languages[0]
          , c = this.options ? this.options.fallbackLng : !1
          , f = this.languages[this.languages.length - 1];
        if (s.toLowerCase() === "cimode")
            return !0;
        const d = (m, g) => {
            const p = this.services.backendConnector.state[`${m}|${g}`];
            return p === -1 || p === 0 || p === 2
        }
        ;
        if (r.precheck) {
            const m = r.precheck(this, d);
            if (m !== void 0)
                return m
        }
        return !!(this.hasResourceBundle(s, l) || !this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages || d(s, l) && (!c || d(f, l)))
    }
    loadNamespaces(l, r) {
        const s = Ql();
        return this.options.ns ? (le(l) && (l = [l]),
        l.forEach(c => {
            this.options.ns.indexOf(c) < 0 && this.options.ns.push(c)
        }
        ),
        this.loadResources(c => {
            s.resolve(),
            r && r(c)
        }
        ),
        s) : (r && r(),
        Promise.resolve())
    }
    loadLanguages(l, r) {
        const s = Ql();
        le(l) && (l = [l]);
        const c = this.options.preload || []
          , f = l.filter(d => c.indexOf(d) < 0 && this.services.languageUtils.isSupportedCode(d));
        return f.length ? (this.options.preload = c.concat(f),
        this.loadResources(d => {
            s.resolve(),
            r && r(d)
        }
        ),
        s) : (r && r(),
        Promise.resolve())
    }
    dir(l) {
        if (l || (l = this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language)),
        !l)
            return "rtl";
        try {
            const c = new Intl.Locale(l);
            if (c && c.getTextInfo) {
                const f = c.getTextInfo();
                if (f && f.direction)
                    return f.direction
            }
        } catch {}
        const r = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"]
          , s = this.services?.languageUtils || new Gm(km());
        return l.toLowerCase().indexOf("-latn") > 1 ? "ltr" : r.indexOf(s.getLanguagePartFromCode(l)) > -1 || l.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr"
    }
    static createInstance(l={}, r) {
        return new Wl(l,r)
    }
    cloneInstance(l={}, r=Cu) {
        const s = l.forkResourceStore;
        s && delete l.forkResourceStore;
        const c = {
            ...this.options,
            ...l,
            isClone: !0
        }
          , f = new Wl(c);
        if ((l.debug !== void 0 || l.prefix !== void 0) && (f.logger = f.logger.clone(l)),
        ["store", "services", "language"].forEach(m => {
            f[m] = this[m]
        }
        ),
        f.services = {
            ...this.services
        },
        f.services.utils = {
            hasLoadedNamespace: f.hasLoadedNamespace.bind(f)
        },
        s) {
            const m = Object.keys(this.store.data).reduce( (g, p) => (g[p] = {
                ...this.store.data[p]
            },
            g[p] = Object.keys(g[p]).reduce( (b, v) => (b[v] = {
                ...g[p][v]
            },
            b), g[p]),
            g), {});
            f.store = new Hm(m,c),
            f.services.resourceStore = f.store
        }
        return f.translator = new Mu(f.services,c),
        f.translator.on("*", (m, ...g) => {
            f.emit(m, ...g)
        }
        ),
        f.init(c, r),
        f.translator.options = c,
        f.translator.backendConnector.services.utils = {
            hasLoadedNamespace: f.hasLoadedNamespace.bind(f)
        },
        f
    }
    toJSON() {
        return {
            options: this.options,
            store: this.store,
            language: this.language,
            languages: this.languages,
            resolvedLanguage: this.resolvedLanguage
        }
    }
}
const et = Wl.createInstance();
et.createInstance = Wl.createInstance;
et.createInstance;
et.dir;
et.init;
et.loadResources;
et.reloadResources;
et.use;
et.changeLanguage;
et.getFixedT;
et.t;
et.exists;
et.setDefaultNamespace;
et.hasLoadedNamespace;
et.loadNamespaces;
et.loadLanguages;
const pb = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g
  , yb = {
    "&amp;": "&",
    "&#38;": "&",
    "&lt;": "<",
    "&#60;": "<",
    "&gt;": ">",
    "&#62;": ">",
    "&apos;": "'",
    "&#39;": "'",
    "&quot;": '"',
    "&#34;": '"',
    "&nbsp;": " ",
    "&#160;": " ",
    "&copy;": "©",
    "&#169;": "©",
    "&reg;": "®",
    "&#174;": "®",
    "&hellip;": "…",
    "&#8230;": "…",
    "&#x2F;": "/",
    "&#47;": "/"
}
  , vb = i => yb[i]
  , bb = i => i.replace(pb, vb);
let Km = {
    bindI18n: "languageChanged",
    bindI18nStore: "",
    transEmptyNodeValue: "",
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: "",
    transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
    useSuspense: !0,
    unescape: bb
};
const xb = (i={}) => {
    Km = {
        ...Km,
        ...i
    }
}
  , Sb = {
    type: "3rdParty",
    init(i) {
        xb(i.options.react)
    }
}
  , Eb = U.createContext();
function wb({i18n: i, defaultNS: l, children: r}) {
    const s = U.useMemo( () => ({
        i18n: i,
        defaultNS: l
    }), [i, l]);
    return U.createElement(Eb.Provider, {
        value: s
    }, r)
}
const {slice: _b, forEach: Cb} = [];
function Tb(i) {
    return Cb.call(_b.call(arguments, 1), l => {
        if (l)
            for (const r in l)
                i[r] === void 0 && (i[r] = l[r])
    }
    ),
    i
}
function Ob(i) {
    return typeof i != "string" ? !1 : [/<\s*script.*?>/i, /<\s*\/\s*script\s*>/i, /<\s*img.*?on\w+\s*=/i, /<\s*\w+\s*on\w+\s*=.*?>/i, /javascript\s*:/i, /vbscript\s*:/i, /expression\s*\(/i, /eval\s*\(/i, /alert\s*\(/i, /document\.cookie/i, /document\.write\s*\(/i, /window\.location/i, /innerHTML/i].some(r => r.test(i))
}
const Jm = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/
  , Ab = function(i, l) {
    const s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
        path: "/"
    }
      , c = encodeURIComponent(l);
    let f = `${i}=${c}`;
    if (s.maxAge > 0) {
        const d = s.maxAge - 0;
        if (Number.isNaN(d))
            throw new Error("maxAge should be a Number");
        f += `; Max-Age=${Math.floor(d)}`
    }
    if (s.domain) {
        if (!Jm.test(s.domain))
            throw new TypeError("option domain is invalid");
        f += `; Domain=${s.domain}`
    }
    if (s.path) {
        if (!Jm.test(s.path))
            throw new TypeError("option path is invalid");
        f += `; Path=${s.path}`
    }
    if (s.expires) {
        if (typeof s.expires.toUTCString != "function")
            throw new TypeError("option expires is invalid");
        f += `; Expires=${s.expires.toUTCString()}`
    }
    if (s.httpOnly && (f += "; HttpOnly"),
    s.secure && (f += "; Secure"),
    s.sameSite)
        switch (typeof s.sameSite == "string" ? s.sameSite.toLowerCase() : s.sameSite) {
        case !0:
            f += "; SameSite=Strict";
            break;
        case "lax":
            f += "; SameSite=Lax";
            break;
        case "strict":
            f += "; SameSite=Strict";
            break;
        case "none":
            f += "; SameSite=None";
            break;
        default:
            throw new TypeError("option sameSite is invalid")
        }
    return s.partitioned && (f += "; Partitioned"),
    f
}
  , $m = {
    create(i, l, r, s) {
        let c = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
            path: "/",
            sameSite: "strict"
        };
        r && (c.expires = new Date,
        c.expires.setTime(c.expires.getTime() + r * 60 * 1e3)),
        s && (c.domain = s),
        document.cookie = Ab(i, l, c)
    },
    read(i) {
        const l = `${i}=`
          , r = document.cookie.split(";");
        for (let s = 0; s < r.length; s++) {
            let c = r[s];
            for (; c.charAt(0) === " "; )
                c = c.substring(1, c.length);
            if (c.indexOf(l) === 0)
                return c.substring(l.length, c.length)
        }
        return null
    },
    remove(i, l) {
        this.create(i, "", -1, l)
    }
};
var Rb = {
    name: "cookie",
    lookup(i) {
        let {lookupCookie: l} = i;
        if (l && typeof document < "u")
            return $m.read(l) || void 0
    },
    cacheUserLanguage(i, l) {
        let {lookupCookie: r, cookieMinutes: s, cookieDomain: c, cookieOptions: f} = l;
        r && typeof document < "u" && $m.create(r, i, s, c, f)
    }
}
  , Nb = {
    name: "querystring",
    lookup(i) {
        let {lookupQuerystring: l} = i, r;
        if (typeof window < "u") {
            let {search: s} = window.location;
            !window.location.search && window.location.hash?.indexOf("?") > -1 && (s = window.location.hash.substring(window.location.hash.indexOf("?")));
            const f = s.substring(1).split("&");
            for (let d = 0; d < f.length; d++) {
                const m = f[d].indexOf("=");
                m > 0 && f[d].substring(0, m) === l && (r = f[d].substring(m + 1))
            }
        }
        return r
    }
}
  , Lb = {
    name: "hash",
    lookup(i) {
        let {lookupHash: l, lookupFromHashIndex: r} = i, s;
        if (typeof window < "u") {
            const {hash: c} = window.location;
            if (c && c.length > 2) {
                const f = c.substring(1);
                if (l) {
                    const d = f.split("&");
                    for (let m = 0; m < d.length; m++) {
                        const g = d[m].indexOf("=");
                        g > 0 && d[m].substring(0, g) === l && (s = d[m].substring(g + 1))
                    }
                }
                if (s)
                    return s;
                if (!s && r > -1) {
                    const d = c.match(/\/([a-zA-Z-]*)/g);
                    return Array.isArray(d) ? d[typeof r == "number" ? r : 0]?.replace("/", "") : void 0
                }
            }
        }
        return s
    }
};
let Ya = null;
const Fm = () => {
    if (Ya !== null)
        return Ya;
    try {
        if (Ya = typeof window < "u" && window.localStorage !== null,
        !Ya)
            return !1;
        const i = "i18next.translate.boo";
        window.localStorage.setItem(i, "foo"),
        window.localStorage.removeItem(i)
    } catch {
        Ya = !1
    }
    return Ya
}
;
var Mb = {
    name: "localStorage",
    lookup(i) {
        let {lookupLocalStorage: l} = i;
        if (l && Fm())
            return window.localStorage.getItem(l) || void 0
    },
    cacheUserLanguage(i, l) {
        let {lookupLocalStorage: r} = l;
        r && Fm() && window.localStorage.setItem(r, i)
    }
};
let Va = null;
const Wm = () => {
    if (Va !== null)
        return Va;
    try {
        if (Va = typeof window < "u" && window.sessionStorage !== null,
        !Va)
            return !1;
        const i = "i18next.translate.boo";
        window.sessionStorage.setItem(i, "foo"),
        window.sessionStorage.removeItem(i)
    } catch {
        Va = !1
    }
    return Va
}
;
var jb = {
    name: "sessionStorage",
    lookup(i) {
        let {lookupSessionStorage: l} = i;
        if (l && Wm())
            return window.sessionStorage.getItem(l) || void 0
    },
    cacheUserLanguage(i, l) {
        let {lookupSessionStorage: r} = l;
        r && Wm() && window.sessionStorage.setItem(r, i)
    }
}
  , zb = {
    name: "navigator",
    lookup(i) {
        const l = [];
        if (typeof navigator < "u") {
            const {languages: r, userLanguage: s, language: c} = navigator;
            if (r)
                for (let f = 0; f < r.length; f++)
                    l.push(r[f]);
            s && l.push(s),
            c && l.push(c)
        }
        return l.length > 0 ? l : void 0
    }
}
  , Db = {
    name: "htmlTag",
    lookup(i) {
        let {htmlTag: l} = i, r;
        const s = l || (typeof document < "u" ? document.documentElement : null);
        return s && typeof s.getAttribute == "function" && (r = s.getAttribute("lang")),
        r
    }
}
  , Ub = {
    name: "path",
    lookup(i) {
        let {lookupFromPathIndex: l} = i;
        if (typeof window > "u")
            return;
        const r = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
        return Array.isArray(r) ? r[typeof l == "number" ? l : 0]?.replace("/", "") : void 0
    }
}
  , Hb = {
    name: "subdomain",
    lookup(i) {
        let {lookupFromSubdomainIndex: l} = i;
        const r = typeof l == "number" ? l + 1 : 1
          , s = typeof window < "u" && window.location?.hostname?.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i);
        if (s)
            return s[r]
    }
};
let Yg = !1;
try {
    document.cookie,
    Yg = !0
} catch {}
const Vg = ["querystring", "cookie", "localStorage", "sessionStorage", "navigator", "htmlTag"];
Yg || Vg.splice(1, 1);
const Bb = () => ({
    order: Vg,
    lookupQuerystring: "lng",
    lookupCookie: "i18next",
    lookupLocalStorage: "i18nextLng",
    lookupSessionStorage: "i18nextLng",
    caches: ["localStorage"],
    excludeCacheFor: ["cimode"],
    convertDetectedLanguage: i => i
});
class Qg {
    constructor(l) {
        let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        this.type = "languageDetector",
        this.detectors = {},
        this.init(l, r)
    }
    init() {
        let l = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {
            languageUtils: {}
        }
          , r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
          , s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        this.services = l,
        this.options = Tb(r, this.options || {}, Bb()),
        typeof this.options.convertDetectedLanguage == "string" && this.options.convertDetectedLanguage.indexOf("15897") > -1 && (this.options.convertDetectedLanguage = c => c.replace("-", "_")),
        this.options.lookupFromUrlIndex && (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
        this.i18nOptions = s,
        this.addDetector(Rb),
        this.addDetector(Nb),
        this.addDetector(Mb),
        this.addDetector(jb),
        this.addDetector(zb),
        this.addDetector(Db),
        this.addDetector(Ub),
        this.addDetector(Hb),
        this.addDetector(Lb)
    }
    addDetector(l) {
        return this.detectors[l.name] = l,
        this
    }
    detect() {
        let l = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.options.order
          , r = [];
        return l.forEach(s => {
            if (this.detectors[s]) {
                let c = this.detectors[s].lookup(this.options);
                c && typeof c == "string" && (c = [c]),
                c && (r = r.concat(c))
            }
        }
        ),
        r = r.filter(s => s != null && !Ob(s)).map(s => this.options.convertDetectedLanguage(s)),
        this.services && this.services.languageUtils && this.services.languageUtils.getBestMatchFromCodes ? r : r.length > 0 ? r[0] : null
    }
    cacheUserLanguage(l) {
        let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.options.caches;
        r && (this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(l) > -1 || r.forEach(s => {
            this.detectors[s] && this.detectors[s].cacheUserLanguage(l, this.options)
        }
        ))
    }
}
Qg.type = "languageDetector";
const Im = Object.assign({})
  , Jl = {};
Object.keys(Im).forEach(i => {
    const l = i.match(/\.\/([^/]+)\/([^/]+)\.ts$/);
    if (l) {
        const [,r] = l
          , s = Im[i];
        Jl[r] || (Jl[r] = {
            translation: {}
        }),
        s.default && (Jl[r].translation = {
            ...Jl[r].translation,
            ...s.default
        })
    }
}
);
et.use(Qg).use(Sb).init({
    lng: "en",
    fallbackLng: "en",
    debug: !1,
    resources: Jl,
    interpolation: {
        escapeValue: !1
    }
});
var wo = {
    exports: {}
}
  , Xl = {}
  , _o = {
    exports: {}
}
  , Co = {};
var Pm;
function qb() {
    return Pm || (Pm = 1,
    (function(i) {
        function l(D, X) {
            var te = D.length;
            D.push(X);
            e: for (; 0 < te; ) {
                var be = te - 1 >>> 1
                  , we = D[be];
                if (0 < c(we, X))
                    D[be] = X,
                    D[te] = we,
                    te = be;
                else
                    break e
            }
        }
        function r(D) {
            return D.length === 0 ? null : D[0]
        }
        function s(D) {
            if (D.length === 0)
                return null;
            var X = D[0]
              , te = D.pop();
            if (te !== X) {
                D[0] = te;
                e: for (var be = 0, we = D.length, T = we >>> 1; be < T; ) {
                    var B = 2 * (be + 1) - 1
                      , Z = D[B]
                      , $ = B + 1
                      , ue = D[$];
                    if (0 > c(Z, te))
                        $ < we && 0 > c(ue, Z) ? (D[be] = ue,
                        D[$] = te,
                        be = $) : (D[be] = Z,
                        D[B] = te,
                        be = B);
                    else if ($ < we && 0 > c(ue, te))
                        D[be] = ue,
                        D[$] = te,
                        be = $;
                    else
                        break e
                }
            }
            return X
        }
        function c(D, X) {
            var te = D.sortIndex - X.sortIndex;
            return te !== 0 ? te : D.id - X.id
        }
        if (i.unstable_now = void 0,
        typeof performance == "object" && typeof performance.now == "function") {
            var f = performance;
            i.unstable_now = function() {
                return f.now()
            }
        } else {
            var d = Date
              , m = d.now();
            i.unstable_now = function() {
                return d.now() - m
            }
        }
        var g = []
          , p = []
          , b = 1
          , v = null
          , S = 3
          , x = !1
          , E = !1
          , A = !1
          , _ = !1
          , j = typeof setTimeout == "function" ? setTimeout : null
          , G = typeof clearTimeout == "function" ? clearTimeout : null
          , V = typeof setImmediate < "u" ? setImmediate : null;
        function J(D) {
            for (var X = r(p); X !== null; ) {
                if (X.callback === null)
                    s(p);
                else if (X.startTime <= D)
                    s(p),
                    X.sortIndex = X.expirationTime,
                    l(g, X);
                else
                    break;
                X = r(p)
            }
        }
        function W(D) {
            if (A = !1,
            J(D),
            !E)
                if (r(g) !== null)
                    E = !0,
                    se || (se = !0,
                    K());
                else {
                    var X = r(p);
                    X !== null && fe(W, X.startTime - D)
                }
        }
        var se = !1
          , I = -1
          , ye = 5
          , Ce = -1;
        function Q() {
            return _ ? !0 : !(i.unstable_now() - Ce < ye)
        }
        function k() {
            if (_ = !1,
            se) {
                var D = i.unstable_now();
                Ce = D;
                var X = !0;
                try {
                    e: {
                        E = !1,
                        A && (A = !1,
                        G(I),
                        I = -1),
                        x = !0;
                        var te = S;
                        try {
                            t: {
                                for (J(D),
                                v = r(g); v !== null && !(v.expirationTime > D && Q()); ) {
                                    var be = v.callback;
                                    if (typeof be == "function") {
                                        v.callback = null,
                                        S = v.priorityLevel;
                                        var we = be(v.expirationTime <= D);
                                        if (D = i.unstable_now(),
                                        typeof we == "function") {
                                            v.callback = we,
                                            J(D),
                                            X = !0;
                                            break t
                                        }
                                        v === r(g) && s(g),
                                        J(D)
                                    } else
                                        s(g);
                                    v = r(g)
                                }
                                if (v !== null)
                                    X = !0;
                                else {
                                    var T = r(p);
                                    T !== null && fe(W, T.startTime - D),
                                    X = !1
                                }
                            }
                            break e
                        } finally {
                            v = null,
                            S = te,
                            x = !1
                        }
                        X = void 0
                    }
                } finally {
                    X ? K() : se = !1
                }
            }
        }
        var K;
        if (typeof V == "function")
            K = function() {
                V(k)
            }
            ;
        else if (typeof MessageChannel < "u") {
            var ne = new MessageChannel
              , oe = ne.port2;
            ne.port1.onmessage = k,
            K = function() {
                oe.postMessage(null)
            }
        } else
            K = function() {
                j(k, 0)
            }
            ;
        function fe(D, X) {
            I = j(function() {
                D(i.unstable_now())
            }, X)
        }
        i.unstable_IdlePriority = 5,
        i.unstable_ImmediatePriority = 1,
        i.unstable_LowPriority = 4,
        i.unstable_NormalPriority = 3,
        i.unstable_Profiling = null,
        i.unstable_UserBlockingPriority = 2,
        i.unstable_cancelCallback = function(D) {
            D.callback = null
        }
        ,
        i.unstable_forceFrameRate = function(D) {
            0 > D || 125 < D ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ye = 0 < D ? Math.floor(1e3 / D) : 5
        }
        ,
        i.unstable_getCurrentPriorityLevel = function() {
            return S
        }
        ,
        i.unstable_next = function(D) {
            switch (S) {
            case 1:
            case 2:
            case 3:
                var X = 3;
                break;
            default:
                X = S
            }
            var te = S;
            S = X;
            try {
                return D()
            } finally {
                S = te
            }
        }
        ,
        i.unstable_requestPaint = function() {
            _ = !0
        }
        ,
        i.unstable_runWithPriority = function(D, X) {
            switch (D) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                break;
            default:
                D = 3
            }
            var te = S;
            S = D;
            try {
                return X()
            } finally {
                S = te
            }
        }
        ,
        i.unstable_scheduleCallback = function(D, X, te) {
            var be = i.unstable_now();
            switch (typeof te == "object" && te !== null ? (te = te.delay,
            te = typeof te == "number" && 0 < te ? be + te : be) : te = be,
            D) {
            case 1:
                var we = -1;
                break;
            case 2:
                we = 250;
                break;
            case 5:
                we = 1073741823;
                break;
            case 4:
                we = 1e4;
                break;
            default:
                we = 5e3
            }
            return we = te + we,
            D = {
                id: b++,
                callback: X,
                priorityLevel: D,
                startTime: te,
                expirationTime: we,
                sortIndex: -1
            },
            te > be ? (D.sortIndex = te,
            l(p, D),
            r(g) === null && D === r(p) && (A ? (G(I),
            I = -1) : A = !0,
            fe(W, te - be))) : (D.sortIndex = we,
            l(g, D),
            E || x || (E = !0,
            se || (se = !0,
            K()))),
            D
        }
        ,
        i.unstable_shouldYield = Q,
        i.unstable_wrapCallback = function(D) {
            var X = S;
            return function() {
                var te = S;
                S = X;
                try {
                    return D.apply(this, arguments)
                } finally {
                    S = te
                }
            }
        }
    }
    )(Co)),
    Co
}
var eg;
function Gb() {
    return eg || (eg = 1,
    _o.exports = qb()),
    _o.exports
}
var To = {
    exports: {}
}
  , tt = {};
var tg;
function Yb() {
    if (tg)
        return tt;
    tg = 1;
    var i = ko();
    function l(g) {
        var p = "https://react.dev/errors/" + g;
        if (1 < arguments.length) {
            p += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var b = 2; b < arguments.length; b++)
                p += "&args[]=" + encodeURIComponent(arguments[b])
        }
        return "Minified React error #" + g + "; visit " + p + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function r() {}
    var s = {
        d: {
            f: r,
            r: function() {
                throw Error(l(522))
            },
            D: r,
            C: r,
            L: r,
            m: r,
            X: r,
            S: r,
            M: r
        },
        p: 0,
        findDOMNode: null
    }
      , c = Symbol.for("react.portal");
    function f(g, p, b) {
        var v = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
            $$typeof: c,
            key: v == null ? null : "" + v,
            children: g,
            containerInfo: p,
            implementation: b
        }
    }
    var d = i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function m(g, p) {
        if (g === "font")
            return "";
        if (typeof p == "string")
            return p === "use-credentials" ? p : ""
    }
    return tt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = s,
    tt.createPortal = function(g, p) {
        var b = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!p || p.nodeType !== 1 && p.nodeType !== 9 && p.nodeType !== 11)
            throw Error(l(299));
        return f(g, p, null, b)
    }
    ,
    tt.flushSync = function(g) {
        var p = d.T
          , b = s.p;
        try {
            if (d.T = null,
            s.p = 2,
            g)
                return g()
        } finally {
            d.T = p,
            s.p = b,
            s.d.f()
        }
    }
    ,
    tt.preconnect = function(g, p) {
        typeof g == "string" && (p ? (p = p.crossOrigin,
        p = typeof p == "string" ? p === "use-credentials" ? p : "" : void 0) : p = null,
        s.d.C(g, p))
    }
    ,
    tt.prefetchDNS = function(g) {
        typeof g == "string" && s.d.D(g)
    }
    ,
    tt.preinit = function(g, p) {
        if (typeof g == "string" && p && typeof p.as == "string") {
            var b = p.as
              , v = m(b, p.crossOrigin)
              , S = typeof p.integrity == "string" ? p.integrity : void 0
              , x = typeof p.fetchPriority == "string" ? p.fetchPriority : void 0;
            b === "style" ? s.d.S(g, typeof p.precedence == "string" ? p.precedence : void 0, {
                crossOrigin: v,
                integrity: S,
                fetchPriority: x
            }) : b === "script" && s.d.X(g, {
                crossOrigin: v,
                integrity: S,
                fetchPriority: x,
                nonce: typeof p.nonce == "string" ? p.nonce : void 0
            })
        }
    }
    ,
    tt.preinitModule = function(g, p) {
        if (typeof g == "string")
            if (typeof p == "object" && p !== null) {
                if (p.as == null || p.as === "script") {
                    var b = m(p.as, p.crossOrigin);
                    s.d.M(g, {
                        crossOrigin: b,
                        integrity: typeof p.integrity == "string" ? p.integrity : void 0,
                        nonce: typeof p.nonce == "string" ? p.nonce : void 0
                    })
                }
            } else
                p == null && s.d.M(g)
    }
    ,
    tt.preload = function(g, p) {
        if (typeof g == "string" && typeof p == "object" && p !== null && typeof p.as == "string") {
            var b = p.as
              , v = m(b, p.crossOrigin);
            s.d.L(g, b, {
                crossOrigin: v,
                integrity: typeof p.integrity == "string" ? p.integrity : void 0,
                nonce: typeof p.nonce == "string" ? p.nonce : void 0,
                type: typeof p.type == "string" ? p.type : void 0,
                fetchPriority: typeof p.fetchPriority == "string" ? p.fetchPriority : void 0,
                referrerPolicy: typeof p.referrerPolicy == "string" ? p.referrerPolicy : void 0,
                imageSrcSet: typeof p.imageSrcSet == "string" ? p.imageSrcSet : void 0,
                imageSizes: typeof p.imageSizes == "string" ? p.imageSizes : void 0,
                media: typeof p.media == "string" ? p.media : void 0
            })
        }
    }
    ,
    tt.preloadModule = function(g, p) {
        if (typeof g == "string")
            if (p) {
                var b = m(p.as, p.crossOrigin);
                s.d.m(g, {
                    as: typeof p.as == "string" && p.as !== "script" ? p.as : void 0,
                    crossOrigin: b,
                    integrity: typeof p.integrity == "string" ? p.integrity : void 0
                })
            } else
                s.d.m(g)
    }
    ,
    tt.requestFormReset = function(g) {
        s.d.r(g)
    }
    ,
    tt.unstable_batchedUpdates = function(g, p) {
        return g(p)
    }
    ,
    tt.useFormState = function(g, p, b) {
        return d.H.useFormState(g, p, b)
    }
    ,
    tt.useFormStatus = function() {
        return d.H.useHostTransitionStatus()
    }
    ,
    tt.version = "19.2.4",
    tt
}
var ng;
function Vb() {
    if (ng)
        return To.exports;
    ng = 1;
    function i() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i)
            } catch (l) {
                console.error(l)
            }
    }
    return i(),
    To.exports = Yb(),
    To.exports
}
var ag;
function Qb() {
    if (ag)
        return Xl;
    ag = 1;
    var i = Gb()
      , l = ko()
      , r = Vb();
    function s(e) {
        var t = "https://react.dev/errors/" + e;
        if (1 < arguments.length) {
            t += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var n = 2; n < arguments.length; n++)
                t += "&args[]=" + encodeURIComponent(arguments[n])
        }
        return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function c(e) {
        return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
    }
    function f(e) {
        var t = e
          , n = e;
        if (e.alternate)
            for (; t.return; )
                t = t.return;
        else {
            e = t;
            do
                t = e,
                (t.flags & 4098) !== 0 && (n = t.return),
                e = t.return;
            while (e)
        }
        return t.tag === 3 ? n : null
    }
    function d(e) {
        if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function m(e) {
        if (e.tag === 31) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function g(e) {
        if (f(e) !== e)
            throw Error(s(188))
    }
    function p(e) {
        var t = e.alternate;
        if (!t) {
            if (t = f(e),
            t === null)
                throw Error(s(188));
            return t !== e ? null : e
        }
        for (var n = e, a = t; ; ) {
            var u = n.return;
            if (u === null)
                break;
            var o = u.alternate;
            if (o === null) {
                if (a = u.return,
                a !== null) {
                    n = a;
                    continue
                }
                break
            }
            if (u.child === o.child) {
                for (o = u.child; o; ) {
                    if (o === n)
                        return g(u),
                        e;
                    if (o === a)
                        return g(u),
                        t;
                    o = o.sibling
                }
                throw Error(s(188))
            }
            if (n.return !== a.return)
                n = u,
                a = o;
            else {
                for (var h = !1, y = u.child; y; ) {
                    if (y === n) {
                        h = !0,
                        n = u,
                        a = o;
                        break
                    }
                    if (y === a) {
                        h = !0,
                        a = u,
                        n = o;
                        break
                    }
                    y = y.sibling
                }
                if (!h) {
                    for (y = o.child; y; ) {
                        if (y === n) {
                            h = !0,
                            n = o,
                            a = u;
                            break
                        }
                        if (y === a) {
                            h = !0,
                            a = o,
                            n = u;
                            break
                        }
                        y = y.sibling
                    }
                    if (!h)
                        throw Error(s(189))
                }
            }
            if (n.alternate !== a)
                throw Error(s(190))
        }
        if (n.tag !== 3)
            throw Error(s(188));
        return n.stateNode.current === n ? e : t
    }
    function b(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e;
        for (e = e.child; e !== null; ) {
            if (t = b(e),
            t !== null)
                return t;
            e = e.sibling
        }
        return null
    }
    var v = Object.assign
      , S = Symbol.for("react.element")
      , x = Symbol.for("react.transitional.element")
      , E = Symbol.for("react.portal")
      , A = Symbol.for("react.fragment")
      , _ = Symbol.for("react.strict_mode")
      , j = Symbol.for("react.profiler")
      , G = Symbol.for("react.consumer")
      , V = Symbol.for("react.context")
      , J = Symbol.for("react.forward_ref")
      , W = Symbol.for("react.suspense")
      , se = Symbol.for("react.suspense_list")
      , I = Symbol.for("react.memo")
      , ye = Symbol.for("react.lazy")
      , Ce = Symbol.for("react.activity")
      , Q = Symbol.for("react.memo_cache_sentinel")
      , k = Symbol.iterator;
    function K(e) {
        return e === null || typeof e != "object" ? null : (e = k && e[k] || e["@@iterator"],
        typeof e == "function" ? e : null)
    }
    var ne = Symbol.for("react.client.reference");
    function oe(e) {
        if (e == null)
            return null;
        if (typeof e == "function")
            return e.$$typeof === ne ? null : e.displayName || e.name || null;
        if (typeof e == "string")
            return e;
        switch (e) {
        case A:
            return "Fragment";
        case j:
            return "Profiler";
        case _:
            return "StrictMode";
        case W:
            return "Suspense";
        case se:
            return "SuspenseList";
        case Ce:
            return "Activity"
        }
        if (typeof e == "object")
            switch (e.$$typeof) {
            case E:
                return "Portal";
            case V:
                return e.displayName || "Context";
            case G:
                return (e._context.displayName || "Context") + ".Consumer";
            case J:
                var t = e.render;
                return e = e.displayName,
                e || (e = t.displayName || t.name || "",
                e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"),
                e;
            case I:
                return t = e.displayName || null,
                t !== null ? t : oe(e.type) || "Memo";
            case ye:
                t = e._payload,
                e = e._init;
                try {
                    return oe(e(t))
                } catch {}
            }
        return null
    }
    var fe = Array.isArray
      , D = l.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , X = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , te = {
        pending: !1,
        data: null,
        method: null,
        action: null
    }
      , be = []
      , we = -1;
    function T(e) {
        return {
            current: e
        }
    }
    function B(e) {
        0 > we || (e.current = be[we],
        be[we] = null,
        we--)
    }
    function Z(e, t) {
        we++,
        be[we] = e.current,
        e.current = t
    }
    var $ = T(null)
      , ue = T(null)
      , de = T(null)
      , _e = T(null);
    function nt(e, t) {
        switch (Z(de, t),
        Z(ue, e),
        Z($, null),
        t.nodeType) {
        case 9:
        case 11:
            e = (e = t.documentElement) && (e = e.namespaceURI) ? wh(e) : 0;
            break;
        default:
            if (e = t.tagName,
            t = t.namespaceURI)
                t = wh(t),
                e = _h(t, e);
            else
                switch (e) {
                case "svg":
                    e = 1;
                    break;
                case "math":
                    e = 2;
                    break;
                default:
                    e = 0
                }
        }
        B($),
        Z($, e)
    }
    function He() {
        B($),
        B(ue),
        B(de)
    }
    function Ka(e) {
        e.memoizedState !== null && Z(_e, e);
        var t = $.current
          , n = _h(t, e.type);
        t !== n && (Z(ue, e),
        Z($, n))
    }
    function ni(e) {
        ue.current === e && (B($),
        B(ue)),
        _e.current === e && (B(_e),
        Ul._currentValue = te)
    }
    var qu, Io;
    function Hn(e) {
        if (qu === void 0)
            try {
                throw Error()
            } catch (n) {
                var t = n.stack.trim().match(/\n( *(at )?)/);
                qu = t && t[1] || "",
                Io = -1 < n.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < n.stack.indexOf("@") ? "@unknown:0:0" : ""
            }
        return `
` + qu + e + Io
    }
    var Gu = !1;
    function Yu(e, t) {
        if (!e || Gu)
            return "";
        Gu = !0;
        var n = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
            var a = {
                DetermineComponentFrameRoot: function() {
                    try {
                        if (t) {
                            var Y = function() {
                                throw Error()
                            };
                            if (Object.defineProperty(Y.prototype, "props", {
                                set: function() {
                                    throw Error()
                                }
                            }),
                            typeof Reflect == "object" && Reflect.construct) {
                                try {
                                    Reflect.construct(Y, [])
                                } catch (z) {
                                    var M = z
                                }
                                Reflect.construct(e, [], Y)
                            } else {
                                try {
                                    Y.call()
                                } catch (z) {
                                    M = z
                                }
                                e.call(Y.prototype)
                            }
                        } else {
                            try {
                                throw Error()
                            } catch (z) {
                                M = z
                            }
                            (Y = e()) && typeof Y.catch == "function" && Y.catch(function() {})
                        }
                    } catch (z) {
                        if (z && M && typeof z.stack == "string")
                            return [z.stack, M.stack]
                    }
                    return [null, null]
                }
            };
            a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
            var u = Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot, "name");
            u && u.configurable && Object.defineProperty(a.DetermineComponentFrameRoot, "name", {
                value: "DetermineComponentFrameRoot"
            });
            var o = a.DetermineComponentFrameRoot()
              , h = o[0]
              , y = o[1];
            if (h && y) {
                var C = h.split(`
`)
                  , L = y.split(`
`);
                for (u = a = 0; a < C.length && !C[a].includes("DetermineComponentFrameRoot"); )
                    a++;
                for (; u < L.length && !L[u].includes("DetermineComponentFrameRoot"); )
                    u++;
                if (a === C.length || u === L.length)
                    for (a = C.length - 1,
                    u = L.length - 1; 1 <= a && 0 <= u && C[a] !== L[u]; )
                        u--;
                for (; 1 <= a && 0 <= u; a--,
                u--)
                    if (C[a] !== L[u]) {
                        if (a !== 1 || u !== 1)
                            do
                                if (a--,
                                u--,
                                0 > u || C[a] !== L[u]) {
                                    var H = `
` + C[a].replace(" at new ", " at ");
                                    return e.displayName && H.includes("<anonymous>") && (H = H.replace("<anonymous>", e.displayName)),
                                    H
                                }
                            while (1 <= a && 0 <= u);
                        break
                    }
            }
        } finally {
            Gu = !1,
            Error.prepareStackTrace = n
        }
        return (n = e ? e.displayName || e.name : "") ? Hn(n) : ""
    }
    function hp(e, t) {
        switch (e.tag) {
        case 26:
        case 27:
        case 5:
            return Hn(e.type);
        case 16:
            return Hn("Lazy");
        case 13:
            return e.child !== t && t !== null ? Hn("Suspense Fallback") : Hn("Suspense");
        case 19:
            return Hn("SuspenseList");
        case 0:
        case 15:
            return Yu(e.type, !1);
        case 11:
            return Yu(e.type.render, !1);
        case 1:
            return Yu(e.type, !0);
        case 31:
            return Hn("Activity");
        default:
            return ""
        }
    }
    function Po(e) {
        try {
            var t = ""
              , n = null;
            do
                t += hp(e, n),
                n = e,
                e = e.return;
            while (e);
            return t
        } catch (a) {
            return `
Error generating stack: ` + a.message + `
` + a.stack
        }
    }
    var Vu = Object.prototype.hasOwnProperty
      , Qu = i.unstable_scheduleCallback
      , Xu = i.unstable_cancelCallback
      , mp = i.unstable_shouldYield
      , gp = i.unstable_requestPaint
      , ft = i.unstable_now
      , pp = i.unstable_getCurrentPriorityLevel
      , ec = i.unstable_ImmediatePriority
      , tc = i.unstable_UserBlockingPriority
      , ai = i.unstable_NormalPriority
      , yp = i.unstable_LowPriority
      , nc = i.unstable_IdlePriority
      , vp = i.log
      , bp = i.unstable_setDisableYieldValue
      , Ja = null
      , dt = null;
    function dn(e) {
        if (typeof vp == "function" && bp(e),
        dt && typeof dt.setStrictMode == "function")
            try {
                dt.setStrictMode(Ja, e)
            } catch {}
    }
    var ht = Math.clz32 ? Math.clz32 : Ep
      , xp = Math.log
      , Sp = Math.LN2;
    function Ep(e) {
        return e >>>= 0,
        e === 0 ? 32 : 31 - (xp(e) / Sp | 0) | 0
    }
    var li = 256
      , ii = 262144
      , ui = 4194304;
    function Bn(e) {
        var t = e & 42;
        if (t !== 0)
            return t;
        switch (e & -e) {
        case 1:
            return 1;
        case 2:
            return 2;
        case 4:
            return 4;
        case 8:
            return 8;
        case 16:
            return 16;
        case 32:
            return 32;
        case 64:
            return 64;
        case 128:
            return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
            return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return e & 62914560;
        case 67108864:
            return 67108864;
        case 134217728:
            return 134217728;
        case 268435456:
            return 268435456;
        case 536870912:
            return 536870912;
        case 1073741824:
            return 0;
        default:
            return e
        }
    }
    function ri(e, t, n) {
        var a = e.pendingLanes;
        if (a === 0)
            return 0;
        var u = 0
          , o = e.suspendedLanes
          , h = e.pingedLanes;
        e = e.warmLanes;
        var y = a & 134217727;
        return y !== 0 ? (a = y & ~o,
        a !== 0 ? u = Bn(a) : (h &= y,
        h !== 0 ? u = Bn(h) : n || (n = y & ~e,
        n !== 0 && (u = Bn(n))))) : (y = a & ~o,
        y !== 0 ? u = Bn(y) : h !== 0 ? u = Bn(h) : n || (n = a & ~e,
        n !== 0 && (u = Bn(n)))),
        u === 0 ? 0 : t !== 0 && t !== u && (t & o) === 0 && (o = u & -u,
        n = t & -t,
        o >= n || o === 32 && (n & 4194048) !== 0) ? t : u
    }
    function $a(e, t) {
        return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
    }
    function wp(e, t) {
        switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
            return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
            return -1;
        default:
            return -1
        }
    }
    function ac() {
        var e = ui;
        return ui <<= 1,
        (ui & 62914560) === 0 && (ui = 4194304),
        e
    }
    function ku(e) {
        for (var t = [], n = 0; 31 > n; n++)
            t.push(e);
        return t
    }
    function Fa(e, t) {
        e.pendingLanes |= t,
        t !== 268435456 && (e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0)
    }
    function _p(e, t, n, a, u, o) {
        var h = e.pendingLanes;
        e.pendingLanes = n,
        e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0,
        e.expiredLanes &= n,
        e.entangledLanes &= n,
        e.errorRecoveryDisabledLanes &= n,
        e.shellSuspendCounter = 0;
        var y = e.entanglements
          , C = e.expirationTimes
          , L = e.hiddenUpdates;
        for (n = h & ~n; 0 < n; ) {
            var H = 31 - ht(n)
              , Y = 1 << H;
            y[H] = 0,
            C[H] = -1;
            var M = L[H];
            if (M !== null)
                for (L[H] = null,
                H = 0; H < M.length; H++) {
                    var z = M[H];
                    z !== null && (z.lane &= -536870913)
                }
            n &= ~Y
        }
        a !== 0 && lc(e, a, 0),
        o !== 0 && u === 0 && e.tag !== 0 && (e.suspendedLanes |= o & ~(h & ~t))
    }
    function lc(e, t, n) {
        e.pendingLanes |= t,
        e.suspendedLanes &= ~t;
        var a = 31 - ht(t);
        e.entangledLanes |= t,
        e.entanglements[a] = e.entanglements[a] | 1073741824 | n & 261930
    }
    function ic(e, t) {
        var n = e.entangledLanes |= t;
        for (e = e.entanglements; n; ) {
            var a = 31 - ht(n)
              , u = 1 << a;
            u & t | e[a] & t && (e[a] |= t),
            n &= ~u
        }
    }
    function uc(e, t) {
        var n = t & -t;
        return n = (n & 42) !== 0 ? 1 : Zu(n),
        (n & (e.suspendedLanes | t)) !== 0 ? 0 : n
    }
    function Zu(e) {
        switch (e) {
        case 2:
            e = 1;
            break;
        case 8:
            e = 4;
            break;
        case 32:
            e = 16;
            break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            e = 128;
            break;
        case 268435456:
            e = 134217728;
            break;
        default:
            e = 0
        }
        return e
    }
    function Ku(e) {
        return e &= -e,
        2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2
    }
    function rc() {
        var e = X.p;
        return e !== 0 ? e : (e = window.event,
        e === void 0 ? 32 : Kh(e.type))
    }
    function sc(e, t) {
        var n = X.p;
        try {
            return X.p = e,
            t()
        } finally {
            X.p = n
        }
    }
    var hn = Math.random().toString(36).slice(2)
      , $e = "__reactFiber$" + hn
      , lt = "__reactProps$" + hn
      , na = "__reactContainer$" + hn
      , Ju = "__reactEvents$" + hn
      , Cp = "__reactListeners$" + hn
      , Tp = "__reactHandles$" + hn
      , oc = "__reactResources$" + hn
      , Wa = "__reactMarker$" + hn;
    function $u(e) {
        delete e[$e],
        delete e[lt],
        delete e[Ju],
        delete e[Cp],
        delete e[Tp]
    }
    function aa(e) {
        var t = e[$e];
        if (t)
            return t;
        for (var n = e.parentNode; n; ) {
            if (t = n[na] || n[$e]) {
                if (n = t.alternate,
                t.child !== null || n !== null && n.child !== null)
                    for (e = Lh(e); e !== null; ) {
                        if (n = e[$e])
                            return n;
                        e = Lh(e)
                    }
                return t
            }
            e = n,
            n = e.parentNode
        }
        return null
    }
    function la(e) {
        if (e = e[$e] || e[na]) {
            var t = e.tag;
            if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
                return e
        }
        return null
    }
    function Ia(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e.stateNode;
        throw Error(s(33))
    }
    function ia(e) {
        var t = e[oc];
        return t || (t = e[oc] = {
            hoistableStyles: new Map,
            hoistableScripts: new Map
        }),
        t
    }
    function Ze(e) {
        e[Wa] = !0
    }
    var cc = new Set
      , fc = {};
    function qn(e, t) {
        ua(e, t),
        ua(e + "Capture", t)
    }
    function ua(e, t) {
        for (fc[e] = t,
        e = 0; e < t.length; e++)
            cc.add(t[e])
    }
    var Op = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$")
      , dc = {}
      , hc = {};
    function Ap(e) {
        return Vu.call(hc, e) ? !0 : Vu.call(dc, e) ? !1 : Op.test(e) ? hc[e] = !0 : (dc[e] = !0,
        !1)
    }
    function si(e, t, n) {
        if (Ap(t))
            if (n === null)
                e.removeAttribute(t);
            else {
                switch (typeof n) {
                case "undefined":
                case "function":
                case "symbol":
                    e.removeAttribute(t);
                    return;
                case "boolean":
                    var a = t.toLowerCase().slice(0, 5);
                    if (a !== "data-" && a !== "aria-") {
                        e.removeAttribute(t);
                        return
                    }
                }
                e.setAttribute(t, "" + n)
            }
    }
    function oi(e, t, n) {
        if (n === null)
            e.removeAttribute(t);
        else {
            switch (typeof n) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(t);
                return
            }
            e.setAttribute(t, "" + n)
        }
    }
    function Xt(e, t, n, a) {
        if (a === null)
            e.removeAttribute(n);
        else {
            switch (typeof a) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(n);
                return
            }
            e.setAttributeNS(t, n, "" + a)
        }
    }
    function St(e) {
        switch (typeof e) {
        case "bigint":
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return e;
        case "object":
            return e;
        default:
            return ""
        }
    }
    function mc(e) {
        var t = e.type;
        return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio")
    }
    function Rp(e, t, n) {
        var a = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
        if (!e.hasOwnProperty(t) && typeof a < "u" && typeof a.get == "function" && typeof a.set == "function") {
            var u = a.get
              , o = a.set;
            return Object.defineProperty(e, t, {
                configurable: !0,
                get: function() {
                    return u.call(this)
                },
                set: function(h) {
                    n = "" + h,
                    o.call(this, h)
                }
            }),
            Object.defineProperty(e, t, {
                enumerable: a.enumerable
            }),
            {
                getValue: function() {
                    return n
                },
                setValue: function(h) {
                    n = "" + h
                },
                stopTracking: function() {
                    e._valueTracker = null,
                    delete e[t]
                }
            }
        }
    }
    function Fu(e) {
        if (!e._valueTracker) {
            var t = mc(e) ? "checked" : "value";
            e._valueTracker = Rp(e, t, "" + e[t])
        }
    }
    function gc(e) {
        if (!e)
            return !1;
        var t = e._valueTracker;
        if (!t)
            return !0;
        var n = t.getValue()
          , a = "";
        return e && (a = mc(e) ? e.checked ? "true" : "false" : e.value),
        e = a,
        e !== n ? (t.setValue(e),
        !0) : !1
    }
    function ci(e) {
        if (e = e || (typeof document < "u" ? document : void 0),
        typeof e > "u")
            return null;
        try {
            return e.activeElement || e.body
        } catch {
            return e.body
        }
    }
    var Np = /[\n"\\]/g;
    function Et(e) {
        return e.replace(Np, function(t) {
            return "\\" + t.charCodeAt(0).toString(16) + " "
        })
    }
    function Wu(e, t, n, a, u, o, h, y) {
        e.name = "",
        h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" ? e.type = h : e.removeAttribute("type"),
        t != null ? h === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + St(t)) : e.value !== "" + St(t) && (e.value = "" + St(t)) : h !== "submit" && h !== "reset" || e.removeAttribute("value"),
        t != null ? Iu(e, h, St(t)) : n != null ? Iu(e, h, St(n)) : a != null && e.removeAttribute("value"),
        u == null && o != null && (e.defaultChecked = !!o),
        u != null && (e.checked = u && typeof u != "function" && typeof u != "symbol"),
        y != null && typeof y != "function" && typeof y != "symbol" && typeof y != "boolean" ? e.name = "" + St(y) : e.removeAttribute("name")
    }
    function pc(e, t, n, a, u, o, h, y) {
        if (o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.type = o),
        t != null || n != null) {
            if (!(o !== "submit" && o !== "reset" || t != null)) {
                Fu(e);
                return
            }
            n = n != null ? "" + St(n) : "",
            t = t != null ? "" + St(t) : n,
            y || t === e.value || (e.value = t),
            e.defaultValue = t
        }
        a = a ?? u,
        a = typeof a != "function" && typeof a != "symbol" && !!a,
        e.checked = y ? e.checked : !!a,
        e.defaultChecked = !!a,
        h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" && (e.name = h),
        Fu(e)
    }
    function Iu(e, t, n) {
        t === "number" && ci(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n)
    }
    function ra(e, t, n, a) {
        if (e = e.options,
        t) {
            t = {};
            for (var u = 0; u < n.length; u++)
                t["$" + n[u]] = !0;
            for (n = 0; n < e.length; n++)
                u = t.hasOwnProperty("$" + e[n].value),
                e[n].selected !== u && (e[n].selected = u),
                u && a && (e[n].defaultSelected = !0)
        } else {
            for (n = "" + St(n),
            t = null,
            u = 0; u < e.length; u++) {
                if (e[u].value === n) {
                    e[u].selected = !0,
                    a && (e[u].defaultSelected = !0);
                    return
                }
                t !== null || e[u].disabled || (t = e[u])
            }
            t !== null && (t.selected = !0)
        }
    }
    function yc(e, t, n) {
        if (t != null && (t = "" + St(t),
        t !== e.value && (e.value = t),
        n == null)) {
            e.defaultValue !== t && (e.defaultValue = t);
            return
        }
        e.defaultValue = n != null ? "" + St(n) : ""
    }
    function vc(e, t, n, a) {
        if (t == null) {
            if (a != null) {
                if (n != null)
                    throw Error(s(92));
                if (fe(a)) {
                    if (1 < a.length)
                        throw Error(s(93));
                    a = a[0]
                }
                n = a
            }
            n == null && (n = ""),
            t = n
        }
        n = St(t),
        e.defaultValue = n,
        a = e.textContent,
        a === n && a !== "" && a !== null && (e.value = a),
        Fu(e)
    }
    function sa(e, t) {
        if (t) {
            var n = e.firstChild;
            if (n && n === e.lastChild && n.nodeType === 3) {
                n.nodeValue = t;
                return
            }
        }
        e.textContent = t
    }
    var Lp = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
    function bc(e, t, n) {
        var a = t.indexOf("--") === 0;
        n == null || typeof n == "boolean" || n === "" ? a ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : a ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Lp.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px"
    }
    function xc(e, t, n) {
        if (t != null && typeof t != "object")
            throw Error(s(62));
        if (e = e.style,
        n != null) {
            for (var a in n)
                !n.hasOwnProperty(a) || t != null && t.hasOwnProperty(a) || (a.indexOf("--") === 0 ? e.setProperty(a, "") : a === "float" ? e.cssFloat = "" : e[a] = "");
            for (var u in t)
                a = t[u],
                t.hasOwnProperty(u) && n[u] !== a && bc(e, u, a)
        } else
            for (var o in t)
                t.hasOwnProperty(o) && bc(e, o, t[o])
    }
    function Pu(e) {
        if (e.indexOf("-") === -1)
            return !1;
        switch (e) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return !1;
        default:
            return !0
        }
    }
    var Mp = new Map([["acceptCharset", "accept-charset"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"], ["crossOrigin", "crossorigin"], ["accentHeight", "accent-height"], ["alignmentBaseline", "alignment-baseline"], ["arabicForm", "arabic-form"], ["baselineShift", "baseline-shift"], ["capHeight", "cap-height"], ["clipPath", "clip-path"], ["clipRule", "clip-rule"], ["colorInterpolation", "color-interpolation"], ["colorInterpolationFilters", "color-interpolation-filters"], ["colorProfile", "color-profile"], ["colorRendering", "color-rendering"], ["dominantBaseline", "dominant-baseline"], ["enableBackground", "enable-background"], ["fillOpacity", "fill-opacity"], ["fillRule", "fill-rule"], ["floodColor", "flood-color"], ["floodOpacity", "flood-opacity"], ["fontFamily", "font-family"], ["fontSize", "font-size"], ["fontSizeAdjust", "font-size-adjust"], ["fontStretch", "font-stretch"], ["fontStyle", "font-style"], ["fontVariant", "font-variant"], ["fontWeight", "font-weight"], ["glyphName", "glyph-name"], ["glyphOrientationHorizontal", "glyph-orientation-horizontal"], ["glyphOrientationVertical", "glyph-orientation-vertical"], ["horizAdvX", "horiz-adv-x"], ["horizOriginX", "horiz-origin-x"], ["imageRendering", "image-rendering"], ["letterSpacing", "letter-spacing"], ["lightingColor", "lighting-color"], ["markerEnd", "marker-end"], ["markerMid", "marker-mid"], ["markerStart", "marker-start"], ["overlinePosition", "overline-position"], ["overlineThickness", "overline-thickness"], ["paintOrder", "paint-order"], ["panose-1", "panose-1"], ["pointerEvents", "pointer-events"], ["renderingIntent", "rendering-intent"], ["shapeRendering", "shape-rendering"], ["stopColor", "stop-color"], ["stopOpacity", "stop-opacity"], ["strikethroughPosition", "strikethrough-position"], ["strikethroughThickness", "strikethrough-thickness"], ["strokeDasharray", "stroke-dasharray"], ["strokeDashoffset", "stroke-dashoffset"], ["strokeLinecap", "stroke-linecap"], ["strokeLinejoin", "stroke-linejoin"], ["strokeMiterlimit", "stroke-miterlimit"], ["strokeOpacity", "stroke-opacity"], ["strokeWidth", "stroke-width"], ["textAnchor", "text-anchor"], ["textDecoration", "text-decoration"], ["textRendering", "text-rendering"], ["transformOrigin", "transform-origin"], ["underlinePosition", "underline-position"], ["underlineThickness", "underline-thickness"], ["unicodeBidi", "unicode-bidi"], ["unicodeRange", "unicode-range"], ["unitsPerEm", "units-per-em"], ["vAlphabetic", "v-alphabetic"], ["vHanging", "v-hanging"], ["vIdeographic", "v-ideographic"], ["vMathematical", "v-mathematical"], ["vectorEffect", "vector-effect"], ["vertAdvY", "vert-adv-y"], ["vertOriginX", "vert-origin-x"], ["vertOriginY", "vert-origin-y"], ["wordSpacing", "word-spacing"], ["writingMode", "writing-mode"], ["xmlnsXlink", "xmlns:xlink"], ["xHeight", "x-height"]])
      , jp = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function fi(e) {
        return jp.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e
    }
    function kt() {}
    var er = null;
    function tr(e) {
        return e = e.target || e.srcElement || window,
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    }
    var oa = null
      , ca = null;
    function Sc(e) {
        var t = la(e);
        if (t && (e = t.stateNode)) {
            var n = e[lt] || null;
            e: switch (e = t.stateNode,
            t.type) {
            case "input":
                if (Wu(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name),
                t = n.name,
                n.type === "radio" && t != null) {
                    for (n = e; n.parentNode; )
                        n = n.parentNode;
                    for (n = n.querySelectorAll('input[name="' + Et("" + t) + '"][type="radio"]'),
                    t = 0; t < n.length; t++) {
                        var a = n[t];
                        if (a !== e && a.form === e.form) {
                            var u = a[lt] || null;
                            if (!u)
                                throw Error(s(90));
                            Wu(a, u.value, u.defaultValue, u.defaultValue, u.checked, u.defaultChecked, u.type, u.name)
                        }
                    }
                    for (t = 0; t < n.length; t++)
                        a = n[t],
                        a.form === e.form && gc(a)
                }
                break e;
            case "textarea":
                yc(e, n.value, n.defaultValue);
                break e;
            case "select":
                t = n.value,
                t != null && ra(e, !!n.multiple, t, !1)
            }
        }
    }
    var nr = !1;
    function Ec(e, t, n) {
        if (nr)
            return e(t, n);
        nr = !0;
        try {
            var a = e(t);
            return a
        } finally {
            if (nr = !1,
            (oa !== null || ca !== null) && (Ii(),
            oa && (t = oa,
            e = ca,
            ca = oa = null,
            Sc(t),
            e)))
                for (t = 0; t < e.length; t++)
                    Sc(e[t])
        }
    }
    function Pa(e, t) {
        var n = e.stateNode;
        if (n === null)
            return null;
        var a = n[lt] || null;
        if (a === null)
            return null;
        n = a[t];
        e: switch (t) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
            (a = !a.disabled) || (e = e.type,
            a = !(e === "button" || e === "input" || e === "select" || e === "textarea")),
            e = !a;
            break e;
        default:
            e = !1
        }
        if (e)
            return null;
        if (n && typeof n != "function")
            throw Error(s(231, t, typeof n));
        return n
    }
    var Zt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u")
      , ar = !1;
    if (Zt)
        try {
            var el = {};
            Object.defineProperty(el, "passive", {
                get: function() {
                    ar = !0
                }
            }),
            window.addEventListener("test", el, el),
            window.removeEventListener("test", el, el)
        } catch {
            ar = !1
        }
    var mn = null
      , lr = null
      , di = null;
    function wc() {
        if (di)
            return di;
        var e, t = lr, n = t.length, a, u = "value"in mn ? mn.value : mn.textContent, o = u.length;
        for (e = 0; e < n && t[e] === u[e]; e++)
            ;
        var h = n - e;
        for (a = 1; a <= h && t[n - a] === u[o - a]; a++)
            ;
        return di = u.slice(e, 1 < a ? 1 - a : void 0)
    }
    function hi(e) {
        var t = e.keyCode;
        return "charCode"in e ? (e = e.charCode,
        e === 0 && t === 13 && (e = 13)) : e = t,
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    }
    function mi() {
        return !0
    }
    function _c() {
        return !1
    }
    function it(e) {
        function t(n, a, u, o, h) {
            this._reactName = n,
            this._targetInst = u,
            this.type = a,
            this.nativeEvent = o,
            this.target = h,
            this.currentTarget = null;
            for (var y in e)
                e.hasOwnProperty(y) && (n = e[y],
                this[y] = n ? n(o) : o[y]);
            return this.isDefaultPrevented = (o.defaultPrevented != null ? o.defaultPrevented : o.returnValue === !1) ? mi : _c,
            this.isPropagationStopped = _c,
            this
        }
        return v(t.prototype, {
            preventDefault: function() {
                this.defaultPrevented = !0;
                var n = this.nativeEvent;
                n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1),
                this.isDefaultPrevented = mi)
            },
            stopPropagation: function() {
                var n = this.nativeEvent;
                n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0),
                this.isPropagationStopped = mi)
            },
            persist: function() {},
            isPersistent: mi
        }),
        t
    }
    var Gn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(e) {
            return e.timeStamp || Date.now()
        },
        defaultPrevented: 0,
        isTrusted: 0
    }, gi = it(Gn), tl = v({}, Gn, {
        view: 0,
        detail: 0
    }), zp = it(tl), ir, ur, nl, pi = v({}, tl, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: sr,
        button: 0,
        buttons: 0,
        relatedTarget: function(e) {
            return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget
        },
        movementX: function(e) {
            return "movementX"in e ? e.movementX : (e !== nl && (nl && e.type === "mousemove" ? (ir = e.screenX - nl.screenX,
            ur = e.screenY - nl.screenY) : ur = ir = 0,
            nl = e),
            ir)
        },
        movementY: function(e) {
            return "movementY"in e ? e.movementY : ur
        }
    }), Cc = it(pi), Dp = v({}, pi, {
        dataTransfer: 0
    }), Up = it(Dp), Hp = v({}, tl, {
        relatedTarget: 0
    }), rr = it(Hp), Bp = v({}, Gn, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    }), qp = it(Bp), Gp = v({}, Gn, {
        clipboardData: function(e) {
            return "clipboardData"in e ? e.clipboardData : window.clipboardData
        }
    }), Yp = it(Gp), Vp = v({}, Gn, {
        data: 0
    }), Tc = it(Vp), Qp = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
    }, Xp = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
    }, kp = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
    };
    function Zp(e) {
        var t = this.nativeEvent;
        return t.getModifierState ? t.getModifierState(e) : (e = kp[e]) ? !!t[e] : !1
    }
    function sr() {
        return Zp
    }
    var Kp = v({}, tl, {
        key: function(e) {
            if (e.key) {
                var t = Qp[e.key] || e.key;
                if (t !== "Unidentified")
                    return t
            }
            return e.type === "keypress" ? (e = hi(e),
            e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Xp[e.keyCode] || "Unidentified" : ""
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: sr,
        charCode: function(e) {
            return e.type === "keypress" ? hi(e) : 0
        },
        keyCode: function(e) {
            return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        },
        which: function(e) {
            return e.type === "keypress" ? hi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        }
    })
      , Jp = it(Kp)
      , $p = v({}, pi, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
    })
      , Oc = it($p)
      , Fp = v({}, tl, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: sr
    })
      , Wp = it(Fp)
      , Ip = v({}, Gn, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    })
      , Pp = it(Ip)
      , e0 = v({}, pi, {
        deltaX: function(e) {
            return "deltaX"in e ? e.deltaX : "wheelDeltaX"in e ? -e.wheelDeltaX : 0
        },
        deltaY: function(e) {
            return "deltaY"in e ? e.deltaY : "wheelDeltaY"in e ? -e.wheelDeltaY : "wheelDelta"in e ? -e.wheelDelta : 0
        },
        deltaZ: 0,
        deltaMode: 0
    })
      , t0 = it(e0)
      , n0 = v({}, Gn, {
        newState: 0,
        oldState: 0
    })
      , a0 = it(n0)
      , l0 = [9, 13, 27, 32]
      , or = Zt && "CompositionEvent"in window
      , al = null;
    Zt && "documentMode"in document && (al = document.documentMode);
    var i0 = Zt && "TextEvent"in window && !al
      , Ac = Zt && (!or || al && 8 < al && 11 >= al)
      , Rc = " "
      , Nc = !1;
    function Lc(e, t) {
        switch (e) {
        case "keyup":
            return l0.indexOf(t.keyCode) !== -1;
        case "keydown":
            return t.keyCode !== 229;
        case "keypress":
        case "mousedown":
        case "focusout":
            return !0;
        default:
            return !1
        }
    }
    function Mc(e) {
        return e = e.detail,
        typeof e == "object" && "data"in e ? e.data : null
    }
    var fa = !1;
    function u0(e, t) {
        switch (e) {
        case "compositionend":
            return Mc(t);
        case "keypress":
            return t.which !== 32 ? null : (Nc = !0,
            Rc);
        case "textInput":
            return e = t.data,
            e === Rc && Nc ? null : e;
        default:
            return null
        }
    }
    function r0(e, t) {
        if (fa)
            return e === "compositionend" || !or && Lc(e, t) ? (e = wc(),
            di = lr = mn = null,
            fa = !1,
            e) : null;
        switch (e) {
        case "paste":
            return null;
        case "keypress":
            if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
                if (t.char && 1 < t.char.length)
                    return t.char;
                if (t.which)
                    return String.fromCharCode(t.which)
            }
            return null;
        case "compositionend":
            return Ac && t.locale !== "ko" ? null : t.data;
        default:
            return null
        }
    }
    var s0 = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0
    };
    function jc(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t === "input" ? !!s0[e.type] : t === "textarea"
    }
    function zc(e, t, n, a) {
        oa ? ca ? ca.push(a) : ca = [a] : oa = a,
        t = iu(t, "onChange"),
        0 < t.length && (n = new gi("onChange","change",null,n,a),
        e.push({
            event: n,
            listeners: t
        }))
    }
    var ll = null
      , il = null;
    function o0(e) {
        yh(e, 0)
    }
    function yi(e) {
        var t = Ia(e);
        if (gc(t))
            return e
    }
    function Dc(e, t) {
        if (e === "change")
            return t
    }
    var Uc = !1;
    if (Zt) {
        var cr;
        if (Zt) {
            var fr = "oninput"in document;
            if (!fr) {
                var Hc = document.createElement("div");
                Hc.setAttribute("oninput", "return;"),
                fr = typeof Hc.oninput == "function"
            }
            cr = fr
        } else
            cr = !1;
        Uc = cr && (!document.documentMode || 9 < document.documentMode)
    }
    function Bc() {
        ll && (ll.detachEvent("onpropertychange", qc),
        il = ll = null)
    }
    function qc(e) {
        if (e.propertyName === "value" && yi(il)) {
            var t = [];
            zc(t, il, e, tr(e)),
            Ec(o0, t)
        }
    }
    function c0(e, t, n) {
        e === "focusin" ? (Bc(),
        ll = t,
        il = n,
        ll.attachEvent("onpropertychange", qc)) : e === "focusout" && Bc()
    }
    function f0(e) {
        if (e === "selectionchange" || e === "keyup" || e === "keydown")
            return yi(il)
    }
    function d0(e, t) {
        if (e === "click")
            return yi(t)
    }
    function h0(e, t) {
        if (e === "input" || e === "change")
            return yi(t)
    }
    function m0(e, t) {
        return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t
    }
    var mt = typeof Object.is == "function" ? Object.is : m0;
    function ul(e, t) {
        if (mt(e, t))
            return !0;
        if (typeof e != "object" || e === null || typeof t != "object" || t === null)
            return !1;
        var n = Object.keys(e)
          , a = Object.keys(t);
        if (n.length !== a.length)
            return !1;
        for (a = 0; a < n.length; a++) {
            var u = n[a];
            if (!Vu.call(t, u) || !mt(e[u], t[u]))
                return !1
        }
        return !0
    }
    function Gc(e) {
        for (; e && e.firstChild; )
            e = e.firstChild;
        return e
    }
    function Yc(e, t) {
        var n = Gc(e);
        e = 0;
        for (var a; n; ) {
            if (n.nodeType === 3) {
                if (a = e + n.textContent.length,
                e <= t && a >= t)
                    return {
                        node: n,
                        offset: t - e
                    };
                e = a
            }
            e: {
                for (; n; ) {
                    if (n.nextSibling) {
                        n = n.nextSibling;
                        break e
                    }
                    n = n.parentNode
                }
                n = void 0
            }
            n = Gc(n)
        }
    }
    function Vc(e, t) {
        return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Vc(e, t.parentNode) : "contains"in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1
    }
    function Qc(e) {
        e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
        for (var t = ci(e.document); t instanceof e.HTMLIFrameElement; ) {
            try {
                var n = typeof t.contentWindow.location.href == "string"
            } catch {
                n = !1
            }
            if (n)
                e = t.contentWindow;
            else
                break;
            t = ci(e.document)
        }
        return t
    }
    function dr(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true")
    }
    var g0 = Zt && "documentMode"in document && 11 >= document.documentMode
      , da = null
      , hr = null
      , rl = null
      , mr = !1;
    function Xc(e, t, n) {
        var a = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
        mr || da == null || da !== ci(a) || (a = da,
        "selectionStart"in a && dr(a) ? a = {
            start: a.selectionStart,
            end: a.selectionEnd
        } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(),
        a = {
            anchorNode: a.anchorNode,
            anchorOffset: a.anchorOffset,
            focusNode: a.focusNode,
            focusOffset: a.focusOffset
        }),
        rl && ul(rl, a) || (rl = a,
        a = iu(hr, "onSelect"),
        0 < a.length && (t = new gi("onSelect","select",null,t,n),
        e.push({
            event: t,
            listeners: a
        }),
        t.target = da)))
    }
    function Yn(e, t) {
        var n = {};
        return n[e.toLowerCase()] = t.toLowerCase(),
        n["Webkit" + e] = "webkit" + t,
        n["Moz" + e] = "moz" + t,
        n
    }
    var ha = {
        animationend: Yn("Animation", "AnimationEnd"),
        animationiteration: Yn("Animation", "AnimationIteration"),
        animationstart: Yn("Animation", "AnimationStart"),
        transitionrun: Yn("Transition", "TransitionRun"),
        transitionstart: Yn("Transition", "TransitionStart"),
        transitioncancel: Yn("Transition", "TransitionCancel"),
        transitionend: Yn("Transition", "TransitionEnd")
    }
      , gr = {}
      , kc = {};
    Zt && (kc = document.createElement("div").style,
    "AnimationEvent"in window || (delete ha.animationend.animation,
    delete ha.animationiteration.animation,
    delete ha.animationstart.animation),
    "TransitionEvent"in window || delete ha.transitionend.transition);
    function Vn(e) {
        if (gr[e])
            return gr[e];
        if (!ha[e])
            return e;
        var t = ha[e], n;
        for (n in t)
            if (t.hasOwnProperty(n) && n in kc)
                return gr[e] = t[n];
        return e
    }
    var Zc = Vn("animationend")
      , Kc = Vn("animationiteration")
      , Jc = Vn("animationstart")
      , p0 = Vn("transitionrun")
      , y0 = Vn("transitionstart")
      , v0 = Vn("transitioncancel")
      , $c = Vn("transitionend")
      , Fc = new Map
      , pr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
    pr.push("scrollEnd");
    function Mt(e, t) {
        Fc.set(e, t),
        qn(t, [e])
    }
    var vi = typeof reportError == "function" ? reportError : function(e) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var t = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
                error: e
            });
            if (!window.dispatchEvent(t))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", e);
            return
        }
        console.error(e)
    }
      , wt = []
      , ma = 0
      , yr = 0;
    function bi() {
        for (var e = ma, t = yr = ma = 0; t < e; ) {
            var n = wt[t];
            wt[t++] = null;
            var a = wt[t];
            wt[t++] = null;
            var u = wt[t];
            wt[t++] = null;
            var o = wt[t];
            if (wt[t++] = null,
            a !== null && u !== null) {
                var h = a.pending;
                h === null ? u.next = u : (u.next = h.next,
                h.next = u),
                a.pending = u
            }
            o !== 0 && Wc(n, u, o)
        }
    }
    function xi(e, t, n, a) {
        wt[ma++] = e,
        wt[ma++] = t,
        wt[ma++] = n,
        wt[ma++] = a,
        yr |= a,
        e.lanes |= a,
        e = e.alternate,
        e !== null && (e.lanes |= a)
    }
    function vr(e, t, n, a) {
        return xi(e, t, n, a),
        Si(e)
    }
    function Qn(e, t) {
        return xi(e, null, null, t),
        Si(e)
    }
    function Wc(e, t, n) {
        e.lanes |= n;
        var a = e.alternate;
        a !== null && (a.lanes |= n);
        for (var u = !1, o = e.return; o !== null; )
            o.childLanes |= n,
            a = o.alternate,
            a !== null && (a.childLanes |= n),
            o.tag === 22 && (e = o.stateNode,
            e === null || e._visibility & 1 || (u = !0)),
            e = o,
            o = o.return;
        return e.tag === 3 ? (o = e.stateNode,
        u && t !== null && (u = 31 - ht(n),
        e = o.hiddenUpdates,
        a = e[u],
        a === null ? e[u] = [t] : a.push(t),
        t.lane = n | 536870912),
        o) : null
    }
    function Si(e) {
        if (50 < Rl)
            throw Rl = 0,
            Os = null,
            Error(s(185));
        for (var t = e.return; t !== null; )
            e = t,
            t = e.return;
        return e.tag === 3 ? e.stateNode : null
    }
    var ga = {};
    function b0(e, t, n, a) {
        this.tag = e,
        this.key = n,
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null,
        this.index = 0,
        this.refCleanup = this.ref = null,
        this.pendingProps = t,
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null,
        this.mode = a,
        this.subtreeFlags = this.flags = 0,
        this.deletions = null,
        this.childLanes = this.lanes = 0,
        this.alternate = null
    }
    function gt(e, t, n, a) {
        return new b0(e,t,n,a)
    }
    function br(e) {
        return e = e.prototype,
        !(!e || !e.isReactComponent)
    }
    function Kt(e, t) {
        var n = e.alternate;
        return n === null ? (n = gt(e.tag, t, e.key, e.mode),
        n.elementType = e.elementType,
        n.type = e.type,
        n.stateNode = e.stateNode,
        n.alternate = e,
        e.alternate = n) : (n.pendingProps = t,
        n.type = e.type,
        n.flags = 0,
        n.subtreeFlags = 0,
        n.deletions = null),
        n.flags = e.flags & 65011712,
        n.childLanes = e.childLanes,
        n.lanes = e.lanes,
        n.child = e.child,
        n.memoizedProps = e.memoizedProps,
        n.memoizedState = e.memoizedState,
        n.updateQueue = e.updateQueue,
        t = e.dependencies,
        n.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        },
        n.sibling = e.sibling,
        n.index = e.index,
        n.ref = e.ref,
        n.refCleanup = e.refCleanup,
        n
    }
    function Ic(e, t) {
        e.flags &= 65011714;
        var n = e.alternate;
        return n === null ? (e.childLanes = 0,
        e.lanes = t,
        e.child = null,
        e.subtreeFlags = 0,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.updateQueue = null,
        e.dependencies = null,
        e.stateNode = null) : (e.childLanes = n.childLanes,
        e.lanes = n.lanes,
        e.child = n.child,
        e.subtreeFlags = 0,
        e.deletions = null,
        e.memoizedProps = n.memoizedProps,
        e.memoizedState = n.memoizedState,
        e.updateQueue = n.updateQueue,
        e.type = n.type,
        t = n.dependencies,
        e.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        }),
        e
    }
    function Ei(e, t, n, a, u, o) {
        var h = 0;
        if (a = e,
        typeof e == "function")
            br(e) && (h = 1);
        else if (typeof e == "string")
            h = _y(e, n, $.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
        else
            e: switch (e) {
            case Ce:
                return e = gt(31, n, t, u),
                e.elementType = Ce,
                e.lanes = o,
                e;
            case A:
                return Xn(n.children, u, o, t);
            case _:
                h = 8,
                u |= 24;
                break;
            case j:
                return e = gt(12, n, t, u | 2),
                e.elementType = j,
                e.lanes = o,
                e;
            case W:
                return e = gt(13, n, t, u),
                e.elementType = W,
                e.lanes = o,
                e;
            case se:
                return e = gt(19, n, t, u),
                e.elementType = se,
                e.lanes = o,
                e;
            default:
                if (typeof e == "object" && e !== null)
                    switch (e.$$typeof) {
                    case V:
                        h = 10;
                        break e;
                    case G:
                        h = 9;
                        break e;
                    case J:
                        h = 11;
                        break e;
                    case I:
                        h = 14;
                        break e;
                    case ye:
                        h = 16,
                        a = null;
                        break e
                    }
                h = 29,
                n = Error(s(130, e === null ? "null" : typeof e, "")),
                a = null
            }
        return t = gt(h, n, t, u),
        t.elementType = e,
        t.type = a,
        t.lanes = o,
        t
    }
    function Xn(e, t, n, a) {
        return e = gt(7, e, a, t),
        e.lanes = n,
        e
    }
    function xr(e, t, n) {
        return e = gt(6, e, null, t),
        e.lanes = n,
        e
    }
    function Pc(e) {
        var t = gt(18, null, null, 0);
        return t.stateNode = e,
        t
    }
    function Sr(e, t, n) {
        return t = gt(4, e.children !== null ? e.children : [], e.key, t),
        t.lanes = n,
        t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation
        },
        t
    }
    var ef = new WeakMap;
    function _t(e, t) {
        if (typeof e == "object" && e !== null) {
            var n = ef.get(e);
            return n !== void 0 ? n : (t = {
                value: e,
                source: t,
                stack: Po(t)
            },
            ef.set(e, t),
            t)
        }
        return {
            value: e,
            source: t,
            stack: Po(t)
        }
    }
    var pa = []
      , ya = 0
      , wi = null
      , sl = 0
      , Ct = []
      , Tt = 0
      , gn = null
      , Ut = 1
      , Ht = "";
    function Jt(e, t) {
        pa[ya++] = sl,
        pa[ya++] = wi,
        wi = e,
        sl = t
    }
    function tf(e, t, n) {
        Ct[Tt++] = Ut,
        Ct[Tt++] = Ht,
        Ct[Tt++] = gn,
        gn = e;
        var a = Ut;
        e = Ht;
        var u = 32 - ht(a) - 1;
        a &= ~(1 << u),
        n += 1;
        var o = 32 - ht(t) + u;
        if (30 < o) {
            var h = u - u % 5;
            o = (a & (1 << h) - 1).toString(32),
            a >>= h,
            u -= h,
            Ut = 1 << 32 - ht(t) + u | n << u | a,
            Ht = o + e
        } else
            Ut = 1 << o | n << u | a,
            Ht = e
    }
    function Er(e) {
        e.return !== null && (Jt(e, 1),
        tf(e, 1, 0))
    }
    function wr(e) {
        for (; e === wi; )
            wi = pa[--ya],
            pa[ya] = null,
            sl = pa[--ya],
            pa[ya] = null;
        for (; e === gn; )
            gn = Ct[--Tt],
            Ct[Tt] = null,
            Ht = Ct[--Tt],
            Ct[Tt] = null,
            Ut = Ct[--Tt],
            Ct[Tt] = null
    }
    function nf(e, t) {
        Ct[Tt++] = Ut,
        Ct[Tt++] = Ht,
        Ct[Tt++] = gn,
        Ut = t.id,
        Ht = t.overflow,
        gn = e
    }
    var Fe = null
      , Me = null
      , ve = !1
      , pn = null
      , Ot = !1
      , _r = Error(s(519));
    function yn(e) {
        var t = Error(s(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""));
        throw ol(_t(t, e)),
        _r
    }
    function af(e) {
        var t = e.stateNode
          , n = e.type
          , a = e.memoizedProps;
        switch (t[$e] = e,
        t[lt] = a,
        n) {
        case "dialog":
            me("cancel", t),
            me("close", t);
            break;
        case "iframe":
        case "object":
        case "embed":
            me("load", t);
            break;
        case "video":
        case "audio":
            for (n = 0; n < Ll.length; n++)
                me(Ll[n], t);
            break;
        case "source":
            me("error", t);
            break;
        case "img":
        case "image":
        case "link":
            me("error", t),
            me("load", t);
            break;
        case "details":
            me("toggle", t);
            break;
        case "input":
            me("invalid", t),
            pc(t, a.value, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name, !0);
            break;
        case "select":
            me("invalid", t);
            break;
        case "textarea":
            me("invalid", t),
            vc(t, a.value, a.defaultValue, a.children)
        }
        n = a.children,
        typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || a.suppressHydrationWarning === !0 || Sh(t.textContent, n) ? (a.popover != null && (me("beforetoggle", t),
        me("toggle", t)),
        a.onScroll != null && me("scroll", t),
        a.onScrollEnd != null && me("scrollend", t),
        a.onClick != null && (t.onclick = kt),
        t = !0) : t = !1,
        t || yn(e, !0)
    }
    function lf(e) {
        for (Fe = e.return; Fe; )
            switch (Fe.tag) {
            case 5:
            case 31:
            case 13:
                Ot = !1;
                return;
            case 27:
            case 3:
                Ot = !0;
                return;
            default:
                Fe = Fe.return
            }
    }
    function va(e) {
        if (e !== Fe)
            return !1;
        if (!ve)
            return lf(e),
            ve = !0,
            !1;
        var t = e.tag, n;
        if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type,
        n = !(n !== "form" && n !== "button") || Vs(e.type, e.memoizedProps)),
        n = !n),
        n && Me && yn(e),
        lf(e),
        t === 13) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(s(317));
            Me = Nh(e)
        } else if (t === 31) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(s(317));
            Me = Nh(e)
        } else
            t === 27 ? (t = Me,
            Ln(e.type) ? (e = Ks,
            Ks = null,
            Me = e) : Me = t) : Me = Fe ? Rt(e.stateNode.nextSibling) : null;
        return !0
    }
    function kn() {
        Me = Fe = null,
        ve = !1
    }
    function Cr() {
        var e = pn;
        return e !== null && (ot === null ? ot = e : ot.push.apply(ot, e),
        pn = null),
        e
    }
    function ol(e) {
        pn === null ? pn = [e] : pn.push(e)
    }
    var Tr = T(null)
      , Zn = null
      , $t = null;
    function vn(e, t, n) {
        Z(Tr, t._currentValue),
        t._currentValue = n
    }
    function Ft(e) {
        e._currentValue = Tr.current,
        B(Tr)
    }
    function Or(e, t, n) {
        for (; e !== null; ) {
            var a = e.alternate;
            if ((e.childLanes & t) !== t ? (e.childLanes |= t,
            a !== null && (a.childLanes |= t)) : a !== null && (a.childLanes & t) !== t && (a.childLanes |= t),
            e === n)
                break;
            e = e.return
        }
    }
    function Ar(e, t, n, a) {
        var u = e.child;
        for (u !== null && (u.return = e); u !== null; ) {
            var o = u.dependencies;
            if (o !== null) {
                var h = u.child;
                o = o.firstContext;
                e: for (; o !== null; ) {
                    var y = o;
                    o = u;
                    for (var C = 0; C < t.length; C++)
                        if (y.context === t[C]) {
                            o.lanes |= n,
                            y = o.alternate,
                            y !== null && (y.lanes |= n),
                            Or(o.return, n, e),
                            a || (h = null);
                            break e
                        }
                    o = y.next
                }
            } else if (u.tag === 18) {
                if (h = u.return,
                h === null)
                    throw Error(s(341));
                h.lanes |= n,
                o = h.alternate,
                o !== null && (o.lanes |= n),
                Or(h, n, e),
                h = null
            } else
                h = u.child;
            if (h !== null)
                h.return = u;
            else
                for (h = u; h !== null; ) {
                    if (h === e) {
                        h = null;
                        break
                    }
                    if (u = h.sibling,
                    u !== null) {
                        u.return = h.return,
                        h = u;
                        break
                    }
                    h = h.return
                }
            u = h
        }
    }
    function ba(e, t, n, a) {
        e = null;
        for (var u = t, o = !1; u !== null; ) {
            if (!o) {
                if ((u.flags & 524288) !== 0)
                    o = !0;
                else if ((u.flags & 262144) !== 0)
                    break
            }
            if (u.tag === 10) {
                var h = u.alternate;
                if (h === null)
                    throw Error(s(387));
                if (h = h.memoizedProps,
                h !== null) {
                    var y = u.type;
                    mt(u.pendingProps.value, h.value) || (e !== null ? e.push(y) : e = [y])
                }
            } else if (u === _e.current) {
                if (h = u.alternate,
                h === null)
                    throw Error(s(387));
                h.memoizedState.memoizedState !== u.memoizedState.memoizedState && (e !== null ? e.push(Ul) : e = [Ul])
            }
            u = u.return
        }
        e !== null && Ar(t, e, n, a),
        t.flags |= 262144
    }
    function _i(e) {
        for (e = e.firstContext; e !== null; ) {
            if (!mt(e.context._currentValue, e.memoizedValue))
                return !0;
            e = e.next
        }
        return !1
    }
    function Kn(e) {
        Zn = e,
        $t = null,
        e = e.dependencies,
        e !== null && (e.firstContext = null)
    }
    function We(e) {
        return uf(Zn, e)
    }
    function Ci(e, t) {
        return Zn === null && Kn(e),
        uf(e, t)
    }
    function uf(e, t) {
        var n = t._currentValue;
        if (t = {
            context: t,
            memoizedValue: n,
            next: null
        },
        $t === null) {
            if (e === null)
                throw Error(s(308));
            $t = t,
            e.dependencies = {
                lanes: 0,
                firstContext: t
            },
            e.flags |= 524288
        } else
            $t = $t.next = t;
        return n
    }
    var x0 = typeof AbortController < "u" ? AbortController : function() {
        var e = []
          , t = this.signal = {
            aborted: !1,
            addEventListener: function(n, a) {
                e.push(a)
            }
        };
        this.abort = function() {
            t.aborted = !0,
            e.forEach(function(n) {
                return n()
            })
        }
    }
      , S0 = i.unstable_scheduleCallback
      , E0 = i.unstable_NormalPriority
      , Ge = {
        $$typeof: V,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
    };
    function Rr() {
        return {
            controller: new x0,
            data: new Map,
            refCount: 0
        }
    }
    function cl(e) {
        e.refCount--,
        e.refCount === 0 && S0(E0, function() {
            e.controller.abort()
        })
    }
    var fl = null
      , Nr = 0
      , xa = 0
      , Sa = null;
    function w0(e, t) {
        if (fl === null) {
            var n = fl = [];
            Nr = 0,
            xa = js(),
            Sa = {
                status: "pending",
                value: void 0,
                then: function(a) {
                    n.push(a)
                }
            }
        }
        return Nr++,
        t.then(rf, rf),
        t
    }
    function rf() {
        if (--Nr === 0 && fl !== null) {
            Sa !== null && (Sa.status = "fulfilled");
            var e = fl;
            fl = null,
            xa = 0,
            Sa = null;
            for (var t = 0; t < e.length; t++)
                (0,
                e[t])()
        }
    }
    function _0(e, t) {
        var n = []
          , a = {
            status: "pending",
            value: null,
            reason: null,
            then: function(u) {
                n.push(u)
            }
        };
        return e.then(function() {
            a.status = "fulfilled",
            a.value = t;
            for (var u = 0; u < n.length; u++)
                (0,
                n[u])(t)
        }, function(u) {
            for (a.status = "rejected",
            a.reason = u,
            u = 0; u < n.length; u++)
                (0,
                n[u])(void 0)
        }),
        a
    }
    var sf = D.S;
    D.S = function(e, t) {
        kd = ft(),
        typeof t == "object" && t !== null && typeof t.then == "function" && w0(e, t),
        sf !== null && sf(e, t)
    }
    ;
    var Jn = T(null);
    function Lr() {
        var e = Jn.current;
        return e !== null ? e : Le.pooledCache
    }
    function Ti(e, t) {
        t === null ? Z(Jn, Jn.current) : Z(Jn, t.pool)
    }
    function of() {
        var e = Lr();
        return e === null ? null : {
            parent: Ge._currentValue,
            pool: e
        }
    }
    var Ea = Error(s(460))
      , Mr = Error(s(474))
      , Oi = Error(s(542))
      , Ai = {
        then: function() {}
    };
    function cf(e) {
        return e = e.status,
        e === "fulfilled" || e === "rejected"
    }
    function ff(e, t, n) {
        switch (n = e[n],
        n === void 0 ? e.push(t) : n !== t && (t.then(kt, kt),
        t = n),
        t.status) {
        case "fulfilled":
            return t.value;
        case "rejected":
            throw e = t.reason,
            hf(e),
            e;
        default:
            if (typeof t.status == "string")
                t.then(kt, kt);
            else {
                if (e = Le,
                e !== null && 100 < e.shellSuspendCounter)
                    throw Error(s(482));
                e = t,
                e.status = "pending",
                e.then(function(a) {
                    if (t.status === "pending") {
                        var u = t;
                        u.status = "fulfilled",
                        u.value = a
                    }
                }, function(a) {
                    if (t.status === "pending") {
                        var u = t;
                        u.status = "rejected",
                        u.reason = a
                    }
                })
            }
            switch (t.status) {
            case "fulfilled":
                return t.value;
            case "rejected":
                throw e = t.reason,
                hf(e),
                e
            }
            throw Fn = t,
            Ea
        }
    }
    function $n(e) {
        try {
            var t = e._init;
            return t(e._payload)
        } catch (n) {
            throw n !== null && typeof n == "object" && typeof n.then == "function" ? (Fn = n,
            Ea) : n
        }
    }
    var Fn = null;
    function df() {
        if (Fn === null)
            throw Error(s(459));
        var e = Fn;
        return Fn = null,
        e
    }
    function hf(e) {
        if (e === Ea || e === Oi)
            throw Error(s(483))
    }
    var wa = null
      , dl = 0;
    function Ri(e) {
        var t = dl;
        return dl += 1,
        wa === null && (wa = []),
        ff(wa, e, t)
    }
    function hl(e, t) {
        t = t.props.ref,
        e.ref = t !== void 0 ? t : null
    }
    function Ni(e, t) {
        throw t.$$typeof === S ? Error(s(525)) : (e = Object.prototype.toString.call(t),
        Error(s(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)))
    }
    function mf(e) {
        function t(R, O) {
            if (e) {
                var N = R.deletions;
                N === null ? (R.deletions = [O],
                R.flags |= 16) : N.push(O)
            }
        }
        function n(R, O) {
            if (!e)
                return null;
            for (; O !== null; )
                t(R, O),
                O = O.sibling;
            return null
        }
        function a(R) {
            for (var O = new Map; R !== null; )
                R.key !== null ? O.set(R.key, R) : O.set(R.index, R),
                R = R.sibling;
            return O
        }
        function u(R, O) {
            return R = Kt(R, O),
            R.index = 0,
            R.sibling = null,
            R
        }
        function o(R, O, N) {
            return R.index = N,
            e ? (N = R.alternate,
            N !== null ? (N = N.index,
            N < O ? (R.flags |= 67108866,
            O) : N) : (R.flags |= 67108866,
            O)) : (R.flags |= 1048576,
            O)
        }
        function h(R) {
            return e && R.alternate === null && (R.flags |= 67108866),
            R
        }
        function y(R, O, N, q) {
            return O === null || O.tag !== 6 ? (O = xr(N, R.mode, q),
            O.return = R,
            O) : (O = u(O, N),
            O.return = R,
            O)
        }
        function C(R, O, N, q) {
            var ee = N.type;
            return ee === A ? H(R, O, N.props.children, q, N.key) : O !== null && (O.elementType === ee || typeof ee == "object" && ee !== null && ee.$$typeof === ye && $n(ee) === O.type) ? (O = u(O, N.props),
            hl(O, N),
            O.return = R,
            O) : (O = Ei(N.type, N.key, N.props, null, R.mode, q),
            hl(O, N),
            O.return = R,
            O)
        }
        function L(R, O, N, q) {
            return O === null || O.tag !== 4 || O.stateNode.containerInfo !== N.containerInfo || O.stateNode.implementation !== N.implementation ? (O = Sr(N, R.mode, q),
            O.return = R,
            O) : (O = u(O, N.children || []),
            O.return = R,
            O)
        }
        function H(R, O, N, q, ee) {
            return O === null || O.tag !== 7 ? (O = Xn(N, R.mode, q, ee),
            O.return = R,
            O) : (O = u(O, N),
            O.return = R,
            O)
        }
        function Y(R, O, N) {
            if (typeof O == "string" && O !== "" || typeof O == "number" || typeof O == "bigint")
                return O = xr("" + O, R.mode, N),
                O.return = R,
                O;
            if (typeof O == "object" && O !== null) {
                switch (O.$$typeof) {
                case x:
                    return N = Ei(O.type, O.key, O.props, null, R.mode, N),
                    hl(N, O),
                    N.return = R,
                    N;
                case E:
                    return O = Sr(O, R.mode, N),
                    O.return = R,
                    O;
                case ye:
                    return O = $n(O),
                    Y(R, O, N)
                }
                if (fe(O) || K(O))
                    return O = Xn(O, R.mode, N, null),
                    O.return = R,
                    O;
                if (typeof O.then == "function")
                    return Y(R, Ri(O), N);
                if (O.$$typeof === V)
                    return Y(R, Ci(R, O), N);
                Ni(R, O)
            }
            return null
        }
        function M(R, O, N, q) {
            var ee = O !== null ? O.key : null;
            if (typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint")
                return ee !== null ? null : y(R, O, "" + N, q);
            if (typeof N == "object" && N !== null) {
                switch (N.$$typeof) {
                case x:
                    return N.key === ee ? C(R, O, N, q) : null;
                case E:
                    return N.key === ee ? L(R, O, N, q) : null;
                case ye:
                    return N = $n(N),
                    M(R, O, N, q)
                }
                if (fe(N) || K(N))
                    return ee !== null ? null : H(R, O, N, q, null);
                if (typeof N.then == "function")
                    return M(R, O, Ri(N), q);
                if (N.$$typeof === V)
                    return M(R, O, Ci(R, N), q);
                Ni(R, N)
            }
            return null
        }
        function z(R, O, N, q, ee) {
            if (typeof q == "string" && q !== "" || typeof q == "number" || typeof q == "bigint")
                return R = R.get(N) || null,
                y(O, R, "" + q, ee);
            if (typeof q == "object" && q !== null) {
                switch (q.$$typeof) {
                case x:
                    return R = R.get(q.key === null ? N : q.key) || null,
                    C(O, R, q, ee);
                case E:
                    return R = R.get(q.key === null ? N : q.key) || null,
                    L(O, R, q, ee);
                case ye:
                    return q = $n(q),
                    z(R, O, N, q, ee)
                }
                if (fe(q) || K(q))
                    return R = R.get(N) || null,
                    H(O, R, q, ee, null);
                if (typeof q.then == "function")
                    return z(R, O, N, Ri(q), ee);
                if (q.$$typeof === V)
                    return z(R, O, N, Ci(O, q), ee);
                Ni(O, q)
            }
            return null
        }
        function F(R, O, N, q) {
            for (var ee = null, xe = null, P = O, ce = O = 0, pe = null; P !== null && ce < N.length; ce++) {
                P.index > ce ? (pe = P,
                P = null) : pe = P.sibling;
                var Se = M(R, P, N[ce], q);
                if (Se === null) {
                    P === null && (P = pe);
                    break
                }
                e && P && Se.alternate === null && t(R, P),
                O = o(Se, O, ce),
                xe === null ? ee = Se : xe.sibling = Se,
                xe = Se,
                P = pe
            }
            if (ce === N.length)
                return n(R, P),
                ve && Jt(R, ce),
                ee;
            if (P === null) {
                for (; ce < N.length; ce++)
                    P = Y(R, N[ce], q),
                    P !== null && (O = o(P, O, ce),
                    xe === null ? ee = P : xe.sibling = P,
                    xe = P);
                return ve && Jt(R, ce),
                ee
            }
            for (P = a(P); ce < N.length; ce++)
                pe = z(P, R, ce, N[ce], q),
                pe !== null && (e && pe.alternate !== null && P.delete(pe.key === null ? ce : pe.key),
                O = o(pe, O, ce),
                xe === null ? ee = pe : xe.sibling = pe,
                xe = pe);
            return e && P.forEach(function(Un) {
                return t(R, Un)
            }),
            ve && Jt(R, ce),
            ee
        }
        function ae(R, O, N, q) {
            if (N == null)
                throw Error(s(151));
            for (var ee = null, xe = null, P = O, ce = O = 0, pe = null, Se = N.next(); P !== null && !Se.done; ce++,
            Se = N.next()) {
                P.index > ce ? (pe = P,
                P = null) : pe = P.sibling;
                var Un = M(R, P, Se.value, q);
                if (Un === null) {
                    P === null && (P = pe);
                    break
                }
                e && P && Un.alternate === null && t(R, P),
                O = o(Un, O, ce),
                xe === null ? ee = Un : xe.sibling = Un,
                xe = Un,
                P = pe
            }
            if (Se.done)
                return n(R, P),
                ve && Jt(R, ce),
                ee;
            if (P === null) {
                for (; !Se.done; ce++,
                Se = N.next())
                    Se = Y(R, Se.value, q),
                    Se !== null && (O = o(Se, O, ce),
                    xe === null ? ee = Se : xe.sibling = Se,
                    xe = Se);
                return ve && Jt(R, ce),
                ee
            }
            for (P = a(P); !Se.done; ce++,
            Se = N.next())
                Se = z(P, R, ce, Se.value, q),
                Se !== null && (e && Se.alternate !== null && P.delete(Se.key === null ? ce : Se.key),
                O = o(Se, O, ce),
                xe === null ? ee = Se : xe.sibling = Se,
                xe = Se);
            return e && P.forEach(function(Dy) {
                return t(R, Dy)
            }),
            ve && Jt(R, ce),
            ee
        }
        function Ne(R, O, N, q) {
            if (typeof N == "object" && N !== null && N.type === A && N.key === null && (N = N.props.children),
            typeof N == "object" && N !== null) {
                switch (N.$$typeof) {
                case x:
                    e: {
                        for (var ee = N.key; O !== null; ) {
                            if (O.key === ee) {
                                if (ee = N.type,
                                ee === A) {
                                    if (O.tag === 7) {
                                        n(R, O.sibling),
                                        q = u(O, N.props.children),
                                        q.return = R,
                                        R = q;
                                        break e
                                    }
                                } else if (O.elementType === ee || typeof ee == "object" && ee !== null && ee.$$typeof === ye && $n(ee) === O.type) {
                                    n(R, O.sibling),
                                    q = u(O, N.props),
                                    hl(q, N),
                                    q.return = R,
                                    R = q;
                                    break e
                                }
                                n(R, O);
                                break
                            } else
                                t(R, O);
                            O = O.sibling
                        }
                        N.type === A ? (q = Xn(N.props.children, R.mode, q, N.key),
                        q.return = R,
                        R = q) : (q = Ei(N.type, N.key, N.props, null, R.mode, q),
                        hl(q, N),
                        q.return = R,
                        R = q)
                    }
                    return h(R);
                case E:
                    e: {
                        for (ee = N.key; O !== null; ) {
                            if (O.key === ee)
                                if (O.tag === 4 && O.stateNode.containerInfo === N.containerInfo && O.stateNode.implementation === N.implementation) {
                                    n(R, O.sibling),
                                    q = u(O, N.children || []),
                                    q.return = R,
                                    R = q;
                                    break e
                                } else {
                                    n(R, O);
                                    break
                                }
                            else
                                t(R, O);
                            O = O.sibling
                        }
                        q = Sr(N, R.mode, q),
                        q.return = R,
                        R = q
                    }
                    return h(R);
                case ye:
                    return N = $n(N),
                    Ne(R, O, N, q)
                }
                if (fe(N))
                    return F(R, O, N, q);
                if (K(N)) {
                    if (ee = K(N),
                    typeof ee != "function")
                        throw Error(s(150));
                    return N = ee.call(N),
                    ae(R, O, N, q)
                }
                if (typeof N.then == "function")
                    return Ne(R, O, Ri(N), q);
                if (N.$$typeof === V)
                    return Ne(R, O, Ci(R, N), q);
                Ni(R, N)
            }
            return typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint" ? (N = "" + N,
            O !== null && O.tag === 6 ? (n(R, O.sibling),
            q = u(O, N),
            q.return = R,
            R = q) : (n(R, O),
            q = xr(N, R.mode, q),
            q.return = R,
            R = q),
            h(R)) : n(R, O)
        }
        return function(R, O, N, q) {
            try {
                dl = 0;
                var ee = Ne(R, O, N, q);
                return wa = null,
                ee
            } catch (P) {
                if (P === Ea || P === Oi)
                    throw P;
                var xe = gt(29, P, null, R.mode);
                return xe.lanes = q,
                xe.return = R,
                xe
            }
        }
    }
    var Wn = mf(!0)
      , gf = mf(!1)
      , bn = !1;
    function jr(e) {
        e.updateQueue = {
            baseState: e.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: {
                pending: null,
                lanes: 0,
                hiddenCallbacks: null
            },
            callbacks: null
        }
    }
    function zr(e, t) {
        e = e.updateQueue,
        t.updateQueue === e && (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null
        })
    }
    function xn(e) {
        return {
            lane: e,
            tag: 0,
            payload: null,
            callback: null,
            next: null
        }
    }
    function Sn(e, t, n) {
        var a = e.updateQueue;
        if (a === null)
            return null;
        if (a = a.shared,
        (Ee & 2) !== 0) {
            var u = a.pending;
            return u === null ? t.next = t : (t.next = u.next,
            u.next = t),
            a.pending = t,
            t = Si(e),
            Wc(e, null, n),
            t
        }
        return xi(e, a, t, n),
        Si(e)
    }
    function ml(e, t, n) {
        if (t = t.updateQueue,
        t !== null && (t = t.shared,
        (n & 4194048) !== 0)) {
            var a = t.lanes;
            a &= e.pendingLanes,
            n |= a,
            t.lanes = n,
            ic(e, n)
        }
    }
    function Dr(e, t) {
        var n = e.updateQueue
          , a = e.alternate;
        if (a !== null && (a = a.updateQueue,
        n === a)) {
            var u = null
              , o = null;
            if (n = n.firstBaseUpdate,
            n !== null) {
                do {
                    var h = {
                        lane: n.lane,
                        tag: n.tag,
                        payload: n.payload,
                        callback: null,
                        next: null
                    };
                    o === null ? u = o = h : o = o.next = h,
                    n = n.next
                } while (n !== null);
                o === null ? u = o = t : o = o.next = t
            } else
                u = o = t;
            n = {
                baseState: a.baseState,
                firstBaseUpdate: u,
                lastBaseUpdate: o,
                shared: a.shared,
                callbacks: a.callbacks
            },
            e.updateQueue = n;
            return
        }
        e = n.lastBaseUpdate,
        e === null ? n.firstBaseUpdate = t : e.next = t,
        n.lastBaseUpdate = t
    }
    var Ur = !1;
    function gl() {
        if (Ur) {
            var e = Sa;
            if (e !== null)
                throw e
        }
    }
    function pl(e, t, n, a) {
        Ur = !1;
        var u = e.updateQueue;
        bn = !1;
        var o = u.firstBaseUpdate
          , h = u.lastBaseUpdate
          , y = u.shared.pending;
        if (y !== null) {
            u.shared.pending = null;
            var C = y
              , L = C.next;
            C.next = null,
            h === null ? o = L : h.next = L,
            h = C;
            var H = e.alternate;
            H !== null && (H = H.updateQueue,
            y = H.lastBaseUpdate,
            y !== h && (y === null ? H.firstBaseUpdate = L : y.next = L,
            H.lastBaseUpdate = C))
        }
        if (o !== null) {
            var Y = u.baseState;
            h = 0,
            H = L = C = null,
            y = o;
            do {
                var M = y.lane & -536870913
                  , z = M !== y.lane;
                if (z ? (ge & M) === M : (a & M) === M) {
                    M !== 0 && M === xa && (Ur = !0),
                    H !== null && (H = H.next = {
                        lane: 0,
                        tag: y.tag,
                        payload: y.payload,
                        callback: null,
                        next: null
                    });
                    e: {
                        var F = e
                          , ae = y;
                        M = t;
                        var Ne = n;
                        switch (ae.tag) {
                        case 1:
                            if (F = ae.payload,
                            typeof F == "function") {
                                Y = F.call(Ne, Y, M);
                                break e
                            }
                            Y = F;
                            break e;
                        case 3:
                            F.flags = F.flags & -65537 | 128;
                        case 0:
                            if (F = ae.payload,
                            M = typeof F == "function" ? F.call(Ne, Y, M) : F,
                            M == null)
                                break e;
                            Y = v({}, Y, M);
                            break e;
                        case 2:
                            bn = !0
                        }
                    }
                    M = y.callback,
                    M !== null && (e.flags |= 64,
                    z && (e.flags |= 8192),
                    z = u.callbacks,
                    z === null ? u.callbacks = [M] : z.push(M))
                } else
                    z = {
                        lane: M,
                        tag: y.tag,
                        payload: y.payload,
                        callback: y.callback,
                        next: null
                    },
                    H === null ? (L = H = z,
                    C = Y) : H = H.next = z,
                    h |= M;
                if (y = y.next,
                y === null) {
                    if (y = u.shared.pending,
                    y === null)
                        break;
                    z = y,
                    y = z.next,
                    z.next = null,
                    u.lastBaseUpdate = z,
                    u.shared.pending = null
                }
            } while (!0);
            H === null && (C = Y),
            u.baseState = C,
            u.firstBaseUpdate = L,
            u.lastBaseUpdate = H,
            o === null && (u.shared.lanes = 0),
            Tn |= h,
            e.lanes = h,
            e.memoizedState = Y
        }
    }
    function pf(e, t) {
        if (typeof e != "function")
            throw Error(s(191, e));
        e.call(t)
    }
    function yf(e, t) {
        var n = e.callbacks;
        if (n !== null)
            for (e.callbacks = null,
            e = 0; e < n.length; e++)
                pf(n[e], t)
    }
    var _a = T(null)
      , Li = T(0);
    function vf(e, t) {
        e = un,
        Z(Li, e),
        Z(_a, t),
        un = e | t.baseLanes
    }
    function Hr() {
        Z(Li, un),
        Z(_a, _a.current)
    }
    function Br() {
        un = Li.current,
        B(_a),
        B(Li)
    }
    var pt = T(null)
      , At = null;
    function En(e) {
        var t = e.alternate;
        Z(Be, Be.current & 1),
        Z(pt, e),
        At === null && (t === null || _a.current !== null || t.memoizedState !== null) && (At = e)
    }
    function qr(e) {
        Z(Be, Be.current),
        Z(pt, e),
        At === null && (At = e)
    }
    function bf(e) {
        e.tag === 22 ? (Z(Be, Be.current),
        Z(pt, e),
        At === null && (At = e)) : wn()
    }
    function wn() {
        Z(Be, Be.current),
        Z(pt, pt.current)
    }
    function yt(e) {
        B(pt),
        At === e && (At = null),
        B(Be)
    }
    var Be = T(0);
    function Mi(e) {
        for (var t = e; t !== null; ) {
            if (t.tag === 13) {
                var n = t.memoizedState;
                if (n !== null && (n = n.dehydrated,
                n === null || ks(n) || Zs(n)))
                    return t
            } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
                if ((t.flags & 128) !== 0)
                    return t
            } else if (t.child !== null) {
                t.child.return = t,
                t = t.child;
                continue
            }
            if (t === e)
                break;
            for (; t.sibling === null; ) {
                if (t.return === null || t.return === e)
                    return null;
                t = t.return
            }
            t.sibling.return = t.return,
            t = t.sibling
        }
        return null
    }
    var Wt = 0
      , re = null
      , Ae = null
      , Ye = null
      , ji = !1
      , Ca = !1
      , In = !1
      , zi = 0
      , yl = 0
      , Ta = null
      , C0 = 0;
    function De() {
        throw Error(s(321))
    }
    function Gr(e, t) {
        if (t === null)
            return !1;
        for (var n = 0; n < t.length && n < e.length; n++)
            if (!mt(e[n], t[n]))
                return !1;
        return !0
    }
    function Yr(e, t, n, a, u, o) {
        return Wt = o,
        re = t,
        t.memoizedState = null,
        t.updateQueue = null,
        t.lanes = 0,
        D.H = e === null || e.memoizedState === null ? nd : ns,
        In = !1,
        o = n(a, u),
        In = !1,
        Ca && (o = Sf(t, n, a, u)),
        xf(e),
        o
    }
    function xf(e) {
        D.H = xl;
        var t = Ae !== null && Ae.next !== null;
        if (Wt = 0,
        Ye = Ae = re = null,
        ji = !1,
        yl = 0,
        Ta = null,
        t)
            throw Error(s(300));
        e === null || Ve || (e = e.dependencies,
        e !== null && _i(e) && (Ve = !0))
    }
    function Sf(e, t, n, a) {
        re = e;
        var u = 0;
        do {
            if (Ca && (Ta = null),
            yl = 0,
            Ca = !1,
            25 <= u)
                throw Error(s(301));
            if (u += 1,
            Ye = Ae = null,
            e.updateQueue != null) {
                var o = e.updateQueue;
                o.lastEffect = null,
                o.events = null,
                o.stores = null,
                o.memoCache != null && (o.memoCache.index = 0)
            }
            D.H = ad,
            o = t(n, a)
        } while (Ca);
        return o
    }
    function T0() {
        var e = D.H
          , t = e.useState()[0];
        return t = typeof t.then == "function" ? vl(t) : t,
        e = e.useState()[0],
        (Ae !== null ? Ae.memoizedState : null) !== e && (re.flags |= 1024),
        t
    }
    function Vr() {
        var e = zi !== 0;
        return zi = 0,
        e
    }
    function Qr(e, t, n) {
        t.updateQueue = e.updateQueue,
        t.flags &= -2053,
        e.lanes &= ~n
    }
    function Xr(e) {
        if (ji) {
            for (e = e.memoizedState; e !== null; ) {
                var t = e.queue;
                t !== null && (t.pending = null),
                e = e.next
            }
            ji = !1
        }
        Wt = 0,
        Ye = Ae = re = null,
        Ca = !1,
        yl = zi = 0,
        Ta = null
    }
    function at() {
        var e = {
            memoizedState: null,
            baseState: null,
            baseQueue: null,
            queue: null,
            next: null
        };
        return Ye === null ? re.memoizedState = Ye = e : Ye = Ye.next = e,
        Ye
    }
    function qe() {
        if (Ae === null) {
            var e = re.alternate;
            e = e !== null ? e.memoizedState : null
        } else
            e = Ae.next;
        var t = Ye === null ? re.memoizedState : Ye.next;
        if (t !== null)
            Ye = t,
            Ae = e;
        else {
            if (e === null)
                throw re.alternate === null ? Error(s(467)) : Error(s(310));
            Ae = e,
            e = {
                memoizedState: Ae.memoizedState,
                baseState: Ae.baseState,
                baseQueue: Ae.baseQueue,
                queue: Ae.queue,
                next: null
            },
            Ye === null ? re.memoizedState = Ye = e : Ye = Ye.next = e
        }
        return Ye
    }
    function Di() {
        return {
            lastEffect: null,
            events: null,
            stores: null,
            memoCache: null
        }
    }
    function vl(e) {
        var t = yl;
        return yl += 1,
        Ta === null && (Ta = []),
        e = ff(Ta, e, t),
        t = re,
        (Ye === null ? t.memoizedState : Ye.next) === null && (t = t.alternate,
        D.H = t === null || t.memoizedState === null ? nd : ns),
        e
    }
    function Ui(e) {
        if (e !== null && typeof e == "object") {
            if (typeof e.then == "function")
                return vl(e);
            if (e.$$typeof === V)
                return We(e)
        }
        throw Error(s(438, String(e)))
    }
    function kr(e) {
        var t = null
          , n = re.updateQueue;
        if (n !== null && (t = n.memoCache),
        t == null) {
            var a = re.alternate;
            a !== null && (a = a.updateQueue,
            a !== null && (a = a.memoCache,
            a != null && (t = {
                data: a.data.map(function(u) {
                    return u.slice()
                }),
                index: 0
            })))
        }
        if (t == null && (t = {
            data: [],
            index: 0
        }),
        n === null && (n = Di(),
        re.updateQueue = n),
        n.memoCache = t,
        n = t.data[t.index],
        n === void 0)
            for (n = t.data[t.index] = Array(e),
            a = 0; a < e; a++)
                n[a] = Q;
        return t.index++,
        n
    }
    function It(e, t) {
        return typeof t == "function" ? t(e) : t
    }
    function Hi(e) {
        var t = qe();
        return Zr(t, Ae, e)
    }
    function Zr(e, t, n) {
        var a = e.queue;
        if (a === null)
            throw Error(s(311));
        a.lastRenderedReducer = n;
        var u = e.baseQueue
          , o = a.pending;
        if (o !== null) {
            if (u !== null) {
                var h = u.next;
                u.next = o.next,
                o.next = h
            }
            t.baseQueue = u = o,
            a.pending = null
        }
        if (o = e.baseState,
        u === null)
            e.memoizedState = o;
        else {
            t = u.next;
            var y = h = null
              , C = null
              , L = t
              , H = !1;
            do {
                var Y = L.lane & -536870913;
                if (Y !== L.lane ? (ge & Y) === Y : (Wt & Y) === Y) {
                    var M = L.revertLane;
                    if (M === 0)
                        C !== null && (C = C.next = {
                            lane: 0,
                            revertLane: 0,
                            gesture: null,
                            action: L.action,
                            hasEagerState: L.hasEagerState,
                            eagerState: L.eagerState,
                            next: null
                        }),
                        Y === xa && (H = !0);
                    else if ((Wt & M) === M) {
                        L = L.next,
                        M === xa && (H = !0);
                        continue
                    } else
                        Y = {
                            lane: 0,
                            revertLane: L.revertLane,
                            gesture: null,
                            action: L.action,
                            hasEagerState: L.hasEagerState,
                            eagerState: L.eagerState,
                            next: null
                        },
                        C === null ? (y = C = Y,
                        h = o) : C = C.next = Y,
                        re.lanes |= M,
                        Tn |= M;
                    Y = L.action,
                    In && n(o, Y),
                    o = L.hasEagerState ? L.eagerState : n(o, Y)
                } else
                    M = {
                        lane: Y,
                        revertLane: L.revertLane,
                        gesture: L.gesture,
                        action: L.action,
                        hasEagerState: L.hasEagerState,
                        eagerState: L.eagerState,
                        next: null
                    },
                    C === null ? (y = C = M,
                    h = o) : C = C.next = M,
                    re.lanes |= Y,
                    Tn |= Y;
                L = L.next
            } while (L !== null && L !== t);
            if (C === null ? h = o : C.next = y,
            !mt(o, e.memoizedState) && (Ve = !0,
            H && (n = Sa,
            n !== null)))
                throw n;
            e.memoizedState = o,
            e.baseState = h,
            e.baseQueue = C,
            a.lastRenderedState = o
        }
        return u === null && (a.lanes = 0),
        [e.memoizedState, a.dispatch]
    }
    function Kr(e) {
        var t = qe()
          , n = t.queue;
        if (n === null)
            throw Error(s(311));
        n.lastRenderedReducer = e;
        var a = n.dispatch
          , u = n.pending
          , o = t.memoizedState;
        if (u !== null) {
            n.pending = null;
            var h = u = u.next;
            do
                o = e(o, h.action),
                h = h.next;
            while (h !== u);
            mt(o, t.memoizedState) || (Ve = !0),
            t.memoizedState = o,
            t.baseQueue === null && (t.baseState = o),
            n.lastRenderedState = o
        }
        return [o, a]
    }
    function Ef(e, t, n) {
        var a = re
          , u = qe()
          , o = ve;
        if (o) {
            if (n === void 0)
                throw Error(s(407));
            n = n()
        } else
            n = t();
        var h = !mt((Ae || u).memoizedState, n);
        if (h && (u.memoizedState = n,
        Ve = !0),
        u = u.queue,
        Fr(Cf.bind(null, a, u, e), [e]),
        u.getSnapshot !== t || h || Ye !== null && Ye.memoizedState.tag & 1) {
            if (a.flags |= 2048,
            Oa(9, {
                destroy: void 0
            }, _f.bind(null, a, u, n, t), null),
            Le === null)
                throw Error(s(349));
            o || (Wt & 127) !== 0 || wf(a, t, n)
        }
        return n
    }
    function wf(e, t, n) {
        e.flags |= 16384,
        e = {
            getSnapshot: t,
            value: n
        },
        t = re.updateQueue,
        t === null ? (t = Di(),
        re.updateQueue = t,
        t.stores = [e]) : (n = t.stores,
        n === null ? t.stores = [e] : n.push(e))
    }
    function _f(e, t, n, a) {
        t.value = n,
        t.getSnapshot = a,
        Tf(t) && Of(e)
    }
    function Cf(e, t, n) {
        return n(function() {
            Tf(t) && Of(e)
        })
    }
    function Tf(e) {
        var t = e.getSnapshot;
        e = e.value;
        try {
            var n = t();
            return !mt(e, n)
        } catch {
            return !0
        }
    }
    function Of(e) {
        var t = Qn(e, 2);
        t !== null && ct(t, e, 2)
    }
    function Jr(e) {
        var t = at();
        if (typeof e == "function") {
            var n = e;
            if (e = n(),
            In) {
                dn(!0);
                try {
                    n()
                } finally {
                    dn(!1)
                }
            }
        }
        return t.memoizedState = t.baseState = e,
        t.queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: It,
            lastRenderedState: e
        },
        t
    }
    function Af(e, t, n, a) {
        return e.baseState = n,
        Zr(e, Ae, typeof a == "function" ? a : It)
    }
    function O0(e, t, n, a, u) {
        if (Gi(e))
            throw Error(s(485));
        if (e = t.action,
        e !== null) {
            var o = {
                payload: u,
                action: e,
                next: null,
                isTransition: !0,
                status: "pending",
                value: null,
                reason: null,
                listeners: [],
                then: function(h) {
                    o.listeners.push(h)
                }
            };
            D.T !== null ? n(!0) : o.isTransition = !1,
            a(o),
            n = t.pending,
            n === null ? (o.next = t.pending = o,
            Rf(t, o)) : (o.next = n.next,
            t.pending = n.next = o)
        }
    }
    function Rf(e, t) {
        var n = t.action
          , a = t.payload
          , u = e.state;
        if (t.isTransition) {
            var o = D.T
              , h = {};
            D.T = h;
            try {
                var y = n(u, a)
                  , C = D.S;
                C !== null && C(h, y),
                Nf(e, t, y)
            } catch (L) {
                $r(e, t, L)
            } finally {
                o !== null && h.types !== null && (o.types = h.types),
                D.T = o
            }
        } else
            try {
                o = n(u, a),
                Nf(e, t, o)
            } catch (L) {
                $r(e, t, L)
            }
    }
    function Nf(e, t, n) {
        n !== null && typeof n == "object" && typeof n.then == "function" ? n.then(function(a) {
            Lf(e, t, a)
        }, function(a) {
            return $r(e, t, a)
        }) : Lf(e, t, n)
    }
    function Lf(e, t, n) {
        t.status = "fulfilled",
        t.value = n,
        Mf(t),
        e.state = n,
        t = e.pending,
        t !== null && (n = t.next,
        n === t ? e.pending = null : (n = n.next,
        t.next = n,
        Rf(e, n)))
    }
    function $r(e, t, n) {
        var a = e.pending;
        if (e.pending = null,
        a !== null) {
            a = a.next;
            do
                t.status = "rejected",
                t.reason = n,
                Mf(t),
                t = t.next;
            while (t !== a)
        }
        e.action = null
    }
    function Mf(e) {
        e = e.listeners;
        for (var t = 0; t < e.length; t++)
            (0,
            e[t])()
    }
    function jf(e, t) {
        return t
    }
    function zf(e, t) {
        if (ve) {
            var n = Le.formState;
            if (n !== null) {
                e: {
                    var a = re;
                    if (ve) {
                        if (Me) {
                            t: {
                                for (var u = Me, o = Ot; u.nodeType !== 8; ) {
                                    if (!o) {
                                        u = null;
                                        break t
                                    }
                                    if (u = Rt(u.nextSibling),
                                    u === null) {
                                        u = null;
                                        break t
                                    }
                                }
                                o = u.data,
                                u = o === "F!" || o === "F" ? u : null
                            }
                            if (u) {
                                Me = Rt(u.nextSibling),
                                a = u.data === "F!";
                                break e
                            }
                        }
                        yn(a)
                    }
                    a = !1
                }
                a && (t = n[0])
            }
        }
        return n = at(),
        n.memoizedState = n.baseState = t,
        a = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: jf,
            lastRenderedState: t
        },
        n.queue = a,
        n = Pf.bind(null, re, a),
        a.dispatch = n,
        a = Jr(!1),
        o = ts.bind(null, re, !1, a.queue),
        a = at(),
        u = {
            state: t,
            dispatch: null,
            action: e,
            pending: null
        },
        a.queue = u,
        n = O0.bind(null, re, u, o, n),
        u.dispatch = n,
        a.memoizedState = e,
        [t, n, !1]
    }
    function Df(e) {
        var t = qe();
        return Uf(t, Ae, e)
    }
    function Uf(e, t, n) {
        if (t = Zr(e, t, jf)[0],
        e = Hi(It)[0],
        typeof t == "object" && t !== null && typeof t.then == "function")
            try {
                var a = vl(t)
            } catch (h) {
                throw h === Ea ? Oi : h
            }
        else
            a = t;
        t = qe();
        var u = t.queue
          , o = u.dispatch;
        return n !== t.memoizedState && (re.flags |= 2048,
        Oa(9, {
            destroy: void 0
        }, A0.bind(null, u, n), null)),
        [a, o, e]
    }
    function A0(e, t) {
        e.action = t
    }
    function Hf(e) {
        var t = qe()
          , n = Ae;
        if (n !== null)
            return Uf(t, n, e);
        qe(),
        t = t.memoizedState,
        n = qe();
        var a = n.queue.dispatch;
        return n.memoizedState = e,
        [t, a, !1]
    }
    function Oa(e, t, n, a) {
        return e = {
            tag: e,
            create: n,
            deps: a,
            inst: t,
            next: null
        },
        t = re.updateQueue,
        t === null && (t = Di(),
        re.updateQueue = t),
        n = t.lastEffect,
        n === null ? t.lastEffect = e.next = e : (a = n.next,
        n.next = e,
        e.next = a,
        t.lastEffect = e),
        e
    }
    function Bf() {
        return qe().memoizedState
    }
    function Bi(e, t, n, a) {
        var u = at();
        re.flags |= e,
        u.memoizedState = Oa(1 | t, {
            destroy: void 0
        }, n, a === void 0 ? null : a)
    }
    function qi(e, t, n, a) {
        var u = qe();
        a = a === void 0 ? null : a;
        var o = u.memoizedState.inst;
        Ae !== null && a !== null && Gr(a, Ae.memoizedState.deps) ? u.memoizedState = Oa(t, o, n, a) : (re.flags |= e,
        u.memoizedState = Oa(1 | t, o, n, a))
    }
    function qf(e, t) {
        Bi(8390656, 8, e, t)
    }
    function Fr(e, t) {
        qi(2048, 8, e, t)
    }
    function R0(e) {
        re.flags |= 4;
        var t = re.updateQueue;
        if (t === null)
            t = Di(),
            re.updateQueue = t,
            t.events = [e];
        else {
            var n = t.events;
            n === null ? t.events = [e] : n.push(e)
        }
    }
    function Gf(e) {
        var t = qe().memoizedState;
        return R0({
            ref: t,
            nextImpl: e
        }),
        function() {
            if ((Ee & 2) !== 0)
                throw Error(s(440));
            return t.impl.apply(void 0, arguments)
        }
    }
    function Yf(e, t) {
        return qi(4, 2, e, t)
    }
    function Vf(e, t) {
        return qi(4, 4, e, t)
    }
    function Qf(e, t) {
        if (typeof t == "function") {
            e = e();
            var n = t(e);
            return function() {
                typeof n == "function" ? n() : t(null)
            }
        }
        if (t != null)
            return e = e(),
            t.current = e,
            function() {
                t.current = null
            }
    }
    function Xf(e, t, n) {
        n = n != null ? n.concat([e]) : null,
        qi(4, 4, Qf.bind(null, t, e), n)
    }
    function Wr() {}
    function kf(e, t) {
        var n = qe();
        t = t === void 0 ? null : t;
        var a = n.memoizedState;
        return t !== null && Gr(t, a[1]) ? a[0] : (n.memoizedState = [e, t],
        e)
    }
    function Zf(e, t) {
        var n = qe();
        t = t === void 0 ? null : t;
        var a = n.memoizedState;
        if (t !== null && Gr(t, a[1]))
            return a[0];
        if (a = e(),
        In) {
            dn(!0);
            try {
                e()
            } finally {
                dn(!1)
            }
        }
        return n.memoizedState = [a, t],
        a
    }
    function Ir(e, t, n) {
        return n === void 0 || (Wt & 1073741824) !== 0 && (ge & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = n,
        e = Kd(),
        re.lanes |= e,
        Tn |= e,
        n)
    }
    function Kf(e, t, n, a) {
        return mt(n, t) ? n : _a.current !== null ? (e = Ir(e, n, a),
        mt(e, t) || (Ve = !0),
        e) : (Wt & 42) === 0 || (Wt & 1073741824) !== 0 && (ge & 261930) === 0 ? (Ve = !0,
        e.memoizedState = n) : (e = Kd(),
        re.lanes |= e,
        Tn |= e,
        t)
    }
    function Jf(e, t, n, a, u) {
        var o = X.p;
        X.p = o !== 0 && 8 > o ? o : 8;
        var h = D.T
          , y = {};
        D.T = y,
        ts(e, !1, t, n);
        try {
            var C = u()
              , L = D.S;
            if (L !== null && L(y, C),
            C !== null && typeof C == "object" && typeof C.then == "function") {
                var H = _0(C, a);
                bl(e, t, H, xt(e))
            } else
                bl(e, t, a, xt(e))
        } catch (Y) {
            bl(e, t, {
                then: function() {},
                status: "rejected",
                reason: Y
            }, xt())
        } finally {
            X.p = o,
            h !== null && y.types !== null && (h.types = y.types),
            D.T = h
        }
    }
    function N0() {}
    function Pr(e, t, n, a) {
        if (e.tag !== 5)
            throw Error(s(476));
        var u = $f(e).queue;
        Jf(e, u, t, te, n === null ? N0 : function() {
            return Ff(e),
            n(a)
        }
        )
    }
    function $f(e) {
        var t = e.memoizedState;
        if (t !== null)
            return t;
        t = {
            memoizedState: te,
            baseState: te,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: It,
                lastRenderedState: te
            },
            next: null
        };
        var n = {};
        return t.next = {
            memoizedState: n,
            baseState: n,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: It,
                lastRenderedState: n
            },
            next: null
        },
        e.memoizedState = t,
        e = e.alternate,
        e !== null && (e.memoizedState = t),
        t
    }
    function Ff(e) {
        var t = $f(e);
        t.next === null && (t = e.alternate.memoizedState),
        bl(e, t.next.queue, {}, xt())
    }
    function es() {
        return We(Ul)
    }
    function Wf() {
        return qe().memoizedState
    }
    function If() {
        return qe().memoizedState
    }
    function L0(e) {
        for (var t = e.return; t !== null; ) {
            switch (t.tag) {
            case 24:
            case 3:
                var n = xt();
                e = xn(n);
                var a = Sn(t, e, n);
                a !== null && (ct(a, t, n),
                ml(a, t, n)),
                t = {
                    cache: Rr()
                },
                e.payload = t;
                return
            }
            t = t.return
        }
    }
    function M0(e, t, n) {
        var a = xt();
        n = {
            lane: a,
            revertLane: 0,
            gesture: null,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Gi(e) ? ed(t, n) : (n = vr(e, t, n, a),
        n !== null && (ct(n, e, a),
        td(n, t, a)))
    }
    function Pf(e, t, n) {
        var a = xt();
        bl(e, t, n, a)
    }
    function bl(e, t, n, a) {
        var u = {
            lane: a,
            revertLane: 0,
            gesture: null,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null
        };
        if (Gi(e))
            ed(t, u);
        else {
            var o = e.alternate;
            if (e.lanes === 0 && (o === null || o.lanes === 0) && (o = t.lastRenderedReducer,
            o !== null))
                try {
                    var h = t.lastRenderedState
                      , y = o(h, n);
                    if (u.hasEagerState = !0,
                    u.eagerState = y,
                    mt(y, h))
                        return xi(e, t, u, 0),
                        Le === null && bi(),
                        !1
                } catch {}
            if (n = vr(e, t, u, a),
            n !== null)
                return ct(n, e, a),
                td(n, t, a),
                !0
        }
        return !1
    }
    function ts(e, t, n, a) {
        if (a = {
            lane: 2,
            revertLane: js(),
            gesture: null,
            action: a,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Gi(e)) {
            if (t)
                throw Error(s(479))
        } else
            t = vr(e, n, a, 2),
            t !== null && ct(t, e, 2)
    }
    function Gi(e) {
        var t = e.alternate;
        return e === re || t !== null && t === re
    }
    function ed(e, t) {
        Ca = ji = !0;
        var n = e.pending;
        n === null ? t.next = t : (t.next = n.next,
        n.next = t),
        e.pending = t
    }
    function td(e, t, n) {
        if ((n & 4194048) !== 0) {
            var a = t.lanes;
            a &= e.pendingLanes,
            n |= a,
            t.lanes = n,
            ic(e, n)
        }
    }
    var xl = {
        readContext: We,
        use: Ui,
        useCallback: De,
        useContext: De,
        useEffect: De,
        useImperativeHandle: De,
        useLayoutEffect: De,
        useInsertionEffect: De,
        useMemo: De,
        useReducer: De,
        useRef: De,
        useState: De,
        useDebugValue: De,
        useDeferredValue: De,
        useTransition: De,
        useSyncExternalStore: De,
        useId: De,
        useHostTransitionStatus: De,
        useFormState: De,
        useActionState: De,
        useOptimistic: De,
        useMemoCache: De,
        useCacheRefresh: De
    };
    xl.useEffectEvent = De;
    var nd = {
        readContext: We,
        use: Ui,
        useCallback: function(e, t) {
            return at().memoizedState = [e, t === void 0 ? null : t],
            e
        },
        useContext: We,
        useEffect: qf,
        useImperativeHandle: function(e, t, n) {
            n = n != null ? n.concat([e]) : null,
            Bi(4194308, 4, Qf.bind(null, t, e), n)
        },
        useLayoutEffect: function(e, t) {
            return Bi(4194308, 4, e, t)
        },
        useInsertionEffect: function(e, t) {
            Bi(4, 2, e, t)
        },
        useMemo: function(e, t) {
            var n = at();
            t = t === void 0 ? null : t;
            var a = e();
            if (In) {
                dn(!0);
                try {
                    e()
                } finally {
                    dn(!1)
                }
            }
            return n.memoizedState = [a, t],
            a
        },
        useReducer: function(e, t, n) {
            var a = at();
            if (n !== void 0) {
                var u = n(t);
                if (In) {
                    dn(!0);
                    try {
                        n(t)
                    } finally {
                        dn(!1)
                    }
                }
            } else
                u = t;
            return a.memoizedState = a.baseState = u,
            e = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: e,
                lastRenderedState: u
            },
            a.queue = e,
            e = e.dispatch = M0.bind(null, re, e),
            [a.memoizedState, e]
        },
        useRef: function(e) {
            var t = at();
            return e = {
                current: e
            },
            t.memoizedState = e
        },
        useState: function(e) {
            e = Jr(e);
            var t = e.queue
              , n = Pf.bind(null, re, t);
            return t.dispatch = n,
            [e.memoizedState, n]
        },
        useDebugValue: Wr,
        useDeferredValue: function(e, t) {
            var n = at();
            return Ir(n, e, t)
        },
        useTransition: function() {
            var e = Jr(!1);
            return e = Jf.bind(null, re, e.queue, !0, !1),
            at().memoizedState = e,
            [!1, e]
        },
        useSyncExternalStore: function(e, t, n) {
            var a = re
              , u = at();
            if (ve) {
                if (n === void 0)
                    throw Error(s(407));
                n = n()
            } else {
                if (n = t(),
                Le === null)
                    throw Error(s(349));
                (ge & 127) !== 0 || wf(a, t, n)
            }
            u.memoizedState = n;
            var o = {
                value: n,
                getSnapshot: t
            };
            return u.queue = o,
            qf(Cf.bind(null, a, o, e), [e]),
            a.flags |= 2048,
            Oa(9, {
                destroy: void 0
            }, _f.bind(null, a, o, n, t), null),
            n
        },
        useId: function() {
            var e = at()
              , t = Le.identifierPrefix;
            if (ve) {
                var n = Ht
                  , a = Ut;
                n = (a & ~(1 << 32 - ht(a) - 1)).toString(32) + n,
                t = "_" + t + "R_" + n,
                n = zi++,
                0 < n && (t += "H" + n.toString(32)),
                t += "_"
            } else
                n = C0++,
                t = "_" + t + "r_" + n.toString(32) + "_";
            return e.memoizedState = t
        },
        useHostTransitionStatus: es,
        useFormState: zf,
        useActionState: zf,
        useOptimistic: function(e) {
            var t = at();
            t.memoizedState = t.baseState = e;
            var n = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: null,
                lastRenderedState: null
            };
            return t.queue = n,
            t = ts.bind(null, re, !0, n),
            n.dispatch = t,
            [e, t]
        },
        useMemoCache: kr,
        useCacheRefresh: function() {
            return at().memoizedState = L0.bind(null, re)
        },
        useEffectEvent: function(e) {
            var t = at()
              , n = {
                impl: e
            };
            return t.memoizedState = n,
            function() {
                if ((Ee & 2) !== 0)
                    throw Error(s(440));
                return n.impl.apply(void 0, arguments)
            }
        }
    }
      , ns = {
        readContext: We,
        use: Ui,
        useCallback: kf,
        useContext: We,
        useEffect: Fr,
        useImperativeHandle: Xf,
        useInsertionEffect: Yf,
        useLayoutEffect: Vf,
        useMemo: Zf,
        useReducer: Hi,
        useRef: Bf,
        useState: function() {
            return Hi(It)
        },
        useDebugValue: Wr,
        useDeferredValue: function(e, t) {
            var n = qe();
            return Kf(n, Ae.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Hi(It)[0]
              , t = qe().memoizedState;
            return [typeof e == "boolean" ? e : vl(e), t]
        },
        useSyncExternalStore: Ef,
        useId: Wf,
        useHostTransitionStatus: es,
        useFormState: Df,
        useActionState: Df,
        useOptimistic: function(e, t) {
            var n = qe();
            return Af(n, Ae, e, t)
        },
        useMemoCache: kr,
        useCacheRefresh: If
    };
    ns.useEffectEvent = Gf;
    var ad = {
        readContext: We,
        use: Ui,
        useCallback: kf,
        useContext: We,
        useEffect: Fr,
        useImperativeHandle: Xf,
        useInsertionEffect: Yf,
        useLayoutEffect: Vf,
        useMemo: Zf,
        useReducer: Kr,
        useRef: Bf,
        useState: function() {
            return Kr(It)
        },
        useDebugValue: Wr,
        useDeferredValue: function(e, t) {
            var n = qe();
            return Ae === null ? Ir(n, e, t) : Kf(n, Ae.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Kr(It)[0]
              , t = qe().memoizedState;
            return [typeof e == "boolean" ? e : vl(e), t]
        },
        useSyncExternalStore: Ef,
        useId: Wf,
        useHostTransitionStatus: es,
        useFormState: Hf,
        useActionState: Hf,
        useOptimistic: function(e, t) {
            var n = qe();
            return Ae !== null ? Af(n, Ae, e, t) : (n.baseState = e,
            [e, n.queue.dispatch])
        },
        useMemoCache: kr,
        useCacheRefresh: If
    };
    ad.useEffectEvent = Gf;
    function as(e, t, n, a) {
        t = e.memoizedState,
        n = n(a, t),
        n = n == null ? t : v({}, t, n),
        e.memoizedState = n,
        e.lanes === 0 && (e.updateQueue.baseState = n)
    }
    var ls = {
        enqueueSetState: function(e, t, n) {
            e = e._reactInternals;
            var a = xt()
              , u = xn(a);
            u.payload = t,
            n != null && (u.callback = n),
            t = Sn(e, u, a),
            t !== null && (ct(t, e, a),
            ml(t, e, a))
        },
        enqueueReplaceState: function(e, t, n) {
            e = e._reactInternals;
            var a = xt()
              , u = xn(a);
            u.tag = 1,
            u.payload = t,
            n != null && (u.callback = n),
            t = Sn(e, u, a),
            t !== null && (ct(t, e, a),
            ml(t, e, a))
        },
        enqueueForceUpdate: function(e, t) {
            e = e._reactInternals;
            var n = xt()
              , a = xn(n);
            a.tag = 2,
            t != null && (a.callback = t),
            t = Sn(e, a, n),
            t !== null && (ct(t, e, n),
            ml(t, e, n))
        }
    };
    function ld(e, t, n, a, u, o, h) {
        return e = e.stateNode,
        typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(a, o, h) : t.prototype && t.prototype.isPureReactComponent ? !ul(n, a) || !ul(u, o) : !0
    }
    function id(e, t, n, a) {
        e = t.state,
        typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, a),
        typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, a),
        t.state !== e && ls.enqueueReplaceState(t, t.state, null)
    }
    function Pn(e, t) {
        var n = t;
        if ("ref"in t) {
            n = {};
            for (var a in t)
                a !== "ref" && (n[a] = t[a])
        }
        if (e = e.defaultProps) {
            n === t && (n = v({}, n));
            for (var u in e)
                n[u] === void 0 && (n[u] = e[u])
        }
        return n
    }
    function ud(e) {
        vi(e)
    }
    function rd(e) {
        console.error(e)
    }
    function sd(e) {
        vi(e)
    }
    function Yi(e, t) {
        try {
            var n = e.onUncaughtError;
            n(t.value, {
                componentStack: t.stack
            })
        } catch (a) {
            setTimeout(function() {
                throw a
            })
        }
    }
    function od(e, t, n) {
        try {
            var a = e.onCaughtError;
            a(n.value, {
                componentStack: n.stack,
                errorBoundary: t.tag === 1 ? t.stateNode : null
            })
        } catch (u) {
            setTimeout(function() {
                throw u
            })
        }
    }
    function is(e, t, n) {
        return n = xn(n),
        n.tag = 3,
        n.payload = {
            element: null
        },
        n.callback = function() {
            Yi(e, t)
        }
        ,
        n
    }
    function cd(e) {
        return e = xn(e),
        e.tag = 3,
        e
    }
    function fd(e, t, n, a) {
        var u = n.type.getDerivedStateFromError;
        if (typeof u == "function") {
            var o = a.value;
            e.payload = function() {
                return u(o)
            }
            ,
            e.callback = function() {
                od(t, n, a)
            }
        }
        var h = n.stateNode;
        h !== null && typeof h.componentDidCatch == "function" && (e.callback = function() {
            od(t, n, a),
            typeof u != "function" && (On === null ? On = new Set([this]) : On.add(this));
            var y = a.stack;
            this.componentDidCatch(a.value, {
                componentStack: y !== null ? y : ""
            })
        }
        )
    }
    function j0(e, t, n, a, u) {
        if (n.flags |= 32768,
        a !== null && typeof a == "object" && typeof a.then == "function") {
            if (t = n.alternate,
            t !== null && ba(t, n, u, !0),
            n = pt.current,
            n !== null) {
                switch (n.tag) {
                case 31:
                case 13:
                    return At === null ? Pi() : n.alternate === null && Ue === 0 && (Ue = 3),
                    n.flags &= -257,
                    n.flags |= 65536,
                    n.lanes = u,
                    a === Ai ? n.flags |= 16384 : (t = n.updateQueue,
                    t === null ? n.updateQueue = new Set([a]) : t.add(a),
                    Ns(e, a, u)),
                    !1;
                case 22:
                    return n.flags |= 65536,
                    a === Ai ? n.flags |= 16384 : (t = n.updateQueue,
                    t === null ? (t = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([a])
                    },
                    n.updateQueue = t) : (n = t.retryQueue,
                    n === null ? t.retryQueue = new Set([a]) : n.add(a)),
                    Ns(e, a, u)),
                    !1
                }
                throw Error(s(435, n.tag))
            }
            return Ns(e, a, u),
            Pi(),
            !1
        }
        if (ve)
            return t = pt.current,
            t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256),
            t.flags |= 65536,
            t.lanes = u,
            a !== _r && (e = Error(s(422), {
                cause: a
            }),
            ol(_t(e, n)))) : (a !== _r && (t = Error(s(423), {
                cause: a
            }),
            ol(_t(t, n))),
            e = e.current.alternate,
            e.flags |= 65536,
            u &= -u,
            e.lanes |= u,
            a = _t(a, n),
            u = is(e.stateNode, a, u),
            Dr(e, u),
            Ue !== 4 && (Ue = 2)),
            !1;
        var o = Error(s(520), {
            cause: a
        });
        if (o = _t(o, n),
        Al === null ? Al = [o] : Al.push(o),
        Ue !== 4 && (Ue = 2),
        t === null)
            return !0;
        a = _t(a, n),
        n = t;
        do {
            switch (n.tag) {
            case 3:
                return n.flags |= 65536,
                e = u & -u,
                n.lanes |= e,
                e = is(n.stateNode, a, e),
                Dr(n, e),
                !1;
            case 1:
                if (t = n.type,
                o = n.stateNode,
                (n.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (On === null || !On.has(o))))
                    return n.flags |= 65536,
                    u &= -u,
                    n.lanes |= u,
                    u = cd(u),
                    fd(u, e, n, a),
                    Dr(n, u),
                    !1
            }
            n = n.return
        } while (n !== null);
        return !1
    }
    var us = Error(s(461))
      , Ve = !1;
    function Ie(e, t, n, a) {
        t.child = e === null ? gf(t, null, n, a) : Wn(t, e.child, n, a)
    }
    function dd(e, t, n, a, u) {
        n = n.render;
        var o = t.ref;
        if ("ref"in a) {
            var h = {};
            for (var y in a)
                y !== "ref" && (h[y] = a[y])
        } else
            h = a;
        return Kn(t),
        a = Yr(e, t, n, h, o, u),
        y = Vr(),
        e !== null && !Ve ? (Qr(e, t, u),
        Pt(e, t, u)) : (ve && y && Er(t),
        t.flags |= 1,
        Ie(e, t, a, u),
        t.child)
    }
    function hd(e, t, n, a, u) {
        if (e === null) {
            var o = n.type;
            return typeof o == "function" && !br(o) && o.defaultProps === void 0 && n.compare === null ? (t.tag = 15,
            t.type = o,
            md(e, t, o, a, u)) : (e = Ei(n.type, null, a, t, t.mode, u),
            e.ref = t.ref,
            e.return = t,
            t.child = e)
        }
        if (o = e.child,
        !ms(e, u)) {
            var h = o.memoizedProps;
            if (n = n.compare,
            n = n !== null ? n : ul,
            n(h, a) && e.ref === t.ref)
                return Pt(e, t, u)
        }
        return t.flags |= 1,
        e = Kt(o, a),
        e.ref = t.ref,
        e.return = t,
        t.child = e
    }
    function md(e, t, n, a, u) {
        if (e !== null) {
            var o = e.memoizedProps;
            if (ul(o, a) && e.ref === t.ref)
                if (Ve = !1,
                t.pendingProps = a = o,
                ms(e, u))
                    (e.flags & 131072) !== 0 && (Ve = !0);
                else
                    return t.lanes = e.lanes,
                    Pt(e, t, u)
        }
        return rs(e, t, n, a, u)
    }
    function gd(e, t, n, a) {
        var u = a.children
          , o = e !== null ? e.memoizedState : null;
        if (e === null && t.stateNode === null && (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        a.mode === "hidden") {
            if ((t.flags & 128) !== 0) {
                if (o = o !== null ? o.baseLanes | n : n,
                e !== null) {
                    for (a = t.child = e.child,
                    u = 0; a !== null; )
                        u = u | a.lanes | a.childLanes,
                        a = a.sibling;
                    a = u & ~o
                } else
                    a = 0,
                    t.child = null;
                return pd(e, t, o, n, a)
            }
            if ((n & 536870912) !== 0)
                t.memoizedState = {
                    baseLanes: 0,
                    cachePool: null
                },
                e !== null && Ti(t, o !== null ? o.cachePool : null),
                o !== null ? vf(t, o) : Hr(),
                bf(t);
            else
                return a = t.lanes = 536870912,
                pd(e, t, o !== null ? o.baseLanes | n : n, n, a)
        } else
            o !== null ? (Ti(t, o.cachePool),
            vf(t, o),
            wn(),
            t.memoizedState = null) : (e !== null && Ti(t, null),
            Hr(),
            wn());
        return Ie(e, t, u, n),
        t.child
    }
    function Sl(e, t) {
        return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        t.sibling
    }
    function pd(e, t, n, a, u) {
        var o = Lr();
        return o = o === null ? null : {
            parent: Ge._currentValue,
            pool: o
        },
        t.memoizedState = {
            baseLanes: n,
            cachePool: o
        },
        e !== null && Ti(t, null),
        Hr(),
        bf(t),
        e !== null && ba(e, t, a, !0),
        t.childLanes = u,
        null
    }
    function Vi(e, t) {
        return t = Xi({
            mode: t.mode,
            children: t.children
        }, e.mode),
        t.ref = e.ref,
        e.child = t,
        t.return = e,
        t
    }
    function yd(e, t, n) {
        return Wn(t, e.child, null, n),
        e = Vi(t, t.pendingProps),
        e.flags |= 2,
        yt(t),
        t.memoizedState = null,
        e
    }
    function z0(e, t, n) {
        var a = t.pendingProps
          , u = (t.flags & 128) !== 0;
        if (t.flags &= -129,
        e === null) {
            if (ve) {
                if (a.mode === "hidden")
                    return e = Vi(t, a),
                    t.lanes = 536870912,
                    Sl(null, e);
                if (qr(t),
                (e = Me) ? (e = Rh(e, Ot),
                e = e !== null && e.data === "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: gn !== null ? {
                        id: Ut,
                        overflow: Ht
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                n = Pc(e),
                n.return = t,
                t.child = n,
                Fe = t,
                Me = null)) : e = null,
                e === null)
                    throw yn(t);
                return t.lanes = 536870912,
                null
            }
            return Vi(t, a)
        }
        var o = e.memoizedState;
        if (o !== null) {
            var h = o.dehydrated;
            if (qr(t),
            u)
                if (t.flags & 256)
                    t.flags &= -257,
                    t = yd(e, t, n);
                else if (t.memoizedState !== null)
                    t.child = e.child,
                    t.flags |= 128,
                    t = null;
                else
                    throw Error(s(558));
            else if (Ve || ba(e, t, n, !1),
            u = (n & e.childLanes) !== 0,
            Ve || u) {
                if (a = Le,
                a !== null && (h = uc(a, n),
                h !== 0 && h !== o.retryLane))
                    throw o.retryLane = h,
                    Qn(e, h),
                    ct(a, e, h),
                    us;
                Pi(),
                t = yd(e, t, n)
            } else
                e = o.treeContext,
                Me = Rt(h.nextSibling),
                Fe = t,
                ve = !0,
                pn = null,
                Ot = !1,
                e !== null && nf(t, e),
                t = Vi(t, a),
                t.flags |= 4096;
            return t
        }
        return e = Kt(e.child, {
            mode: a.mode,
            children: a.children
        }),
        e.ref = t.ref,
        t.child = e,
        e.return = t,
        e
    }
    function Qi(e, t) {
        var n = t.ref;
        if (n === null)
            e !== null && e.ref !== null && (t.flags |= 4194816);
        else {
            if (typeof n != "function" && typeof n != "object")
                throw Error(s(284));
            (e === null || e.ref !== n) && (t.flags |= 4194816)
        }
    }
    function rs(e, t, n, a, u) {
        return Kn(t),
        n = Yr(e, t, n, a, void 0, u),
        a = Vr(),
        e !== null && !Ve ? (Qr(e, t, u),
        Pt(e, t, u)) : (ve && a && Er(t),
        t.flags |= 1,
        Ie(e, t, n, u),
        t.child)
    }
    function vd(e, t, n, a, u, o) {
        return Kn(t),
        t.updateQueue = null,
        n = Sf(t, a, n, u),
        xf(e),
        a = Vr(),
        e !== null && !Ve ? (Qr(e, t, o),
        Pt(e, t, o)) : (ve && a && Er(t),
        t.flags |= 1,
        Ie(e, t, n, o),
        t.child)
    }
    function bd(e, t, n, a, u) {
        if (Kn(t),
        t.stateNode === null) {
            var o = ga
              , h = n.contextType;
            typeof h == "object" && h !== null && (o = We(h)),
            o = new n(a,o),
            t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null,
            o.updater = ls,
            t.stateNode = o,
            o._reactInternals = t,
            o = t.stateNode,
            o.props = a,
            o.state = t.memoizedState,
            o.refs = {},
            jr(t),
            h = n.contextType,
            o.context = typeof h == "object" && h !== null ? We(h) : ga,
            o.state = t.memoizedState,
            h = n.getDerivedStateFromProps,
            typeof h == "function" && (as(t, n, h, a),
            o.state = t.memoizedState),
            typeof n.getDerivedStateFromProps == "function" || typeof o.getSnapshotBeforeUpdate == "function" || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (h = o.state,
            typeof o.componentWillMount == "function" && o.componentWillMount(),
            typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount(),
            h !== o.state && ls.enqueueReplaceState(o, o.state, null),
            pl(t, a, o, u),
            gl(),
            o.state = t.memoizedState),
            typeof o.componentDidMount == "function" && (t.flags |= 4194308),
            a = !0
        } else if (e === null) {
            o = t.stateNode;
            var y = t.memoizedProps
              , C = Pn(n, y);
            o.props = C;
            var L = o.context
              , H = n.contextType;
            h = ga,
            typeof H == "object" && H !== null && (h = We(H));
            var Y = n.getDerivedStateFromProps;
            H = typeof Y == "function" || typeof o.getSnapshotBeforeUpdate == "function",
            y = t.pendingProps !== y,
            H || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (y || L !== h) && id(t, o, a, h),
            bn = !1;
            var M = t.memoizedState;
            o.state = M,
            pl(t, a, o, u),
            gl(),
            L = t.memoizedState,
            y || M !== L || bn ? (typeof Y == "function" && (as(t, n, Y, a),
            L = t.memoizedState),
            (C = bn || ld(t, n, C, a, M, L, h)) ? (H || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (typeof o.componentWillMount == "function" && o.componentWillMount(),
            typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount()),
            typeof o.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308),
            t.memoizedProps = a,
            t.memoizedState = L),
            o.props = a,
            o.state = L,
            o.context = h,
            a = C) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308),
            a = !1)
        } else {
            o = t.stateNode,
            zr(e, t),
            h = t.memoizedProps,
            H = Pn(n, h),
            o.props = H,
            Y = t.pendingProps,
            M = o.context,
            L = n.contextType,
            C = ga,
            typeof L == "object" && L !== null && (C = We(L)),
            y = n.getDerivedStateFromProps,
            (L = typeof y == "function" || typeof o.getSnapshotBeforeUpdate == "function") || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (h !== Y || M !== C) && id(t, o, a, C),
            bn = !1,
            M = t.memoizedState,
            o.state = M,
            pl(t, a, o, u),
            gl();
            var z = t.memoizedState;
            h !== Y || M !== z || bn || e !== null && e.dependencies !== null && _i(e.dependencies) ? (typeof y == "function" && (as(t, n, y, a),
            z = t.memoizedState),
            (H = bn || ld(t, n, H, a, M, z, C) || e !== null && e.dependencies !== null && _i(e.dependencies)) ? (L || typeof o.UNSAFE_componentWillUpdate != "function" && typeof o.componentWillUpdate != "function" || (typeof o.componentWillUpdate == "function" && o.componentWillUpdate(a, z, C),
            typeof o.UNSAFE_componentWillUpdate == "function" && o.UNSAFE_componentWillUpdate(a, z, C)),
            typeof o.componentDidUpdate == "function" && (t.flags |= 4),
            typeof o.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof o.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4),
            typeof o.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024),
            t.memoizedProps = a,
            t.memoizedState = z),
            o.props = a,
            o.state = z,
            o.context = C,
            a = H) : (typeof o.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4),
            typeof o.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024),
            a = !1)
        }
        return o = a,
        Qi(e, t),
        a = (t.flags & 128) !== 0,
        o || a ? (o = t.stateNode,
        n = a && typeof n.getDerivedStateFromError != "function" ? null : o.render(),
        t.flags |= 1,
        e !== null && a ? (t.child = Wn(t, e.child, null, u),
        t.child = Wn(t, null, n, u)) : Ie(e, t, n, u),
        t.memoizedState = o.state,
        e = t.child) : e = Pt(e, t, u),
        e
    }
    function xd(e, t, n, a) {
        return kn(),
        t.flags |= 256,
        Ie(e, t, n, a),
        t.child
    }
    var ss = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
    };
    function os(e) {
        return {
            baseLanes: e,
            cachePool: of()
        }
    }
    function cs(e, t, n) {
        return e = e !== null ? e.childLanes & ~n : 0,
        t && (e |= bt),
        e
    }
    function Sd(e, t, n) {
        var a = t.pendingProps, u = !1, o = (t.flags & 128) !== 0, h;
        if ((h = o) || (h = e !== null && e.memoizedState === null ? !1 : (Be.current & 2) !== 0),
        h && (u = !0,
        t.flags &= -129),
        h = (t.flags & 32) !== 0,
        t.flags &= -33,
        e === null) {
            if (ve) {
                if (u ? En(t) : wn(),
                (e = Me) ? (e = Rh(e, Ot),
                e = e !== null && e.data !== "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: gn !== null ? {
                        id: Ut,
                        overflow: Ht
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                n = Pc(e),
                n.return = t,
                t.child = n,
                Fe = t,
                Me = null)) : e = null,
                e === null)
                    throw yn(t);
                return Zs(e) ? t.lanes = 32 : t.lanes = 536870912,
                null
            }
            var y = a.children;
            return a = a.fallback,
            u ? (wn(),
            u = t.mode,
            y = Xi({
                mode: "hidden",
                children: y
            }, u),
            a = Xn(a, u, n, null),
            y.return = t,
            a.return = t,
            y.sibling = a,
            t.child = y,
            a = t.child,
            a.memoizedState = os(n),
            a.childLanes = cs(e, h, n),
            t.memoizedState = ss,
            Sl(null, a)) : (En(t),
            fs(t, y))
        }
        var C = e.memoizedState;
        if (C !== null && (y = C.dehydrated,
        y !== null)) {
            if (o)
                t.flags & 256 ? (En(t),
                t.flags &= -257,
                t = ds(e, t, n)) : t.memoizedState !== null ? (wn(),
                t.child = e.child,
                t.flags |= 128,
                t = null) : (wn(),
                y = a.fallback,
                u = t.mode,
                a = Xi({
                    mode: "visible",
                    children: a.children
                }, u),
                y = Xn(y, u, n, null),
                y.flags |= 2,
                a.return = t,
                y.return = t,
                a.sibling = y,
                t.child = a,
                Wn(t, e.child, null, n),
                a = t.child,
                a.memoizedState = os(n),
                a.childLanes = cs(e, h, n),
                t.memoizedState = ss,
                t = Sl(null, a));
            else if (En(t),
            Zs(y)) {
                if (h = y.nextSibling && y.nextSibling.dataset,
                h)
                    var L = h.dgst;
                h = L,
                a = Error(s(419)),
                a.stack = "",
                a.digest = h,
                ol({
                    value: a,
                    source: null,
                    stack: null
                }),
                t = ds(e, t, n)
            } else if (Ve || ba(e, t, n, !1),
            h = (n & e.childLanes) !== 0,
            Ve || h) {
                if (h = Le,
                h !== null && (a = uc(h, n),
                a !== 0 && a !== C.retryLane))
                    throw C.retryLane = a,
                    Qn(e, a),
                    ct(h, e, a),
                    us;
                ks(y) || Pi(),
                t = ds(e, t, n)
            } else
                ks(y) ? (t.flags |= 192,
                t.child = e.child,
                t = null) : (e = C.treeContext,
                Me = Rt(y.nextSibling),
                Fe = t,
                ve = !0,
                pn = null,
                Ot = !1,
                e !== null && nf(t, e),
                t = fs(t, a.children),
                t.flags |= 4096);
            return t
        }
        return u ? (wn(),
        y = a.fallback,
        u = t.mode,
        C = e.child,
        L = C.sibling,
        a = Kt(C, {
            mode: "hidden",
            children: a.children
        }),
        a.subtreeFlags = C.subtreeFlags & 65011712,
        L !== null ? y = Kt(L, y) : (y = Xn(y, u, n, null),
        y.flags |= 2),
        y.return = t,
        a.return = t,
        a.sibling = y,
        t.child = a,
        Sl(null, a),
        a = t.child,
        y = e.child.memoizedState,
        y === null ? y = os(n) : (u = y.cachePool,
        u !== null ? (C = Ge._currentValue,
        u = u.parent !== C ? {
            parent: C,
            pool: C
        } : u) : u = of(),
        y = {
            baseLanes: y.baseLanes | n,
            cachePool: u
        }),
        a.memoizedState = y,
        a.childLanes = cs(e, h, n),
        t.memoizedState = ss,
        Sl(e.child, a)) : (En(t),
        n = e.child,
        e = n.sibling,
        n = Kt(n, {
            mode: "visible",
            children: a.children
        }),
        n.return = t,
        n.sibling = null,
        e !== null && (h = t.deletions,
        h === null ? (t.deletions = [e],
        t.flags |= 16) : h.push(e)),
        t.child = n,
        t.memoizedState = null,
        n)
    }
    function fs(e, t) {
        return t = Xi({
            mode: "visible",
            children: t
        }, e.mode),
        t.return = e,
        e.child = t
    }
    function Xi(e, t) {
        return e = gt(22, e, null, t),
        e.lanes = 0,
        e
    }
    function ds(e, t, n) {
        return Wn(t, e.child, null, n),
        e = fs(t, t.pendingProps.children),
        e.flags |= 2,
        t.memoizedState = null,
        e
    }
    function Ed(e, t, n) {
        e.lanes |= t;
        var a = e.alternate;
        a !== null && (a.lanes |= t),
        Or(e.return, t, n)
    }
    function hs(e, t, n, a, u, o) {
        var h = e.memoizedState;
        h === null ? e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: a,
            tail: n,
            tailMode: u,
            treeForkCount: o
        } : (h.isBackwards = t,
        h.rendering = null,
        h.renderingStartTime = 0,
        h.last = a,
        h.tail = n,
        h.tailMode = u,
        h.treeForkCount = o)
    }
    function wd(e, t, n) {
        var a = t.pendingProps
          , u = a.revealOrder
          , o = a.tail;
        a = a.children;
        var h = Be.current
          , y = (h & 2) !== 0;
        if (y ? (h = h & 1 | 2,
        t.flags |= 128) : h &= 1,
        Z(Be, h),
        Ie(e, t, a, n),
        a = ve ? sl : 0,
        !y && e !== null && (e.flags & 128) !== 0)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13)
                    e.memoizedState !== null && Ed(e, n, t);
                else if (e.tag === 19)
                    Ed(e, n, t);
                else if (e.child !== null) {
                    e.child.return = e,
                    e = e.child;
                    continue
                }
                if (e === t)
                    break e;
                for (; e.sibling === null; ) {
                    if (e.return === null || e.return === t)
                        break e;
                    e = e.return
                }
                e.sibling.return = e.return,
                e = e.sibling
            }
        switch (u) {
        case "forwards":
            for (n = t.child,
            u = null; n !== null; )
                e = n.alternate,
                e !== null && Mi(e) === null && (u = n),
                n = n.sibling;
            n = u,
            n === null ? (u = t.child,
            t.child = null) : (u = n.sibling,
            n.sibling = null),
            hs(t, !1, u, n, o, a);
            break;
        case "backwards":
        case "unstable_legacy-backwards":
            for (n = null,
            u = t.child,
            t.child = null; u !== null; ) {
                if (e = u.alternate,
                e !== null && Mi(e) === null) {
                    t.child = u;
                    break
                }
                e = u.sibling,
                u.sibling = n,
                n = u,
                u = e
            }
            hs(t, !0, n, null, o, a);
            break;
        case "together":
            hs(t, !1, null, null, void 0, a);
            break;
        default:
            t.memoizedState = null
        }
        return t.child
    }
    function Pt(e, t, n) {
        if (e !== null && (t.dependencies = e.dependencies),
        Tn |= t.lanes,
        (n & t.childLanes) === 0)
            if (e !== null) {
                if (ba(e, t, n, !1),
                (n & t.childLanes) === 0)
                    return null
            } else
                return null;
        if (e !== null && t.child !== e.child)
            throw Error(s(153));
        if (t.child !== null) {
            for (e = t.child,
            n = Kt(e, e.pendingProps),
            t.child = n,
            n.return = t; e.sibling !== null; )
                e = e.sibling,
                n = n.sibling = Kt(e, e.pendingProps),
                n.return = t;
            n.sibling = null
        }
        return t.child
    }
    function ms(e, t) {
        return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies,
        !!(e !== null && _i(e)))
    }
    function D0(e, t, n) {
        switch (t.tag) {
        case 3:
            nt(t, t.stateNode.containerInfo),
            vn(t, Ge, e.memoizedState.cache),
            kn();
            break;
        case 27:
        case 5:
            Ka(t);
            break;
        case 4:
            nt(t, t.stateNode.containerInfo);
            break;
        case 10:
            vn(t, t.type, t.memoizedProps.value);
            break;
        case 31:
            if (t.memoizedState !== null)
                return t.flags |= 128,
                qr(t),
                null;
            break;
        case 13:
            var a = t.memoizedState;
            if (a !== null)
                return a.dehydrated !== null ? (En(t),
                t.flags |= 128,
                null) : (n & t.child.childLanes) !== 0 ? Sd(e, t, n) : (En(t),
                e = Pt(e, t, n),
                e !== null ? e.sibling : null);
            En(t);
            break;
        case 19:
            var u = (e.flags & 128) !== 0;
            if (a = (n & t.childLanes) !== 0,
            a || (ba(e, t, n, !1),
            a = (n & t.childLanes) !== 0),
            u) {
                if (a)
                    return wd(e, t, n);
                t.flags |= 128
            }
            if (u = t.memoizedState,
            u !== null && (u.rendering = null,
            u.tail = null,
            u.lastEffect = null),
            Z(Be, Be.current),
            a)
                break;
            return null;
        case 22:
            return t.lanes = 0,
            gd(e, t, n, t.pendingProps);
        case 24:
            vn(t, Ge, e.memoizedState.cache)
        }
        return Pt(e, t, n)
    }
    function _d(e, t, n) {
        if (e !== null)
            if (e.memoizedProps !== t.pendingProps)
                Ve = !0;
            else {
                if (!ms(e, n) && (t.flags & 128) === 0)
                    return Ve = !1,
                    D0(e, t, n);
                Ve = (e.flags & 131072) !== 0
            }
        else
            Ve = !1,
            ve && (t.flags & 1048576) !== 0 && tf(t, sl, t.index);
        switch (t.lanes = 0,
        t.tag) {
        case 16:
            e: {
                var a = t.pendingProps;
                if (e = $n(t.elementType),
                t.type = e,
                typeof e == "function")
                    br(e) ? (a = Pn(e, a),
                    t.tag = 1,
                    t = bd(null, t, e, a, n)) : (t.tag = 0,
                    t = rs(null, t, e, a, n));
                else {
                    if (e != null) {
                        var u = e.$$typeof;
                        if (u === J) {
                            t.tag = 11,
                            t = dd(null, t, e, a, n);
                            break e
                        } else if (u === I) {
                            t.tag = 14,
                            t = hd(null, t, e, a, n);
                            break e
                        }
                    }
                    throw t = oe(e) || e,
                    Error(s(306, t, ""))
                }
            }
            return t;
        case 0:
            return rs(e, t, t.type, t.pendingProps, n);
        case 1:
            return a = t.type,
            u = Pn(a, t.pendingProps),
            bd(e, t, a, u, n);
        case 3:
            e: {
                if (nt(t, t.stateNode.containerInfo),
                e === null)
                    throw Error(s(387));
                a = t.pendingProps;
                var o = t.memoizedState;
                u = o.element,
                zr(e, t),
                pl(t, a, null, n);
                var h = t.memoizedState;
                if (a = h.cache,
                vn(t, Ge, a),
                a !== o.cache && Ar(t, [Ge], n, !0),
                gl(),
                a = h.element,
                o.isDehydrated)
                    if (o = {
                        element: a,
                        isDehydrated: !1,
                        cache: h.cache
                    },
                    t.updateQueue.baseState = o,
                    t.memoizedState = o,
                    t.flags & 256) {
                        t = xd(e, t, a, n);
                        break e
                    } else if (a !== u) {
                        u = _t(Error(s(424)), t),
                        ol(u),
                        t = xd(e, t, a, n);
                        break e
                    } else
                        for (e = t.stateNode.containerInfo,
                        e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e,
                        Me = Rt(e.firstChild),
                        Fe = t,
                        ve = !0,
                        pn = null,
                        Ot = !0,
                        n = gf(t, null, a, n),
                        t.child = n; n; )
                            n.flags = n.flags & -3 | 4096,
                            n = n.sibling;
                else {
                    if (kn(),
                    a === u) {
                        t = Pt(e, t, n);
                        break e
                    }
                    Ie(e, t, a, n)
                }
                t = t.child
            }
            return t;
        case 26:
            return Qi(e, t),
            e === null ? (n = Dh(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : ve || (n = t.type,
            e = t.pendingProps,
            a = uu(de.current).createElement(n),
            a[$e] = t,
            a[lt] = e,
            Pe(a, n, e),
            Ze(a),
            t.stateNode = a) : t.memoizedState = Dh(t.type, e.memoizedProps, t.pendingProps, e.memoizedState),
            null;
        case 27:
            return Ka(t),
            e === null && ve && (a = t.stateNode = Mh(t.type, t.pendingProps, de.current),
            Fe = t,
            Ot = !0,
            u = Me,
            Ln(t.type) ? (Ks = u,
            Me = Rt(a.firstChild)) : Me = u),
            Ie(e, t, t.pendingProps.children, n),
            Qi(e, t),
            e === null && (t.flags |= 4194304),
            t.child;
        case 5:
            return e === null && ve && ((u = a = Me) && (a = fy(a, t.type, t.pendingProps, Ot),
            a !== null ? (t.stateNode = a,
            Fe = t,
            Me = Rt(a.firstChild),
            Ot = !1,
            u = !0) : u = !1),
            u || yn(t)),
            Ka(t),
            u = t.type,
            o = t.pendingProps,
            h = e !== null ? e.memoizedProps : null,
            a = o.children,
            Vs(u, o) ? a = null : h !== null && Vs(u, h) && (t.flags |= 32),
            t.memoizedState !== null && (u = Yr(e, t, T0, null, null, n),
            Ul._currentValue = u),
            Qi(e, t),
            Ie(e, t, a, n),
            t.child;
        case 6:
            return e === null && ve && ((e = n = Me) && (n = dy(n, t.pendingProps, Ot),
            n !== null ? (t.stateNode = n,
            Fe = t,
            Me = null,
            e = !0) : e = !1),
            e || yn(t)),
            null;
        case 13:
            return Sd(e, t, n);
        case 4:
            return nt(t, t.stateNode.containerInfo),
            a = t.pendingProps,
            e === null ? t.child = Wn(t, null, a, n) : Ie(e, t, a, n),
            t.child;
        case 11:
            return dd(e, t, t.type, t.pendingProps, n);
        case 7:
            return Ie(e, t, t.pendingProps, n),
            t.child;
        case 8:
            return Ie(e, t, t.pendingProps.children, n),
            t.child;
        case 12:
            return Ie(e, t, t.pendingProps.children, n),
            t.child;
        case 10:
            return a = t.pendingProps,
            vn(t, t.type, a.value),
            Ie(e, t, a.children, n),
            t.child;
        case 9:
            return u = t.type._context,
            a = t.pendingProps.children,
            Kn(t),
            u = We(u),
            a = a(u),
            t.flags |= 1,
            Ie(e, t, a, n),
            t.child;
        case 14:
            return hd(e, t, t.type, t.pendingProps, n);
        case 15:
            return md(e, t, t.type, t.pendingProps, n);
        case 19:
            return wd(e, t, n);
        case 31:
            return z0(e, t, n);
        case 22:
            return gd(e, t, n, t.pendingProps);
        case 24:
            return Kn(t),
            a = We(Ge),
            e === null ? (u = Lr(),
            u === null && (u = Le,
            o = Rr(),
            u.pooledCache = o,
            o.refCount++,
            o !== null && (u.pooledCacheLanes |= n),
            u = o),
            t.memoizedState = {
                parent: a,
                cache: u
            },
            jr(t),
            vn(t, Ge, u)) : ((e.lanes & n) !== 0 && (zr(e, t),
            pl(t, null, null, n),
            gl()),
            u = e.memoizedState,
            o = t.memoizedState,
            u.parent !== a ? (u = {
                parent: a,
                cache: a
            },
            t.memoizedState = u,
            t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = u),
            vn(t, Ge, a)) : (a = o.cache,
            vn(t, Ge, a),
            a !== u.cache && Ar(t, [Ge], n, !0))),
            Ie(e, t, t.pendingProps.children, n),
            t.child;
        case 29:
            throw t.pendingProps
        }
        throw Error(s(156, t.tag))
    }
    function en(e) {
        e.flags |= 4
    }
    function gs(e, t, n, a, u) {
        if ((t = (e.mode & 32) !== 0) && (t = !1),
        t) {
            if (e.flags |= 16777216,
            (u & 335544128) === u)
                if (e.stateNode.complete)
                    e.flags |= 8192;
                else if (Wd())
                    e.flags |= 8192;
                else
                    throw Fn = Ai,
                    Mr
        } else
            e.flags &= -16777217
    }
    function Cd(e, t) {
        if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
            e.flags &= -16777217;
        else if (e.flags |= 16777216,
        !Gh(t))
            if (Wd())
                e.flags |= 8192;
            else
                throw Fn = Ai,
                Mr
    }
    function ki(e, t) {
        t !== null && (e.flags |= 4),
        e.flags & 16384 && (t = e.tag !== 22 ? ac() : 536870912,
        e.lanes |= t,
        La |= t)
    }
    function El(e, t) {
        if (!ve)
            switch (e.tailMode) {
            case "hidden":
                t = e.tail;
                for (var n = null; t !== null; )
                    t.alternate !== null && (n = t),
                    t = t.sibling;
                n === null ? e.tail = null : n.sibling = null;
                break;
            case "collapsed":
                n = e.tail;
                for (var a = null; n !== null; )
                    n.alternate !== null && (a = n),
                    n = n.sibling;
                a === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : a.sibling = null
            }
    }
    function je(e) {
        var t = e.alternate !== null && e.alternate.child === e.child
          , n = 0
          , a = 0;
        if (t)
            for (var u = e.child; u !== null; )
                n |= u.lanes | u.childLanes,
                a |= u.subtreeFlags & 65011712,
                a |= u.flags & 65011712,
                u.return = e,
                u = u.sibling;
        else
            for (u = e.child; u !== null; )
                n |= u.lanes | u.childLanes,
                a |= u.subtreeFlags,
                a |= u.flags,
                u.return = e,
                u = u.sibling;
        return e.subtreeFlags |= a,
        e.childLanes = n,
        t
    }
    function U0(e, t, n) {
        var a = t.pendingProps;
        switch (wr(t),
        t.tag) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
            return je(t),
            null;
        case 1:
            return je(t),
            null;
        case 3:
            return n = t.stateNode,
            a = null,
            e !== null && (a = e.memoizedState.cache),
            t.memoizedState.cache !== a && (t.flags |= 2048),
            Ft(Ge),
            He(),
            n.pendingContext && (n.context = n.pendingContext,
            n.pendingContext = null),
            (e === null || e.child === null) && (va(t) ? en(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024,
            Cr())),
            je(t),
            null;
        case 26:
            var u = t.type
              , o = t.memoizedState;
            return e === null ? (en(t),
            o !== null ? (je(t),
            Cd(t, o)) : (je(t),
            gs(t, u, null, a, n))) : o ? o !== e.memoizedState ? (en(t),
            je(t),
            Cd(t, o)) : (je(t),
            t.flags &= -16777217) : (e = e.memoizedProps,
            e !== a && en(t),
            je(t),
            gs(t, u, e, a, n)),
            null;
        case 27:
            if (ni(t),
            n = de.current,
            u = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== a && en(t);
            else {
                if (!a) {
                    if (t.stateNode === null)
                        throw Error(s(166));
                    return je(t),
                    null
                }
                e = $.current,
                va(t) ? af(t) : (e = Mh(u, a, n),
                t.stateNode = e,
                en(t))
            }
            return je(t),
            null;
        case 5:
            if (ni(t),
            u = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== a && en(t);
            else {
                if (!a) {
                    if (t.stateNode === null)
                        throw Error(s(166));
                    return je(t),
                    null
                }
                if (o = $.current,
                va(t))
                    af(t);
                else {
                    var h = uu(de.current);
                    switch (o) {
                    case 1:
                        o = h.createElementNS("http://www.w3.org/2000/svg", u);
                        break;
                    case 2:
                        o = h.createElementNS("http://www.w3.org/1998/Math/MathML", u);
                        break;
                    default:
                        switch (u) {
                        case "svg":
                            o = h.createElementNS("http://www.w3.org/2000/svg", u);
                            break;
                        case "math":
                            o = h.createElementNS("http://www.w3.org/1998/Math/MathML", u);
                            break;
                        case "script":
                            o = h.createElement("div"),
                            o.innerHTML = "<script><\/script>",
                            o = o.removeChild(o.firstChild);
                            break;
                        case "select":
                            o = typeof a.is == "string" ? h.createElement("select", {
                                is: a.is
                            }) : h.createElement("select"),
                            a.multiple ? o.multiple = !0 : a.size && (o.size = a.size);
                            break;
                        default:
                            o = typeof a.is == "string" ? h.createElement(u, {
                                is: a.is
                            }) : h.createElement(u)
                        }
                    }
                    o[$e] = t,
                    o[lt] = a;
                    e: for (h = t.child; h !== null; ) {
                        if (h.tag === 5 || h.tag === 6)
                            o.appendChild(h.stateNode);
                        else if (h.tag !== 4 && h.tag !== 27 && h.child !== null) {
                            h.child.return = h,
                            h = h.child;
                            continue
                        }
                        if (h === t)
                            break e;
                        for (; h.sibling === null; ) {
                            if (h.return === null || h.return === t)
                                break e;
                            h = h.return
                        }
                        h.sibling.return = h.return,
                        h = h.sibling
                    }
                    t.stateNode = o;
                    e: switch (Pe(o, u, a),
                    u) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                        a = !!a.autoFocus;
                        break e;
                    case "img":
                        a = !0;
                        break e;
                    default:
                        a = !1
                    }
                    a && en(t)
                }
            }
            return je(t),
            gs(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n),
            null;
        case 6:
            if (e && t.stateNode != null)
                e.memoizedProps !== a && en(t);
            else {
                if (typeof a != "string" && t.stateNode === null)
                    throw Error(s(166));
                if (e = de.current,
                va(t)) {
                    if (e = t.stateNode,
                    n = t.memoizedProps,
                    a = null,
                    u = Fe,
                    u !== null)
                        switch (u.tag) {
                        case 27:
                        case 5:
                            a = u.memoizedProps
                        }
                    e[$e] = t,
                    e = !!(e.nodeValue === n || a !== null && a.suppressHydrationWarning === !0 || Sh(e.nodeValue, n)),
                    e || yn(t, !0)
                } else
                    e = uu(e).createTextNode(a),
                    e[$e] = t,
                    t.stateNode = e
            }
            return je(t),
            null;
        case 31:
            if (n = t.memoizedState,
            e === null || e.memoizedState !== null) {
                if (a = va(t),
                n !== null) {
                    if (e === null) {
                        if (!a)
                            throw Error(s(318));
                        if (e = t.memoizedState,
                        e = e !== null ? e.dehydrated : null,
                        !e)
                            throw Error(s(557));
                        e[$e] = t
                    } else
                        kn(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    je(t),
                    e = !1
                } else
                    n = Cr(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n),
                    e = !0;
                if (!e)
                    return t.flags & 256 ? (yt(t),
                    t) : (yt(t),
                    null);
                if ((t.flags & 128) !== 0)
                    throw Error(s(558))
            }
            return je(t),
            null;
        case 13:
            if (a = t.memoizedState,
            e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
                if (u = va(t),
                a !== null && a.dehydrated !== null) {
                    if (e === null) {
                        if (!u)
                            throw Error(s(318));
                        if (u = t.memoizedState,
                        u = u !== null ? u.dehydrated : null,
                        !u)
                            throw Error(s(317));
                        u[$e] = t
                    } else
                        kn(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    je(t),
                    u = !1
                } else
                    u = Cr(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = u),
                    u = !0;
                if (!u)
                    return t.flags & 256 ? (yt(t),
                    t) : (yt(t),
                    null)
            }
            return yt(t),
            (t.flags & 128) !== 0 ? (t.lanes = n,
            t) : (n = a !== null,
            e = e !== null && e.memoizedState !== null,
            n && (a = t.child,
            u = null,
            a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (u = a.alternate.memoizedState.cachePool.pool),
            o = null,
            a.memoizedState !== null && a.memoizedState.cachePool !== null && (o = a.memoizedState.cachePool.pool),
            o !== u && (a.flags |= 2048)),
            n !== e && n && (t.child.flags |= 8192),
            ki(t, t.updateQueue),
            je(t),
            null);
        case 4:
            return He(),
            e === null && Hs(t.stateNode.containerInfo),
            je(t),
            null;
        case 10:
            return Ft(t.type),
            je(t),
            null;
        case 19:
            if (B(Be),
            a = t.memoizedState,
            a === null)
                return je(t),
                null;
            if (u = (t.flags & 128) !== 0,
            o = a.rendering,
            o === null)
                if (u)
                    El(a, !1);
                else {
                    if (Ue !== 0 || e !== null && (e.flags & 128) !== 0)
                        for (e = t.child; e !== null; ) {
                            if (o = Mi(e),
                            o !== null) {
                                for (t.flags |= 128,
                                El(a, !1),
                                e = o.updateQueue,
                                t.updateQueue = e,
                                ki(t, e),
                                t.subtreeFlags = 0,
                                e = n,
                                n = t.child; n !== null; )
                                    Ic(n, e),
                                    n = n.sibling;
                                return Z(Be, Be.current & 1 | 2),
                                ve && Jt(t, a.treeForkCount),
                                t.child
                            }
                            e = e.sibling
                        }
                    a.tail !== null && ft() > Fi && (t.flags |= 128,
                    u = !0,
                    El(a, !1),
                    t.lanes = 4194304)
                }
            else {
                if (!u)
                    if (e = Mi(o),
                    e !== null) {
                        if (t.flags |= 128,
                        u = !0,
                        e = e.updateQueue,
                        t.updateQueue = e,
                        ki(t, e),
                        El(a, !0),
                        a.tail === null && a.tailMode === "hidden" && !o.alternate && !ve)
                            return je(t),
                            null
                    } else
                        2 * ft() - a.renderingStartTime > Fi && n !== 536870912 && (t.flags |= 128,
                        u = !0,
                        El(a, !1),
                        t.lanes = 4194304);
                a.isBackwards ? (o.sibling = t.child,
                t.child = o) : (e = a.last,
                e !== null ? e.sibling = o : t.child = o,
                a.last = o)
            }
            return a.tail !== null ? (e = a.tail,
            a.rendering = e,
            a.tail = e.sibling,
            a.renderingStartTime = ft(),
            e.sibling = null,
            n = Be.current,
            Z(Be, u ? n & 1 | 2 : n & 1),
            ve && Jt(t, a.treeForkCount),
            e) : (je(t),
            null);
        case 22:
        case 23:
            return yt(t),
            Br(),
            a = t.memoizedState !== null,
            e !== null ? e.memoizedState !== null !== a && (t.flags |= 8192) : a && (t.flags |= 8192),
            a ? (n & 536870912) !== 0 && (t.flags & 128) === 0 && (je(t),
            t.subtreeFlags & 6 && (t.flags |= 8192)) : je(t),
            n = t.updateQueue,
            n !== null && ki(t, n.retryQueue),
            n = null,
            e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool),
            a = null,
            t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool),
            a !== n && (t.flags |= 2048),
            e !== null && B(Jn),
            null;
        case 24:
            return n = null,
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            Ft(Ge),
            je(t),
            null;
        case 25:
            return null;
        case 30:
            return null
        }
        throw Error(s(156, t.tag))
    }
    function H0(e, t) {
        switch (wr(t),
        t.tag) {
        case 1:
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 3:
            return Ft(Ge),
            He(),
            e = t.flags,
            (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 26:
        case 27:
        case 5:
            return ni(t),
            null;
        case 31:
            if (t.memoizedState !== null) {
                if (yt(t),
                t.alternate === null)
                    throw Error(s(340));
                kn()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 13:
            if (yt(t),
            e = t.memoizedState,
            e !== null && e.dehydrated !== null) {
                if (t.alternate === null)
                    throw Error(s(340));
                kn()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 19:
            return B(Be),
            null;
        case 4:
            return He(),
            null;
        case 10:
            return Ft(t.type),
            null;
        case 22:
        case 23:
            return yt(t),
            Br(),
            e !== null && B(Jn),
            e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 24:
            return Ft(Ge),
            null;
        case 25:
            return null;
        default:
            return null
        }
    }
    function Td(e, t) {
        switch (wr(t),
        t.tag) {
        case 3:
            Ft(Ge),
            He();
            break;
        case 26:
        case 27:
        case 5:
            ni(t);
            break;
        case 4:
            He();
            break;
        case 31:
            t.memoizedState !== null && yt(t);
            break;
        case 13:
            yt(t);
            break;
        case 19:
            B(Be);
            break;
        case 10:
            Ft(t.type);
            break;
        case 22:
        case 23:
            yt(t),
            Br(),
            e !== null && B(Jn);
            break;
        case 24:
            Ft(Ge)
        }
    }
    function wl(e, t) {
        try {
            var n = t.updateQueue
              , a = n !== null ? n.lastEffect : null;
            if (a !== null) {
                var u = a.next;
                n = u;
                do {
                    if ((n.tag & e) === e) {
                        a = void 0;
                        var o = n.create
                          , h = n.inst;
                        a = o(),
                        h.destroy = a
                    }
                    n = n.next
                } while (n !== u)
            }
        } catch (y) {
            Oe(t, t.return, y)
        }
    }
    function _n(e, t, n) {
        try {
            var a = t.updateQueue
              , u = a !== null ? a.lastEffect : null;
            if (u !== null) {
                var o = u.next;
                a = o;
                do {
                    if ((a.tag & e) === e) {
                        var h = a.inst
                          , y = h.destroy;
                        if (y !== void 0) {
                            h.destroy = void 0,
                            u = t;
                            var C = n
                              , L = y;
                            try {
                                L()
                            } catch (H) {
                                Oe(u, C, H)
                            }
                        }
                    }
                    a = a.next
                } while (a !== o)
            }
        } catch (H) {
            Oe(t, t.return, H)
        }
    }
    function Od(e) {
        var t = e.updateQueue;
        if (t !== null) {
            var n = e.stateNode;
            try {
                yf(t, n)
            } catch (a) {
                Oe(e, e.return, a)
            }
        }
    }
    function Ad(e, t, n) {
        n.props = Pn(e.type, e.memoizedProps),
        n.state = e.memoizedState;
        try {
            n.componentWillUnmount()
        } catch (a) {
            Oe(e, t, a)
        }
    }
    function _l(e, t) {
        try {
            var n = e.ref;
            if (n !== null) {
                switch (e.tag) {
                case 26:
                case 27:
                case 5:
                    var a = e.stateNode;
                    break;
                case 30:
                    a = e.stateNode;
                    break;
                default:
                    a = e.stateNode
                }
                typeof n == "function" ? e.refCleanup = n(a) : n.current = a
            }
        } catch (u) {
            Oe(e, t, u)
        }
    }
    function Bt(e, t) {
        var n = e.ref
          , a = e.refCleanup;
        if (n !== null)
            if (typeof a == "function")
                try {
                    a()
                } catch (u) {
                    Oe(e, t, u)
                } finally {
                    e.refCleanup = null,
                    e = e.alternate,
                    e != null && (e.refCleanup = null)
                }
            else if (typeof n == "function")
                try {
                    n(null)
                } catch (u) {
                    Oe(e, t, u)
                }
            else
                n.current = null
    }
    function Rd(e) {
        var t = e.type
          , n = e.memoizedProps
          , a = e.stateNode;
        try {
            e: switch (t) {
            case "button":
            case "input":
            case "select":
            case "textarea":
                n.autoFocus && a.focus();
                break e;
            case "img":
                n.src ? a.src = n.src : n.srcSet && (a.srcset = n.srcSet)
            }
        } catch (u) {
            Oe(e, e.return, u)
        }
    }
    function ps(e, t, n) {
        try {
            var a = e.stateNode;
            iy(a, e.type, n, t),
            a[lt] = t
        } catch (u) {
            Oe(e, e.return, u)
        }
    }
    function Nd(e) {
        return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ln(e.type) || e.tag === 4
    }
    function ys(e) {
        e: for (; ; ) {
            for (; e.sibling === null; ) {
                if (e.return === null || Nd(e.return))
                    return null;
                e = e.return
            }
            for (e.sibling.return = e.return,
            e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
                if (e.tag === 27 && Ln(e.type) || e.flags & 2 || e.child === null || e.tag === 4)
                    continue e;
                e.child.return = e,
                e = e.child
            }
            if (!(e.flags & 2))
                return e.stateNode
        }
    }
    function vs(e, t, n) {
        var a = e.tag;
        if (a === 5 || a === 6)
            e = e.stateNode,
            t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n,
            t.appendChild(e),
            n = n._reactRootContainer,
            n != null || t.onclick !== null || (t.onclick = kt));
        else if (a !== 4 && (a === 27 && Ln(e.type) && (n = e.stateNode,
        t = null),
        e = e.child,
        e !== null))
            for (vs(e, t, n),
            e = e.sibling; e !== null; )
                vs(e, t, n),
                e = e.sibling
    }
    function Zi(e, t, n) {
        var a = e.tag;
        if (a === 5 || a === 6)
            e = e.stateNode,
            t ? n.insertBefore(e, t) : n.appendChild(e);
        else if (a !== 4 && (a === 27 && Ln(e.type) && (n = e.stateNode),
        e = e.child,
        e !== null))
            for (Zi(e, t, n),
            e = e.sibling; e !== null; )
                Zi(e, t, n),
                e = e.sibling
    }
    function Ld(e) {
        var t = e.stateNode
          , n = e.memoizedProps;
        try {
            for (var a = e.type, u = t.attributes; u.length; )
                t.removeAttributeNode(u[0]);
            Pe(t, a, n),
            t[$e] = e,
            t[lt] = n
        } catch (o) {
            Oe(e, e.return, o)
        }
    }
    var tn = !1
      , Qe = !1
      , bs = !1
      , Md = typeof WeakSet == "function" ? WeakSet : Set
      , Ke = null;
    function B0(e, t) {
        if (e = e.containerInfo,
        Gs = hu,
        e = Qc(e),
        dr(e)) {
            if ("selectionStart"in e)
                var n = {
                    start: e.selectionStart,
                    end: e.selectionEnd
                };
            else
                e: {
                    n = (n = e.ownerDocument) && n.defaultView || window;
                    var a = n.getSelection && n.getSelection();
                    if (a && a.rangeCount !== 0) {
                        n = a.anchorNode;
                        var u = a.anchorOffset
                          , o = a.focusNode;
                        a = a.focusOffset;
                        try {
                            n.nodeType,
                            o.nodeType
                        } catch {
                            n = null;
                            break e
                        }
                        var h = 0
                          , y = -1
                          , C = -1
                          , L = 0
                          , H = 0
                          , Y = e
                          , M = null;
                        t: for (; ; ) {
                            for (var z; Y !== n || u !== 0 && Y.nodeType !== 3 || (y = h + u),
                            Y !== o || a !== 0 && Y.nodeType !== 3 || (C = h + a),
                            Y.nodeType === 3 && (h += Y.nodeValue.length),
                            (z = Y.firstChild) !== null; )
                                M = Y,
                                Y = z;
                            for (; ; ) {
                                if (Y === e)
                                    break t;
                                if (M === n && ++L === u && (y = h),
                                M === o && ++H === a && (C = h),
                                (z = Y.nextSibling) !== null)
                                    break;
                                Y = M,
                                M = Y.parentNode
                            }
                            Y = z
                        }
                        n = y === -1 || C === -1 ? null : {
                            start: y,
                            end: C
                        }
                    } else
                        n = null
                }
            n = n || {
                start: 0,
                end: 0
            }
        } else
            n = null;
        for (Ys = {
            focusedElem: e,
            selectionRange: n
        },
        hu = !1,
        Ke = t; Ke !== null; )
            if (t = Ke,
            e = t.child,
            (t.subtreeFlags & 1028) !== 0 && e !== null)
                e.return = t,
                Ke = e;
            else
                for (; Ke !== null; ) {
                    switch (t = Ke,
                    o = t.alternate,
                    e = t.flags,
                    t.tag) {
                    case 0:
                        if ((e & 4) !== 0 && (e = t.updateQueue,
                        e = e !== null ? e.events : null,
                        e !== null))
                            for (n = 0; n < e.length; n++)
                                u = e[n],
                                u.ref.impl = u.nextImpl;
                        break;
                    case 11:
                    case 15:
                        break;
                    case 1:
                        if ((e & 1024) !== 0 && o !== null) {
                            e = void 0,
                            n = t,
                            u = o.memoizedProps,
                            o = o.memoizedState,
                            a = n.stateNode;
                            try {
                                var F = Pn(n.type, u);
                                e = a.getSnapshotBeforeUpdate(F, o),
                                a.__reactInternalSnapshotBeforeUpdate = e
                            } catch (ae) {
                                Oe(n, n.return, ae)
                            }
                        }
                        break;
                    case 3:
                        if ((e & 1024) !== 0) {
                            if (e = t.stateNode.containerInfo,
                            n = e.nodeType,
                            n === 9)
                                Xs(e);
                            else if (n === 1)
                                switch (e.nodeName) {
                                case "HEAD":
                                case "HTML":
                                case "BODY":
                                    Xs(e);
                                    break;
                                default:
                                    e.textContent = ""
                                }
                        }
                        break;
                    case 5:
                    case 26:
                    case 27:
                    case 6:
                    case 4:
                    case 17:
                        break;
                    default:
                        if ((e & 1024) !== 0)
                            throw Error(s(163))
                    }
                    if (e = t.sibling,
                    e !== null) {
                        e.return = t.return,
                        Ke = e;
                        break
                    }
                    Ke = t.return
                }
    }
    function jd(e, t, n) {
        var a = n.flags;
        switch (n.tag) {
        case 0:
        case 11:
        case 15:
            an(e, n),
            a & 4 && wl(5, n);
            break;
        case 1:
            if (an(e, n),
            a & 4)
                if (e = n.stateNode,
                t === null)
                    try {
                        e.componentDidMount()
                    } catch (h) {
                        Oe(n, n.return, h)
                    }
                else {
                    var u = Pn(n.type, t.memoizedProps);
                    t = t.memoizedState;
                    try {
                        e.componentDidUpdate(u, t, e.__reactInternalSnapshotBeforeUpdate)
                    } catch (h) {
                        Oe(n, n.return, h)
                    }
                }
            a & 64 && Od(n),
            a & 512 && _l(n, n.return);
            break;
        case 3:
            if (an(e, n),
            a & 64 && (e = n.updateQueue,
            e !== null)) {
                if (t = null,
                n.child !== null)
                    switch (n.child.tag) {
                    case 27:
                    case 5:
                        t = n.child.stateNode;
                        break;
                    case 1:
                        t = n.child.stateNode
                    }
                try {
                    yf(e, t)
                } catch (h) {
                    Oe(n, n.return, h)
                }
            }
            break;
        case 27:
            t === null && a & 4 && Ld(n);
        case 26:
        case 5:
            an(e, n),
            t === null && a & 4 && Rd(n),
            a & 512 && _l(n, n.return);
            break;
        case 12:
            an(e, n);
            break;
        case 31:
            an(e, n),
            a & 4 && Ud(e, n);
            break;
        case 13:
            an(e, n),
            a & 4 && Hd(e, n),
            a & 64 && (e = n.memoizedState,
            e !== null && (e = e.dehydrated,
            e !== null && (n = K0.bind(null, n),
            hy(e, n))));
            break;
        case 22:
            if (a = n.memoizedState !== null || tn,
            !a) {
                t = t !== null && t.memoizedState !== null || Qe,
                u = tn;
                var o = Qe;
                tn = a,
                (Qe = t) && !o ? ln(e, n, (n.subtreeFlags & 8772) !== 0) : an(e, n),
                tn = u,
                Qe = o
            }
            break;
        case 30:
            break;
        default:
            an(e, n)
        }
    }
    function zd(e) {
        var t = e.alternate;
        t !== null && (e.alternate = null,
        zd(t)),
        e.child = null,
        e.deletions = null,
        e.sibling = null,
        e.tag === 5 && (t = e.stateNode,
        t !== null && $u(t)),
        e.stateNode = null,
        e.return = null,
        e.dependencies = null,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.pendingProps = null,
        e.stateNode = null,
        e.updateQueue = null
    }
    var ze = null
      , ut = !1;
    function nn(e, t, n) {
        for (n = n.child; n !== null; )
            Dd(e, t, n),
            n = n.sibling
    }
    function Dd(e, t, n) {
        if (dt && typeof dt.onCommitFiberUnmount == "function")
            try {
                dt.onCommitFiberUnmount(Ja, n)
            } catch {}
        switch (n.tag) {
        case 26:
            Qe || Bt(n, t),
            nn(e, t, n),
            n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode,
            n.parentNode.removeChild(n));
            break;
        case 27:
            Qe || Bt(n, t);
            var a = ze
              , u = ut;
            Ln(n.type) && (ze = n.stateNode,
            ut = !1),
            nn(e, t, n),
            jl(n.stateNode),
            ze = a,
            ut = u;
            break;
        case 5:
            Qe || Bt(n, t);
        case 6:
            if (a = ze,
            u = ut,
            ze = null,
            nn(e, t, n),
            ze = a,
            ut = u,
            ze !== null)
                if (ut)
                    try {
                        (ze.nodeType === 9 ? ze.body : ze.nodeName === "HTML" ? ze.ownerDocument.body : ze).removeChild(n.stateNode)
                    } catch (o) {
                        Oe(n, t, o)
                    }
                else
                    try {
                        ze.removeChild(n.stateNode)
                    } catch (o) {
                        Oe(n, t, o)
                    }
            break;
        case 18:
            ze !== null && (ut ? (e = ze,
            Oh(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode),
            qa(e)) : Oh(ze, n.stateNode));
            break;
        case 4:
            a = ze,
            u = ut,
            ze = n.stateNode.containerInfo,
            ut = !0,
            nn(e, t, n),
            ze = a,
            ut = u;
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            _n(2, n, t),
            Qe || _n(4, n, t),
            nn(e, t, n);
            break;
        case 1:
            Qe || (Bt(n, t),
            a = n.stateNode,
            typeof a.componentWillUnmount == "function" && Ad(n, t, a)),
            nn(e, t, n);
            break;
        case 21:
            nn(e, t, n);
            break;
        case 22:
            Qe = (a = Qe) || n.memoizedState !== null,
            nn(e, t, n),
            Qe = a;
            break;
        default:
            nn(e, t, n)
        }
    }
    function Ud(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null))) {
            e = e.dehydrated;
            try {
                qa(e)
            } catch (n) {
                Oe(t, t.return, n)
            }
        }
    }
    function Hd(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null && (e = e.dehydrated,
        e !== null))))
            try {
                qa(e)
            } catch (n) {
                Oe(t, t.return, n)
            }
    }
    function q0(e) {
        switch (e.tag) {
        case 31:
        case 13:
        case 19:
            var t = e.stateNode;
            return t === null && (t = e.stateNode = new Md),
            t;
        case 22:
            return e = e.stateNode,
            t = e._retryCache,
            t === null && (t = e._retryCache = new Md),
            t;
        default:
            throw Error(s(435, e.tag))
        }
    }
    function Ki(e, t) {
        var n = q0(e);
        t.forEach(function(a) {
            if (!n.has(a)) {
                n.add(a);
                var u = J0.bind(null, e, a);
                a.then(u, u)
            }
        })
    }
    function rt(e, t) {
        var n = t.deletions;
        if (n !== null)
            for (var a = 0; a < n.length; a++) {
                var u = n[a]
                  , o = e
                  , h = t
                  , y = h;
                e: for (; y !== null; ) {
                    switch (y.tag) {
                    case 27:
                        if (Ln(y.type)) {
                            ze = y.stateNode,
                            ut = !1;
                            break e
                        }
                        break;
                    case 5:
                        ze = y.stateNode,
                        ut = !1;
                        break e;
                    case 3:
                    case 4:
                        ze = y.stateNode.containerInfo,
                        ut = !0;
                        break e
                    }
                    y = y.return
                }
                if (ze === null)
                    throw Error(s(160));
                Dd(o, h, u),
                ze = null,
                ut = !1,
                o = u.alternate,
                o !== null && (o.return = null),
                u.return = null
            }
        if (t.subtreeFlags & 13886)
            for (t = t.child; t !== null; )
                Bd(t, e),
                t = t.sibling
    }
    var jt = null;
    function Bd(e, t) {
        var n = e.alternate
          , a = e.flags;
        switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            rt(t, e),
            st(e),
            a & 4 && (_n(3, e, e.return),
            wl(3, e),
            _n(5, e, e.return));
            break;
        case 1:
            rt(t, e),
            st(e),
            a & 512 && (Qe || n === null || Bt(n, n.return)),
            a & 64 && tn && (e = e.updateQueue,
            e !== null && (a = e.callbacks,
            a !== null && (n = e.shared.hiddenCallbacks,
            e.shared.hiddenCallbacks = n === null ? a : n.concat(a))));
            break;
        case 26:
            var u = jt;
            if (rt(t, e),
            st(e),
            a & 512 && (Qe || n === null || Bt(n, n.return)),
            a & 4) {
                var o = n !== null ? n.memoizedState : null;
                if (a = e.memoizedState,
                n === null)
                    if (a === null)
                        if (e.stateNode === null) {
                            e: {
                                a = e.type,
                                n = e.memoizedProps,
                                u = u.ownerDocument || u;
                                t: switch (a) {
                                case "title":
                                    o = u.getElementsByTagName("title")[0],
                                    (!o || o[Wa] || o[$e] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = u.createElement(a),
                                    u.head.insertBefore(o, u.querySelector("head > title"))),
                                    Pe(o, a, n),
                                    o[$e] = e,
                                    Ze(o),
                                    a = o;
                                    break e;
                                case "link":
                                    var h = Bh("link", "href", u).get(a + (n.href || ""));
                                    if (h) {
                                        for (var y = 0; y < h.length; y++)
                                            if (o = h[y],
                                            o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
                                                h.splice(y, 1);
                                                break t
                                            }
                                    }
                                    o = u.createElement(a),
                                    Pe(o, a, n),
                                    u.head.appendChild(o);
                                    break;
                                case "meta":
                                    if (h = Bh("meta", "content", u).get(a + (n.content || ""))) {
                                        for (y = 0; y < h.length; y++)
                                            if (o = h[y],
                                            o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
                                                h.splice(y, 1);
                                                break t
                                            }
                                    }
                                    o = u.createElement(a),
                                    Pe(o, a, n),
                                    u.head.appendChild(o);
                                    break;
                                default:
                                    throw Error(s(468, a))
                                }
                                o[$e] = e,
                                Ze(o),
                                a = o
                            }
                            e.stateNode = a
                        } else
                            qh(u, e.type, e.stateNode);
                    else
                        e.stateNode = Hh(u, a, e.memoizedProps);
                else
                    o !== a ? (o === null ? n.stateNode !== null && (n = n.stateNode,
                    n.parentNode.removeChild(n)) : o.count--,
                    a === null ? qh(u, e.type, e.stateNode) : Hh(u, a, e.memoizedProps)) : a === null && e.stateNode !== null && ps(e, e.memoizedProps, n.memoizedProps)
            }
            break;
        case 27:
            rt(t, e),
            st(e),
            a & 512 && (Qe || n === null || Bt(n, n.return)),
            n !== null && a & 4 && ps(e, e.memoizedProps, n.memoizedProps);
            break;
        case 5:
            if (rt(t, e),
            st(e),
            a & 512 && (Qe || n === null || Bt(n, n.return)),
            e.flags & 32) {
                u = e.stateNode;
                try {
                    sa(u, "")
                } catch (F) {
                    Oe(e, e.return, F)
                }
            }
            a & 4 && e.stateNode != null && (u = e.memoizedProps,
            ps(e, u, n !== null ? n.memoizedProps : u)),
            a & 1024 && (bs = !0);
            break;
        case 6:
            if (rt(t, e),
            st(e),
            a & 4) {
                if (e.stateNode === null)
                    throw Error(s(162));
                a = e.memoizedProps,
                n = e.stateNode;
                try {
                    n.nodeValue = a
                } catch (F) {
                    Oe(e, e.return, F)
                }
            }
            break;
        case 3:
            if (ou = null,
            u = jt,
            jt = ru(t.containerInfo),
            rt(t, e),
            jt = u,
            st(e),
            a & 4 && n !== null && n.memoizedState.isDehydrated)
                try {
                    qa(t.containerInfo)
                } catch (F) {
                    Oe(e, e.return, F)
                }
            bs && (bs = !1,
            qd(e));
            break;
        case 4:
            a = jt,
            jt = ru(e.stateNode.containerInfo),
            rt(t, e),
            st(e),
            jt = a;
            break;
        case 12:
            rt(t, e),
            st(e);
            break;
        case 31:
            rt(t, e),
            st(e),
            a & 4 && (a = e.updateQueue,
            a !== null && (e.updateQueue = null,
            Ki(e, a)));
            break;
        case 13:
            rt(t, e),
            st(e),
            e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && ($i = ft()),
            a & 4 && (a = e.updateQueue,
            a !== null && (e.updateQueue = null,
            Ki(e, a)));
            break;
        case 22:
            u = e.memoizedState !== null;
            var C = n !== null && n.memoizedState !== null
              , L = tn
              , H = Qe;
            if (tn = L || u,
            Qe = H || C,
            rt(t, e),
            Qe = H,
            tn = L,
            st(e),
            a & 8192)
                e: for (t = e.stateNode,
                t._visibility = u ? t._visibility & -2 : t._visibility | 1,
                u && (n === null || C || tn || Qe || ea(e)),
                n = null,
                t = e; ; ) {
                    if (t.tag === 5 || t.tag === 26) {
                        if (n === null) {
                            C = n = t;
                            try {
                                if (o = C.stateNode,
                                u)
                                    h = o.style,
                                    typeof h.setProperty == "function" ? h.setProperty("display", "none", "important") : h.display = "none";
                                else {
                                    y = C.stateNode;
                                    var Y = C.memoizedProps.style
                                      , M = Y != null && Y.hasOwnProperty("display") ? Y.display : null;
                                    y.style.display = M == null || typeof M == "boolean" ? "" : ("" + M).trim()
                                }
                            } catch (F) {
                                Oe(C, C.return, F)
                            }
                        }
                    } else if (t.tag === 6) {
                        if (n === null) {
                            C = t;
                            try {
                                C.stateNode.nodeValue = u ? "" : C.memoizedProps
                            } catch (F) {
                                Oe(C, C.return, F)
                            }
                        }
                    } else if (t.tag === 18) {
                        if (n === null) {
                            C = t;
                            try {
                                var z = C.stateNode;
                                u ? Ah(z, !0) : Ah(C.stateNode, !1)
                            } catch (F) {
                                Oe(C, C.return, F)
                            }
                        }
                    } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
                        t.child.return = t,
                        t = t.child;
                        continue
                    }
                    if (t === e)
                        break e;
                    for (; t.sibling === null; ) {
                        if (t.return === null || t.return === e)
                            break e;
                        n === t && (n = null),
                        t = t.return
                    }
                    n === t && (n = null),
                    t.sibling.return = t.return,
                    t = t.sibling
                }
            a & 4 && (a = e.updateQueue,
            a !== null && (n = a.retryQueue,
            n !== null && (a.retryQueue = null,
            Ki(e, n))));
            break;
        case 19:
            rt(t, e),
            st(e),
            a & 4 && (a = e.updateQueue,
            a !== null && (e.updateQueue = null,
            Ki(e, a)));
            break;
        case 30:
            break;
        case 21:
            break;
        default:
            rt(t, e),
            st(e)
        }
    }
    function st(e) {
        var t = e.flags;
        if (t & 2) {
            try {
                for (var n, a = e.return; a !== null; ) {
                    if (Nd(a)) {
                        n = a;
                        break
                    }
                    a = a.return
                }
                if (n == null)
                    throw Error(s(160));
                switch (n.tag) {
                case 27:
                    var u = n.stateNode
                      , o = ys(e);
                    Zi(e, o, u);
                    break;
                case 5:
                    var h = n.stateNode;
                    n.flags & 32 && (sa(h, ""),
                    n.flags &= -33);
                    var y = ys(e);
                    Zi(e, y, h);
                    break;
                case 3:
                case 4:
                    var C = n.stateNode.containerInfo
                      , L = ys(e);
                    vs(e, L, C);
                    break;
                default:
                    throw Error(s(161))
                }
            } catch (H) {
                Oe(e, e.return, H)
            }
            e.flags &= -3
        }
        t & 4096 && (e.flags &= -4097)
    }
    function qd(e) {
        if (e.subtreeFlags & 1024)
            for (e = e.child; e !== null; ) {
                var t = e;
                qd(t),
                t.tag === 5 && t.flags & 1024 && t.stateNode.reset(),
                e = e.sibling
            }
    }
    function an(e, t) {
        if (t.subtreeFlags & 8772)
            for (t = t.child; t !== null; )
                jd(e, t.alternate, t),
                t = t.sibling
    }
    function ea(e) {
        for (e = e.child; e !== null; ) {
            var t = e;
            switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
                _n(4, t, t.return),
                ea(t);
                break;
            case 1:
                Bt(t, t.return);
                var n = t.stateNode;
                typeof n.componentWillUnmount == "function" && Ad(t, t.return, n),
                ea(t);
                break;
            case 27:
                jl(t.stateNode);
            case 26:
            case 5:
                Bt(t, t.return),
                ea(t);
                break;
            case 22:
                t.memoizedState === null && ea(t);
                break;
            case 30:
                ea(t);
                break;
            default:
                ea(t)
            }
            e = e.sibling
        }
    }
    function ln(e, t, n) {
        for (n = n && (t.subtreeFlags & 8772) !== 0,
        t = t.child; t !== null; ) {
            var a = t.alternate
              , u = e
              , o = t
              , h = o.flags;
            switch (o.tag) {
            case 0:
            case 11:
            case 15:
                ln(u, o, n),
                wl(4, o);
                break;
            case 1:
                if (ln(u, o, n),
                a = o,
                u = a.stateNode,
                typeof u.componentDidMount == "function")
                    try {
                        u.componentDidMount()
                    } catch (L) {
                        Oe(a, a.return, L)
                    }
                if (a = o,
                u = a.updateQueue,
                u !== null) {
                    var y = a.stateNode;
                    try {
                        var C = u.shared.hiddenCallbacks;
                        if (C !== null)
                            for (u.shared.hiddenCallbacks = null,
                            u = 0; u < C.length; u++)
                                pf(C[u], y)
                    } catch (L) {
                        Oe(a, a.return, L)
                    }
                }
                n && h & 64 && Od(o),
                _l(o, o.return);
                break;
            case 27:
                Ld(o);
            case 26:
            case 5:
                ln(u, o, n),
                n && a === null && h & 4 && Rd(o),
                _l(o, o.return);
                break;
            case 12:
                ln(u, o, n);
                break;
            case 31:
                ln(u, o, n),
                n && h & 4 && Ud(u, o);
                break;
            case 13:
                ln(u, o, n),
                n && h & 4 && Hd(u, o);
                break;
            case 22:
                o.memoizedState === null && ln(u, o, n),
                _l(o, o.return);
                break;
            case 30:
                break;
            default:
                ln(u, o, n)
            }
            t = t.sibling
        }
    }
    function xs(e, t) {
        var n = null;
        e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool),
        e = null,
        t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++,
        n != null && cl(n))
    }
    function Ss(e, t) {
        e = null,
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        t = t.memoizedState.cache,
        t !== e && (t.refCount++,
        e != null && cl(e))
    }
    function zt(e, t, n, a) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; )
                Gd(e, t, n, a),
                t = t.sibling
    }
    function Gd(e, t, n, a) {
        var u = t.flags;
        switch (t.tag) {
        case 0:
        case 11:
        case 15:
            zt(e, t, n, a),
            u & 2048 && wl(9, t);
            break;
        case 1:
            zt(e, t, n, a);
            break;
        case 3:
            zt(e, t, n, a),
            u & 2048 && (e = null,
            t.alternate !== null && (e = t.alternate.memoizedState.cache),
            t = t.memoizedState.cache,
            t !== e && (t.refCount++,
            e != null && cl(e)));
            break;
        case 12:
            if (u & 2048) {
                zt(e, t, n, a),
                e = t.stateNode;
                try {
                    var o = t.memoizedProps
                      , h = o.id
                      , y = o.onPostCommit;
                    typeof y == "function" && y(h, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0)
                } catch (C) {
                    Oe(t, t.return, C)
                }
            } else
                zt(e, t, n, a);
            break;
        case 31:
            zt(e, t, n, a);
            break;
        case 13:
            zt(e, t, n, a);
            break;
        case 23:
            break;
        case 22:
            o = t.stateNode,
            h = t.alternate,
            t.memoizedState !== null ? o._visibility & 2 ? zt(e, t, n, a) : Cl(e, t) : o._visibility & 2 ? zt(e, t, n, a) : (o._visibility |= 2,
            Aa(e, t, n, a, (t.subtreeFlags & 10256) !== 0 || !1)),
            u & 2048 && xs(h, t);
            break;
        case 24:
            zt(e, t, n, a),
            u & 2048 && Ss(t.alternate, t);
            break;
        default:
            zt(e, t, n, a)
        }
    }
    function Aa(e, t, n, a, u) {
        for (u = u && ((t.subtreeFlags & 10256) !== 0 || !1),
        t = t.child; t !== null; ) {
            var o = e
              , h = t
              , y = n
              , C = a
              , L = h.flags;
            switch (h.tag) {
            case 0:
            case 11:
            case 15:
                Aa(o, h, y, C, u),
                wl(8, h);
                break;
            case 23:
                break;
            case 22:
                var H = h.stateNode;
                h.memoizedState !== null ? H._visibility & 2 ? Aa(o, h, y, C, u) : Cl(o, h) : (H._visibility |= 2,
                Aa(o, h, y, C, u)),
                u && L & 2048 && xs(h.alternate, h);
                break;
            case 24:
                Aa(o, h, y, C, u),
                u && L & 2048 && Ss(h.alternate, h);
                break;
            default:
                Aa(o, h, y, C, u)
            }
            t = t.sibling
        }
    }
    function Cl(e, t) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; ) {
                var n = e
                  , a = t
                  , u = a.flags;
                switch (a.tag) {
                case 22:
                    Cl(n, a),
                    u & 2048 && xs(a.alternate, a);
                    break;
                case 24:
                    Cl(n, a),
                    u & 2048 && Ss(a.alternate, a);
                    break;
                default:
                    Cl(n, a)
                }
                t = t.sibling
            }
    }
    var Tl = 8192;
    function Ra(e, t, n) {
        if (e.subtreeFlags & Tl)
            for (e = e.child; e !== null; )
                Yd(e, t, n),
                e = e.sibling
    }
    function Yd(e, t, n) {
        switch (e.tag) {
        case 26:
            Ra(e, t, n),
            e.flags & Tl && e.memoizedState !== null && Cy(n, jt, e.memoizedState, e.memoizedProps);
            break;
        case 5:
            Ra(e, t, n);
            break;
        case 3:
        case 4:
            var a = jt;
            jt = ru(e.stateNode.containerInfo),
            Ra(e, t, n),
            jt = a;
            break;
        case 22:
            e.memoizedState === null && (a = e.alternate,
            a !== null && a.memoizedState !== null ? (a = Tl,
            Tl = 16777216,
            Ra(e, t, n),
            Tl = a) : Ra(e, t, n));
            break;
        default:
            Ra(e, t, n)
        }
    }
    function Vd(e) {
        var t = e.alternate;
        if (t !== null && (e = t.child,
        e !== null)) {
            t.child = null;
            do
                t = e.sibling,
                e.sibling = null,
                e = t;
            while (e !== null)
        }
    }
    function Ol(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var n = 0; n < t.length; n++) {
                    var a = t[n];
                    Ke = a,
                    Xd(a, e)
                }
            Vd(e)
        }
        if (e.subtreeFlags & 10256)
            for (e = e.child; e !== null; )
                Qd(e),
                e = e.sibling
    }
    function Qd(e) {
        switch (e.tag) {
        case 0:
        case 11:
        case 15:
            Ol(e),
            e.flags & 2048 && _n(9, e, e.return);
            break;
        case 3:
            Ol(e);
            break;
        case 12:
            Ol(e);
            break;
        case 22:
            var t = e.stateNode;
            e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3,
            Ji(e)) : Ol(e);
            break;
        default:
            Ol(e)
        }
    }
    function Ji(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var n = 0; n < t.length; n++) {
                    var a = t[n];
                    Ke = a,
                    Xd(a, e)
                }
            Vd(e)
        }
        for (e = e.child; e !== null; ) {
            switch (t = e,
            t.tag) {
            case 0:
            case 11:
            case 15:
                _n(8, t, t.return),
                Ji(t);
                break;
            case 22:
                n = t.stateNode,
                n._visibility & 2 && (n._visibility &= -3,
                Ji(t));
                break;
            default:
                Ji(t)
            }
            e = e.sibling
        }
    }
    function Xd(e, t) {
        for (; Ke !== null; ) {
            var n = Ke;
            switch (n.tag) {
            case 0:
            case 11:
            case 15:
                _n(8, n, t);
                break;
            case 23:
            case 22:
                if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
                    var a = n.memoizedState.cachePool.pool;
                    a != null && a.refCount++
                }
                break;
            case 24:
                cl(n.memoizedState.cache)
            }
            if (a = n.child,
            a !== null)
                a.return = n,
                Ke = a;
            else
                e: for (n = e; Ke !== null; ) {
                    a = Ke;
                    var u = a.sibling
                      , o = a.return;
                    if (zd(a),
                    a === n) {
                        Ke = null;
                        break e
                    }
                    if (u !== null) {
                        u.return = o,
                        Ke = u;
                        break e
                    }
                    Ke = o
                }
        }
    }
    var G0 = {
        getCacheForType: function(e) {
            var t = We(Ge)
              , n = t.data.get(e);
            return n === void 0 && (n = e(),
            t.data.set(e, n)),
            n
        },
        cacheSignal: function() {
            return We(Ge).controller.signal
        }
    }
      , Y0 = typeof WeakMap == "function" ? WeakMap : Map
      , Ee = 0
      , Le = null
      , he = null
      , ge = 0
      , Te = 0
      , vt = null
      , Cn = !1
      , Na = !1
      , Es = !1
      , un = 0
      , Ue = 0
      , Tn = 0
      , ta = 0
      , ws = 0
      , bt = 0
      , La = 0
      , Al = null
      , ot = null
      , _s = !1
      , $i = 0
      , kd = 0
      , Fi = 1 / 0
      , Wi = null
      , On = null
      , Xe = 0
      , An = null
      , Ma = null
      , rn = 0
      , Cs = 0
      , Ts = null
      , Zd = null
      , Rl = 0
      , Os = null;
    function xt() {
        return (Ee & 2) !== 0 && ge !== 0 ? ge & -ge : D.T !== null ? js() : rc()
    }
    function Kd() {
        if (bt === 0)
            if ((ge & 536870912) === 0 || ve) {
                var e = ii;
                ii <<= 1,
                (ii & 3932160) === 0 && (ii = 262144),
                bt = e
            } else
                bt = 536870912;
        return e = pt.current,
        e !== null && (e.flags |= 32),
        bt
    }
    function ct(e, t, n) {
        (e === Le && (Te === 2 || Te === 9) || e.cancelPendingCommit !== null) && (ja(e, 0),
        Rn(e, ge, bt, !1)),
        Fa(e, n),
        ((Ee & 2) === 0 || e !== Le) && (e === Le && ((Ee & 2) === 0 && (ta |= n),
        Ue === 4 && Rn(e, ge, bt, !1)),
        qt(e))
    }
    function Jd(e, t, n) {
        if ((Ee & 6) !== 0)
            throw Error(s(327));
        var a = !n && (t & 127) === 0 && (t & e.expiredLanes) === 0 || $a(e, t)
          , u = a ? X0(e, t) : Rs(e, t, !0)
          , o = a;
        do {
            if (u === 0) {
                Na && !a && Rn(e, t, 0, !1);
                break
            } else {
                if (n = e.current.alternate,
                o && !V0(n)) {
                    u = Rs(e, t, !1),
                    o = !1;
                    continue
                }
                if (u === 2) {
                    if (o = t,
                    e.errorRecoveryDisabledLanes & o)
                        var h = 0;
                    else
                        h = e.pendingLanes & -536870913,
                        h = h !== 0 ? h : h & 536870912 ? 536870912 : 0;
                    if (h !== 0) {
                        t = h;
                        e: {
                            var y = e;
                            u = Al;
                            var C = y.current.memoizedState.isDehydrated;
                            if (C && (ja(y, h).flags |= 256),
                            h = Rs(y, h, !1),
                            h !== 2) {
                                if (Es && !C) {
                                    y.errorRecoveryDisabledLanes |= o,
                                    ta |= o,
                                    u = 4;
                                    break e
                                }
                                o = ot,
                                ot = u,
                                o !== null && (ot === null ? ot = o : ot.push.apply(ot, o))
                            }
                            u = h
                        }
                        if (o = !1,
                        u !== 2)
                            continue
                    }
                }
                if (u === 1) {
                    ja(e, 0),
                    Rn(e, t, 0, !0);
                    break
                }
                e: {
                    switch (a = e,
                    o = u,
                    o) {
                    case 0:
                    case 1:
                        throw Error(s(345));
                    case 4:
                        if ((t & 4194048) !== t)
                            break;
                    case 6:
                        Rn(a, t, bt, !Cn);
                        break e;
                    case 2:
                        ot = null;
                        break;
                    case 3:
                    case 5:
                        break;
                    default:
                        throw Error(s(329))
                    }
                    if ((t & 62914560) === t && (u = $i + 300 - ft(),
                    10 < u)) {
                        if (Rn(a, t, bt, !Cn),
                        ri(a, 0, !0) !== 0)
                            break e;
                        rn = t,
                        a.timeoutHandle = Ch($d.bind(null, a, n, ot, Wi, _s, t, bt, ta, La, Cn, o, "Throttled", -0, 0), u);
                        break e
                    }
                    $d(a, n, ot, Wi, _s, t, bt, ta, La, Cn, o, null, -0, 0)
                }
            }
            break
        } while (!0);
        qt(e)
    }
    function $d(e, t, n, a, u, o, h, y, C, L, H, Y, M, z) {
        if (e.timeoutHandle = -1,
        Y = t.subtreeFlags,
        Y & 8192 || (Y & 16785408) === 16785408) {
            Y = {
                stylesheets: null,
                count: 0,
                imgCount: 0,
                imgBytes: 0,
                suspenseyImages: [],
                waitingForImages: !0,
                waitingForViewTransition: !1,
                unsuspend: kt
            },
            Yd(t, o, Y);
            var F = (o & 62914560) === o ? $i - ft() : (o & 4194048) === o ? kd - ft() : 0;
            if (F = Ty(Y, F),
            F !== null) {
                rn = o,
                e.cancelPendingCommit = F(ah.bind(null, e, t, o, n, a, u, h, y, C, H, Y, null, M, z)),
                Rn(e, o, h, !L);
                return
            }
        }
        ah(e, t, o, n, a, u, h, y, C)
    }
    function V0(e) {
        for (var t = e; ; ) {
            var n = t.tag;
            if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue,
            n !== null && (n = n.stores,
            n !== null)))
                for (var a = 0; a < n.length; a++) {
                    var u = n[a]
                      , o = u.getSnapshot;
                    u = u.value;
                    try {
                        if (!mt(o(), u))
                            return !1
                    } catch {
                        return !1
                    }
                }
            if (n = t.child,
            t.subtreeFlags & 16384 && n !== null)
                n.return = t,
                t = n;
            else {
                if (t === e)
                    break;
                for (; t.sibling === null; ) {
                    if (t.return === null || t.return === e)
                        return !0;
                    t = t.return
                }
                t.sibling.return = t.return,
                t = t.sibling
            }
        }
        return !0
    }
    function Rn(e, t, n, a) {
        t &= ~ws,
        t &= ~ta,
        e.suspendedLanes |= t,
        e.pingedLanes &= ~t,
        a && (e.warmLanes |= t),
        a = e.expirationTimes;
        for (var u = t; 0 < u; ) {
            var o = 31 - ht(u)
              , h = 1 << o;
            a[o] = -1,
            u &= ~h
        }
        n !== 0 && lc(e, n, t)
    }
    function Ii() {
        return (Ee & 6) === 0 ? (Nl(0),
        !1) : !0
    }
    function As() {
        if (he !== null) {
            if (Te === 0)
                var e = he.return;
            else
                e = he,
                $t = Zn = null,
                Xr(e),
                wa = null,
                dl = 0,
                e = he;
            for (; e !== null; )
                Td(e.alternate, e),
                e = e.return;
            he = null
        }
    }
    function ja(e, t) {
        var n = e.timeoutHandle;
        n !== -1 && (e.timeoutHandle = -1,
        sy(n)),
        n = e.cancelPendingCommit,
        n !== null && (e.cancelPendingCommit = null,
        n()),
        rn = 0,
        As(),
        Le = e,
        he = n = Kt(e.current, null),
        ge = t,
        Te = 0,
        vt = null,
        Cn = !1,
        Na = $a(e, t),
        Es = !1,
        La = bt = ws = ta = Tn = Ue = 0,
        ot = Al = null,
        _s = !1,
        (t & 8) !== 0 && (t |= t & 32);
        var a = e.entangledLanes;
        if (a !== 0)
            for (e = e.entanglements,
            a &= t; 0 < a; ) {
                var u = 31 - ht(a)
                  , o = 1 << u;
                t |= e[u],
                a &= ~o
            }
        return un = t,
        bi(),
        n
    }
    function Fd(e, t) {
        re = null,
        D.H = xl,
        t === Ea || t === Oi ? (t = df(),
        Te = 3) : t === Mr ? (t = df(),
        Te = 4) : Te = t === us ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1,
        vt = t,
        he === null && (Ue = 1,
        Yi(e, _t(t, e.current)))
    }
    function Wd() {
        var e = pt.current;
        return e === null ? !0 : (ge & 4194048) === ge ? At === null : (ge & 62914560) === ge || (ge & 536870912) !== 0 ? e === At : !1
    }
    function Id() {
        var e = D.H;
        return D.H = xl,
        e === null ? xl : e
    }
    function Pd() {
        var e = D.A;
        return D.A = G0,
        e
    }
    function Pi() {
        Ue = 4,
        Cn || (ge & 4194048) !== ge && pt.current !== null || (Na = !0),
        (Tn & 134217727) === 0 && (ta & 134217727) === 0 || Le === null || Rn(Le, ge, bt, !1)
    }
    function Rs(e, t, n) {
        var a = Ee;
        Ee |= 2;
        var u = Id()
          , o = Pd();
        (Le !== e || ge !== t) && (Wi = null,
        ja(e, t)),
        t = !1;
        var h = Ue;
        e: do
            try {
                if (Te !== 0 && he !== null) {
                    var y = he
                      , C = vt;
                    switch (Te) {
                    case 8:
                        As(),
                        h = 6;
                        break e;
                    case 3:
                    case 2:
                    case 9:
                    case 6:
                        pt.current === null && (t = !0);
                        var L = Te;
                        if (Te = 0,
                        vt = null,
                        za(e, y, C, L),
                        n && Na) {
                            h = 0;
                            break e
                        }
                        break;
                    default:
                        L = Te,
                        Te = 0,
                        vt = null,
                        za(e, y, C, L)
                    }
                }
                Q0(),
                h = Ue;
                break
            } catch (H) {
                Fd(e, H)
            }
        while (!0);
        return t && e.shellSuspendCounter++,
        $t = Zn = null,
        Ee = a,
        D.H = u,
        D.A = o,
        he === null && (Le = null,
        ge = 0,
        bi()),
        h
    }
    function Q0() {
        for (; he !== null; )
            eh(he)
    }
    function X0(e, t) {
        var n = Ee;
        Ee |= 2;
        var a = Id()
          , u = Pd();
        Le !== e || ge !== t ? (Wi = null,
        Fi = ft() + 500,
        ja(e, t)) : Na = $a(e, t);
        e: do
            try {
                if (Te !== 0 && he !== null) {
                    t = he;
                    var o = vt;
                    t: switch (Te) {
                    case 1:
                        Te = 0,
                        vt = null,
                        za(e, t, o, 1);
                        break;
                    case 2:
                    case 9:
                        if (cf(o)) {
                            Te = 0,
                            vt = null,
                            th(t);
                            break
                        }
                        t = function() {
                            Te !== 2 && Te !== 9 || Le !== e || (Te = 7),
                            qt(e)
                        }
                        ,
                        o.then(t, t);
                        break e;
                    case 3:
                        Te = 7;
                        break e;
                    case 4:
                        Te = 5;
                        break e;
                    case 7:
                        cf(o) ? (Te = 0,
                        vt = null,
                        th(t)) : (Te = 0,
                        vt = null,
                        za(e, t, o, 7));
                        break;
                    case 5:
                        var h = null;
                        switch (he.tag) {
                        case 26:
                            h = he.memoizedState;
                        case 5:
                        case 27:
                            var y = he;
                            if (h ? Gh(h) : y.stateNode.complete) {
                                Te = 0,
                                vt = null;
                                var C = y.sibling;
                                if (C !== null)
                                    he = C;
                                else {
                                    var L = y.return;
                                    L !== null ? (he = L,
                                    eu(L)) : he = null
                                }
                                break t
                            }
                        }
                        Te = 0,
                        vt = null,
                        za(e, t, o, 5);
                        break;
                    case 6:
                        Te = 0,
                        vt = null,
                        za(e, t, o, 6);
                        break;
                    case 8:
                        As(),
                        Ue = 6;
                        break e;
                    default:
                        throw Error(s(462))
                    }
                }
                k0();
                break
            } catch (H) {
                Fd(e, H)
            }
        while (!0);
        return $t = Zn = null,
        D.H = a,
        D.A = u,
        Ee = n,
        he !== null ? 0 : (Le = null,
        ge = 0,
        bi(),
        Ue)
    }
    function k0() {
        for (; he !== null && !mp(); )
            eh(he)
    }
    function eh(e) {
        var t = _d(e.alternate, e, un);
        e.memoizedProps = e.pendingProps,
        t === null ? eu(e) : he = t
    }
    function th(e) {
        var t = e
          , n = t.alternate;
        switch (t.tag) {
        case 15:
        case 0:
            t = vd(n, t, t.pendingProps, t.type, void 0, ge);
            break;
        case 11:
            t = vd(n, t, t.pendingProps, t.type.render, t.ref, ge);
            break;
        case 5:
            Xr(t);
        default:
            Td(n, t),
            t = he = Ic(t, un),
            t = _d(n, t, un)
        }
        e.memoizedProps = e.pendingProps,
        t === null ? eu(e) : he = t
    }
    function za(e, t, n, a) {
        $t = Zn = null,
        Xr(t),
        wa = null,
        dl = 0;
        var u = t.return;
        try {
            if (j0(e, u, t, n, ge)) {
                Ue = 1,
                Yi(e, _t(n, e.current)),
                he = null;
                return
            }
        } catch (o) {
            if (u !== null)
                throw he = u,
                o;
            Ue = 1,
            Yi(e, _t(n, e.current)),
            he = null;
            return
        }
        t.flags & 32768 ? (ve || a === 1 ? e = !0 : Na || (ge & 536870912) !== 0 ? e = !1 : (Cn = e = !0,
        (a === 2 || a === 9 || a === 3 || a === 6) && (a = pt.current,
        a !== null && a.tag === 13 && (a.flags |= 16384))),
        nh(t, e)) : eu(t)
    }
    function eu(e) {
        var t = e;
        do {
            if ((t.flags & 32768) !== 0) {
                nh(t, Cn);
                return
            }
            e = t.return;
            var n = U0(t.alternate, t, un);
            if (n !== null) {
                he = n;
                return
            }
            if (t = t.sibling,
            t !== null) {
                he = t;
                return
            }
            he = t = e
        } while (t !== null);
        Ue === 0 && (Ue = 5)
    }
    function nh(e, t) {
        do {
            var n = H0(e.alternate, e);
            if (n !== null) {
                n.flags &= 32767,
                he = n;
                return
            }
            if (n = e.return,
            n !== null && (n.flags |= 32768,
            n.subtreeFlags = 0,
            n.deletions = null),
            !t && (e = e.sibling,
            e !== null)) {
                he = e;
                return
            }
            he = e = n
        } while (e !== null);
        Ue = 6,
        he = null
    }
    function ah(e, t, n, a, u, o, h, y, C) {
        e.cancelPendingCommit = null;
        do
            tu();
        while (Xe !== 0);
        if ((Ee & 6) !== 0)
            throw Error(s(327));
        if (t !== null) {
            if (t === e.current)
                throw Error(s(177));
            if (o = t.lanes | t.childLanes,
            o |= yr,
            _p(e, n, o, h, y, C),
            e === Le && (he = Le = null,
            ge = 0),
            Ma = t,
            An = e,
            rn = n,
            Cs = o,
            Ts = u,
            Zd = a,
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null,
            e.callbackPriority = 0,
            $0(ai, function() {
                return sh(),
                null
            })) : (e.callbackNode = null,
            e.callbackPriority = 0),
            a = (t.flags & 13878) !== 0,
            (t.subtreeFlags & 13878) !== 0 || a) {
                a = D.T,
                D.T = null,
                u = X.p,
                X.p = 2,
                h = Ee,
                Ee |= 4;
                try {
                    B0(e, t, n)
                } finally {
                    Ee = h,
                    X.p = u,
                    D.T = a
                }
            }
            Xe = 1,
            lh(),
            ih(),
            uh()
        }
    }
    function lh() {
        if (Xe === 1) {
            Xe = 0;
            var e = An
              , t = Ma
              , n = (t.flags & 13878) !== 0;
            if ((t.subtreeFlags & 13878) !== 0 || n) {
                n = D.T,
                D.T = null;
                var a = X.p;
                X.p = 2;
                var u = Ee;
                Ee |= 4;
                try {
                    Bd(t, e);
                    var o = Ys
                      , h = Qc(e.containerInfo)
                      , y = o.focusedElem
                      , C = o.selectionRange;
                    if (h !== y && y && y.ownerDocument && Vc(y.ownerDocument.documentElement, y)) {
                        if (C !== null && dr(y)) {
                            var L = C.start
                              , H = C.end;
                            if (H === void 0 && (H = L),
                            "selectionStart"in y)
                                y.selectionStart = L,
                                y.selectionEnd = Math.min(H, y.value.length);
                            else {
                                var Y = y.ownerDocument || document
                                  , M = Y && Y.defaultView || window;
                                if (M.getSelection) {
                                    var z = M.getSelection()
                                      , F = y.textContent.length
                                      , ae = Math.min(C.start, F)
                                      , Ne = C.end === void 0 ? ae : Math.min(C.end, F);
                                    !z.extend && ae > Ne && (h = Ne,
                                    Ne = ae,
                                    ae = h);
                                    var R = Yc(y, ae)
                                      , O = Yc(y, Ne);
                                    if (R && O && (z.rangeCount !== 1 || z.anchorNode !== R.node || z.anchorOffset !== R.offset || z.focusNode !== O.node || z.focusOffset !== O.offset)) {
                                        var N = Y.createRange();
                                        N.setStart(R.node, R.offset),
                                        z.removeAllRanges(),
                                        ae > Ne ? (z.addRange(N),
                                        z.extend(O.node, O.offset)) : (N.setEnd(O.node, O.offset),
                                        z.addRange(N))
                                    }
                                }
                            }
                        }
                        for (Y = [],
                        z = y; z = z.parentNode; )
                            z.nodeType === 1 && Y.push({
                                element: z,
                                left: z.scrollLeft,
                                top: z.scrollTop
                            });
                        for (typeof y.focus == "function" && y.focus(),
                        y = 0; y < Y.length; y++) {
                            var q = Y[y];
                            q.element.scrollLeft = q.left,
                            q.element.scrollTop = q.top
                        }
                    }
                    hu = !!Gs,
                    Ys = Gs = null
                } finally {
                    Ee = u,
                    X.p = a,
                    D.T = n
                }
            }
            e.current = t,
            Xe = 2
        }
    }
    function ih() {
        if (Xe === 2) {
            Xe = 0;
            var e = An
              , t = Ma
              , n = (t.flags & 8772) !== 0;
            if ((t.subtreeFlags & 8772) !== 0 || n) {
                n = D.T,
                D.T = null;
                var a = X.p;
                X.p = 2;
                var u = Ee;
                Ee |= 4;
                try {
                    jd(e, t.alternate, t)
                } finally {
                    Ee = u,
                    X.p = a,
                    D.T = n
                }
            }
            Xe = 3
        }
    }
    function uh() {
        if (Xe === 4 || Xe === 3) {
            Xe = 0,
            gp();
            var e = An
              , t = Ma
              , n = rn
              , a = Zd;
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? Xe = 5 : (Xe = 0,
            Ma = An = null,
            rh(e, e.pendingLanes));
            var u = e.pendingLanes;
            if (u === 0 && (On = null),
            Ku(n),
            t = t.stateNode,
            dt && typeof dt.onCommitFiberRoot == "function")
                try {
                    dt.onCommitFiberRoot(Ja, t, void 0, (t.current.flags & 128) === 128)
                } catch {}
            if (a !== null) {
                t = D.T,
                u = X.p,
                X.p = 2,
                D.T = null;
                try {
                    for (var o = e.onRecoverableError, h = 0; h < a.length; h++) {
                        var y = a[h];
                        o(y.value, {
                            componentStack: y.stack
                        })
                    }
                } finally {
                    D.T = t,
                    X.p = u
                }
            }
            (rn & 3) !== 0 && tu(),
            qt(e),
            u = e.pendingLanes,
            (n & 261930) !== 0 && (u & 42) !== 0 ? e === Os ? Rl++ : (Rl = 0,
            Os = e) : Rl = 0,
            Nl(0)
        }
    }
    function rh(e, t) {
        (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache,
        t != null && (e.pooledCache = null,
        cl(t)))
    }
    function tu() {
        return lh(),
        ih(),
        uh(),
        sh()
    }
    function sh() {
        if (Xe !== 5)
            return !1;
        var e = An
          , t = Cs;
        Cs = 0;
        var n = Ku(rn)
          , a = D.T
          , u = X.p;
        try {
            X.p = 32 > n ? 32 : n,
            D.T = null,
            n = Ts,
            Ts = null;
            var o = An
              , h = rn;
            if (Xe = 0,
            Ma = An = null,
            rn = 0,
            (Ee & 6) !== 0)
                throw Error(s(331));
            var y = Ee;
            if (Ee |= 4,
            Qd(o.current),
            Gd(o, o.current, h, n),
            Ee = y,
            Nl(0, !1),
            dt && typeof dt.onPostCommitFiberRoot == "function")
                try {
                    dt.onPostCommitFiberRoot(Ja, o)
                } catch {}
            return !0
        } finally {
            X.p = u,
            D.T = a,
            rh(e, t)
        }
    }
    function oh(e, t, n) {
        t = _t(n, t),
        t = is(e.stateNode, t, 2),
        e = Sn(e, t, 2),
        e !== null && (Fa(e, 2),
        qt(e))
    }
    function Oe(e, t, n) {
        if (e.tag === 3)
            oh(e, e, n);
        else
            for (; t !== null; ) {
                if (t.tag === 3) {
                    oh(t, e, n);
                    break
                } else if (t.tag === 1) {
                    var a = t.stateNode;
                    if (typeof t.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (On === null || !On.has(a))) {
                        e = _t(n, e),
                        n = cd(2),
                        a = Sn(t, n, 2),
                        a !== null && (fd(n, a, t, e),
                        Fa(a, 2),
                        qt(a));
                        break
                    }
                }
                t = t.return
            }
    }
    function Ns(e, t, n) {
        var a = e.pingCache;
        if (a === null) {
            a = e.pingCache = new Y0;
            var u = new Set;
            a.set(t, u)
        } else
            u = a.get(t),
            u === void 0 && (u = new Set,
            a.set(t, u));
        u.has(n) || (Es = !0,
        u.add(n),
        e = Z0.bind(null, e, t, n),
        t.then(e, e))
    }
    function Z0(e, t, n) {
        var a = e.pingCache;
        a !== null && a.delete(t),
        e.pingedLanes |= e.suspendedLanes & n,
        e.warmLanes &= ~n,
        Le === e && (ge & n) === n && (Ue === 4 || Ue === 3 && (ge & 62914560) === ge && 300 > ft() - $i ? (Ee & 2) === 0 && ja(e, 0) : ws |= n,
        La === ge && (La = 0)),
        qt(e)
    }
    function ch(e, t) {
        t === 0 && (t = ac()),
        e = Qn(e, t),
        e !== null && (Fa(e, t),
        qt(e))
    }
    function K0(e) {
        var t = e.memoizedState
          , n = 0;
        t !== null && (n = t.retryLane),
        ch(e, n)
    }
    function J0(e, t) {
        var n = 0;
        switch (e.tag) {
        case 31:
        case 13:
            var a = e.stateNode
              , u = e.memoizedState;
            u !== null && (n = u.retryLane);
            break;
        case 19:
            a = e.stateNode;
            break;
        case 22:
            a = e.stateNode._retryCache;
            break;
        default:
            throw Error(s(314))
        }
        a !== null && a.delete(t),
        ch(e, n)
    }
    function $0(e, t) {
        return Qu(e, t)
    }
    var nu = null
      , Da = null
      , Ls = !1
      , au = !1
      , Ms = !1
      , Nn = 0;
    function qt(e) {
        e !== Da && e.next === null && (Da === null ? nu = Da = e : Da = Da.next = e),
        au = !0,
        Ls || (Ls = !0,
        W0())
    }
    function Nl(e, t) {
        if (!Ms && au) {
            Ms = !0;
            do
                for (var n = !1, a = nu; a !== null; ) {
                    if (e !== 0) {
                        var u = a.pendingLanes;
                        if (u === 0)
                            var o = 0;
                        else {
                            var h = a.suspendedLanes
                              , y = a.pingedLanes;
                            o = (1 << 31 - ht(42 | e) + 1) - 1,
                            o &= u & ~(h & ~y),
                            o = o & 201326741 ? o & 201326741 | 1 : o ? o | 2 : 0
                        }
                        o !== 0 && (n = !0,
                        mh(a, o))
                    } else
                        o = ge,
                        o = ri(a, a === Le ? o : 0, a.cancelPendingCommit !== null || a.timeoutHandle !== -1),
                        (o & 3) === 0 || $a(a, o) || (n = !0,
                        mh(a, o));
                    a = a.next
                }
            while (n);
            Ms = !1
        }
    }
    function F0() {
        fh()
    }
    function fh() {
        au = Ls = !1;
        var e = 0;
        Nn !== 0 && ry() && (e = Nn);
        for (var t = ft(), n = null, a = nu; a !== null; ) {
            var u = a.next
              , o = dh(a, t);
            o === 0 ? (a.next = null,
            n === null ? nu = u : n.next = u,
            u === null && (Da = n)) : (n = a,
            (e !== 0 || (o & 3) !== 0) && (au = !0)),
            a = u
        }
        Xe !== 0 && Xe !== 5 || Nl(e),
        Nn !== 0 && (Nn = 0)
    }
    function dh(e, t) {
        for (var n = e.suspendedLanes, a = e.pingedLanes, u = e.expirationTimes, o = e.pendingLanes & -62914561; 0 < o; ) {
            var h = 31 - ht(o)
              , y = 1 << h
              , C = u[h];
            C === -1 ? ((y & n) === 0 || (y & a) !== 0) && (u[h] = wp(y, t)) : C <= t && (e.expiredLanes |= y),
            o &= ~y
        }
        if (t = Le,
        n = ge,
        n = ri(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        a = e.callbackNode,
        n === 0 || e === t && (Te === 2 || Te === 9) || e.cancelPendingCommit !== null)
            return a !== null && a !== null && Xu(a),
            e.callbackNode = null,
            e.callbackPriority = 0;
        if ((n & 3) === 0 || $a(e, n)) {
            if (t = n & -n,
            t === e.callbackPriority)
                return t;
            switch (a !== null && Xu(a),
            Ku(n)) {
            case 2:
            case 8:
                n = tc;
                break;
            case 32:
                n = ai;
                break;
            case 268435456:
                n = nc;
                break;
            default:
                n = ai
            }
            return a = hh.bind(null, e),
            n = Qu(n, a),
            e.callbackPriority = t,
            e.callbackNode = n,
            t
        }
        return a !== null && a !== null && Xu(a),
        e.callbackPriority = 2,
        e.callbackNode = null,
        2
    }
    function hh(e, t) {
        if (Xe !== 0 && Xe !== 5)
            return e.callbackNode = null,
            e.callbackPriority = 0,
            null;
        var n = e.callbackNode;
        if (tu() && e.callbackNode !== n)
            return null;
        var a = ge;
        return a = ri(e, e === Le ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        a === 0 ? null : (Jd(e, a, t),
        dh(e, ft()),
        e.callbackNode != null && e.callbackNode === n ? hh.bind(null, e) : null)
    }
    function mh(e, t) {
        if (tu())
            return null;
        Jd(e, t, !0)
    }
    function W0() {
        oy(function() {
            (Ee & 6) !== 0 ? Qu(ec, F0) : fh()
        })
    }
    function js() {
        if (Nn === 0) {
            var e = xa;
            e === 0 && (e = li,
            li <<= 1,
            (li & 261888) === 0 && (li = 256)),
            Nn = e
        }
        return Nn
    }
    function gh(e) {
        return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : fi("" + e)
    }
    function ph(e, t) {
        var n = t.ownerDocument.createElement("input");
        return n.name = t.name,
        n.value = t.value,
        e.id && n.setAttribute("form", e.id),
        t.parentNode.insertBefore(n, t),
        e = new FormData(e),
        n.parentNode.removeChild(n),
        e
    }
    function I0(e, t, n, a, u) {
        if (t === "submit" && n && n.stateNode === u) {
            var o = gh((u[lt] || null).action)
              , h = a.submitter;
            h && (t = (t = h[lt] || null) ? gh(t.formAction) : h.getAttribute("formAction"),
            t !== null && (o = t,
            h = null));
            var y = new gi("action","action",null,a,u);
            e.push({
                event: y,
                listeners: [{
                    instance: null,
                    listener: function() {
                        if (a.defaultPrevented) {
                            if (Nn !== 0) {
                                var C = h ? ph(u, h) : new FormData(u);
                                Pr(n, {
                                    pending: !0,
                                    data: C,
                                    method: u.method,
                                    action: o
                                }, null, C)
                            }
                        } else
                            typeof o == "function" && (y.preventDefault(),
                            C = h ? ph(u, h) : new FormData(u),
                            Pr(n, {
                                pending: !0,
                                data: C,
                                method: u.method,
                                action: o
                            }, o, C))
                    },
                    currentTarget: u
                }]
            })
        }
    }
    for (var zs = 0; zs < pr.length; zs++) {
        var Ds = pr[zs]
          , P0 = Ds.toLowerCase()
          , ey = Ds[0].toUpperCase() + Ds.slice(1);
        Mt(P0, "on" + ey)
    }
    Mt(Zc, "onAnimationEnd"),
    Mt(Kc, "onAnimationIteration"),
    Mt(Jc, "onAnimationStart"),
    Mt("dblclick", "onDoubleClick"),
    Mt("focusin", "onFocus"),
    Mt("focusout", "onBlur"),
    Mt(p0, "onTransitionRun"),
    Mt(y0, "onTransitionStart"),
    Mt(v0, "onTransitionCancel"),
    Mt($c, "onTransitionEnd"),
    ua("onMouseEnter", ["mouseout", "mouseover"]),
    ua("onMouseLeave", ["mouseout", "mouseover"]),
    ua("onPointerEnter", ["pointerout", "pointerover"]),
    ua("onPointerLeave", ["pointerout", "pointerover"]),
    qn("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")),
    qn("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),
    qn("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]),
    qn("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")),
    qn("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")),
    qn("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
    var Ll = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ")
      , ty = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Ll));
    function yh(e, t) {
        t = (t & 4) !== 0;
        for (var n = 0; n < e.length; n++) {
            var a = e[n]
              , u = a.event;
            a = a.listeners;
            e: {
                var o = void 0;
                if (t)
                    for (var h = a.length - 1; 0 <= h; h--) {
                        var y = a[h]
                          , C = y.instance
                          , L = y.currentTarget;
                        if (y = y.listener,
                        C !== o && u.isPropagationStopped())
                            break e;
                        o = y,
                        u.currentTarget = L;
                        try {
                            o(u)
                        } catch (H) {
                            vi(H)
                        }
                        u.currentTarget = null,
                        o = C
                    }
                else
                    for (h = 0; h < a.length; h++) {
                        if (y = a[h],
                        C = y.instance,
                        L = y.currentTarget,
                        y = y.listener,
                        C !== o && u.isPropagationStopped())
                            break e;
                        o = y,
                        u.currentTarget = L;
                        try {
                            o(u)
                        } catch (H) {
                            vi(H)
                        }
                        u.currentTarget = null,
                        o = C
                    }
            }
        }
    }
    function me(e, t) {
        var n = t[Ju];
        n === void 0 && (n = t[Ju] = new Set);
        var a = e + "__bubble";
        n.has(a) || (vh(t, e, 2, !1),
        n.add(a))
    }
    function Us(e, t, n) {
        var a = 0;
        t && (a |= 4),
        vh(n, e, a, t)
    }
    var lu = "_reactListening" + Math.random().toString(36).slice(2);
    function Hs(e) {
        if (!e[lu]) {
            e[lu] = !0,
            cc.forEach(function(n) {
                n !== "selectionchange" && (ty.has(n) || Us(n, !1, e),
                Us(n, !0, e))
            });
            var t = e.nodeType === 9 ? e : e.ownerDocument;
            t === null || t[lu] || (t[lu] = !0,
            Us("selectionchange", !1, t))
        }
    }
    function vh(e, t, n, a) {
        switch (Kh(t)) {
        case 2:
            var u = Ry;
            break;
        case 8:
            u = Ny;
            break;
        default:
            u = Is
        }
        n = u.bind(null, t, n, e),
        u = void 0,
        !ar || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (u = !0),
        a ? u !== void 0 ? e.addEventListener(t, n, {
            capture: !0,
            passive: u
        }) : e.addEventListener(t, n, !0) : u !== void 0 ? e.addEventListener(t, n, {
            passive: u
        }) : e.addEventListener(t, n, !1)
    }
    function Bs(e, t, n, a, u) {
        var o = a;
        if ((t & 1) === 0 && (t & 2) === 0 && a !== null)
            e: for (; ; ) {
                if (a === null)
                    return;
                var h = a.tag;
                if (h === 3 || h === 4) {
                    var y = a.stateNode.containerInfo;
                    if (y === u)
                        break;
                    if (h === 4)
                        for (h = a.return; h !== null; ) {
                            var C = h.tag;
                            if ((C === 3 || C === 4) && h.stateNode.containerInfo === u)
                                return;
                            h = h.return
                        }
                    for (; y !== null; ) {
                        if (h = aa(y),
                        h === null)
                            return;
                        if (C = h.tag,
                        C === 5 || C === 6 || C === 26 || C === 27) {
                            a = o = h;
                            continue e
                        }
                        y = y.parentNode
                    }
                }
                a = a.return
            }
        Ec(function() {
            var L = o
              , H = tr(n)
              , Y = [];
            e: {
                var M = Fc.get(e);
                if (M !== void 0) {
                    var z = gi
                      , F = e;
                    switch (e) {
                    case "keypress":
                        if (hi(n) === 0)
                            break e;
                    case "keydown":
                    case "keyup":
                        z = Jp;
                        break;
                    case "focusin":
                        F = "focus",
                        z = rr;
                        break;
                    case "focusout":
                        F = "blur",
                        z = rr;
                        break;
                    case "beforeblur":
                    case "afterblur":
                        z = rr;
                        break;
                    case "click":
                        if (n.button === 2)
                            break e;
                    case "auxclick":
                    case "dblclick":
                    case "mousedown":
                    case "mousemove":
                    case "mouseup":
                    case "mouseout":
                    case "mouseover":
                    case "contextmenu":
                        z = Cc;
                        break;
                    case "drag":
                    case "dragend":
                    case "dragenter":
                    case "dragexit":
                    case "dragleave":
                    case "dragover":
                    case "dragstart":
                    case "drop":
                        z = Up;
                        break;
                    case "touchcancel":
                    case "touchend":
                    case "touchmove":
                    case "touchstart":
                        z = Wp;
                        break;
                    case Zc:
                    case Kc:
                    case Jc:
                        z = qp;
                        break;
                    case $c:
                        z = Pp;
                        break;
                    case "scroll":
                    case "scrollend":
                        z = zp;
                        break;
                    case "wheel":
                        z = t0;
                        break;
                    case "copy":
                    case "cut":
                    case "paste":
                        z = Yp;
                        break;
                    case "gotpointercapture":
                    case "lostpointercapture":
                    case "pointercancel":
                    case "pointerdown":
                    case "pointermove":
                    case "pointerout":
                    case "pointerover":
                    case "pointerup":
                        z = Oc;
                        break;
                    case "toggle":
                    case "beforetoggle":
                        z = a0
                    }
                    var ae = (t & 4) !== 0
                      , Ne = !ae && (e === "scroll" || e === "scrollend")
                      , R = ae ? M !== null ? M + "Capture" : null : M;
                    ae = [];
                    for (var O = L, N; O !== null; ) {
                        var q = O;
                        if (N = q.stateNode,
                        q = q.tag,
                        q !== 5 && q !== 26 && q !== 27 || N === null || R === null || (q = Pa(O, R),
                        q != null && ae.push(Ml(O, q, N))),
                        Ne)
                            break;
                        O = O.return
                    }
                    0 < ae.length && (M = new z(M,F,null,n,H),
                    Y.push({
                        event: M,
                        listeners: ae
                    }))
                }
            }
            if ((t & 7) === 0) {
                e: {
                    if (M = e === "mouseover" || e === "pointerover",
                    z = e === "mouseout" || e === "pointerout",
                    M && n !== er && (F = n.relatedTarget || n.fromElement) && (aa(F) || F[na]))
                        break e;
                    if ((z || M) && (M = H.window === H ? H : (M = H.ownerDocument) ? M.defaultView || M.parentWindow : window,
                    z ? (F = n.relatedTarget || n.toElement,
                    z = L,
                    F = F ? aa(F) : null,
                    F !== null && (Ne = f(F),
                    ae = F.tag,
                    F !== Ne || ae !== 5 && ae !== 27 && ae !== 6) && (F = null)) : (z = null,
                    F = L),
                    z !== F)) {
                        if (ae = Cc,
                        q = "onMouseLeave",
                        R = "onMouseEnter",
                        O = "mouse",
                        (e === "pointerout" || e === "pointerover") && (ae = Oc,
                        q = "onPointerLeave",
                        R = "onPointerEnter",
                        O = "pointer"),
                        Ne = z == null ? M : Ia(z),
                        N = F == null ? M : Ia(F),
                        M = new ae(q,O + "leave",z,n,H),
                        M.target = Ne,
                        M.relatedTarget = N,
                        q = null,
                        aa(H) === L && (ae = new ae(R,O + "enter",F,n,H),
                        ae.target = N,
                        ae.relatedTarget = Ne,
                        q = ae),
                        Ne = q,
                        z && F)
                            t: {
                                for (ae = ny,
                                R = z,
                                O = F,
                                N = 0,
                                q = R; q; q = ae(q))
                                    N++;
                                q = 0;
                                for (var ee = O; ee; ee = ae(ee))
                                    q++;
                                for (; 0 < N - q; )
                                    R = ae(R),
                                    N--;
                                for (; 0 < q - N; )
                                    O = ae(O),
                                    q--;
                                for (; N--; ) {
                                    if (R === O || O !== null && R === O.alternate) {
                                        ae = R;
                                        break t
                                    }
                                    R = ae(R),
                                    O = ae(O)
                                }
                                ae = null
                            }
                        else
                            ae = null;
                        z !== null && bh(Y, M, z, ae, !1),
                        F !== null && Ne !== null && bh(Y, Ne, F, ae, !0)
                    }
                }
                e: {
                    if (M = L ? Ia(L) : window,
                    z = M.nodeName && M.nodeName.toLowerCase(),
                    z === "select" || z === "input" && M.type === "file")
                        var xe = Dc;
                    else if (jc(M))
                        if (Uc)
                            xe = h0;
                        else {
                            xe = f0;
                            var P = c0
                        }
                    else
                        z = M.nodeName,
                        !z || z.toLowerCase() !== "input" || M.type !== "checkbox" && M.type !== "radio" ? L && Pu(L.elementType) && (xe = Dc) : xe = d0;
                    if (xe && (xe = xe(e, L))) {
                        zc(Y, xe, n, H);
                        break e
                    }
                    P && P(e, M, L),
                    e === "focusout" && L && M.type === "number" && L.memoizedProps.value != null && Iu(M, "number", M.value)
                }
                switch (P = L ? Ia(L) : window,
                e) {
                case "focusin":
                    (jc(P) || P.contentEditable === "true") && (da = P,
                    hr = L,
                    rl = null);
                    break;
                case "focusout":
                    rl = hr = da = null;
                    break;
                case "mousedown":
                    mr = !0;
                    break;
                case "contextmenu":
                case "mouseup":
                case "dragend":
                    mr = !1,
                    Xc(Y, n, H);
                    break;
                case "selectionchange":
                    if (g0)
                        break;
                case "keydown":
                case "keyup":
                    Xc(Y, n, H)
                }
                var ce;
                if (or)
                    e: {
                        switch (e) {
                        case "compositionstart":
                            var pe = "onCompositionStart";
                            break e;
                        case "compositionend":
                            pe = "onCompositionEnd";
                            break e;
                        case "compositionupdate":
                            pe = "onCompositionUpdate";
                            break e
                        }
                        pe = void 0
                    }
                else
                    fa ? Lc(e, n) && (pe = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (pe = "onCompositionStart");
                pe && (Ac && n.locale !== "ko" && (fa || pe !== "onCompositionStart" ? pe === "onCompositionEnd" && fa && (ce = wc()) : (mn = H,
                lr = "value"in mn ? mn.value : mn.textContent,
                fa = !0)),
                P = iu(L, pe),
                0 < P.length && (pe = new Tc(pe,e,null,n,H),
                Y.push({
                    event: pe,
                    listeners: P
                }),
                ce ? pe.data = ce : (ce = Mc(n),
                ce !== null && (pe.data = ce)))),
                (ce = i0 ? u0(e, n) : r0(e, n)) && (pe = iu(L, "onBeforeInput"),
                0 < pe.length && (P = new Tc("onBeforeInput","beforeinput",null,n,H),
                Y.push({
                    event: P,
                    listeners: pe
                }),
                P.data = ce)),
                I0(Y, e, L, n, H)
            }
            yh(Y, t)
        })
    }
    function Ml(e, t, n) {
        return {
            instance: e,
            listener: t,
            currentTarget: n
        }
    }
    function iu(e, t) {
        for (var n = t + "Capture", a = []; e !== null; ) {
            var u = e
              , o = u.stateNode;
            if (u = u.tag,
            u !== 5 && u !== 26 && u !== 27 || o === null || (u = Pa(e, n),
            u != null && a.unshift(Ml(e, u, o)),
            u = Pa(e, t),
            u != null && a.push(Ml(e, u, o))),
            e.tag === 3)
                return a;
            e = e.return
        }
        return []
    }
    function ny(e) {
        if (e === null)
            return null;
        do
            e = e.return;
        while (e && e.tag !== 5 && e.tag !== 27);
        return e || null
    }
    function bh(e, t, n, a, u) {
        for (var o = t._reactName, h = []; n !== null && n !== a; ) {
            var y = n
              , C = y.alternate
              , L = y.stateNode;
            if (y = y.tag,
            C !== null && C === a)
                break;
            y !== 5 && y !== 26 && y !== 27 || L === null || (C = L,
            u ? (L = Pa(n, o),
            L != null && h.unshift(Ml(n, L, C))) : u || (L = Pa(n, o),
            L != null && h.push(Ml(n, L, C)))),
            n = n.return
        }
        h.length !== 0 && e.push({
            event: t,
            listeners: h
        })
    }
    var ay = /\r\n?/g
      , ly = /\u0000|\uFFFD/g;
    function xh(e) {
        return (typeof e == "string" ? e : "" + e).replace(ay, `
`).replace(ly, "")
    }
    function Sh(e, t) {
        return t = xh(t),
        xh(e) === t
    }
    function Re(e, t, n, a, u, o) {
        switch (n) {
        case "children":
            typeof a == "string" ? t === "body" || t === "textarea" && a === "" || sa(e, a) : (typeof a == "number" || typeof a == "bigint") && t !== "body" && sa(e, "" + a);
            break;
        case "className":
            oi(e, "class", a);
            break;
        case "tabIndex":
            oi(e, "tabindex", a);
            break;
        case "dir":
        case "role":
        case "viewBox":
        case "width":
        case "height":
            oi(e, n, a);
            break;
        case "style":
            xc(e, a, o);
            break;
        case "data":
            if (t !== "object") {
                oi(e, "data", a);
                break
            }
        case "src":
        case "href":
            if (a === "" && (t !== "a" || n !== "href")) {
                e.removeAttribute(n);
                break
            }
            if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
                e.removeAttribute(n);
                break
            }
            a = fi("" + a),
            e.setAttribute(n, a);
            break;
        case "action":
        case "formAction":
            if (typeof a == "function") {
                e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
                break
            } else
                typeof o == "function" && (n === "formAction" ? (t !== "input" && Re(e, t, "name", u.name, u, null),
                Re(e, t, "formEncType", u.formEncType, u, null),
                Re(e, t, "formMethod", u.formMethod, u, null),
                Re(e, t, "formTarget", u.formTarget, u, null)) : (Re(e, t, "encType", u.encType, u, null),
                Re(e, t, "method", u.method, u, null),
                Re(e, t, "target", u.target, u, null)));
            if (a == null || typeof a == "symbol" || typeof a == "boolean") {
                e.removeAttribute(n);
                break
            }
            a = fi("" + a),
            e.setAttribute(n, a);
            break;
        case "onClick":
            a != null && (e.onclick = kt);
            break;
        case "onScroll":
            a != null && me("scroll", e);
            break;
        case "onScrollEnd":
            a != null && me("scrollend", e);
            break;
        case "dangerouslySetInnerHTML":
            if (a != null) {
                if (typeof a != "object" || !("__html"in a))
                    throw Error(s(61));
                if (n = a.__html,
                n != null) {
                    if (u.children != null)
                        throw Error(s(60));
                    e.innerHTML = n
                }
            }
            break;
        case "multiple":
            e.multiple = a && typeof a != "function" && typeof a != "symbol";
            break;
        case "muted":
            e.muted = a && typeof a != "function" && typeof a != "symbol";
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "defaultValue":
        case "defaultChecked":
        case "innerHTML":
        case "ref":
            break;
        case "autoFocus":
            break;
        case "xlinkHref":
            if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
                e.removeAttribute("xlink:href");
                break
            }
            n = fi("" + a),
            e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
            break;
        case "contentEditable":
        case "spellCheck":
        case "draggable":
        case "value":
        case "autoReverse":
        case "externalResourcesRequired":
        case "focusable":
        case "preserveAlpha":
            a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(n, "" + a) : e.removeAttribute(n);
            break;
        case "inert":
        case "allowFullScreen":
        case "async":
        case "autoPlay":
        case "controls":
        case "default":
        case "defer":
        case "disabled":
        case "disablePictureInPicture":
        case "disableRemotePlayback":
        case "formNoValidate":
        case "hidden":
        case "loop":
        case "noModule":
        case "noValidate":
        case "open":
        case "playsInline":
        case "readOnly":
        case "required":
        case "reversed":
        case "scoped":
        case "seamless":
        case "itemScope":
            a && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
            break;
        case "capture":
        case "download":
            a === !0 ? e.setAttribute(n, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(n, a) : e.removeAttribute(n);
            break;
        case "cols":
        case "rows":
        case "size":
        case "span":
            a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? e.setAttribute(n, a) : e.removeAttribute(n);
            break;
        case "rowSpan":
        case "start":
            a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? e.removeAttribute(n) : e.setAttribute(n, a);
            break;
        case "popover":
            me("beforetoggle", e),
            me("toggle", e),
            si(e, "popover", a);
            break;
        case "xlinkActuate":
            Xt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", a);
            break;
        case "xlinkArcrole":
            Xt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", a);
            break;
        case "xlinkRole":
            Xt(e, "http://www.w3.org/1999/xlink", "xlink:role", a);
            break;
        case "xlinkShow":
            Xt(e, "http://www.w3.org/1999/xlink", "xlink:show", a);
            break;
        case "xlinkTitle":
            Xt(e, "http://www.w3.org/1999/xlink", "xlink:title", a);
            break;
        case "xlinkType":
            Xt(e, "http://www.w3.org/1999/xlink", "xlink:type", a);
            break;
        case "xmlBase":
            Xt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", a);
            break;
        case "xmlLang":
            Xt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", a);
            break;
        case "xmlSpace":
            Xt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", a);
            break;
        case "is":
            si(e, "is", a);
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Mp.get(n) || n,
            si(e, n, a))
        }
    }
    function qs(e, t, n, a, u, o) {
        switch (n) {
        case "style":
            xc(e, a, o);
            break;
        case "dangerouslySetInnerHTML":
            if (a != null) {
                if (typeof a != "object" || !("__html"in a))
                    throw Error(s(61));
                if (n = a.__html,
                n != null) {
                    if (u.children != null)
                        throw Error(s(60));
                    e.innerHTML = n
                }
            }
            break;
        case "children":
            typeof a == "string" ? sa(e, a) : (typeof a == "number" || typeof a == "bigint") && sa(e, "" + a);
            break;
        case "onScroll":
            a != null && me("scroll", e);
            break;
        case "onScrollEnd":
            a != null && me("scrollend", e);
            break;
        case "onClick":
            a != null && (e.onclick = kt);
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "innerHTML":
        case "ref":
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            if (!fc.hasOwnProperty(n))
                e: {
                    if (n[0] === "o" && n[1] === "n" && (u = n.endsWith("Capture"),
                    t = n.slice(2, u ? n.length - 7 : void 0),
                    o = e[lt] || null,
                    o = o != null ? o[n] : null,
                    typeof o == "function" && e.removeEventListener(t, o, u),
                    typeof a == "function")) {
                        typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)),
                        e.addEventListener(t, a, u);
                        break e
                    }
                    n in e ? e[n] = a : a === !0 ? e.setAttribute(n, "") : si(e, n, a)
                }
        }
    }
    function Pe(e, t, n) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "img":
            me("error", e),
            me("load", e);
            var a = !1, u = !1, o;
            for (o in n)
                if (n.hasOwnProperty(o)) {
                    var h = n[o];
                    if (h != null)
                        switch (o) {
                        case "src":
                            a = !0;
                            break;
                        case "srcSet":
                            u = !0;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            throw Error(s(137, t));
                        default:
                            Re(e, t, o, h, n, null)
                        }
                }
            u && Re(e, t, "srcSet", n.srcSet, n, null),
            a && Re(e, t, "src", n.src, n, null);
            return;
        case "input":
            me("invalid", e);
            var y = o = h = u = null
              , C = null
              , L = null;
            for (a in n)
                if (n.hasOwnProperty(a)) {
                    var H = n[a];
                    if (H != null)
                        switch (a) {
                        case "name":
                            u = H;
                            break;
                        case "type":
                            h = H;
                            break;
                        case "checked":
                            C = H;
                            break;
                        case "defaultChecked":
                            L = H;
                            break;
                        case "value":
                            o = H;
                            break;
                        case "defaultValue":
                            y = H;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            if (H != null)
                                throw Error(s(137, t));
                            break;
                        default:
                            Re(e, t, a, H, n, null)
                        }
                }
            pc(e, o, y, C, L, h, u, !1);
            return;
        case "select":
            me("invalid", e),
            a = h = o = null;
            for (u in n)
                if (n.hasOwnProperty(u) && (y = n[u],
                y != null))
                    switch (u) {
                    case "value":
                        o = y;
                        break;
                    case "defaultValue":
                        h = y;
                        break;
                    case "multiple":
                        a = y;
                    default:
                        Re(e, t, u, y, n, null)
                    }
            t = o,
            n = h,
            e.multiple = !!a,
            t != null ? ra(e, !!a, t, !1) : n != null && ra(e, !!a, n, !0);
            return;
        case "textarea":
            me("invalid", e),
            o = u = a = null;
            for (h in n)
                if (n.hasOwnProperty(h) && (y = n[h],
                y != null))
                    switch (h) {
                    case "value":
                        a = y;
                        break;
                    case "defaultValue":
                        u = y;
                        break;
                    case "children":
                        o = y;
                        break;
                    case "dangerouslySetInnerHTML":
                        if (y != null)
                            throw Error(s(91));
                        break;
                    default:
                        Re(e, t, h, y, n, null)
                    }
            vc(e, a, u, o);
            return;
        case "option":
            for (C in n)
                n.hasOwnProperty(C) && (a = n[C],
                a != null) && (C === "selected" ? e.selected = a && typeof a != "function" && typeof a != "symbol" : Re(e, t, C, a, n, null));
            return;
        case "dialog":
            me("beforetoggle", e),
            me("toggle", e),
            me("cancel", e),
            me("close", e);
            break;
        case "iframe":
        case "object":
            me("load", e);
            break;
        case "video":
        case "audio":
            for (a = 0; a < Ll.length; a++)
                me(Ll[a], e);
            break;
        case "image":
            me("error", e),
            me("load", e);
            break;
        case "details":
            me("toggle", e);
            break;
        case "embed":
        case "source":
        case "link":
            me("error", e),
            me("load", e);
        case "area":
        case "base":
        case "br":
        case "col":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "track":
        case "wbr":
        case "menuitem":
            for (L in n)
                if (n.hasOwnProperty(L) && (a = n[L],
                a != null))
                    switch (L) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        throw Error(s(137, t));
                    default:
                        Re(e, t, L, a, n, null)
                    }
            return;
        default:
            if (Pu(t)) {
                for (H in n)
                    n.hasOwnProperty(H) && (a = n[H],
                    a !== void 0 && qs(e, t, H, a, n, void 0));
                return
            }
        }
        for (y in n)
            n.hasOwnProperty(y) && (a = n[y],
            a != null && Re(e, t, y, a, n, null))
    }
    function iy(e, t, n, a) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "input":
            var u = null
              , o = null
              , h = null
              , y = null
              , C = null
              , L = null
              , H = null;
            for (z in n) {
                var Y = n[z];
                if (n.hasOwnProperty(z) && Y != null)
                    switch (z) {
                    case "checked":
                        break;
                    case "value":
                        break;
                    case "defaultValue":
                        C = Y;
                    default:
                        a.hasOwnProperty(z) || Re(e, t, z, null, a, Y)
                    }
            }
            for (var M in a) {
                var z = a[M];
                if (Y = n[M],
                a.hasOwnProperty(M) && (z != null || Y != null))
                    switch (M) {
                    case "type":
                        o = z;
                        break;
                    case "name":
                        u = z;
                        break;
                    case "checked":
                        L = z;
                        break;
                    case "defaultChecked":
                        H = z;
                        break;
                    case "value":
                        h = z;
                        break;
                    case "defaultValue":
                        y = z;
                        break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (z != null)
                            throw Error(s(137, t));
                        break;
                    default:
                        z !== Y && Re(e, t, M, z, a, Y)
                    }
            }
            Wu(e, h, y, C, L, H, o, u);
            return;
        case "select":
            z = h = y = M = null;
            for (o in n)
                if (C = n[o],
                n.hasOwnProperty(o) && C != null)
                    switch (o) {
                    case "value":
                        break;
                    case "multiple":
                        z = C;
                    default:
                        a.hasOwnProperty(o) || Re(e, t, o, null, a, C)
                    }
            for (u in a)
                if (o = a[u],
                C = n[u],
                a.hasOwnProperty(u) && (o != null || C != null))
                    switch (u) {
                    case "value":
                        M = o;
                        break;
                    case "defaultValue":
                        y = o;
                        break;
                    case "multiple":
                        h = o;
                    default:
                        o !== C && Re(e, t, u, o, a, C)
                    }
            t = y,
            n = h,
            a = z,
            M != null ? ra(e, !!n, M, !1) : !!a != !!n && (t != null ? ra(e, !!n, t, !0) : ra(e, !!n, n ? [] : "", !1));
            return;
        case "textarea":
            z = M = null;
            for (y in n)
                if (u = n[y],
                n.hasOwnProperty(y) && u != null && !a.hasOwnProperty(y))
                    switch (y) {
                    case "value":
                        break;
                    case "children":
                        break;
                    default:
                        Re(e, t, y, null, a, u)
                    }
            for (h in a)
                if (u = a[h],
                o = n[h],
                a.hasOwnProperty(h) && (u != null || o != null))
                    switch (h) {
                    case "value":
                        M = u;
                        break;
                    case "defaultValue":
                        z = u;
                        break;
                    case "children":
                        break;
                    case "dangerouslySetInnerHTML":
                        if (u != null)
                            throw Error(s(91));
                        break;
                    default:
                        u !== o && Re(e, t, h, u, a, o)
                    }
            yc(e, M, z);
            return;
        case "option":
            for (var F in n)
                M = n[F],
                n.hasOwnProperty(F) && M != null && !a.hasOwnProperty(F) && (F === "selected" ? e.selected = !1 : Re(e, t, F, null, a, M));
            for (C in a)
                M = a[C],
                z = n[C],
                a.hasOwnProperty(C) && M !== z && (M != null || z != null) && (C === "selected" ? e.selected = M && typeof M != "function" && typeof M != "symbol" : Re(e, t, C, M, a, z));
            return;
        case "img":
        case "link":
        case "area":
        case "base":
        case "br":
        case "col":
        case "embed":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "source":
        case "track":
        case "wbr":
        case "menuitem":
            for (var ae in n)
                M = n[ae],
                n.hasOwnProperty(ae) && M != null && !a.hasOwnProperty(ae) && Re(e, t, ae, null, a, M);
            for (L in a)
                if (M = a[L],
                z = n[L],
                a.hasOwnProperty(L) && M !== z && (M != null || z != null))
                    switch (L) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (M != null)
                            throw Error(s(137, t));
                        break;
                    default:
                        Re(e, t, L, M, a, z)
                    }
            return;
        default:
            if (Pu(t)) {
                for (var Ne in n)
                    M = n[Ne],
                    n.hasOwnProperty(Ne) && M !== void 0 && !a.hasOwnProperty(Ne) && qs(e, t, Ne, void 0, a, M);
                for (H in a)
                    M = a[H],
                    z = n[H],
                    !a.hasOwnProperty(H) || M === z || M === void 0 && z === void 0 || qs(e, t, H, M, a, z);
                return
            }
        }
        for (var R in n)
            M = n[R],
            n.hasOwnProperty(R) && M != null && !a.hasOwnProperty(R) && Re(e, t, R, null, a, M);
        for (Y in a)
            M = a[Y],
            z = n[Y],
            !a.hasOwnProperty(Y) || M === z || M == null && z == null || Re(e, t, Y, M, a, z)
    }
    function Eh(e) {
        switch (e) {
        case "css":
        case "script":
        case "font":
        case "img":
        case "image":
        case "input":
        case "link":
            return !0;
        default:
            return !1
        }
    }
    function uy() {
        if (typeof performance.getEntriesByType == "function") {
            for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), a = 0; a < n.length; a++) {
                var u = n[a]
                  , o = u.transferSize
                  , h = u.initiatorType
                  , y = u.duration;
                if (o && y && Eh(h)) {
                    for (h = 0,
                    y = u.responseEnd,
                    a += 1; a < n.length; a++) {
                        var C = n[a]
                          , L = C.startTime;
                        if (L > y)
                            break;
                        var H = C.transferSize
                          , Y = C.initiatorType;
                        H && Eh(Y) && (C = C.responseEnd,
                        h += H * (C < y ? 1 : (y - L) / (C - L)))
                    }
                    if (--a,
                    t += 8 * (o + h) / (u.duration / 1e3),
                    e++,
                    10 < e)
                        break
                }
            }
            if (0 < e)
                return t / e / 1e6
        }
        return navigator.connection && (e = navigator.connection.downlink,
        typeof e == "number") ? e : 5
    }
    var Gs = null
      , Ys = null;
    function uu(e) {
        return e.nodeType === 9 ? e : e.ownerDocument
    }
    function wh(e) {
        switch (e) {
        case "http://www.w3.org/2000/svg":
            return 1;
        case "http://www.w3.org/1998/Math/MathML":
            return 2;
        default:
            return 0
        }
    }
    function _h(e, t) {
        if (e === 0)
            switch (t) {
            case "svg":
                return 1;
            case "math":
                return 2;
            default:
                return 0
            }
        return e === 1 && t === "foreignObject" ? 0 : e
    }
    function Vs(e, t) {
        return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null
    }
    var Qs = null;
    function ry() {
        var e = window.event;
        return e && e.type === "popstate" ? e === Qs ? !1 : (Qs = e,
        !0) : (Qs = null,
        !1)
    }
    var Ch = typeof setTimeout == "function" ? setTimeout : void 0
      , sy = typeof clearTimeout == "function" ? clearTimeout : void 0
      , Th = typeof Promise == "function" ? Promise : void 0
      , oy = typeof queueMicrotask == "function" ? queueMicrotask : typeof Th < "u" ? function(e) {
        return Th.resolve(null).then(e).catch(cy)
    }
    : Ch;
    function cy(e) {
        setTimeout(function() {
            throw e
        })
    }
    function Ln(e) {
        return e === "head"
    }
    function Oh(e, t) {
        var n = t
          , a = 0;
        do {
            var u = n.nextSibling;
            if (e.removeChild(n),
            u && u.nodeType === 8)
                if (n = u.data,
                n === "/$" || n === "/&") {
                    if (a === 0) {
                        e.removeChild(u),
                        qa(t);
                        return
                    }
                    a--
                } else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&")
                    a++;
                else if (n === "html")
                    jl(e.ownerDocument.documentElement);
                else if (n === "head") {
                    n = e.ownerDocument.head,
                    jl(n);
                    for (var o = n.firstChild; o; ) {
                        var h = o.nextSibling
                          , y = o.nodeName;
                        o[Wa] || y === "SCRIPT" || y === "STYLE" || y === "LINK" && o.rel.toLowerCase() === "stylesheet" || n.removeChild(o),
                        o = h
                    }
                } else
                    n === "body" && jl(e.ownerDocument.body);
            n = u
        } while (n);
        qa(t)
    }
    function Ah(e, t) {
        var n = e;
        e = 0;
        do {
            var a = n.nextSibling;
            if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display,
            n.style.display = "none") : (n.style.display = n._stashedDisplay || "",
            n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue,
            n.nodeValue = "") : n.nodeValue = n._stashedText || ""),
            a && a.nodeType === 8)
                if (n = a.data,
                n === "/$") {
                    if (e === 0)
                        break;
                    e--
                } else
                    n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
            n = a
        } while (n)
    }
    function Xs(e) {
        var t = e.firstChild;
        for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
            var n = t;
            switch (t = t.nextSibling,
            n.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
                Xs(n),
                $u(n);
                continue;
            case "SCRIPT":
            case "STYLE":
                continue;
            case "LINK":
                if (n.rel.toLowerCase() === "stylesheet")
                    continue
            }
            e.removeChild(n)
        }
    }
    function fy(e, t, n, a) {
        for (; e.nodeType === 1; ) {
            var u = n;
            if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
                if (!a && (e.nodeName !== "INPUT" || e.type !== "hidden"))
                    break
            } else if (a) {
                if (!e[Wa])
                    switch (t) {
                    case "meta":
                        if (!e.hasAttribute("itemprop"))
                            break;
                        return e;
                    case "link":
                        if (o = e.getAttribute("rel"),
                        o === "stylesheet" && e.hasAttribute("data-precedence"))
                            break;
                        if (o !== u.rel || e.getAttribute("href") !== (u.href == null || u.href === "" ? null : u.href) || e.getAttribute("crossorigin") !== (u.crossOrigin == null ? null : u.crossOrigin) || e.getAttribute("title") !== (u.title == null ? null : u.title))
                            break;
                        return e;
                    case "style":
                        if (e.hasAttribute("data-precedence"))
                            break;
                        return e;
                    case "script":
                        if (o = e.getAttribute("src"),
                        (o !== (u.src == null ? null : u.src) || e.getAttribute("type") !== (u.type == null ? null : u.type) || e.getAttribute("crossorigin") !== (u.crossOrigin == null ? null : u.crossOrigin)) && o && e.hasAttribute("async") && !e.hasAttribute("itemprop"))
                            break;
                        return e;
                    default:
                        return e
                    }
            } else if (t === "input" && e.type === "hidden") {
                var o = u.name == null ? null : "" + u.name;
                if (u.type === "hidden" && e.getAttribute("name") === o)
                    return e
            } else
                return e;
            if (e = Rt(e.nextSibling),
            e === null)
                break
        }
        return null
    }
    function dy(e, t, n) {
        if (t === "")
            return null;
        for (; e.nodeType !== 3; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = Rt(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function Rh(e, t) {
        for (; e.nodeType !== 8; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Rt(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function ks(e) {
        return e.data === "$?" || e.data === "$~"
    }
    function Zs(e) {
        return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading"
    }
    function hy(e, t) {
        var n = e.ownerDocument;
        if (e.data === "$~")
            e._reactRetry = t;
        else if (e.data !== "$?" || n.readyState !== "loading")
            t();
        else {
            var a = function() {
                t(),
                n.removeEventListener("DOMContentLoaded", a)
            };
            n.addEventListener("DOMContentLoaded", a),
            e._reactRetry = a
        }
    }
    function Rt(e) {
        for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3)
                break;
            if (t === 8) {
                if (t = e.data,
                t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
                    break;
                if (t === "/$" || t === "/&")
                    return null
            }
        }
        return e
    }
    var Ks = null;
    function Nh(e) {
        e = e.nextSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var n = e.data;
                if (n === "/$" || n === "/&") {
                    if (t === 0)
                        return Rt(e.nextSibling);
                    t--
                } else
                    n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++
            }
            e = e.nextSibling
        }
        return null
    }
    function Lh(e) {
        e = e.previousSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var n = e.data;
                if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
                    if (t === 0)
                        return e;
                    t--
                } else
                    n !== "/$" && n !== "/&" || t++
            }
            e = e.previousSibling
        }
        return null
    }
    function Mh(e, t, n) {
        switch (t = uu(n),
        e) {
        case "html":
            if (e = t.documentElement,
            !e)
                throw Error(s(452));
            return e;
        case "head":
            if (e = t.head,
            !e)
                throw Error(s(453));
            return e;
        case "body":
            if (e = t.body,
            !e)
                throw Error(s(454));
            return e;
        default:
            throw Error(s(451))
        }
    }
    function jl(e) {
        for (var t = e.attributes; t.length; )
            e.removeAttributeNode(t[0]);
        $u(e)
    }
    var Nt = new Map
      , jh = new Set;
    function ru(e) {
        return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument
    }
    var sn = X.d;
    X.d = {
        f: my,
        r: gy,
        D: py,
        C: yy,
        L: vy,
        m: by,
        X: Sy,
        S: xy,
        M: Ey
    };
    function my() {
        var e = sn.f()
          , t = Ii();
        return e || t
    }
    function gy(e) {
        var t = la(e);
        t !== null && t.tag === 5 && t.type === "form" ? Ff(t) : sn.r(e)
    }
    var Ua = typeof document > "u" ? null : document;
    function zh(e, t, n) {
        var a = Ua;
        if (a && typeof t == "string" && t) {
            var u = Et(t);
            u = 'link[rel="' + e + '"][href="' + u + '"]',
            typeof n == "string" && (u += '[crossorigin="' + n + '"]'),
            jh.has(u) || (jh.add(u),
            e = {
                rel: e,
                crossOrigin: n,
                href: t
            },
            a.querySelector(u) === null && (t = a.createElement("link"),
            Pe(t, "link", e),
            Ze(t),
            a.head.appendChild(t)))
        }
    }
    function py(e) {
        sn.D(e),
        zh("dns-prefetch", e, null)
    }
    function yy(e, t) {
        sn.C(e, t),
        zh("preconnect", e, t)
    }
    function vy(e, t, n) {
        sn.L(e, t, n);
        var a = Ua;
        if (a && e && t) {
            var u = 'link[rel="preload"][as="' + Et(t) + '"]';
            t === "image" && n && n.imageSrcSet ? (u += '[imagesrcset="' + Et(n.imageSrcSet) + '"]',
            typeof n.imageSizes == "string" && (u += '[imagesizes="' + Et(n.imageSizes) + '"]')) : u += '[href="' + Et(e) + '"]';
            var o = u;
            switch (t) {
            case "style":
                o = Ha(e);
                break;
            case "script":
                o = Ba(e)
            }
            Nt.has(o) || (e = v({
                rel: "preload",
                href: t === "image" && n && n.imageSrcSet ? void 0 : e,
                as: t
            }, n),
            Nt.set(o, e),
            a.querySelector(u) !== null || t === "style" && a.querySelector(zl(o)) || t === "script" && a.querySelector(Dl(o)) || (t = a.createElement("link"),
            Pe(t, "link", e),
            Ze(t),
            a.head.appendChild(t)))
        }
    }
    function by(e, t) {
        sn.m(e, t);
        var n = Ua;
        if (n && e) {
            var a = t && typeof t.as == "string" ? t.as : "script"
              , u = 'link[rel="modulepreload"][as="' + Et(a) + '"][href="' + Et(e) + '"]'
              , o = u;
            switch (a) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
                o = Ba(e)
            }
            if (!Nt.has(o) && (e = v({
                rel: "modulepreload",
                href: e
            }, t),
            Nt.set(o, e),
            n.querySelector(u) === null)) {
                switch (a) {
                case "audioworklet":
                case "paintworklet":
                case "serviceworker":
                case "sharedworker":
                case "worker":
                case "script":
                    if (n.querySelector(Dl(o)))
                        return
                }
                a = n.createElement("link"),
                Pe(a, "link", e),
                Ze(a),
                n.head.appendChild(a)
            }
        }
    }
    function xy(e, t, n) {
        sn.S(e, t, n);
        var a = Ua;
        if (a && e) {
            var u = ia(a).hoistableStyles
              , o = Ha(e);
            t = t || "default";
            var h = u.get(o);
            if (!h) {
                var y = {
                    loading: 0,
                    preload: null
                };
                if (h = a.querySelector(zl(o)))
                    y.loading = 5;
                else {
                    e = v({
                        rel: "stylesheet",
                        href: e,
                        "data-precedence": t
                    }, n),
                    (n = Nt.get(o)) && Js(e, n);
                    var C = h = a.createElement("link");
                    Ze(C),
                    Pe(C, "link", e),
                    C._p = new Promise(function(L, H) {
                        C.onload = L,
                        C.onerror = H
                    }
                    ),
                    C.addEventListener("load", function() {
                        y.loading |= 1
                    }),
                    C.addEventListener("error", function() {
                        y.loading |= 2
                    }),
                    y.loading |= 4,
                    su(h, t, a)
                }
                h = {
                    type: "stylesheet",
                    instance: h,
                    count: 1,
                    state: y
                },
                u.set(o, h)
            }
        }
    }
    function Sy(e, t) {
        sn.X(e, t);
        var n = Ua;
        if (n && e) {
            var a = ia(n).hoistableScripts
              , u = Ba(e)
              , o = a.get(u);
            o || (o = n.querySelector(Dl(u)),
            o || (e = v({
                src: e,
                async: !0
            }, t),
            (t = Nt.get(u)) && $s(e, t),
            o = n.createElement("script"),
            Ze(o),
            Pe(o, "link", e),
            n.head.appendChild(o)),
            o = {
                type: "script",
                instance: o,
                count: 1,
                state: null
            },
            a.set(u, o))
        }
    }
    function Ey(e, t) {
        sn.M(e, t);
        var n = Ua;
        if (n && e) {
            var a = ia(n).hoistableScripts
              , u = Ba(e)
              , o = a.get(u);
            o || (o = n.querySelector(Dl(u)),
            o || (e = v({
                src: e,
                async: !0,
                type: "module"
            }, t),
            (t = Nt.get(u)) && $s(e, t),
            o = n.createElement("script"),
            Ze(o),
            Pe(o, "link", e),
            n.head.appendChild(o)),
            o = {
                type: "script",
                instance: o,
                count: 1,
                state: null
            },
            a.set(u, o))
        }
    }
    function Dh(e, t, n, a) {
        var u = (u = de.current) ? ru(u) : null;
        if (!u)
            throw Error(s(446));
        switch (e) {
        case "meta":
        case "title":
            return null;
        case "style":
            return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Ha(n.href),
            n = ia(u).hoistableStyles,
            a = n.get(t),
            a || (a = {
                type: "style",
                instance: null,
                count: 0,
                state: null
            },
            n.set(t, a)),
            a) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        case "link":
            if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
                e = Ha(n.href);
                var o = ia(u).hoistableStyles
                  , h = o.get(e);
                if (h || (u = u.ownerDocument || u,
                h = {
                    type: "stylesheet",
                    instance: null,
                    count: 0,
                    state: {
                        loading: 0,
                        preload: null
                    }
                },
                o.set(e, h),
                (o = u.querySelector(zl(e))) && !o._p && (h.instance = o,
                h.state.loading = 5),
                Nt.has(e) || (n = {
                    rel: "preload",
                    as: "style",
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy
                },
                Nt.set(e, n),
                o || wy(u, e, n, h.state))),
                t && a === null)
                    throw Error(s(528, ""));
                return h
            }
            if (t && a !== null)
                throw Error(s(529, ""));
            return null;
        case "script":
            return t = n.async,
            n = n.src,
            typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Ba(n),
            n = ia(u).hoistableScripts,
            a = n.get(t),
            a || (a = {
                type: "script",
                instance: null,
                count: 0,
                state: null
            },
            n.set(t, a)),
            a) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        default:
            throw Error(s(444, e))
        }
    }
    function Ha(e) {
        return 'href="' + Et(e) + '"'
    }
    function zl(e) {
        return 'link[rel="stylesheet"][' + e + "]"
    }
    function Uh(e) {
        return v({}, e, {
            "data-precedence": e.precedence,
            precedence: null
        })
    }
    function wy(e, t, n, a) {
        e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? a.loading = 1 : (t = e.createElement("link"),
        a.preload = t,
        t.addEventListener("load", function() {
            return a.loading |= 1
        }),
        t.addEventListener("error", function() {
            return a.loading |= 2
        }),
        Pe(t, "link", n),
        Ze(t),
        e.head.appendChild(t))
    }
    function Ba(e) {
        return '[src="' + Et(e) + '"]'
    }
    function Dl(e) {
        return "script[async]" + e
    }
    function Hh(e, t, n) {
        if (t.count++,
        t.instance === null)
            switch (t.type) {
            case "style":
                var a = e.querySelector('style[data-href~="' + Et(n.href) + '"]');
                if (a)
                    return t.instance = a,
                    Ze(a),
                    a;
                var u = v({}, n, {
                    "data-href": n.href,
                    "data-precedence": n.precedence,
                    href: null,
                    precedence: null
                });
                return a = (e.ownerDocument || e).createElement("style"),
                Ze(a),
                Pe(a, "style", u),
                su(a, n.precedence, e),
                t.instance = a;
            case "stylesheet":
                u = Ha(n.href);
                var o = e.querySelector(zl(u));
                if (o)
                    return t.state.loading |= 4,
                    t.instance = o,
                    Ze(o),
                    o;
                a = Uh(n),
                (u = Nt.get(u)) && Js(a, u),
                o = (e.ownerDocument || e).createElement("link"),
                Ze(o);
                var h = o;
                return h._p = new Promise(function(y, C) {
                    h.onload = y,
                    h.onerror = C
                }
                ),
                Pe(o, "link", a),
                t.state.loading |= 4,
                su(o, n.precedence, e),
                t.instance = o;
            case "script":
                return o = Ba(n.src),
                (u = e.querySelector(Dl(o))) ? (t.instance = u,
                Ze(u),
                u) : (a = n,
                (u = Nt.get(o)) && (a = v({}, n),
                $s(a, u)),
                e = e.ownerDocument || e,
                u = e.createElement("script"),
                Ze(u),
                Pe(u, "link", a),
                e.head.appendChild(u),
                t.instance = u);
            case "void":
                return null;
            default:
                throw Error(s(443, t.type))
            }
        else
            t.type === "stylesheet" && (t.state.loading & 4) === 0 && (a = t.instance,
            t.state.loading |= 4,
            su(a, n.precedence, e));
        return t.instance
    }
    function su(e, t, n) {
        for (var a = n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), u = a.length ? a[a.length - 1] : null, o = u, h = 0; h < a.length; h++) {
            var y = a[h];
            if (y.dataset.precedence === t)
                o = y;
            else if (o !== u)
                break
        }
        o ? o.parentNode.insertBefore(e, o.nextSibling) : (t = n.nodeType === 9 ? n.head : n,
        t.insertBefore(e, t.firstChild))
    }
    function Js(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.title == null && (e.title = t.title)
    }
    function $s(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.integrity == null && (e.integrity = t.integrity)
    }
    var ou = null;
    function Bh(e, t, n) {
        if (ou === null) {
            var a = new Map
              , u = ou = new Map;
            u.set(n, a)
        } else
            u = ou,
            a = u.get(n),
            a || (a = new Map,
            u.set(n, a));
        if (a.has(e))
            return a;
        for (a.set(e, null),
        n = n.getElementsByTagName(e),
        u = 0; u < n.length; u++) {
            var o = n[u];
            if (!(o[Wa] || o[$e] || e === "link" && o.getAttribute("rel") === "stylesheet") && o.namespaceURI !== "http://www.w3.org/2000/svg") {
                var h = o.getAttribute(t) || "";
                h = e + h;
                var y = a.get(h);
                y ? y.push(o) : a.set(h, [o])
            }
        }
        return a
    }
    function qh(e, t, n) {
        e = e.ownerDocument || e,
        e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null)
    }
    function _y(e, t, n) {
        if (n === 1 || t.itemProp != null)
            return !1;
        switch (e) {
        case "meta":
        case "title":
            return !0;
        case "style":
            if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
                break;
            return !0;
        case "link":
            if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
                break;
            return t.rel === "stylesheet" ? (e = t.disabled,
            typeof t.precedence == "string" && e == null) : !0;
        case "script":
            if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
                return !0
        }
        return !1
    }
    function Gh(e) {
        return !(e.type === "stylesheet" && (e.state.loading & 3) === 0)
    }
    function Cy(e, t, n, a) {
        if (n.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (n.state.loading & 4) === 0) {
            if (n.instance === null) {
                var u = Ha(a.href)
                  , o = t.querySelector(zl(u));
                if (o) {
                    t = o._p,
                    t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++,
                    e = cu.bind(e),
                    t.then(e, e)),
                    n.state.loading |= 4,
                    n.instance = o,
                    Ze(o);
                    return
                }
                o = t.ownerDocument || t,
                a = Uh(a),
                (u = Nt.get(u)) && Js(a, u),
                o = o.createElement("link"),
                Ze(o);
                var h = o;
                h._p = new Promise(function(y, C) {
                    h.onload = y,
                    h.onerror = C
                }
                ),
                Pe(o, "link", a),
                n.instance = o
            }
            e.stylesheets === null && (e.stylesheets = new Map),
            e.stylesheets.set(n, t),
            (t = n.state.preload) && (n.state.loading & 3) === 0 && (e.count++,
            n = cu.bind(e),
            t.addEventListener("load", n),
            t.addEventListener("error", n))
        }
    }
    var Fs = 0;
    function Ty(e, t) {
        return e.stylesheets && e.count === 0 && du(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount ? function(n) {
            var a = setTimeout(function() {
                if (e.stylesheets && du(e, e.stylesheets),
                e.unsuspend) {
                    var o = e.unsuspend;
                    e.unsuspend = null,
                    o()
                }
            }, 6e4 + t);
            0 < e.imgBytes && Fs === 0 && (Fs = 62500 * uy());
            var u = setTimeout(function() {
                if (e.waitingForImages = !1,
                e.count === 0 && (e.stylesheets && du(e, e.stylesheets),
                e.unsuspend)) {
                    var o = e.unsuspend;
                    e.unsuspend = null,
                    o()
                }
            }, (e.imgBytes > Fs ? 50 : 800) + t);
            return e.unsuspend = n,
            function() {
                e.unsuspend = null,
                clearTimeout(a),
                clearTimeout(u)
            }
        }
        : null
    }
    function cu() {
        if (this.count--,
        this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
            if (this.stylesheets)
                du(this, this.stylesheets);
            else if (this.unsuspend) {
                var e = this.unsuspend;
                this.unsuspend = null,
                e()
            }
        }
    }
    var fu = null;
    function du(e, t) {
        e.stylesheets = null,
        e.unsuspend !== null && (e.count++,
        fu = new Map,
        t.forEach(Oy, e),
        fu = null,
        cu.call(e))
    }
    function Oy(e, t) {
        if (!(t.state.loading & 4)) {
            var n = fu.get(e);
            if (n)
                var a = n.get(null);
            else {
                n = new Map,
                fu.set(e, n);
                for (var u = e.querySelectorAll("link[data-precedence],style[data-precedence]"), o = 0; o < u.length; o++) {
                    var h = u[o];
                    (h.nodeName === "LINK" || h.getAttribute("media") !== "not all") && (n.set(h.dataset.precedence, h),
                    a = h)
                }
                a && n.set(null, a)
            }
            u = t.instance,
            h = u.getAttribute("data-precedence"),
            o = n.get(h) || a,
            o === a && n.set(null, u),
            n.set(h, u),
            this.count++,
            a = cu.bind(this),
            u.addEventListener("load", a),
            u.addEventListener("error", a),
            o ? o.parentNode.insertBefore(u, o.nextSibling) : (e = e.nodeType === 9 ? e.head : e,
            e.insertBefore(u, e.firstChild)),
            t.state.loading |= 4
        }
    }
    var Ul = {
        $$typeof: V,
        Provider: null,
        Consumer: null,
        _currentValue: te,
        _currentValue2: te,
        _threadCount: 0
    };
    function Ay(e, t, n, a, u, o, h, y, C) {
        this.tag = 1,
        this.containerInfo = e,
        this.pingCache = this.current = this.pendingChildren = null,
        this.timeoutHandle = -1,
        this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null,
        this.callbackPriority = 0,
        this.expirationTimes = ku(-1),
        this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0,
        this.entanglements = ku(0),
        this.hiddenUpdates = ku(null),
        this.identifierPrefix = a,
        this.onUncaughtError = u,
        this.onCaughtError = o,
        this.onRecoverableError = h,
        this.pooledCache = null,
        this.pooledCacheLanes = 0,
        this.formState = C,
        this.incompleteTransitions = new Map
    }
    function Yh(e, t, n, a, u, o, h, y, C, L, H, Y) {
        return e = new Ay(e,t,n,h,C,L,H,Y,y),
        t = 1,
        o === !0 && (t |= 24),
        o = gt(3, null, null, t),
        e.current = o,
        o.stateNode = e,
        t = Rr(),
        t.refCount++,
        e.pooledCache = t,
        t.refCount++,
        o.memoizedState = {
            element: a,
            isDehydrated: n,
            cache: t
        },
        jr(o),
        e
    }
    function Vh(e) {
        return e ? (e = ga,
        e) : ga
    }
    function Qh(e, t, n, a, u, o) {
        u = Vh(u),
        a.context === null ? a.context = u : a.pendingContext = u,
        a = xn(t),
        a.payload = {
            element: n
        },
        o = o === void 0 ? null : o,
        o !== null && (a.callback = o),
        n = Sn(e, a, t),
        n !== null && (ct(n, e, t),
        ml(n, e, t))
    }
    function Xh(e, t) {
        if (e = e.memoizedState,
        e !== null && e.dehydrated !== null) {
            var n = e.retryLane;
            e.retryLane = n !== 0 && n < t ? n : t
        }
    }
    function Ws(e, t) {
        Xh(e, t),
        (e = e.alternate) && Xh(e, t)
    }
    function kh(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = Qn(e, 67108864);
            t !== null && ct(t, e, 67108864),
            Ws(e, 67108864)
        }
    }
    function Zh(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = xt();
            t = Zu(t);
            var n = Qn(e, t);
            n !== null && ct(n, e, t),
            Ws(e, t)
        }
    }
    var hu = !0;
    function Ry(e, t, n, a) {
        var u = D.T;
        D.T = null;
        var o = X.p;
        try {
            X.p = 2,
            Is(e, t, n, a)
        } finally {
            X.p = o,
            D.T = u
        }
    }
    function Ny(e, t, n, a) {
        var u = D.T;
        D.T = null;
        var o = X.p;
        try {
            X.p = 8,
            Is(e, t, n, a)
        } finally {
            X.p = o,
            D.T = u
        }
    }
    function Is(e, t, n, a) {
        if (hu) {
            var u = Ps(a);
            if (u === null)
                Bs(e, t, a, mu, n),
                Jh(e, a);
            else if (My(u, e, t, n, a))
                a.stopPropagation();
            else if (Jh(e, a),
            t & 4 && -1 < Ly.indexOf(e)) {
                for (; u !== null; ) {
                    var o = la(u);
                    if (o !== null)
                        switch (o.tag) {
                        case 3:
                            if (o = o.stateNode,
                            o.current.memoizedState.isDehydrated) {
                                var h = Bn(o.pendingLanes);
                                if (h !== 0) {
                                    var y = o;
                                    for (y.pendingLanes |= 2,
                                    y.entangledLanes |= 2; h; ) {
                                        var C = 1 << 31 - ht(h);
                                        y.entanglements[1] |= C,
                                        h &= ~C
                                    }
                                    qt(o),
                                    (Ee & 6) === 0 && (Fi = ft() + 500,
                                    Nl(0))
                                }
                            }
                            break;
                        case 31:
                        case 13:
                            y = Qn(o, 2),
                            y !== null && ct(y, o, 2),
                            Ii(),
                            Ws(o, 2)
                        }
                    if (o = Ps(a),
                    o === null && Bs(e, t, a, mu, n),
                    o === u)
                        break;
                    u = o
                }
                u !== null && a.stopPropagation()
            } else
                Bs(e, t, a, null, n)
        }
    }
    function Ps(e) {
        return e = tr(e),
        eo(e)
    }
    var mu = null;
    function eo(e) {
        if (mu = null,
        e = aa(e),
        e !== null) {
            var t = f(e);
            if (t === null)
                e = null;
            else {
                var n = t.tag;
                if (n === 13) {
                    if (e = d(t),
                    e !== null)
                        return e;
                    e = null
                } else if (n === 31) {
                    if (e = m(t),
                    e !== null)
                        return e;
                    e = null
                } else if (n === 3) {
                    if (t.stateNode.current.memoizedState.isDehydrated)
                        return t.tag === 3 ? t.stateNode.containerInfo : null;
                    e = null
                } else
                    t !== e && (e = null)
            }
        }
        return mu = e,
        null
    }
    function Kh(e) {
        switch (e) {
        case "beforetoggle":
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "toggle":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
            return 2;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
            return 8;
        case "message":
            switch (pp()) {
            case ec:
                return 2;
            case tc:
                return 8;
            case ai:
            case yp:
                return 32;
            case nc:
                return 268435456;
            default:
                return 32
            }
        default:
            return 32
        }
    }
    var to = !1
      , Mn = null
      , jn = null
      , zn = null
      , Hl = new Map
      , Bl = new Map
      , Dn = []
      , Ly = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
    function Jh(e, t) {
        switch (e) {
        case "focusin":
        case "focusout":
            Mn = null;
            break;
        case "dragenter":
        case "dragleave":
            jn = null;
            break;
        case "mouseover":
        case "mouseout":
            zn = null;
            break;
        case "pointerover":
        case "pointerout":
            Hl.delete(t.pointerId);
            break;
        case "gotpointercapture":
        case "lostpointercapture":
            Bl.delete(t.pointerId)
        }
    }
    function ql(e, t, n, a, u, o) {
        return e === null || e.nativeEvent !== o ? (e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: a,
            nativeEvent: o,
            targetContainers: [u]
        },
        t !== null && (t = la(t),
        t !== null && kh(t)),
        e) : (e.eventSystemFlags |= a,
        t = e.targetContainers,
        u !== null && t.indexOf(u) === -1 && t.push(u),
        e)
    }
    function My(e, t, n, a, u) {
        switch (t) {
        case "focusin":
            return Mn = ql(Mn, e, t, n, a, u),
            !0;
        case "dragenter":
            return jn = ql(jn, e, t, n, a, u),
            !0;
        case "mouseover":
            return zn = ql(zn, e, t, n, a, u),
            !0;
        case "pointerover":
            var o = u.pointerId;
            return Hl.set(o, ql(Hl.get(o) || null, e, t, n, a, u)),
            !0;
        case "gotpointercapture":
            return o = u.pointerId,
            Bl.set(o, ql(Bl.get(o) || null, e, t, n, a, u)),
            !0
        }
        return !1
    }
    function $h(e) {
        var t = aa(e.target);
        if (t !== null) {
            var n = f(t);
            if (n !== null) {
                if (t = n.tag,
                t === 13) {
                    if (t = d(n),
                    t !== null) {
                        e.blockedOn = t,
                        sc(e.priority, function() {
                            Zh(n)
                        });
                        return
                    }
                } else if (t === 31) {
                    if (t = m(n),
                    t !== null) {
                        e.blockedOn = t,
                        sc(e.priority, function() {
                            Zh(n)
                        });
                        return
                    }
                } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
                    e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
                    return
                }
            }
        }
        e.blockedOn = null
    }
    function gu(e) {
        if (e.blockedOn !== null)
            return !1;
        for (var t = e.targetContainers; 0 < t.length; ) {
            var n = Ps(e.nativeEvent);
            if (n === null) {
                n = e.nativeEvent;
                var a = new n.constructor(n.type,n);
                er = a,
                n.target.dispatchEvent(a),
                er = null
            } else
                return t = la(n),
                t !== null && kh(t),
                e.blockedOn = n,
                !1;
            t.shift()
        }
        return !0
    }
    function Fh(e, t, n) {
        gu(e) && n.delete(t)
    }
    function jy() {
        to = !1,
        Mn !== null && gu(Mn) && (Mn = null),
        jn !== null && gu(jn) && (jn = null),
        zn !== null && gu(zn) && (zn = null),
        Hl.forEach(Fh),
        Bl.forEach(Fh)
    }
    function pu(e, t) {
        e.blockedOn === t && (e.blockedOn = null,
        to || (to = !0,
        i.unstable_scheduleCallback(i.unstable_NormalPriority, jy)))
    }
    var yu = null;
    function Wh(e) {
        yu !== e && (yu = e,
        i.unstable_scheduleCallback(i.unstable_NormalPriority, function() {
            yu === e && (yu = null);
            for (var t = 0; t < e.length; t += 3) {
                var n = e[t]
                  , a = e[t + 1]
                  , u = e[t + 2];
                if (typeof a != "function") {
                    if (eo(a || n) === null)
                        continue;
                    break
                }
                var o = la(n);
                o !== null && (e.splice(t, 3),
                t -= 3,
                Pr(o, {
                    pending: !0,
                    data: u,
                    method: n.method,
                    action: a
                }, a, u))
            }
        }))
    }
    function qa(e) {
        function t(C) {
            return pu(C, e)
        }
        Mn !== null && pu(Mn, e),
        jn !== null && pu(jn, e),
        zn !== null && pu(zn, e),
        Hl.forEach(t),
        Bl.forEach(t);
        for (var n = 0; n < Dn.length; n++) {
            var a = Dn[n];
            a.blockedOn === e && (a.blockedOn = null)
        }
        for (; 0 < Dn.length && (n = Dn[0],
        n.blockedOn === null); )
            $h(n),
            n.blockedOn === null && Dn.shift();
        if (n = (e.ownerDocument || e).$$reactFormReplay,
        n != null)
            for (a = 0; a < n.length; a += 3) {
                var u = n[a]
                  , o = n[a + 1]
                  , h = u[lt] || null;
                if (typeof o == "function")
                    h || Wh(n);
                else if (h) {
                    var y = null;
                    if (o && o.hasAttribute("formAction")) {
                        if (u = o,
                        h = o[lt] || null)
                            y = h.formAction;
                        else if (eo(u) !== null)
                            continue
                    } else
                        y = h.action;
                    typeof y == "function" ? n[a + 1] = y : (n.splice(a, 3),
                    a -= 3),
                    Wh(n)
                }
            }
    }
    function Ih() {
        function e(o) {
            o.canIntercept && o.info === "react-transition" && o.intercept({
                handler: function() {
                    return new Promise(function(h) {
                        return u = h
                    }
                    )
                },
                focusReset: "manual",
                scroll: "manual"
            })
        }
        function t() {
            u !== null && (u(),
            u = null),
            a || setTimeout(n, 20)
        }
        function n() {
            if (!a && !navigation.transition) {
                var o = navigation.currentEntry;
                o && o.url != null && navigation.navigate(o.url, {
                    state: o.getState(),
                    info: "react-transition",
                    history: "replace"
                })
            }
        }
        if (typeof navigation == "object") {
            var a = !1
              , u = null;
            return navigation.addEventListener("navigate", e),
            navigation.addEventListener("navigatesuccess", t),
            navigation.addEventListener("navigateerror", t),
            setTimeout(n, 100),
            function() {
                a = !0,
                navigation.removeEventListener("navigate", e),
                navigation.removeEventListener("navigatesuccess", t),
                navigation.removeEventListener("navigateerror", t),
                u !== null && (u(),
                u = null)
            }
        }
    }
    function no(e) {
        this._internalRoot = e
    }
    vu.prototype.render = no.prototype.render = function(e) {
        var t = this._internalRoot;
        if (t === null)
            throw Error(s(409));
        var n = t.current
          , a = xt();
        Qh(n, a, e, t, null, null)
    }
    ,
    vu.prototype.unmount = no.prototype.unmount = function() {
        var e = this._internalRoot;
        if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            Qh(e.current, 2, null, e, null, null),
            Ii(),
            t[na] = null
        }
    }
    ;
    function vu(e) {
        this._internalRoot = e
    }
    vu.prototype.unstable_scheduleHydration = function(e) {
        if (e) {
            var t = rc();
            e = {
                blockedOn: null,
                target: e,
                priority: t
            };
            for (var n = 0; n < Dn.length && t !== 0 && t < Dn[n].priority; n++)
                ;
            Dn.splice(n, 0, e),
            n === 0 && $h(e)
        }
    }
    ;
    var Ph = l.version;
    if (Ph !== "19.2.4")
        throw Error(s(527, Ph, "19.2.4"));
    X.findDOMNode = function(e) {
        var t = e._reactInternals;
        if (t === void 0)
            throw typeof e.render == "function" ? Error(s(188)) : (e = Object.keys(e).join(","),
            Error(s(268, e)));
        return e = p(t),
        e = e !== null ? b(e) : null,
        e = e === null ? null : e.stateNode,
        e
    }
    ;
    var zy = {
        bundleType: 0,
        version: "19.2.4",
        rendererPackageName: "react-dom",
        currentDispatcherRef: D,
        reconcilerVersion: "19.2.4"
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
        var bu = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!bu.isDisabled && bu.supportsFiber)
            try {
                Ja = bu.inject(zy),
                dt = bu
            } catch {}
    }
    return Xl.createRoot = function(e, t) {
        if (!c(e))
            throw Error(s(299));
        var n = !1
          , a = ""
          , u = ud
          , o = rd
          , h = sd;
        return t != null && (t.unstable_strictMode === !0 && (n = !0),
        t.identifierPrefix !== void 0 && (a = t.identifierPrefix),
        t.onUncaughtError !== void 0 && (u = t.onUncaughtError),
        t.onCaughtError !== void 0 && (o = t.onCaughtError),
        t.onRecoverableError !== void 0 && (h = t.onRecoverableError)),
        t = Yh(e, 1, !1, null, null, n, a, null, u, o, h, Ih),
        e[na] = t.current,
        Hs(e),
        new no(t)
    }
    ,
    Xl.hydrateRoot = function(e, t, n) {
        if (!c(e))
            throw Error(s(299));
        var a = !1
          , u = ""
          , o = ud
          , h = rd
          , y = sd
          , C = null;
        return n != null && (n.unstable_strictMode === !0 && (a = !0),
        n.identifierPrefix !== void 0 && (u = n.identifierPrefix),
        n.onUncaughtError !== void 0 && (o = n.onUncaughtError),
        n.onCaughtError !== void 0 && (h = n.onCaughtError),
        n.onRecoverableError !== void 0 && (y = n.onRecoverableError),
        n.formState !== void 0 && (C = n.formState)),
        t = Yh(e, 1, !0, t, n ?? null, a, u, C, o, h, y, Ih),
        t.context = Vh(null),
        n = t.current,
        a = xt(),
        a = Zu(a),
        u = xn(a),
        u.callback = null,
        Sn(n, u, a),
        n = a,
        t.current.lanes = n,
        Fa(t, n),
        qt(t),
        e[na] = t.current,
        Hs(e),
        new vu(t)
    }
    ,
    Xl.version = "19.2.4",
    Xl
}
var lg;
function Xb() {
    if (lg)
        return wo.exports;
    lg = 1;
    function i() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i)
            } catch (l) {
                console.error(l)
            }
    }
    return i(),
    wo.exports = Qb(),
    wo.exports
}
var kb = Xb();
var ig = "popstate";
function ug(i) {
    return typeof i == "object" && i != null && "pathname"in i && "search"in i && "hash"in i && "state"in i && "key"in i
}
function Zb(i={}) {
    function l(s, c) {
        let f = c.state?.masked
          , {pathname: d, search: m, hash: g} = f || s.location;
        return Do("", {
            pathname: d,
            search: m,
            hash: g
        }, c.state && c.state.usr || null, c.state && c.state.key || "default", f ? {
            pathname: s.location.pathname,
            search: s.location.search,
            hash: s.location.hash
        } : void 0)
    }
    function r(s, c) {
        return typeof c == "string" ? c : Il(c)
    }
    return Jb(l, r, null, i)
}
function ke(i, l) {
    if (i === !1 || i === null || typeof i > "u")
        throw new Error(l)
}
function Qt(i, l) {
    if (!i) {
        typeof console < "u" && console.warn(l);
        try {
            throw new Error(l)
        } catch {}
    }
}
function Kb() {
    return Math.random().toString(36).substring(2, 10)
}
function rg(i, l) {
    return {
        usr: i.state,
        key: i.key,
        idx: l,
        masked: i.unstable_mask ? {
            pathname: i.pathname,
            search: i.search,
            hash: i.hash
        } : void 0
    }
}
function Do(i, l, r=null, s, c) {
    return {
        pathname: typeof i == "string" ? i : i.pathname,
        search: "",
        hash: "",
        ...typeof l == "string" ? Pl(l) : l,
        state: r,
        key: l && l.key || s || Kb(),
        unstable_mask: c
    }
}
function Il({pathname: i="/", search: l="", hash: r=""}) {
    return l && l !== "?" && (i += l.charAt(0) === "?" ? l : "?" + l),
    r && r !== "#" && (i += r.charAt(0) === "#" ? r : "#" + r),
    i
}
function Pl(i) {
    let l = {};
    if (i) {
        let r = i.indexOf("#");
        r >= 0 && (l.hash = i.substring(r),
        i = i.substring(0, r));
        let s = i.indexOf("?");
        s >= 0 && (l.search = i.substring(s),
        i = i.substring(0, s)),
        i && (l.pathname = i)
    }
    return l
}
function Jb(i, l, r, s={}) {
    let {window: c=document.defaultView, v5Compat: f=!1} = s
      , d = c.history
      , m = "POP"
      , g = null
      , p = b();
    p == null && (p = 0,
    d.replaceState({
        ...d.state,
        idx: p
    }, ""));
    function b() {
        return (d.state || {
            idx: null
        }).idx
    }
    function v() {
        m = "POP";
        let _ = b()
          , j = _ == null ? null : _ - p;
        p = _,
        g && g({
            action: m,
            location: A.location,
            delta: j
        })
    }
    function S(_, j) {
        m = "PUSH";
        let G = ug(_) ? _ : Do(A.location, _, j);
        p = b() + 1;
        let V = rg(G, p)
          , J = A.createHref(G.unstable_mask || G);
        try {
            d.pushState(V, "", J)
        } catch (W) {
            if (W instanceof DOMException && W.name === "DataCloneError")
                throw W;
            c.location.assign(J)
        }
        f && g && g({
            action: m,
            location: A.location,
            delta: 1
        })
    }
    function x(_, j) {
        m = "REPLACE";
        let G = ug(_) ? _ : Do(A.location, _, j);
        p = b();
        let V = rg(G, p)
          , J = A.createHref(G.unstable_mask || G);
        d.replaceState(V, "", J),
        f && g && g({
            action: m,
            location: A.location,
            delta: 0
        })
    }
    function E(_) {
        return $b(_)
    }
    let A = {
        get action() {
            return m
        },
        get location() {
            return i(c, d)
        },
        listen(_) {
            if (g)
                throw new Error("A history only accepts one active listener");
            return c.addEventListener(ig, v),
            g = _,
            () => {
                c.removeEventListener(ig, v),
                g = null
            }
        },
        createHref(_) {
            return l(c, _)
        },
        createURL: E,
        encodeLocation(_) {
            let j = E(_);
            return {
                pathname: j.pathname,
                search: j.search,
                hash: j.hash
            }
        },
        push: S,
        replace: x,
        go(_) {
            return d.go(_)
        }
    };
    return A
}
function $b(i, l=!1) {
    let r = "http://localhost";
    typeof window < "u" && (r = window.location.origin !== "null" ? window.location.origin : window.location.href),
    ke(r, "No window.location.(origin|href) available to create URL");
    let s = typeof i == "string" ? i : Il(i);
    return s = s.replace(/ $/, "%20"),
    !l && s.startsWith("//") && (s = r + s),
    new URL(s,r)
}
function Xg(i, l, r="/") {
    return Fb(i, l, r, !1)
}
function Fb(i, l, r, s) {
    let c = typeof l == "string" ? Pl(l) : l
      , f = on(c.pathname || "/", r);
    if (f == null)
        return null;
    let d = kg(i);
    Wb(d);
    let m = null;
    for (let g = 0; m == null && g < d.length; ++g) {
        let p = s1(f);
        m = u1(d[g], p, s)
    }
    return m
}
function kg(i, l=[], r=[], s="", c=!1) {
    let f = (d, m, g=c, p) => {
        let b = {
            relativePath: p === void 0 ? d.path || "" : p,
            caseSensitive: d.caseSensitive === !0,
            childrenIndex: m,
            route: d
        };
        if (b.relativePath.startsWith("/")) {
            if (!b.relativePath.startsWith(s) && g)
                return;
            ke(b.relativePath.startsWith(s), `Absolute route path "${b.relativePath}" nested under path "${s}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),
            b.relativePath = b.relativePath.slice(s.length)
        }
        let v = Vt([s, b.relativePath])
          , S = r.concat(b);
        d.children && d.children.length > 0 && (ke(d.index !== !0, `Index routes must not have child routes. Please remove all child routes from route path "${v}".`),
        kg(d.children, l, S, v, g)),
        !(d.path == null && !d.index) && l.push({
            path: v,
            score: l1(v, d.index),
            routesMeta: S
        })
    }
    ;
    return i.forEach( (d, m) => {
        if (d.path === "" || !d.path?.includes("?"))
            f(d, m);
        else
            for (let g of Zg(d.path))
                f(d, m, !0, g)
    }
    ),
    l
}
function Zg(i) {
    let l = i.split("/");
    if (l.length === 0)
        return [];
    let[r,...s] = l
      , c = r.endsWith("?")
      , f = r.replace(/\?$/, "");
    if (s.length === 0)
        return c ? [f, ""] : [f];
    let d = Zg(s.join("/"))
      , m = [];
    return m.push(...d.map(g => g === "" ? f : [f, g].join("/"))),
    c && m.push(...d),
    m.map(g => i.startsWith("/") && g === "" ? "/" : g)
}
function Wb(i) {
    i.sort( (l, r) => l.score !== r.score ? r.score - l.score : i1(l.routesMeta.map(s => s.childrenIndex), r.routesMeta.map(s => s.childrenIndex)))
}
var Ib = /^:[\w-]+$/
  , Pb = 3
  , e1 = 2
  , t1 = 1
  , n1 = 10
  , a1 = -2
  , sg = i => i === "*";
function l1(i, l) {
    let r = i.split("/")
      , s = r.length;
    return r.some(sg) && (s += a1),
    l && (s += e1),
    r.filter(c => !sg(c)).reduce( (c, f) => c + (Ib.test(f) ? Pb : f === "" ? t1 : n1), s)
}
function i1(i, l) {
    return i.length === l.length && i.slice(0, -1).every( (s, c) => s === l[c]) ? i[i.length - 1] - l[l.length - 1] : 0
}
function u1(i, l, r=!1) {
    let {routesMeta: s} = i
      , c = {}
      , f = "/"
      , d = [];
    for (let m = 0; m < s.length; ++m) {
        let g = s[m]
          , p = m === s.length - 1
          , b = f === "/" ? l : l.slice(f.length) || "/"
          , v = ju({
            path: g.relativePath,
            caseSensitive: g.caseSensitive,
            end: p
        }, b)
          , S = g.route;
        if (!v && p && r && !s[s.length - 1].route.index && (v = ju({
            path: g.relativePath,
            caseSensitive: g.caseSensitive,
            end: !1
        }, b)),
        !v)
            return null;
        Object.assign(c, v.params),
        d.push({
            params: c,
            pathname: Vt([f, v.pathname]),
            pathnameBase: d1(Vt([f, v.pathnameBase])),
            route: S
        }),
        v.pathnameBase !== "/" && (f = Vt([f, v.pathnameBase]))
    }
    return d
}
function ju(i, l) {
    typeof i == "string" && (i = {
        path: i,
        caseSensitive: !1,
        end: !0
    });
    let[r,s] = r1(i.path, i.caseSensitive, i.end)
      , c = l.match(r);
    if (!c)
        return null;
    let f = c[0]
      , d = f.replace(/(.)\/+$/, "$1")
      , m = c.slice(1);
    return {
        params: s.reduce( (p, {paramName: b, isOptional: v}, S) => {
            if (b === "*") {
                let E = m[S] || "";
                d = f.slice(0, f.length - E.length).replace(/(.)\/+$/, "$1")
            }
            const x = m[S];
            return v && !x ? p[b] = void 0 : p[b] = (x || "").replace(/%2F/g, "/"),
            p
        }
        , {}),
        pathname: f,
        pathnameBase: d,
        pattern: i
    }
}
function r1(i, l=!1, r=!0) {
    Qt(i === "*" || !i.endsWith("*") || i.endsWith("/*"), `Route path "${i}" will be treated as if it were "${i.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${i.replace(/\*$/, "/*")}".`);
    let s = []
      , c = "^" + i.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (d, m, g, p, b) => {
        if (s.push({
            paramName: m,
            isOptional: g != null
        }),
        g) {
            let v = b.charAt(p + d.length);
            return v && v !== "/" ? "/([^\\/]*)" : "(?:/([^\\/]*))?"
        }
        return "/([^\\/]+)"
    }
    ).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
    return i.endsWith("*") ? (s.push({
        paramName: "*"
    }),
    c += i === "*" || i === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : r ? c += "\\/*$" : i !== "" && i !== "/" && (c += "(?:(?=\\/|$))"),
    [new RegExp(c,l ? void 0 : "i"), s]
}
function s1(i) {
    try {
        return i.split("/").map(l => decodeURIComponent(l).replace(/\//g, "%2F")).join("/")
    } catch (l) {
        return Qt(!1, `The URL path "${i}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${l}).`),
        i
    }
}
function on(i, l) {
    if (l === "/")
        return i;
    if (!i.toLowerCase().startsWith(l.toLowerCase()))
        return null;
    let r = l.endsWith("/") ? l.length - 1 : l.length
      , s = i.charAt(r);
    return s && s !== "/" ? null : i.slice(r) || "/"
}
var o1 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
function c1(i, l="/") {
    let {pathname: r, search: s="", hash: c=""} = typeof i == "string" ? Pl(i) : i, f;
    return r ? (r = r.replace(/\/\/+/g, "/"),
    r.startsWith("/") ? f = og(r.substring(1), "/") : f = og(r, l)) : f = l,
    {
        pathname: f,
        search: h1(s),
        hash: m1(c)
    }
}
function og(i, l) {
    let r = l.replace(/\/+$/, "").split("/");
    return i.split("/").forEach(c => {
        c === ".." ? r.length > 1 && r.pop() : c !== "." && r.push(c)
    }
    ),
    r.length > 1 ? r.join("/") : "/"
}
function Oo(i, l, r, s) {
    return `Cannot include a '${i}' character in a manually specified \`to.${l}\` field [${JSON.stringify(s)}].  Please separate it out to the \`to.${r}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`
}
function f1(i) {
    return i.filter( (l, r) => r === 0 || l.route.path && l.route.path.length > 0)
}
function Kg(i) {
    let l = f1(i);
    return l.map( (r, s) => s === l.length - 1 ? r.pathname : r.pathnameBase)
}
function Zo(i, l, r, s=!1) {
    let c;
    typeof i == "string" ? c = Pl(i) : (c = {
        ...i
    },
    ke(!c.pathname || !c.pathname.includes("?"), Oo("?", "pathname", "search", c)),
    ke(!c.pathname || !c.pathname.includes("#"), Oo("#", "pathname", "hash", c)),
    ke(!c.search || !c.search.includes("#"), Oo("#", "search", "hash", c)));
    let f = i === "" || c.pathname === "", d = f ? "/" : c.pathname, m;
    if (d == null)
        m = r;
    else {
        let v = l.length - 1;
        if (!s && d.startsWith("..")) {
            let S = d.split("/");
            for (; S[0] === ".."; )
                S.shift(),
                v -= 1;
            c.pathname = S.join("/")
        }
        m = v >= 0 ? l[v] : "/"
    }
    let g = c1(c, m)
      , p = d && d !== "/" && d.endsWith("/")
      , b = (f || d === ".") && r.endsWith("/");
    return !g.pathname.endsWith("/") && (p || b) && (g.pathname += "/"),
    g
}
var Vt = i => i.join("/").replace(/\/\/+/g, "/")
  , d1 = i => i.replace(/\/+$/, "").replace(/^\/*/, "/")
  , h1 = i => !i || i === "?" ? "" : i.startsWith("?") ? i : "?" + i
  , m1 = i => !i || i === "#" ? "" : i.startsWith("#") ? i : "#" + i
  , g1 = class {
    constructor(i, l, r, s=!1) {
        this.status = i,
        this.statusText = l || "",
        this.internal = s,
        r instanceof Error ? (this.data = r.toString(),
        this.error = r) : this.data = r
    }
}
;
function p1(i) {
    return i != null && typeof i.status == "number" && typeof i.statusText == "string" && typeof i.internal == "boolean" && "data"in i
}
function y1(i) {
    return i.map(l => l.route.path).filter(Boolean).join("/").replace(/\/\/*/g, "/") || "/"
}
var Jg = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
function $g(i, l) {
    let r = i;
    if (typeof r != "string" || !o1.test(r))
        return {
            absoluteURL: void 0,
            isExternal: !1,
            to: r
        };
    let s = r
      , c = !1;
    if (Jg)
        try {
            let f = new URL(window.location.href)
              , d = r.startsWith("//") ? new URL(f.protocol + r) : new URL(r)
              , m = on(d.pathname, l);
            d.origin === f.origin && m != null ? r = m + d.search + d.hash : c = !0
        } catch {
            Qt(!1, `<Link to="${r}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)
        }
    return {
        absoluteURL: s,
        isExternal: c,
        to: r
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var Fg = ["POST", "PUT", "PATCH", "DELETE"];
new Set(Fg);
var v1 = ["GET", ...Fg];
new Set(v1);
var Za = U.createContext(null);
Za.displayName = "DataRouter";
var Uu = U.createContext(null);
Uu.displayName = "DataRouterState";
var b1 = U.createContext(!1)
  , Wg = U.createContext({
    isTransitioning: !1
});
Wg.displayName = "ViewTransition";
var x1 = U.createContext(new Map);
x1.displayName = "Fetchers";
var S1 = U.createContext(null);
S1.displayName = "Await";
var Lt = U.createContext(null);
Lt.displayName = "Navigation";
var Hu = U.createContext(null);
Hu.displayName = "Location";
var cn = U.createContext({
    outlet: null,
    matches: [],
    isDataRoute: !1
});
cn.displayName = "Route";
var Ko = U.createContext(null);
Ko.displayName = "RouteError";
var Ig = "REACT_ROUTER_ERROR"
  , E1 = "REDIRECT"
  , w1 = "ROUTE_ERROR_RESPONSE";
function _1(i) {
    if (i.startsWith(`${Ig}:${E1}:{`))
        try {
            let l = JSON.parse(i.slice(28));
            if (typeof l == "object" && l && typeof l.status == "number" && typeof l.statusText == "string" && typeof l.location == "string" && typeof l.reloadDocument == "boolean" && typeof l.replace == "boolean")
                return l
        } catch {}
}
function C1(i) {
    if (i.startsWith(`${Ig}:${w1}:{`))
        try {
            let l = JSON.parse(i.slice(40));
            if (typeof l == "object" && l && typeof l.status == "number" && typeof l.statusText == "string")
                return new g1(l.status,l.statusText,l.data)
        } catch {}
}
function T1(i, {relative: l}={}) {
    ke(ei(), "useHref() may be used only in the context of a <Router> component.");
    let {basename: r, navigator: s} = U.useContext(Lt)
      , {hash: c, pathname: f, search: d} = ti(i, {
        relative: l
    })
      , m = f;
    return r !== "/" && (m = f === "/" ? r : Vt([r, f])),
    s.createHref({
        pathname: m,
        search: d,
        hash: c
    })
}
function ei() {
    return U.useContext(Hu) != null
}
function fn() {
    return ke(ei(), "useLocation() may be used only in the context of a <Router> component."),
    U.useContext(Hu).location
}
var Pg = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function ep(i) {
    U.useContext(Lt).static || U.useLayoutEffect(i)
}
function tp() {
    let {isDataRoute: i} = U.useContext(cn);
    return i ? q1() : O1()
}
function O1() {
    ke(ei(), "useNavigate() may be used only in the context of a <Router> component.");
    let i = U.useContext(Za)
      , {basename: l, navigator: r} = U.useContext(Lt)
      , {matches: s} = U.useContext(cn)
      , {pathname: c} = fn()
      , f = JSON.stringify(Kg(s))
      , d = U.useRef(!1);
    return ep( () => {
        d.current = !0
    }
    ),
    U.useCallback( (g, p={}) => {
        if (Qt(d.current, Pg),
        !d.current)
            return;
        if (typeof g == "number") {
            r.go(g);
            return
        }
        let b = Zo(g, JSON.parse(f), c, p.relative === "path");
        i == null && l !== "/" && (b.pathname = b.pathname === "/" ? l : Vt([l, b.pathname])),
        (p.replace ? r.replace : r.push)(b, p.state, p)
    }
    , [l, r, f, c, i])
}
U.createContext(null);
function ti(i, {relative: l}={}) {
    let {matches: r} = U.useContext(cn)
      , {pathname: s} = fn()
      , c = JSON.stringify(Kg(r));
    return U.useMemo( () => Zo(i, JSON.parse(c), s, l === "path"), [i, c, s, l])
}
function A1(i, l) {
    return np(i)
}
function np(i, l, r) {
    ke(ei(), "useRoutes() may be used only in the context of a <Router> component.");
    let {navigator: s} = U.useContext(Lt)
      , {matches: c} = U.useContext(cn)
      , f = c[c.length - 1]
      , d = f ? f.params : {}
      , m = f ? f.pathname : "/"
      , g = f ? f.pathnameBase : "/"
      , p = f && f.route;
    {
        let _ = p && p.path || "";
        lp(m, !p || _.endsWith("*") || _.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${m}" (under <Route path="${_}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${_}"> to <Route path="${_ === "/" ? "*" : `${_}/*`}">.`)
    }
    let b = fn(), v;
    v = b;
    let S = v.pathname || "/"
      , x = S;
    if (g !== "/") {
        let _ = g.replace(/^\//, "").split("/");
        x = "/" + S.replace(/^\//, "").split("/").slice(_.length).join("/")
    }
    let E = Xg(i, {
        pathname: x
    });
    return Qt(p || E != null, `No routes matched location "${v.pathname}${v.search}${v.hash}" `),
    Qt(E == null || E[E.length - 1].route.element !== void 0 || E[E.length - 1].route.Component !== void 0 || E[E.length - 1].route.lazy !== void 0, `Matched leaf route at location "${v.pathname}${v.search}${v.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`),
    j1(E && E.map(_ => Object.assign({}, _, {
        params: Object.assign({}, d, _.params),
        pathname: Vt([g, s.encodeLocation ? s.encodeLocation(_.pathname.replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : _.pathname]),
        pathnameBase: _.pathnameBase === "/" ? g : Vt([g, s.encodeLocation ? s.encodeLocation(_.pathnameBase.replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : _.pathnameBase])
    })), c, r)
}
function R1() {
    let i = B1()
      , l = p1(i) ? `${i.status} ${i.statusText}` : i instanceof Error ? i.message : JSON.stringify(i)
      , r = i instanceof Error ? i.stack : null
      , s = "rgba(200,200,200, 0.5)"
      , c = {
        padding: "0.5rem",
        backgroundColor: s
    }
      , f = {
        padding: "2px 4px",
        backgroundColor: s
    }
      , d = null;
    return console.error("Error handled by React Router default ErrorBoundary:", i),
    d = U.createElement(U.Fragment, null, U.createElement("p", null, "💿 Hey developer 👋"), U.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", U.createElement("code", {
        style: f
    }, "ErrorBoundary"), " or", " ", U.createElement("code", {
        style: f
    }, "errorElement"), " prop on your route.")),
    U.createElement(U.Fragment, null, U.createElement("h2", null, "Unexpected Application Error!"), U.createElement("h3", {
        style: {
            fontStyle: "italic"
        }
    }, l), r ? U.createElement("pre", {
        style: c
    }, r) : null, d)
}
var N1 = U.createElement(R1, null)
  , ap = class extends U.Component {
    constructor(i) {
        super(i),
        this.state = {
            location: i.location,
            revalidation: i.revalidation,
            error: i.error
        }
    }
    static getDerivedStateFromError(i) {
        return {
            error: i
        }
    }
    static getDerivedStateFromProps(i, l) {
        return l.location !== i.location || l.revalidation !== "idle" && i.revalidation === "idle" ? {
            error: i.error,
            location: i.location,
            revalidation: i.revalidation
        } : {
            error: i.error !== void 0 ? i.error : l.error,
            location: l.location,
            revalidation: i.revalidation || l.revalidation
        }
    }
    componentDidCatch(i, l) {
        this.props.onError ? this.props.onError(i, l) : console.error("React Router caught the following error during render", i)
    }
    render() {
        let i = this.state.error;
        if (this.context && typeof i == "object" && i && "digest"in i && typeof i.digest == "string") {
            const r = C1(i.digest);
            r && (i = r)
        }
        let l = i !== void 0 ? U.createElement(cn.Provider, {
            value: this.props.routeContext
        }, U.createElement(Ko.Provider, {
            value: i,
            children: this.props.component
        })) : this.props.children;
        return this.context ? U.createElement(L1, {
            error: i
        }, l) : l
    }
}
;
ap.contextType = b1;
var Ao = new WeakMap;
function L1({children: i, error: l}) {
    let {basename: r} = U.useContext(Lt);
    if (typeof l == "object" && l && "digest"in l && typeof l.digest == "string") {
        let s = _1(l.digest);
        if (s) {
            let c = Ao.get(l);
            if (c)
                throw c;
            let f = $g(s.location, r);
            if (Jg && !Ao.get(l))
                if (f.isExternal || s.reloadDocument)
                    window.location.href = f.absoluteURL || f.to;
                else {
                    const d = Promise.resolve().then( () => window.__reactRouterDataRouter.navigate(f.to, {
                        replace: s.replace
                    }));
                    throw Ao.set(l, d),
                    d
                }
            return U.createElement("meta", {
                httpEquiv: "refresh",
                content: `0;url=${f.absoluteURL || f.to}`
            })
        }
    }
    return i
}
function M1({routeContext: i, match: l, children: r}) {
    let s = U.useContext(Za);
    return s && s.static && s.staticContext && (l.route.errorElement || l.route.ErrorBoundary) && (s.staticContext._deepestRenderedBoundaryId = l.route.id),
    U.createElement(cn.Provider, {
        value: i
    }, r)
}
function j1(i, l=[], r) {
    let s = r?.state;
    if (i == null) {
        if (!s)
            return null;
        if (s.errors)
            i = s.matches;
        else if (l.length === 0 && !s.initialized && s.matches.length > 0)
            i = s.matches;
        else
            return null
    }
    let c = i
      , f = s?.errors;
    if (f != null) {
        let b = c.findIndex(v => v.route.id && f?.[v.route.id] !== void 0);
        ke(b >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(f).join(",")}`),
        c = c.slice(0, Math.min(c.length, b + 1))
    }
    let d = !1
      , m = -1;
    if (r && s) {
        d = s.renderFallback;
        for (let b = 0; b < c.length; b++) {
            let v = c[b];
            if ((v.route.HydrateFallback || v.route.hydrateFallbackElement) && (m = b),
            v.route.id) {
                let {loaderData: S, errors: x} = s
                  , E = v.route.loader && !S.hasOwnProperty(v.route.id) && (!x || x[v.route.id] === void 0);
                if (v.route.lazy || E) {
                    r.isStatic && (d = !0),
                    m >= 0 ? c = c.slice(0, m + 1) : c = [c[0]];
                    break
                }
            }
        }
    }
    let g = r?.onError
      , p = s && g ? (b, v) => {
        g(b, {
            location: s.location,
            params: s.matches?.[0]?.params ?? {},
            unstable_pattern: y1(s.matches),
            errorInfo: v
        })
    }
    : void 0;
    return c.reduceRight( (b, v, S) => {
        let x, E = !1, A = null, _ = null;
        s && (x = f && v.route.id ? f[v.route.id] : void 0,
        A = v.route.errorElement || N1,
        d && (m < 0 && S === 0 ? (lp("route-fallback", !1, "No `HydrateFallback` element provided to render during initial hydration"),
        E = !0,
        _ = null) : m === S && (E = !0,
        _ = v.route.hydrateFallbackElement || null)));
        let j = l.concat(c.slice(0, S + 1))
          , G = () => {
            let V;
            return x ? V = A : E ? V = _ : v.route.Component ? V = U.createElement(v.route.Component, null) : v.route.element ? V = v.route.element : V = b,
            U.createElement(M1, {
                match: v,
                routeContext: {
                    outlet: b,
                    matches: j,
                    isDataRoute: s != null
                },
                children: V
            })
        }
        ;
        return s && (v.route.ErrorBoundary || v.route.errorElement || S === 0) ? U.createElement(ap, {
            location: s.location,
            revalidation: s.revalidation,
            component: A,
            error: x,
            children: G(),
            routeContext: {
                outlet: null,
                matches: j,
                isDataRoute: !0
            },
            onError: p
        }) : G()
    }
    , null)
}
function Jo(i) {
    return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}
function z1(i) {
    let l = U.useContext(Za);
    return ke(l, Jo(i)),
    l
}
function D1(i) {
    let l = U.useContext(Uu);
    return ke(l, Jo(i)),
    l
}
function U1(i) {
    let l = U.useContext(cn);
    return ke(l, Jo(i)),
    l
}
function $o(i) {
    let l = U1(i)
      , r = l.matches[l.matches.length - 1];
    return ke(r.route.id, `${i} can only be used on routes that contain a unique "id"`),
    r.route.id
}
function H1() {
    return $o("useRouteId")
}
function B1() {
    let i = U.useContext(Ko)
      , l = D1("useRouteError")
      , r = $o("useRouteError");
    return i !== void 0 ? i : l.errors?.[r]
}
function q1() {
    let {router: i} = z1("useNavigate")
      , l = $o("useNavigate")
      , r = U.useRef(!1);
    return ep( () => {
        r.current = !0
    }
    ),
    U.useCallback(async (c, f={}) => {
        Qt(r.current, Pg),
        r.current && (typeof c == "number" ? await i.navigate(c) : await i.navigate(c, {
            fromRouteId: l,
            ...f
        }))
    }
    , [i, l])
}
var cg = {};
function lp(i, l, r) {
    !l && !cg[i] && (cg[i] = !0,
    Qt(!1, r))
}
U.memo(G1);
function G1({routes: i, future: l, state: r, isStatic: s, onError: c}) {
    return np(i, void 0, {
        state: r,
        isStatic: s,
        onError: c
    })
}
function Y1({basename: i="/", children: l=null, location: r, navigationType: s="POP", navigator: c, static: f=!1, unstable_useTransitions: d}) {
    ke(!ei(), "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");
    let m = i.replace(/^\/*/, "/")
      , g = U.useMemo( () => ({
        basename: m,
        navigator: c,
        static: f,
        unstable_useTransitions: d,
        future: {}
    }), [m, c, f, d]);
    typeof r == "string" && (r = Pl(r));
    let {pathname: p="/", search: b="", hash: v="", state: S=null, key: x="default", unstable_mask: E} = r
      , A = U.useMemo( () => {
        let _ = on(p, m);
        return _ == null ? null : {
            location: {
                pathname: _,
                search: b,
                hash: v,
                state: S,
                key: x,
                unstable_mask: E
            },
            navigationType: s
        }
    }
    , [m, p, b, v, S, x, s, E]);
    return Qt(A != null, `<Router basename="${m}"> is not able to match the URL "${p}${b}${v}" because it does not start with the basename, so the <Router> won't render anything.`),
    A == null ? null : U.createElement(Lt.Provider, {
        value: g
    }, U.createElement(Hu.Provider, {
        children: l,
        value: A
    }))
}
var Ou = "get"
  , Au = "application/x-www-form-urlencoded";
function Bu(i) {
    return typeof HTMLElement < "u" && i instanceof HTMLElement
}
function V1(i) {
    return Bu(i) && i.tagName.toLowerCase() === "button"
}
function Q1(i) {
    return Bu(i) && i.tagName.toLowerCase() === "form"
}
function X1(i) {
    return Bu(i) && i.tagName.toLowerCase() === "input"
}
function k1(i) {
    return !!(i.metaKey || i.altKey || i.ctrlKey || i.shiftKey)
}
function Z1(i, l) {
    return i.button === 0 && (!l || l === "_self") && !k1(i)
}
var Tu = null;
function K1() {
    if (Tu === null)
        try {
            new FormData(document.createElement("form"),0),
            Tu = !1
        } catch {
            Tu = !0
        }
    return Tu
}
var J1 = new Set(["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]);
function Ro(i) {
    return i != null && !J1.has(i) ? (Qt(!1, `"${i}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${Au}"`),
    null) : i
}
function $1(i, l) {
    let r, s, c, f, d;
    if (Q1(i)) {
        let m = i.getAttribute("action");
        s = m ? on(m, l) : null,
        r = i.getAttribute("method") || Ou,
        c = Ro(i.getAttribute("enctype")) || Au,
        f = new FormData(i)
    } else if (V1(i) || X1(i) && (i.type === "submit" || i.type === "image")) {
        let m = i.form;
        if (m == null)
            throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');
        let g = i.getAttribute("formaction") || m.getAttribute("action");
        if (s = g ? on(g, l) : null,
        r = i.getAttribute("formmethod") || m.getAttribute("method") || Ou,
        c = Ro(i.getAttribute("formenctype")) || Ro(m.getAttribute("enctype")) || Au,
        f = new FormData(m,i),
        !K1()) {
            let {name: p, type: b, value: v} = i;
            if (b === "image") {
                let S = p ? `${p}.` : "";
                f.append(`${S}x`, "0"),
                f.append(`${S}y`, "0")
            } else
                p && f.append(p, v)
        }
    } else {
        if (Bu(i))
            throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
        r = Ou,
        s = null,
        c = Au,
        d = i
    }
    return f && c === "text/plain" && (d = f,
    f = void 0),
    {
        action: s,
        method: r.toLowerCase(),
        encType: c,
        formData: f,
        body: d
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function Fo(i, l) {
    if (i === !1 || i === null || typeof i > "u")
        throw new Error(l)
}
function F1(i, l, r, s) {
    let c = typeof i == "string" ? new URL(i,typeof window > "u" ? "server://singlefetch/" : window.location.origin) : i;
    return r ? c.pathname.endsWith("/") ? c.pathname = `${c.pathname}_.${s}` : c.pathname = `${c.pathname}.${s}` : c.pathname === "/" ? c.pathname = `_root.${s}` : l && on(c.pathname, l) === "/" ? c.pathname = `${l.replace(/\/$/, "")}/_root.${s}` : c.pathname = `${c.pathname.replace(/\/$/, "")}.${s}`,
    c
}
async function W1(i, l) {
    if (i.id in l)
        return l[i.id];
    try {
        let r = await import(i.module);
        return l[i.id] = r,
        r
    } catch (r) {
        return console.error(`Error loading route module \`${i.module}\`, reloading page...`),
        console.error(r),
        window.__reactRouterContext && window.__reactRouterContext.isSpaMode,
        window.location.reload(),
        new Promise( () => {}
        )
    }
}
function I1(i) {
    return i == null ? !1 : i.href == null ? i.rel === "preload" && typeof i.imageSrcSet == "string" && typeof i.imageSizes == "string" : typeof i.rel == "string" && typeof i.href == "string"
}
async function P1(i, l, r) {
    let s = await Promise.all(i.map(async c => {
        let f = l.routes[c.route.id];
        if (f) {
            let d = await W1(f, r);
            return d.links ? d.links() : []
        }
        return []
    }
    ));
    return ax(s.flat(1).filter(I1).filter(c => c.rel === "stylesheet" || c.rel === "preload").map(c => c.rel === "stylesheet" ? {
        ...c,
        rel: "prefetch",
        as: "style"
    } : {
        ...c,
        rel: "prefetch"
    }))
}
function fg(i, l, r, s, c, f) {
    let d = (g, p) => r[p] ? g.route.id !== r[p].route.id : !0
      , m = (g, p) => r[p].pathname !== g.pathname || r[p].route.path?.endsWith("*") && r[p].params["*"] !== g.params["*"];
    return f === "assets" ? l.filter( (g, p) => d(g, p) || m(g, p)) : f === "data" ? l.filter( (g, p) => {
        let b = s.routes[g.route.id];
        if (!b || !b.hasLoader)
            return !1;
        if (d(g, p) || m(g, p))
            return !0;
        if (g.route.shouldRevalidate) {
            let v = g.route.shouldRevalidate({
                currentUrl: new URL(c.pathname + c.search + c.hash,window.origin),
                currentParams: r[0]?.params || {},
                nextUrl: new URL(i,window.origin),
                nextParams: g.params,
                defaultShouldRevalidate: !0
            });
            if (typeof v == "boolean")
                return v
        }
        return !0
    }
    ) : []
}
function ex(i, l, {includeHydrateFallback: r}={}) {
    return tx(i.map(s => {
        let c = l.routes[s.route.id];
        if (!c)
            return [];
        let f = [c.module];
        return c.clientActionModule && (f = f.concat(c.clientActionModule)),
        c.clientLoaderModule && (f = f.concat(c.clientLoaderModule)),
        r && c.hydrateFallbackModule && (f = f.concat(c.hydrateFallbackModule)),
        c.imports && (f = f.concat(c.imports)),
        f
    }
    ).flat(1))
}
function tx(i) {
    return [...new Set(i)]
}
function nx(i) {
    let l = {}
      , r = Object.keys(i).sort();
    for (let s of r)
        l[s] = i[s];
    return l
}
function ax(i, l) {
    let r = new Set;
    return new Set(l),
    i.reduce( (s, c) => {
        let f = JSON.stringify(nx(c));
        return r.has(f) || (r.add(f),
        s.push({
            key: f,
            link: c
        })),
        s
    }
    , [])
}
function ip() {
    let i = U.useContext(Za);
    return Fo(i, "You must render this element inside a <DataRouterContext.Provider> element"),
    i
}
function lx() {
    let i = U.useContext(Uu);
    return Fo(i, "You must render this element inside a <DataRouterStateContext.Provider> element"),
    i
}
var Wo = U.createContext(void 0);
Wo.displayName = "FrameworkContext";
function up() {
    let i = U.useContext(Wo);
    return Fo(i, "You must render this element inside a <HydratedRouter> element"),
    i
}
function ix(i, l) {
    let r = U.useContext(Wo)
      , [s,c] = U.useState(!1)
      , [f,d] = U.useState(!1)
      , {onFocus: m, onBlur: g, onMouseEnter: p, onMouseLeave: b, onTouchStart: v} = l
      , S = U.useRef(null);
    U.useEffect( () => {
        if (i === "render" && d(!0),
        i === "viewport") {
            let A = j => {
                j.forEach(G => {
                    d(G.isIntersecting)
                }
                )
            }
              , _ = new IntersectionObserver(A,{
                threshold: .5
            });
            return S.current && _.observe(S.current),
            () => {
                _.disconnect()
            }
        }
    }
    , [i]),
    U.useEffect( () => {
        if (s) {
            let A = setTimeout( () => {
                d(!0)
            }
            , 100);
            return () => {
                clearTimeout(A)
            }
        }
    }
    , [s]);
    let x = () => {
        c(!0)
    }
      , E = () => {
        c(!1),
        d(!1)
    }
    ;
    return r ? i !== "intent" ? [f, S, {}] : [f, S, {
        onFocus: kl(m, x),
        onBlur: kl(g, E),
        onMouseEnter: kl(p, x),
        onMouseLeave: kl(b, E),
        onTouchStart: kl(v, x)
    }] : [!1, S, {}]
}
function kl(i, l) {
    return r => {
        i && i(r),
        r.defaultPrevented || l(r)
    }
}
function ux({page: i, ...l}) {
    let {router: r} = ip()
      , s = U.useMemo( () => Xg(r.routes, i, r.basename), [r.routes, i, r.basename]);
    return s ? U.createElement(sx, {
        page: i,
        matches: s,
        ...l
    }) : null
}
function rx(i) {
    let {manifest: l, routeModules: r} = up()
      , [s,c] = U.useState([]);
    return U.useEffect( () => {
        let f = !1;
        return P1(i, l, r).then(d => {
            f || c(d)
        }
        ),
        () => {
            f = !0
        }
    }
    , [i, l, r]),
    s
}
function sx({page: i, matches: l, ...r}) {
    let s = fn()
      , {future: c, manifest: f, routeModules: d} = up()
      , {basename: m} = ip()
      , {loaderData: g, matches: p} = lx()
      , b = U.useMemo( () => fg(i, l, p, f, s, "data"), [i, l, p, f, s])
      , v = U.useMemo( () => fg(i, l, p, f, s, "assets"), [i, l, p, f, s])
      , S = U.useMemo( () => {
        if (i === s.pathname + s.search + s.hash)
            return [];
        let A = new Set
          , _ = !1;
        if (l.forEach(G => {
            let V = f.routes[G.route.id];
            !V || !V.hasLoader || (!b.some(J => J.route.id === G.route.id) && G.route.id in g && d[G.route.id]?.shouldRevalidate || V.hasClientLoader ? _ = !0 : A.add(G.route.id))
        }
        ),
        A.size === 0)
            return [];
        let j = F1(i, m, c.unstable_trailingSlashAwareDataRequests, "data");
        return _ && A.size > 0 && j.searchParams.set("_routes", l.filter(G => A.has(G.route.id)).map(G => G.route.id).join(",")),
        [j.pathname + j.search]
    }
    , [m, c.unstable_trailingSlashAwareDataRequests, g, s, f, b, l, i, d])
      , x = U.useMemo( () => ex(v, f), [v, f])
      , E = rx(v);
    return U.createElement(U.Fragment, null, S.map(A => U.createElement("link", {
        key: A,
        rel: "prefetch",
        as: "fetch",
        href: A,
        ...r
    })), x.map(A => U.createElement("link", {
        key: A,
        rel: "modulepreload",
        href: A,
        ...r
    })), E.map( ({key: A, link: _}) => U.createElement("link", {
        key: A,
        nonce: r.nonce,
        ..._,
        crossOrigin: _.crossOrigin ?? r.crossOrigin
    })))
}
function ox(...i) {
    return l => {
        i.forEach(r => {
            typeof r == "function" ? r(l) : r != null && (r.current = l)
        }
        )
    }
}
var cx = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
try {
    cx && (window.__reactRouterVersion = "7.13.1")
} catch {}
function fx({basename: i, children: l, unstable_useTransitions: r, window: s}) {
    let c = U.useRef();
    c.current == null && (c.current = Zb({
        window: s,
        v5Compat: !0
    }));
    let f = c.current
      , [d,m] = U.useState({
        action: f.action,
        location: f.location
    })
      , g = U.useCallback(p => {
        r === !1 ? m(p) : U.startTransition( () => m(p))
    }
    , [r]);
    return U.useLayoutEffect( () => f.listen(g), [f, g]),
    U.createElement(Y1, {
        basename: i,
        children: l,
        location: d.location,
        navigationType: d.action,
        navigator: f,
        unstable_useTransitions: r
    })
}
var rp = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i
  , sp = U.forwardRef(function({onClick: l, discover: r="render", prefetch: s="none", relative: c, reloadDocument: f, replace: d, unstable_mask: m, state: g, target: p, to: b, preventScrollReset: v, viewTransition: S, unstable_defaultShouldRevalidate: x, ...E}, A) {
    let {basename: _, navigator: j, unstable_useTransitions: G} = U.useContext(Lt)
      , V = typeof b == "string" && rp.test(b)
      , J = $g(b, _);
    b = J.to;
    let W = T1(b, {
        relative: c
    })
      , se = fn()
      , I = null;
    if (m) {
        let fe = Zo(m, [], se.unstable_mask ? se.unstable_mask.pathname : "/", !0);
        _ !== "/" && (fe.pathname = fe.pathname === "/" ? _ : Vt([_, fe.pathname])),
        I = j.createHref(fe)
    }
    let[ye,Ce,Q] = ix(s, E)
      , k = gx(b, {
        replace: d,
        unstable_mask: m,
        state: g,
        target: p,
        preventScrollReset: v,
        relative: c,
        viewTransition: S,
        unstable_defaultShouldRevalidate: x,
        unstable_useTransitions: G
    });
    function K(fe) {
        l && l(fe),
        fe.defaultPrevented || k(fe)
    }
    let ne = !(J.isExternal || f)
      , oe = U.createElement("a", {
        ...E,
        ...Q,
        href: (ne ? I : void 0) || J.absoluteURL || W,
        onClick: ne ? K : l,
        ref: ox(A, Ce),
        target: p,
        "data-discover": !V && r === "render" ? "true" : void 0
    });
    return ye && !V ? U.createElement(U.Fragment, null, oe, U.createElement(ux, {
        page: W
    })) : oe
});
sp.displayName = "Link";
var dx = U.forwardRef(function({"aria-current": l="page", caseSensitive: r=!1, className: s="", end: c=!1, style: f, to: d, viewTransition: m, children: g, ...p}, b) {
    let v = ti(d, {
        relative: p.relative
    })
      , S = fn()
      , x = U.useContext(Uu)
      , {navigator: E, basename: A} = U.useContext(Lt)
      , _ = x != null && xx(v) && m === !0
      , j = E.encodeLocation ? E.encodeLocation(v).pathname : v.pathname
      , G = S.pathname
      , V = x && x.navigation && x.navigation.location ? x.navigation.location.pathname : null;
    r || (G = G.toLowerCase(),
    V = V ? V.toLowerCase() : null,
    j = j.toLowerCase()),
    V && A && (V = on(V, A) || V);
    const J = j !== "/" && j.endsWith("/") ? j.length - 1 : j.length;
    let W = G === j || !c && G.startsWith(j) && G.charAt(J) === "/", se = V != null && (V === j || !c && V.startsWith(j) && V.charAt(j.length) === "/"), I = {
        isActive: W,
        isPending: se,
        isTransitioning: _
    }, ye = W ? l : void 0, Ce;
    typeof s == "function" ? Ce = s(I) : Ce = [s, W ? "active" : null, se ? "pending" : null, _ ? "transitioning" : null].filter(Boolean).join(" ");
    let Q = typeof f == "function" ? f(I) : f;
    return U.createElement(sp, {
        ...p,
        "aria-current": ye,
        className: Ce,
        ref: b,
        style: Q,
        to: d,
        viewTransition: m
    }, typeof g == "function" ? g(I) : g)
});
dx.displayName = "NavLink";
var hx = U.forwardRef( ({discover: i="render", fetcherKey: l, navigate: r, reloadDocument: s, replace: c, state: f, method: d=Ou, action: m, onSubmit: g, relative: p, preventScrollReset: b, viewTransition: v, unstable_defaultShouldRevalidate: S, ...x}, E) => {
    let {unstable_useTransitions: A} = U.useContext(Lt)
      , _ = vx()
      , j = bx(m, {
        relative: p
    })
      , G = d.toLowerCase() === "get" ? "get" : "post"
      , V = typeof m == "string" && rp.test(m)
      , J = W => {
        if (g && g(W),
        W.defaultPrevented)
            return;
        W.preventDefault();
        let se = W.nativeEvent.submitter
          , I = se?.getAttribute("formmethod") || d
          , ye = () => _(se || W.currentTarget, {
            fetcherKey: l,
            method: I,
            navigate: r,
            replace: c,
            state: f,
            relative: p,
            preventScrollReset: b,
            viewTransition: v,
            unstable_defaultShouldRevalidate: S
        });
        A && r !== !1 ? U.startTransition( () => ye()) : ye()
    }
    ;
    return U.createElement("form", {
        ref: E,
        method: G,
        action: j,
        onSubmit: s ? g : J,
        ...x,
        "data-discover": !V && i === "render" ? "true" : void 0
    })
}
);
hx.displayName = "Form";
function mx(i) {
    return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}
function op(i) {
    let l = U.useContext(Za);
    return ke(l, mx(i)),
    l
}
function gx(i, {target: l, replace: r, unstable_mask: s, state: c, preventScrollReset: f, relative: d, viewTransition: m, unstable_defaultShouldRevalidate: g, unstable_useTransitions: p}={}) {
    let b = tp()
      , v = fn()
      , S = ti(i, {
        relative: d
    });
    return U.useCallback(x => {
        if (Z1(x, l)) {
            x.preventDefault();
            let E = r !== void 0 ? r : Il(v) === Il(S)
              , A = () => b(i, {
                replace: E,
                unstable_mask: s,
                state: c,
                preventScrollReset: f,
                relative: d,
                viewTransition: m,
                unstable_defaultShouldRevalidate: g
            });
            p ? U.startTransition( () => A()) : A()
        }
    }
    , [v, b, S, r, s, c, l, i, f, d, m, g, p])
}
var px = 0
  , yx = () => `__${String(++px)}__`;
function vx() {
    let {router: i} = op("useSubmit")
      , {basename: l} = U.useContext(Lt)
      , r = H1()
      , s = i.fetch
      , c = i.navigate;
    return U.useCallback(async (f, d={}) => {
        let {action: m, method: g, encType: p, formData: b, body: v} = $1(f, l);
        if (d.navigate === !1) {
            let S = d.fetcherKey || yx();
            await s(S, r, d.action || m, {
                unstable_defaultShouldRevalidate: d.unstable_defaultShouldRevalidate,
                preventScrollReset: d.preventScrollReset,
                formData: b,
                body: v,
                formMethod: d.method || g,
                formEncType: d.encType || p,
                flushSync: d.flushSync
            })
        } else
            await c(d.action || m, {
                unstable_defaultShouldRevalidate: d.unstable_defaultShouldRevalidate,
                preventScrollReset: d.preventScrollReset,
                formData: b,
                body: v,
                formMethod: d.method || g,
                formEncType: d.encType || p,
                replace: d.replace,
                state: d.state,
                fromRouteId: r,
                flushSync: d.flushSync,
                viewTransition: d.viewTransition
            })
    }
    , [s, c, l, r])
}
function bx(i, {relative: l}={}) {
    let {basename: r} = U.useContext(Lt)
      , s = U.useContext(cn);
    ke(s, "useFormAction must be used inside a RouteContext");
    let[c] = s.matches.slice(-1)
      , f = {
        ...ti(i || ".", {
            relative: l
        })
    }
      , d = fn();
    if (i == null) {
        f.search = d.search;
        let m = new URLSearchParams(f.search)
          , g = m.getAll("index");
        if (g.some(b => b === "")) {
            m.delete("index"),
            g.filter(v => v).forEach(v => m.append("index", v));
            let b = m.toString();
            f.search = b ? `?${b}` : ""
        }
    }
    return (!i || i === ".") && c.route.index && (f.search = f.search ? f.search.replace(/^\?/, "?index&") : "?index"),
    r !== "/" && (f.pathname = f.pathname === "/" ? r : Vt([r, f.pathname])),
    Il(f)
}
function xx(i, {relative: l}={}) {
    let r = U.useContext(Wg);
    ke(r != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
    let {basename: s} = op("useViewTransitionState")
      , c = ti(i, {
        relative: l
    });
    if (!r.isTransitioning)
        return !1;
    let f = on(r.currentLocation.pathname, s) || r.currentLocation.pathname
      , d = on(r.nextLocation.pathname, s) || r.nextLocation.pathname;
    return ju(c.pathname, d) != null || ju(c.pathname, f) != null
}
function Sx() {
    const i = fn();
    return w.jsxs("div", {
        className: "relative flex flex-col items-center justify-center h-screen text-center px-4",
        children: [w.jsx("h1", {
            className: "absolute bottom-0 text-9xl md:text-[12rem] font-black text-gray-50 select-none pointer-events-none z-0",
            children: "404"
        }), w.jsxs("div", {
            className: "relative z-10",
            children: [w.jsx("h1", {
                className: "text-xl md:text-2xl font-semibold mt-6",
                children: "This page has not been generated"
            }), w.jsx("p", {
                className: "mt-2 text-base text-gray-400 font-mono",
                children: i.pathname
            }), w.jsx("p", {
                className: "mt-4 text-lg md:text-xl text-gray-500",
                children: "Tell me more about this page, so I can generate it"
            })]
        })]
    })
}
function Ex() {
    const [i,l] = U.useState(!1);
    return U.useEffect( () => {
        const r = () => {
            l(window.scrollY > 50)
        }
        ;
        return window.addEventListener("scroll", r),
        () => window.removeEventListener("scroll", r)
    }
    , []),
    w.jsxs("section", {
        className: "relative h-screen overflow-hidden bg-deep-navy",
        children: [w.jsx("nav", {
            className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${i ? "bg-white shadow-lg" : "bg-transparent"}`,
            children: w.jsxs("div", {
                className: "px-8 py-6 flex items-center justify-between",
                children: [w.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [w.jsx("div", {
                        className: "w-10 h-10 flex items-center justify-center bg-safety-orange rounded-lg",
                        children: w.jsx("i", {
                            className: "ri-box-3-fill text-white text-xl"
                        })
                    }), w.jsx("span", {
                        className: `text-2xl font-bebas tracking-wider ${i ? "text-deep-navy" : "text-white"}`,
                        children: "IRONCLAD"
                    })]
                }), w.jsxs("div", {
                    className: "flex items-center gap-10",
                    children: [w.jsx("a", {
                        href: "#capabilities",
                        className: `text-sm font-inter font-medium transition-colors ${i ? "text-deep-navy hover:text-safety-orange" : "text-white hover:text-safety-orange"}`,
                        children: "Capabilities"
                    }), w.jsx("a", {
                        href: "#trust",
                        className: `text-sm font-inter font-medium transition-colors ${i ? "text-deep-navy hover:text-safety-orange" : "text-white hover:text-safety-orange"}`,
                        children: "Why Us"
                    }), w.jsx("a", {
                        href: "#specs",
                        className: `text-sm font-inter font-medium transition-colors ${i ? "text-deep-navy hover:text-safety-orange" : "text-white hover:text-safety-orange"}`,
                        children: "Specifications"
                    }), w.jsx("a", {
                        href: "#contact",
                        className: `text-sm font-inter font-medium transition-colors ${i ? "text-deep-navy hover:text-safety-orange" : "text-white hover:text-safety-orange"}`,
                        children: "Contact"
                    })]
                })]
            })
        }), w.jsxs("div", {
            className: "absolute inset-0",
            style: {
                transform: "translateZ(0)"
            },
            children: [w.jsx("img", {
               
                alt: "Industrial hardware precision packaging",
                className: "w-full h-full object-cover"
            }), w.jsx("div", {
                className: "absolute inset-0 bg-gradient-radial from-transparent via-deep-navy/30 to-deep-navy/60"
            }), w.jsx("div", {
                className: "absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30"
            })]
        }), w.jsx("div", {
            className: "relative h-full flex items-center justify-end px-20",
            children: w.jsx("div", {
                className: "max-w-2xl text-right",
                style: {
                    transform: "rotate(-2deg)"
                },
                children: w.jsxs("h1", {
                    className: "font-inter font-extralight text-white leading-tight",
                    children: [w.jsx("span", {
                        className: "block text-[120px]",
                        children: "PRECISION"
                    }), w.jsx("div", {
                        className: "flex items-center justify-end gap-6 my-4",
                        children: w.jsx("div", {
                            className: "w-8 h-8 bg-safety-orange rounded-full"
                        })
                    }), w.jsx("span", {
                        className: "block text-[120px]",
                        children: "PACKAGING"
                    }), w.jsx("span", {
                        className: "block text-[120px]",
                        children: "SOLUTIONS"
                    })]
                })
            })
        }), w.jsxs("div", {
            className: "absolute bottom-20 left-20 bg-white rounded-3xl shadow-2xl p-8 max-w-md",
            style: {
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
            },
            children: [w.jsx("div", {
                className: "text-safety-orange text-xs font-inter font-bold uppercase tracking-wider mb-4",
                children: "/INDUSTRIAL GRADE"
            }), w.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
            }), w.jsxs("p", {
                className: "text-gray-600 text-sm font-inter",
                children: ["Trusted by ", w.jsx("strong", {
                    className: "text-deep-navy font-semibold",
                    children: "500+ manufacturers"
                }), " worldwide for precision hardware packaging"]
            })]
        }), w.jsx("a", {
            href: "#contact",
            className: "absolute bottom-20 right-20 group",
            children: w.jsxs("div", {
                className: "flex items-center bg-black rounded-full pr-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer whitespace-nowrap",
                children: [w.jsx("div", {
                    className: "w-14 h-14 bg-safety-orange rounded-full flex items-center justify-center transition-transform duration-300 group-hover:rotate-180",
                    children: w.jsx("i", {
                        className: "ri-box-3-line text-white text-xl"
                    })
                }), w.jsx("span", {
                    className: "ml-6 text-white text-sm font-inter font-bold tracking-wider",
                    children: "REQUEST SAMPLES"
                }), w.jsx("i", {
                    className: "ri-arrow-right-up-line text-white ml-4 text-lg"
                })]
            })
        })]
    })
}

function _x() {
    const [i,l] = U.useState(1);
    return w.jsx("section", {
        id: "capabilities",
        className: "py-32 px-20 bg-white",
        children: w.jsxs("div", {
            className: "max-w-7xl mx-auto",
            children: [w.jsxs("div", {
                className: "mb-20",
                children: [w.jsxs("h2", {
                    className: "text-7xl font-inter font-extralight text-deep-navy leading-tight max-w-2xl",
                    children: ["Our Core ", w.jsx("span", {
                        className: "inline-block",
                        children: "🔩"
                    }), " Capabilities"]
                }), w.jsx("p", {
                    className: "text-lg text-gray-600 font-inter mt-6",
                    children: "Comprehensive solutions for industrial packaging needs"
                })]
            }), w.jsx("div", {
                className: "flex gap-8 items-start",
                children: wx.map( (r, s) => w.jsxs("div", {
                    className: `rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 relative group ${i === r.id ? "flex-[0.4]" : "flex-[0.3]"} ${s === 0 ? "-mt-16" : ""}`,
                    style: {
                        height: "600px"
                    },
                    onMouseEnter: () => l(r.id),
                    children: [w.jsxs("div", {
                        className: "absolute inset-0",
                        children: [w.jsx("img", {
                            src: r.image,
                            alt: r.title,
                            className: "w-full h-full object-cover"
                        }), w.jsx("div", {
                            className: "absolute inset-0 bg-gradient-to-t from-deep-navy/90 via-deep-navy/60 to-transparent"
                        })]
                    }), w.jsxs("div", {
                        className: "relative h-full flex flex-col justify-end p-8",
                        children: [w.jsx("div", {
                            className: "mb-auto pt-8",
                            children: w.jsx("i", {
                                className: `${r.icon} text-white text-5xl`,
                                style: {
                                    strokeWidth: "2px"
                                }
                            })
                        }), w.jsx("div", {
                            className: "w-16 h-1 bg-safety-orange mb-4"
                        }), w.jsx("h3", {
                            className: "text-white text-3xl font-inter font-bold mb-3",
                            children: r.title
                        }), w.jsx("p", {
                            className: `text-white/90 text-base font-inter leading-relaxed transition-all duration-500 ${i === r.id ? "opacity-100 max-h-32" : "opacity-0 max-h-0 overflow-hidden"}`,
                            children: r.description
                        })]
                    })]
                }, r.id))
            })]
        })
    })
}
const No = [{
    number: 500,
    suffix: "+",
    label: "TRUSTED CLIENTS"
}, {
    number: 99.8,
    suffix: "%",
    label: "ACCURACY RATE"
}, {
    number: 2.5,
    suffix: "M+",
    label: "KITS ASSEMBLED"
}, {
    number: 15,
    suffix: "YRS",
    label: "INDUSTRY EXPERIENCE"
}];
function Cx() {
    const [i,l] = U.useState(!1)
      , [r,s] = U.useState(No.map( () => 0))
      , c = U.useRef(null);
    return U.useEffect( () => {
        const f = new IntersectionObserver( ([d]) => {
            d.isIntersecting && !i && l(!0)
        }
        ,{
            threshold: .3
        });
        return c.current && f.observe(c.current),
        () => f.disconnect()
    }
    , [i]),
    U.useEffect( () => {
        if (!i)
            return;
        const f = 2e3
          , d = 60
          , m = f / d;
        No.forEach( (g, p) => {
            let b = 0;
            const v = g.number / d
              , S = setInterval( () => {
                b++,
                s(x => {
                    const E = [...x];
                    return E[p] = Math.min(v * b, g.number),
                    E
                }
                ),
                b >= d && clearInterval(S)
            }
            , m)
        }
        )
    }
    , [i]),
    w.jsxs("section", {
        id: "trust",
        ref: c,
        className: "relative py-40 bg-deep-navy overflow-hidden",
        children: [w.jsx("div", {
            className: "absolute inset-0 opacity-10",
            children: w.jsxs("svg", {
                width: "100%",
                height: "100%",
                xmlns: "http://www.w3.org/2000/svg",
                children: [w.jsx("defs", {
                    children: w.jsx("pattern", {
                        id: "grid",
                        width: "80",
                        height: "80",
                        patternUnits: "userSpaceOnUse",
                        children: w.jsx("path", {
                            d: "M 80 0 L 0 0 0 80",
                            fill: "none",
                            stroke: "white",
                            strokeWidth: "1"
                        })
                    })
                }), w.jsx("rect", {
                    width: "100%",
                    height: "100%",
                    fill: "url(#grid)"
                })]
            })
        }), w.jsx("div", {
            className: "absolute top-20 right-40 w-32 h-32 rounded-full bg-safety-orange opacity-5"
        }), w.jsx("div", {
            className: "absolute bottom-32 left-60 w-20 h-20 rounded-full bg-safety-orange opacity-5"
        }), w.jsx("div", {
            className: "absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-safety-orange opacity-5"
        }), w.jsx("div", {
            className: "relative max-w-7xl mx-auto px-20",
            children: w.jsx("div", {
                className: "grid grid-cols-4 gap-16",
                children: No.map( (f, d) => w.jsxs("div", {
                    className: "text-center",
                    children: [w.jsx("div", {
                        className: "w-10 h-0.5 bg-safety-orange mx-auto mb-6 transition-all duration-1000",
                        style: {
                            width: i ? "40px" : "0px",
                            transitionDelay: `${d * 100}ms`
                        }
                    }), w.jsxs("div", {
                        className: "text-white text-8xl font-inter font-extrabold tracking-tight",
                        children: [f.suffix === "%" ? r[d].toFixed(1) : Math.floor(r[d]), w.jsx("span", {
                            className: "text-safety-orange/60",
                            children: f.suffix
                        })]
                    }), w.jsx("div", {
                        className: "text-gray-400 text-base font-inter font-normal mt-4 tracking-widest",
                        children: f.label
                    })]
                }, d))
            })
        })]
    })
}
const Tx = [{
    icon: "ri-shield-check-line",
    name: "Certification",
    value: "ISO 9001:2015",
    verified: !0
}, {
    icon: "ri-box-3-line",
    name: "Bag Material",
    value: "Premium LDPE/HDPE",
    verified: !0
}, {
    icon: "ri-temp-hot-line",
    name: "Seal Temperature",
    value: "300-400°F Range",
    verified: !1
}, {
    icon: "ri-ruler-line",
    name: "Bag Thickness",
    value: "2-6 mil Custom",
    verified: !1
}, {
    icon: "ri-drop-line",
    name: "Moisture Barrier",
    value: "IP65 Rated",
    verified: !0
}, {
    icon: "ri-time-line",
    name: "Lead Time",
    value: "5-7 Business Days",
    verified: !1
}, {
    icon: "ri-truck-line",
    name: "Shipping",
    value: "Nationwide Coverage",
    verified: !1
}, {
    icon: "ri-customer-service-line",
    name: "Support",
    value: "24/7 Availability",
    verified: !0
}];
function Ox() {
    return w.jsx("section", {
        id: "specs",
        className: "py-32 px-20 bg-arch-gray",
        children: w.jsxs("div", {
            className: "max-w-6xl mx-auto",
            children: [w.jsxs("div", {
                className: "mb-16",
                children: [w.jsx("h2", {
                    className: "text-6xl font-inter font-bold text-deep-navy mb-4",
                    children: "Technical Specifications"
                }), w.jsxs("div", {
                    className: "inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-lg",
                    children: [w.jsx("i", {
                        className: "ri-checkbox-circle-fill text-sm"
                    }), w.jsx("span", {
                        className: "text-xs font-inter font-semibold tracking-wide",
                        children: "ISO 9001:2015 CERTIFIED"
                    })]
                })]
            }), w.jsx("div", {
                className: "grid grid-cols-2 gap-4",
                children: Tx.map( (i, l) => w.jsx("div", {
                    className: `rounded-2xl p-8 border border-gray-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${l % 2 === 0 ? "bg-white" : "bg-gray-50"}`,
                    children: w.jsxs("div", {
                        className: "flex items-center justify-between",
                        children: [w.jsxs("div", {
                            className: "flex items-center gap-4 flex-[0.4]",
                            children: [w.jsx("div", {
                                className: "w-6 h-6 flex items-center justify-center",
                                children: w.jsx("i", {
                                    className: `${i.icon} text-safety-orange text-2xl`
                                })
                            }), w.jsx("span", {
                                className: "text-base font-inter font-medium text-deep-navy",
                                children: i.name
                            })]
                        }), w.jsxs("div", {
                            className: "flex items-center gap-3 flex-[0.6] justify-end",
                            children: [w.jsx("span", {
                                className: "text-lg font-inter font-bold text-deep-navy",
                                children: i.value
                            }), i.verified && w.jsx("div", {
                                className: "bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-inter font-semibold",
                                children: "VERIFIED"
                            })]
                        })]
                    })
                }, l))
            }), w.jsx("div", {
                className: "mt-12 p-6 bg-white rounded-2xl border border-gray-200",
                children: w.jsxs("div", {
                    className: "flex items-start gap-4",
                    children: [w.jsx("div", {
                        className: "w-10 h-10 flex items-center justify-center bg-safety-orange/10 rounded-lg flex-shrink-0",
                        children: w.jsx("i", {
                            className: "ri-information-line text-safety-orange text-xl"
                        })
                    }), w.jsxs("div", {
                        children: [w.jsx("h4", {
                            className: "text-lg font-inter font-semibold text-deep-navy mb-2",
                            children: "Custom Specifications Available"
                        }), w.jsx("p", {
                            className: "text-sm font-inter text-gray-600 leading-relaxed",
                            children: "Need specific dimensions, materials, or configurations? Our engineering team can develop custom solutions tailored to your exact requirements. Contact us to discuss your project needs."
                        })]
                    })]
                })
            })]
        })
    })
}
function Ax() {
    const [i,l] = U.useState({
        name: "",
        email: "",
        company: "",
        message: ""
    })
      , [r,s] = U.useState(!1)
      , [c,f] = U.useState("idle")
      , d = async g => {
        g.preventDefault(),
        s(!0),
        f("idle");
        try {
            const p = g.target
              , b = new URLSearchParams;
            b.append("name", i.name),
            b.append("email", i.email),
            b.append("company", i.company),
            b.append("message", i.message),
           .ok ? (f("success"),
            l({
                name: "",
                email: "",
                company: "",
                message: ""
            })) : f("error")
        } catch {
            f("error")
        } finally {
            s(!1)
        }
    }
      , m = g => {
        l(p => ({
            ...p,
            [g.target.name]: g.target.value
        }))
    }
    ;
    return w.jsx("section", {
        id: "contact",
        className: "py-36 px-20 bg-arch-gray",
        children: w.jsx("div", {
            className: "max-w-7xl mx-auto",
            children: w.jsxs("div", {
                className: "grid grid-cols-2 gap-20",
                children: [w.jsxs("div", {
                    className: "relative",
                    children: [w.jsx("div", {
                        className: "absolute -top-10 -left-10 w-32 h-32 opacity-20",
                        children: w.jsx("svg", {
                            viewBox: "0 0 100 100",
                            className: "w-full h-full",
                            children: w.jsx("path", {
                                d: "M 0,50 Q 25,0 50,50 T 100,50",
                                stroke: "#121B2B",
                                strokeWidth: "2",
                                fill: "none"
                            })
                        })
                    }), w.jsxs("div", {
                        className: "mb-20",
                        children: [w.jsx("div", {
                            className: "w-16 h-16 bg-safety-orange rounded-2xl flex items-center justify-center mb-6",
                            children: w.jsx("i", {
                                className: "ri-phone-line text-white text-3xl"
                            })
                        }), w.jsx("div", {
                            className: "text-5xl font-inter font-bold text-deep-navy mb-3",
                            children: "1-800-IRONCLAD"
                        }), w.jsx("div", {
                            className: "text-base font-inter text-gray-600",
                            children: "Available 24/7 for urgent inquiries"
                        })]
                    }), w.jsxs("div", {
                        className: "flex items-center gap-6",
                        children: [w.jsx("img", {
                            
                            alt: "Sales Representative",
                            className: "w-40 h-40 rounded-full object-cover shadow-lg"
                        }), w.jsxs("div", {
                            children: [w.jsx("div", {
                                className: "text-xl font-inter font-bold text-deep-navy",
                                children: "Michael Chen"
                            }), w.jsx("div", {
                                className: "text-sm font-inter text-gray-600 mt-1",
                                children: "Senior Sales Engineer"
                            }), w.jsxs("div", {
                                className: "flex items-center gap-2 mt-3",
                                children: [w.jsx("i", {
                                    className: "ri-mail-line text-safety-orange"
                                }), w.jsx("span", {
                                    className: "text-sm font-inter text-gray-700",
                                    children: "m.chen@ironclad.com"
                                })]
                            })]
                        })]
                    }), w.jsxs("div", {
                        className: "mt-16 p-6 bg-white rounded-2xl border border-gray-200",
                        children: [w.jsx("h4", {
                            className: "text-lg font-inter font-semibold text-deep-navy mb-3",
                            children: "Why Choose Ironclad?"
                        }), w.jsxs("ul", {
                            className: "space-y-3",
                            children: [w.jsxs("li", {
                                className: "flex items-start gap-3",
                                children: [w.jsx("i", {
                                    className: "ri-checkbox-circle-fill text-safety-orange text-lg mt-0.5"
                                }), w.jsx("span", {
                                    className: "text-sm font-inter text-gray-700",
                                    children: "Free sample kits for qualified projects"
                                })]
                            }), w.jsxs("li", {
                                className: "flex items-start gap-3",
                                children: [w.jsx("i", {
                                    className: "ri-checkbox-circle-fill text-safety-orange text-lg mt-0.5"
                                }), w.jsx("span", {
                                    className: "text-sm font-inter text-gray-700",
                                    children: "Same-day quotes on standard configurations"
                                })]
                            }), w.jsxs("li", {
                                className: "flex items-start gap-3",
                                children: [w.jsx("i", {
                                    className: "ri-checkbox-circle-fill text-safety-orange text-lg mt-0.5"
                                }), w.jsx("span", {
                                    className: "text-sm font-inter text-gray-700",
                                    children: "Dedicated account management"
                                })]
                            })]
                        })]
                    })]
                }), w.jsx("div", {
                    children: w.jsxs("div", {
                        className: "bg-white rounded-3xl p-12 shadow-lg",
                        children: [w.jsx("h3", {
                            className: "text-4xl font-inter font-bold text-deep-navy mb-3",
                            children: "Get Started Today"
                        }), w.jsx("p", {
                            className: "text-base font-inter text-gray-600 mb-8",
                            children: "Fill out the form below and we'll respond within 2 hours during business hours."
                        }), w.jsxs("form", {
                            id: "contact-form",
                            "data--form": !0,
                            onSubmit: d,
                            className: "space-y-5",
                            children: [w.jsxs("div", {
                                className: "grid grid-cols-2 gap-4",
                                children: [w.jsx("div", {
                                    children: w.jsx("input", {
                                        type: "text",
                                        name: "name",
                                        value: i.name,
                                        onChange: m,
                                        placeholder: "Your Name",
                                        required: !0,
                                        className: "w-full px-4 py-4 border border-gray-300 rounded-xl text-sm font-inter focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                                    })
                                }), w.jsx("div", {
                                    children: w.jsx("input", {
                                        type: "email",
                                        name: "email",
                                        value: i.email,
                                        onChange: m,
                                        placeholder: "Email Address",
                                        required: !0,
                                        className: "w-full px-4 py-4 border border-gray-300 rounded-xl text-sm font-inter focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                                    })
                                })]
                            }), w.jsx("div", {
                                children: w.jsx("input", {
                                    type: "text",
                                    name: "company",
                                    value: i.company,
                                    onChange: m,
                                    placeholder: "Company Name",
                                    required: !0,
                                    className: "w-full px-4 py-4 border border-gray-300 rounded-xl text-sm font-inter focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                                })
                            }), w.jsxs("div", {
                                children: [w.jsx("textarea", {
                                    name: "message",
                                    value: i.message,
                                    onChange: m,
                                    placeholder: "Tell us about your project requirements...",
                                    required: !0,
                                    maxLength: 500,
                                    rows: 5,
                                    className: "w-full px-4 py-4 border border-gray-300 rounded-xl text-sm font-inter focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all resize-none"
                                }), w.jsxs("div", {
                                    className: "text-xs text-gray-500 mt-1 text-right",
                                    children: [i.message.length, "/500 characters"]
                                })]
                            }), w.jsx("button", {
                                type: "submit",
                                disabled: r,
                                className: "w-full h-14 bg-safety-orange text-white font-inter font-bold text-base rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:bg-safety-orange/90 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap",
                                children: r ? w.jsxs(w.Fragment, {
                                    children: [w.jsx("i", {
                                        className: "ri-loader-4-line animate-spin"
                                    }), "SENDING..."]
                                }) : w.jsxs(w.Fragment, {
                                    children: ["SEND INQUIRY", w.jsx("i", {
                                        className: "ri-arrow-right-line text-lg"
                                    })]
                                })
                            }), c === "success" && w.jsxs("div", {
                                className: "p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3",
                                children: [w.jsx("i", {
                                    className: "ri-checkbox-circle-fill text-green-600 text-xl"
                                }), w.jsx("span", {
                                    className: "text-sm font-inter text-green-800",
                                    children: "Thank you! We'll be in touch shortly."
                                })]
                            }), c === "error" && w.jsxs("div", {
                                className: "p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3",
                                children: [w.jsx("i", {
                                    className: "ri-error-warning-fill text-red-600 text-xl"
                                }), w.jsx("span", {
                                    className: "text-sm font-inter text-red-800",
                                    children: "Something went wrong. Please try again."
                                })]
                            })]
                        })]
                    })
                })]
            })
        })
    })
}
function Rx() {
    return w.jsx("footer", {
        className: "bg-deep-navy text-white py-20 px-20",
        children: w.jsxs("div", {
            className: "max-w-7xl mx-auto",
            children: [w.jsxs("div", {
                className: "grid grid-cols-4 gap-12 mb-40",
                children: [w.jsxs("div", {
                    children: [w.jsx("h4", {
                        className: "text-lg font-inter font-bold mb-2",
                        children: "Company"
                    }), w.jsx("div", {
                        className: "w-16 h-0.5 bg-safety-orange mb-8"
                    }), w.jsxs("ul", {
                        className: "space-y-8",
                        children: [w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "About Us"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Careers"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "News"
                            })
                        })]
                    })]
                }), w.jsxs("div", {
                    children: [w.jsx("h4", {
                        className: "text-lg font-inter font-bold mb-2",
                        children: "Services"
                    }), w.jsx("div", {
                        className: "w-16 h-0.5 bg-safety-orange mb-8"
                    }), w.jsxs("ul", {
                        className: "space-y-8",
                        children: [w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#capabilities",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Kit Assembly"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#capabilities",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Polybag Packaging"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#capabilities",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Quality Control"
                            })
                        })]
                    })]
                }), w.jsxs("div", {
                    children: [w.jsx("h4", {
                        className: "text-lg font-inter font-bold mb-2",
                        children: "Resources"
                    }), w.jsx("div", {
                        className: "w-16 h-0.5 bg-safety-orange mb-8"
                    }), w.jsxs("ul", {
                        className: "space-y-8",
                        children: [w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Documentation"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Case Studies"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "FAQ"
                            })
                        })]
                    })]
                }), w.jsxs("div", {
                    children: [w.jsx("h4", {
                        className: "text-lg font-inter font-bold mb-2",
                        children: "Contact"
                    }), w.jsx("div", {
                        className: "w-16 h-0.5 bg-safety-orange mb-8"
                    }), w.jsxs("ul", {
                        className: "space-y-8",
                        children: [w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#contact",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Get in Touch"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Support"
                            })
                        }), w.jsx("li", {
                            children: w.jsx("a", {
                                href: "#",
                                className: "text-base font-inter text-gray-400 hover:text-white transition-colors cursor-pointer",
                                children: "Locations"
                            })
                        })]
                    })]
                })]
            }), w.jsxs("div", {
                className: "flex items-end justify-between pt-12 border-t border-white/10",
                children: [w.jsxs("div", {
                    children: [w.jsx("div", {
                        className: "text-[120px] font-inter font-extrabold leading-none",
                        children: "IRONCLAD"
                    }), w.jsx("div", {
                        className: "text-[120px] font-inter font-extrabold leading-none -mt-8",
                        children: "INDUSTRIAL"
                    }), w.jsxs("div", {
                        className: "flex items-center gap-6 mt-8",
                        children: [w.jsx("div", {
                            className: "w-20 h-1 bg-safety-orange"
                        }), w.jsx("span", {
                            className: "text-xs font-inter text-gray-500",
                            children: "© 2025 Ironclad Industrial. All rights reserved."
                        })]
                    })]
                }), w.jsxs("div", {
                    className: "flex flex-col items-end gap-8",
                    children: [w.jsx("div", {
                        className: "text-sm font-inter text-gray-400",
                        children: "Precision Packaging Solutions"
                    }), w.jsxs("div", {
                        className: "flex items-center gap-4",
                        children: [w.jsx("a", {
                            href: "#",
                            className: "w-10 h-10 bg-deep-navy border border-white/20 rounded-full flex items-center justify-center hover:bg-safety-orange transition-all duration-300 cursor-pointer",
                            children: w.jsx("i", {
                                className: "ri-linkedin-fill text-white text-lg"
                            })
                        }), w.jsx("a", {
                            href: "#",
                            className: "w-10 h-10 bg-deep-navy border border-white/20 rounded-full flex items-center justify-center hover:bg-safety-orange transition-all duration-300 cursor-pointer",
                            children: w.jsx("i", {
                                className: "ri-twitter-x-fill text-white text-lg"
                            })
                        }), w.jsx("a", {
                            href: "#",
                            className: "w-10 h-10 bg-deep-navy border border-white/20 rounded-full flex items-center justify-center hover:bg-safety-orange transition-all duration-300 cursor-pointer",
                            children: w.jsx("i", {
                                className: "ri-facebook-fill text-white text-lg"
                            })
                        }), w.jsx("a", {
                            href: "#",
                            className: "w-10 h-10 bg-deep-navy border border-white/20 rounded-full flex items-center justify-center hover:bg-safety-orange transition-all duration-300 cursor-pointer",
                            children: w.jsx("i", {
                                className: "ri-instagram-line text-white text-lg"
                            })
                        })]
                    })]
                })]
            })]
        })
    })
}
function Nx() {
    return w.jsxs("div", {
        className: "font-inter",
        children: [w.jsx(Ex, {}), w.jsx(_x, {}), w.jsx(Cx, {}), w.jsx(Ox, {}), w.jsx(Ax, {}), w.jsx(Rx, {})]
    })
}
const cp = [{
    path: "/",
    element: w.jsx(Nx, {})
}, {
    path: "*",
    element: w.jsx(Sx, {})
}]
  , Lx = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: cp
}, Symbol.toStringTag, {
    value: "Module"
}));
let fp;
const Mx = new Promise(i => {
    fp = i
}
);
function dp() {
    const i = A1(cp)
      , l = tp();
    return U.useEffect( () => {
        window.REACT_APP_NAVIGATE = l,
        fp(window.REACT_APP_NAVIGATE)
    }
    ),
    i
}
const jx = Object.freeze(Object.defineProperty({
    __proto__: null,
    AppRoutes: dp,
    navigatePromise: Mx
}, Symbol.toStringTag, {
    value: "Module"
}));
function zx() {
    return w.jsx(wb, {
        i18n: et,
        children: w.jsx(fx, {
            basename: "/preview/b1b3bb04-634a-436e-a6b8-70bfe20f98ab/7313310",
            children: w.jsx(dp, {})
        })
    })
}
kb.createRoot(document.getElementById("root")).render(w.jsx(U.StrictMode, {
    children: w.jsx(zx, {})
}));
//# sourceMappingURL=index-BVk73ssX.js.map
