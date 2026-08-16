//#region node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, ee = h.trustedTypes, te = ee ? ee.emptyScript : "", ne = h.reactiveElementPolyfillSupport, g = (e, t) => e, _ = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? te : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, v = (e, t) => !l(e, t), re = {
	attribute: !0,
	type: String,
	converter: _,
	reflect: !1,
	useDefault: !1,
	hasChanged: v
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = re) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? re;
	}
	static _$Ei() {
		if (this.hasOwnProperty(g("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(g("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(g("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? _ : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? _ : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? v)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[g("elementProperties")] = /* @__PURE__ */ new Map(), y[g("finalized")] = /* @__PURE__ */ new Map(), ne?.({ ReactiveElement: y }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/lit-html.js
var b = globalThis, x = (e) => e, S = b.trustedTypes, C = S ? S.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ie = "$lit$", w = `lit$${Math.random().toFixed(9).slice(2)}$`, ae = "?" + w, oe = `<${ae}>`, T = document, E = () => T.createComment(""), D = (e) => e === null || typeof e != "object" && typeof e != "function", O = Array.isArray, se = (e) => O(e) || typeof e?.[Symbol.iterator] == "function", k = "[ 	\n\f\r]", A = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, j = /-->/g, M = />/g, N = RegExp(`>|${k}(?:([^\\s"'>=/]+)(${k}*=${k}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), P = /'/g, ce = /"/g, le = /^(?:script|style|textarea|title)$/i, F = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), I = Symbol.for("lit-noChange"), L = Symbol.for("lit-nothing"), R = /* @__PURE__ */ new WeakMap(), z = T.createTreeWalker(T, 129);
function B(e, t) {
	if (!O(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return C === void 0 ? t : C.createHTML(t);
}
var ue = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = A;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === A ? c[1] === "!--" ? o = j : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = N) : (le.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = N) : o = M : o === N ? c[0] === ">" ? (o = i ?? A, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? N : c[3] === "\"" ? ce : P) : o === ce || o === P ? o = N : o === j || o === M ? o = A : (o = N, i = void 0);
		let d = o === N && e[t + 1].startsWith("/>") ? " " : "";
		a += o === A ? n + oe : l >= 0 ? (r.push(s), n.slice(0, l) + ie + n.slice(l) + w + d) : n + w + (l === -2 ? t : d);
	}
	return [B(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, V = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ue(t, n);
		if (this.el = e.createElement(l, r), z.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = z.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ie)) {
					let t = u[o++], n = i.getAttribute(e).split(w), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? fe : r[1] === "?" ? pe : r[1] === "@" ? me : W
					}), i.removeAttribute(e);
				} else e.startsWith(w) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (le.test(i.tagName)) {
					let e = i.textContent.split(w), t = e.length - 1;
					if (t > 0) {
						i.textContent = S ? S.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], E()), z.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], E());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ae) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(w, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += w.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = T.createElement("template");
		return n.innerHTML = e, n;
	}
};
function H(e, t, n = e, r) {
	if (t === I) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = D(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = H(e, i._$AS(e, t.values), i, r)), t;
}
var de = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? T).importNode(t, !0);
		z.currentNode = r;
		let i = z.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new U(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new he(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = z.nextNode(), a++);
		}
		return z.currentNode = T, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, U = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = L, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = H(this, e, t), D(e) ? e === L || e == null || e === "" ? (this._$AH !== L && this._$AR(), this._$AH = L) : e !== this._$AH && e !== I && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? se(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== L && D(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = V.createElement(B(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new de(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = R.get(e.strings);
		return t === void 0 && R.set(e.strings, t = new V(e)), t;
	}
	k(t) {
		O(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(E()), this.O(E()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = x(e).nextSibling;
			x(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, W = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = L, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = L;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = H(this, e, t, 0), a = !D(e) || e !== this._$AH && e !== I, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = H(this, r[n + o], t, o), s === I && (s = this._$AH[o]), a ||= !D(s) || s !== this._$AH[o], s === L ? e = L : e !== L && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === L ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, fe = class extends W {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === L ? void 0 : e;
	}
}, pe = class extends W {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== L);
	}
}, me = class extends W {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = H(this, e, t, 0) ?? L) === I) return;
		let n = this._$AH, r = e === L && n !== L || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== L && (n === L || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, he = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		H(this, e);
	}
}, ge = b.litHtmlPolyfillSupport;
ge?.(V, U), (b.litHtmlVersions ??= []).push("3.3.3");
var _e = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new U(t.insertBefore(E(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, G = globalThis, K = class extends y {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = _e(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return I;
	}
};
K._$litElement$ = !0, K.finalized = !0, G.litElementHydrateSupport?.({ LitElement: K });
var ve = G.litElementPolyfillSupport;
ve?.({ LitElement: K }), (G.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/api.ts
var q = "tautulli_active_streams";
async function ye(e) {
	return (await e.callWS({ type: `${q}/get_entries` })).entries ?? [];
}
async function be(e, t, n) {
	return e.connection.subscribeMessage(n, {
		type: `${q}/subscribe_active_streams`,
		entry_id: t
	});
}
async function xe(e, t) {
	let n = {
		entry_id: t.entry_id,
		limit: t.mode === "recently_added" && t.recent_grouping !== "none" ? Math.min(50, (t.max_items ?? 12) * 4) : t.max_items
	};
	if (t.mode === "recently_added") {
		let r = [
			"movie",
			"show",
			"artist"
		].includes(t.media_type ?? "") ? t.media_type : void 0;
		return e.callWS({
			type: `${q}/get_recently_added`,
			...n,
			...r ? { media_type: r } : {},
			...t.section_id ? { section_id: t.section_id } : {}
		});
	}
	return t.mode === "popular" ? e.callWS({
		type: `${q}/get_home_stats`,
		...n,
		stat_id: t.stat_id,
		time_range: t.time_range,
		metric: t.metric,
		...t.section_id ? { section_id: t.section_id } : {},
		...t.user_id ? { user_id: t.user_id } : {}
	}) : t.mode === "users" ? e.callWS({
		type: `${q}/get_user_stats`,
		entry_id: t.entry_id
	}) : e.callWS({
		type: `${q}/get_history`,
		...n,
		...t.user_id ? { user_id: t.user_id } : {}
	});
}
async function Se(e, t) {
	return e.callWS({
		type: `${q}/get_libraries`,
		entry_id: t
	});
}
async function Ce(e, t) {
	return e.callWS({
		type: `${q}/get_users`,
		entry_id: t
	});
}
async function we(e, t, n) {
	return e.callWS({
		type: `${q}/terminate_session`,
		entry_id: t,
		session_id: n
	});
}
var J = [
	"user",
	"player",
	"device",
	"eta",
	"pause_duration",
	"playback_decision",
	"video_quality",
	"audio_quality",
	"bandwidth",
	"episode",
	"year",
	"content_rating",
	"rating",
	"audience_rating",
	"genres",
	"studio"
], Te = {
	type: "custom:tautulli-media-card",
	config_version: 1,
	mode: "active",
	media_type: "all",
	recent_grouping: "none",
	max_items: 50,
	columns: "auto",
	layout: "grid",
	sort_by: "server",
	sort_direction: "ascending",
	density: "compact",
	artwork: "poster",
	artwork_fit: "cover",
	artwork_aspect: "auto",
	artwork_position: "center",
	artwork_placement: "left",
	backdrop_opacity: 35,
	style_preset: "classic",
	container_style: "auto",
	show_header: !1,
	show_count: !1,
	show_user: !0,
	show_device: !0,
	show_quality: !0,
	show_progress: !0,
	show_progress_percent: !0,
	show_state: !0,
	show_pause_duration: !0,
	show_track_number: !0,
	show_eta: !0,
	show_remaining: !0,
	show_bandwidth: !0,
	show_media_details: !0,
	show_audio_quality: !0,
	show_summary: !1,
	show_empty: !1,
	animations: !0,
	allow_termination: !1,
	termination_location: "popup",
	click_action: "none",
	popup_style: "clean",
	popup_cinematic_art: 45,
	popup_content_style: "open",
	popup_detail_order: J,
	popup_width: "standard",
	popup_animation: "scale",
	popup_animation_duration: 220,
	popup_close_animation_duration: 200,
	popup_backdrop_dim: 58,
	popup_backdrop_blur: 0,
	termination_popup_placement: "footer",
	termination_button_style: "label",
	popup_show_artwork: !0,
	popup_show_summary: !0,
	popup_summary_show_user: !0,
	popup_summary_lines: 3,
	popup_show_technical: !0,
	popup_show_user: !0,
	popup_show_progress: !0,
	popup_show_timing: !0,
	popup_show_client: !0,
	popup_show_quality: !0,
	popup_show_eta: !0,
	popup_show_pause_duration: !0,
	popup_show_player: !0,
	popup_show_device: !0,
	popup_show_playback_decision: !0,
	popup_show_video_quality: !0,
	popup_show_audio_quality: !0,
	popup_show_bandwidth: !0,
	popup_show_media_details: !0,
	popup_show_ratings: !0,
	popup_show_episode: !0,
	popup_show_media_type: !0,
	popup_show_year: !0,
	popup_show_duration: !0,
	popup_show_library: !0,
	popup_show_content_rating: !0,
	popup_show_rating: !0,
	popup_show_audience_rating: !0,
	popup_show_genres: !0,
	popup_show_studio: !0,
	popup_show_playback_breakdown: !0,
	popup_show_favourites: !0,
	popup_show_habits: !0,
	popup_show_recent_activity: !0,
	stat_id: "popular_movies",
	time_range: 30,
	metric: "plays"
};
function Y(e) {
	if (!e || typeof e != "object") throw Error("Invalid Tautulli Media Card configuration");
	let t = Ee(e), n = {
		...Te,
		...t,
		config_version: 1
	};
	n.max_items = t.max_items === void 0 && n.mode !== "active" ? 12 : Math.min(50, Math.max(1, Number(n.max_items) || 50)), n.time_range = Math.min(3650, Math.max(1, Number(n.time_range) || 30));
	let r = Number(n.popup_summary_lines);
	n.popup_summary_lines = [
		0,
		2,
		3,
		5
	].includes(r) ? r : 3;
	let i = Array.isArray(n.popup_detail_order) ? n.popup_detail_order : [], a = i.filter((e, t) => J.includes(e) && i.indexOf(e) === t);
	n.popup_detail_order = [...a, ...J.filter((e) => !a.includes(e))], typeof n.columns == "number" && (n.columns = Math.min(4, Math.max(1, n.columns)));
	for (let [e, t, r] of [
		[
			"border_radius",
			0,
			32
		],
		[
			"item_gap",
			0,
			32
		],
		[
			"artwork_width",
			48,
			240
		],
		[
			"artwork_inset",
			0,
			24
		],
		[
			"title_size",
			11,
			32
		],
		[
			"progress_height",
			2,
			24
		],
		[
			"backdrop_opacity",
			0,
			100
		],
		[
			"popup_animation_duration",
			0,
			1500
		],
		[
			"popup_close_animation_duration",
			0,
			1e3
		],
		[
			"popup_cinematic_art",
			0,
			100
		],
		[
			"popup_backdrop_dim",
			0,
			95
		],
		[
			"popup_backdrop_blur",
			0,
			24
		]
	]) {
		let i = n[e];
		i !== void 0 && (n[e] = Math.min(r, Math.max(t, Number(i) || t)));
	}
	return n;
}
function Ee(e) {
	let t = { ...e };
	if (typeof t.view == "string" && [
		"active",
		"recently_added",
		"popular",
		"users",
		"history"
	].includes(t.view) && !t.mode && (t.mode = t.view), typeof t.preset == "string" && [
		"classic",
		"modern",
		"minimal"
	].includes(t.preset) && !t.style_preset && (t.style_preset = t.preset), typeof t.show_title == "boolean" && t.show_header === void 0 && (t.show_header = t.show_title), typeof t.show_badge == "boolean" && t.show_count === void 0 && (t.show_count = t.show_badge), t.popup_summary_show_user === void 0 && typeof t.popup_show_user == "boolean" && (t.popup_summary_show_user = t.popup_show_user), t.popup_show_technical === !1) for (let e of [
		"popup_show_client",
		"popup_show_quality",
		"popup_show_bandwidth"
	]) t[e] === void 0 && (t[e] = !1);
	for (let [e, n] of [
		["popup_show_timing", ["popup_show_eta", "popup_show_pause_duration"]],
		["popup_show_client", ["popup_show_player", "popup_show_device"]],
		["popup_show_quality", [
			"popup_show_playback_decision",
			"popup_show_video_quality",
			"popup_show_audio_quality"
		]],
		["popup_show_media_details", [
			"popup_show_episode",
			"popup_show_media_type",
			"popup_show_year",
			"popup_show_duration",
			"popup_show_library",
			"popup_show_content_rating"
		]],
		["popup_show_ratings", [
			"popup_show_rating",
			"popup_show_audience_rating",
			"popup_show_genres",
			"popup_show_studio"
		]]
	]) if (t[e] === !1) for (let e of n) t[e] === void 0 && (t[e] = !1);
	for (let e of [
		"view",
		"preset",
		"show_title",
		"show_badge"
	]) delete t[e];
	return t;
}
function De(e) {
	let t = {
		type: e.type,
		config_version: 1
	};
	for (let [n, r] of Object.entries(e)) {
		if (["type", "config_version"].includes(n) || r === void 0) continue;
		let e = Te[n];
		Array.isArray(r) && Array.isArray(e) ? JSON.stringify(r) !== JSON.stringify(e) && (t[n] = r) : r !== e && (t[n] = r);
	}
	return e.popup_summary_show_user !== e.popup_show_user && t.popup_summary_show_user === void 0 && (t.popup_summary_show_user = e.popup_summary_show_user), t;
}
var Oe = {
	classic: {
		card_background: "rgba(3, 18, 32, 0.82)",
		item_background: "rgba(0, 0, 0, 0.42)",
		border_color: "rgba(70, 130, 180, 0.48)",
		item_shadow: "3px 3px 5px rgba(0, 0, 0, 0.5)",
		border_radius: 5,
		item_gap: 5,
		artwork_inset: 5,
		title_size: 16,
		progress_height: 20,
		playing_color: "#2986cc",
		paused_color: "#f5a623",
		buffering_color: "#db4437"
	},
	modern: {
		card_background: "var(--ha-card-background, var(--card-background-color))",
		item_background: "color-mix(in srgb, var(--primary-background-color) 70%, transparent)",
		border_color: "color-mix(in srgb, var(--divider-color) 70%, transparent)",
		item_shadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
		border_radius: 12,
		item_gap: 8,
		artwork_inset: 0,
		title_size: 16,
		progress_height: 7,
		playing_color: "var(--primary-color, #2986cc)",
		paused_color: "var(--warning-color, #f59e0b)",
		buffering_color: "var(--error-color, #db4437)"
	},
	minimal: {
		card_background: "transparent",
		item_background: "transparent",
		border_color: "transparent",
		item_shadow: "none",
		border_radius: 0,
		item_gap: 2,
		artwork_inset: 0,
		title_size: 16,
		progress_height: 5,
		playing_color: "var(--primary-color, #2986cc)",
		paused_color: "var(--warning-color, #f59e0b)",
		buffering_color: "var(--error-color, #db4437)"
	}
};
function ke(e) {
	return e.title ? e.title : {
		active: "Active streams",
		recently_added: "Recently added",
		popular: "Popular on Plex",
		users: "Plex user activity",
		history: "Watch history"
	}[e.mode];
}
//#endregion
//#region src/styles.ts
var Ae = o`
  :host { display: block; container-type: inline-size; }
  ha-card { overflow: hidden; background:var(--tas-card-background, var(--ha-card-background, var(--card-background-color))); }
  :host([container-style="transparent"]) ha-card { border:0; background:transparent; box-shadow:none; }
  :host([container-style="transparent"]) .content { padding:0; gap:6px; }
  :host([container-style="transparent"]) .header { padding-left:6px; padding-right:6px; }
  .header { display:flex; align-items:center; justify-content:space-between; padding:16px 16px 8px; gap:12px; }
  .title { margin:0; font-size:var(--ha-card-header-font-size, 20px); font-weight:500; line-height:1.25; }
  .badge { font-size:12px; min-width:1.5rem; text-align:center; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 9%, transparent); border-radius:999px; padding:3px 8px; }
  .stale { margin:0 16px 8px; color:var(--warning-color, #f59e0b); font-size:12px; }
  .content { display:grid; grid-template-columns:repeat(var(--columns, 1), minmax(0, 1fr)); gap:var(--tas-gap, 8px); padding:var(--tas-gap, 8px); }
  .content.grid.auto { grid-template-columns:repeat(auto-fit, minmax(min(100%, var(--item-min, 340px)), 1fr)); }
  .content.list { grid-template-columns:1fr; }
  .content.carousel { display:flex; overflow-x:auto; overscroll-behavior-inline:contain; scroll-snap-type:x mandatory; scrollbar-width:thin; padding-bottom:12px; }
  .content.carousel > .item { flex:0 0 min(78cqw, var(--carousel-width, 280px)); scroll-snap-align:start; }
  .content.carousel > .classic-item { flex:0 0 min(90cqw, 600px); scroll-snap-align:start; }
  .content.carousel > .media-item { display:flex; flex-direction:column; }
  .content.carousel > .media-item { --media-aspect:2/3; }
  .content.carousel > .media-item.track,.content.carousel > .media-item.album,.content.carousel > .media-item.artist { --media-aspect:1/1; }
  .content.carousel > .media-item .art { height:auto; min-height:0; aspect-ratio:var(--tas-art-aspect, var(--media-aspect)); }
  .content.carousel > .media-item .body { flex:1; padding:10px 12px 12px; }
  .carousel-controls { display:flex; justify-content:flex-end; gap:5px; padding:0 var(--tas-gap, 8px); }
  .carousel-controls button { width:38px; height:38px; display:grid; place-items:center; border:1px solid var(--tas-border-color, var(--divider-color)); border-radius:50%; color:var(--primary-text-color); background:var(--tas-item-background, var(--card-background-color)); cursor:pointer; }
  .carousel-controls button:hover { border-color:var(--primary-color); }
  .carousel-controls button:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
  .item { position:relative; min-width:0; display:grid; grid-template-columns:var(--art-width, 92px) minmax(0,1fr); gap:10px; overflow:hidden; border:1px solid var(--tas-border-color, var(--divider-color)); border-radius:var(--tas-radius, var(--ha-card-border-radius, 12px)); background:var(--tas-item-background, var(--primary-background-color)); box-shadow:var(--tas-shadow, 0 2px 8px rgb(0 0 0 / 18%)); }
  .item.no-art { grid-template-columns:1fr; }
  .item.art-right { grid-template-columns:minmax(0,1fr) var(--art-width, 92px); }
  .item.art-right .art { order:2; }
  .item.art-right .body { order:1; padding:10px 0 10px 10px; }
  .item.background-art,.classic-item.background-art { isolation:isolate; }
  .item.background-art:not(.art-left),.classic-item.background-art:not(.art-left) { grid-template-columns:1fr; }
  .background-art::before { content:""; position:absolute; z-index:0; inset:0 0 0 28%; background-image:linear-gradient(90deg, transparent 0%, rgb(0 0 0 / 35%) 32%, rgb(0 0 0 / 10%) 100%), var(--tas-background-image); background-size:cover; background-position:var(--tas-art-position, center); opacity:var(--tas-backdrop-opacity, .35); -webkit-mask-image:linear-gradient(90deg, transparent, #000 35%); mask-image:linear-gradient(90deg, transparent, #000 35%); }
  .background-art > * { position:relative; z-index:1; }
  .item.background-art:not(.art-left) .body,.classic-item.background-art:not(.art-left) .classic-body { padding:12px; }
  .interactive { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .interactive:hover { border-color:color-mix(in srgb, var(--primary-color) 55%, var(--tas-border-color)); }
  .interactive:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
  .interactive:active { transform:scale(.985); transition:transform .12s ease; }
  .open-details { position:absolute; z-index:2; inset:0; width:100%; height:100%; padding:0; border:0; border-radius:inherit; background:transparent; cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .open-details:focus-visible { outline:2px solid var(--primary-color); outline-offset:-3px; }
  .terminate { z-index:4; }
  .art { width:calc(100% - var(--tas-art-inset, 0px) - var(--tas-art-inset, 0px)); height:calc(100% - var(--tas-art-inset, 0px) - var(--tas-art-inset, 0px)); min-height:128px; margin:var(--tas-art-inset, 0px); object-fit:var(--tas-art-fit, cover); object-position:var(--tas-art-position, center); border-radius:max(0px, calc(var(--tas-radius, 12px) - 2px)); background:var(--secondary-background-color); }
  .body { min-width:0; padding:10px 10px 10px 0; display:flex; flex-direction:column; gap:5px; }
  .no-art .body { padding:12px; }
  .eyebrow,.meta,.details,.summary { color:var(--secondary-text-color); }
  .eyebrow { display:flex; gap:7px; align-items:center; font-size:12px; min-width:0; }
  .eyebrow span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .state { color:var(--state-color, var(--primary-color)); font-weight:600; text-transform:capitalize; }
  :host([animations]) .state.paused { animation:pulse 1.5s ease-in-out infinite; }
  :host([animations]) .state.buffering { animation:pulse .8s ease-in-out infinite; }
  .name { margin:0; font-size:var(--tas-title-size, 16px); font-weight:600; line-height:1.25; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .subtitle { font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .meta,.details { display:flex; flex-wrap:wrap; gap:4px 10px; font-size:12px; }
  .summary { font-size:12px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .progress { height:var(--tas-progress-height, 7px); border-radius:99px; overflow:hidden; background:color-mix(in srgb, var(--primary-text-color) 14%, transparent); margin-top:auto; }
  .progress::before { content:""; display:block; height:100%; width:var(--progress, 0%); background:var(--state-color, var(--primary-color)); transition:width .4s ease; }
  .modern-progress-row { display:grid; grid-template-columns:minmax(64px,1fr) auto; align-items:center; gap:10px; margin-top:auto; }
  .modern-progress-row .progress { width:100%; margin-top:0; }
  .modern-progress-remaining { color:var(--secondary-text-color); font-size:11px; text-align:right; white-space:nowrap; }
  .terminate { position:absolute; right:6px; top:6px; display:grid; place-items:center; width:32px; height:32px; padding:0; border:1px solid color-mix(in srgb, var(--error-color) 28%, transparent); border-radius:50%; color:var(--error-color); background:color-mix(in srgb, var(--error-color) 16%, transparent); box-shadow:0 3px 10px rgb(0 0 0 / 14%); cursor:pointer; transition:background .16s ease,border-color .16s ease,transform .16s ease; }
  .terminate:hover { border-color:color-mix(in srgb, var(--error-color) 42%, transparent); background:color-mix(in srgb, var(--error-color) 24%, transparent); transform:translateY(-1px); }
  .classic-item { position:relative; min-width:0; display:grid; grid-template-columns:minmax(48px, var(--art-width, 85px)) minmax(0, 1fr); gap:5px; overflow:hidden; color:var(--primary-text-color); border:1px solid var(--tas-border-color); border-radius:var(--tas-radius); background:var(--tas-item-background); box-shadow:var(--tas-shadow); }
  .classic-item.art-right { grid-template-columns:minmax(0,1fr) minmax(48px, var(--art-width, 85px)); }
  .classic-item.art-right .classic-art { order:2; }
  .classic-item.art-right .classic-body { order:1; padding:5px 0 5px 7px; }
  .classic-art { width:calc(100% - var(--tas-art-inset, 5px) - var(--tas-art-inset, 5px)); height:calc(100% - var(--tas-art-inset, 5px) - var(--tas-art-inset, 5px)); min-height:116px; margin:var(--tas-art-inset, 5px); object-fit:var(--tas-art-fit, cover); object-position:var(--tas-art-position, center); border-radius:4px; background:var(--secondary-background-color); }
  .classic-item.music .classic-art { height:auto; min-height:0; aspect-ratio:var(--tas-art-aspect, 1); align-self:center; }
  .classic-art.placeholder { display:grid; place-items:center; color:var(--secondary-text-color); }
  .classic-art.placeholder ha-icon { --mdc-icon-size:36px; }
  .classic-body { min-width:0; display:grid; align-content:center; grid-template-rows:auto auto auto auto auto auto; gap:3px; padding:5px 7px 5px 0; }
  .classic-top,.classic-info,.classic-bottom { min-width:0; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px; color:var(--secondary-text-color); font-size:11px; line-height:1.2; }
  .classic-top > span,.classic-bottom > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .classic-top strong { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; font:italic 700 12px Arial,sans-serif; letter-spacing:1.5px; color:var(--primary-text-color); }
  .classic-item:has(.terminate) .classic-top { padding-right:34px; }
  .classic-title { min-width:0; margin:0; display:flex; align-items:center; gap:5px; font-size:var(--tas-title-size, 26px); font-weight:500; line-height:1.05; }
  .classic-item.video .classic-title { font-size:max(var(--tas-title-size, 16px), 26px); }
  .classic-item.music .classic-title { font-size:max(var(--tas-title-size, 16px), 18px); }
  .classic-title ha-icon,.classic-track ha-icon { flex:none; --mdc-icon-size:1em; }
  .classic-title span,.classic-track span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .classic-track { min-width:0; display:flex; align-items:center; gap:5px; font-size:15px; color:var(--secondary-text-color); }
  .classic-info > :last-child,.classic-bottom > :last-child { text-align:right; }
  .media-detail { display:flex; align-items:center; gap:4px; color:var(--primary-text-color); font-size:15px; font-weight:600; }
  .media-detail ha-icon { --mdc-icon-size:15px; }
  .classic-progress { position:relative; min-width:0; height:var(--tas-progress-height, 20px); display:grid; grid-template-columns:1fr auto 1fr; align-items:center; overflow:hidden; border-radius:999px; color:#fff; background:rgba(0,0,0,.6); font-size:11px; font-weight:600; }
  .classic-progress::before { content:""; position:absolute; inset:0 auto 0 0; width:var(--progress, 0%); background:var(--state-color); transition:width .4s ease; }
  .classic-progress span { position:relative; z-index:1; }
  .progress-state { grid-column:1; padding-left:8px; text-transform:capitalize; white-space:nowrap; }
  .progress-percent { grid-column:2; }
  .progress-remaining { grid-column:3; padding-right:8px; color:rgb(255 255 255 / 42%); text-align:right; white-space:nowrap; }
  :host([animations]) .classic-item.paused .classic-progress::before { animation:pulse 1.5s ease-in-out infinite; }
  :host([animations]) .classic-item.buffering .classic-progress::before { animation:pulse .8s ease-in-out infinite; }
  .dialog-backdrop { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:20px; }
  .dialog-backdrop::before { content:""; position:absolute; inset:0; background:var(--scrim-color, rgb(0 0 0 / 58%)); backdrop-filter:var(--scrim-blur, none); -webkit-backdrop-filter:var(--scrim-blur, none); }
  .dialog-backdrop > * { position:relative; }
  .details-dialog.anim-fade { animation:dialog-fade var(--dialog-animation-duration, 220ms) ease-out; }
  .details-dialog.anim-scale { animation:dialog-scale var(--dialog-animation-duration, 220ms) cubic-bezier(.2,.8,.2,1); }
  .details-dialog.anim-rise { animation:dialog-rise var(--dialog-animation-duration, 220ms) cubic-bezier(.2,.8,.2,1); }
  .details-dialog.anim-fade.closing { animation:dialog-fade-out var(--dialog-close-duration, 200ms) ease-in forwards; }
  .details-dialog.anim-scale.closing { animation:dialog-scale-out var(--dialog-close-duration, 200ms) cubic-bezier(.4,0,1,1) forwards; }
  .details-dialog.anim-rise.closing { animation:dialog-rise-out var(--dialog-close-duration, 200ms) cubic-bezier(.4,0,1,1) forwards; }
  .dialog-backdrop.closing::before { animation:scrim-out var(--dialog-close-duration, 200ms) ease-in forwards; }
  .details-dialog.popup-cinematic.closing { --cinematic-art-transition:none; }
  .details-dialog.popup-cinematic.closing::before { animation:cinematic-art-out var(--dialog-close-duration, 200ms) ease-in forwards; }
  :host(:not([animations])) .details-dialog { animation:none !important; }
  :host(:not([animations])) .dialog-backdrop.closing::before { animation:none !important; }
  :host(:not([animations])) .details-dialog.popup-cinematic.closing::before { animation:none !important; }
  @keyframes dialog-fade { from { opacity:0; } }
  @keyframes dialog-fade-out { to { opacity:0; } }
  @keyframes scrim-out { to { opacity:0; } }
  @keyframes cinematic-art-out { to { opacity:0; } }
  @keyframes backdrop-fade { from { opacity:0; } }
  @keyframes cinematic-art-in { from { opacity:0; } }
  @keyframes dialog-scale { from { transform:scale(.96) translateY(6px); } }
  @keyframes dialog-rise { from { transform:translateY(100vh); } }
  @keyframes dialog-scale-out { to { transform:scale(.96) translateY(6px); opacity:0; } }
  @keyframes dialog-rise-out { to { transform:translateY(100vh); } }
  :host(:not([animations])) .dialog-backdrop { animation:none !important; }
  .confirm-dialog { width:min(420px, 100%); overflow:hidden; border:1px solid var(--divider-color); border-radius:var(--ha-dialog-border-radius, 18px); color:var(--primary-text-color); background:var(--card-background-color); box-shadow:0 18px 54px rgb(0 0 0 / 42%); }
  .dialog-content { display:grid; gap:14px; padding:24px; }
  .dialog-icon { width:48px; height:48px; display:grid; place-items:center; border-radius:50%; color:var(--error-color); background:color-mix(in srgb, var(--error-color) 14%, transparent); }
  .dialog-icon ha-icon { --mdc-icon-size:28px; }
  .dialog-content h2 { margin:0; font-size:22px; line-height:1.2; }
  .dialog-content p { margin:0; color:var(--secondary-text-color); line-height:1.45; }
  .dialog-stream { display:grid; gap:4px; padding:12px 14px; border-radius:10px; background:var(--secondary-background-color); }
  .dialog-stream strong,.dialog-stream span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dialog-stream span { color:var(--secondary-text-color); font-size:13px; }
  .dialog-actions { display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid var(--divider-color); }
  .dialog-actions button { min-height:40px; padding:0 18px; border:0; border-radius:10px; font:600 14px inherit; cursor:pointer; }
  .dialog-cancel { color:var(--primary-text-color); background:transparent; }
  .dialog-confirm { color:#fff; background:var(--error-color, #db4437); }
  .dialog-actions button:focus-visible,.terminate:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
  .dialog-actions button:disabled { opacity:.55; cursor:wait; }
  .details-dialog { position:relative; width:min(720px, 100%); max-height:min(86vh, 780px); overflow-x:hidden; overflow-y:auto; border:1px solid var(--divider-color); border-radius:var(--ha-dialog-border-radius, 18px); color:var(--primary-text-color); background:linear-gradient(var(--card-background-color), var(--card-background-color)), linear-gradient(var(--primary-background-color, #fff), var(--primary-background-color, #fff)); box-shadow:0 18px 54px rgb(0 0 0 / 45%); isolation:isolate; min-width:0; }
  .details-dialog.popup-width-compact { width:min(520px, 100%); }
  .details-dialog.popup-width-wide { width:min(940px, 100%); }
  .details-dialog.has-backdrop::before { content:""; position:absolute; z-index:-1; inset:0 0 auto 28%; height:270px; background-image:linear-gradient(180deg, rgb(0 0 0 / 10%), var(--card-background-color) 96%), linear-gradient(90deg, transparent, rgb(0 0 0 / 20%)), var(--details-backdrop); background-size:cover; background-position:center; opacity:.5; -webkit-mask-image:linear-gradient(90deg, transparent, #000 35%); mask-image:linear-gradient(90deg, transparent, #000 35%); }
  .dialog-close { position:sticky; z-index:3; float:right; top:12px; right:12px; width:40px; height:40px; display:grid; place-items:center; margin:12px 12px 0 0; border:0; border-radius:50%; color:var(--primary-text-color); background:color-mix(in srgb, var(--card-background-color) 82%, transparent); cursor:pointer; backdrop-filter:blur(8px); }
  .details-content { display:grid; grid-template-columns:minmax(0,1fr); gap:18px; padding:24px; clear:both; min-width:0; }
  .details-content h2 { max-width:calc(100% - 44px); margin:0; font-size:clamp(22px, 4cqw, 32px); line-height:1.12; }
  .details-hero { position:relative; display:grid; gap:16px; }
  .popup-summary { display:grid; gap:14px; padding:14px; border:1px solid color-mix(in srgb, var(--divider-color) 80%, transparent); border-radius:14px; background:color-mix(in srgb, var(--primary-text-color) 4%, transparent); backdrop-filter:blur(4px); }
  .popup-clean .popup-summary { padding:0; border:0; border-radius:0; background:transparent; backdrop-filter:none; }
  .popup-cinematic.has-backdrop::before { inset:0; height:330px; opacity:calc(var(--cinematic-art-opacity, .45)); -webkit-mask-image:linear-gradient(180deg,#000 0%,transparent 100%); mask-image:linear-gradient(180deg,#000 0%,transparent 100%); animation:cinematic-art-in var(--dialog-animation-duration, 220ms) ease-out; }
  .popup-cinematic .popup-summary { min-height:190px; align-content:end; padding:22px; border:0; background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--card-background-color) 55%,transparent)); }
  .media-summary { justify-items:start; }
  .details-section-title { margin:2px 0 -8px; color:var(--secondary-text-color); font-size:12px; text-transform:uppercase; letter-spacing:.65px; }
  .details-hero.with-poster { grid-template-columns:minmax(90px, 150px) minmax(0,1fr); }
  .details-hero > img { width:100%; aspect-ratio:2/3; object-fit:cover; border-radius:10px; box-shadow:0 8px 24px rgb(0 0 0 / 35%); }
  .details-primary { min-width:0; display:grid; align-content:end; gap:10px; }
  .details-hero .details-primary { align-content:start; display:flex; flex-direction:column; gap:8px; }
  .details-hero .details-primary .details-progress { margin-top:auto; }
  .details-heading-line { min-width:0; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .details-inline-title { min-width:0; overflow-wrap:anywhere; }
  .details-inline-title { max-width:none !important; margin:0; padding-right:4px; font-size:clamp(22px, 4cqw, 32px); line-height:1.12; }
  .details-summary-user { max-width:42%; flex:none; display:flex; align-items:center; gap:5px; overflow:hidden; padding:5px 9px; border:1px solid color-mix(in srgb, var(--divider-color) 70%, transparent); border-radius:999px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 7%, transparent); font-size:11px; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }
  .details-summary-user ha-icon { --mdc-icon-size:15px; flex:none; }
  .details-primary p,.details-subtitle { margin:0; color:var(--secondary-text-color); }
  .details-chips { display:flex; flex-wrap:wrap; gap:6px; min-width:0; }
  .details-chips span { padding:4px 9px; border-radius:999px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 8%, transparent); font-size:12px; text-transform:capitalize; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .details-chips .state { color:var(--primary-text-color); background:color-mix(in srgb, var(--primary-color) 32%, transparent); }
  .details-chips .state.paused { color:var(--secondary-text-color); background:color-mix(in srgb, var(--tas-paused-color, #e5a00d) 42%, transparent); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--tas-paused-color, #e5a00d) 58%, transparent); }
  .details-chips .state.buffering { color:var(--secondary-text-color); background:color-mix(in srgb, var(--tas-buffering-color, #d32f2f) 42%, transparent); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--tas-buffering-color, #d32f2f) 58%, transparent); }
  .details-progress { height:10px; overflow:hidden; border-radius:99px; background:color-mix(in srgb, var(--primary-text-color) 12%, transparent); }
  .details-progress span { display:block; height:100%; border-radius:inherit; background:var(--primary-color); }
  .details-progress-label { display:flex; justify-content:space-between; gap:12px; color:var(--secondary-text-color); font-size:12px; }
  .details-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:8px; }
  .detail-value { min-width:0; display:grid; gap:3px; padding:10px 12px; border-radius:10px; background:color-mix(in srgb, var(--primary-text-color) 6%, transparent); }
  .detail-value small { color:var(--secondary-text-color); font-size:10px; text-transform:uppercase; letter-spacing:.45px; }
  .detail-value span { overflow:hidden; text-overflow:ellipsis; font-size:13px; }
  .popup-content-panel .details-grid { padding:10px; border:1px solid color-mix(in srgb, var(--divider-color) 80%, transparent); border-radius:14px; background:color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
  .details-actions { display:flex; justify-content:flex-end; padding-top:4px; }
  .details-top-action { position:absolute; z-index:2; top:0; right:0; }
  .details-top-action + .details-primary { padding-right:56px; }
  .details-actions button { min-height:42px; display:flex; align-items:center; gap:7px; padding:0 16px; border:0; border-radius:10px; font-weight:700; cursor:pointer; }
  .details-top-action button { min-height:38px; display:flex; align-items:center; gap:7px; padding:0 12px; border:0; border-radius:10px; font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgb(0 0 0 / 25%); }
  .details-actions .danger,.details-top-action .danger { color:var(--error-color); background:color-mix(in srgb, var(--error-color) 16%, transparent); border:1px solid color-mix(in srgb, var(--error-color) 30%, transparent); backdrop-filter:blur(8px); transition:color .16s ease,background .16s ease,border-color .16s ease,transform .16s ease; }
  .details-actions .danger:hover,.details-actions .danger:focus-visible,.details-top-action .danger:hover,.details-top-action .danger:focus-visible { background:color-mix(in srgb, var(--error-color) 24%, transparent); border-color:color-mix(in srgb, var(--error-color) 44%, transparent); transform:translateY(-1px); }
  .details-actions .icon-only,.details-top-action .icon-only { width:42px; padding:0; justify-content:center; border-radius:50%; }
  .details-media-poster { width:min(190px, 42%); aspect-ratio:2/3; object-fit:cover; border-radius:10px; box-shadow:0 8px 24px rgb(0 0 0 / 32%); }
  .details-summary { margin:0; color:var(--secondary-text-color); line-height:1.55; }
  .details-summary.compact { display:-webkit-box; -webkit-line-clamp:var(--summary-lines, 3); -webkit-box-orient:vertical; overflow:hidden; font-size:12px; line-height:1.45; }
  .user-popup-summary { display:flex; align-items:center; gap:14px; }
  .user-avatar.large { width:58px; height:58px; margin:0; font-size:24px; }
  .user-popup-summary > div:last-child { display:grid; gap:3px; }
  .user-popup-summary span { color:var(--secondary-text-color); }
  .empty { padding:28px 18px; text-align:center; color:var(--secondary-text-color); }
  .user-item { grid-template-columns:64px minmax(0,1fr); }
  .user-avatar { width:44px; height:44px; align-self:start; margin:12px 0 0 12px; display:grid; place-items:center; border-radius:50%; color:var(--text-primary-color, #fff); background:linear-gradient(145deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 55%, #7c3aed)); font-size:20px; font-weight:700; }
  .user-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
  .user-stats span { display:grid; gap:1px; padding:7px 8px; border-radius:8px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 5%, transparent); font-size:10px; }
  .user-stats strong { color:var(--primary-text-color); font-size:13px; }
  .user-breakdown { display:flex; flex-wrap:wrap; gap:5px 10px; color:var(--secondary-text-color); font-size:11px; }
  .user-breakdown span { display:flex; align-items:center; gap:3px; }
  .user-breakdown ha-icon { --mdc-icon-size:13px; }
  .user-favourites { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:6px; }
  .user-favourites span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }
  .user-favourites small { display:block; color:var(--secondary-text-color); font-size:9px; text-transform:uppercase; letter-spacing:.4px; }
  .skeleton { min-height:132px; pointer-events:none; }
  .skeleton-art,.skeleton-body span { background:linear-gradient(90deg, color-mix(in srgb, var(--primary-text-color) 6%, transparent) 25%, color-mix(in srgb, var(--primary-text-color) 12%, transparent) 45%, color-mix(in srgb, var(--primary-text-color) 6%, transparent) 65%); background-size:250% 100%; animation:shimmer 1.5s ease-in-out infinite; }
  .skeleton-art { min-height:132px; }
  .skeleton-body { display:grid; align-content:center; gap:12px; padding:14px 14px 14px 0; }
  .skeleton-body span { height:10px; border-radius:999px; }
  .skeleton-body span:nth-child(1) { width:45%; }
  .skeleton-body span:nth-child(2) { width:88%; height:17px; }
  .skeleton-body span:nth-child(3) { width:65%; }
  :host([density="comfortable"]) { --art-width:112px; --item-min:390px; }
  :host([density="detailed"]) { --art-width:140px; --item-min:440px; }
  :host(:not([animations])) .progress::before { transition:none; }
  @keyframes pulse { 50% { opacity:.35; } }
  @keyframes shimmer { from { background-position:100% 0; } to { background-position:-100% 0; } }
  @container (max-width: 420px) {
    .content { grid-template-columns:1fr !important; }
    .item { --art-width:82px; }
    .details.optional,.summary { display:none; }
    .classic-item { grid-template-columns:80px minmax(0,1fr); }
    .classic-body { padding-right:5px; }
    .classic-item.video .classic-title { font-size:18px; }
    .classic-top,.classic-info,.classic-bottom { font-size:10px; }
    .remaining-label { display:none; }
    .progress-state { padding-left:5px; }
    .progress-remaining { padding-right:5px; }
    .details-hero.with-poster { grid-template-columns:72px minmax(0,1fr); gap:12px; }
    .details-hero > img { border-radius:8px; }
    .details-heading-line { align-items:flex-start; flex-direction:column; gap:7px; }
    .details-summary-user { max-width:100%; }
    .details-content { padding:14px; gap:14px; }
    .details-inline-title { font-size:20px; }
    .details-grid { grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:6px; }
    .detail-value { padding:8px 10px; }
    .detail-value span { font-size:12px; white-space:normal; overflow-wrap:anywhere; }
    .popup-summary { padding:10px; gap:10px; }
    .details-progress { height:8px; }
    .dialog-backdrop { padding:10px; }
    .details-dialog { border-radius:14px; }
    .dialog-close { width:36px; height:36px; margin:8px 8px 0 0; }
    .details-actions button, .details-top-action button { min-height:44px; }
    .carousel-controls { display:none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .progress::before { transition:none; }
    * { animation:none !important; }
  }
`, je = o`
  .editor-group-title { margin:10px 2px -2px; color:var(--primary-text-color); font-size:13px; font-weight:700; letter-spacing:.35px; text-transform:uppercase; }
  :host { display:block; }
  .editor { display:grid; gap:16px; padding:8px 0; }
  .compatibility { display:flex; align-items:center; gap:11px; padding:12px 14px; border:1px solid color-mix(in srgb, var(--success-color, #43a047) 35%, var(--divider-color)); border-radius:12px; background:color-mix(in srgb, var(--success-color, #43a047) 7%, transparent); }
  .compatibility > span { width:10px; height:10px; flex:none; border-radius:50%; background:var(--success-color, #43a047); box-shadow:0 0 0 4px color-mix(in srgb, var(--success-color, #43a047) 15%, transparent); }
  .compatibility > div { min-width:0; display:grid; gap:2px; }
  .compatibility strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; }
  .compatibility small { color:var(--secondary-text-color); font-size:11px; }
  .section { overflow:hidden; border:1px solid var(--divider-color); border-radius:12px; padding:14px; background:color-mix(in srgb, var(--card-background-color) 96%, var(--primary-color) 4%); transition:border-color .18s ease, box-shadow .18s ease; }
  .section[open] { border-color:color-mix(in srgb, var(--primary-color) 32%, var(--divider-color)); box-shadow:0 3px 12px rgb(0 0 0 / 7%); }
  .section[open] { display:grid; gap:12px; }
  .section > summary { margin:-2px 0; cursor:pointer; color:var(--primary-text-color); font-size:15px; font-weight:600; list-style-position:inside; }
  .section[open] > summary { margin-bottom:2px; }
  .section-description { margin:0; color:var(--secondary-text-color); font-size:12px; line-height:1.45; }
  label { display:grid; gap:6px; color:var(--primary-text-color); font-size:13px; }
  input,select { box-sizing:border-box; width:100%; min-height:42px; padding:8px 10px; border:1px solid var(--divider-color); border-radius:9px; color:var(--primary-text-color); background:var(--card-background-color); font:inherit; transition:border-color .16s ease, box-shadow .16s ease; }
  input:focus-visible,select:focus-visible,summary:focus-visible { outline:none; border-color:var(--primary-color); box-shadow:0 0 0 2px color-mix(in srgb, var(--primary-color) 23%, transparent); }
  .toggles { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:9px; }
  .option-group { display:grid; gap:8px; padding-top:4px; }
  .option-group + .option-group { padding-top:12px; border-top:1px solid var(--divider-color); }
  .option-group h4 { margin:0; font-size:12px; text-transform:uppercase; letter-spacing:.5px; color:var(--secondary-text-color); }
  .toggle { min-height:42px; display:flex; flex-direction:row-reverse; align-items:center; justify-content:space-between; gap:9px; padding:0 10px; border:1px solid color-mix(in srgb, var(--divider-color) 75%, transparent); border-radius:9px; background:color-mix(in srgb, var(--primary-text-color) 3%, transparent); }
  .toggle-number { display:grid; gap:8px; padding:8px 10px; border:1px solid color-mix(in srgb, var(--divider-color) 75%, transparent); border-radius:9px; background:color-mix(in srgb, var(--primary-text-color) 3%, transparent); }
  .toggle-number .toggle { min-height:0; border:0; background:transparent; padding:0; }
  .toggle-number-value { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--secondary-text-color); }
  .toggle-number-value input[type="range"] { flex:1; min-height:24px; accent-color:var(--primary-color); }
  .toggle input { position:relative; width:38px; height:22px; min-height:22px; flex:none; padding:0; appearance:none; border:0; border-radius:99px; background:color-mix(in srgb, var(--primary-text-color) 24%, transparent); cursor:pointer; }
  .toggle input::before { content:""; position:absolute; width:18px; height:18px; left:2px; top:2px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgb(0 0 0 / 32%); transition:transform .18s ease; }
  .toggle input:checked { background:var(--primary-color); }
  .toggle input:checked::before { transform:translateX(16px); }
  .detail-order-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; color:var(--secondary-text-color); font-size:11px; }
  .detail-order-toolbar > div { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:5px; }
  .detail-order-toolbar button { min-height:30px; padding:0 8px; border:1px solid var(--divider-color); border-radius:7px; color:var(--primary-color); background:transparent; font:600 10px inherit; cursor:pointer; }
  .detail-order-list { display:grid; gap:6px; }
  .detail-order-row { position:relative; min-height:44px; display:grid; grid-template-columns:38px minmax(0,1fr) auto; align-items:center; gap:7px; padding:4px 6px 4px 2px; border:1px solid color-mix(in srgb, var(--divider-color) 78%, transparent); border-radius:9px; background:color-mix(in srgb, var(--primary-text-color) 3%, transparent); transition:opacity .14s ease,transform .14s ease,border-color .14s ease,background .14s ease,box-shadow .14s ease; }
  .detail-order-row.dragging { opacity:.55; transform:scale(.985); border-color:var(--primary-color); border-style:dashed; background:color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color)); box-shadow:0 4px 14px rgb(0 0 0 / 15%); }
  .drag-handle,.detail-order-actions button { display:grid; place-items:center; padding:0; border:0; color:var(--secondary-text-color); background:transparent; cursor:pointer; }
  .drag-handle { width:38px; height:38px; cursor:grab; touch-action:none; }
  .drag-handle:active { cursor:grabbing; }
  .drag-handle ha-icon { --mdc-icon-size:22px; }
  .detail-order-actions { display:flex; align-items:center; gap:2px; }
  .detail-order-actions button { width:30px; height:34px; border-radius:6px; }
  .detail-order-actions button:hover:not(:disabled),.detail-order-actions button:focus-visible { color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 10%, transparent); outline:none; }
  .detail-order-actions button:disabled { opacity:.3; cursor:default; }
  .detail-order-actions ha-icon { --mdc-icon-size:18px; }
  .detail-order-toggle { position:relative; width:38px; height:22px; min-height:22px; margin:0 3px 0 6px; padding:0; appearance:none; border:0; border-radius:99px; background:color-mix(in srgb, var(--primary-text-color) 24%, transparent); cursor:pointer; }
  .detail-order-toggle::before { content:""; position:absolute; width:18px; height:18px; left:2px; top:2px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgb(0 0 0 / 32%); transition:transform .18s ease; }
  .detail-order-toggle:checked { background:var(--primary-color); }
  .detail-order-toggle:checked::before { transform:translateX(16px); }
  .hint { margin:0; font-size:12px; color:var(--secondary-text-color); line-height:1.4; }
  .reset-all { display:block; margin:12px 0 0; padding:8px 14px; border:1px solid var(--error-color, #db4437); border-radius:8px; color:var(--error-color, #db4437); background:transparent; font:600 12px inherit; cursor:pointer; }
  .reset-all:hover { background:color-mix(in srgb, var(--error-color, #db4437) 10%, transparent); }
  .error { color:var(--error-color); font-size:12px; }
  .section details { border-top:1px solid var(--divider-color); padding-top:10px; }
  .section details summary { cursor:pointer; color:var(--primary-text-color); font-size:13px; font-weight:600; }
  .advanced { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; padding-top:12px; }
  .fine-tune-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:10px; color:var(--secondary-text-color); font-size:11px; }
  .fine-tune-header button { flex:none; min-height:34px; padding:0 10px; border:1px solid var(--divider-color); border-radius:8px; color:var(--primary-color); background:transparent; font:600 11px inherit; cursor:pointer; }
  .appearance-field > span { display:flex; align-items:center; justify-content:space-between; gap:6px; }
  .appearance-field em { padding:2px 5px; border-radius:5px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 6%, transparent); font:normal 9px inherit; text-transform:uppercase; letter-spacing:.3px; }
  .field-row { display:flex; gap:5px; }
  .field-row > input:not(.colour-picker) { min-width:0; flex:1; }
  .colour-picker { width:42px; flex:none; padding:4px; cursor:pointer; }
  .field-reset { width:42px; flex:none; display:grid; place-items:center; border:1px solid var(--divider-color); border-radius:9px; color:var(--primary-color); background:var(--card-background-color); cursor:pointer; }
  .field-reset ha-icon { --mdc-icon-size:18px; }
  .recipe-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .recipe { min-width:0; display:grid; grid-template-columns:44px minmax(0,1fr); grid-template-rows:auto auto; column-gap:10px; padding:9px; border:1px solid var(--divider-color); border-radius:10px; color:var(--primary-text-color); background:var(--card-background-color); text-align:left; cursor:pointer; }
  .recipe:hover,.recipe:focus-visible { border-color:var(--primary-color); box-shadow:0 0 0 2px color-mix(in srgb, var(--primary-color) 17%, transparent); outline:none; }
  .recipe-preview { grid-row:1 / 3; width:42px; height:42px; display:grid; grid-template-columns:13px 1fr; grid-template-rows:repeat(2,1fr); gap:2px; overflow:hidden; border-radius:6px; background:#08111e; box-shadow:inset 0 0 0 1px rgb(255 255 255 / 13%); }
  .recipe-preview i { display:block; background:#2b435d; }
  .recipe-preview i:first-child { grid-row:1 / 3; background:#e5a00d; }
  .recipe.cinematic .recipe-preview i:first-child { grid-column:1 / 3; grid-row:1 / 3; background:linear-gradient(90deg,#08111e,#854d60); }
  .recipe.shelf .recipe-preview { grid-template-columns:repeat(3,1fr); grid-template-rows:1fr; }
  .recipe.shelf .recipe-preview i:first-child { grid-column:auto; grid-row:auto; }
  .recipe.minimal .recipe-preview { background:transparent; }
  .recipe strong { align-self:end; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; }
  .recipe small { align-self:start; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--secondary-text-color); font-size:10px; }
  @media (max-width: 360px) {
    .recipe-grid { grid-template-columns:1fr; }
    .detail-order-toolbar { align-items:flex-start; flex-direction:column; }
    .detail-order-toolbar > div { justify-content:flex-start; }
  }
`, Me = {
	user: "popup_show_user",
	player: "popup_show_player",
	device: "popup_show_device",
	eta: "popup_show_eta",
	pause_duration: "popup_show_pause_duration",
	playback_decision: "popup_show_playback_decision",
	video_quality: "popup_show_video_quality",
	audio_quality: "popup_show_audio_quality",
	bandwidth: "popup_show_bandwidth",
	episode: "popup_show_episode",
	year: "popup_show_year",
	content_rating: "popup_show_content_rating",
	rating: "popup_show_rating",
	audience_rating: "popup_show_audience_rating",
	genres: "popup_show_genres",
	studio: "popup_show_studio"
}, Ne = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			_config: { state: !0 },
			_data: { state: !0 },
			_loading: { state: !0 },
			_error: { state: !0 },
			_pendingTermination: { state: !0 },
			_terminating: { state: !0 },
			_selectedItem: { state: !0 },
			_pauseClock: { state: !0 }
		};
	}
	static {
		this.styles = Ae;
	}
	constructor() {
		super(), this._dialogOpenedAt = 0, this._dialogClosing = !1, this._retryAttempt = 0, this._loadVersion = 0, this._pauseAnchors = /* @__PURE__ */ new Map(), this._scrollLockCount = 0, this._visibilityChanged = () => {
			document.visibilityState === "visible" && this._config.mode !== "active" && this._loadData();
		}, this._delegatedItemClick = (e) => {
			if (this._config.click_action !== "details") return;
			let t = e.composedPath();
			if (t.some((e) => e instanceof Element && (e.matches(".terminate") || e.closest(".dialog-backdrop")))) return;
			let n = t.find((e) => e instanceof HTMLElement && e.dataset.itemId);
			if (!n) return;
			let r = this._filteredItems().find((e) => this._itemId(e) === n.dataset.itemId);
			r && this._openDetails(r);
		}, this._closeDetails = () => {
			if (this._dialogClosing) return;
			let e = this._config.popup_animation ?? "scale", t = this._config.animations === !1 || e === "none" ? 0 : this._config.popup_close_animation_duration ?? 200;
			if (t <= 0) {
				this._selectedItem = void 0, this._unlockBodyScroll(), this.requestUpdate();
				return;
			}
			this._dialogClosing = !0, this.requestUpdate(), window.setTimeout(() => {
				this._selectedItem = void 0, this._dialogClosing = !1, this._unlockBodyScroll(), this.requestUpdate();
			}, t + 60);
		}, this._backdropClickClose = (e) => {
			e.target === e.currentTarget && (Date.now() - this._dialogOpenedAt < 350 || this._closeDetails());
		}, this._backdropTerminationClose = (e) => {
			e.target === e.currentTarget && (Date.now() - this._dialogOpenedAt < 350 || this._closeTerminationDialog());
		}, this._config = Y({}), this._loading = !0, this._terminating = !1, this._pauseClock = Date.now();
	}
	static getStubConfig() {
		let e = { ...Y({}) };
		return delete e.type, e;
	}
	static getConfigElement() {
		return document.createElement("tautulli-media-card-editor");
	}
	getGridOptions() {
		return {
			columns: 6,
			rows: Math.max(1, Math.min(this._filteredItems().length, 4)) * 3,
			min_columns: 3,
			min_rows: 2
		};
	}
	setConfig(e) {
		let t = this._config, n = Y(e), r = [
			"entry_id",
			"mode",
			"max_items",
			"section_id",
			"user_id",
			"stat_id",
			"time_range",
			"metric"
		];
		n.mode !== "active" && r.push("media_type");
		let i = r.some((e) => t[e] !== n[e]), a = t.entry_id !== n.entry_id || t.mode !== n.mode;
		this._config = n, this.setAttribute("density", this._config.density ?? "compact"), this.setAttribute("layout", this._config.layout ?? "grid");
		let o = this._config.container_style === "auto" ? this._config.style_preset === "modern" ? "surface" : "transparent" : this._config.container_style ?? "transparent";
		this.setAttribute("container-style", o), this.toggleAttribute("animations", !!this._config.animations), this._applyAppearance(), a && (this._data = void 0), i && this.isConnected && this.hass && this._connect();
	}
	getCardSize() {
		let e = this._data?.items.length ?? 1, t = typeof this._config.columns == "number" ? this._config.columns : 1;
		return Math.max(1, Math.ceil(e / t) * 3 + (this._config.show_header || this._config.show_count ? 1 : 0));
	}
	connectedCallback() {
		super.connectedCallback(), document.addEventListener("visibilitychange", this._visibilityChanged), this.addEventListener("click", this._delegatedItemClick, { capture: !0 }), this.hass && this._connect();
	}
	disconnectedCallback() {
		this._scrollLockCount > 0 && (document.body.style.overflow = "", document.body.style.paddingRight = "", this._scrollLockCount = 0), this._disconnect(), document.removeEventListener("visibilitychange", this._visibilityChanged), this.removeEventListener("click", this._delegatedItemClick, { capture: !0 }), super.disconnectedCallback();
	}
	willUpdate(e) {
		e.has("_data") && this._syncPauseClock();
	}
	updated(e) {
		this._applyEdgeToEdgeStretch(), this.renderRoot.querySelectorAll("[data-item-id]").forEach((e) => {
			e.onclick = (t) => {
				if (t.composedPath().some((e) => e instanceof Element && e.matches(".terminate"))) return;
				let n = this._filteredItems().find((t) => this._itemId(t) === e.dataset.itemId);
				n && this._openDetails(n);
			};
		}), this.renderRoot.querySelectorAll(".open-details").forEach((e) => {
			let t = 0, n = (n) => {
				n.stopPropagation(), n.preventDefault();
				let r = Date.now();
				if (r - t < 400) return;
				t = r;
				let i = this._filteredItems().find((t) => this._itemId(t) === e.dataset.detailId);
				i && this._openDetails(i);
			};
			e.onclick = n, e.onpointerup = n;
		}), e.has("hass") && this.hass && !this._data && !this._error && this._connect(), e.has("_pendingTermination") && this._pendingTermination && this.renderRoot.querySelector(".dialog-confirm")?.focus(), e.has("_selectedItem") && this._selectedItem && this.renderRoot.querySelector(".dialog-close")?.focus();
	}
	_applyEdgeToEdgeStretch() {
		if (this._config?.container_style !== "transparent") {
			this.style.removeProperty("margin-left"), this.style.removeProperty("margin-right");
			return;
		}
		let e = this.parentElement, t = 0, n = 0, r = !1;
		for (; e && e !== document.body;) {
			let i = window.getComputedStyle(e);
			if (/(auto|scroll)/.test(i.overflowX) || /(auto|scroll)/.test(i.overflow)) {
				let i = this.getBoundingClientRect(), a = e.getBoundingClientRect();
				t = Math.max(0, i.left - a.left), n = Math.max(0, a.right - i.right), r = !0;
				break;
			}
			e = e.parentElement;
		}
		if (!r) return;
		let i = (e) => e > 1 ? `-${Math.min(e, 32)}px` : "", a = i(t), o = i(n);
		a ? this.style.setProperty("margin-left", a) : this.style.removeProperty("margin-left"), o ? this.style.setProperty("margin-right", o) : this.style.removeProperty("margin-right");
	}
	_disconnect() {
		this._loadVersion += 1, this._unsubscribe?.(), this._unsubscribe = void 0, this._refreshTimer && window.clearInterval(this._refreshTimer), this._refreshTimer = void 0, this._retryTimer && window.clearTimeout(this._retryTimer), this._retryTimer = void 0, this._pauseTimer && window.clearInterval(this._pauseTimer), this._pauseTimer = void 0, this._pauseAnchors.clear();
	}
	_applyAppearance() {
		let e = Oe[this._config.style_preset ?? "classic"], t = {
			"--tas-card-background": this._config.card_background ?? e.card_background,
			"--tas-item-background": this._config.item_background ?? e.item_background,
			"--tas-border-color": this._config.border_color ?? e.border_color,
			"--tas-shadow": this._config.item_shadow ?? e.item_shadow,
			"--tas-radius": `${this._config.border_radius ?? e.border_radius}px`,
			"--tas-gap": `${this._config.item_gap ?? e.item_gap}px`,
			"--tas-title-size": `${this._config.title_size ?? e.title_size}px`,
			"--tas-progress-height": `${this._config.progress_height ?? e.progress_height}px`,
			"--tas-playing-color": this._config.playing_color ?? e.playing_color,
			"--tas-paused-color": this._config.paused_color ?? e.paused_color,
			"--tas-buffering-color": this._config.buffering_color ?? e.buffering_color,
			"--art-width": this._config.artwork_width ? `${this._config.artwork_width}px` : void 0,
			"--tas-art-inset": `${this._config.artwork_inset ?? e.artwork_inset}px`,
			"--tas-art-fit": this._config.artwork_fit ?? "cover",
			"--tas-art-position": this._config.artwork_position ?? "center",
			"--tas-art-aspect": this._config.artwork_aspect === "poster" ? "2/3" : this._config.artwork_aspect === "square" ? "1/1" : this._config.artwork_aspect === "backdrop" || this._config.artwork_aspect === "auto" && this._config.artwork === "backdrop" ? "16/9" : void 0
		};
		for (let [e, n] of Object.entries(t)) n === void 0 ? this.style.removeProperty(e) : this.style.setProperty(e, String(n));
	}
	async _connect() {
		if (!this.hass) return;
		this._disconnect();
		let e = this._loadVersion;
		this._loading = !this._data, this._error = void 0;
		try {
			if (!this._config.entry_id) {
				let e = await ye(this.hass);
				if (!e.length) throw Error("No loaded Tautulli Active Streams integration was found");
				this._config = {
					...this._config,
					entry_id: e[0]?.entry_id
				};
			}
			if (e !== this._loadVersion) return;
			if (this._config.mode === "active") this._unsubscribe = await be(this.hass, this._config.entry_id, (e) => this._receive(e));
			else {
				await this._loadData(e);
				let t = ["popular", "users"].includes(this._config.mode) ? 9e5 : this._config.mode === "history" ? 6e4 : 3e5;
				this._refreshTimer = window.setInterval(() => void this._loadData(), t);
			}
		} catch (t) {
			e === this._loadVersion && this._setError(t);
		}
	}
	async _loadData(e = this._loadVersion) {
		if (!(!this.hass || !this._config.entry_id)) try {
			let t = await xe(this.hass, this._config);
			e === this._loadVersion && this._receive(t);
		} catch (t) {
			e === this._loadVersion && this._setError(t);
		}
	}
	_receive(e) {
		if (e.schema_version > 1) {
			this._data ? (this._data = {
				...this._data,
				stale: !0
			}, this._error = void 0) : this._error = "integration_unavailable", this._loading = !1;
			return;
		}
		this._data = e;
		let t = this._config.mode === "active" ? this._selectedItem?.session_id : void 0;
		t && !e.items.some((e) => e.session_id === t) && (this._dialogClosing &&= !1, this._selectedItem = void 0, this._pendingTermination?.session_id === t && (this._pendingTermination = void 0)), this._retryAttempt = 0, this._error = void 0, this._loading = !1;
	}
	_setError(e) {
		let t = this._friendlyError(e instanceof Error ? e.message : String(e));
		this._data ? (this._data = {
			...this._data,
			stale: !0
		}, this._error = void 0) : this._error = t, this._loading = !1, this._scheduleRetry();
	}
	_scheduleRetry() {
		if (!this.isConnected || !this.hass || this._retryTimer) return;
		let e = Math.min(6e4, 2e3 * 2 ** Math.min(this._retryAttempt, 5));
		this._retryAttempt += 1, this._retryTimer = window.setTimeout(() => {
			this._retryTimer = void 0, this._connect();
		}, e);
	}
	render() {
		let e = this._filteredItems();
		if (this._error && !this._data || !this._loading && !this._error && !e.length && !this._config.show_empty) return L;
		let t = this._config.columns === "auto" ? "auto" : String(this._config.columns ?? 1);
		return F`
      <ha-card>
        ${this._config.show_header || this._config.show_count ? F`
          <div class="header">
            ${this._config.show_header ? F`<h2 class="title">${ke(this._config)}</h2>` : F`<span></span>`}
            ${this._config.show_count && this._data ? F`<span class="badge" aria-label="${e.length} items">${e.length}</span>` : L}
          </div>` : L}
        ${this._data?.stale ? F`<p class="stale">Showing the last successful update</p>` : L}
        ${this._loading ? this._renderLoading() : e.length ? F`${this._config.layout === "carousel" ? F`<div class="carousel-controls" aria-label="Carousel controls">
              <button @click=${() => this._scrollCarousel(-1)} aria-label="Previous items"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <button @click=${() => this._scrollCarousel(1)} aria-label="Next items"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
            </div>` : L}
            <div class="content ${this._config.layout ?? "grid"} ${t === "auto" ? "auto" : ""}" style=${`--columns:${t}`}>
              ${e.map((e) => this._renderItem(e))}
            </div>` : F`<div class="empty">${this._config.mode === "active" ? "Nothing is playing" : "No matching media"}</div>`}
      </ha-card>
      ${this._renderDetailsDialog()}
      ${this._renderTerminationDialog()}
    `;
	}
	_filteredItems() {
		let e = [...this._data?.items ?? []];
		if (this._config.mode === "recently_added" && this._config.recent_grouping !== "none" && (e = this._groupRecent(e)), this._config.mode === "active" && this._config.media_type !== "all" && (e = e.filter((e) => {
			let t = String(e.media?.type ?? "");
			return this._config.media_type === "music" ? [
				"track",
				"album",
				"artist"
			].includes(t) : this._config.media_type === "video" ? [
				"movie",
				"episode",
				"show",
				"clip",
				"live"
			].includes(t) : t === this._config.media_type;
		})), this._config.mode === "active" && this._config.sort_by !== "server") {
			let t = this._config.sort_by ?? "server", n = this._config.sort_direction === "descending" ? -1 : 1;
			e.sort((e, r) => {
				let [i, a] = {
					user: [e.user?.display_name, r.user?.display_name],
					title: [e.media?.full_title ?? e.media?.title, r.media?.full_title ?? r.media?.title],
					state: [e.state, r.state],
					progress: [e.playback?.progress_percent, r.playback?.progress_percent]
				}[t] ?? [0, 0];
				return typeof i == "number" || typeof a == "number" ? ((Number(i) || 0) - (Number(a) || 0)) * n : String(i ?? "").localeCompare(String(a ?? ""), this.hass?.locale?.language) * n;
			});
		}
		return e.slice(0, this._config.max_items);
	}
	_groupRecent(e) {
		let t = this._config.recent_grouping ?? "none", n = /* @__PURE__ */ new Map();
		for (let r of e) {
			let e = r, i = e.hierarchy ?? {}, a = e.type ?? "unknown", o = e.id ?? `${a}:${e.title}:${e.added_at}`;
			if ([
				"episode",
				"show",
				"season"
			].includes(a) && [
				"smart",
				"show",
				"season"
			].includes(t)) {
				let n = i.grandparent_id ?? i.show ?? e.title;
				o = t === "season" ? `tv:${n}:${i.season_number ?? i.season}` : `tv:${n}`;
			} else [
				"track",
				"album",
				"artist"
			].includes(a) && t === "smart" && (o = `music:${i.parent_id ?? i.album ?? i.artist ?? e.title}`);
			let s = n.get(String(o)) ?? [];
			s.push(r), n.set(String(o), s);
		}
		return [...n.values()].map((e) => {
			if (e.length === 1) return e[0];
			let n = e[0], r = n.hierarchy ?? {}, i = [
				"episode",
				"show",
				"season"
			].includes(n.type ?? ""), a = i ? r.show ?? n.title : r.album ?? r.artist ?? n.title, o = r.season_number ? `Season ${r.season_number}` : r.season;
			return {
				...n,
				type: i ? "show" : "album",
				title: a,
				full_title: a,
				hierarchy: {
					...r,
					episode: null,
					episode_number: null
				},
				_group_count: e.length,
				_group_label: `${e.length} new ${i ? e.length === 1 ? "episode" : "episodes" : e.length === 1 ? "item" : "items"}`,
				_group_subtitle: i && t === "season" ? o : i ? "New episodes" : r.artist
			};
		});
	}
	_renderItem(e) {
		if (this._config.mode === "active") return this._renderActive(e);
		if (this._config.mode === "users") return this._renderUser(e);
		let t = this._config.mode === "recently_added" ? e : e.media ?? {}, n = e._group_subtitle ?? this._mediaSubtitle(t), r = this._image(t.images), i = this._backgroundImage(t.images), a = this._config.mode === "history" ? Number(e.play_duration_seconds) || 0 : Number(t.duration_seconds) || 0;
		return F`
      <article data-item-id=${this._itemId(e)} class="item media-item ${t.type ?? "unknown"} ${this._artClass(r, i)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(i)}>
        ${this._openDetailsButton(e, t.full_title || t.title || "media")}
        ${r ? F`<img class="art" src=${r} alt="" loading="lazy" referrerpolicy="no-referrer">` : L}
        <div class="body">
          <div class="eyebrow"><span>${this._itemEyebrow(e, t)}</span></div>
          <h3 class="name">${t.title || t.full_title || "Untitled"}</h3>
          ${n ? F`<div class="subtitle">${n}</div>` : L}
          <div class="meta">
            ${t.year ? F`<span>${t.year}</span>` : L}
            ${a ? F`<span>${this._duration(a)}${this._config.mode === "history" ? " watched" : ""}</span>` : L}
            ${t.library?.name ? F`<span>${t.library.name}</span>` : L}
          </div>
          ${this._config.show_summary && t.summary ? F`<div class="summary">${t.summary}</div>` : L}
        </div>
      </article>`;
	}
	_renderUser(e) {
		let t = Number(e.total_duration_seconds) || 0, n = e.display_name || "Private user", r = String(n).trim().charAt(0).toUpperCase() || "?";
		return F`<article data-item-id=${this._itemId(e)} class="item user-item ${this._config.click_action === "details" ? "interactive" : ""}">
      ${this._openDetailsButton(e, `${n} user details`)}
      <div class="user-avatar" aria-hidden="true">${r}</div>
      <div class="body">
        <div class="eyebrow"><span>${e.last_seen_at ? `Last active ${this._date(e.last_seen_at)}` : "Plex activity summary"}</span></div>
        <h3 class="name">${n}</h3>
        <div class="user-stats">
          <span><strong>${e.total_plays ?? 0}</strong> plays</span>
          <span><strong>${this._duration(t)}</strong> watched</span>
          <span><strong>${e.completion_percent ?? 0}%</strong> completion</span>
        </div>
        <div class="user-breakdown">
          ${e.movie_plays ? F`<span><ha-icon icon="mdi:movie-open"></ha-icon>${e.movie_plays} movies</span>` : L}
          ${e.tv_plays ? F`<span><ha-icon icon="mdi:television-classic"></ha-icon>${e.tv_plays} episodes</span>` : L}
          ${e.direct_play_count ? F`<span><ha-icon icon="mdi:play-circle-outline"></ha-icon>${e.direct_play_count} direct plays</span>` : L}
          ${e.transcode_count ? F`<span><ha-icon icon="mdi:swap-horizontal"></ha-icon>${e.transcode_count} transcodes</span>` : L}
        </div>
        <div class="user-favourites optional">
          ${e.popular_movie ? F`<span><small>Favourite movie</small>${e.popular_movie}</span>` : L}
          ${e.popular_show ? F`<span><small>Favourite show</small>${e.popular_show}</span>` : L}
          ${e.most_used_device ? F`<span><small>Most-used player</small>${e.most_used_device}</span>` : L}
          ${e.preferred_day ? F`<span><small>Usually watches</small>${e.preferred_day} ${e.preferred_time ?? ""}</span>` : L}
        </div>
      </div>
    </article>`;
	}
	_renderLoading() {
		return F`<div class="content grid auto loading-grid" aria-label="Loading Tautulli media" aria-busy="true">
      ${[0, 1].map(() => F`<div class="item skeleton" aria-hidden="true">
        <div class="skeleton-art"></div>
        <div class="skeleton-body"><span></span><span></span><span></span></div>
      </div>`)}
    </div>`;
	}
	_renderActive(e) {
		if (this._config.style_preset === "classic") return this._renderClassicActive(e);
		let t = e.media ?? {}, n = this._image(e.images), r = this._backgroundImage(e.images), i = Math.max(0, Math.min(100, Number(e.playback?.progress_percent) || 0)), a = e.state === "paused" ? "var(--tas-paused-color)" : e.state === "buffering" ? "var(--tas-buffering-color)" : t.type === "track" ? "#1db954" : "var(--tas-playing-color)", o = this._canTerminate(e) && (this._config.click_action !== "details" || ["card", "both"].includes(this._config.termination_location ?? "popup"));
		return F`
      <article data-item-id=${this._itemId(e)} class="item ${this._artClass(n, r)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(r, a)}>
        ${this._openDetailsButton(e, t.full_title || t.title || "stream")}
        ${n ? F`<img class="art" src=${n} alt="" loading="lazy" referrerpolicy="no-referrer">` : L}
        <div class="body">
          <div class="eyebrow">
            <span class="state ${e.state}">${e.state}${e.state === "paused" && this._config.show_pause_duration ? ` · ${this._elapsedDuration(this._pausedSeconds(e))}` : ""}</span>
            ${this._config.show_user && e.user?.display_name ? F`<span>${e.user.display_name}</span>` : L}
          </div>
          <h3 class="name">${t.full_title || t.title || "Untitled"}</h3>
          ${this._mediaSubtitle(t) ? F`<div class="subtitle">${this._mediaSubtitle(t)}</div>` : L}
          ${this._config.show_device && e.client ? F`<div class="meta"><span>${e.client.player || e.client.product || e.client.device}</span></div>` : L}
          ${this._config.show_quality ? F`<div class="details optional">
            ${e.quality?.decision ? F`<span>${e.quality.decision}</span>` : L}
            ${e.quality?.video_resolution ? F`<span>${e.quality.video_resolution}</span>` : L}
            ${e.quality?.bandwidth_kbps ? F`<span>${this._bandwidth(e.quality.bandwidth_kbps)}</span>` : L}
          </div>` : L}
          ${this._config.show_progress ? F`<div class="modern-progress-row">
            <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(i)} style=${`--progress:${i}%`}></div>
            ${this._config.show_remaining && e.playback?.remaining_ms ? F`<span class="modern-progress-remaining">${this._duration(Math.ceil(e.playback.remaining_ms / 1e3))} remaining</span>` : L}
          </div>` : L}
        </div>
        ${o ? F`<button class="terminate" @click=${(t) => this._openTerminationDialog(e, t)} title="Terminate stream" aria-label="Terminate stream"><ha-icon icon="mdi:stop-circle-outline"></ha-icon></button>` : L}
      </article>`;
	}
	_renderClassicActive(e) {
		let t = e.media ?? {}, n = [
			"track",
			"album",
			"artist"
		].includes(t.type ?? ""), r = this._image(e.images), i = this._backgroundImage(e.images), a = Math.max(0, Math.min(100, Number(e.playback?.progress_percent) || 0)), o = e.state === "paused" ? "var(--tas-paused-color)" : e.state === "buffering" ? "var(--tas-buffering-color)" : n ? "#1db954" : "var(--tas-playing-color)", s = t.hierarchy ?? {}, c = n ? [s.artist, s.album].filter(Boolean).join(" — ") : t.full_title || t.title || "Untitled", l = n ? t.title || t.full_title : "", u = n ? "" : t.type === "episode" ? `S${s.season_number ?? "–"} · E${s.episode_number ?? s.episode ?? "–"}` : t.year ? `(${t.year})` : "", d = [e.client?.product, e.client?.player].filter(Boolean).join(" — ") || e.client?.device, f = [e.quality?.decision, e.quality?.video_resolution].filter(Boolean).join(" — "), p = [
			e.quality?.audio_codec,
			e.quality?.audio_channel_layout,
			e.quality?.audio_bitrate_kbps ? `${e.quality.audio_bitrate_kbps} Kbps` : void 0
		].filter(Boolean).join(" · "), m = this._canTerminate(e) && (this._config.click_action !== "details" || ["card", "both"].includes(this._config.termination_location ?? "popup"));
		return F`
      <article data-item-id=${this._itemId(e)} class="classic-item ${n ? "music" : "video"} ${e.state} ${this._artClass(r, i)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(i, o)}>
        ${this._openDetailsButton(e, t.full_title || t.title || "stream")}
        ${r ? F`<img class="classic-art" src=${r} alt="" loading="lazy" referrerpolicy="no-referrer">` : i ? L : F`<div class="classic-art placeholder"><ha-icon icon="${n ? "mdi:music" : "mdi:movie-open"}"></ha-icon></div>`}
        <div class="classic-body">
          <div class="classic-top">
            ${this._config.show_device && d ? F`<span>${d}</span>` : F`<span></span>`}
            ${this._config.show_user && e.user?.display_name ? F`<strong>${e.user.display_name}</strong>` : L}
          </div>
          <h3 class="classic-title">
            <ha-icon icon=${this._stateIcon(e.state, n)}></ha-icon>
            <span>${c}</span>
          </h3>
          ${n && l ? F`<div class="classic-track"><ha-icon icon="mdi:music-note"></ha-icon><span>${l}</span></div>` : L}
          <div class="classic-info">
            ${this._config.show_media_details && u ? F`<span class="media-detail"><ha-icon icon=${t.type === "episode" ? "mdi:television-classic" : "mdi:filmstrip"}></ha-icon>${u}</span>` : F`<span></span>`}
            ${this._config.show_eta && this._eta(e) ? F`<span>ETA: ${this._eta(e)}</span>` : L}
          </div>
          ${this._config.show_progress ? F`
            <div class="classic-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(a)} style=${`--progress:${a}%`}>
              ${this._config.show_state ? F`<span class="progress-state">${this._stateText(e, n)}</span>` : L}
              ${this._config.show_progress_percent ? F`<span class="progress-percent">${Math.round(a)}%</span>` : L}
              ${this._config.show_remaining && e.playback?.remaining_ms ? F`<span class="progress-remaining"><span class="remaining-label">Remaining - </span>${this._duration(Math.ceil(e.playback.remaining_ms / 1e3))}</span>` : L}
            </div>` : L}
          <div class="classic-bottom">
            ${n && this._config.show_audio_quality && p ? F`<span>${p}</span>` : !n && this._config.show_quality && f ? F`<span>${f}</span>` : F`<span></span>`}
            <span>
              ${this._config.show_bandwidth && e.quality?.bandwidth_kbps ? F`Bandwidth: ${this._bandwidth(e.quality.bandwidth_kbps)}` : L}
            </span>
          </div>
        </div>
        ${m ? F`<button class="terminate" @click=${(t) => this._openTerminationDialog(e, t)} title="Terminate stream" aria-label="Terminate stream"><ha-icon icon="mdi:stop-circle-outline"></ha-icon></button>` : L}
      </article>`;
	}
	_stateIcon(e, t) {
		return e === "paused" ? "mdi:pause" : e === "buffering" ? "mdi:loading" : t ? "mdi:music-circle" : "mdi:play";
	}
	_stateText(e, t) {
		let n = [e.state || "unknown"];
		e.state === "paused" && this._config.show_pause_duration && n.push(this._elapsedDuration(this._pausedSeconds(e)));
		let r = e.media.hierarchy?.track_number ?? e.media.hierarchy?.track;
		return t && this._config.show_track_number && r && n.push(`track ${r}`), n.join(" · ");
	}
	_artClass(e, t) {
		return t ? `${e ? "art-left " : ""}background-art` : e ? this._config.artwork_placement === "right" ? "art-right" : "art-left" : "no-art";
	}
	_backgroundStyle(e, t) {
		let n = [];
		return t && n.push(`--state-color:${t}`), e && (n.push(`--tas-background-image:url("${e.replaceAll("\"", "")}")`), n.push(`--tas-backdrop-opacity:${(this._config.backdrop_opacity ?? 35) / 100}`)), n.join(";");
	}
	_openDetails(e) {
		if (this._config.click_action === "details") {
			if (this._dialogClosing || this._selectedItem === e) return;
			this._selectedItem = e, this._dialogOpenedAt = Date.now(), this._lockBodyScroll(), this.requestUpdate();
		}
	}
	_openDetailsButton(e, t) {
		return this._config.click_action === "details" ? F`<button class="open-details" type="button" data-detail-id=${this._itemId(e)} aria-label="Open details for ${String(t)}"></button>` : L;
	}
	_itemId(e) {
		return String(e.id ?? e.session_id ?? e.media?.id ?? `${e.rank ?? ""}:${e.display_name ?? e.media?.title ?? e.title ?? "item"}`);
	}
	_lockBodyScroll() {
		if (this._scrollLockCount === 0 && document.body.scrollHeight > window.innerHeight) {
			let e = window.innerWidth - document.documentElement.clientWidth;
			document.body.style.overflow = "hidden", e > 0 && (document.body.style.paddingRight = `${e}px`);
		}
		this._scrollLockCount += 1;
	}
	_unlockBodyScroll() {
		this._scrollLockCount = Math.max(0, this._scrollLockCount - 1), this._scrollLockCount === 0 && (document.body.style.overflow = "", document.body.style.paddingRight = "");
	}
	_detailsKeydown(e) {
		if (e.key === "Escape") {
			e.preventDefault(), this._closeDetails();
			return;
		}
		if (e.key !== "Tab") return;
		let t = [...this.renderRoot.querySelectorAll(".details-dialog button:not(:disabled), .details-dialog [href], .details-dialog [tabindex]:not([tabindex='-1'])")], n = t[0], r = t.at(-1), i = this.renderRoot instanceof ShadowRoot ? this.renderRoot.activeElement : document.activeElement;
		e.shiftKey && i === n ? (e.preventDefault(), r?.focus()) : !e.shiftKey && i === r && (e.preventDefault(), n?.focus());
	}
	_scrollCarousel(e) {
		let t = this.renderRoot.querySelector(".content.carousel");
		t && t.scrollBy({
			left: e * Math.max(240, t.clientWidth * .82),
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
		});
	}
	_canTerminate(e) {
		return !!(this._config.allow_termination && this._data?.capabilities.stream_termination && e.session_id);
	}
	_renderDetailsDialog() {
		let e = this._selectedItem;
		if (!e) return L;
		let t = this._data?.items.find((t) => this._itemId(t) === this._itemId(e)) ?? e;
		return this._config.mode === "active" ? this._renderActiveDetails(t) : this._config.mode === "users" ? this._renderUserDetails(t) : this._renderMediaDetails(t);
	}
	_renderDialogShell(e, t, n, r = !1) {
		let i = n ? `--details-backdrop:url("${n.replaceAll("\"", "")}");` : "", a = this._config.popup_backdrop_dim ?? 58, o = this._config.popup_backdrop_blur ?? 0, s = `--scrim-color:rgb(0 0 0 / ${a}%);--scrim-blur:${o ? `blur(${o}px)` : "none"};--dialog-animation-duration:${this._config.popup_animation_duration ?? 220}ms;`, c = this._config.popup_background, l = `${i}--dialog-animation-duration:${this._config.popup_animation_duration ?? 220}ms;--dialog-close-duration:${this._config.popup_close_animation_duration ?? 200}ms;--cinematic-art-opacity:${(this._config.popup_cinematic_art ?? 45) / 100};${c ? `background:${c};` : ""}`;
		return F`<div class="dialog-backdrop ${this._dialogClosing ? "closing" : ""}" style=${s} @click=${this._backdropClickClose} @keydown=${this._detailsKeydown}>
      <section class="details-dialog anim-${this._config.popup_animation ?? "scale"} ${this._dialogClosing ? "closing" : ""} popup-${this._config.popup_style ?? "clean"} popup-content-${this._config.popup_content_style ?? "open"} popup-width-${this._config.popup_width ?? "standard"} ${n ? "has-backdrop" : ""}" style=${l} role="dialog" aria-modal="true" aria-labelledby="details-title">
        <button class="dialog-close" @click=${this._closeDetails} aria-label="Close details"><ha-icon icon="mdi:close"></ha-icon></button>
        <div class="details-content">${r ? L : F`<h2 id="details-title">${e}</h2>`}${t}</div>
      </section>
    </div>`;
	}
	_renderActiveDetails(e) {
		let t = e.media ?? {}, n = Math.max(0, Math.min(100, Number(e.playback?.progress_percent) || 0)), r = t.hierarchy ?? {}, i = this._mediaSubtitle(t), a = this._config.popup_show_artwork ? e.images?.poster_url ?? void 0 : void 0, o = this._config.popup_show_artwork ? e.images?.backdrop_url ?? void 0 : void 0, s = this._canTerminate(e) && ["popup", "both"].includes(this._config.termination_location ?? "popup"), c = s && (this._config.termination_popup_placement ?? "footer") === "top", l = t.full_title || t.title || "Stream details", u = F`
      <section class="popup-summary"><div class="details-hero ${a ? "with-poster" : ""}">
        ${a ? F`<img src=${a} alt="" loading="lazy" referrerpolicy="no-referrer">` : L}
        ${c ? F`<div class="details-top-action">${this._popupTerminationButton(e)}</div>` : L}
        <div class="details-primary">
          <div class="details-heading-line">
            <h2 id="details-title" class="details-inline-title">${l}</h2>
            ${this._config.popup_summary_show_user && e.user?.display_name ? F`<span class="details-summary-user"><ha-icon icon="mdi:account"></ha-icon>${e.user.display_name}</span>` : L}
          </div>
          <div class="details-chips">${["paused", "buffering"].includes(e.state) ? F`<span class="state ${e.state}">${e.state}</span>` : L}${t.type ? F`<span>${t.type}</span>` : L}${t.year ? F`<span>${t.year}</span>` : L}</div>
          ${i ? F`<p>${i}</p>` : L}
          ${this._config.popup_show_summary && t.summary ? F`<p class="details-summary ${this._config.popup_summary_lines === 0 ? "" : "compact"}" style=${`--summary-lines:${this._config.popup_summary_lines ?? 3}`}>${t.summary}</p>` : L}
          ${this._config.popup_show_progress ? F`<div class="details-progress"><span style=${`width:${n}%`}></span></div>
          <div class="details-progress-label"><span>${Math.round(n)}% watched</span>${e.playback?.remaining_ms ? F`<span>${this._duration(Math.ceil(e.playback.remaining_ms / 1e3))} remaining</span>` : L}</div>` : L}
        </div>
      </div></section>
      <h3 class="details-section-title">Stream details</h3>
      <div class="details-grid">
        ${(this._config.popup_detail_order ?? J).map((n) => this._config[Me[n]] ? this._renderActiveDetailField(n, e, t, r) : L)}
      </div>
      ${s && !c ? F`<div class="details-actions">${this._popupTerminationButton(e)}</div>` : L}`;
		return this._renderDialogShell(l, u, o, !0);
	}
	_renderActiveDetailField(e, t, n, r) {
		switch (e) {
			case "user": return this._detailValue("Plex user", t.user?.display_name);
			case "player": return this._detailValue("Player", [t.client?.product, t.client?.player].filter(Boolean).join(" · "));
			case "device": return this._detailValue("Device", t.client?.device);
			case "eta": return this._detailValue("Estimated finish", this._eta(t));
			case "pause_duration": return t.state === "paused" ? this._detailValue("Paused for", this._elapsedDuration(this._pausedSeconds(t))) : L;
			case "playback_decision": return this._detailValue("Playback", t.quality?.decision);
			case "video_quality": return this._detailValue("Video", t.quality?.video_resolution);
			case "audio_quality": return this._detailValue("Audio", [t.quality?.audio_codec, t.quality?.audio_channel_layout].filter(Boolean).join(" · "));
			case "bandwidth": return this._detailValue("Bandwidth", t.quality?.bandwidth_kbps ? this._bandwidth(t.quality.bandwidth_kbps) : void 0);
			case "episode": return this._detailValue("Season / episode", n.type === "episode" ? `S${r.season_number ?? "–"} · E${r.episode_number ?? r.episode ?? "–"}` : void 0);
			case "year": return this._detailValue("Year", n.year);
			case "content_rating": return this._detailValue("Content rating", n.content_rating);
			case "rating": return this._detailValue("Rating", n.rating);
			case "audience_rating": return this._detailValue("Audience rating", n.audience_rating);
			case "genres": return this._detailValue("Genres", n.genres?.join(" · "));
			case "studio": return this._detailValue("Studio", n.studio);
		}
	}
	_popupTerminationButton(e) {
		let t = (this._config.termination_button_style ?? "label") === "icon";
		return F`<button class="danger ${t ? "icon-only" : ""}" @click=${(t) => this._terminateFromDetails(e, t)} title="Terminate stream" aria-label="Terminate stream"><ha-icon icon="mdi:stop-circle-outline"></ha-icon>${t ? L : "Terminate stream"}</button>`;
	}
	_renderUserDetails(e) {
		let t = F`
      <section class="popup-summary"><div class="user-popup-summary">
        <div class="user-avatar large" aria-hidden="true">${String(e.display_name || "?").charAt(0).toUpperCase()}</div>
        <div><strong>${e.total_plays ?? 0} plays</strong><span>${this._duration(Number(e.total_duration_seconds) || 0)} watched</span></div>
      </div></section>
      <h3 class="details-section-title">User details</h3>
      <div class="details-grid">
        ${this._config.popup_show_playback_breakdown ? F`
          ${this._detailValue("Movies", e.movie_plays)}
          ${this._detailValue("TV episodes", e.tv_plays)}
          ${this._detailValue("Completion", e.completion_percent === void 0 ? void 0 : `${e.completion_percent}%`)}
          ${this._detailValue("Transcoded", e.transcode_percent === void 0 ? void 0 : `${e.transcode_percent}%`)}
          ${this._detailValue("Direct plays", e.direct_play_count)}
          ${this._detailValue("Direct streams", e.direct_stream_count)}
          ${this._detailValue("Transcodes", e.transcode_count)}
        ` : L}
        ${this._config.popup_show_favourites ? F`${this._detailValue("Favourite movie", e.popular_movie)}${this._detailValue("Favourite show", e.popular_show)}` : L}
        ${this._config.popup_show_habits ? F`${this._detailValue("Most-used player", e.most_used_device)}${this._detailValue("Usually watches", [e.preferred_day, e.preferred_time].filter(Boolean).join(" "))}` : L}
        ${this._config.popup_show_recent_activity ? this._detailValue("Last active", e.last_seen_at ? this._date(e.last_seen_at) : void 0) : L}
      </div>`;
		return this._renderDialogShell(e.display_name || "Private user", t);
	}
	_renderMediaDetails(e) {
		let t = this._config.mode === "recently_added" ? e : e.media ?? {}, n = this._config.popup_show_artwork ? t.images?.poster_url ?? void 0 : void 0, r = this._config.popup_show_artwork ? t.images?.backdrop_url ?? void 0 : void 0, i = F`
      <section class="popup-summary media-summary">${n ? F`<img class="details-media-poster" src=${n} alt="" loading="lazy" referrerpolicy="no-referrer">` : L}
      ${this._mediaSubtitle(t) ? F`<p class="details-subtitle">${this._mediaSubtitle(t)}</p>` : L}
      ${this._config.popup_show_summary && t.summary ? F`<p class="details-summary">${t.summary}</p>` : L}</section>
      <h3 class="details-section-title">Media details</h3>
      <div class="details-grid">
        ${this._config.popup_show_media_type ? this._detailValue("Media type", t.type) : L}
        ${this._config.popup_show_year ? this._detailValue("Year", t.year) : L}
        ${this._config.popup_show_duration ? this._detailValue("Duration", t.duration_seconds ? this._duration(t.duration_seconds) : void 0) : L}
        ${this._config.popup_show_library ? this._detailValue("Library", t.library?.name) : L}
        ${this._config.popup_show_content_rating ? this._detailValue("Content rating", t.content_rating) : L}
        ${this._config.popup_show_rating ? this._detailValue("Rating", t.rating) : L}
        ${this._config.popup_show_audience_rating ? this._detailValue("Audience rating", t.audience_rating) : L}
        ${this._config.popup_show_genres ? this._detailValue("Genres", t.genres?.join(" · ")) : L}
        ${this._config.popup_show_studio ? this._detailValue("Studio", t.studio) : L}
        ${this._config.mode === "popular" ? this._detailValue("Rank", e.rank ? `#${e.rank}` : void 0) : L}
        ${this._config.mode === "popular" ? this._detailValue("Plays", e.total_plays) : L}
        ${this._config.mode === "history" && this._config.popup_show_user ? this._detailValue("Plex user", e.user?.display_name) : L}
        ${this._config.mode === "history" ? this._detailValue("Played", e.started_at ? this._date(e.started_at) : void 0) : L}
      </div>`;
		return this._renderDialogShell(t.full_title || t.title || "Media details", i, r);
	}
	_detailValue(e, t) {
		return t == null || t === "" || t === 0 ? L : F`<div class="detail-value"><small>${e}</small><span>${String(t)}</span></div>`;
	}
	_terminateFromDetails(e, t) {
		this._openTerminationDialog(e, t);
	}
	_image(e) {
		if (this._config.artwork !== "none" && this._config.artwork !== "backdrop" && (this._config.artwork !== "poster" || this._config.artwork_placement !== "background")) return e?.poster_url ?? void 0;
	}
	_backgroundImage(e) {
		if (this._config.artwork !== "none") {
			if (["backdrop", "both"].includes(this._config.artwork ?? "poster")) return e?.backdrop_url ?? e?.poster_url ?? void 0;
			if (this._config.artwork_placement === "background") return e?.poster_url ?? e?.backdrop_url ?? void 0;
		}
	}
	_mediaSubtitle(e) {
		let t = e.hierarchy ?? {};
		if (["track", "album"].includes(e.type ?? "")) return [t.artist, t.album].filter(Boolean).join(" — ");
		if (["episode", "show"].includes(e.type ?? "")) {
			let e = t.season_number && t.episode ? `S${t.season_number} · E${t.episode}` : "";
			return [t.show, e].filter(Boolean).join(" — ");
		}
		return "";
	}
	_itemEyebrow(e, t) {
		if (e._group_label) return String(e._group_label);
		if (this._config.mode === "popular") {
			let t = this._config.metric === "duration" ? this._duration(e.total_duration_seconds ?? 0) : `${e.total_plays ?? 0} plays`;
			return `#${e.rank ?? "–"} · ${t}`;
		}
		return this._config.mode === "history" ? [e.user?.display_name, this._date(e.started_at)].filter(Boolean).join(" · ") : [t.type, this._date(t.added_at)].filter(Boolean).join(" · ");
	}
	_duration(e) {
		let t = Math.max(0, Math.ceil(e / 60));
		return t < 60 ? `${t}m` : `${Math.floor(t / 60)}h ${t % 60}m`;
	}
	_elapsedDuration(e) {
		let t = Math.max(0, Math.floor(e)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = t % 60;
		return n ? `${n}h ${r}m ${i}s` : r ? `${r}m ${i}s` : `${i}s`;
	}
	_pausedSeconds(e) {
		let t = this._pauseAnchors.get(this._itemId(e));
		return t ? t.baseSeconds + Math.max(0, Math.floor((this._pauseClock - t.receivedAt) / 1e3)) : Math.max(0, Math.floor(e.playback?.paused_seconds ?? 0));
	}
	_syncPauseClock() {
		let e = Date.now(), t = (this._data?.items ?? []).filter((e) => e?.state === "paused");
		this._pauseAnchors = new Map(t.map((t) => [this._itemId(t), {
			baseSeconds: Math.max(0, Math.floor(t.playback?.paused_seconds ?? 0)),
			receivedAt: e
		}])), this._pauseClock = e, t.length && !this._pauseTimer ? this._pauseTimer = window.setInterval(() => {
			this._pauseClock = Date.now();
		}, 1e3) : !t.length && this._pauseTimer && (window.clearInterval(this._pauseTimer), this._pauseTimer = void 0);
	}
	_eta(e) {
		let t = e.playback?.eta?.trim();
		if (t) return t;
		let n = Number(e.playback?.remaining_ms) || 0;
		if (n <= 0) return "";
		let r = Date.parse(this._data?.generated_at ?? ""), i = Number.isNaN(r) ? Date.now() : r;
		return new Intl.DateTimeFormat(this.hass?.locale?.language, {
			hour: "numeric",
			minute: "2-digit"
		}).format(new Date(i + n));
	}
	_bandwidth(e) {
		return e >= 1e3 ? `${(e / 1e3).toFixed(1)} Mbps` : `${e} Kbps`;
	}
	_date(e) {
		if (!e) return "";
		let t = new Date(e);
		return Number.isNaN(t.valueOf()) ? "" : new Intl.DateTimeFormat(this.hass?.locale?.language, { dateStyle: "medium" }).format(t);
	}
	_friendlyError(e) {
		return e.includes("history_disabled") ? "Watch history is disabled in the integration’s Dashboard card access settings." : e.includes("unauthorized") ? "Administrator permission is required for this view." : e;
	}
	_openTerminationDialog(e, t) {
		t.stopPropagation(), this._terminationTrigger = t.currentTarget, this._pendingTermination = e, this._dialogOpenedAt = Date.now();
	}
	_closeTerminationDialog() {
		this._terminating || (this._pendingTermination = void 0, requestAnimationFrame(() => this._terminationTrigger?.focus()));
	}
	_dialogKeydown(e) {
		if (e.key === "Escape") {
			e.preventDefault(), this._closeTerminationDialog();
			return;
		}
		if (e.key !== "Tab") return;
		let t = [...this.renderRoot.querySelectorAll(".dialog-actions button:not(:disabled)")];
		if (!t.length) return;
		let n = t[0], r = t.at(-1), i = this.renderRoot instanceof ShadowRoot ? this.renderRoot.activeElement : document.activeElement;
		e.shiftKey && i === n ? (e.preventDefault(), r?.focus()) : !e.shiftKey && i === r && (e.preventDefault(), n?.focus());
	}
	_renderTerminationDialog() {
		let e = this._pendingTermination;
		if (!e) return L;
		let t = e.media.full_title || e.media.title || "Untitled stream", n = [
			e.user?.display_name,
			e.client?.product,
			e.client?.player
		].filter(Boolean).join(" · ");
		return F`<div class="dialog-backdrop" tabindex="-1" @click=${this._backdropTerminationClose} @keydown=${this._dialogKeydown}>
      <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="terminate-title" aria-describedby="terminate-description">
        <div class="dialog-content">
          <div class="dialog-icon"><ha-icon icon="mdi:stop-circle-outline"></ha-icon></div>
          <h2 id="terminate-title">Terminate this stream?</h2>
          <p id="terminate-description">Playback will stop immediately on the selected Plex player.</p>
          <div class="dialog-stream"><strong>${t}</strong>${n ? F`<span>${n}</span>` : L}</div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-cancel" ?disabled=${this._terminating} @click=${this._closeTerminationDialog}>Cancel</button>
          <button class="dialog-confirm" ?disabled=${this._terminating} @click=${() => this._confirmTermination(e)}>${this._terminating ? "Terminating…" : "Terminate stream"}</button>
        </div>
      </section>
    </div>`;
	}
	async _confirmTermination(e) {
		if (!(!this.hass || !this._config.entry_id || !e.session_id)) {
			this._terminating = !0;
			try {
				let t = await we(this.hass, this._config.entry_id, e.session_id);
				this._pendingTermination = void 0, this.dispatchEvent(new CustomEvent("hass-notification", {
					bubbles: !0,
					composed: !0,
					detail: { message: t.succeeded ? "Stream terminated" : "Tautulli rejected the request" }
				}));
			} catch (e) {
				this._setError(e);
			} finally {
				this._terminating = !1;
			}
		}
	}
}, Pe = [
	"recently_added",
	"popular",
	"users",
	"history"
];
function X(e, t) {
	return !(e?.modes && !e.modes.includes(t.mode) || e?.when && !e.when(t));
}
var Z = (e) => ["poster", "both"].includes(e.config.artwork ?? "poster"), Fe = (e) => ["backdrop", "both"].includes(e.config.artwork ?? "poster"), Q = (e) => e.config.click_action === "details", Ie = (e) => (e.config.popup_animation ?? "scale") !== "none", Le = (e) => !!e.config.popup_show_summary, $ = (e) => !!e.data.capabilities?.stream_termination, Re = (e) => $(e) && !!e.config.allow_termination, ze = (e) => Re(e) && Q(e) && ["popup", "both"].includes(e.config.termination_location ?? "popup"), Be = [
	{
		id: "content-source",
		summary: "Content and source",
		description: "Choose the server and the information this card should display.",
		fields: [
			{
				kind: "select",
				key: "entry_id",
				label: "Tautulli server",
				options: (e) => e.data.entries.map((e) => ({
					value: e.entry_id,
					label: e.name
				}))
			},
			{
				kind: "select",
				key: "mode",
				label: "View",
				options: (e) => {
					let t = e.data.capabilities;
					return [
						{
							value: "active",
							label: "Active streams"
						},
						...t?.recently_added === !1 ? [] : [{
							value: "recently_added",
							label: "Recently added"
						}],
						...t?.home_stats === !1 ? [] : [{
							value: "popular",
							label: "Popular and top media"
						}],
						...t?.user_stats === !1 ? [] : [{
							value: "users",
							label: "Plex user activity"
						}],
						...t?.history === !1 ? [] : [{
							value: "history",
							label: "Watch history (administrators)"
						}]
					];
				}
			},
			{
				kind: "text",
				key: "title",
				label: "Title"
			},
			{
				kind: "select",
				key: "media_type",
				label: "Media",
				modes: ["active"],
				options: [
					{
						value: "all",
						label: "All active streams"
					},
					{
						value: "video",
						label: "Movies and TV"
					},
					{
						value: "music",
						label: "Music"
					}
				]
			},
			{
				kind: "select",
				key: "media_type",
				label: "Media",
				modes: ["recently_added"],
				options: [
					{
						value: "all",
						label: "All media"
					},
					{
						value: "movie",
						label: "Movies"
					},
					{
						value: "show",
						label: "TV"
					},
					{
						value: "artist",
						label: "Music"
					}
				]
			},
			{
				kind: "select",
				key: "recent_grouping",
				label: "Group additions",
				modes: ["recently_added"],
				options: [
					{
						value: "none",
						label: "Show every item"
					},
					{
						value: "smart",
						label: "Smart TV and music grouping"
					},
					{
						value: "show",
						label: "Group TV by show"
					},
					{
						value: "season",
						label: "Group TV by season"
					}
				]
			},
			{
				kind: "select",
				key: "section_id",
				label: "Library",
				modes: Pe,
				options: (e) => [{
					value: "",
					label: "All libraries"
				}, ...e.data.libraries]
			},
			{
				kind: "select",
				key: "user_id",
				label: "Plex user",
				modes: ["popular", "history"],
				options: (e) => [{
					value: "",
					label: "All users"
				}, ...e.data.users]
			},
			{
				kind: "select",
				key: "stat_id",
				label: "Ranking",
				modes: ["popular"],
				options: [
					{
						value: "popular_movies",
						label: "Popular movies"
					},
					{
						value: "top_movies",
						label: "Top movies"
					},
					{
						value: "popular_tv",
						label: "Popular TV"
					},
					{
						value: "top_tv",
						label: "Top TV"
					},
					{
						value: "popular_music",
						label: "Popular music"
					},
					{
						value: "top_music",
						label: "Top music"
					},
					{
						value: "top_users",
						label: "Top users"
					},
					{
						value: "top_libraries",
						label: "Top libraries"
					},
					{
						value: "top_platforms",
						label: "Top platforms"
					},
					{
						value: "last_watched",
						label: "Last watched"
					},
					{
						value: "most_concurrent",
						label: "Most concurrent"
					}
				]
			},
			{
				kind: "select",
				key: "metric",
				label: "Rank by",
				modes: ["popular"],
				options: [{
					value: "plays",
					label: "Play count"
				}, {
					value: "duration",
					label: "Watch duration"
				}]
			},
			{
				kind: "number",
				key: "time_range",
				label: "Time range",
				min: 1,
				max: 3650,
				suffix: "days",
				modes: ["popular"]
			}
		]
	},
	{
		id: "card-appearance",
		groupTitle: "Card settings",
		summary: "Card layout and appearance",
		description: "Choose a ready-made look, then adjust only the layout and artwork settings that apply.",
		fields: [
			{
				kind: "block",
				block: "recipes"
			},
			{
				kind: "select",
				key: "style_preset",
				label: "Visual style",
				options: [
					{
						value: "classic",
						label: "Classic Tautulli"
					},
					{
						value: "modern",
						label: "Modern Home Assistant"
					},
					{
						value: "minimal",
						label: "Minimal"
					}
				]
			},
			{
				kind: "select",
				key: "layout",
				label: "Layout style",
				options: [
					{
						value: "grid",
						label: "Responsive grid"
					},
					{
						value: "list",
						label: "Single-column list"
					},
					{
						value: "carousel",
						label: "Poster shelf / carousel"
					}
				]
			},
			{
				kind: "select",
				key: "density",
				label: "Density",
				options: [
					{
						value: "compact",
						label: "Compact"
					},
					{
						value: "comfortable",
						label: "Comfortable"
					},
					{
						value: "detailed",
						label: "Detailed"
					}
				]
			},
			{
				kind: "select",
				key: "columns",
				label: "Columns",
				when: (e) => e.config.layout === "grid",
				options: [
					{
						value: "auto",
						label: "Automatic"
					},
					{
						value: "1",
						label: "1"
					},
					{
						value: "2",
						label: "2"
					},
					{
						value: "3",
						label: "3"
					},
					{
						value: "4",
						label: "4"
					}
				]
			},
			{
				kind: "select",
				key: "sort_by",
				label: "Sort active streams by",
				modes: ["active"],
				options: [
					{
						value: "server",
						label: "Tautulli order"
					},
					{
						value: "user",
						label: "Plex user"
					},
					{
						value: "title",
						label: "Media title"
					},
					{
						value: "state",
						label: "Playback state"
					},
					{
						value: "progress",
						label: "Progress"
					}
				]
			},
			{
				kind: "select",
				key: "sort_direction",
				label: "Sort direction",
				modes: ["active"],
				when: (e) => (e.config.sort_by ?? "server") !== "server",
				options: [{
					value: "ascending",
					label: "Ascending"
				}, {
					value: "descending",
					label: "Descending"
				}]
			},
			{
				kind: "select",
				key: "artwork",
				label: "Artwork display",
				options: [
					{
						value: "poster",
						label: "Poster / cover"
					},
					{
						value: "backdrop",
						label: "Backdrop"
					},
					{
						value: "both",
						label: "Poster / cover with backdrop"
					},
					{
						value: "none",
						label: "None"
					}
				]
			},
			{
				kind: "select",
				key: "container_style",
				label: "Outer card background",
				options: [
					{
						value: "auto",
						label: "Automatic for style"
					},
					{
						value: "surface",
						label: "Home Assistant surface"
					},
					{
						value: "transparent",
						label: "Transparent (items only)"
					}
				]
			},
			{
				kind: "number",
				key: "max_items",
				label: (e) => e.mode === "active" ? "Maximum active streams" : "Maximum items",
				min: 1,
				max: 50,
				suffix: ""
			}
		],
		subsections: [{
			summary: "Artwork adjustments",
			className: "inline-advanced",
			applies: { when: (e) => (e.config.artwork ?? "poster") !== "none" },
			description: "Recommended values come from the selected look. These controls only affect the artwork currently in use.",
			fields: [
				{
					kind: "select",
					key: "artwork_placement",
					label: "Artwork position",
					when: Z,
					options: [
						{
							value: "left",
							label: "Left of content"
						},
						{
							value: "right",
							label: "Right of content"
						},
						{
							value: "background",
							label: "Behind content (background)"
						}
					]
				},
				{
					kind: "select",
					key: "artwork_aspect",
					label: "Poster / cover shape",
					when: Z,
					options: [
						{
							value: "auto",
							label: "Automatic for media"
						},
						{
							value: "poster",
							label: "Poster (2:3)"
						},
						{
							value: "square",
							label: "Square (1:1)"
						},
						{
							value: "backdrop",
							label: "Widescreen (16:9)"
						}
					]
				},
				{
					kind: "select",
					key: "artwork_fit",
					label: "Poster / cover fit",
					when: Z,
					options: [{
						value: "cover",
						label: "Crop to fill"
					}, {
						value: "contain",
						label: "Show whole image"
					}]
				},
				{
					kind: "select",
					key: "artwork_position",
					label: "Image focus",
					options: [
						{
							value: "center",
							label: "Centre"
						},
						{
							value: "top",
							label: "Top"
						},
						{
							value: "bottom",
							label: "Bottom"
						},
						{
							value: "left",
							label: "Left"
						},
						{
							value: "right",
							label: "Right"
						}
					]
				},
				{
					kind: "number",
					key: "backdrop_opacity",
					label: "Backdrop strength",
					min: 0,
					max: 100,
					suffix: "%",
					when: Fe
				}
			]
		}, {
			summary: "Fine-tune colours and sizing",
			header: "fineTune",
			fields: [
				{
					kind: "appearanceText",
					key: "card_background",
					label: "Card background",
					placeholder: "Theme variable, colour, or rgba()",
					colour: !0
				},
				{
					kind: "appearanceText",
					key: "item_background",
					label: "Stream background",
					placeholder: "Theme variable, colour, or rgba()",
					colour: !0
				},
				{
					kind: "appearanceText",
					key: "border_color",
					label: "Border colour",
					placeholder: "Theme variable or colour",
					colour: !0
				},
				{
					kind: "appearanceText",
					key: "item_shadow",
					label: "Panel shadow",
					placeholder: "CSS box-shadow value"
				},
				{
					kind: "appearanceNumber",
					key: "border_radius",
					label: "Corner radius",
					min: 0,
					max: 32,
					suffix: "px"
				},
				{
					kind: "appearanceNumber",
					key: "item_gap",
					label: "Item spacing",
					min: 0,
					max: 32,
					suffix: "px"
				},
				{
					kind: "appearanceNumber",
					key: "artwork_width",
					label: "Poster / cover width",
					min: 48,
					max: 240,
					suffix: "px",
					when: Z,
					fallback: (e) => e.config.style_preset === "classic" ? 85 : e.config.density === "comfortable" ? 112 : e.config.density === "detailed" ? 140 : 92
				},
				{
					kind: "appearanceNumber",
					key: "artwork_inset",
					label: "Poster / cover inset",
					min: 0,
					max: 24,
					suffix: "px",
					when: Z
				},
				{
					kind: "appearanceNumber",
					key: "title_size",
					label: "Base title size",
					min: 11,
					max: 32,
					suffix: "px"
				},
				{
					kind: "appearanceNumber",
					key: "progress_height",
					label: "Progress height",
					min: 2,
					max: 24,
					suffix: "px"
				},
				{
					kind: "appearanceText",
					key: "playing_color",
					label: "Playing colour",
					placeholder: "Theme variable or colour",
					colour: !0
				},
				{
					kind: "appearanceText",
					key: "paused_color",
					label: "Paused colour",
					placeholder: "Theme variable or colour",
					colour: !0
				},
				{
					kind: "appearanceText",
					key: "buffering_color",
					label: "Buffering colour",
					placeholder: "Theme variable or colour",
					colour: !0
				}
			]
		}]
	},
	{
		id: "general",
		summary: "General",
		description: "Control header, empty states and animation behaviour.",
		fields: [
			{
				kind: "toggle",
				key: "show_header",
				label: "Header"
			},
			{
				kind: "toggle",
				key: "show_count",
				label: "Item count"
			},
			{
				kind: "toggle",
				key: "show_empty",
				label: "Show when empty"
			},
			{
				kind: "toggle",
				key: "animations",
				label: "State animations"
			}
		]
	},
	{
		id: "stream-information",
		summary: "Stream information",
		description: "Control which identity and playback details appear on each stream card.",
		applies: { modes: ["active"] },
		subsections: [
			{
				summary: "Identity",
				className: "inline-advanced",
				fields: [{
					kind: "toggle",
					key: "show_user",
					label: "Plex user"
				}, {
					kind: "toggle",
					key: "show_device",
					label: "Player and device"
				}]
			},
			{
				summary: "Media details",
				className: "inline-advanced",
				fields: [{
					kind: "toggle",
					key: "show_media_details",
					label: "Year / episode"
				}, {
					kind: "toggle",
					key: "show_audio_quality",
					label: "Music audio quality"
				}]
			},
			{
				summary: "Playback and progress",
				className: "inline-advanced",
				fields: [
					{
						kind: "toggle",
						key: "show_progress",
						label: "Progress bar"
					},
					{
						kind: "toggle",
						key: "show_progress_percent",
						label: "Progress percentage"
					},
					{
						kind: "toggle",
						key: "show_state",
						label: "Playback state"
					},
					{
						kind: "toggle",
						key: "show_pause_duration",
						label: "Paused duration"
					},
					{
						kind: "toggle",
						key: "show_track_number",
						label: "Music track number"
					},
					{
						kind: "toggle",
						key: "show_eta",
						label: "Estimated finish time"
					},
					{
						kind: "toggle",
						key: "show_remaining",
						label: "Time remaining"
					}
				]
			},
			{
				summary: "Quality and bandwidth",
				className: "inline-advanced",
				fields: [{
					kind: "toggle",
					key: "show_quality",
					label: "Video quality"
				}, {
					kind: "toggle",
					key: "show_bandwidth",
					label: "Bandwidth"
				}]
			}
		]
	},
	{
		id: "card-information",
		summary: "Card information",
		description: "Control what information appears on each item.",
		applies: { modes: Pe },
		fields: [{
			kind: "toggle",
			key: "show_summary",
			label: "Summary"
		}]
	},
	{
		id: "tap-behaviour",
		summary: "Tap behaviour",
		description: "Choose what happens when an item is tapped on the dashboard card.",
		fields: [{
			kind: "select",
			key: "click_action",
			label: "Tap action",
			options: [{
				value: "none",
				label: "Do nothing"
			}, {
				value: "details",
				label: "Open details popup"
			}]
		}, {
			kind: "hint",
			text: "The popup has its own settings below under “Popup settings”.",
			when: Q
		}]
	},
	{
		id: "terminate",
		summary: "Terminate stream",
		description: (e) => Q(e) ? "Configure the administrator-only terminate button and where it appears." : "The terminate button will appear directly on stream cards in the main card.",
		applies: { modes: ["active"] },
		fields: [
			{
				kind: "block",
				block: "terminationUnavailableHint",
				when: (e) => !$(e)
			},
			{
				kind: "toggle",
				key: "allow_termination",
				label: "Enable terminate-stream action",
				when: $
			},
			{
				kind: "select",
				key: "termination_location",
				label: "Show button in",
				when: (e) => Re(e) && Q(e),
				options: [
					{
						value: "popup",
						label: "Details popup only"
					},
					{
						value: "card",
						label: "Main card only"
					},
					{
						value: "both",
						label: "Both popup and main card"
					}
				]
			},
			{
				kind: "select",
				key: "termination_popup_placement",
				label: "Button position in popup",
				when: ze,
				options: [{
					value: "footer",
					label: "Bottom right"
				}, {
					value: "top",
					label: "Top right beside artwork"
				}]
			},
			{
				kind: "select",
				key: "termination_button_style",
				label: "Button style in popup",
				when: ze,
				options: [{
					value: "label",
					label: "Icon and text"
				}, {
					value: "icon",
					label: "Compact stop icon"
				}]
			},
			{
				kind: "hint",
				text: "Requires “Allow administrators to terminate streams from cards” in the integration's Dashboard card access settings. A separate confirmation is always required."
			}
		]
	},
	{
		id: "popup-appearance",
		groupTitle: "Popup settings",
		summary: "Popup layout and appearance",
		description: "Control the details window independently from the dashboard card.",
		applies: { when: Q },
		fields: [
			{
				kind: "select",
				key: "popup_style",
				label: "Popup appearance",
				options: [
					{
						value: "clean",
						label: "Clean surface"
					},
					{
						value: "panel",
						label: "Framed summary"
					},
					{
						value: "cinematic",
						label: "Cinematic backdrop"
					}
				]
			},
			{
				kind: "toggleNumber",
				key: "popup_cinematic_art",
				label: "Backdrop art strength",
				min: 5,
				max: 100,
				suffix: "%",
				when: (e) => (e.config.popup_style ?? "clean") === "cinematic"
			},
			{
				kind: "select",
				key: "popup_width",
				label: "Popup width",
				options: [
					{
						value: "compact",
						label: "Compact"
					},
					{
						value: "standard",
						label: "Standard"
					},
					{
						value: "wide",
						label: "Wide"
					}
				]
			},
			{
				kind: "select",
				key: "popup_animation",
				label: "Open animation",
				options: [
					{
						value: "none",
						label: "None"
					},
					{
						value: "fade",
						label: "Fade in"
					},
					{
						value: "scale",
						label: "Scale up"
					},
					{
						value: "rise",
						label: "Rise from below"
					}
				]
			},
			{
				kind: "number",
				key: "popup_animation_duration",
				label: "Open animation duration",
				min: 0,
				max: 1500,
				suffix: "ms",
				when: Ie
			},
			{
				kind: "number",
				key: "popup_close_animation_duration",
				label: "Close animation duration",
				min: 0,
				max: 1e3,
				suffix: "ms",
				when: Ie
			},
			{
				kind: "toggleNumber",
				key: "popup_backdrop_dim",
				label: "Dim background",
				min: 1,
				max: 95,
				suffix: "%"
			},
			{
				kind: "toggleNumber",
				key: "popup_backdrop_blur",
				label: "Blur background",
				min: 1,
				max: 24,
				suffix: "px"
			},
			{
				kind: "appearanceText",
				key: "popup_background",
				label: "Popup background",
				placeholder: "Theme variable, colour, or rgba()",
				colour: !0
			}
		]
	},
	{
		id: "popup-summary",
		summary: "Popup summary",
		description: "Choose the media context displayed above the progress bar.",
		applies: { when: Q },
		fields: [
			{
				kind: "toggle",
				key: "popup_show_artwork",
				label: "Artwork",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_summary",
				label: "Media description",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "select",
				key: "popup_summary_lines",
				label: "Description length",
				when: (e) => e.mode !== "users" && Le(e),
				options: [
					{
						value: "2",
						label: "2 lines"
					},
					{
						value: "3",
						label: "3 lines"
					},
					{
						value: "5",
						label: "5 lines"
					},
					{
						value: "0",
						label: "Full description"
					}
				]
			},
			{
				kind: "toggle",
				key: "popup_summary_show_user",
				label: "Plex user",
				modes: ["active"]
			},
			{
				kind: "toggle",
				key: "popup_show_user",
				label: "Plex user",
				modes: ["history"]
			},
			{
				kind: "toggle",
				key: "popup_show_progress",
				label: "Progress",
				modes: ["active"]
			}
		]
	},
	{
		id: "popup-details",
		summary: (e) => e.mode === "users" ? "User details" : e.mode === "active" ? "Stream details" : "Media details",
		description: "Choose the layout and every field shown in the details area below the popup summary.",
		applies: { when: Q },
		fields: [
			{
				kind: "select",
				key: "popup_content_style",
				label: "Details presentation",
				options: [{
					value: "open",
					label: "Seamless — no panel"
				}, {
					value: "panel",
					label: "Contained details panel"
				}]
			},
			{
				kind: "block",
				block: "streamDetailOrder",
				modes: ["active"]
			},
			{
				kind: "toggle",
				key: "popup_show_media_type",
				label: "Media type",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_year",
				label: "Year",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_duration",
				label: "Duration",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_library",
				label: "Library",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_content_rating",
				label: "Content rating",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_rating",
				label: "Rating",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_audience_rating",
				label: "Audience rating",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_genres",
				label: "Genres",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_studio",
				label: "Studio",
				when: (e) => e.mode !== "users"
			},
			{
				kind: "toggle",
				key: "popup_show_playback_breakdown",
				label: "Playback breakdown",
				modes: ["users"]
			},
			{
				kind: "toggle",
				key: "popup_show_favourites",
				label: "Favourite media",
				modes: ["users"]
			},
			{
				kind: "toggle",
				key: "popup_show_habits",
				label: "Viewing habits and player",
				modes: ["users"]
			},
			{
				kind: "toggle",
				key: "popup_show_recent_activity",
				label: "Recent activity",
				modes: ["users"]
			}
		]
	}
], Ve = [
	{
		field: "user",
		key: "popup_show_user",
		label: "Plex user"
	},
	{
		field: "player",
		key: "popup_show_player",
		label: "Player / app"
	},
	{
		field: "device",
		key: "popup_show_device",
		label: "Device"
	},
	{
		field: "eta",
		key: "popup_show_eta",
		label: "Estimated finish time"
	},
	{
		field: "pause_duration",
		key: "popup_show_pause_duration",
		label: "Paused duration (when paused)"
	},
	{
		field: "playback_decision",
		key: "popup_show_playback_decision",
		label: "Playback decision"
	},
	{
		field: "video_quality",
		key: "popup_show_video_quality",
		label: "Video quality"
	},
	{
		field: "audio_quality",
		key: "popup_show_audio_quality",
		label: "Audio quality"
	},
	{
		field: "bandwidth",
		key: "popup_show_bandwidth",
		label: "Bandwidth"
	},
	{
		field: "episode",
		key: "popup_show_episode",
		label: "Season / episode"
	},
	{
		field: "year",
		key: "popup_show_year",
		label: "Year"
	},
	{
		field: "content_rating",
		key: "popup_show_content_rating",
		label: "Content rating"
	},
	{
		field: "rating",
		key: "popup_show_rating",
		label: "Rating"
	},
	{
		field: "audience_rating",
		key: "popup_show_audience_rating",
		label: "Audience rating"
	},
	{
		field: "genres",
		key: "popup_show_genres",
		label: "Genres"
	},
	{
		field: "studio",
		key: "popup_show_studio",
		label: "Studio"
	}
], He = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			_config: { state: !0 },
			_entries: { state: !0 },
			_libraries: { state: !0 },
			_users: { state: !0 },
			_activeCount: { state: !0 },
			_draggedDetailField: { state: !0 },
			_dragPreviewOrder: { state: !0 },
			_error: { state: !0 }
		};
	}
	static {
		this.styles = je;
	}
	constructor() {
		super(), this._subscriptionGeneration = 0, this._detailDragEnd = () => {
			this._draggedDetailField = void 0, this._lastDragTarget = void 0, this._dragPreviewOrder = void 0, this._dragOriginalOrder = void 0;
		}, this._restoreStreamDetailOrder = () => {
			this._update("popup_detail_order", [...J]);
		}, this._resetAppearance = () => {
			let e = { ...this._config };
			for (let t of [
				"card_background",
				"item_background",
				"border_color",
				"item_shadow",
				"border_radius",
				"item_gap",
				"artwork_width",
				"artwork_inset",
				"title_size",
				"progress_height",
				"playing_color",
				"paused_color",
				"buffering_color"
			]) delete e[t];
			this._config = Y(e), this._emitConfig();
		}, this._resetAllDefaults = () => {
			let e = this._config.entry_id;
			this._config = Y({ ...e ? { entry_id: e } : {} }), this._emitConfig();
		}, this._input = (e) => {
			let t = e.currentTarget, n = t.dataset.key, r = t.value;
			if (t instanceof HTMLInputElement && t.type === "checkbox" && (r = t.checked), [
				"max_items",
				"time_range",
				"border_radius",
				"item_gap",
				"artwork_width",
				"artwork_inset",
				"title_size",
				"progress_height",
				"backdrop_opacity",
				"popup_animation_duration",
				"popup_close_animation_duration",
				"popup_cinematic_art",
				"popup_backdrop_dim",
				"popup_backdrop_blur"
			].includes(n) && (r = t.value === "" ? void 0 : Number(t.value)), n === "columns" && t.value !== "auto" && (r = Number(t.value)), n === "popup_summary_lines" && (r = Number(t.value)), [
				"section_id",
				"user_id",
				"title",
				"card_background",
				"item_background",
				"border_color",
				"item_shadow",
				"playing_color",
				"paused_color",
				"buffering_color",
				"popup_background"
			].includes(n) && t.value === "" && (r = void 0), n === "style_preset") {
				let e = {
					...this._config,
					style_preset: r
				};
				for (let t of [
					"card_background",
					"item_background",
					"border_color",
					"item_shadow",
					"border_radius",
					"item_gap",
					"artwork_width",
					"artwork_inset",
					"title_size",
					"progress_height",
					"playing_color",
					"paused_color",
					"buffering_color"
				]) delete e[t];
				this._config = Y(e), this._emitConfig();
				return;
			}
			if (n === "artwork") {
				let e = r;
				this._config = Y({
					...this._config,
					artwork: e,
					artwork_placement: e === "backdrop" ? "background" : "left"
				}), this._emitConfig();
				return;
			}
			this._update(n, r), n === "entry_id" && this._loadReferences();
		}, this._config = Y({}), this._entries = [], this._libraries = [], this._users = [];
	}
	setConfig(e) {
		this._config = Y(e);
	}
	disconnectedCallback() {
		this._stopActiveSubscription(), super.disconnectedCallback();
	}
	updated(e) {
		this.renderRoot.querySelectorAll("select[data-key]").forEach((e) => {
			let t = e.dataset.key, n = this._config[t];
			n !== void 0 && (e.value = String(n));
		}), e.has("hass") && this.hass && !this._entries.length && this._loadEntries(), (e.has("hass") || e.has("_config")) && this._startActiveSubscription();
	}
	async _loadEntries() {
		if (this.hass) try {
			this._entries = await ye(this.hass), !this._config.entry_id && this._entries[0] && this._update("entry_id", this._entries[0].entry_id), await this._loadReferences(), await this._startActiveSubscription();
		} catch (e) {
			this._error = e instanceof Error ? e.message : String(e);
		}
	}
	async _startActiveSubscription() {
		let e = this._config.entry_id;
		if (!this.hass || !e || this._activeEntryId === e) return;
		this._stopActiveSubscription();
		let t = ++this._subscriptionGeneration;
		this._activeEntryId = e, this._activeCount = void 0;
		try {
			let n = await be(this.hass, e, (e) => {
				let n = e.items?.length ?? 0;
				queueMicrotask(() => {
					t === this._subscriptionGeneration && (this._activeCount = n);
				});
			});
			t === this._subscriptionGeneration ? this._unsubscribeActive = n : typeof n == "function" && n();
		} catch {
			t === this._subscriptionGeneration && (this._activeCount = void 0);
		}
	}
	_stopActiveSubscription() {
		this._subscriptionGeneration += 1, typeof this._unsubscribeActive == "function" && this._unsubscribeActive(), this._unsubscribeActive = void 0, this._activeEntryId = void 0;
	}
	async _loadReferences() {
		if (!(!this.hass || !this._config.entry_id)) try {
			let [e, t] = await Promise.all([Se(this.hass, this._config.entry_id), Ce(this.hass, this._config.entry_id)]);
			this._libraries = e.items.map((e) => ({
				value: e.section_id,
				label: `${e.name} (${e.type})`
			})), this._users = t.items.map((e) => ({
				value: e.user_id,
				label: e.display_name
			})), this._error = void 0;
		} catch (e) {
			this._error = e instanceof Error ? e.message : String(e);
		}
	}
	get _fieldContext() {
		return {
			config: this._config,
			mode: this._config.mode,
			data: {
				entries: this._entries,
				libraries: this._libraries,
				users: this._users,
				capabilities: this._entries.find((e) => e.entry_id === this._config.entry_id)?.capabilities
			}
		};
	}
	render() {
		let e = this._fieldContext, t = e.data.capabilities;
		return F`<div class="editor">
      ${this._error ? F`<div class="error" role="alert">${this._error}</div>` : L}
      ${this._config.entry_id && t ? F`<div class="compatibility"><span></span><div><strong>${e.data.entries.find((e) => e.entry_id === this._config.entry_id)?.name ?? "Tautulli"}</strong><small>${this._connectionMessage(e.mode)}</small></div></div>` : L}
      ${Be.map((t) => this._renderSection(t, e))}
      <p class="hint">Privacy and destructive permissions are enforced by the Tautulli Active Streams integration. Tokens and upstream image paths are never sent to this card.</p>
      <button class="reset-all" type="button" @click=${this._resetAllDefaults}>Reset all settings to defaults</button>
    </div>`;
	}
	_renderSection(e, t) {
		if (!X(e.applies, t)) return L;
		let n = L;
		e.groupTitle && this._lastGroupTitle !== e.groupTitle && (this._lastGroupTitle = e.groupTitle, n = F`<h3 class="editor-group-title">${e.groupTitle}</h3>`);
		let r = (e.fields ?? []).map((e) => this._renderField(e, t)), i = (e.subsections ?? []).map((e) => this._renderSubSection(e, t)), a = typeof e.description == "function" ? e.description(t) : e.description;
		return F`${n}<details class="section">
      <summary>${typeof e.summary == "function" ? e.summary(t) : e.summary}</summary>
      ${a ? F`<p class="section-description">${a}</p>` : L}
      ${r}
      ${i}
    </details>`;
	}
	_renderSubSection(e, t) {
		if (!X(e.applies, t)) return L;
		let n = (e.fields ?? []).map((e) => this._renderField(e, t));
		return e.header === "fineTune" ? F`<details>
        <summary>${e.summary}</summary>
        <div class="fine-tune-header"><span>The selected style's values are shown until you override them.</span><button type="button" @click=${this._resetAppearance}>Restore style defaults</button></div>
        <div class="advanced">${n}</div>
      </details>` : F`<details class=${e.className ?? ""}>
      <summary>${e.summary}</summary>
      ${e.description ? F`<p class="section-description">${e.description}</p>` : L}
      ${n}
    </details>`;
	}
	_renderField(e, t) {
		if (!X(e, t)) return L;
		if (e.kind === "hint") return F`<p class="hint">${typeof e.text == "function" ? e.text(t) : e.text}</p>`;
		if (e.kind === "block") return this._renderBlock(e.block);
		let n = typeof e.label == "function" ? e.label(t) : e.label;
		switch (e.kind) {
			case "select": {
				let r = typeof e.options == "function" ? e.options(t) : e.options;
				return this._select(e.key, n, r, String(this._config[e.key] ?? r[0]?.value ?? ""));
			}
			case "toggle": return this._toggle(e.key, n);
			case "number": return this._number(e.key, n, e.min, e.max, e.suffix);
			case "toggleNumber": return this._toggleNumber(e.key, n, e.min, e.max, e.suffix);
			case "text": return this._text(e.key, n, e.placeholder ?? "");
			case "appearanceText": return this._appearanceText(e.key, n, e.placeholder, e.colour ?? !1);
			case "appearanceNumber": {
				let r = e.fallback ? e.fallback(t) : void 0;
				return this._appearanceNumber(e.key, n, e.min, e.max, e.suffix, r);
			}
		}
	}
	_renderBlock(e) {
		switch (e) {
			case "recipes": return F`<div class="recipe-grid" aria-label="Quick layouts">
          ${this._recipe("classic", "Classic compact", "Original stream-panel look")}
          ${this._recipe("balanced", "Balanced", "Clean and adaptable")}
          ${this._recipe("cinematic", "Cinematic", "Backdrop and rich detail")}
          ${this._recipe("shelf", "Media shelf", "Horizontal poster carousel")}
        </div>`;
			case "streamDetailOrder": return this._renderOrderedStreamDetails();
			case "terminationUnavailableHint": return F`<p class="hint">Stream termination is disabled in the integration's Dashboard card access settings.</p>`;
		}
	}
	_connectionMessage(e) {
		return e === "active" ? this._activeCount === void 0 ? "Checking active streams…" : this._activeCount === 0 ? "No active streams — start playback in Plex to see the live card preview" : `${this._activeCount} active ${this._activeCount === 1 ? "stream" : "streams"} available in the preview` : "Connected and ready";
	}
	_renderOrderedStreamDetails() {
		let e = this._dragPreviewOrder ?? this._config.popup_detail_order ?? J;
		return F`<div class="detail-order-toolbar">
      <span>Drag the handle to reorder fields.</span>
      <div>
        <button type="button" @click=${() => this._setAllStreamDetails(!0)}>Show all</button>
        <button type="button" @click=${() => this._setAllStreamDetails(!1)}>Hide all</button>
        <button type="button" @click=${this._restoreStreamDetailOrder}>Restore order</button>
      </div>
    </div>
    <div class="detail-order-list">
      ${e.map((t, n) => this._renderStreamDetailRow(t, n, e.length))}
    </div>`;
	}
	_renderStreamDetailRow(e, t, n) {
		let r = Ve.find((t) => t.field === e);
		return r ? F`<div class="detail-order-row ${this._draggedDetailField === e ? "dragging" : ""}" data-detail-field=${e}
      @dragover=${(t) => this._detailDragOver(t, e)}
      @drop=${(t) => this._detailDrop(t, e)}>
      <button class="drag-handle" type="button" draggable="true"
        title="Drag to reorder ${r.label}"
        aria-label="Drag to reorder ${r.label}"
        @dragstart=${(t) => this._detailDragStart(t, e)}
        @dragend=${this._detailDragEnd}>
        <ha-icon icon="mdi:drag-vertical"></ha-icon>
      </button>
      <span>${r.label}</span>
      <div class="detail-order-actions">
        <button type="button" title="Move ${r.label} up" aria-label="Move ${r.label} up" ?disabled=${t === 0} @click=${() => this._moveStreamDetail(e, -1)}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
        <button type="button" title="Move ${r.label} down" aria-label="Move ${r.label} down" ?disabled=${t === n - 1} @click=${() => this._moveStreamDetail(e, 1)}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
        <input class="detail-order-toggle" type="checkbox" data-key=${r.key} aria-label=${`Show ${r.label}`} .checked=${!!this._config[r.key]} @change=${this._input}>
      </div>
    </div>` : L;
	}
	_detailDragStart(e, t) {
		let n = [...this._config.popup_detail_order ?? J];
		if (this._draggedDetailField = t, this._lastDragTarget = void 0, this._dragOriginalOrder = n, this._dragPreviewOrder = n, e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move", e.dataTransfer.setData("text/plain", t);
			let n = e.currentTarget.closest(".detail-order-row");
			n && e.dataTransfer.setDragImage(n, 24, Math.min(22, n.clientHeight / 2));
		}
	}
	_detailDragOver(e, t) {
		if (e.preventDefault(), e.dataTransfer && (e.dataTransfer.dropEffect = "move"), t !== this._draggedDetailField && this._lastDragTarget !== t) {
			let e = [...this._dragPreviewOrder ?? this._config.popup_detail_order ?? J], n = this._draggedDetailField ? e.indexOf(this._draggedDetailField) : -1, r = e.indexOf(t);
			if (n < 0 || r < 0) return;
			let i = new Map([...this.renderRoot.querySelectorAll(".detail-order-row")].map((e) => [e.dataset.detailField, e.getBoundingClientRect()])), [a] = e.splice(n, 1);
			e.splice(r, 0, a), this._lastDragTarget = t, this._dragPreviewOrder = e, this.updateComplete.then(() => this._animateDetailReorder(i));
		}
	}
	_detailDrop(e, t) {
		e.preventDefault();
		let n = this._draggedDetailField ?? e.dataTransfer?.getData("text/plain"), r = [...this._dragPreviewOrder ?? this._config.popup_detail_order ?? J], i = this._dragOriginalOrder ?? this._config.popup_detail_order ?? J;
		this._draggedDetailField = void 0, this._lastDragTarget = void 0, this._dragPreviewOrder = void 0, this._dragOriginalOrder = void 0, !(!n || n === t && r.every((e, t) => e === i[t])) && (r.every((e, t) => e === i[t]) || this._update("popup_detail_order", r));
	}
	_animateDetailReorder(e) {
		for (let t of this.renderRoot.querySelectorAll(".detail-order-row")) {
			let n = e.get(t.dataset.detailField), r = t.getBoundingClientRect(), i = n ? n.top - r.top : 0;
			i && typeof t.animate == "function" && t.animate([{ transform: `translateY(${i}px)` }, { transform: "translateY(0)" }], {
				duration: 170,
				easing: "cubic-bezier(.2,.8,.2,1)"
			});
		}
	}
	_moveStreamDetail(e, t) {
		let n = [...this._config.popup_detail_order ?? J], r = n.indexOf(e), i = r + t;
		r < 0 || i < 0 || i >= n.length || ([n[r], n[i]] = [n[i], n[r]], this._update("popup_detail_order", n));
	}
	_setAllStreamDetails(e) {
		let t = { ...this._config };
		for (let { key: n } of Ve) t[n] = e;
		this._config = Y(t), this._emitConfig();
	}
	_select(e, t, n, r) {
		return F`<label>${t}<select data-key=${e} @change=${this._input}>
      ${n.map((e) => F`<option value=${e.value} ?selected=${e.value === r}>${e.label}</option>`)}
    </select></label>`;
	}
	_toggle(e, t) {
		return F`<label class="toggle"><input type="checkbox" data-key=${e} .checked=${!!this._config[e]} @change=${this._input}>${t}</label>`;
	}
	_text(e, t, n) {
		return F`<label>${t}<input data-key=${e} .value=${String(this._config[e] ?? "")} placeholder=${n} @change=${this._input}></label>`;
	}
	_number(e, t, n, r, i) {
		return F`<label>${t} (${i})<input type="number" min=${n} max=${r} data-key=${e} .value=${this._config[e] === void 0 ? "" : String(this._config[e])} @change=${this._input}></label>`;
	}
	_toggleNumber(e, t, n, r, i) {
		let a = Number(this._config[e] ?? 0) > 0;
		return F`<label class="toggle-number"><span class="toggle"><input type="checkbox" .checked=${a} @change=${(t) => this._update(e, t.currentTarget.checked ? Math.max(n, 1) : 0)}>${t}</span>${a ? F`<span class="toggle-number-value"><input type="range" min=${n} max=${r} data-key=${e} .value=${String(this._config[e] ?? n)} @change=${this._input} @input=${this._input}> <span>${this._config[e] ?? n}${i}</span></span>` : L}</label>`;
	}
	_appearanceText(e, t, n, r = !1) {
		let i = String(this._config[e] ?? this._presetValue(e) ?? ""), a = this._config[e] !== void 0, o = this._toHexColour(i);
		return F`<label class="appearance-field"><span>${t}${a ? F`<em>Custom</em>` : F`<em>Preset</em>`}</span><div class="field-row">
      ${r ? F`<input class="colour-picker" type="color" .value=${o} title="Choose ${t.toLowerCase()}" @input=${(t) => this._setAppearance(e, t.currentTarget.value)}>` : L}
      <input data-key=${e} .value=${i} placeholder=${n} @change=${this._input}>
      ${a ? F`<button class="field-reset" type="button" title="Restore preset value" aria-label="Restore ${t.toLowerCase()} preset value" @click=${() => this._setAppearance(e, void 0)}><ha-icon icon="mdi:restore"></ha-icon></button>` : L}
    </div></label>`;
	}
	_appearanceNumber(e, t, n, r, i, a) {
		let o = this._config[e] ?? this._presetValue(e) ?? a ?? "", s = this._config[e] !== void 0;
		return F`<label class="appearance-field"><span>${t} (${i})${s ? F`<em>Custom</em>` : F`<em>Preset</em>`}</span><div class="field-row">
      <input type="number" min=${n} max=${r} data-key=${e} .value=${String(o)} @change=${this._input}>
      ${s ? F`<button class="field-reset" type="button" title="Restore preset value" aria-label="Restore ${t.toLowerCase()} preset value" @click=${() => this._setAppearance(e, void 0)}><ha-icon icon="mdi:restore"></ha-icon></button>` : L}
    </div></label>`;
	}
	_presetValue(e) {
		return Oe[this._config.style_preset ?? "classic"][e];
	}
	_toHexColour(e) {
		let t = /^#([0-9a-f]{3})$/i.exec(e);
		if (t) return `#${[...t[1]].map((e) => e + e).join("")}`;
		let n = /^#[0-9a-f]{6}$/i.exec(e);
		if (n) return n[0];
		let r = /rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i.exec(e);
		return r ? `#${r.slice(1, 4).map((e) => Math.min(255, Number(e)).toString(16).padStart(2, "0")).join("")}` : "#2986cc";
	}
	_setAppearance(e, t) {
		this._update(e, t);
	}
	_recipe(e, t, n) {
		return F`<button class="recipe ${e}" type="button" @click=${() => this._applyRecipe(e)}><span class="recipe-preview"><i></i><i></i><i></i></span><strong>${t}</strong><small>${n}</small></button>`;
	}
	_applyRecipe(e) {
		let t = {
			classic: {
				style_preset: "classic",
				container_style: "transparent",
				layout: "grid",
				columns: "auto",
				density: "compact",
				artwork: "poster",
				artwork_placement: "left",
				artwork_aspect: "auto",
				artwork_fit: "cover",
				artwork_inset: 5,
				show_header: !1,
				show_count: !1,
				show_summary: !1
			},
			balanced: {
				style_preset: "modern",
				container_style: "surface",
				layout: "grid",
				columns: "auto",
				density: "comfortable",
				artwork: "poster",
				artwork_placement: "left",
				artwork_aspect: "auto",
				artwork_fit: "cover",
				artwork_inset: 0,
				show_header: !0,
				show_count: !1,
				show_summary: !1
			},
			cinematic: {
				style_preset: "modern",
				container_style: "transparent",
				layout: "list",
				density: "detailed",
				artwork: "backdrop",
				artwork_placement: "background",
				artwork_aspect: "backdrop",
				artwork_fit: "cover",
				backdrop_opacity: 38,
				show_header: !0,
				show_count: !1,
				show_summary: !0,
				show_progress: !0,
				show_remaining: !0
			},
			shelf: {
				style_preset: "modern",
				container_style: "transparent",
				layout: "carousel",
				density: "comfortable",
				artwork: "poster",
				artwork_placement: "left",
				artwork_aspect: "auto",
				artwork_fit: "cover",
				artwork_inset: 0,
				show_header: !0,
				show_count: !1,
				show_summary: !1
			}
		}, n = {
			...this._config,
			...t[e]
		};
		for (let e of [
			"card_background",
			"item_background",
			"border_color",
			"item_shadow",
			"border_radius",
			"item_gap",
			"artwork_width",
			"title_size",
			"progress_height",
			"playing_color",
			"paused_color",
			"buffering_color"
		]) delete n[e];
		this._config = Y(n), this._emitConfig();
	}
	_update(e, t) {
		let n = {
			...this._config,
			[e]: t
		};
		t === void 0 && delete n[e], this._config = Y(n), this._emitConfig();
	}
	_emitConfig() {
		this.dispatchEvent(new CustomEvent("config-changed", {
			bubbles: !0,
			composed: !0,
			detail: { config: De(this._config) }
		}));
	}
};
customElements.get("tautulli-media-card") || customElements.define("tautulli-media-card", Ne), customElements.get("tautulli-media-card-editor") || customElements.define("tautulli-media-card-editor", He), window.customCards = window.customCards || [], window.customCards.some((e) => e.type === "tautulli-media-card") || window.customCards.push({
	type: "tautulli-media-card",
	name: "Tautulli Media Card",
	description: "Active streams, recently added media, popular titles, and watch history from Tautulli.",
	preview: !0
}), console.info("%c TAUTULLI MEDIA CARD %c 0.1.0 ", "color:white;background:#e5a00d;font-weight:700", "color:#e5a00d;background:#1f2329");
//#endregion

//# sourceMappingURL=tautulli-active-streams-card.js.map