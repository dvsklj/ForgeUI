import{html as ue,css as ge,nothing as zt}from"lit";import{LitElement as _t}from"lit";import{createStore as Rt}from"tinybase";var yt=new Set(["__proto__","prototype","constructor"]);function Z(s){if(s.length===0||s.length>256)return!1;for(let t of s.normalize("NFC").split("."))if(yt.has(t))return!1;return!0}function re(s,t){if(t.includes("/")){let e=t.split("/");if(e.length===3){let[r,o,i]=e;return s.getCell(r,o,i)}if(e.length===2){let[r,o]=e,i=s.getValue(t);if(i!==void 0)return i;let a=s.getCellIds(r,o);if(a.length>0){let n={};for(let l of a)n[l]=s.getCell(r,o,l);return n}}}return s.getValue(t)}function wt(s,t){if(t.startsWith("count:")){let e=t.slice(6);return s.getRowCount(e)}if(t.startsWith("sum:")){let[e,r]=t.split(":"),[o,i]=r.split("/"),a=0,n=s.getRowIds(o);for(let l of n){let g=s.getCell(o,l,i);typeof g=="number"&&(a+=g)}return a}if(t.startsWith("avg:")){let[e,r]=t.split(":"),[o,i]=r.split("/"),a=0,n=0,l=s.getRowIds(o);for(let g of l){let u=s.getCell(o,g,i);typeof u=="number"&&(a+=u,n++)}return n>0?a/n:0}return re(s,t)}var X=null;function oe(s){X=s}function $t(s,t){if(t.length>1024)return;let e="(state\\.[a-zA-Z_][a-zA-Z0-9_.]*|-?\\d+(?:\\.\\d+)?)",r=t.trim().match(new RegExp(`^${e}\\s*(>=|<=|[+\\-*/><])\\s*${e}$`));if(!r)return;let o=gt(s,r[1]),i=gt(s,r[3]);if(!(typeof o!="number"||typeof i!="number"))switch(r[2]){case"+":return o+i;case"-":return o-i;case"*":return o*i;case"/":return i===0?void 0:o/i;case">":return o>i;case"<":return o<i;case">=":return o>=i;case"<=":return o<=i}}function gt(s,t){if(/^-?\d/.test(t))return Number(t);if(!t.startsWith("state."))return;let e=t.slice(6);return Z(e)?dt(s,e):void 0}function ie(s,t){let e=t.trim();if(e==="")return;if(e.startsWith('"')&&e.endsWith('"')||e.startsWith("'")&&e.endsWith("'"))return e.slice(1,-1);if(e.startsWith('"')&&!e.endsWith('"')||e.startsWith("'")&&!e.endsWith("'"))return;if(e==="true")return!0;if(e==="false")return!1;if(e==="null")return null;if(/^-?\d+(\.\d+)?$/.test(e))return Number(e);if(/(?:[+\-*/%]|===?|!==?|>=?|<=?|\&\&|\|\|)/.test(e)&&!e.includes("|"))return $t(s,e);if(e.includes("|")){let[o,...i]=e.split("|").map(l=>l.trim()),n=ie(s,o);for(let l of i){let[g,...u]=l.split(/\s+/);n=kt(n,g,u)}return n}if(e.startsWith("item.")||e==="item"){if(e==="item")return X;let o=e.slice(5);return q(X,o)}if(e.startsWith("state.")||e==="state"){if(e==="state")return;let o=e.slice(6);return dt(s,o)}return re(s,e)}function kt(s,t,e){switch(t){case"values":return Array.isArray(s)?s:s&&typeof s=="object"?Object.values(s):[];case"keys":return s&&typeof s=="object"?Object.keys(s):[];case"count":case"length":return Array.isArray(s)?s.length:s&&typeof s=="object"?Object.keys(s).length:typeof s=="string"?s.length:0;case"sum":return Array.isArray(s)?s.reduce((r,o)=>r+(typeof o=="number"?o:0),0):0;case"first":return Array.isArray(s)?s[0]:void 0;case"last":return Array.isArray(s)?s[s.length-1]:void 0;default:return s}}function q(s,t){if(!s||typeof s!="object"||!t||!Z(t))return;let e=t.split(".");if(e.length>32)return;let r=s;for(let o of e){if(r==null)return;r=r[o]}return r}function dt(s,t){if(!Z(t))return;let e=s.getValue(t);if(e!==void 0){if(typeof e=="string")try{return JSON.parse(e)}catch{}return e}let r=t.split(".");if(r.length>=3){let[i,a,n,...l]=r;if(s.hasTable(i)&&s.hasRow(i,a)){let g=s.getCell(i,a,n);if(l.length===0)return g;if(typeof g=="string")try{let u=JSON.parse(g);return q(u,l.join("."))}catch{}return}}if(r.length>=2){let[i,a,...n]=r;if(s.hasTable(i)&&s.hasRow(i,a)){let l=s.getRow(i,a);return n.length===0?l:q(l,n.join("."))}}if(r.length>=1){let[i,...a]=r;if(s.hasTable(i)){let n=s.getRowIds(i),l={};for(let g of n)l[g]=s.getRow(i,g);return a.length===0?l:q(l,a.join("."))}}let o=s.getValue(r[0]);if(typeof o=="string"&&r.length>1)try{let i=JSON.parse(o);return q(i,r.slice(1).join("."))}catch{}}function W(s,t){if(typeof t!="string"){if(t!==null&&typeof t=="object"){let e=t;if("$expr"in e)return W(s,`$expr:${e.$expr}`);if("$state"in e)return W(s,`$state:${e.$state}`);if("$computed"in e)return W(s,`$computed:${e.$computed}`);if("$item"in e)return W(s,`$item:${e.$item}`)}return t}if(t.startsWith("$state:")){let e=t.slice(7);return Z(e)?re(s,e):void 0}if(t.startsWith("$computed:")){let e=t.slice(10);return e.length>1024?void 0:wt(s,e)}if(t.startsWith("$item:")){let e=t.slice(6);return Z(e)?e.includes(".")?q(X,e):X?.[e]:void 0}if(t.startsWith("$expr:")){let e=t.slice(6);return e.length>1024?void 0:ie(s,e)}return t.length>4096?t:t.includes("{{")&&t.includes("}}")?St(t,s):t}function St(s,t){let e="",r=0;for(;r<s.length;)if(s[r]==="{"&&s[r+1]==="{"){let o=r+2,i=1,a=o;for(;a<s.length-1&&i>0;){let n=s[a],l=s[a+1];n==="{"&&l==="{"?(i++,a+=2):n==="}"&&l==="}"?(i--,a+=2):a++}if(i)e+=s[r++];else{let n=s.slice(o,a-2);if(n.length<=256){let l=n.trim(),g=l.startsWith("$")?W(t,l):ie(t,l);e+=g==null?"":String(g)}else e+=s.slice(r,a);r=a}}else e+=s[r++];return e}import{css as se}from"lit";var Kt=se`
  @layer tokens {
    :host {
      /* ─── Primary (deep teal — distinctive, calm, professional) ─── */
      --forgeui-color-primary: #0d7377;
      --forgeui-color-primary-hover: #0a5c5f;
      --forgeui-color-primary-active: #084547;
      --forgeui-color-primary-subtle: #e6f5f5;

      /* ─── Semantic colors ─── */
      --forgeui-color-success: #166534;
      --forgeui-color-success-subtle: #dcfce7;
      --forgeui-color-success-border: #86efac;
      --forgeui-color-warning: #854d0e;
      --forgeui-color-warning-subtle: #fef3c7;
      --forgeui-color-warning-border: #facc15;
      --forgeui-color-error: #991b1b;
      --forgeui-color-error-subtle: #fee2e2;
      --forgeui-color-error-border: #fca5a5;
      --forgeui-color-info: #075985;
      --forgeui-color-info-subtle: #e0f2fe;
      --forgeui-color-info-border: #7dd3fc;

      /* ─── Text (high-contrast: all ratios ≥ 7:1 against white) ─── */
      --forgeui-color-text: #111827;
      --forgeui-color-text-secondary: #4b5563;
      --forgeui-color-text-tertiary: #6b7280;
      --forgeui-color-text-inverse: #ffffff;

      /* ─── Surfaces ─── */
      --forgeui-color-surface: #ffffff;
      --forgeui-color-surface-alt: #f8f9fb;
      --forgeui-color-surface-hover: #f0f2f5;
      --forgeui-color-surface-active: #e3e6eb;

      /* ─── Borders ─── */
      --forgeui-color-border: #cbd5e1;
      --forgeui-color-border-strong: #94a3b8;

      /* ─── Focus ring ─── */
      --forgeui-color-focus: #0d7377;

      /* ─── Spacing ─── */
      --forgeui-space-3xs: 0.125rem;  /* 2px */
      --forgeui-space-2xs: 0.25rem;   /* 4px */
      --forgeui-space-xs: 0.5rem;     /* 8px */
      --forgeui-space-sm: 0.75rem;    /* 12px */
      --forgeui-space-md: 1rem;       /* 16px */
      --forgeui-space-lg: 1.5rem;     /* 24px */
      --forgeui-space-xl: 2rem;       /* 32px */
      --forgeui-space-2xl: 3rem;      /* 48px */

      /* ─── Typography ─── */
      --forgeui-font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --forgeui-font-mono: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;

      --forgeui-text-xs: 0.75rem;     /* 12px */
      --forgeui-text-sm: 0.875rem;    /* 14px */
      --forgeui-text-base: 1rem;      /* 16px */
      --forgeui-text-lg: 1.125rem;    /* 18px */
      --forgeui-text-xl: 1.25rem;     /* 20px */
      --forgeui-text-2xl: 1.5rem;     /* 24px */
      --forgeui-text-3xl: 1.875rem;   /* 30px */

      --forgeui-weight-normal: 400;
      --forgeui-weight-medium: 500;
      --forgeui-weight-semibold: 600;
      --forgeui-weight-bold: 700;

      --forgeui-leading-tight: 1.25;
      --forgeui-leading-normal: 1.5;
      --forgeui-leading-relaxed: 1.75;

      /* ─── Radii ─── */
      --forgeui-radius-none: 0;
      --forgeui-radius-sm: 0.25rem;   /* 4px */
      --forgeui-radius-md: 0.5rem;    /* 8px */
      --forgeui-radius-lg: 0.75rem;   /* 12px */
      --forgeui-radius-xl: 1rem;      /* 16px */
      --forgeui-radius-full: 9999px;

      /* ─── Shadows ─── */
      --forgeui-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.06);
      --forgeui-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06);
      --forgeui-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06);

      /* ─── Transitions ─── */
      --forgeui-transition-fast: 120ms ease;
      --forgeui-transition-normal: 180ms ease;
      --forgeui-transition-slow: 260ms ease;

      /* ─── Sizes ─── */
      --forgeui-icon-sm: 1rem;        /* 16px */
      --forgeui-icon-md: 1.25rem;     /* 20px */
      --forgeui-icon-lg: 1.5rem;      /* 24px */

      --forgeui-input-height: 2.5rem; /* 40px */
      --forgeui-button-height: 2.5rem;
      --forgeui-touch-target: 2.75rem; /* 44px — Apple HIG minimum */

      /* ─── Chart palette (colorblind-safe, high-contrast, no purple/cyan dominance) ─── */
      --forgeui-color-chart-6: #92400e;
      --forgeui-color-chart-7: #be185d;
      --forgeui-color-chart-8: #0369a1;
      --forgeui-color-chart-9: #a16207;
      --forgeui-color-chart-10: #475569;
    }

    /* ─── Dark mode ─── */
    :host([color-scheme="dark"]),
    :host(:where([color-scheme="dark"])) {
      --forgeui-color-primary: #2dd4c0;
      --forgeui-color-primary-hover: #5ce4d4;
      --forgeui-color-primary-active: #14b8a6;
      --forgeui-color-primary-subtle: #0d3d3e;

      --forgeui-color-success: #4ade80;
      --forgeui-color-success-subtle: #064e3b;
      --forgeui-color-success-border: #15803d;
      --forgeui-color-warning: #fbbf24;
      --forgeui-color-warning-subtle: #78350f;
      --forgeui-color-warning-border: #b45309;
      --forgeui-color-error: #f87171;
      --forgeui-color-error-subtle: #7f1d1d;
      --forgeui-color-error-border: #b91c1c;
      --forgeui-color-info: #60a5fa;
      --forgeui-color-info-subtle: #172554;
      --forgeui-color-info-border: #1d4ed8;

      --forgeui-color-text: #f0f2f5;
      --forgeui-color-text-secondary: #b8c0cc;
      --forgeui-color-text-tertiary: #8892a0;
      --forgeui-color-text-inverse: #111827;

      --forgeui-color-surface: #13161c;
      --forgeui-color-surface-alt: #1c2028;
      --forgeui-color-surface-hover: #262c36;
      --forgeui-color-surface-active: #333a47;

      --forgeui-color-border: #2f3641;
      --forgeui-color-border-strong: #475563;

      --forgeui-color-focus: #2dd4c0;

      /* ─── Chart palette (dark mode — brighter versions for contrast) ─── */
      --forgeui-color-chart-6: #fbbf24;
      --forgeui-color-chart-7: #f472b6;
      --forgeui-color-chart-8: #60a5fa;
      --forgeui-color-chart-9: #fcd34d;
      --forgeui-color-chart-10: #94a3b8;
    }

    /* Auto-detect system preference when no explicit scheme set */
    @media (prefers-color-scheme: dark) {
      :host(:not([color-scheme])) {
        --forgeui-color-primary: #2dd4c0;
        --forgeui-color-primary-hover: #5ce4d4;
        --forgeui-color-primary-active: #14b8a6;
        --forgeui-color-primary-subtle: #0d3d3e;

        --forgeui-color-success: #4ade80;
        --forgeui-color-success-subtle: #064e3b;
        --forgeui-color-success-border: #15803d;
        --forgeui-color-warning: #fbbf24;
        --forgeui-color-warning-subtle: #78350f;
        --forgeui-color-warning-border: #b45309;
        --forgeui-color-error: #f87171;
        --forgeui-color-error-subtle: #7f1d1d;
        --forgeui-color-error-border: #b91c1c;
        --forgeui-color-info: #60a5fa;
        --forgeui-color-info-subtle: #172554;
        --forgeui-color-info-border: #1d4ed8;

        --forgeui-color-text: #f0f2f5;
        --forgeui-color-text-secondary: #b8c0cc;
        --forgeui-color-text-tertiary: #8892a0;
        --forgeui-color-text-inverse: #111827;

        --forgeui-color-surface: #13161c;
        --forgeui-color-surface-alt: #1c2028;
        --forgeui-color-surface-hover: #262c36;
        --forgeui-color-surface-active: #333a47;

        --forgeui-color-border: #2f3641;
        --forgeui-color-border-strong: #475563;

        --forgeui-color-focus: #2dd4c0;

        --forgeui-color-chart-6: #fbbf24;
        --forgeui-color-chart-7: #f472b6;
        --forgeui-color-chart-8: #60a5fa;
        --forgeui-color-chart-9: #fcd34d;
        --forgeui-color-chart-10: #94a3b8;
      }
    }
  }

  @layer base {
    :host {
      display: block;
      font-family: var(--forgeui-font-family);
      font-size: var(--forgeui-text-base);
      line-height: var(--forgeui-leading-normal);
      color: var(--forgeui-color-text);
      background: var(--forgeui-color-surface);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    :focus-visible {
      outline: 3px solid var(--forgeui-color-focus);
      outline-offset: 2px;
    }

    input:focus-visible, textarea:focus-visible, select:focus-visible {
      outline: none;
    }

    /* Harden against LLM long-text / overflow mistakes without forcing normal words to split. */
    * { overflow-wrap: anywhere; }
    /* Preserve normal word-breaking for code/math contexts */
    code, pre, kbd, samp { word-break: normal; }
  }
`,Wt=se`
  @layer surfaces {
    /* Chat: compact spacing, constrained width */
    :host([surface="chat"]) {
      --forgeui-space-md: 0.75rem;
      --forgeui-space-lg: 1rem;
      --forgeui-space-xl: 1.5rem;
      --forgeui-text-base: 0.875rem;
      --forgeui-input-height: 2.25rem;
      --forgeui-button-height: 2.25rem;
    }

    /* Standalone: full-width, touch-friendly */
    :host([surface="standalone"]) {
      min-height: 100dvh;
    }

    /* Embed: minimal chrome */
    :host([surface="embed"]) {
      --forgeui-shadow-md: none;
      --forgeui-radius-md: 0;
    }
  }
`,ae=se`
  :host {
    display: block;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  :focus-visible {
    outline: 3px solid var(--forgeui-color-focus);
    outline-offset: 2px;
  }
  input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline: none;
  }
`;var ee=class ee extends _t{constructor(){super(...arguments);this._instanceId=`forge-${++ee._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(e){if(!this.store)return e;this.itemContext&&oe(this.itemContext);try{return W(this.store,e)}finally{oe(null)}}getProp(e){let r=this.props?.[e];return typeof r=="string"&&(r.startsWith("$state:")||r.startsWith("$computed:")||r.startsWith("$item:")||r.startsWith("$expr:")||r.includes("{{")&&r.includes("}}"))?this.resolve(r):r}getArray(e){let r=this.getProp(e);return Array.isArray(r)?r:r&&typeof r=="object"?Object.values(r):[]}getString(e,r=""){let o=this.getProp(e);return typeof o=="string"?o:String(o??r)}getNumber(e,r=0){let o=this.getProp(e);return typeof o=="number"?o:Number(o)||r}getBool(e,r=!1){let o=this.getProp(e);return typeof o=="boolean"?o:r}getBoundProp(e,r){let o=typeof this.props?.bind=="string"?this.props.bind:"";if(o){let a=this.resolve(o);if(a!==void 0)return a}let i=this.getProp(e);return i===void 0?r:i}dispatchAction(e,r){let o=typeof this.props?.bind=="string"?this.props.bind:"",i=o?{...r||{},bind:o}:r;this.onAction&&this.onAction(e,i),this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:e,payload:i},bubbles:!0,composed:!0}))}handleAction(e){let r=this.getString("action");r&&this.dispatchAction(r,this.props)}prop(e){return this.getProp(e)}static get sharedStyles(){return[ae]}gapValue(e){let r={none:"0",0:"0","3xs":"var(--forgeui-space-3xs)","2xs":"var(--forgeui-space-2xs)",xs:"var(--forgeui-space-xs)",sm:"var(--forgeui-space-sm)",md:"var(--forgeui-space-md)",lg:"var(--forgeui-space-lg)",xl:"var(--forgeui-space-xl)","2xl":"var(--forgeui-space-2xl)"};if(e==null||e==="")return"var(--forgeui-space-md)";let o=String(e);return o in r?r[o]:/^\d+(\.\d+)?$/.test(o)?`${o}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(o)?o:"var(--forgeui-space-md)"}static get styles(){return[ae]}};ee._instanceCounter=0;var d=ee;var ne=class extends d{static get styles(){return ge`
    :host { display:inline-flex; }
    button { display:inline-flex; align-items:center; justify-content:center; gap:var(--forgeui-space-xs);
      padding:0 var(--forgeui-space-md); height:var(--forgeui-button-height); border:1px solid transparent;
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium);
      cursor:pointer; transition:all var(--forgeui-transition-fast); white-space:nowrap; min-width:var(--forgeui-touch-target); }
    button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    .primary { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); }
    .primary:hover { background:var(--forgeui-color-primary-hover); }
    .secondary { background:transparent; color:var(--forgeui-color-primary); border-color:var(--forgeui-color-primary); }
    .secondary:hover { background:var(--forgeui-color-primary-subtle); }
    .ghost { background:transparent; color:var(--forgeui-color-text-secondary); }
    .ghost:hover { background:var(--forgeui-color-surface-hover); color:var(--forgeui-color-text); }
    .danger { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
    .danger:hover { opacity:0.9; }
    .sm { height:2rem; padding:0 var(--forgeui-space-sm); font-size:var(--forgeui-text-xs); }
    .lg { height:3rem; padding:0 var(--forgeui-space-lg); font-size:var(--forgeui-text-base); }
    button:disabled { opacity:0.5; cursor:not-allowed; }
    button[aria-pressed="true"] { background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); }
    @media (prefers-reduced-motion: reduce) {
      button { transition:none; }
    }
  `}render(){let t=this.getString("label","Button"),e=this.getString("variant","primary"),r=this.getString("size",""),o=this.getBool("disabled"),i=this.getProp("pressed");return ue`<button class="${e} ${r}" ?disabled=${o}
      aria-pressed=${i==null?zt:String(!!i)}
      @click=${a=>this.handleAction(a)}>${t}<slot></slot></button>`}};customElements.define("forgeui-button",ne);var le=class extends d{static get styles(){return ge`
    :host { display:flex; gap:var(--forgeui-space-xs); }
  `}render(){return ue`<slot></slot>`}};customElements.define("forgeui-button-group",le);var ce=class extends d{static get styles(){return ge`
    :host { display:inline-flex; }
    a { color:var(--forgeui-color-primary); text-decoration:none; font-size:var(--forgeui-text-sm); cursor:pointer;
      text-decoration-thickness:1px; text-underline-offset:2px; }
    a:hover { text-decoration:underline; }
    a:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; border-radius:2px; }
  `}render(){let t=this.getString("label",""),e=this.getString("href","#");return ue`<a href="${e}">${t}<slot></slot></a>`}};customElements.define("forgeui-link",ce);import{html as j,css as U,nothing as ft}from"lit";var de=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return U`
    :host { display:block; min-width:0; }
    .heading1 { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.02em; margin:0; overflow-wrap:break-word; }
    .heading2 { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.01em; margin:0; overflow-wrap:break-word; }
    .heading3 { font-size:var(--forgeui-text-xl); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .heading { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .subheading { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; overflow-wrap:break-word; }
    .label { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); color:var(--forgeui-color-text); margin:0; overflow-wrap:break-word; }
    .body { font-size:var(--forgeui-text-base); line-height:var(--forgeui-leading-normal); margin:0; overflow-wrap:break-word; }
    .caption { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin:0; overflow-wrap:break-word; }
    .muted { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin:0; overflow-wrap:break-word; }
    .code { font-family:var(--forgeui-font-mono); font-size:var(--forgeui-text-sm); background:var(--forgeui-color-surface-alt);
      padding:var(--forgeui-space-2xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm); display:inline-block; word-break:normal; overflow-wrap:break-word; }
    .align-left { text-align:left; }
    .align-center { text-align:center; }
    .align-right { text-align:right; }
  `}render(){let t=this.getString("content",""),e=this.getString("variant","body"),o={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[e]||e,i=this.getString("colorScheme",""),a=this.getString("align",""),n=this.getString("weight",""),l={primary:"var(--forgeui-color-primary)",secondary:"var(--forgeui-color-text-secondary)",tertiary:"var(--forgeui-color-text-tertiary)",success:"var(--forgeui-color-success)",warning:"var(--forgeui-color-warning)",error:"var(--forgeui-color-error)",info:"var(--forgeui-color-info)"},g={normal:"var(--forgeui-weight-normal)",medium:"var(--forgeui-weight-medium)",semibold:"var(--forgeui-weight-semibold)",bold:"var(--forgeui-weight-bold)"},u=[];i&&l[i]&&u.push(`color:${l[i]}`),n&&g[n]&&u.push(`font-weight:${g[n]}`);let c=a?`align-${a}`:"",h=j`${t}<slot></slot>`;return o==="heading1"?j`<h1 class="${o} ${c}" style="${u.join(";")}">${h}</h1>`:o==="heading2"?j`<h2 class="${o} ${c}" style="${u.join(";")}">${h}</h2>`:o==="heading3"?j`<h3 class="${o} ${c}" style="${u.join(";")}">${h}</h3>`:j`<div class="${o} ${c}" style="${u.join(";")}">${t}<slot></slot></div>`}};customElements.define("forgeui-text",de);var fe=class extends d{static get styles(){return U`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `}render(){let t=this.getString("src",""),e=this.getString("alt",""),r=this.getString("fit","contain");return t?j`<img src="${t}" alt="${e}" style="object-fit:${r}" loading="lazy">`:j`${ft}`}};customElements.define("forgeui-image",fe);var pe=class extends d{static get styles(){return U`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `}render(){let t=this.getString("name","circle"),e={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},r=e[t]||e.circle;return j`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${r}"/></svg>`}};customElements.define("forgeui-icon",pe);var he=class extends d{static get styles(){return U`
    :host { display:inline-flex; align-items:center; max-width:100%; }
    .badge { display:inline-flex; align-items:center; min-height:1.5rem; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .badge[variant="success"] { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge[variant="error"] { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
  `}render(){let t=this.getString("text","")||this.getString("label",""),e=this.getString("variant","");return j`<span class="badge" variant="${e}">${t}<slot></slot></span>`}};customElements.define("forgeui-badge",he);var me=class extends d{static get styles(){return U`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let t=this.getString("src",""),e=this.getString("name","?"),r=e.split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2);return j`<div class="avatar">${t?j`<img src="${t}" alt="${e}">`:r}<slot></slot></div>`}};customElements.define("forgeui-avatar",me);var ve=class extends d{static get styles(){return U`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); overflow-wrap:break-word; }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); overflow-wrap:break-word; }
  `}render(){let t=this.getString("title","Nothing here"),e=this.getString("description","");return j`
      <div class="title">${t}</div>
      ${e?j`<div class="desc">${e}</div>`:ft}
      <slot></slot>
    `}};customElements.define("forgeui-empty-state",ve);import{html as f,css as H,svg as N,nothing as x}from"lit";var be=class extends d{constructor(){super(...arguments);this._query="";this._sortKey="";this._sortDir="asc";this._page=0}static get styles(){return H`
    :host { display:block; overflow-x:auto; min-width:0; width:100%; }
    .search-input { width:100%; max-width:18rem; border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-sm); margin-bottom:var(--forgeui-space-sm);
      padding:var(--forgeui-space-xs) var(--forgeui-space-sm);
      font:inherit; }
    table { width:100%; min-width:42rem; border-collapse:collapse; font-size:var(--forgeui-text-sm); }
    th { text-align:left; padding:var(--forgeui-space-sm) var(--forgeui-space-md); font-weight:var(--forgeui-weight-semibold);
      color:var(--forgeui-color-text-secondary); border-bottom:2px solid var(--forgeui-color-border-strong); white-space:nowrap;
      text-transform:uppercase; letter-spacing:0.05em; font-size:var(--forgeui-text-xs);
      background:var(--forgeui-color-surface-alt); }
    th button { all:unset; display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); cursor:pointer; border-radius:var(--forgeui-radius-sm); }
    th button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    td { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-bottom:1px solid var(--forgeui-color-border); vertical-align:middle; overflow-wrap:break-word; word-break:break-word; }
    tr:last-child td { border-bottom:none; }
    tbody tr:hover td { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-xl); text-align:center; color:var(--forgeui-color-text-tertiary); }
    .badge { display:inline-flex; align-items:center; justify-content:center; min-height:1.5rem; padding:var(--forgeui-space-3xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-text-secondary); color:var(--forgeui-color-text-inverse); white-space:nowrap; letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; }
    .badge.success { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge.warning { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge.error { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
    .badge.info, .badge.primary { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); }
    .badge.neutral { background:var(--forgeui-color-text-secondary); color:var(--forgeui-color-text-inverse); }
    .align-right { text-align:right; }
    .align-center { text-align:center; }
    .col-right th, .col-right td { text-align:right; }
    .col-center th, .col-center td { text-align:center; }
    caption { text-align:start; font-size:var(--forgeui-text-sm); caption-side:top; padding-bottom:var(--forgeui-space-sm); color:var(--forgeui-color-text-secondary); }
    .row-action { cursor:pointer; }
    .row-action:hover td { background:var(--forgeui-color-surface-hover); }
    .row-action:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:-2px; }
    .pager { display:flex; align-items:center; justify-content:flex-end; gap:var(--forgeui-space-sm); margin-top:var(--forgeui-space-sm);
      color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); flex-wrap:wrap; }
    .pager button { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-sm);
      padding:var(--forgeui-space-2xs) var(--forgeui-space-sm); cursor:pointer; }
    .pager button:disabled { opacity:0.5; cursor:not-allowed; }
  `}_colKey(e){return typeof e=="string"?e:String(e?.key??"")}_colLabel(e){return typeof e=="string"?e:String(e?.label??e?.key??"")}_statusClass(e){let r=String(e??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(r)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(r)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(r)?"neutral":["high","urgent","critical"].includes(r)?"error":["medium","med"].includes(r)?"warning":["low"].includes(r)?"info":["failed","error","rejected","blocked","overdue"].includes(r)?"error":"neutral"}_renderCell(e,r){let o=this._colKey(e),i=r[o],a=e&&typeof e=="object"?e.type:void 0;if(i==null||i==="")return f`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;if(a==="badge"||a==="status"){let n=(e.variant&&typeof e.variant=="object"?e.variant[String(i).toLowerCase()]:null)||this._statusClass(i);return f`<span class="badge ${n}">${String(i)}</span>`}if(a==="number")return typeof i=="number"?i.toLocaleString():String(i);if(a==="date"){let n=typeof i=="string"||typeof i=="number"?new Date(i):i;return n instanceof Date&&!isNaN(n.getTime())?n.toLocaleDateString():String(i)}if(a==="currency"){let n=Number(i);return isNaN(n)?String(i):n.toLocaleString(void 0,{style:"currency",currency:e.currency||"USD"})}return a==="boolean"?i?"\u2713":"\u2717":String(i)}_sortBy(e){e&&(this._sortKey===e?this._sortDir=this._sortDir==="asc"?"desc":"asc":(this._sortKey=e,this._sortDir="asc"),this._page=0,this.requestUpdate())}_setQuery(e){this._query=e,this._page=0,this.requestUpdate()}_filteredRows(e,r){let o=this._query.trim().toLowerCase();return o?e.filter(i=>r.some(a=>String(i[this._colKey(a)]??"").toLowerCase().includes(o))):e}_sortedRows(e){if(!this._sortKey)return e;let r=this._sortDir==="asc"?1:-1;return[...e].sort((o,i)=>{let a=o?.[this._sortKey],n=i?.[this._sortKey];if(typeof a=="number"&&typeof n=="number")return(a-n)*r;let l=String(a??"").toLowerCase(),g=String(n??"").toLowerCase();return(l>g?1:l<g?-1:0)*r})}_setPage(e,r){this._page=Math.max(0,Math.min(e,Math.max(0,r-1))),this.requestUpdate()}render(){let e=this.getProp("data"),r=this.getProp("columns")||[],o=this.getString("emptyMessage","No data yet"),i=this.getString("rowAction",""),a=this.getString("caption",""),n=this.getBool("searchable",!1),l=Math.max(0,Math.floor(this.getNumber("pageSize",0)));if(!Array.isArray(e))return f`<div class="empty">${o}</div>`;let g=r.length>0?r:e.length>0?Object.keys(e[0]):[];if(g.length===0)return f`<div class="empty">${o}</div>`;let u=this._filteredRows(e,g),c=this._sortedRows(u),h=l>0?Math.max(1,Math.ceil(c.length/l)):1,m=Math.min(this._page,h-1);m!==this._page&&(this._page=m);let L=l>0?c.slice(m*l,m*l+l):c;return f`
      ${n?f`
        <input class="search-input" .value=${this._query} aria-label="Search"
          @input=${w=>this._setQuery(w.target.value)} />
      `:x}
      <table>
        ${a?f`<caption>${a}</caption>`:x}
        <thead><tr>${g.map(w=>{let b=this._colLabel(w),P=this._colKey(w),$=typeof w=="object"?w.align:void 0,_=typeof w=="object"?w.width:void 0,y=$==="right"?"align-right":$==="center"?"align-center":"",k=typeof w=="object"&&w.sortable===!0,z=this._sortKey===P;return f`<th class="${y}" style="${_?`width:${_}`:""}" aria-sort=${z?this._sortDir==="asc"?"ascending":"descending":x}>
            ${k?f`
              <button type="button" @click=${()=>this._sortBy(P)}>
                <span>${b}</span>${z?f`<span class="sort" aria-hidden="true">${this._sortDir==="asc"?"\u25B2":"\u25BC"}</span>`:x}
              </button>
            `:b}
          </th>`})}</tr></thead>
        <tbody>${L.length===0?f`<tr><td colspan=${g.length} class="empty">${o}</td></tr>`:L.map((w,b)=>{let P=l>0?m*l+b:b,$=!!i,_=$?String(w[typeof g[0]=="string"?g[0]:g[0]?.key]??`Row ${b+1}`):"";return f`<tr class="${$?"row-action":""}"
                tabindex=${$?0:x}
                role=${$?"button":x}
                aria-label=${$?_:x}
                @click=${$?()=>this.dispatchAction(i,{row:w,index:P}):void 0}
                @keydown=${$?y=>{(y.key==="Enter"||y.key===" ")&&(y.preventDefault(),this.dispatchAction(i,{row:w,index:P}))}:void 0}>
              ${g.map(y=>{let k=typeof y=="object"?y.align:void 0;return f`<td class="${k==="right"?"align-right":k==="center"?"align-center":""}">${this._renderCell(y,w)}</td>`})}</tr>`})}</tbody>
      </table>
      ${l>0&&c.length>0?f`
        <nav class="pager">
          <button type="button" ?disabled=${m===0} @click=${()=>this._setPage(m-1,h)}>Prev</button>
          <span>${m+1} / ${h}</span>
          <button type="button" ?disabled=${m>=h-1} @click=${()=>this._setPage(m+1,h)}>Next</button>
        </nav>
      `:x}
    `}};customElements.define("forgeui-table",be);var xe=class extends d{static get styles(){return H`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); overflow-wrap:break-word; min-width:0; }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); overflow-wrap:break-word; }
  `}render(){let t=this.getProp("data"),e=this.getString("dataPath","");!("data"in(this.props||{}))&&e&&this.store?.hasTable(e)&&(t=Object.values(this.store.getTable(e)));let r=this.getString("emptyMessage","No items");return!Array.isArray(t)||t.length===0?f`<div class="empty">${r}</div>`:f`<div class="list">${t.map((o,i)=>f`
      <div class="item" data-index=${i}><slot name="item" .item=${o} .index=${i}>${JSON.stringify(o)}</slot></div>
    `)}</div>`}};customElements.define("forgeui-list",xe);var ye=class extends d{constructor(){super(...arguments);this._palette=["var(--forgeui-color-primary)","var(--forgeui-color-success)","var(--forgeui-color-warning)","var(--forgeui-color-error)","var(--forgeui-color-info)","var(--forgeui-color-chart-6)","var(--forgeui-color-chart-7)","var(--forgeui-color-chart-8)","var(--forgeui-color-chart-9)","var(--forgeui-color-chart-10)"]}static get styles(){return H`
    :host { display:block; min-width:0; }
    .title { font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); margin-bottom:var(--forgeui-space-xs); color:var(--forgeui-color-text); }
    .wrap { width:100%; overflow:hidden; }
    svg { width:100%; height:auto; display:block; font-family:var(--forgeui-font-family); }
    .grid { stroke:var(--forgeui-color-border); stroke-width:1; opacity:0.6; }
    .axis { stroke:var(--forgeui-color-border-strong); stroke-width:1; }
    .tick-label { fill:var(--forgeui-color-text-secondary); font-size:11px; }
    .bar { fill:var(--forgeui-color-primary); transition:opacity 0.15s; }
    .bar:hover { opacity:0.8; }
    .line { fill:none; stroke:var(--forgeui-color-primary); stroke-width:2.5; }
    .point { fill:var(--forgeui-color-primary); }
    .area { fill:var(--forgeui-color-primary); opacity:0.12; }
    .slice { stroke:var(--forgeui-color-surface); stroke-width:2; }
    .legend { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-sm); margin-top:var(--forgeui-space-sm); font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
    .legend-item { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); }
    .swatch { display:inline-block; width:0.75rem; height:0.75rem; border-radius:2px; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; }
    }
  `}_niceMax(e){if(e<=0)return 1;let r=Math.pow(10,Math.floor(Math.log10(e))),o=e/r;return(o<=1?1:o<=2?2:o<=5?5:10)*r}render(){let e=this.getString("chartType","bar"),r=this.getProp("data")||[],o=this.getString("title",""),i=this.getString("xKey","label")||this.getString("labelKey","label"),a=this.getString("yKey","value")||this.getString("valueKey","value"),n=this.getString("color","");if(!r||r.length===0)return f`
        ${o?f`<div class="title">${o}</div>`:x}
        <div class="empty">No data to display</div>
      `;let l=r.map(b=>typeof b=="number"?{label:"",value:b}:b&&typeof b=="object"?{label:String(b[i]??b.label??b.name??b.x??""),value:Number(b[a]??b.value??b.y??0)||0,color:b.color}:{label:String(b),value:0}),g=600,u=260,c={top:8,right:16,bottom:36,left:48},h=g-c.left-c.right,m=u-c.top-c.bottom,L,w=x;if(e==="pie"||e==="donut"){let b=l.reduce((A,E)=>A+Math.max(0,E.value),0)||1,P=g/2,$=u/2,_=Math.min(h,m)/2-8,y=e==="donut"?_*.55:0,k=-Math.PI/2,z=[],R=[];l.forEach((A,E)=>{let O=Math.max(0,A.value)/b,I=k,C=k+O*Math.PI*2;k=C;let J=C-I>Math.PI?1:0,G=P+_*Math.cos(I),lt=$+_*Math.sin(I),ct=P+_*Math.cos(C),ut=$+_*Math.sin(C),te=A.color||this._palette[E%this._palette.length];if(R.push(te),y>0){let ht=P+y*Math.cos(I),mt=$+y*Math.sin(I),vt=P+y*Math.cos(C),bt=$+y*Math.sin(C);z.push(N`<path class="slice" fill="${te}" d="M ${G} ${lt} A ${_} ${_} 0 ${J} 1 ${ct} ${ut} L ${vt} ${bt} A ${y} ${y} 0 ${J} 0 ${ht} ${mt} Z"/>`)}else z.push(N`<path class="slice" fill="${te}" d="M ${P} ${$} L ${G} ${lt} A ${_} ${_} 0 ${J} 1 ${ct} ${ut} Z"/>`)}),L=N`<g>${z}</g>`,w=f`<div class="legend">${l.map((A,E)=>f`
        <span class="legend-item"><span class="swatch" style="background:${R[E]}"></span>${A.label} (${A.value})</span>
      `)}</div>`}else{let b=Math.max(...l.map(k=>k.value),0),P=this._niceMax(b),$=k=>c.top+m-k/P*m,_=4,y=[];for(let k=0;k<=_;k++){let z=P*k/_,R=$(z);y.push(N`<line class="grid" x1="${c.left}" x2="${c.left+h}" y1="${R}" y2="${R}"/>`),y.push(N`<text class="tick-label" x="${c.left-6}" y="${R+3}" text-anchor="end">${z.toLocaleString()}</text>`)}if(e==="line"||e==="area"){let k=h/Math.max(1,l.length-1),z=l.map((E,O)=>{let I=c.left+O*k,C=$(E.value);return`${O===0?"M":"L"} ${I} ${C}`}).join(" "),R=e==="area"?z+` L ${c.left+h} ${c.top+m} L ${c.left} ${c.top+m} Z`:"",A=n||"var(--forgeui-color-primary)";L=f`
          <g>${y}</g>
          ${e==="area"?N`<path class="area" d="${R}" style="fill:${A};opacity:0.15"/>`:x}
          ${N`<path class="line" d="${z}" style="stroke:${A}"/>`}
          ${l.map((E,O)=>{let I=c.left+O*k,C=$(E.value);return N`<circle class="point" cx="${I}" cy="${C}" r="3" style="fill:${A}"/>
              <text class="tick-label" x="${I}" y="${c.top+m+14}" text-anchor="middle">${E.label}</text>`})}
        `}else{let k=l.length,z=h/k,R=Math.max(2,z*.7),A=z-R;L=f`
          <g>${y}</g>
          ${l.map((E,O)=>{let I=c.left+O*z+A/2,C=$(E.value),J=Math.max(0,c.top+m-C),G=E.color||n||"var(--forgeui-color-primary)";return N`<rect class="bar" x="${I}" y="${C}" width="${R}" height="${J}" rx="2" style="fill:${G}">
                <title>${E.label}: ${E.value}</title>
              </rect>
              <text class="tick-label" x="${I+R/2}" y="${c.top+m+14}" text-anchor="middle">${E.label}</text>`})}
        `}}return f`
      ${o?f`<div class="title">${o}</div>`:x}
      <div class="wrap">
        <svg viewBox="0 0 ${g} ${u}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${o||e+" chart"}">
          ${L}
        </svg>
        ${w}
      </div>
    `}};customElements.define("forgeui-chart",ye);var we=class extends d{constructor(){super(...arguments);this._palette=["var(--forgeui-color-primary)","var(--forgeui-color-success)","var(--forgeui-color-warning)","var(--forgeui-color-error)","var(--forgeui-color-info)","var(--forgeui-color-chart-6)","var(--forgeui-color-chart-7)","var(--forgeui-color-chart-8)","var(--forgeui-color-chart-9)","var(--forgeui-color-chart-10)"]}static get styles(){return H`
    :host { display:block; min-width:0; }
    .title { color:var(--forgeui-color-text); font-size:var(--forgeui-text-sm);
      font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); overflow-wrap:anywhere; }
    ul { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-xs) var(--forgeui-space-md);
      list-style:none; margin:0; padding:0; min-width:0; }
    :host([orientation="vertical"]) ul { flex-direction:column; align-items:flex-start; }
    li { display:inline-flex; align-items:center; gap:var(--forgeui-space-xs); min-width:0;
      color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); line-height:var(--forgeui-leading-normal); }
    .swatch { width:0.75rem; height:0.75rem; flex:0 0 0.75rem; border-radius:2px; background:var(--forgeui-color-primary); }
    .label { color:var(--forgeui-color-text); overflow-wrap:anywhere; }
    .value { color:var(--forgeui-color-text-tertiary); overflow-wrap:anywhere; }
    .empty { color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}_itemValue(e,r,o){if(e&&typeof e=="object"){let i=e;return String(i[r]??i[o]??"")}return String(e??"")}render(){let e=this.getString("title",""),r=this.getProp("items")??this.getProp("data")??[],o=this.getString("dataPath","");!("items"in(this.props||{}))&&!("data"in(this.props||{}))&&o&&this.store?.hasTable(o)&&(r=Object.values(this.store.getTable(o)));let i=Array.isArray(r)?r:[],a=this.getString("labelKey","label"),n=this.getString("valueKey","value"),l=this.getString("colorKey","color"),g=this.getString("orientation","")||this.getString("direction","horizontal"),u=this.getBool("showValues",!0),c=this.getString("emptyMessage","No legend items");return g==="vertical"?this.setAttribute("orientation","vertical"):this.removeAttribute("orientation"),f`
      ${e?f`<div class="title">${e}</div>`:x}
      ${i.length===0?f`<div class="empty">${c}</div>`:f`
        <ul aria-label=${e||"Chart legend"}>
          ${i.map((h,m)=>{let L=this._itemValue(h,a,"name"),w=this._itemValue(h,n,"value"),b=this._itemValue(h,l,"color")||this._palette[m%this._palette.length];return f`<li>
              <span class="swatch" style="background:${b}" aria-hidden="true"></span>
              <span class="label">${L||`Series ${m+1}`}</span>
              ${u&&w?f`<span class="value">${w}</span>`:x}
            </li>`})}
        </ul>
      `}
    `}};customElements.define("forgeui-chart-legend",we);var $e=class extends d{static get styles(){return H`
    :host { display:block; min-width:0; }
    .card { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); min-width:0; padding:var(--forgeui-space-md);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface); }
    .top { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--forgeui-space-sm); }
    .label { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); overflow-wrap:anywhere; }
    .value { color:var(--forgeui-color-text); font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); line-height:1.1; overflow-wrap:anywhere; }
    .meta { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-xs); overflow-wrap:anywhere; }
    .trend { display:inline-flex; align-items:center; gap:var(--forgeui-space-3xs); border-radius:var(--forgeui-radius-sm);
      padding:var(--forgeui-space-3xs) var(--forgeui-space-xs); color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-text-secondary);
      font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold); white-space:nowrap; }
    .trend.up { background:var(--forgeui-color-success); }
    .trend.down { background:var(--forgeui-color-error); }
  `}_trendClass(t){let e=String(t??"").toLowerCase();return e==="up"||e==="positive"||e.startsWith("+")?"up":e==="down"||e==="negative"||e.startsWith("-")?"down":"neutral"}render(){let t=this.getString("label",""),e=this.getProp("value"),r=this.getProp("trend"),o=this.getString("trendLabel",""),i=this.getString("subtitle",""),a=this.getString("unit",""),n=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),l=o||(r==null?"":String(r)),g=this._trendClass(r);return f`<div class="card">
      <div class="top">
        ${t?f`<div class="label">${t}</div>`:x}
        ${l?f`<span class="trend ${g}">${g==="up"?"\u2191":g==="down"?"\u2193":"\u2192"} ${l}</span>`:x}
      </div>
      <div class="value">${n}${a?f` <span class="meta">${a}</span>`:x}</div>
      ${i?f`<div class="meta">${i}</div>`:x}
    </div>`}};customElements.define("forgeui-stat-card",$e);var ke=class extends d{static get styles(){return H`
    :host { display:grid; min-width:0; gap:var(--forgeui-space-md); grid-template-columns:repeat(auto-fit,minmax(min(12rem,100%),1fr)); }
  `}render(){let t=Math.max(0,Math.floor(this.getNumber("columns",0))),e=this.gapValue(this.getString("gap","md"));return this.style.gap=e,this.style.gridTemplateColumns=t>0?`repeat(${t}, minmax(0, 1fr))`:"",f`<slot></slot>`}};customElements.define("forgeui-kpi-grid",ke);var Se=class extends d{static get styles(){return H`
    :host { display:flex; flex-direction:column; padding:var(--forgeui-space-md); background:var(--forgeui-color-surface);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-width:0; gap:var(--forgeui-space-2xs); }
    :host([variant="plain"]) { background:transparent; border:none; padding:0; }
    .label { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); overflow-wrap:break-word; }
    .value-row { display:flex; align-items:center; gap:var(--forgeui-space-xs); flex-wrap:wrap; min-width:0; }
    .value { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); color:var(--forgeui-color-text); line-height:1.1; letter-spacing:-0.02em; overflow-wrap:break-word; min-width:0; }
    .unit, .suffix { font-size:var(--forgeui-text-base); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); overflow-wrap:break-word; }
    .trend { display:inline-flex; align-items:center; justify-content:center; min-width:1.5rem; min-height:1.5rem; gap:var(--forgeui-space-3xs);
      padding:var(--forgeui-space-3xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-bold); line-height:1; white-space:nowrap; }
    .trend.icon-only { width:1.5rem; padding:0; }
    .trend.up { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-success); }
    .trend.down { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-error); }
    .trend.neutral { color:var(--forgeui-color-text-inverse); background:var(--forgeui-color-text-secondary); }
    .subtitle { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); overflow-wrap:break-word; }
    .goal { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); overflow-wrap:break-word; }
  `}_trendMeta(t){if(t==null||t==="")return null;if(typeof t=="number")return t>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(t)}%`}:t<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(t)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof t=="string"){let e=t.toLowerCase(),r=t.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(r){let o=parseFloat(r[1]),i=r[2];return o>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(o)}${i}`}:o<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(o)}${i}`}:{dir:"neutral",arrow:"\u2192",display:`0${i}`}}return e==="up"||e==="positive"||e==="increase"?{dir:"up",arrow:"\u2191",display:""}:e==="down"||e==="negative"||e==="decrease"?{dir:"down",arrow:"\u2193",display:""}:e==="flat"||e==="neutral"||e==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:t}}return null}render(){let t=this.getString("label",""),e=this.getProp("value"),r=this.getProp("trend"),o=this.getString("trendLabel",""),i=this.getProp("goal"),a=this.getString("unit",""),n=this.getString("suffix",""),l=this.getString("subtitle",""),g=this.getString("variant","");g&&this.setAttribute("variant",g);let u=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),c=this._trendMeta(r);return f`
      ${t?f`<div class="label">${t}</div>`:x}
      <div class="value-row">
        <span class="value">${u}</span>
        ${a?f`<span class="unit">${a}</span>`:x}
        ${n?f`<span class="suffix">${n}</span>`:x}
        ${c?f`<span class="trend ${c.dir} ${!c.display&&!o?"icon-only":""}">${c.arrow}${c.display?f` ${c.display}`:x}${o?f` ${o}`:x}</span>`:x}
      </div>
      ${l?f`<div class="subtitle">${l}</div>`:x}
      ${i!=null&&i!==""?f`<div class="goal">Goal: ${typeof i=="number"?i.toLocaleString():i}</div>`:x}
    `}};customElements.define("forgeui-metric",Se);import{css as Et,svg as T}from"lit";var _e=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return Et`
    :host { display:block; }
    svg { display:block; }
  `}render(){let t=this.getNumber("width",400),e=this.getNumber("height",300),r=this.getString("background","transparent"),o=this.getProp("shapes")||[];return T`
      <svg width="${t}" height="${e}" style="background:${r}" viewBox="0 0 ${t} ${e}">
        ${o.map(i=>this.renderShape(i))}
      </svg>
    `}renderShape(t){let e={fill:t.fill??void 0,stroke:t.stroke??void 0,"stroke-width":t.strokeWidth??void 0,opacity:t.opacity??void 0},r=t.action?()=>{this.onAction&&this.onAction(t.action)}:void 0,o=t.action?"cursor:pointer":void 0;switch(t.type){case"rect":return T`<rect
          x="${t.x??0}" y="${t.y??0}"
          width="${t.width??0}" height="${t.height??0}"
          rx="${t.rx??0}" ry="${t.ry??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"circle":return T`<circle
          cx="${t.cx??0}" cy="${t.cy??0}" r="${t.r??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"ellipse":return T`<ellipse
          cx="${t.cx??t.x??0}" cy="${t.cy??t.y??0}"
          rx="${t.rx??(t.width?t.width/2:0)}" ry="${t.ry??(t.height?t.height/2:0)}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"line":return T`<line
          x1="${t.x1??0}" y1="${t.y1??0}"
          x2="${t.x2??0}" y2="${t.y2??0}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"text":return T`<text
          x="${t.x??0}" y="${t.y??0}"
          fill="${e.fill??"currentColor"}"
          font-size="${t.fontSize??14}"
          font-weight="${t.fontWeight??"normal"}"
          font-family="${t.fontFamily??"sans-serif"}"
          text-anchor="${t.textAnchor??"start"}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        >${t.content??""}</text>`;case"path":return T`<path
          d="${t.d??""}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;default:return T``}}};customElements.define("forgeui-drawing",_e);import{html as D,css as Q,nothing as K}from"lit";var ze=class extends d{static get styles(){return Q`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    .alert { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      border-left:4px solid; font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text); line-height:var(--forgeui-leading-normal); overflow-wrap:break-word; }
    .info { background:var(--forgeui-color-info-subtle); border-color:var(--forgeui-color-info); }
    .info strong { color:var(--forgeui-color-info); }
    .success { background:var(--forgeui-color-success-subtle); border-color:var(--forgeui-color-success); }
    .success strong { color:var(--forgeui-color-success); }
    .warning { background:var(--forgeui-color-warning-subtle); border-color:var(--forgeui-color-warning); }
    .warning strong { color:var(--forgeui-color-warning); }
    .error { background:var(--forgeui-color-error-subtle); border-color:var(--forgeui-color-error); }
    .error strong { color:var(--forgeui-color-error); }
  `}render(){let t=this.getString("variant","info"),e=this.getString("title",""),r=this.getString("message","");return D`<div class="alert ${t}" role=${t==="error"||t==="warning"?"alert":"status"}>
      ${e?D`<strong>${e}</strong> `:K}${r}<slot></slot>
    </div>`}};customElements.define("forgeui-alert",ze);var Ee=class extends d{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=e=>this._onKeydown(e);this._close=()=>{this.dispatchAction("close")}}static get styles(){return Q`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-lg); min-width:min(20rem, 90vw); max-width:90vw; max-height:90vh; overflow:auto;
      border:1px solid var(--forgeui-color-border);
      box-shadow:var(--forgeui-shadow-lg); z-index:1; word-break:break-word; }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forgeui-space-xs); margin-top:var(--forgeui-space-lg); }
  `}render(){let e=this.getString("title",""),r=this.getBool("open"),o=`${this._instanceId}-title`;return r?this.setAttribute("open",""):this.removeAttribute("open"),r?D`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${e?o:K}"
        tabindex="-1"
        @click=${i=>i.stopPropagation()}
      >
        ${e?D`<h2 id="${o}" class="title">${e}</h2>`:K}
        <slot></slot>
      </div>
    `:K}updated(e){if(super.updated?.(e),e.has("props")){let r=this.getBool("open"),i=e.get("props")?.open??!1;r&&!i?this._onOpen():!r&&i&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let e=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??e)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(e){if(e.key==="Escape"){e.preventDefault(),this._close();return}e.key==="Tab"&&this._trapFocus(e)}_trapFocus(e){let r=this._allFocusableInDialog();if(r.length===0){e.preventDefault();return}let o=r[0],i=r[r.length-1],a=this.shadowRoot?.activeElement??document.activeElement;e.shiftKey?(a===o||!this._dialogContains(a))&&(e.preventDefault(),i.focus()):(a===i||!this._dialogContains(a))&&(e.preventDefault(),o.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let e=this.shadowRoot?.querySelector(".dialog");if(!e)return[];let r='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',o=Array.from(e.querySelectorAll(r)),i=e.querySelector("slot"),a=i instanceof HTMLSlotElement?i.assignedElements({flatten:!0}).flatMap(n=>[n,...Array.from(n.querySelectorAll(r))].filter(g=>g instanceof HTMLElement&&g.matches(r))):[];return[...o,...a].filter(n=>!n.disabled)}_dialogContains(e){return e?this.shadowRoot?.querySelector(".dialog")?.contains(e)??!1:!1}};customElements.define("forgeui-dialog",Ee);var Me=class extends d{static get styles(){return Q`
    :host { display:block; flex:1 1 auto; min-width:8rem; }
    .progress { height:0.625rem; background:var(--forgeui-color-surface-alt); border-radius:var(--forgeui-radius-sm); overflow:hidden; border:1px solid var(--forgeui-color-border); }
    .bar { height:100%; background:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-full); transition:width var(--forgeui-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .meta { display:flex; align-items:center; justify-content:space-between; gap:var(--forgeui-space-xs);
      font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-2xs); }
    .value { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-semibold); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; animation:none; }
    }
  `}render(){let t=this.getProp("value"),e=this.getNumber("max",100),r=t==null,o=r?0:Math.max(0,Math.min(Number(t),e)),i=r?0:o/e*100,a=this.getString("label",""),n=this.getBool("showValue");return D`
      ${a||n?D`
        <div class="meta">
          ${a?D`<span>${a}</span>`:D`<span></span>`}
          ${n?D`<span class="value">${Math.round(i)}%</span>`:K}
        </div>
      `:K}
      <div
        class="progress ${r?"indeterminate":""}"
        role="progressbar"
        aria-label="${a||"Progress"}"
        aria-valuemin="0"
        aria-valuemax="${e}"
        aria-valuenow="${r?K:o}"
        aria-valuetext="${r?"Loading":`${Math.round(i)}%`}"
      >
        <div class="bar" style=${r?"":`width:${i}%`}></div>
      </div>
    `}};customElements.define("forgeui-progress",Me);var Pe=class extends d{static get styles(){return Q`
    :host { display:block; position:fixed; bottom:var(--forgeui-space-lg); right:var(--forgeui-space-lg); z-index:60; }
    .toast { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-text); color:var(--forgeui-color-text-inverse); font-size:var(--forgeui-text-sm);
      box-shadow:var(--forgeui-shadow-lg); max-width:20rem; overflow-wrap:break-word; }
  `}render(){let t=this.getString("message","");return t?D`<div class="toast">${t}</div>`:D`${K}`}};customElements.define("forgeui-toast",Pe);var Ae=class extends d{static get styles(){return Q`
    :host { display:block; }
    .error { padding:var(--forgeui-space-sm); background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error);
      border:1px solid var(--forgeui-color-error); border-radius:var(--forgeui-radius-md); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getString("msg","Unknown error");return D`<div class="error" role="alert">⚠ ${t}</div>`}};customElements.define("forgeui-error",Ae);import{html as p,css as M,nothing as v}from"lit";function Mt(s){return`forgeui_${(s||"global").replace(/[^a-zA-Z0-9-]/g,"_")}`}var Ie="f";function Pt(s){return new Promise((t,e)=>{let r=i=>e(i??new Error("IDB"));if(!globalThis.indexedDB)return r();let o=indexedDB.open(`${Mt(s)}_f`,1);o.onupgradeneeded=()=>{o.result.createObjectStore(Ie)},o.onsuccess=()=>t(o.result),o.onerror=o.onblocked=()=>r(o.error)})}async function pt(s,t){if(s.length===0)return;let e=null;try{e=await Pt(t),await new Promise((r,o)=>{let i=e.transaction(Ie,"readwrite"),a=i.objectStore(Ie);for(let{file:n,id:l}of s)a.put(n,l);i.oncomplete=()=>r(),i.onerror=i.onabort=()=>o(i.error)})}catch{return}finally{e?.close()}}var Ce=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); overflow-wrap:break-word; }
    input, textarea { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-base);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); height:var(--forgeui-input-height);
      transition:border-color var(--forgeui-transition-fast); box-sizing:border-box; min-width:0; }
    input:focus, textarea:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    input::placeholder { color:var(--forgeui-color-text-tertiary); }
    textarea { height:auto; min-height:5rem; resize:vertical; }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
    .error { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-error); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),r=this.getString("hint",""),o=this.getString("error",""),i=this.getString("inputType","")||this.getString("type","text"),a=this.getBool("multiline"),n=String(this.getBoundProp("value","")??""),l=this._instanceId;return p`
      ${t?p`<label for="${l}">${t}</label>`:v}
      ${a?p`<textarea id="${l}" placeholder="${e}" .value=${n} @input=${g=>this.dispatchAction("change",{value:g.target.value})}></textarea>`:p`<input id="${l}" type="${i}" placeholder="${e}" .value=${n} @input=${g=>this.dispatchAction("change",{value:g.target.value})}>`}
      ${r&&!o?p`<div class="hint">${r}</div>`:v}
      ${o?p`<div class="error">${o}</div>`:v}
    `}};customElements.define("forgeui-text-input",Ce);var je=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); overflow-wrap:break-word; }
    textarea { width:100%; min-height:5rem; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-base); background:var(--forgeui-color-surface);
      color:var(--forgeui-color-text); transition:border-color var(--forgeui-transition-fast); box-sizing:border-box; min-width:0; resize:vertical; }
    textarea:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    textarea::placeholder { color:var(--forgeui-color-text-tertiary); }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
    .error { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-error); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),r=this.getString("hint",""),o=this.getString("error",""),i=Math.max(1,Math.floor(this.getNumber("rows",4))),a=this.getProp("maxLength"),n=this.getBool("required"),l=this.getBool("disabled"),g=String(this.getBoundProp("value","")??""),u=this._instanceId;return p`
      ${t?p`<label for="${u}">${t}</label>`:v}
      <textarea id="${u}" rows=${i} placeholder="${e}" maxlength=${a??v}
        ?required=${n} ?disabled=${l} .value=${g}
        @input=${c=>this.dispatchAction("change",{value:c.target.value})}></textarea>
      ${r&&!o?p`<div class="hint">${r}</div>`:v}
      ${o?p`<div class="error">${o}</div>`:v}
    `}};customElements.define("forgeui-textarea",je);var Le=class extends d{static get styles(){return M`
    :host { display:block; min-width:0; }
    form { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
  `}render(){let t=this.getString("action","");return p`<form @submit=${e=>{e.preventDefault();let r={submitted:!0};t&&this.dispatchAction(t,r),this.dispatchEvent(new CustomEvent("forgeui-submit",{detail:r,bubbles:!0,composed:!0}))}}><slot></slot></form>`}};customElements.define("forgeui-form",Le);var Re=class extends d{static get styles(){return M`
    :host { display:block; min-width:0; }
    fieldset { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); padding:var(--forgeui-space-md); margin:0; min-width:0; }
    legend { padding:0 var(--forgeui-space-2xs); color:var(--forgeui-color-text); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-semibold); }
    .body { display:flex; flex-direction:column; gap:var(--forgeui-space-sm); }
    .description { color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-xs); margin-bottom:var(--forgeui-space-sm); }
    .error { color:var(--forgeui-color-error); font-size:var(--forgeui-text-xs); margin-top:var(--forgeui-space-sm); }
  `}render(){let t=this.getString("label",""),e=this.getString("description",""),r=this.getString("error","");return p`<fieldset>
      ${t?p`<legend>${t}</legend>`:v}
      ${e?p`<div class="description">${e}</div>`:v}
      <div class="body"><slot></slot></div>
      ${r?p`<div class="error">${r}</div>`:v}
    </fieldset>`}};customElements.define("forgeui-field-group",Re);var De=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("min"),r=this.getProp("max"),o=this.getProp("step"),i=this.getBoundProp("value"),a=this._instanceId;return p`
      ${t?p`<label for="${a}">${t}</label>`:v}
      <input id="${a}" type="number" min=${e} max=${r} step=${o} .value=${i??""}
        @input=${n=>this.dispatchAction("change",{value:Number(n.target.value)})}>
    `}};customElements.define("forgeui-number-input",De);var Be=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    select { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("options")||[],r=String(this.getBoundProp("value","")??""),o=this._instanceId;return p`
      ${t?p`<label for="${o}">${t}</label>`:v}
      <select id="${o}" .value=${r} @change=${i=>this.dispatchAction("change",{value:i.target.value})}>
        ${e.map(i=>p`<option value=${typeof i=="string"?i:i.value} ?selected=${(typeof i=="string"?i:i.value)===r}>
          ${typeof i=="string"?i:i.label||i.value}
        </option>`)}
      </select>
    `}};customElements.define("forgeui-select",Be);var Ve=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),r=this.getString("hint",""),o=this.getProp("options")||[],i=String(this.getBoundProp("value","")??""),a=this.getBool("disabled"),n=this.getBool("required"),l=this._instanceId,g=`${l}-list`;return p`
      ${t?p`<label for="${l}">${t}</label>`:v}
      <input id="${l}" list="${g}" role="combobox" aria-autocomplete="list"
        placeholder="${e}" .value=${i} ?disabled=${a} ?required=${n}
        @input=${u=>this.dispatchAction("change",{value:u.target.value})}>
      <datalist id="${g}">
        ${o.map(u=>{let c=String(typeof u=="string"?u:u?.value??u?.label??""),h=typeof u=="string"?"":String(u?.label??"");return p`<option value=${c} label=${h}></option>`})}
      </datalist>
      ${r?p`<div class="hint">${r}</div>`:v}
    `}};customElements.define("forgeui-combobox",Ve);var Ne=class extends d{static get styles(){return M`
    :host { display:block; min-width:0; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    select { width:100%; min-height:calc(var(--forgeui-input-height) * 2); padding:var(--forgeui-space-xs) var(--forgeui-space-sm);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); font:inherit;
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-2xs); margin-top:var(--forgeui-space-xs); padding:var(--forgeui-space-xs); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-height:var(--forgeui-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-xs); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; border-radius:2px; }
    .tag button:focus-visible { outline:2px solid var(--forgeui-color-focus); outline-offset:1px; }
  `}render(){let t=this.getString("label",""),e=this.getProp("options")||[],r=this.getBoundProp("value",this.getProp("selected")??[]),o=Number(this.getProp("maxSelections")),i=Number.isFinite(o)&&o>=0?o:1/0,a=(Array.isArray(r)?r.map(u=>String(u)):[]).slice(0,i),n=this.getBool("disabled"),l=this._instanceId,g=u=>{let c=a.filter(h=>h!==u);this.dispatchAction("remove",{value:u}),this.dispatchAction("change",{value:c,selected:c})};return p`
      ${t?p`<label for="${l}">${t}</label>`:v}
      <select id="${l}" multiple ?disabled=${n}
        @change=${u=>{let c=Array.from(u.target.selectedOptions).map(h=>h.value).slice(0,i);this.dispatchAction("change",{value:c,selected:c})}}>
        ${e.map(u=>{let c=String(typeof u=="string"?u:u?.value??u?.label??"");return p`<option value=${c} ?selected=${a.includes(c)}>
            ${typeof u=="string"?u:u?.label??c}
          </option>`})}
      </select>
      <div class="tags">
        ${a.map(u=>p`<span class="tag">${u}<button type="button" aria-label=${`Remove ${u}`} @click=${()=>g(u)}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forgeui-multi-select",Ne);var Oe=class extends d{static get styles(){return M`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    fieldset { border:0; padding:0; margin:0; min-width:0; }
    legend { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); }
    .options { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    label { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text); cursor:pointer; overflow-wrap:anywhere; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); flex:0 0 auto; }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("hint",""),r=this.getProp("options")||[],o=String(this.getBoundProp("value","")??""),i=this.getBool("disabled"),a=this._instanceId;return p`
      <fieldset ?disabled=${i}>
        ${t?p`<legend>${t}</legend>`:v}
        <div class="options">
          ${r.map((n,l)=>{let g=String(typeof n=="string"?n:n?.value??n?.label??""),u=String(typeof n=="string"?n:n?.label??g),c=`${a}-${l}`;return p`<label for=${c}>
              <input id=${c} type="radio" name=${a} value=${g} ?checked=${g===o}
                @change=${h=>this.dispatchAction("change",{value:h.target.value})}>
              <span>${u}</span>
            </label>`})}
        </div>
      </fieldset>
      ${e?p`<div class="hint">${e}</div>`:v}
    `}};customElements.define("forgeui-radio-group",Oe);var Te=class extends d{static get styles(){return M`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); margin-bottom:var(--forgeui-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); cursor:pointer; }
    label { font-size:var(--forgeui-text-sm); cursor:pointer; }
    :focus-within label { text-decoration:underline; }
  `}render(){let t=this.getString("label",""),e=!!this.getBoundProp("checked",this.getProp("value")??!1),r=this._instanceId;return p`
      <input id="${r}" type="checkbox" ?checked=${e} @change=${o=>this.dispatchAction("change",{checked:o.target.checked})}>
      ${t?p`<label for="${r}">${t}</label>`:v}
    `}};customElements.define("forgeui-checkbox",Te);var Ke=class extends d{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let e=!!this.getBoundProp("on",this.getProp("value")??!1);this.dispatchAction("change",{value:!e,checked:!e})};this._onKeydown=e=>{(e.key==="Enter"||e.key===" "||e.key==="Spacebar")&&(e.preventDefault(),this._toggle())}}static get styles(){return M`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-sm); margin-bottom:var(--forgeui-space-xs); }
    .switch { position:relative; width:2.75rem; height:1.5rem; background:var(--forgeui-color-border-strong);
      border-radius:var(--forgeui-radius-full); cursor:pointer; border:none; padding:0;
      transition:background var(--forgeui-transition-fast); }
    .switch[aria-checked="true"] { background:var(--forgeui-color-primary); }
    .switch::after { content:''; position:absolute; top:2px; left:2px; width:1.25rem; height:1.25rem;
      background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-full); transition:transform var(--forgeui-transition-fast); }
    .switch[aria-checked="true"]::after { transform:translateX(1.25rem); }
    .switch:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    .switch:disabled { opacity:0.5; cursor:not-allowed; }
    .toggle-label { display:inline-flex; align-items:center; gap:var(--forgeui-space-sm); cursor:pointer; }
    .toggle-text { font-size:var(--forgeui-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .switch, .switch::after { transition:none; }
    }
  `}render(){let e=!!this.getBoundProp("on",this.getProp("value")??!1),r=this.getString("label",""),o=this.getBool("disabled"),i=this._instanceId;return p`
      <label for="${i}" class="toggle-label">
        <button
          id="${i}"
          class="switch"
          role="switch"
          type="button"
          aria-checked="${e?"true":"false"}"
          ?disabled=${o}
          @click="${this._toggle}"
          @keydown="${this._onKeydown}"
        ></button>
        ${r?p`<span class="toggle-text">${r}</span>`:v}
      </label>
    `}};customElements.define("forgeui-toggle",Ke);var We=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getString("value",""),r=this._instanceId;return p`
      ${t?p`<label for="${r}">${t}</label>`:v}
      <input id="${r}" type="date" .value=${e} @change=${o=>this.dispatchAction("change",{value:o.target.value})}>
    `}};customElements.define("forgeui-date-picker",We);var He=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    .group { display:grid; gap:var(--forgeui-space-xs); min-width:0; }
    .legend { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); color:var(--forgeui-color-text); overflow-wrap:break-word; }
    .fields { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-medium); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    input:disabled { opacity:0.6; cursor:not-allowed; }
    @media (max-width: 480px) { .fields { grid-template-columns:1fr; } }
  `}render(){let t=this.getString("label",""),e=this.getBoundProp("value",this.getProp("value")),r=e&&typeof e=="object"&&!Array.isArray(e)?e:{},o=String(r.start??this.getProp("start")??""),i=String(r.end??this.getProp("end")??""),a=this.getString("min",""),n=this.getString("max",""),l=this.getBool("disabled"),g=this.getString("action","change"),u=`${this._instanceId}-start`,c=`${this._instanceId}-end`,h=m=>{this.dispatchAction(g,{value:m,start:m.start,end:m.end})};return p`
      <div class="group" role="group" aria-label=${t||"Date range"}>
        ${t?p`<div class="legend">${t}</div>`:v}
        <div class="fields">
          <div>
            <label for="${u}">${this.getString("startLabel","Start")}</label>
            <input id="${u}" type="date" .value=${o} min=${a||v} max=${n||v} ?disabled=${l}
              @change=${m=>h({start:m.target.value,end:i})}>
          </div>
          <div>
            <label for="${c}">${this.getString("endLabel","End")}</label>
            <input id="${c}" type="date" .value=${i} min=${a||v} max=${n||v} ?disabled=${l}
              @change=${m=>h({start:o,end:m.target.value})}>
          </div>
        </div>
      </div>
    `}};customElements.define("forgeui-date-range-picker",He);var qe=class extends d{static get styles(){return M`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input[type=range] { width:100%; accent-color:var(--forgeui-color-primary); min-width:0; }
    .value { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
  `}render(){let t=this.getString("label",""),e=this.getNumber("min",0),r=this.getNumber("max",100),o=this.getNumber("step",1),i=this.getBoundProp("value",e),a=Number(i);Number.isFinite(a)||(a=e);let n=this._instanceId;return p`
      ${t?p`<label for="${n}">${t}</label>`:v}
      <input id="${n}" type="range" min=${e} max=${r} step=${o} .value=${a}
        @input=${l=>this.dispatchAction("change",{value:Number(l.target.value)})}>
      <div class="value">${a}</div>
    `}};customElements.define("forgeui-slider",qe);var Ue=class extends d{constructor(){super(...arguments);this._dragging=!1;this._openFilePicker=()=>{this.shadowRoot?.querySelector('input[type="file"]')?.click()};this._onDropzoneKeydown=e=>{e.key!=="Enter"&&e.key!==" "||(e.preventDefault(),this._openFilePicker())};this._onFileChange=e=>{let r=Array.from(e.target.files??[]);this._processFiles(r)};this._onDragOver=e=>{e.preventDefault(),!this._dragging&&(this._dragging=!0,this.requestUpdate())};this._onDragLeave=e=>{e.currentTarget===e.target&&(this._dragging=!1,this.requestUpdate())};this._onDrop=e=>{e.preventDefault(),this._dragging=!1,this.requestUpdate(),this._processFiles(Array.from(e.dataTransfer?.files??[]))}}static get styles(){return M`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .dropzone { border:2px dashed var(--forgeui-color-border-strong); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forgeui-transition-fast); }
    .dropzone:hover, .dropzone.dragging { border-color:var(--forgeui-color-primary); background:var(--forgeui-color-primary-subtle); }
    .dropzone:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `}_maxSizeBytes(){let e=this.getProp("maxSize");if(typeof e=="number"&&Number.isFinite(e)&&e>=0)return Math.floor(e);if(typeof e!="string")return null;let r=e.trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);if(!r)return null;let o=Number(r[1]),i=(r[2]||"b").toLowerCase(),a=i==="gb"?1<<30:i==="mb"?1<<20:i==="kb"?1024:1,n=o*a;return Number.isFinite(n)?Math.floor(n):null}_newFileId(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}_${Math.random().toString(36).slice(2)}`}_processFiles(e){let r=this.getBool("multiple"),o=this._maxSizeBytes(),i=(r?e:e.slice(0,1)).map(c=>{let h=this._newFileId(),m=o==null||c.size<=o,L={id:h,name:c.name,size:c.size,type:c.type,lastModified:c.lastModified,accepted:m,storageKey:m?h:null};return m||(L.error="maxSize"),[c,L]}),a=i.filter(([,c])=>c.accepted),n=i.map(([,c])=>c),l=a.map(([,c])=>c),g=r?l:l[0]??null,u=l[0]??null;this.dispatchAction("change",{id:u?.id??null,uuid:u?.id??null,name:u?.name??null,size:u?.size??null,type:u?.type??null,lastModified:u?.lastModified??null,storageKey:u?.storageKey??null,value:g,files:n,rejected:n.filter(c=>!c.accepted),multiple:r,maxSize:o}),pt(a.map(([c,h])=>({file:c,id:h.id})))}render(){let e=this.getString("label","Upload file"),r=this.getString("accept","*"),o=this.getBool("multiple");return p`
      ${e?p`<label>${e}</label>`:v}
      <div class="dropzone ${this._dragging?"dragging":""}" role="button" tabindex="0"
        @click=${this._openFilePicker} @keydown=${this._onDropzoneKeydown}
        @dragover=${this._onDragOver} @dragleave=${this._onDragLeave} @drop=${this._onDrop}>
        <p>Drop</p>
        <input type="file" accept="${r}" ?multiple=${o} hidden @change=${this._onFileChange}>
      </div>
    `}};customElements.define("forgeui-file-upload",Ue);import{html as S,css as V,nothing as F}from"lit";var Fe=class extends d{static get styles(){return V`
    :host { display:block; min-width:0; }
    header { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--forgeui-space-md);
      min-width:0; padding-block:var(--forgeui-space-sm); border-bottom:1px solid var(--forgeui-color-border); }
    :host([density="compact"]) header { padding-block:var(--forgeui-space-xs); }
    :host([align="center"]) header { align-items:center; }
    .copy { min-width:0; display:flex; flex-direction:column; gap:var(--forgeui-space-2xs); }
    .eyebrow { color:var(--forgeui-color-primary); font-size:var(--forgeui-text-xs);
      font-weight:var(--forgeui-weight-semibold); text-transform:uppercase; overflow-wrap:anywhere; }
    h1 { margin:0; color:var(--forgeui-color-text); font-size:var(--forgeui-text-2xl);
      line-height:var(--forgeui-leading-tight); font-weight:var(--forgeui-weight-semibold); overflow-wrap:anywhere; }
    :host([density="compact"]) h1 { font-size:var(--forgeui-text-xl); }
    .subtitle { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm);
      line-height:var(--forgeui-leading-normal); overflow-wrap:anywhere; }
    .meta { color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-xs); overflow-wrap:anywhere; }
    .actions { display:flex; align-items:center; justify-content:flex-end; gap:var(--forgeui-space-xs);
      flex-wrap:wrap; min-width:0; }
    @media (max-width: 640px) {
      header { flex-direction:column; align-items:stretch; }
      .actions { justify-content:flex-start; }
    }
  `}render(){let t=this.getString("title","Untitled"),e=this.getString("subtitle",""),r=this.getString("eyebrow",""),o=this.getString("meta",""),i=this.getString("density",""),a=this.getString("align","");return i?this.setAttribute("density",i):this.removeAttribute("density"),a?this.setAttribute("align",a):this.removeAttribute("align"),S`
      <header>
        <div class="copy">
          ${r?S`<div class="eyebrow">${r}</div>`:F}
          <h1>${t}</h1>
          ${e?S`<div class="subtitle">${e}</div>`:F}
          ${o?S`<div class="meta">${o}</div>`:F}
        </div>
        <div class="actions"><slot></slot></div>
      </header>
    `}};customElements.define("forgeui-page-header",Fe);var Je=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return V`
    :host { display: flex; flex-direction: column; min-width: 0; }
    :host([direction="row"]) { flex-direction: row; flex-wrap: wrap; }
    :host([direction="column"]) { flex-direction: column; }
    :host([align="start"]) { align-items: flex-start; }
    :host([align="center"]) { align-items: center; }
    :host([align="end"]) { align-items: flex-end; }
    :host([align="stretch"]) { align-items: stretch; }
    :host([justify="start"]) { justify-content: flex-start; }
    :host([justify="center"]) { justify-content: center; }
    :host([justify="end"]) { justify-content: flex-end; }
    :host([justify="between"]) { justify-content: space-between; }
    :host([justify="around"]) { justify-content: space-around; }
    :host([wrap]) { flex-wrap: wrap; }
    :host([nowrap]) { flex-wrap: nowrap; }
  `}render(){let t=this.getString("direction","column"),e=t==="horizontal"||t==="row"?"row":"column",r=this.getString("gap","")||this.getString("spacing","md"),o=this.getString("padding",""),i=this.getString("align",""),a=this.getString("justify",""),n=this.getBool("wrap"),l=this.gapValue(r),g=o?this.gapValue(o):"0";return this.setAttribute("direction",e),i&&this.setAttribute("align",i),a&&this.setAttribute("justify",a),n&&this.setAttribute("wrap",""),this.style.gap=l,this.style.padding=g,S`<slot></slot>`}};customElements.define("forgeui-stack",Je);var Ze=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return V`
    :host { display: grid; min-width: 0; }
    @media (max-width: 900px) {
      :host([responsive]) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let t=this.getProp("columns"),e;typeof t=="number"?e=String(t):typeof t=="string"&&t?e=t:e="1";let r=/^\d+$/.test(e)?`repeat(${e}, minmax(0, 1fr))`:e,o=this.getString("gap","md"),i=this.gapValue(o),a=this.getString("padding",""),n=a?this.gapValue(a):"0";return this.style.gridTemplateColumns=r,this.style.gap=i,this.style.padding=n,/^\d+$/.test(e)&&Number(e)>=2&&this.setAttribute("responsive",""),S`<slot></slot>`}};customElements.define("forgeui-grid",Ze);var Xe=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return V`
    :host { display:block; background:var(--forgeui-color-surface); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); padding:var(--forgeui-space-md); min-width:0; }
    :host([variant="elevated"]) { box-shadow:var(--forgeui-shadow-md); border-color:transparent; }
    :host([variant="compact"]) { padding:var(--forgeui-space-sm); border-radius:var(--forgeui-radius-sm); }
    :host([variant="outline"]) { background:transparent; }
    :host([variant="ghost"]) { background:transparent; border-color:transparent; padding:0; }
    .header { margin-bottom:var(--forgeui-space-sm); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); color:var(--forgeui-color-text); line-height:var(--forgeui-leading-tight); }
    .subtitle { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-top:var(--forgeui-space-3xs); }
    .body { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
  `}render(){let t=this.getString("variant",""),e=this.getString("title",""),r=this.getString("subtitle","");return t&&this.setAttribute("variant",t),S`
      ${e||r?S`
        <div class="header">
          ${e?S`<div class="title">${e}</div>`:F}
          ${r?S`<div class="subtitle">${r}</div>`:F}
        </div>
      `:F}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forgeui-card",Xe);var Qe=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return V`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let t=this.getString("maxWidth",""),e={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},r=t in e?e[t]:t,o=this.getString("padding","");return r&&r!=="none"?this.style.maxWidth=r:this.style.maxWidth="",this.style.padding=o?this.gapValue(o):"",S`<slot></slot>`}};customElements.define("forgeui-container",Qe);var Ye=class extends d{static get properties(){return{props:{type:Object}}}constructor(){super(),this._active=""}static get styles(){return V`
    :host { display:block; }
    .tabs { display:flex; border-bottom:2px solid var(--forgeui-color-border); gap:var(--forgeui-space-xs); overflow-x:auto; }
    .tab { padding:var(--forgeui-space-sm) var(--forgeui-space-md); cursor:pointer; border:none; background:none;
      color:var(--forgeui-color-text-secondary); font:inherit; font-size:var(--forgeui-text-sm);
      border-bottom:2px solid transparent; transition:var(--forgeui-transition-fast); white-space:nowrap;
      border-radius:var(--forgeui-radius-sm) var(--forgeui-radius-sm) 0 0; }
    .tab:hover { color:var(--forgeui-color-text); background:var(--forgeui-color-surface-hover); }
    .tab:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .tab[active] { color:var(--forgeui-color-primary); border-bottom-color:var(--forgeui-color-primary); font-weight:var(--forgeui-weight-medium); }
    .panel { padding-top:var(--forgeui-space-md); display:flex; flex-direction:column; gap:var(--forgeui-space-md); }
    ::slotted(*) { display:none; }
    ::slotted([data-active]) { display:block; }
    @media (prefers-reduced-motion: reduce) {
      .tab { transition:none; }
    }
  `}_itemKey(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.id??t.key??t.value??t.label??"":t??"")}_itemLabel(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.label??t.title??t.value??"":t??"")}updated(){Array.from(this.children).filter(e=>!(e instanceof HTMLScriptElement)).forEach((e,r)=>{let o=(e.props||{}).slot??e.getAttribute("slot");String(r)===this._active||o===this._active?e.setAttribute("data-active",""):e.removeAttribute("data-active")})}_moveTo(t,e){let r=this._itemKey(e[t])||String(t);this._active=r,this.requestUpdate(),this.dispatchAction("tab-change",{active:r,value:r}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${t}`)?.focus()})}render(){let t=this.getProp("items")||this.getProp("tabs")||[],e=Array.isArray(t)?t:[],r=this.getBoundProp("activeTab",this.getProp("value"));r!==void 0&&String(r)!==this._active&&(this._active=String(r)),!this._active&&e.length>0&&(this._active=this._itemKey(e[0])||"0");let o=e.findIndex((a,n)=>(this._itemKey(a)||String(n))===this._active),i=(a,n)=>{let l=-1;a.key==="ArrowRight"?l=(n+1)%e.length:a.key==="ArrowLeft"?l=(n-1+e.length)%e.length:a.key==="Home"?l=0:a.key==="End"&&(l=e.length-1),l!==-1&&(a.preventDefault(),this._moveTo(l,e))};return S`
      <div class="tabs" role="tablist">${e.map((a,n)=>{let l=this._itemKey(a)||String(n),g=this._itemLabel(a)||String(n+1),u=l===this._active;return S`
          <button class="tab" ?active=${u} role="tab" aria-selected=${u}
            id="${this._instanceId}-tab-${n}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${u?0:-1}"
            @click=${()=>{this._active=l,this.requestUpdate(),this.dispatchAction("tab-change",{active:l,value:l})}}
            @keydown=${c=>i(c,n)}>${g}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${o>=0?o:0}"><slot></slot></div>
    `}};customElements.define("forgeui-tabs",Ye);var Ge=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return V`
    :host { display:block; }
    details { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); margin-bottom:var(--forgeui-space-2xs); }
    summary { padding:var(--forgeui-space-sm) var(--forgeui-space-md); cursor:pointer; font-weight:var(--forgeui-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; border-radius:var(--forgeui-radius-sm);
      transition:background var(--forgeui-transition-fast); }
    summary:hover { background:var(--forgeui-color-surface-hover); }
    summary:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:-2px; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forgeui-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forgeui-space-sm) var(--forgeui-space-md); }
  `}render(){let t=this.getString("title","Section");return S`<details><summary>${t}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forgeui-accordion",Ge);var et=class extends d{static get styles(){return V`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forgeui-color-border); margin:var(--forgeui-space-sm) 0; }
  `}render(){return S`<hr>`}};customElements.define("forgeui-divider",et);var tt=class extends d{static get styles(){return V`:host { display:block; }`}render(){let t=this.getString("size","md"),e=this.getString("height",""),r=this.getString("width",""),o=e?this.gapValue(e):this.gapValue(t),i=r?/^\d+(\.\d+)?%$/.test(r)?r:this.gapValue(r):"";return S`<div style="height:${o};${i?`width:${i}`:""}"></div>`}};customElements.define("forgeui-spacer",tt);var rt=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return V`
    :host { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getArray("data"),e=this.getString("emptyMessage",""),r=this.getString("direction","column");(r==="row"||r==="horizontal")&&this.setAttribute("direction","row");let o=this.getString("gap","md");return this.style.gap=this.gapValue(o),t.length===0&&e?S`<div class="empty">${e}</div>`:S`<slot></slot>`}};customElements.define("forgeui-repeater",rt);import{html as B,css as Y,nothing as At}from"lit";var ot=class extends d{static get styles(){return Y`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); }
    .sep { color:var(--forgeui-color-text-tertiary); }
    a { color:var(--forgeui-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-medium); }
  `}render(){let t=this.getProp("items")||[];return B`${t.map((e,r)=>{let o=r===t.length-1,i=typeof e=="string"?e:e.label,a=typeof e=="string"?"#":e.href;return B`
        ${r>0?B`<span class="sep">/</span>`:At}
        ${o?B`<span class="current">${i}</span>`:B`<a href="${a}">${i}</a>`}
      `})}`}};customElements.define("forgeui-breadcrumb",ot);var it=class extends d{static get styles(){return Y`
    :host { display:flex; width:100%; gap:0; }
    .step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; min-width:0; }
    .step:not(:last-child)::after { content:''; position:absolute; top:0.75rem;
      left:calc(50% + 0.875rem); right:calc(-50% + 0.875rem); height:2px;
      background:var(--forgeui-color-border); z-index:0; }
    .step:not(:last-child)[completed]::after { background:var(--forgeui-color-primary); }
    .circle { width:1.75rem; height:1.75rem; border-radius:var(--forgeui-radius-full); display:flex; align-items:center;
      justify-content:center; font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-semibold);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text-secondary); border:2px solid var(--forgeui-color-border); z-index:1;
      box-sizing:border-box; position:relative; }
    .step[active] .circle { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); border-color:var(--forgeui-color-primary); }
    .step[completed] .circle { background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); border-color:var(--forgeui-color-primary); }
    .label { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); margin-top:var(--forgeui-space-xs); text-align:center; padding:0 var(--forgeui-space-2xs); }
    .step[active] .label { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-semibold); }
    .step[completed] .label { color:var(--forgeui-color-text); }
  `}render(){let t=this.getProp("steps")||[],e=this.getBoundProp("active",this.getProp("activeStep")??0),r=Number(e)||0;return B`${t.map((o,i)=>{let a=typeof o=="string"?o:o.label||o.title||`Step ${i+1}`,n=i===r,l=i<r;return B`<div class="step" ?active=${n} ?completed=${l}>
        <div class="circle">${l?"\u2713":i+1}</div>
        <div class="label">${a}</div>
      </div>`})}`}};customElements.define("forgeui-stepper",it);var st=class extends d{static get styles(){return Y`
    :host { display:block; min-width:0; }
    .field { display:flex; flex-direction:column; gap:var(--forgeui-space-2xs); min-width:0; }
    label { color:var(--forgeui-color-text); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); }
    input { width:100%; min-height:var(--forgeui-touch-target); box-sizing:border-box; padding:0 var(--forgeui-space-md);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface);
      color:var(--forgeui-color-text); font:inherit; font-size:var(--forgeui-text-sm); }
    input:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    input::placeholder { color:var(--forgeui-color-text-tertiary); }
  `}render(){let t=this.getString("label","Search"),e=this.getString("placeholder","Search"),r=String(this.getBoundProp("value","")??""),o=this.getBool("disabled"),i=this.getString("action","change"),a=this._instanceId;return B`<div class="field">
      <label for="${a}">${t}</label>
      <input id="${a}" type="search" placeholder="${e}" .value=${r} ?disabled=${o}
        @input=${n=>{let l=n.target.value;this.dispatchAction(i,{value:l,query:l})}}>
    </div>`}};customElements.define("forgeui-search-box",st);var at=class extends d{static get styles(){return Y`
    :host { display:inline-flex; min-width:0; max-width:100%; }
    .group { display:inline-flex; align-items:center; flex-wrap:wrap; gap:2px; max-width:100%;
      padding:2px; border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-surface-muted); }
    button { min-height:var(--forgeui-touch-target); max-width:100%; padding:0 var(--forgeui-space-md);
      border:0; border-radius:calc(var(--forgeui-radius-md) - 2px); background:transparent; color:var(--forgeui-color-text-secondary);
      cursor:pointer; font:inherit; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium);
      overflow-wrap:anywhere; }
    button[aria-checked="true"] { background:var(--forgeui-color-surface); color:var(--forgeui-color-text);
      box-shadow:var(--forgeui-shadow-xs); }
    button:hover:not(:disabled) { color:var(--forgeui-color-text); background:var(--forgeui-color-surface-hover); }
    button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    button:disabled { opacity:0.5; cursor:not-allowed; }
  `}render(){let t=this.getArray("options"),e=String(this.getBoundProp("value",this.getProp("value")??this._optionValue(t[0]))??""),r=this.getBool("disabled"),o=this.getString("action","change");return B`
      <div class="group" role="radiogroup" aria-label=${this.getString("label","Options")}>
        ${t.map(i=>{let a=this._optionValue(i),n=this._optionLabel(i,a);return B`<button type="button" role="radio" aria-checked=${a===e?"true":"false"} ?disabled=${r}
            @click=${()=>this.dispatchAction(o,{value:a,selected:a})}>${n}</button>`})}
      </div>
    `}_optionValue(t){if(t&&typeof t=="object"){let e=t;return String(e.value??e.label??"")}return String(t??"")}_optionLabel(t,e){if(t&&typeof t=="object"){let r=t;return String(r.label??r.value??e)}return e}};customElements.define("forgeui-segmented-control",at);var nt=class extends d{static get styles(){return Y`
    :host { display:flex; align-items:center; justify-content:space-between; gap:var(--forgeui-space-sm); min-width:0; }
    .status { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); overflow-wrap:anywhere; }
    .controls { display:inline-flex; align-items:center; gap:var(--forgeui-space-xs); }
    button { min-width:var(--forgeui-touch-target); min-height:var(--forgeui-touch-target); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface); color:var(--forgeui-color-text);
      cursor:pointer; font:inherit; font-size:var(--forgeui-text-sm); }
    button:hover:not(:disabled) { background:var(--forgeui-color-surface-hover); }
    button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    button:disabled { opacity:0.5; cursor:not-allowed; }
  `}render(){let t=Math.max(1,Math.floor(Number(this.getBoundProp("page",this.getProp("page")??1))||1)),e=Math.max(1,Math.floor(this.getNumber("totalPages",1))),r=Math.min(t,e),o=this.getString("label",`Page ${r} of ${e}`),i=this.getString("action","page-change"),a=n=>{let l=Math.min(e,Math.max(1,n));this.dispatchAction(i,{value:l,page:l,totalPages:e})};return B`
      <div class="status" aria-live="polite">${o}</div>
      <div class="controls">
        <button type="button" aria-label="Previous page" ?disabled=${r<=1} @click=${()=>a(r-1)}>‹</button>
        <button type="button" aria-label="Next page" ?disabled=${r>=e} @click=${()=>a(r+1)}>›</button>
      </div>
    `}};customElements.define("forgeui-pagination",nt);export{Ge as ForgeAccordion,ze as ForgeAlert,me as ForgeAvatar,he as ForgeBadge,ot as ForgeBreadcrumb,ne as ForgeButton,le as ForgeButtonGroup,Xe as ForgeCard,ye as ForgeChart,we as ForgeChartLegend,Te as ForgeCheckbox,Ve as ForgeCombobox,Qe as ForgeContainer,We as ForgeDatePicker,He as ForgeDateRangePicker,Ee as ForgeDialog,et as ForgeDivider,_e as ForgeDrawing,ve as ForgeEmptyState,Re as ForgeFieldGroup,Ue as ForgeFileUpload,Le as ForgeForm,Ze as ForgeGrid,pe as ForgeIcon,fe as ForgeImage,ke as ForgeKpiGrid,ce as ForgeLink,xe as ForgeList,Se as ForgeMetric,Ne as ForgeMultiSelect,De as ForgeNumberInput,Fe as ForgePageHeader,nt as ForgePagination,Me as ForgeProgress,Oe as ForgeRadioGroup,rt as ForgeRepeater,st as ForgeSearchBox,at as ForgeSegmentedControl,Be as ForgeSelect,qe as ForgeSlider,tt as ForgeSpacer,Je as ForgeStack,$e as ForgeStatCard,it as ForgeStepper,be as ForgeTable,Ye as ForgeTabs,de as ForgeText,Ce as ForgeTextInput,je as ForgeTextarea,Pe as ForgeToast,Ke as ForgeToggle,Ae as ForgeUIError};
