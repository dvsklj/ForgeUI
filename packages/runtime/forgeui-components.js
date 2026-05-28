import{html as a,css as h,svg as v,nothing as f}from"lit";import{LitElement as Qe}from"lit";import{createStore as lt}from"tinybase";var Je=new Set(["__proto__","prototype","constructor"]);function O(n){if(n.length===0||n.length>256)return!1;for(let t of n.normalize("NFC").split("."))if(Je.has(t))return!1;return!0}function W(n,t){if(t.includes("/")){let e=t.split("/");if(e.length===3){let[r,o,i]=e;return n.getCell(r,o,i)}if(e.length===2){let[r,o]=e,i=n.getValue(t);if(i!==void 0)return i;let s=n.getCellIds(r,o);if(s.length>0){let l={};for(let c of s)l[c]=n.getCell(r,o,c);return l}}}return n.getValue(t)}function Ze(n,t){if(t.startsWith("count:")){let e=t.slice(6);return n.getRowCount(e)}if(t.startsWith("sum:")){let[e,r]=t.split(":"),[o,i]=r.split("/"),s=0,l=n.getRowIds(o);for(let c of l){let g=n.getCell(o,c,i);typeof g=="number"&&(s+=g)}return s}if(t.startsWith("avg:")){let[e,r]=t.split(":"),[o,i]=r.split("/"),s=0,l=0,c=n.getRowIds(o);for(let g of c){let p=n.getCell(o,g,i);typeof p=="number"&&(s+=p,l++)}return l>0?s/l:0}return W(n,t)}var N=null;function K(n){N=n}function Xe(n,t){if(t.length>1024)return;let e="(state\\.[a-zA-Z_][a-zA-Z0-9_.]*|-?\\d+(?:\\.\\d+)?)",r=t.trim().match(new RegExp(`^${e}\\s*(>=|<=|[+\\-*/><])\\s*${e}$`));if(!r)return;let o=Ve(n,r[1]),i=Ve(n,r[3]);if(!(typeof o!="number"||typeof i!="number"))switch(r[2]){case"+":return o+i;case"-":return o-i;case"*":return o*i;case"/":return i===0?void 0:o/i;case">":return o>i;case"<":return o<i;case">=":return o>=i;case"<=":return o<=i}}function Ve(n,t){if(/^-?\d/.test(t))return Number(t);if(!t.startsWith("state."))return;let e=t.slice(6);return O(e)?Be(n,e):void 0}function H(n,t){let e=t.trim();if(e==="")return;if(e.startsWith('"')&&e.endsWith('"')||e.startsWith("'")&&e.endsWith("'"))return e.slice(1,-1);if(e.startsWith('"')&&!e.endsWith('"')||e.startsWith("'")&&!e.endsWith("'"))return;if(e==="true")return!0;if(e==="false")return!1;if(e==="null")return null;if(/^-?\d+(\.\d+)?$/.test(e))return Number(e);if(/(?:[+\-*/%]|===?|!==?|>=?|<=?|\&\&|\|\|)/.test(e)&&!e.includes("|"))return Xe(n,e);if(e.includes("|")){let[o,...i]=e.split("|").map(c=>c.trim()),l=H(n,o);for(let c of i){let[g,...p]=c.split(/\s+/);l=Ye(l,g,p)}return l}if(e.startsWith("item.")||e==="item"){if(e==="item")return N;let o=e.slice(5);return D(N,o)}if(e.startsWith("state.")||e==="state"){if(e==="state")return;let o=e.slice(6);return Be(n,o)}return W(n,e)}function Ye(n,t,e){switch(t){case"values":return Array.isArray(n)?n:n&&typeof n=="object"?Object.values(n):[];case"keys":return n&&typeof n=="object"?Object.keys(n):[];case"count":case"length":return Array.isArray(n)?n.length:n&&typeof n=="object"?Object.keys(n).length:typeof n=="string"?n.length:0;case"sum":return Array.isArray(n)?n.reduce((r,o)=>r+(typeof o=="number"?o:0),0):0;case"first":return Array.isArray(n)?n[0]:void 0;case"last":return Array.isArray(n)?n[n.length-1]:void 0;default:return n}}function D(n,t){if(!n||typeof n!="object"||!t||!O(t))return;let e=t.split(".");if(e.length>32)return;let r=n;for(let o of e){if(r==null)return;r=r[o]}return r}function Be(n,t){if(!O(t))return;let e=n.getValue(t);if(e!==void 0){if(typeof e=="string")try{return JSON.parse(e)}catch{}return e}let r=t.split(".");if(r.length>=3){let[i,s,l,...c]=r;if(n.hasTable(i)&&n.hasRow(i,s)){let g=n.getCell(i,s,l);if(c.length===0)return g;if(typeof g=="string")try{let p=JSON.parse(g);return D(p,c.join("."))}catch{}return}}if(r.length>=2){let[i,s,...l]=r;if(n.hasTable(i)&&n.hasRow(i,s)){let c=n.getRow(i,s);return l.length===0?c:D(c,l.join("."))}}if(r.length>=1){let[i,...s]=r;if(n.hasTable(i)){let l=n.getRowIds(i),c={};for(let g of l)c[g]=n.getRow(i,g);return s.length===0?c:D(c,s.join("."))}}let o=n.getValue(r[0]);if(typeof o=="string"&&r.length>1)try{let i=JSON.parse(o);return D(i,r.slice(1).join("."))}catch{}}function j(n,t){if(typeof t!="string"){if(t!==null&&typeof t=="object"){let e=t;if("$expr"in e)return j(n,`$expr:${e.$expr}`);if("$state"in e)return j(n,`$state:${e.$state}`);if("$computed"in e)return j(n,`$computed:${e.$computed}`);if("$item"in e)return j(n,`$item:${e.$item}`)}return t}if(t.startsWith("$state:")){let e=t.slice(7);return O(e)?W(n,e):void 0}if(t.startsWith("$computed:")){let e=t.slice(10);return e.length>1024?void 0:Ze(n,e)}if(t.startsWith("$item:")){let e=t.slice(6);return O(e)?e.includes(".")?D(N,e):N?.[e]:void 0}if(t.startsWith("$expr:")){let e=t.slice(6);return e.length>1024?void 0:H(n,e)}return t.length>4096?t:t.includes("{{")&&t.includes("}}")?Ge(t,n):t}function Ge(n,t){let e="",r=0;for(;r<n.length;)if(n[r]==="{"&&n[r+1]==="{"){let o=r+2,i=1,s=o;for(;s<n.length-1&&i>0;){let l=n[s],c=n[s+1];l==="{"&&c==="{"?(i++,s+=2):l==="}"&&c==="}"?(i--,s+=2):s++}if(i)e+=n[r++];else{let l=n.slice(o,s-2);if(l.length<=256){let c=l.trim(),g=c.startsWith("$")?j(t,c):H(t,c);e+=g==null?"":String(g)}else e+=n.slice(r,s);r=s}}else e+=n[r++];return e}import{css as F}from"lit";var ht=F`
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
`,mt=F`
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
`,U=F`
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
`;var B=class B extends Qe{constructor(){super(...arguments);this._instanceId=`forge-${++B._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(e){if(!this.store)return e;this.itemContext&&K(this.itemContext);try{return j(this.store,e)}finally{K(null)}}getProp(e){let r=this.props?.[e];return typeof r=="string"&&(r.startsWith("$state:")||r.startsWith("$computed:")||r.startsWith("$item:")||r.startsWith("$expr:")||r.includes("{{")&&r.includes("}}"))?this.resolve(r):r}getArray(e){let r=this.getProp(e);return Array.isArray(r)?r:r&&typeof r=="object"?Object.values(r):[]}getString(e,r=""){let o=this.getProp(e);return typeof o=="string"?o:String(o??r)}getNumber(e,r=0){let o=this.getProp(e);return typeof o=="number"?o:Number(o)||r}getBool(e,r=!1){let o=this.getProp(e);return typeof o=="boolean"?o:r}getBoundProp(e,r){let o=typeof this.props?.bind=="string"?this.props.bind:"";if(o){let s=this.resolve(o);if(s!==void 0)return s}let i=this.getProp(e);return i===void 0?r:i}dispatchAction(e,r){let o=typeof this.props?.bind=="string"?this.props.bind:"",i=o?{...r||{},bind:o}:r;this.onAction&&this.onAction(e,i),this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:e,payload:i},bubbles:!0,composed:!0}))}handleAction(e){let r=this.getString("action");r&&this.dispatchAction(r,this.props)}prop(e){return this.getProp(e)}static get sharedStyles(){return[U]}gapValue(e){let r={none:"0",0:"0","3xs":"var(--forgeui-space-3xs)","2xs":"var(--forgeui-space-2xs)",xs:"var(--forgeui-space-xs)",sm:"var(--forgeui-space-sm)",md:"var(--forgeui-space-md)",lg:"var(--forgeui-space-lg)",xl:"var(--forgeui-space-xl)","2xl":"var(--forgeui-space-2xl)"};if(e==null||e==="")return"var(--forgeui-space-md)";let o=String(e);return o in r?r[o]:/^\d+(\.\d+)?$/.test(o)?`${o}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(o)?o:"var(--forgeui-space-md)"}static get styles(){return[U]}};B._instanceCounter=0;var d=B;function et(n){return`forgeui_${(n||"global").replace(/[^a-zA-Z0-9-]/g,"_")}`}var q="f";function tt(n){return new Promise((t,e)=>{let r=i=>e(i??new Error("IDB"));if(!globalThis.indexedDB)return r();let o=indexedDB.open(`${et(n)}_f`,1);o.onupgradeneeded=()=>{o.result.createObjectStore(q)},o.onsuccess=()=>t(o.result),o.onerror=o.onblocked=()=>r(o.error)})}async function Te(n,t){if(n.length===0)return;let e=null;try{e=await tt(t),await new Promise((r,o)=>{let i=e.transaction(q,"readwrite"),s=i.objectStore(q);for(let{file:l,id:c}of n)s.put(l,c);i.oncomplete=()=>r(),i.onerror=i.onabort=()=>o(i.error)})}catch{return}finally{e?.close()}}import{html as Y,css as G,nothing as rt}from"lit";var J=class extends d{static get styles(){return G`
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
  `}render(){let t=this.getString("label","Button"),e=this.getString("variant","primary"),r=this.getString("size",""),o=this.getBool("disabled"),i=this.getProp("pressed");return Y`<button class="${e} ${r}" ?disabled=${o}
      aria-pressed=${i==null?rt:String(!!i)}
      @click=${s=>this.handleAction(s)}>${t}<slot></slot></button>`}};customElements.define("forgeui-button",J);var Z=class extends d{static get styles(){return G`
    :host { display:flex; gap:var(--forgeui-space-xs); }
  `}render(){return Y`<slot></slot>`}};customElements.define("forgeui-button-group",Z);var X=class extends d{static get styles(){return G`
    :host { display:inline-flex; }
    a { color:var(--forgeui-color-primary); text-decoration:none; font-size:var(--forgeui-text-sm); cursor:pointer;
      text-decoration-thickness:1px; text-underline-offset:2px; }
    a:hover { text-decoration:underline; }
    a:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; border-radius:2px; }
  `}render(){let t=this.getString("label",""),e=this.getString("href","#");return Y`<a href="${e}">${t}<slot></slot></a>`}};customElements.define("forgeui-link",X);import{html as L,css as We,nothing as ot}from"lit";var Q=class extends d{static get styles(){return We`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); }
    .sep { color:var(--forgeui-color-text-tertiary); }
    a { color:var(--forgeui-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-medium); }
  `}render(){let t=this.getProp("items")||[];return L`${t.map((e,r)=>{let o=r===t.length-1,i=typeof e=="string"?e:e.label,s=typeof e=="string"?"#":e.href;return L`
        ${r>0?L`<span class="sep">/</span>`:ot}
        ${o?L`<span class="current">${i}</span>`:L`<a href="${s}">${i}</a>`}
      `})}`}};customElements.define("forgeui-breadcrumb",Q);var ee=class extends d{static get styles(){return We`
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
  `}render(){let t=this.getProp("steps")||[],e=this.getBoundProp("active",this.getProp("activeStep")??0),r=Number(e)||0;return L`${t.map((o,i)=>{let s=typeof o=="string"?o:o.label||o.title||`Step ${i+1}`,l=i===r,c=i<r;return L`<div class="step" ?active=${l} ?completed=${c}>
        <div class="circle">${c?"\u2713":i+1}</div>
        <div class="label">${s}</div>
      </div>`})}`}};customElements.define("forgeui-stepper",ee);var te=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`
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
  `}render(){let t=this.getString("direction","column"),e=t==="horizontal"||t==="row"?"row":"column",r=this.getString("gap","")||this.getString("spacing","md"),o=this.getString("padding",""),i=this.getString("align",""),s=this.getString("justify",""),l=this.getBool("wrap"),c=this.gapValue(r),g=o?this.gapValue(o):"0";return this.setAttribute("direction",e),i&&this.setAttribute("align",i),s&&this.setAttribute("justify",s),l&&this.setAttribute("wrap",""),this.style.gap=c,this.style.padding=g,a`<slot></slot>`}};customElements.define("forgeui-stack",te);var re=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`
    :host { display: grid; min-width: 0; }
    @media (max-width: 900px) {
      :host([responsive]) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let t=this.getProp("columns"),e;typeof t=="number"?e=String(t):typeof t=="string"&&t?e=t:e="1";let r=/^\d+$/.test(e)?`repeat(${e}, minmax(0, 1fr))`:e,o=this.getString("gap","md"),i=this.gapValue(o),s=this.getString("padding",""),l=s?this.gapValue(s):"0";return this.style.gridTemplateColumns=r,this.style.gap=i,this.style.padding=l,/^\d+$/.test(e)&&Number(e)>=2&&this.setAttribute("responsive",""),a`<slot></slot>`}};customElements.define("forgeui-grid",re);var oe=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`
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
  `}render(){let t=this.getString("variant",""),e=this.getString("title",""),r=this.getString("subtitle","");return t&&this.setAttribute("variant",t),a`
      ${e||r?a`
        <div class="header">
          ${e?a`<div class="title">${e}</div>`:f}
          ${r?a`<div class="subtitle">${r}</div>`:f}
        </div>
      `:f}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forgeui-card",oe);var ie=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let t=this.getString("maxWidth",""),e={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},r=t in e?e[t]:t,o=this.getString("padding","");return r&&r!=="none"?this.style.maxWidth=r:this.style.maxWidth="",this.style.padding=o?this.gapValue(o):"",a`<slot></slot>`}};customElements.define("forgeui-container",ie);var ne=class extends d{static get properties(){return{props:{type:Object}}}constructor(){super(),this._active=""}static get styles(){return h`
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
  `}_itemKey(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.id??t.key??t.value??t.label??"":t??"")}_itemLabel(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.label??t.title??t.value??"":t??"")}updated(){Array.from(this.children).filter(e=>!(e instanceof HTMLScriptElement)).forEach((e,r)=>{let o=(e.props||{}).slot??e.getAttribute("slot");String(r)===this._active||o===this._active?e.setAttribute("data-active",""):e.removeAttribute("data-active")})}_moveTo(t,e){let r=this._itemKey(e[t])||String(t);this._active=r,this.requestUpdate(),this.dispatchAction("tab-change",{active:r,value:r}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${t}`)?.focus()})}render(){let t=this.getProp("items")||this.getProp("tabs")||[],e=Array.isArray(t)?t:[],r=this.getBoundProp("activeTab",this.getProp("value"));r!==void 0&&String(r)!==this._active&&(this._active=String(r)),!this._active&&e.length>0&&(this._active=this._itemKey(e[0])||"0");let o=e.findIndex((s,l)=>(this._itemKey(s)||String(l))===this._active),i=(s,l)=>{let c=-1;s.key==="ArrowRight"?c=(l+1)%e.length:s.key==="ArrowLeft"?c=(l-1+e.length)%e.length:s.key==="Home"?c=0:s.key==="End"&&(c=e.length-1),c!==-1&&(s.preventDefault(),this._moveTo(c,e))};return a`
      <div class="tabs" role="tablist">${e.map((s,l)=>{let c=this._itemKey(s)||String(l),g=this._itemLabel(s)||String(l+1),p=c===this._active;return a`
          <button class="tab" ?active=${p} role="tab" aria-selected=${p}
            id="${this._instanceId}-tab-${l}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${p?0:-1}"
            @click=${()=>{this._active=c,this.requestUpdate(),this.dispatchAction("tab-change",{active:c,value:c})}}
            @keydown=${u=>i(u,l)}>${g}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${o>=0?o:0}"><slot></slot></div>
    `}};customElements.define("forgeui-tabs",ne);var se=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`
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
  `}render(){let t=this.getString("title","Section");return a`<details><summary>${t}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forgeui-accordion",se);var ae=class extends d{static get styles(){return h`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forgeui-color-border); margin:var(--forgeui-space-sm) 0; }
  `}render(){return a`<hr>`}};customElements.define("forgeui-divider",ae);var le=class extends d{static get styles(){return h`:host { display:block; }`}render(){let t=this.getString("size","md"),e=this.getString("height",""),r=this.getString("width",""),o=e?this.gapValue(e):this.gapValue(t),i=r?/^\d+(\.\d+)?%$/.test(r)?r:this.gapValue(r):"";return a`<div style="height:${o};${i?`width:${i}`:""}"></div>`}};customElements.define("forgeui-spacer",le);var ce=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`
    :host { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getArray("data"),e=this.getString("emptyMessage",""),r=this.getString("direction","column");(r==="row"||r==="horizontal")&&this.setAttribute("direction","row");let o=this.getString("gap","md");return this.style.gap=this.gapValue(o),t.length===0&&e?a`<div class="empty">${e}</div>`:a`<slot></slot>`}};customElements.define("forgeui-repeater",ce);var ue=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`
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
  `}render(){let t=this.getString("content",""),e=this.getString("variant","body"),o={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[e]||e,i=this.getString("colorScheme",""),s=this.getString("align",""),l=this.getString("weight",""),c={primary:"var(--forgeui-color-primary)",secondary:"var(--forgeui-color-text-secondary)",tertiary:"var(--forgeui-color-text-tertiary)",success:"var(--forgeui-color-success)",warning:"var(--forgeui-color-warning)",error:"var(--forgeui-color-error)",info:"var(--forgeui-color-info)"},g={normal:"var(--forgeui-weight-normal)",medium:"var(--forgeui-weight-medium)",semibold:"var(--forgeui-weight-semibold)",bold:"var(--forgeui-weight-bold)"},p=[];i&&c[i]&&p.push(`color:${c[i]}`),l&&g[l]&&p.push(`font-weight:${g[l]}`);let u=s?`align-${s}`:"",m=a`${t}<slot></slot>`;return o==="heading1"?a`<h1 class="${o} ${u}" style="${p.join(";")}">${m}</h1>`:o==="heading2"?a`<h2 class="${o} ${u}" style="${p.join(";")}">${m}</h2>`:o==="heading3"?a`<h3 class="${o} ${u}" style="${p.join(";")}">${m}</h3>`:a`<div class="${o} ${u}" style="${p.join(";")}">${t}<slot></slot></div>`}};customElements.define("forgeui-text",ue);var ge=class extends d{static get styles(){return h`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `}render(){let t=this.getString("src",""),e=this.getString("alt",""),r=this.getString("fit","contain");return t?a`<img src="${t}" alt="${e}" style="object-fit:${r}" loading="lazy">`:a`${f}`}};customElements.define("forgeui-image",ge);var de=class extends d{static get styles(){return h`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `}render(){let t=this.getString("name","circle"),e={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},r=e[t]||e.circle;return a`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${r}"/></svg>`}};customElements.define("forgeui-icon",de);var fe=class extends d{static get styles(){return h`
    :host { display:inline-flex; align-items:center; max-width:100%; }
    .badge { display:inline-flex; align-items:center; min-height:1.5rem; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .badge[variant="success"] { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge[variant="error"] { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
  `}render(){let t=this.getString("text","")||this.getString("label",""),e=this.getString("variant","");return a`<span class="badge" variant="${e}">${t}<slot></slot></span>`}};customElements.define("forgeui-badge",fe);var pe=class extends d{static get styles(){return h`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let t=this.getString("src",""),e=this.getString("name","?"),r=e.split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2);return a`<div class="avatar">${t?a`<img src="${t}" alt="${e}">`:r}<slot></slot></div>`}};customElements.define("forgeui-avatar",pe);var he=class extends d{static get styles(){return h`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); overflow-wrap:break-word; }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); overflow-wrap:break-word; }
  `}render(){let t=this.getString("title","Nothing here"),e=this.getString("description","");return a`
      <div class="title">${t}</div>
      ${e?a`<div class="desc">${e}</div>`:f}
      <slot></slot>
    `}};customElements.define("forgeui-empty-state",he);var me=class extends d{static get styles(){return h`
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
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),r=this.getString("hint",""),o=this.getString("error",""),i=this.getString("inputType","")||this.getString("type","text"),s=this.getBool("multiline"),l=String(this.getBoundProp("value","")??""),c=this._instanceId;return a`
      ${t?a`<label for="${c}">${t}</label>`:f}
      ${s?a`<textarea id="${c}" placeholder="${e}" .value=${l} @input=${g=>this.dispatchAction("change",{value:g.target.value})}></textarea>`:a`<input id="${c}" type="${i}" placeholder="${e}" .value=${l} @input=${g=>this.dispatchAction("change",{value:g.target.value})}>`}
      ${r&&!o?a`<div class="hint">${r}</div>`:f}
      ${o?a`<div class="error">${o}</div>`:f}
    `}};customElements.define("forgeui-text-input",me);var be=class extends d{static get styles(){return h`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("min"),r=this.getProp("max"),o=this.getProp("step"),i=this.getBoundProp("value"),s=this._instanceId;return a`
      ${t?a`<label for="${s}">${t}</label>`:f}
      <input id="${s}" type="number" min=${e} max=${r} step=${o} .value=${i??""}
        @input=${l=>this.dispatchAction("change",{value:Number(l.target.value)})}>
    `}};customElements.define("forgeui-number-input",be);var ve=class extends d{static get styles(){return h`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    select { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("options")||[],r=String(this.getBoundProp("value","")??""),o=this._instanceId;return a`
      ${t?a`<label for="${o}">${t}</label>`:f}
      <select id="${o}" .value=${r} @change=${i=>this.dispatchAction("change",{value:i.target.value})}>
        ${e.map(i=>a`<option value=${typeof i=="string"?i:i.value} ?selected=${(typeof i=="string"?i:i.value)===r}>
          ${typeof i=="string"?i:i.label||i.value}
        </option>`)}
      </select>
    `}};customElements.define("forgeui-select",ve);var ye=class extends d{static get styles(){return h`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-xs); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-height:var(--forgeui-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-xs); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; border-radius:2px; }
    .tag button:focus-visible { outline:2px solid var(--forgeui-color-focus); outline-offset:1px; }
  `}render(){let t=this.getString("label",""),e=this.getProp("selected")||[];return a`
      ${t?a`<label>${t}</label>`:f}
      <div class="tags">
        ${e.map(r=>a`<span class="tag">${String(r)}<button @click=${()=>this.dispatchAction("remove",{value:r})}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forgeui-multi-select",ye);var xe=class extends d{static get styles(){return h`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); margin-bottom:var(--forgeui-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); cursor:pointer; }
    label { font-size:var(--forgeui-text-sm); cursor:pointer; }
    :focus-within label { text-decoration:underline; }
  `}render(){let t=this.getString("label",""),e=!!this.getBoundProp("checked",this.getProp("value")??!1),r=this._instanceId;return a`
      <input id="${r}" type="checkbox" ?checked=${e} @change=${o=>this.dispatchAction("change",{checked:o.target.checked})}>
      ${t?a`<label for="${r}">${t}</label>`:f}
    `}};customElements.define("forgeui-checkbox",xe);var we=class extends d{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let e=!!this.getBoundProp("on",this.getProp("value")??!1);this.dispatchAction("change",{value:!e,checked:!e})};this._onKeydown=e=>{(e.key==="Enter"||e.key===" "||e.key==="Spacebar")&&(e.preventDefault(),this._toggle())}}static get styles(){return h`
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
  `}render(){let e=!!this.getBoundProp("on",this.getProp("value")??!1),r=this.getString("label",""),o=this.getBool("disabled"),i=this._instanceId;return a`
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
        ${r?a`<span class="toggle-text">${r}</span>`:f}
      </label>
    `}};customElements.define("forgeui-toggle",we);var $e=class extends d{static get styles(){return h`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getString("value",""),r=this._instanceId;return a`
      ${t?a`<label for="${r}">${t}</label>`:f}
      <input id="${r}" type="date" .value=${e} @change=${o=>this.dispatchAction("change",{value:o.target.value})}>
    `}};customElements.define("forgeui-date-picker",$e);var ke=class extends d{static get styles(){return h`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input[type=range] { width:100%; accent-color:var(--forgeui-color-primary); min-width:0; }
    .value { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
  `}render(){let t=this.getString("label",""),e=this.getNumber("min",0),r=this.getNumber("max",100),o=this.getNumber("step",1),i=this.getBoundProp("value",e),s=Number(i);Number.isFinite(s)||(s=e);let l=this._instanceId;return a`
      ${t?a`<label for="${l}">${t}</label>`:f}
      <input id="${l}" type="range" min=${e} max=${r} step=${o} .value=${s}
        @input=${c=>this.dispatchAction("change",{value:Number(c.target.value)})}>
      <div class="value">${s}</div>
    `}};customElements.define("forgeui-slider",ke);var Se=class extends d{constructor(){super(...arguments);this._dragging=!1;this._openFilePicker=()=>{this.shadowRoot?.querySelector('input[type="file"]')?.click()};this._onDropzoneKeydown=e=>{e.key!=="Enter"&&e.key!==" "||(e.preventDefault(),this._openFilePicker())};this._onFileChange=e=>{let r=Array.from(e.target.files??[]);this._processFiles(r)};this._onDragOver=e=>{e.preventDefault(),!this._dragging&&(this._dragging=!0,this.requestUpdate())};this._onDragLeave=e=>{e.currentTarget===e.target&&(this._dragging=!1,this.requestUpdate())};this._onDrop=e=>{e.preventDefault(),this._dragging=!1,this.requestUpdate(),this._processFiles(Array.from(e.dataTransfer?.files??[]))}}static get styles(){return h`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .dropzone { border:2px dashed var(--forgeui-color-border-strong); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forgeui-transition-fast); }
    .dropzone:hover, .dropzone.dragging { border-color:var(--forgeui-color-primary); background:var(--forgeui-color-primary-subtle); }
    .dropzone:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `}_maxSizeBytes(){let e=this.getProp("maxSize");if(typeof e=="number"&&Number.isFinite(e)&&e>=0)return Math.floor(e);if(typeof e!="string")return null;let r=e.trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);if(!r)return null;let o=Number(r[1]),i=(r[2]||"b").toLowerCase(),s=i==="gb"?1<<30:i==="mb"?1<<20:i==="kb"?1024:1,l=o*s;return Number.isFinite(l)?Math.floor(l):null}_newFileId(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}_${Math.random().toString(36).slice(2)}`}_processFiles(e){let r=this.getBool("multiple"),o=this._maxSizeBytes(),i=(r?e:e.slice(0,1)).map(u=>{let m=this._newFileId(),w=o==null||u.size<=o,I={id:m,name:u.name,size:u.size,type:u.type,lastModified:u.lastModified,accepted:w,storageKey:w?m:null};return w||(I.error="maxSize"),[u,I]}),s=i.filter(([,u])=>u.accepted),l=i.map(([,u])=>u),c=s.map(([,u])=>u),g=r?c:c[0]??null,p=c[0]??null;this.dispatchAction("change",{id:p?.id??null,uuid:p?.id??null,name:p?.name??null,size:p?.size??null,type:p?.type??null,lastModified:p?.lastModified??null,storageKey:p?.storageKey??null,value:g,files:l,rejected:l.filter(u=>!u.accepted),multiple:r,maxSize:o}),Te(s.map(([u,m])=>({file:u,id:m.id})))}render(){let e=this.getString("label","Upload file"),r=this.getString("accept","*"),o=this.getBool("multiple");return a`
      ${e?a`<label>${e}</label>`:f}
      <div class="dropzone ${this._dragging?"dragging":""}" role="button" tabindex="0"
        @click=${this._openFilePicker} @keydown=${this._onDropzoneKeydown}
        @dragover=${this._onDragOver} @dragleave=${this._onDragLeave} @drop=${this._onDrop}>
        <p>Drop</p>
        <input type="file" accept="${r}" ?multiple=${o} hidden @change=${this._onFileChange}>
      </div>
    `}};customElements.define("forgeui-file-upload",Se);var _e=class extends d{static get styles(){return h`
    :host { display:block; overflow-x:auto; min-width:0; width:100%; }
    table { width:100%; min-width:42rem; border-collapse:collapse; font-size:var(--forgeui-text-sm); }
    th { text-align:left; padding:var(--forgeui-space-sm) var(--forgeui-space-md); font-weight:var(--forgeui-weight-semibold);
      color:var(--forgeui-color-text-secondary); border-bottom:2px solid var(--forgeui-color-border-strong); white-space:nowrap;
      text-transform:uppercase; letter-spacing:0.05em; font-size:var(--forgeui-text-xs);
      background:var(--forgeui-color-surface-alt); }
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
  `}_statusClass(t){let e=String(t??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(e)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(e)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(e)?"neutral":["high","urgent","critical"].includes(e)?"error":["medium","med"].includes(e)?"warning":["low"].includes(e)?"info":["failed","error","rejected","blocked","overdue"].includes(e)?"error":"neutral"}_renderCell(t,e){let r=typeof t=="string"?t:t.key,o=e[r],i=t&&typeof t=="object"?t.type:void 0;if(o==null||o==="")return a`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;if(i==="badge"||i==="status"){let s=(t.variant&&typeof t.variant=="object"?t.variant[String(o).toLowerCase()]:null)||this._statusClass(o);return a`<span class="badge ${s}">${String(o)}</span>`}if(i==="number")return typeof o=="number"?o.toLocaleString():String(o);if(i==="date"){let s=typeof o=="string"||typeof o=="number"?new Date(o):o;return s instanceof Date&&!isNaN(s.getTime())?s.toLocaleDateString():String(o)}if(i==="currency"){let s=Number(o);return isNaN(s)?String(o):s.toLocaleString(void 0,{style:"currency",currency:t.currency||"USD"})}return i==="boolean"?o?"\u2713":"\u2717":String(o)}render(){let t=this.getProp("data"),e=this.getProp("columns")||[],r=this.getString("emptyMessage","No data yet"),o=this.getString("rowAction",""),i=this.getString("caption","");if(!Array.isArray(t))return a`<div class="empty">${r}</div>`;let s=e.length>0?e:t.length>0?Object.keys(t[0]):[];return s.length===0?a`<div class="empty">${r}</div>`:a`
      <table>
        ${i?a`<caption>${i}</caption>`:f}
        <thead><tr>${s.map(l=>{let c=typeof l=="string"?l:l.label||l.key,g=typeof l=="object"?l.align:void 0,p=typeof l=="object"?l.width:void 0;return a`<th class="${g==="right"?"align-right":g==="center"?"align-center":""}" style="${p?`width:${p}`:""}">${c}</th>`})}</tr></thead>
        <tbody>${t.length===0?a`<tr><td colspan=${s.length} class="empty">${r}</td></tr>`:t.map((l,c)=>{let g=!!o,p=g?String(l[typeof s[0]=="string"?s[0]:s[0]?.key]??`Row ${c+1}`):"";return a`<tr class="${g?"row-action":""}"
                tabindex=${g?0:f}
                role=${g?"button":f}
                aria-label=${g?p:f}
                @click=${g?()=>this.dispatchAction(o,{row:l,index:c}):void 0}
                @keydown=${g?u=>{(u.key==="Enter"||u.key===" ")&&(u.preventDefault(),this.dispatchAction(o,{row:l,index:c}))}:void 0}>
              ${s.map(u=>{let m=typeof u=="object"?u.align:void 0;return a`<td class="${m==="right"?"align-right":m==="center"?"align-center":""}">${this._renderCell(u,l)}</td>`})}</tr>`})}</tbody>
      </table>
    `}};customElements.define("forgeui-table",_e);var ze=class extends d{static get styles(){return h`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); overflow-wrap:break-word; min-width:0; }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); overflow-wrap:break-word; }
  `}render(){let t=this.getProp("data"),e=this.getString("dataPath","");!("data"in(this.props||{}))&&e&&this.store?.hasTable(e)&&(t=Object.values(this.store.getTable(e)));let r=this.getString("emptyMessage","No items");return!Array.isArray(t)||t.length===0?a`<div class="empty">${r}</div>`:a`<div class="list">${t.map((o,i)=>a`
      <div class="item" data-index=${i}><slot name="item" .item=${o} .index=${i}>${JSON.stringify(o)}</slot></div>
    `)}</div>`}};customElements.define("forgeui-list",ze);var Me=class extends d{constructor(){super(...arguments);this._palette=["var(--forgeui-color-primary)","var(--forgeui-color-success)","var(--forgeui-color-warning)","var(--forgeui-color-error)","var(--forgeui-color-info)","var(--forgeui-color-chart-6)","var(--forgeui-color-chart-7)","var(--forgeui-color-chart-8)","var(--forgeui-color-chart-9)","var(--forgeui-color-chart-10)"]}static get styles(){return h`
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
  `}_niceMax(e){if(e<=0)return 1;let r=Math.pow(10,Math.floor(Math.log10(e))),o=e/r;return(o<=1?1:o<=2?2:o<=5?5:10)*r}render(){let e=this.getString("chartType","bar"),r=this.getProp("data")||[],o=this.getString("title",""),i=this.getString("xKey","label")||this.getString("labelKey","label"),s=this.getString("yKey","value")||this.getString("valueKey","value"),l=this.getString("color","");if(!r||r.length===0)return a`
        ${o?a`<div class="title">${o}</div>`:f}
        <div class="empty">No data to display</div>
      `;let c=r.map(b=>typeof b=="number"?{label:"",value:b}:b&&typeof b=="object"?{label:String(b[i]??b.label??b.name??b.x??""),value:Number(b[s]??b.value??b.y??0)||0,color:b.color}:{label:String(b),value:0}),g=600,p=260,u={top:8,right:16,bottom:36,left:48},m=g-u.left-u.right,w=p-u.top-u.bottom,I,De=f;if(e==="pie"||e==="donut"){let b=c.reduce((k,x)=>k+Math.max(0,x.value),0)||1,P=g/2,A=p/2,z=Math.min(m,w)/2-8,M=e==="donut"?z*.55:0,y=-Math.PI/2,$=[],E=[];c.forEach((k,x)=>{let C=Math.max(0,k.value)/b,S=y,_=y+C*Math.PI*2;y=_;let R=_-S>Math.PI?1:0,V=P+z*Math.cos(S),Re=A+z*Math.sin(S),Oe=P+z*Math.cos(_),Ne=A+z*Math.sin(_),T=k.color||this._palette[x%this._palette.length];if(E.push(T),M>0){let Ke=P+M*Math.cos(S),He=A+M*Math.sin(S),Fe=P+M*Math.cos(_),Ue=A+M*Math.sin(_);$.push(v`<path class="slice" fill="${T}" d="M ${V} ${Re} A ${z} ${z} 0 ${R} 1 ${Oe} ${Ne} L ${Fe} ${Ue} A ${M} ${M} 0 ${R} 0 ${Ke} ${He} Z"/>`)}else $.push(v`<path class="slice" fill="${T}" d="M ${P} ${A} L ${V} ${Re} A ${z} ${z} 0 ${R} 1 ${Oe} ${Ne} Z"/>`)}),I=v`<g>${$}</g>`,De=a`<div class="legend">${c.map((k,x)=>a`
        <span class="legend-item"><span class="swatch" style="background:${E[x]}"></span>${k.label} (${k.value})</span>
      `)}</div>`}else{let b=Math.max(...c.map(y=>y.value),0),P=this._niceMax(b),A=y=>u.top+w-y/P*w,z=4,M=[];for(let y=0;y<=z;y++){let $=P*y/z,E=A($);M.push(v`<line class="grid" x1="${u.left}" x2="${u.left+m}" y1="${E}" y2="${E}"/>`),M.push(v`<text class="tick-label" x="${u.left-6}" y="${E+3}" text-anchor="end">${$.toLocaleString()}</text>`)}if(e==="line"||e==="area"){let y=m/Math.max(1,c.length-1),$=c.map((x,C)=>{let S=u.left+C*y,_=A(x.value);return`${C===0?"M":"L"} ${S} ${_}`}).join(" "),E=e==="area"?$+` L ${u.left+m} ${u.top+w} L ${u.left} ${u.top+w} Z`:"",k=l||"var(--forgeui-color-primary)";I=a`
          <g>${M}</g>
          ${e==="area"?v`<path class="area" d="${E}" style="fill:${k};opacity:0.15"/>`:f}
          ${v`<path class="line" d="${$}" style="stroke:${k}"/>`}
          ${c.map((x,C)=>{let S=u.left+C*y,_=A(x.value);return v`<circle class="point" cx="${S}" cy="${_}" r="3" style="fill:${k}"/>
              <text class="tick-label" x="${S}" y="${u.top+w+14}" text-anchor="middle">${x.label}</text>`})}
        `}else{let y=c.length,$=m/y,E=Math.max(2,$*.7),k=$-E;I=a`
          <g>${M}</g>
          ${c.map((x,C)=>{let S=u.left+C*$+k/2,_=A(x.value),R=Math.max(0,u.top+w-_),V=x.color||l||"var(--forgeui-color-primary)";return v`<rect class="bar" x="${S}" y="${_}" width="${E}" height="${R}" rx="2" style="fill:${V}">
                <title>${x.label}: ${x.value}</title>
              </rect>
              <text class="tick-label" x="${S+E/2}" y="${u.top+w+14}" text-anchor="middle">${x.label}</text>`})}
        `}}return a`
      ${o?a`<div class="title">${o}</div>`:f}
      <div class="wrap">
        <svg viewBox="0 0 ${g} ${p}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${o||e+" chart"}">
          ${I}
        </svg>
        ${De}
      </div>
    `}};customElements.define("forgeui-chart",Me);var Ee=class extends d{static get styles(){return h`
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
  `}_trendMeta(t){if(t==null||t==="")return null;if(typeof t=="number")return t>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(t)}%`}:t<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(t)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof t=="string"){let e=t.toLowerCase(),r=t.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(r){let o=parseFloat(r[1]),i=r[2];return o>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(o)}${i}`}:o<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(o)}${i}`}:{dir:"neutral",arrow:"\u2192",display:`0${i}`}}return e==="up"||e==="positive"||e==="increase"?{dir:"up",arrow:"\u2191",display:""}:e==="down"||e==="negative"||e==="decrease"?{dir:"down",arrow:"\u2193",display:""}:e==="flat"||e==="neutral"||e==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:t}}return null}render(){let t=this.getString("label",""),e=this.getProp("value"),r=this.getProp("trend"),o=this.getString("trendLabel",""),i=this.getProp("goal"),s=this.getString("unit",""),l=this.getString("suffix",""),c=this.getString("subtitle",""),g=this.getString("variant","");g&&this.setAttribute("variant",g);let p=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),u=this._trendMeta(r);return a`
      ${t?a`<div class="label">${t}</div>`:f}
      <div class="value-row">
        <span class="value">${p}</span>
        ${s?a`<span class="unit">${s}</span>`:f}
        ${l?a`<span class="suffix">${l}</span>`:f}
        ${u?a`<span class="trend ${u.dir} ${!u.display&&!o?"icon-only":""}">${u.arrow}${u.display?a` ${u.display}`:f}${o?a` ${o}`:f}</span>`:f}
      </div>
      ${c?a`<div class="subtitle">${c}</div>`:f}
      ${i!=null&&i!==""?a`<div class="goal">Goal: ${typeof i=="number"?i.toLocaleString():i}</div>`:f}
    `}};customElements.define("forgeui-metric",Ee);var Ae=class extends d{static get styles(){return h`
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
  `}render(){let t=this.getString("variant","info"),e=this.getString("title",""),r=this.getString("message","");return a`<div class="alert ${t}" role=${t==="error"||t==="warning"?"alert":"status"}>
      ${e?a`<strong>${e}</strong> `:f}${r}<slot></slot>
    </div>`}};customElements.define("forgeui-alert",Ae);var Pe=class extends d{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=e=>this._onKeydown(e);this._close=()=>{this.dispatchAction("close")}}static get styles(){return h`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-lg); min-width:min(20rem, 90vw); max-width:90vw; max-height:90vh; overflow:auto;
      border:1px solid var(--forgeui-color-border);
      box-shadow:var(--forgeui-shadow-lg); z-index:1; word-break:break-word; }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forgeui-space-xs); margin-top:var(--forgeui-space-lg); }
  `}render(){let e=this.getString("title",""),r=this.getBool("open"),o=`${this._instanceId}-title`;return r?this.setAttribute("open",""):this.removeAttribute("open"),r?a`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${e?o:f}"
        tabindex="-1"
        @click=${i=>i.stopPropagation()}
      >
        ${e?a`<h2 id="${o}" class="title">${e}</h2>`:f}
        <slot></slot>
      </div>
    `:f}updated(e){if(super.updated?.(e),e.has("props")){let r=this.getBool("open"),i=e.get("props")?.open??!1;r&&!i?this._onOpen():!r&&i&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let e=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??e)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(e){if(e.key==="Escape"){e.preventDefault(),this._close();return}e.key==="Tab"&&this._trapFocus(e)}_trapFocus(e){let r=this._allFocusableInDialog();if(r.length===0){e.preventDefault();return}let o=r[0],i=r[r.length-1],s=this.shadowRoot?.activeElement??document.activeElement;e.shiftKey?(s===o||!this._dialogContains(s))&&(e.preventDefault(),i.focus()):(s===i||!this._dialogContains(s))&&(e.preventDefault(),o.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let e=this.shadowRoot?.querySelector(".dialog");if(!e)return[];let r='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',o=Array.from(e.querySelectorAll(r)),i=e.querySelector("slot"),s=i instanceof HTMLSlotElement?i.assignedElements({flatten:!0}).flatMap(l=>[l,...Array.from(l.querySelectorAll(r))].filter(g=>g instanceof HTMLElement&&g.matches(r))):[];return[...o,...s].filter(l=>!l.disabled)}_dialogContains(e){return e?this.shadowRoot?.querySelector(".dialog")?.contains(e)??!1:!1}};customElements.define("forgeui-dialog",Pe);var Ce=class extends d{static get styles(){return h`
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
  `}render(){let t=this.getProp("value"),e=this.getNumber("max",100),r=t==null,o=r?0:Math.max(0,Math.min(Number(t),e)),i=r?0:o/e*100,s=this.getString("label",""),l=this.getBool("showValue");return a`
      ${s||l?a`
        <div class="meta">
          ${s?a`<span>${s}</span>`:a`<span></span>`}
          ${l?a`<span class="value">${Math.round(i)}%</span>`:f}
        </div>
      `:f}
      <div
        class="progress ${r?"indeterminate":""}"
        role="progressbar"
        aria-label="${s||"Progress"}"
        aria-valuemin="0"
        aria-valuemax="${e}"
        aria-valuenow="${r?f:o}"
        aria-valuetext="${r?"Loading":`${Math.round(i)}%`}"
      >
        <div class="bar" style=${r?"":`width:${i}%`}></div>
      </div>
    `}};customElements.define("forgeui-progress",Ce);var Ie=class extends d{static get styles(){return h`
    :host { display:block; position:fixed; bottom:var(--forgeui-space-lg); right:var(--forgeui-space-lg); z-index:60; }
    .toast { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-text); color:var(--forgeui-color-text-inverse); font-size:var(--forgeui-text-sm);
      box-shadow:var(--forgeui-shadow-lg); max-width:20rem; overflow-wrap:break-word; }
  `}render(){let t=this.getString("message","");return t?a`<div class="toast">${t}</div>`:a`${f}`}};customElements.define("forgeui-toast",Ie);var je=class extends d{static get styles(){return h`
    :host { display:block; }
    .error { padding:var(--forgeui-space-sm); background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error);
      border:1px solid var(--forgeui-color-error); border-radius:var(--forgeui-radius-md); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getString("msg","Unknown error");return a`<div class="error" role="alert">⚠ ${t}</div>`}};customElements.define("forgeui-error",je);var Le=class extends d{static get properties(){return{props:{type:Object}}}static get styles(){return h`
    :host { display:block; }
    svg { display:block; }
  `}render(){let t=this.getNumber("width",400),e=this.getNumber("height",300),r=this.getString("background","transparent"),o=this.getProp("shapes")||[];return v`
      <svg width="${t}" height="${e}" style="background:${r}" viewBox="0 0 ${t} ${e}">
        ${o.map(i=>this.renderShape(i))}
      </svg>
    `}renderShape(t){let e={fill:t.fill??void 0,stroke:t.stroke??void 0,"stroke-width":t.strokeWidth??void 0,opacity:t.opacity??void 0},r=t.action?()=>{this.onAction&&this.onAction(t.action)}:void 0,o=t.action?"cursor:pointer":void 0;switch(t.type){case"rect":return v`<rect
          x="${t.x??0}" y="${t.y??0}"
          width="${t.width??0}" height="${t.height??0}"
          rx="${t.rx??0}" ry="${t.ry??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"circle":return v`<circle
          cx="${t.cx??0}" cy="${t.cy??0}" r="${t.r??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"ellipse":return v`<ellipse
          cx="${t.cx??t.x??0}" cy="${t.cy??t.y??0}"
          rx="${t.rx??(t.width?t.width/2:0)}" ry="${t.ry??(t.height?t.height/2:0)}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"line":return v`<line
          x1="${t.x1??0}" y1="${t.y1??0}"
          x2="${t.x2??0}" y2="${t.y2??0}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"text":return v`<text
          x="${t.x??0}" y="${t.y??0}"
          fill="${e.fill??"currentColor"}"
          font-size="${t.fontSize??14}"
          font-weight="${t.fontWeight??"normal"}"
          font-family="${t.fontFamily??"sans-serif"}"
          text-anchor="${t.textAnchor??"start"}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        >${t.content??""}</text>`;case"path":return v`<path
          d="${t.d??""}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;default:return v``}}};customElements.define("forgeui-drawing",Le);export{se as ForgeAccordion,Ae as ForgeAlert,pe as ForgeAvatar,fe as ForgeBadge,Q as ForgeBreadcrumb,J as ForgeButton,Z as ForgeButtonGroup,oe as ForgeCard,Me as ForgeChart,xe as ForgeCheckbox,ie as ForgeContainer,$e as ForgeDatePicker,Pe as ForgeDialog,ae as ForgeDivider,Le as ForgeDrawing,he as ForgeEmptyState,Se as ForgeFileUpload,re as ForgeGrid,de as ForgeIcon,ge as ForgeImage,X as ForgeLink,ze as ForgeList,Ee as ForgeMetric,ye as ForgeMultiSelect,be as ForgeNumberInput,Ce as ForgeProgress,ce as ForgeRepeater,ve as ForgeSelect,ke as ForgeSlider,le as ForgeSpacer,te as ForgeStack,ee as ForgeStepper,_e as ForgeTable,ne as ForgeTabs,ue as ForgeText,me as ForgeTextInput,Ie as ForgeToast,we as ForgeToggle,je as ForgeUIError};
