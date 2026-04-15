import{html as s,css as i,svg as p,nothing as g}from"lit";import{LitElement as ie}from"lit";import{createStore as ce}from"tinybase";function oe(a,e){if(e.includes("/")){let r=e.split("/");if(r.length===3){let[t,o,l]=r;return a.getCell(t,o,l)}if(r.length===2){let[t,o]=r,l=a.getValue(e);if(l!==void 0)return l;let c=a.getCellIds(t,o);if(c.length>0){let f={};for(let d of c)f[d]=a.getCell(t,o,d);return f}}}return a.getValue(e)}function ne(a,e){if(e.startsWith("count:")){let r=e.slice(6);return a.getRowCount(r)}if(e.startsWith("sum:")){let[r,t]=e.split(":"),[o,l]=t.split("/"),c=0,f=a.getRowIds(o);for(let d of f){let u=a.getCell(o,d,l);typeof u=="number"&&(c+=u)}return c}if(e.startsWith("avg:")){let[r,t]=e.split(":"),[o,l]=t.split("/"),c=0,f=0,d=a.getRowIds(o);for(let u of d){let te=a.getCell(o,u,l);typeof te=="number"&&(c+=te,f++)}return f>0?c/f:0}return oe(a,e)}var se=null;function m(a){se=a}function ae(a,e){if(typeof e!="string")return e;if(e.startsWith("$state:")){let r=e.slice(7);return oe(a,r)}if(e.startsWith("$computed:")){let r=e.slice(10);return ne(a,r)}if(e.startsWith("$item:")){let r=e.slice(6);return se?.[r]}return e}import{css as h}from"lit";var ue=h`
  @layer tokens {
    :host {
      /* ─── Colors ─── */
      --forge-color-primary: #3b82f6;
      --forge-color-primary-hover: #2563eb;
      --forge-color-primary-active: #1d4ed8;
      --forge-color-primary-subtle: #eff6ff;
      
      --forge-color-success: #10b981;
      --forge-color-success-subtle: #ecfdf5;
      --forge-color-warning: #f59e0b;
      --forge-color-warning-subtle: #fffbeb;
      --forge-color-error: #ef4444;
      --forge-color-error-subtle: #fef2f2;
      --forge-color-info: #6366f1;
      --forge-color-info-subtle: #eef2ff;
      
      --forge-color-text: #1f2937;
      --forge-color-text-secondary: #6b7280;
      --forge-color-text-tertiary: #9ca3af;
      --forge-color-text-inverse: #ffffff;
      
      --forge-color-surface: #ffffff;
      --forge-color-surface-alt: #f9fafb;
      --forge-color-surface-hover: #f3f4f6;
      --forge-color-surface-active: #e5e7eb;
      
      --forge-color-border: #e5e7eb;
      --forge-color-border-strong: #d1d5db;
      
      /* ─── Spacing ─── */
      --forge-space-3xs: 0.125rem;  /* 2px */
      --forge-space-2xs: 0.25rem;   /* 4px */
      --forge-space-xs: 0.5rem;     /* 8px */
      --forge-space-sm: 0.75rem;    /* 12px */
      --forge-space-md: 1rem;       /* 16px */
      --forge-space-lg: 1.5rem;     /* 24px */
      --forge-space-xl: 2rem;       /* 32px */
      --forge-space-2xl: 3rem;      /* 48px */
      
      /* ─── Typography ─── */
      --forge-font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --forge-font-mono: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
      
      --forge-text-xs: 0.75rem;     /* 12px */
      --forge-text-sm: 0.875rem;    /* 14px */
      --forge-text-base: 1rem;      /* 16px */
      --forge-text-lg: 1.125rem;    /* 18px */
      --forge-text-xl: 1.25rem;     /* 20px */
      --forge-text-2xl: 1.5rem;     /* 24px */
      --forge-text-3xl: 1.875rem;   /* 30px */
      
      --forge-weight-normal: 400;
      --forge-weight-medium: 500;
      --forge-weight-semibold: 600;
      --forge-weight-bold: 700;
      
      --forge-leading-tight: 1.25;
      --forge-leading-normal: 1.5;
      --forge-leading-relaxed: 1.75;
      
      /* ─── Radii ─── */
      --forge-radius-none: 0;
      --forge-radius-sm: 0.25rem;   /* 4px */
      --forge-radius-md: 0.5rem;    /* 8px */
      --forge-radius-lg: 0.75rem;   /* 12px */
      --forge-radius-xl: 1rem;      /* 16px */
      --forge-radius-full: 9999px;
      
      /* ─── Shadows ─── */
      --forge-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --forge-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --forge-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      
      /* ─── Transitions ─── */
      --forge-transition-fast: 150ms ease;
      --forge-transition-normal: 200ms ease;
      --forge-transition-slow: 300ms ease;
      
      /* ─── Sizes ─── */
      --forge-icon-sm: 1rem;        /* 16px */
      --forge-icon-md: 1.25rem;     /* 20px */
      --forge-icon-lg: 1.5rem;      /* 24px */
      
      --forge-input-height: 2.5rem; /* 40px */
      --forge-button-height: 2.5rem;
      --forge-touch-target: 2.75rem; /* 44px — Apple HIG minimum */
    }

    /* ─── Dark mode ─── */
    :host([color-scheme="dark"]),
    :host(:where([color-scheme="dark"])) {
      --forge-color-primary: #60a5fa;
      --forge-color-primary-hover: #93bbfd;
      --forge-color-primary-active: #3b82f6;
      --forge-color-primary-subtle: #1e3a5f;
      
      --forge-color-success: #34d399;
      --forge-color-success-subtle: #064e3b;
      --forge-color-warning: #fbbf24;
      --forge-color-warning-subtle: #78350f;
      --forge-color-error: #f87171;
      --forge-color-error-subtle: #7f1d1d;
      --forge-color-info: #818cf8;
      --forge-color-info-subtle: #312e81;
      
      --forge-color-text: #f9fafb;
      --forge-color-text-secondary: #d1d5db;
      --forge-color-text-tertiary: #9ca3af;
      --forge-color-text-inverse: #111827;
      
      --forge-color-surface: #1f2937;
      --forge-color-surface-alt: #374151;
      --forge-color-surface-hover: #4b5563;
      --forge-color-surface-active: #6b7280;
      
      --forge-color-border: #374151;
      --forge-color-border-strong: #4b5563;
    }

    /* Auto-detect system preference when no explicit scheme set */
    @media (prefers-color-scheme: dark) {
      :host(:not([color-scheme])) {
        --forge-color-primary: #60a5fa;
        --forge-color-primary-hover: #93bbfd;
        --forge-color-primary-active: #3b82f6;
        --forge-color-primary-subtle: #1e3a5f;
        
        --forge-color-success: #34d399;
        --forge-color-success-subtle: #064e3b;
        --forge-color-warning: #fbbf24;
        --forge-color-warning-subtle: #78350f;
        --forge-color-error: #f87171;
        --forge-color-error-subtle: #7f1d1d;
        --forge-color-info: #818cf8;
        --forge-color-info-subtle: #312e81;
        
        --forge-color-text: #f9fafb;
        --forge-color-text-secondary: #d1d5db;
        --forge-color-text-tertiary: #9ca3af;
        --forge-color-text-inverse: #111827;
        
        --forge-color-surface: #1f2937;
        --forge-color-surface-alt: #374151;
        --forge-color-surface-hover: #4b5563;
        --forge-color-surface-active: #6b7280;
        
        --forge-color-border: #374151;
        --forge-color-border-strong: #4b5563;
      }
    }
  }

  @layer base {
    :host {
      display: block;
      font-family: var(--forge-font-family);
      font-size: var(--forge-text-base);
      line-height: var(--forge-leading-normal);
      color: var(--forge-color-text);
      background: var(--forge-color-surface);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }
  }
`,me=h`
  @layer surfaces {
    /* Chat: compact spacing, constrained width */
    :host([surface="chat"]) {
      --forge-space-md: 0.75rem;
      --forge-space-lg: 1rem;
      --forge-space-xl: 1.5rem;
      --forge-text-base: 0.875rem;
      --forge-input-height: 2.25rem;
      --forge-button-height: 2.25rem;
    }

    /* Standalone: full-width, touch-friendly */
    :host([surface="standalone"]) {
      min-height: 100dvh;
    }

    /* Embed: minimal chrome */
    :host([surface="embed"]) {
      --forge-shadow-md: none;
      --forge-radius-md: 0;
    }
  }
`,v=h`
  :host {
    display: block;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;var n=class extends ie{constructor(){super(...arguments);this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(r){if(!this.store)return r;this.itemContext&&m(this.itemContext);let t=ae(this.store,r);return m(null),t}getProp(r){let t=this.props?.[r];return typeof t=="string"&&(t.startsWith("$state:")||t.startsWith("$computed:")||t.startsWith("$item:"))?this.resolve(t):t}getString(r,t=""){let o=this.getProp(r);return typeof o=="string"?o:String(o??t)}getNumber(r,t=0){let o=this.getProp(r);return typeof o=="number"?o:Number(o)||t}getBool(r,t=!1){let o=this.getProp(r);return typeof o=="boolean"?o:t}dispatchAction(r,t){this.onAction&&this.onAction(r,t),this.dispatchEvent(new CustomEvent("forge-action",{detail:{action:r,payload:t},bubbles:!0,composed:!0}))}handleAction(r){let t=this.getString("action");t&&this.dispatchAction(t,this.props)}prop(r){return this.getProp(r)}static get sharedStyles(){return[v]}gapValue(r){return{"3xs":"var(--forge-space-3xs)","2xs":"var(--forge-space-2xs)",xs:"var(--forge-space-xs)",sm:"var(--forge-space-sm)",md:"var(--forge-space-md)",lg:"var(--forge-space-lg)",xl:"var(--forge-space-xl)","2xl":"var(--forge-space-2xl)"}[r||"md"]||"var(--forge-space-md)"}static get styles(){return[v]}};var b=class extends n{static get properties(){return{props:{type:Object}}}static get styles(){return i`
    :host { display: flex; }
    :host([direction="row"]) { flex-direction: row; }
    :host([direction="column"]) { flex-direction: column; }
    :host([align="center"]) { align-items: center; }
    :host([align="end"]) { align-items: flex-end; }
    :host([wrap="true"]) { flex-wrap: wrap; }
  `}render(){let e=this.getString("direction","column"),r=this.getString("gap","md"),t=this.getString("padding",""),o=this.getString("align",""),l=this.gapValue(r),c=t?`var(--forge-space-${t}, 0)`:"0";return this.setAttribute("direction",e),o&&this.setAttribute("align",o),s`<slot style="gap:${l};padding:${c}"></slot>`}};customElements.define("forge-stack",b);var x=class extends n{static get properties(){return{props:{type:Object}}}static get styles(){return i`:host { display: grid; }`}render(){let e=this.getString("columns","1"),r=this.getString("gap","md"),t=this.gapValue(r);return s`<slot style="grid-template-columns:repeat(${e},1fr);gap:${t}"></slot>`}};customElements.define("forge-grid",x);var y=class extends n{static get properties(){return{props:{type:Object}}}static get styles(){return i`
    :host { display:block; background:var(--forge-color-surface); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-lg); padding:var(--forge-space-md); }
    :host([variant="elevated"]) { box-shadow:var(--forge-shadow-md); border-color:transparent; }
    :host([variant="compact"]) { padding:var(--forge-space-sm); border-radius:var(--forge-radius-md); }
    :host([variant="outline"]) { background:transparent; }
  `}render(){let e=this.getString("variant","");return e&&this.setAttribute("variant",e),s`<slot></slot>`}};customElements.define("forge-card",y);var $=class extends n{static get properties(){return{props:{type:Object}}}static get styles(){return i`:host { display:block; }`}render(){let e=this.getString("maxWidth","none"),r=this.getString("padding","");return s`<slot style="max-width:${e};${r?"padding:var(--forge-space-"+r+")":""}"></slot>`}};customElements.define("forge-container",$);var w=class extends n{constructor(){super(...arguments);this._active=""}static get properties(){return{props:{type:Object}}}static get styles(){return i`
    :host { display:block; }
    .tabs { display:flex; border-bottom:1px solid var(--forge-color-border); gap:var(--forge-space-xs); }
    .tab { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; border:none; background:none;
      color:var(--forge-color-text-secondary); font:inherit; font-size:var(--forge-text-sm);
      border-bottom:2px solid transparent; transition:var(--forge-transition-fast); }
    .tab:hover { color:var(--forge-color-text); background:var(--forge-color-surface-hover); }
    .tab[active] { color:var(--forge-color-primary); border-bottom-color:var(--forge-color-primary); font-weight:var(--forge-weight-medium); }
    .panel { padding:var(--forge-space-md); }
  `}render(){let r=this.getProp("items")||[],t=Array.isArray(r)?r:[];return!this._active&&t.length>0&&(this._active=String(t[0])),s`
      <div class="tabs">${t.map(o=>s`
        <button class="tab" ?active=${String(o)===this._active} @click=${()=>{this._active=String(o),this.dispatchAction("tab-change",{active:String(o)})}}>${String(o)}</button>
      `)}</div>
      <div class="panel"><slot></slot></div>
    `}};customElements.define("forge-tabs",w);var k=class extends n{static get properties(){return{props:{type:Object}}}static get styles(){return i`
    :host { display:block; }
    details { border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); margin-bottom:var(--forge-space-2xs); }
    summary { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; font-weight:var(--forge-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forge-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forge-space-sm) var(--forge-space-md); }
  `}render(){let e=this.getString("title","Section");return s`<details><summary>${e}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forge-accordion",k);var S=class extends n{static get styles(){return i`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forge-color-border); margin:var(--forge-space-sm) 0; }
  `}render(){return s`<hr>`}};customElements.define("forge-divider",S);var z=class extends n{static get styles(){return i`:host { display:block; }`}render(){let r=`var(--forge-space-${this.getString("size","md")}, var(--forge-space-md))`;return s`<div style="height:${r}"></div>`}};customElements.define("forge-spacer",z);var C=class extends n{static get properties(){return{props:{type:Object}}}static get styles(){return i`
    :host { display:block; }
    .heading { font-size:var(--forge-text-2xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); margin:0 0 var(--forge-space-sm); }
    .subheading { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); color:var(--forge-color-text-secondary); margin:0 0 var(--forge-space-xs); }
    .body { font-size:var(--forge-text-base); line-height:var(--forge-leading-normal); margin:0; }
    .caption { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); }
    .code { font-family:var(--forge-font-mono); font-size:var(--forge-text-sm); background:var(--forge-color-surface-alt);
      padding:var(--forge-space-2xs) var(--forge-space-xs); border-radius:var(--forge-radius-sm); }
  `}render(){let e=this.getString("content",""),r=this.getString("variant","body"),t=this.getString("colorScheme","");return s`<div class="${r}" style="${t==="secondary"?"color:var(--forge-color-text-secondary)":t==="primary"?"color:var(--forge-color-primary)":""}">${e}<slot></slot></div>`}};customElements.define("forge-text",C);var E=class extends n{static get styles(){return i`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forge-radius-md); }
  `}render(){let e=this.getString("src",""),r=this.getString("alt",""),t=this.getString("fit","contain");return e?s`<img src="${e}" alt="${r}" style="object-fit:${t}" loading="lazy">`:s`${g}`}};customElements.define("forge-image",E);var j=class extends n{static get styles(){return i`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forge-icon-md); height:var(--forge-icon-md); fill:currentColor; }
  `}render(){let e=this.getString("name","circle"),r={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},t=r[e]||r.circle;return s`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${t}"/></svg>`}};customElements.define("forge-icon",j);var A=class extends n{static get styles(){return i`
    :host { display:inline-flex; align-items:center; }
    .badge { display:inline-flex; align-items:center; padding:var(--forge-space-2xs) var(--forge-space-xs);
      border-radius:var(--forge-radius-full); font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); }
    .badge[variant="success"] { background:var(--forge-color-success-subtle); color:var(--forge-color-success); }
    .badge[variant="warning"] { background:var(--forge-color-warning-subtle); color:var(--forge-color-warning); }
    .badge[variant="error"] { background:var(--forge-color-error-subtle); color:var(--forge-color-error); }
  `}render(){let e=this.getString("label",""),r=this.getString("variant","");return s`<span class="badge" variant="${r}">${e}<slot></slot></span>`}};customElements.define("forge-badge",A);var R=class extends n{static get styles(){return i`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forge-radius-full); background:var(--forge-color-primary-subtle);
      color:var(--forge-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forge-weight-semibold); font-size:var(--forge-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let e=this.getString("src",""),r=this.getString("name","?"),t=r.split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2);return s`<div class="avatar">${e?s`<img src="${e}" alt="${r}">`:t}<slot></slot></div>`}};customElements.define("forge-avatar",R);var P=class extends n{static get styles(){return i`
    :host { display:block; text-align:center; padding:var(--forge-space-2xl) var(--forge-space-lg); }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-xs); }
    .desc { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-bottom:var(--forge-space-md); }
  `}render(){let e=this.getString("title","Nothing here"),r=this.getString("description","");return s`
      <div class="title">${e}</div>
      ${r?s`<div class="desc">${r}</div>`:g}
      <slot></slot>
    `}};customElements.define("forge-empty-state",P);var I=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); color:var(--forge-color-text); }
    input, textarea { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; font-size:var(--forge-text-base);
      background:var(--forge-color-surface); color:var(--forge-color-text); height:var(--forge-input-height);
      transition:border-color var(--forge-transition-fast); }
    input:focus, textarea:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
    input::placeholder { color:var(--forge-color-text-tertiary); }
    textarea { height:auto; min-height:5rem; resize:vertical; }
    .hint { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); margin-top:var(--forge-space-2xs); }
    .error { font-size:var(--forge-text-xs); color:var(--forge-color-error); margin-top:var(--forge-space-2xs); }
  `}render(){let e=this.getString("label",""),r=this.getString("placeholder",""),t=this.getString("hint",""),o=this.getString("error",""),l=this.getString("inputType","text"),c=this.getBool("multiline"),f=this.getString("value","");return s`
      ${e?s`<label>${e}</label>`:g}
      ${c?s`<textarea placeholder="${r}" .value=${f} @input=${d=>this.dispatchAction("change",{value:d.target.value})}></textarea>`:s`<input type="${l}" placeholder="${r}" .value=${f} @input=${d=>this.dispatchAction("change",{value:d.target.value})}>`}
      ${t&&!o?s`<div class="hint">${t}</div>`:g}
      ${o?s`<div class="error">${o}</div>`:g}
    `}};customElements.define("forge-text-input",I);var M=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),r=this.getProp("min"),t=this.getProp("max"),o=this.getProp("step"),l=this.getProp("value");return s`
      ${e?s`<label>${e}</label>`:g}
      <input type="number" min=${r} max=${t} step=${o} .value=${l??""}
        @input=${c=>this.dispatchAction("change",{value:Number(c.target.value)})}>
    `}};customElements.define("forge-number-input",M);var V=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    select { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    select:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),r=this.getProp("options")||[],t=this.getString("value","");return s`
      ${e?s`<label>${e}</label>`:g}
      <select .value=${t} @change=${o=>this.dispatchAction("change",{value:o.target.value})}>
        ${r.map(o=>s`<option value=${typeof o=="string"?o:o.value} ?selected=${(typeof o=="string"?o:o.value)===t}>
          ${typeof o=="string"?o:o.label||o.value}
        </option>`)}
      </select>
    `}};customElements.define("forge-select",V);var N=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forge-space-2xs); padding:var(--forge-space-xs); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); min-height:var(--forge-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forge-space-2xs); padding:var(--forge-space-2xs) var(--forge-space-xs);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); border-radius:var(--forge-radius-full);
      font-size:var(--forge-text-xs); }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; }
  `}render(){let e=this.getString("label",""),r=this.getProp("selected")||[];return s`
      ${e?s`<label>${e}</label>`:g}
      <div class="tags">
        ${r.map(t=>s`<span class="tag">${String(t)}<button @click=${()=>this.dispatchAction("remove",{value:t})}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forge-multi-select",N);var O=class extends n{static get styles(){return i`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); margin-bottom:var(--forge-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forge-color-primary); cursor:pointer; }
    label { font-size:var(--forge-text-sm); cursor:pointer; }
  `}render(){let e=this.getString("label",""),r=this.getBool("checked");return s`
      <input type="checkbox" ?checked=${r} @change=${t=>this.dispatchAction("change",{checked:t.target.checked})}>
      ${e?s`<label>${e}</label>`:g}
    `}};customElements.define("forge-checkbox",O);var W=class extends n{static get styles(){return i`
    :host { display:flex; align-items:center; gap:var(--forge-space-sm); margin-bottom:var(--forge-space-xs); }
    .switch { position:relative; width:2.75rem; height:1.5rem; background:var(--forge-color-border-strong);
      border-radius:var(--forge-radius-full); cursor:pointer; transition:background var(--forge-transition-fast); }
    .switch[on] { background:var(--forge-color-primary); }
    .switch::after { content:''; position:absolute; top:2px; left:2px; width:1.25rem; height:1.25rem;
      background:white; border-radius:var(--forge-radius-full); transition:transform var(--forge-transition-fast); }
    .switch[on]::after { transform:translateX(1.25rem); }
    label { font-size:var(--forge-text-sm); }
  `}render(){let e=this.getString("label",""),r=this.getBool("on");return s`
      <div class="switch" ?on=${r} @click=${()=>this.dispatchAction("change",{on:!r})}></div>
      ${e?s`<label>${e}</label>`:g}
    `}};customElements.define("forge-toggle",W);var _=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),r=this.getString("value","");return s`
      ${e?s`<label>${e}</label>`:g}
      <input type="date" .value=${r} @change=${t=>this.dispatchAction("change",{value:t.target.value})}>
    `}};customElements.define("forge-date-picker",_);var B=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input[type=range] { width:100%; accent-color:var(--forge-color-primary); }
    .value { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); }
  `}render(){let e=this.getString("label",""),r=this.getNumber("min",0),t=this.getNumber("max",100),o=this.getNumber("step",1),l=this.getNumber("value",r);return s`
      ${e?s`<label>${e}</label>`:g}
      <input type="range" min=${r} max=${t} step=${o} .value=${l}
        @input=${c=>this.dispatchAction("change",{value:Number(c.target.value)})}>
      <div class="value">${l}</div>
    `}};customElements.define("forge-slider",B);var T=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .dropzone { border:2px dashed var(--forge-color-border-strong); border-radius:var(--forge-radius-md);
      padding:var(--forge-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forge-transition-fast); }
    .dropzone:hover { border-color:var(--forge-color-primary); }
    .dropzone p { color:var(--forge-color-text-secondary); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getString("label","Upload file"),r=this.getString("accept","*");return s`
      ${e?s`<label>${e}</label>`:g}
      <div class="dropzone" @click=${()=>this.shadowRoot?.querySelector("input")?.click()}>
        <p>Click or drop file here</p>
        <input type="file" accept="${r}" hidden @change=${t=>{let o=t.target.files?.[0];o&&this.dispatchAction("change",{name:o.name,size:o.size,type:o.type})}}>
      </div>
    `}};customElements.define("forge-file-upload",T);var H=class extends n{static get styles(){return i`
    :host { display:inline-flex; }
    button { display:inline-flex; align-items:center; justify-content:center; gap:var(--forge-space-xs);
      padding:0 var(--forge-space-md); height:var(--forge-button-height); border:1px solid transparent;
      border-radius:var(--forge-radius-md); font:inherit; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium);
      cursor:pointer; transition:all var(--forge-transition-fast); white-space:nowrap; }
    button:focus-visible { outline:2px solid var(--forge-color-primary); outline-offset:2px; }
    .primary { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); }
    .primary:hover { background:var(--forge-color-primary-hover); }
    .secondary { background:transparent; color:var(--forge-color-primary); border-color:var(--forge-color-primary); }
    .secondary:hover { background:var(--forge-color-primary-subtle); }
    .ghost { background:transparent; color:var(--forge-color-text-secondary); }
    .ghost:hover { background:var(--forge-color-surface-hover); color:var(--forge-color-text); }
    .danger { background:var(--forge-color-error); color:var(--forge-color-text-inverse); }
    .danger:hover { opacity:0.9; }
    .sm { height:2rem; padding:0 var(--forge-space-sm); font-size:var(--forge-text-xs); }
    .lg { height:3rem; padding:0 var(--forge-space-lg); font-size:var(--forge-text-base); }
    button:disabled { opacity:0.5; cursor:not-allowed; }
  `}render(){let e=this.getString("label","Button"),r=this.getString("variant","primary"),t=this.getString("size",""),o=this.getBool("disabled");return s`<button class="${r} ${t}" ?disabled=${o} @click=${l=>this.handleAction(l)}>${e}<slot></slot></button>`}};customElements.define("forge-button",H);var L=class extends n{static get styles(){return i`
    :host { display:flex; gap:var(--forge-space-xs); }
  `}render(){return s`<slot></slot>`}};customElements.define("forge-button-group",L);var U=class extends n{static get styles(){return i`
    :host { display:inline-flex; }
    a { color:var(--forge-color-primary); text-decoration:none; font-size:var(--forge-text-sm); cursor:pointer; }
    a:hover { text-decoration:underline; }
  `}render(){let e=this.getString("label",""),r=this.getString("href","#");return s`<a href="${r}">${e}<slot></slot></a>`}};customElements.define("forge-link",U);var X=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-md); overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:var(--forge-text-sm); }
    th { text-align:left; padding:var(--forge-space-xs) var(--forge-space-sm); font-weight:var(--forge-weight-semibold);
      color:var(--forge-color-text-secondary); border-bottom:2px solid var(--forge-color-border); white-space:nowrap; }
    td { padding:var(--forge-space-xs) var(--forge-space-sm); border-bottom:1px solid var(--forge-color-border); }
    tr:hover td { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); }
    .pagination { display:flex; justify-content:center; gap:var(--forge-space-xs); margin-top:var(--forge-space-sm); }
    .pagination button { padding:var(--forge-space-2xs) var(--forge-space-xs); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-sm); background:var(--forge-color-surface); cursor:pointer; font:inherit; }
    .pagination button[active] { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
  `}render(){let e=this.getProp("data")||[],r=this.getProp("columns")||[],t=this.getString("emptyMessage","No data");if(e.length===0&&r.length===0)return s`<div class="empty">${t}</div>`;let o=r.length>0?r:e.length>0?Object.keys(e[0]):[];return s`
      <table>
        <thead><tr>${o.map(l=>s`<th>${typeof l=="string"?l:l.label||l.key}</th>`)}</tr></thead>
        <tbody>${e.length===0?s`<tr><td colspan=${o.length} class="empty">${t}</td></tr>`:e.map(l=>s`<tr>${o.map(c=>{let f=typeof c=="string"?c:c.key;return s`<td>${l[f]??""}</td>`})}</tr>`)}</tbody>
      </table>
    `}};customElements.define("forge-table",X);var J=class extends n{static get styles(){return i`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forge-space-xs); }
    .item { padding:var(--forge-space-sm); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md);
      display:flex; align-items:center; gap:var(--forge-space-sm); }
    .item:hover { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getProp("data")||[],r=this.getString("emptyMessage","No items");return e.length===0?s`<div class="empty">${r}</div>`:s`<div class="list">${e.map((t,o)=>s`
      <div class="item" data-index=${o}><slot name="item" .item=${t} .index=${o}>${JSON.stringify(t)}</slot></div>
    `)}</div>`}};customElements.define("forge-list",J);var q=class extends n{static get styles(){return i`
    :host { display:block; }
    canvas { width:100%; height:auto; }
    .fallback { padding:var(--forge-space-md); text-align:center; color:var(--forge-color-text-secondary); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getString("chartType","bar"),r=this.getProp("data")||[],t=this.getString("title","");return s`
      ${t?s`<div style="font-weight:var(--forge-weight-semibold);margin-bottom:var(--forge-space-xs)">${t}</div>`:g}
      <div class="fallback">Chart: ${e} (${r.length} data points)<br><small>Canvas rendering in Phase 2</small></div>
      <slot></slot>
    `}};customElements.define("forge-chart",q);var Y=class extends n{static get styles(){return i`
    :host { display:block; padding:var(--forge-space-md); background:var(--forge-color-surface);
      border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-lg); text-align:center; }
    .label { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-bottom:var(--forge-space-2xs); }
    .value { font-size:var(--forge-text-3xl); font-weight:var(--forge-weight-bold); color:var(--forge-color-text); line-height:1; }
    .trend { display:flex; align-items:center; gap:var(--forge-space-2xs); justify-content:center; margin-top:var(--forge-space-xs); font-size:var(--forge-text-sm); }
    .trend.up { color:var(--forge-color-success); }
    .trend.down { color:var(--forge-color-error); }
    .goal { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); margin-top:var(--forge-space-xs); }
  `}render(){let e=this.getString("label",""),r=this.getProp("value"),t=this.getProp("trend"),o=this.getProp("goal"),l=typeof r=="number"?r.toLocaleString():String(r??"\u2014");return s`
      <div class="label">${e}</div>
      <div class="value">${l}</div>
      ${t!==void 0?s`<div class="trend ${t>=0?"up":"down"}">
        ${t>=0?"\u2191":"\u2193"} ${Math.abs(t)}%
      </div>`:g}
      ${o!==void 0?s`<div class="goal">Goal: ${typeof o=="number"?o.toLocaleString():o}</div>`:g}
    `}};customElements.define("forge-metric",Y);var D=class extends n{static get styles(){return i`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    .alert { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      border-left:4px solid; font-size:var(--forge-text-sm); }
    .info { background:var(--forge-color-info-subtle); border-color:var(--forge-color-info); color:var(--forge-color-info); }
    .success { background:var(--forge-color-success-subtle); border-color:var(--forge-color-success); color:var(--forge-color-success); }
    .warning { background:var(--forge-color-warning-subtle); border-color:var(--forge-color-warning); color:var(--forge-color-warning); }
    .error { background:var(--forge-color-error-subtle); border-color:var(--forge-color-error); color:var(--forge-color-error); }
  `}render(){let e=this.getString("variant","info"),r=this.getString("title",""),t=this.getString("message","");return s`<div class="alert ${e}">
      ${r?s`<strong>${r}</strong> `:g}${t}<slot></slot>
    </div>`}};customElements.define("forge-alert",D);var G=class extends n{static get styles(){return i`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forge-color-surface); border-radius:var(--forge-radius-lg);
      padding:var(--forge-space-lg); min-width:20rem; max-width:90vw; max-height:90vh; overflow:auto;
      box-shadow:var(--forge-shadow-lg); z-index:1; }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forge-space-xs); margin-top:var(--forge-space-lg); }
  `}render(){let e=this.getString("title","");return this.getBool("open")?this.setAttribute("open",""):this.removeAttribute("open"),s`
      <div class="backdrop" @click=${()=>this.dispatchAction("close")}></div>
      <div class="dialog">
        ${e?s`<div class="title">${e}</div>`:g}
        <slot></slot>
      </div>
    `}};customElements.define("forge-dialog",G);var K=class extends n{static get styles(){return i`
    :host { display:block; }
    .progress { height:0.5rem; background:var(--forge-color-surface-alt); border-radius:var(--forge-radius-full); overflow:hidden; }
    .bar { height:100%; background:var(--forge-color-primary); border-radius:var(--forge-radius-full); transition:width var(--forge-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-2xs); }
  `}render(){let e=this.getProp("value"),r=e===void 0,t=typeof e=="number"?`${Math.min(100,Math.max(0,e))}%`:"0%";return s`
      <div class="progress ${r?"indeterminate":""}">
        <div class="bar" style=${r?"":`width:${t}`}></div>
      </div>
    `}};customElements.define("forge-progress",K);var Q=class extends n{static get styles(){return i`
    :host { display:block; position:fixed; bottom:var(--forge-space-lg); right:var(--forge-space-lg); z-index:60; }
    .toast { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      background:var(--forge-color-text); color:var(--forge-color-text-inverse); font-size:var(--forge-text-sm);
      box-shadow:var(--forge-shadow-lg); max-width:20rem; }
  `}render(){let e=this.getString("message","");return e?s`<div class="toast">${e}</div>`:s`${g}`}};customElements.define("forge-toast",Q);var Z=class extends n{static get styles(){return i`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); font-size:var(--forge-text-sm); }
    .sep { color:var(--forge-color-text-tertiary); }
    a { color:var(--forge-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forge-color-text); font-weight:var(--forge-weight-medium); }
  `}render(){let e=this.getProp("items")||[];return s`${e.map((r,t)=>{let o=t===e.length-1,l=typeof r=="string"?r:r.label,c=typeof r=="string"?"#":r.href;return s`
        ${t>0?s`<span class="sep">/</span>`:g}
        ${o?s`<span class="current">${l}</span>`:s`<a href="${c}">${l}</a>`}
      `})}`}};customElements.define("forge-breadcrumb",Z);var F=class extends n{static get styles(){return i`
    :host { display:flex; width:100%; }
    .step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; }
    .step:not(:last-child)::after { content:''; position:absolute; top:0.75rem; left:50%; width:100%; height:2px;
      background:var(--forge-color-border); transform:translateY(-50%); z-index:0; }
    .step:not(:last-child)[completed]::after { background:var(--forge-color-primary); }
    .circle { width:1.5rem; height:1.5rem; border-radius:var(--forge-radius-full); display:flex; align-items:center;
      justify-content:center; font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-surface-alt); color:var(--forge-color-text-secondary); border:2px solid var(--forge-color-border); z-index:1; }
    .step[active] .circle { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
    .step[completed] .circle { background:var(--forge-color-success); color:white; border-color:var(--forge-color-success); }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-xs); text-align:center; }
    .step[active] .label { color:var(--forge-color-text); font-weight:var(--forge-weight-medium); }
  `}render(){let e=this.getProp("steps")||[],r=this.getNumber("active",0);return s`${e.map((t,o)=>{let l=typeof t=="string"?t:t.label,c=o===r,f=o<r;return s`<div class="step" ?active=${c} ?completed=${f}>
        <div class="circle">${f?"\u2713":o+1}</div>
        <div class="label">${l}</div>
      </div>`})}`}};customElements.define("forge-stepper",F);var ee=class extends n{static get styles(){return i`
    :host { display:block; }
    .error { padding:var(--forge-space-sm); background:var(--forge-color-error-subtle); color:var(--forge-color-error);
      border:1px solid var(--forge-color-error); border-radius:var(--forge-radius-md); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getString("msg","Unknown error");return s`<div class="error">⚠ ${e}</div>`}};customElements.define("forge-error",ee);var re=class extends n{static get properties(){return{props:{type:Object}}}static get styles(){return i`
    :host { display:block; }
    svg { display:block; }
  `}render(){let e=this.getNumber("width",400),r=this.getNumber("height",300),t=this.getString("background","transparent"),o=this.getProp("shapes")||[];return p`
      <svg width="${e}" height="${r}" style="background:${t}" viewBox="0 0 ${e} ${r}">
        ${o.map(l=>this.renderShape(l))}
      </svg>
    `}renderShape(e){let r={fill:e.fill??void 0,stroke:e.stroke??void 0,"stroke-width":e.strokeWidth??void 0,opacity:e.opacity??void 0},t=e.action?()=>{this.onAction&&this.onAction(e.action)}:void 0,o=e.action?"cursor:pointer":void 0;switch(e.type){case"rect":return p`<rect
          x="${e.x??0}" y="${e.y??0}"
          width="${e.width??0}" height="${e.height??0}"
          rx="${e.rx??0}" ry="${e.ry??0}"
          fill="${r.fill??"none"}"
          stroke="${r.stroke??"none"}"
          stroke-width="${r["stroke-width"]??0}"
          opacity="${r.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"circle":return p`<circle
          cx="${e.cx??0}" cy="${e.cy??0}" r="${e.r??0}"
          fill="${r.fill??"none"}"
          stroke="${r.stroke??"none"}"
          stroke-width="${r["stroke-width"]??0}"
          opacity="${r.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"ellipse":return p`<ellipse
          cx="${e.cx??e.x??0}" cy="${e.cy??e.y??0}"
          rx="${e.rx??(e.width?e.width/2:0)}" ry="${e.ry??(e.height?e.height/2:0)}"
          fill="${r.fill??"none"}"
          stroke="${r.stroke??"none"}"
          stroke-width="${r["stroke-width"]??0}"
          opacity="${r.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"line":return p`<line
          x1="${e.x1??0}" y1="${e.y1??0}"
          x2="${e.x2??0}" y2="${e.y2??0}"
          stroke="${r.stroke??"none"}"
          stroke-width="${r["stroke-width"]??1}"
          opacity="${r.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"text":return p`<text
          x="${e.x??0}" y="${e.y??0}"
          fill="${r.fill??"currentColor"}"
          font-size="${e.fontSize??14}"
          font-weight="${e.fontWeight??"normal"}"
          font-family="${e.fontFamily??"sans-serif"}"
          text-anchor="${e.textAnchor??"start"}"
          opacity="${r.opacity??1}"
          style="${o}"
          @click=${t}
        >${e.content??""}</text>`;case"path":return p`<path
          d="${e.d??""}"
          fill="${r.fill??"none"}"
          stroke="${r.stroke??"none"}"
          stroke-width="${r["stroke-width"]??1}"
          opacity="${r.opacity??1}"
          style="${o}"
          @click=${t}
        />`;default:return p``}}};customElements.define("forge-drawing",re);export{k as ForgeAccordion,D as ForgeAlert,R as ForgeAvatar,A as ForgeBadge,Z as ForgeBreadcrumb,H as ForgeButton,L as ForgeButtonGroup,y as ForgeCard,q as ForgeChart,O as ForgeCheckbox,$ as ForgeContainer,_ as ForgeDatePicker,G as ForgeDialog,S as ForgeDivider,re as ForgeDrawing,P as ForgeEmptyState,ee as ForgeError,T as ForgeFileUpload,x as ForgeGrid,j as ForgeIcon,E as ForgeImage,U as ForgeLink,J as ForgeList,Y as ForgeMetric,N as ForgeMultiSelect,M as ForgeNumberInput,K as ForgeProgress,V as ForgeSelect,B as ForgeSlider,z as ForgeSpacer,b as ForgeStack,F as ForgeStepper,X as ForgeTable,w as ForgeTabs,C as ForgeText,I as ForgeTextInput,Q as ForgeToast,W as ForgeToggle};
