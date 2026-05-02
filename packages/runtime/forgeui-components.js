import{html as s,css as p,svg as v,nothing as d}from"lit";import{LitElement as Je}from"lit";import{createStore as Ze}from"tinybase";var He=new Set(["__proto__","prototype","constructor"]);function P(n){if(n.length===0||n.length>256)return!1;for(let r of n.normalize("NFC").split("."))if(He.has(r))return!1;return!0}function H(n,r){if(r.includes("/")){let e=r.split("/");if(e.length===3){let[t,o,i]=e;return n.getCell(t,o,i)}if(e.length===2){let[t,o]=e,i=n.getValue(r);if(i!==void 0)return i;let a=n.getCellIds(t,o);if(a.length>0){let l={};for(let c of a)l[c]=n.getCell(t,o,c);return l}}}return n.getValue(r)}function Ke(n,r){if(r.startsWith("count:")){let e=r.slice(6);return n.getRowCount(e)}if(r.startsWith("sum:")){let[e,t]=r.split(":"),[o,i]=t.split("/"),a=0,l=n.getRowIds(o);for(let c of l){let u=n.getCell(o,c,i);typeof u=="number"&&(a+=u)}return a}if(r.startsWith("avg:")){let[e,t]=r.split(":"),[o,i]=t.split("/"),a=0,l=0,c=n.getRowIds(o);for(let u of c){let h=n.getCell(o,u,i);typeof h=="number"&&(a+=h,l++)}return l>0?a/l:0}return H(n,r)}var N=null;function K(n){N=n}function De(n,r){if(r.length>1024)return;let e="(state\\.[a-zA-Z_][a-zA-Z0-9_.]*|-?\\d+(?:\\.\\d+)?)",t=r.trim().match(new RegExp(`^${e}\\s*(>=|<=|[+\\-*/><])\\s*${e}$`));if(!t)return;let o=Pe(n,t[1]),i=Pe(n,t[3]);if(!(typeof o!="number"||typeof i!="number"))switch(t[2]){case"+":return o+i;case"-":return o-i;case"*":return o*i;case"/":return i===0?void 0:o/i;case">":return o>i;case"<":return o<i;case">=":return o>=i;case"<=":return o<=i}}function Pe(n,r){if(/^-?\d/.test(r))return Number(r);if(!r.startsWith("state."))return;let e=r.slice(6);return P(e)?Ne(n,e):void 0}function D(n,r){let e=r.trim();if(e==="")return;if(e.startsWith('"')&&e.endsWith('"')||e.startsWith("'")&&e.endsWith("'"))return e.slice(1,-1);if(e.startsWith('"')&&!e.endsWith('"')||e.startsWith("'")&&!e.endsWith("'"))return;if(e==="true")return!0;if(e==="false")return!1;if(e==="null")return null;if(/^-?\d+(\.\d+)?$/.test(e))return Number(e);if(/(?:[+\-*/%]|===?|!==?|>=?|<=?|\&\&|\|\|)/.test(e)&&!e.includes("|"))return De(n,e);if(e.includes("|")){let[o,...i]=e.split("|").map(c=>c.trim()),l=D(n,o);for(let c of i){let[u,...h]=c.split(/\s+/);l=Be(l,u,h)}return l}if(e.startsWith("item.")||e==="item"){if(e==="item")return N;let o=e.slice(5);return R(N,o)}if(e.startsWith("state.")||e==="state"){if(e==="state")return;let o=e.slice(6);return Ne(n,o)}return H(n,e)}function Be(n,r,e){switch(r){case"values":return Array.isArray(n)?n:n&&typeof n=="object"?Object.values(n):[];case"keys":return n&&typeof n=="object"?Object.keys(n):[];case"count":case"length":return Array.isArray(n)?n.length:n&&typeof n=="object"?Object.keys(n).length:typeof n=="string"?n.length:0;case"sum":return Array.isArray(n)?n.reduce((t,o)=>t+(typeof o=="number"?o:0),0):0;case"first":return Array.isArray(n)?n[0]:void 0;case"last":return Array.isArray(n)?n[n.length-1]:void 0;default:return n}}function R(n,r){if(!n||typeof n!="object"||!r||!P(r))return;let e=r.split(".");if(e.length>32)return;let t=n;for(let o of e){if(t==null)return;t=t[o]}return t}function Ne(n,r){if(!P(r))return;let e=n.getValue(r);if(e!==void 0){if(typeof e=="string")try{return JSON.parse(e)}catch{}return e}let t=r.split(".");if(t.length>=3){let[i,a,l,...c]=t;if(n.hasTable(i)&&n.hasRow(i,a)){let u=n.getCell(i,a,l);if(c.length===0)return u;if(typeof u=="string")try{let h=JSON.parse(u);return R(h,c.join("."))}catch{}return}}if(t.length>=2){let[i,a,...l]=t;if(n.hasTable(i)&&n.hasRow(i,a)){let c=n.getRow(i,a);return l.length===0?c:R(c,l.join("."))}}if(t.length>=1){let[i,...a]=t;if(n.hasTable(i)){let l=n.getRowIds(i),c={};for(let u of l)c[u]=n.getRow(i,u);return a.length===0?c:R(c,a.join("."))}}let o=n.getValue(t[0]);if(typeof o=="string"&&t.length>1)try{let i=JSON.parse(o);return R(i,t.slice(1).join("."))}catch{}}function I(n,r){if(typeof r!="string"){if(r!==null&&typeof r=="object"){let e=r;if("$expr"in e)return I(n,`$expr:${e.$expr}`);if("$state"in e)return I(n,`$state:${e.$state}`);if("$computed"in e)return I(n,`$computed:${e.$computed}`);if("$item"in e)return I(n,`$item:${e.$item}`)}return r}if(r.startsWith("$state:")){let e=r.slice(7);return P(e)?H(n,e):void 0}if(r.startsWith("$computed:")){let e=r.slice(10);return e.length>1024?void 0:Ke(n,e)}if(r.startsWith("$item:")){let e=r.slice(6);return P(e)?e.includes(".")?R(N,e):N?.[e]:void 0}if(r.startsWith("$expr:")){let e=r.slice(6);return e.length>1024?void 0:D(n,e)}return r.length>4096?r:r.includes("{{")&&r.includes("}}")?qe(r,n):r}function qe(n,r){let e="",t=0;for(;t<n.length;)if(n[t]==="{"&&n[t+1]==="{"){let o=t+2,i=1,a=o;for(;a<n.length-1&&i>0;){let l=n[a],c=n[a+1];l==="{"&&c==="{"?(i++,a+=2):l==="}"&&c==="}"?(i--,a+=2):a++}if(i)e+=n[t++];else{let l=n.slice(o,a-2);if(l.length<=256){let c=D(r,l.trim());e+=c==null?"":String(c)}else e+=n.slice(t,a);t=a}}else e+=n[t++];return e}import{css as B}from"lit";var Fe=B`
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
`,er=B`
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
`,q=B`
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
`;var W=class W extends Je{constructor(){super(...arguments);this._instanceId=`forge-${++W._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(e){if(!this.store)return e;this.itemContext&&K(this.itemContext);try{return I(this.store,e)}finally{K(null)}}getProp(e){let t=this.props?.[e];return typeof t=="string"&&(t.startsWith("$state:")||t.startsWith("$computed:")||t.startsWith("$item:")||t.startsWith("$expr:")||t.includes("{{")&&t.includes("}}"))?this.resolve(t):t}getArray(e){let t=this.getProp(e);return Array.isArray(t)?t:t&&typeof t=="object"?Object.values(t):[]}getString(e,t=""){let o=this.getProp(e);return typeof o=="string"?o:String(o??t)}getNumber(e,t=0){let o=this.getProp(e);return typeof o=="number"?o:Number(o)||t}getBool(e,t=!1){let o=this.getProp(e);return typeof o=="boolean"?o:t}dispatchAction(e,t){this.onAction&&this.onAction(e,t),this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:e,payload:t},bubbles:!0,composed:!0}))}handleAction(e){let t=this.getString("action");t&&this.dispatchAction(t,this.props)}prop(e){return this.getProp(e)}static get sharedStyles(){return[q]}gapValue(e){let t={none:"0",0:"0","3xs":"var(--forgeui-space-3xs)","2xs":"var(--forgeui-space-2xs)",xs:"var(--forgeui-space-xs)",sm:"var(--forgeui-space-sm)",md:"var(--forgeui-space-md)",lg:"var(--forgeui-space-lg)",xl:"var(--forgeui-space-xl)","2xl":"var(--forgeui-space-2xl)"};if(e==null||e==="")return"var(--forgeui-space-md)";let o=String(e);return o in t?t[o]:/^\d+(\.\d+)?$/.test(o)?`${o}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(o)?o:"var(--forgeui-space-md)"}static get styles(){return[q]}};W._instanceCounter=0;var g=W;var J=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`
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
  `}render(){let r=this.getString("direction","column"),e=r==="horizontal"||r==="row"?"row":"column",t=this.getString("gap","")||this.getString("spacing","md"),o=this.getString("padding",""),i=this.getString("align",""),a=this.getString("justify",""),l=this.getBool("wrap"),c=this.gapValue(t),u=o?this.gapValue(o):"0";return this.setAttribute("direction",e),i&&this.setAttribute("align",i),a&&this.setAttribute("justify",a),l&&this.setAttribute("wrap",""),this.style.gap=c,this.style.padding=u,s`<slot></slot>`}};customElements.define("forgeui-stack",J);var U=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`
    :host { display: grid; min-width: 0; }
    @media (max-width: 900px) {
      :host([responsive]) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let r=this.getProp("columns"),e;typeof r=="number"?e=String(r):typeof r=="string"&&r?e=r:e="1";let t=/^\d+$/.test(e)?`repeat(${e}, minmax(0, 1fr))`:e,o=this.getString("gap","md"),i=this.gapValue(o),a=this.getString("padding",""),l=a?this.gapValue(a):"0";return this.style.gridTemplateColumns=t,this.style.gap=i,this.style.padding=l,/^\d+$/.test(e)&&Number(e)>=2&&this.setAttribute("responsive",""),s`<slot></slot>`}};customElements.define("forgeui-grid",U);var Z=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`
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
  `}render(){let r=this.getString("variant",""),e=this.getString("title",""),t=this.getString("subtitle","");return r&&this.setAttribute("variant",r),s`
      ${e||t?s`
        <div class="header">
          ${e?s`<div class="title">${e}</div>`:d}
          ${t?s`<div class="subtitle">${t}</div>`:d}
        </div>
      `:d}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forgeui-card",Z);var X=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let r=this.getString("maxWidth",""),e={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},t=r in e?e[r]:r,o=this.getString("padding","");return t&&t!=="none"?this.style.maxWidth=t:this.style.maxWidth="",this.style.padding=o?this.gapValue(o):"",s`<slot></slot>`}};customElements.define("forgeui-container",X);var Y=class extends g{static get properties(){return{props:{type:Object},_active:{state:!0}}}constructor(){super(),this._active=""}static get styles(){return p`
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
  `}_itemKey(r){return typeof r=="string"?r:String(r&&typeof r=="object"?r.id??r.key??r.value??r.label??"":r??"")}_itemLabel(r){return typeof r=="string"?r:String(r&&typeof r=="object"?r.label??r.title??r.value??"":r??"")}updated(){Array.from(this.children).filter(e=>!(e instanceof HTMLScriptElement)).forEach((e,t)=>{String(t)===this._active||e.id===this._active||e.getAttribute("slot")===this._active?e.setAttribute("data-active",""):e.removeAttribute("data-active")})}_moveTo(r,e){let t=this._itemKey(e[r])||String(r);this._active=t,this.requestUpdate(),this.dispatchAction("tab-change",{active:t}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${r}`)?.focus()})}render(){let r=this.getProp("items")||[],e=Array.isArray(r)?r:[];!this._active&&e.length>0&&(this._active=this._itemKey(e[0])||"0");let t=e.findIndex((i,a)=>(this._itemKey(i)||String(a))===this._active),o=(i,a)=>{let l=-1;i.key==="ArrowRight"?l=(a+1)%e.length:i.key==="ArrowLeft"?l=(a-1+e.length)%e.length:i.key==="Home"?l=0:i.key==="End"&&(l=e.length-1),l!==-1&&(i.preventDefault(),this._moveTo(l,e))};return s`
      <div class="tabs" role="tablist">${e.map((i,a)=>{let l=this._itemKey(i)||String(a),c=this._itemLabel(i)||String(a+1),u=l===this._active;return s`
          <button class="tab" ?active=${u} role="tab" aria-selected=${u}
            id="${this._instanceId}-tab-${a}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${u?0:-1}"
            @click=${()=>{this._active=l,this.requestUpdate(),this.dispatchAction("tab-change",{active:l})}}
            @keydown=${h=>o(h,a)}>${c}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${t>=0?t:0}"><slot></slot></div>
    `}};customElements.define("forgeui-tabs",Y);var G=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`
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
  `}render(){let r=this.getString("title","Section");return s`<details><summary>${r}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forgeui-accordion",G);var Q=class extends g{static get styles(){return p`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forgeui-color-border); margin:var(--forgeui-space-sm) 0; }
  `}render(){return s`<hr>`}};customElements.define("forgeui-divider",Q);var F=class extends g{static get styles(){return p`:host { display:block; }`}render(){let r=this.getString("size","md"),e=this.getString("height",""),t=this.getString("width",""),o=e?this.gapValue(e):this.gapValue(r),i=t?/^\d+(\.\d+)?%$/.test(t)?t:this.gapValue(t):"";return s`<div style="height:${o};${i?`width:${i}`:""}"></div>`}};customElements.define("forgeui-spacer",F);var ee=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`
    :host { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let r=this.getArray("data"),e=this.getString("emptyMessage",""),t=this.getString("direction","column");(t==="row"||t==="horizontal")&&this.setAttribute("direction","row");let o=this.getString("gap","md");return this.style.gap=this.gapValue(o),r.length===0&&e?s`<div class="empty">${e}</div>`:s`<slot></slot>`}};customElements.define("forgeui-repeater",ee);var re=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`
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
  `}render(){let r=this.getString("content",""),e=this.getString("variant","body"),o={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[e]||e,i=this.getString("colorScheme",""),a=this.getString("align",""),l=this.getString("weight",""),c={primary:"var(--forgeui-color-primary)",secondary:"var(--forgeui-color-text-secondary)",tertiary:"var(--forgeui-color-text-tertiary)",success:"var(--forgeui-color-success)",warning:"var(--forgeui-color-warning)",error:"var(--forgeui-color-error)",info:"var(--forgeui-color-info)"},u={normal:"var(--forgeui-weight-normal)",medium:"var(--forgeui-weight-medium)",semibold:"var(--forgeui-weight-semibold)",bold:"var(--forgeui-weight-bold)"},h=[];i&&c[i]&&h.push(`color:${c[i]}`),l&&u[l]&&h.push(`font-weight:${u[l]}`);let f=a?`align-${a}`:"",S=s`${r}<slot></slot>`;return o==="heading1"?s`<h1 class="${o} ${f}" style="${h.join(";")}">${S}</h1>`:o==="heading2"?s`<h2 class="${o} ${f}" style="${h.join(";")}">${S}</h2>`:o==="heading3"?s`<h3 class="${o} ${f}" style="${h.join(";")}">${S}</h3>`:s`<div class="${o} ${f}" style="${h.join(";")}">${r}<slot></slot></div>`}};customElements.define("forgeui-text",re);var te=class extends g{static get styles(){return p`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `}render(){let r=this.getString("src",""),e=this.getString("alt",""),t=this.getString("fit","contain");return r?s`<img src="${r}" alt="${e}" style="object-fit:${t}" loading="lazy">`:s`${d}`}};customElements.define("forgeui-image",te);var oe=class extends g{static get styles(){return p`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `}render(){let r=this.getString("name","circle"),e={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},t=e[r]||e.circle;return s`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${t}"/></svg>`}};customElements.define("forgeui-icon",oe);var ie=class extends g{static get styles(){return p`
    :host { display:inline-flex; align-items:center; max-width:100%; }
    .badge { display:inline-flex; align-items:center; min-height:1.5rem; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .badge[variant="success"] { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge[variant="error"] { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
  `}render(){let r=this.getString("text","")||this.getString("label",""),e=this.getString("variant","");return s`<span class="badge" variant="${e}">${r}<slot></slot></span>`}};customElements.define("forgeui-badge",ie);var ne=class extends g{static get styles(){return p`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let r=this.getString("src",""),e=this.getString("name","?"),t=e.split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2);return s`<div class="avatar">${r?s`<img src="${r}" alt="${e}">`:t}<slot></slot></div>`}};customElements.define("forgeui-avatar",ne);var se=class extends g{static get styles(){return p`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); overflow-wrap:break-word; }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); overflow-wrap:break-word; }
  `}render(){let r=this.getString("title","Nothing here"),e=this.getString("description","");return s`
      <div class="title">${r}</div>
      ${e?s`<div class="desc">${e}</div>`:d}
      <slot></slot>
    `}};customElements.define("forgeui-empty-state",se);var ae=class extends g{static get styles(){return p`
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
  `}render(){let r=this.getString("label",""),e=this.getString("placeholder",""),t=this.getString("hint",""),o=this.getString("error",""),i=this.getString("inputType","")||this.getString("type","text"),a=this.getBool("multiline"),l=this.getString("value",""),c=this._instanceId;return s`
      ${r?s`<label for="${c}">${r}</label>`:d}
      ${a?s`<textarea id="${c}" placeholder="${e}" .value=${l} @input=${u=>this.dispatchAction("change",{value:u.target.value})}></textarea>`:s`<input id="${c}" type="${i}" placeholder="${e}" .value=${l} @input=${u=>this.dispatchAction("change",{value:u.target.value})}>`}
      ${t&&!o?s`<div class="hint">${t}</div>`:d}
      ${o?s`<div class="error">${o}</div>`:d}
    `}};customElements.define("forgeui-text-input",ae);var le=class extends g{static get styles(){return p`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let r=this.getString("label",""),e=this.getProp("min"),t=this.getProp("max"),o=this.getProp("step"),i=this.getProp("value"),a=this._instanceId;return s`
      ${r?s`<label for="${a}">${r}</label>`:d}
      <input id="${a}" type="number" min=${e} max=${t} step=${o} .value=${i??""}
        @input=${l=>this.dispatchAction("change",{value:Number(l.target.value)})}>
    `}};customElements.define("forgeui-number-input",le);var ce=class extends g{static get styles(){return p`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    select { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let r=this.getString("label",""),e=this.getProp("options")||[],t=this.getString("value",""),o=this._instanceId;return s`
      ${r?s`<label for="${o}">${r}</label>`:d}
      <select id="${o}" .value=${t} @change=${i=>this.dispatchAction("change",{value:i.target.value})}>
        ${e.map(i=>s`<option value=${typeof i=="string"?i:i.value} ?selected=${(typeof i=="string"?i:i.value)===t}>
          ${typeof i=="string"?i:i.label||i.value}
        </option>`)}
      </select>
    `}};customElements.define("forgeui-select",ce);var ue=class extends g{static get styles(){return p`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-xs); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-height:var(--forgeui-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-sm);
      font-size:var(--forgeui-text-xs); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; border-radius:2px; }
    .tag button:focus-visible { outline:2px solid var(--forgeui-color-focus); outline-offset:1px; }
  `}render(){let r=this.getString("label",""),e=this.getProp("selected")||[];return s`
      ${r?s`<label>${r}</label>`:d}
      <div class="tags">
        ${e.map(t=>s`<span class="tag">${String(t)}<button @click=${()=>this.dispatchAction("remove",{value:t})}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forgeui-multi-select",ue);var ge=class extends g{static get styles(){return p`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); margin-bottom:var(--forgeui-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); cursor:pointer; }
    label { font-size:var(--forgeui-text-sm); cursor:pointer; }
    :focus-within label { text-decoration:underline; }
  `}render(){let r=this.getString("label",""),e=this.getBool("checked"),t=this._instanceId;return s`
      <input id="${t}" type="checkbox" ?checked=${e} @change=${o=>this.dispatchAction("change",{checked:o.target.checked})}>
      ${r?s`<label for="${t}">${r}</label>`:d}
    `}};customElements.define("forgeui-checkbox",ge);var de=class extends g{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let e=this.getBool("on");this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{actionId:"change",value:!e},bubbles:!0,composed:!0}))};this._onKeydown=e=>{(e.key==="Enter"||e.key===" "||e.key==="Spacebar")&&(e.preventDefault(),this._toggle())}}static get styles(){return p`
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
  `}render(){let e=this.getBool("on"),t=this.getString("label",""),o=this.getBool("disabled"),i=this._instanceId;return s`
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
        ${t?s`<span class="toggle-text">${t}</span>`:d}
      </label>
    `}};customElements.define("forgeui-toggle",de);var fe=class extends g{static get styles(){return p`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let r=this.getString("label",""),e=this.getString("value","");return s`
      ${r?s`<label>${r}</label>`:d}
      <input type="date" .value=${e} @change=${t=>this.dispatchAction("change",{value:t.target.value})}>
    `}};customElements.define("forgeui-date-picker",fe);var pe=class extends g{static get styles(){return p`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input[type=range] { width:100%; accent-color:var(--forgeui-color-primary); min-width:0; }
    .value { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
  `}render(){let r=this.getString("label",""),e=this.getNumber("min",0),t=this.getNumber("max",100),o=this.getNumber("step",1),i=this.getNumber("value",e);return s`
      ${r?s`<label>${r}</label>`:d}
      <input type="range" min=${e} max=${t} step=${o} .value=${i}
        @input=${a=>this.dispatchAction("change",{value:Number(a.target.value)})}>
      <div class="value">${i}</div>
    `}};customElements.define("forgeui-slider",pe);var he=class extends g{static get styles(){return p`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .dropzone { border:2px dashed var(--forgeui-color-border-strong); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forgeui-transition-fast); }
    .dropzone:hover { border-color:var(--forgeui-color-primary); background:var(--forgeui-color-primary-subtle); }
    .dropzone:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `}render(){let r=this.getString("label","Upload file"),e=this.getString("accept","*");return s`
      ${r?s`<label>${r}</label>`:d}
      <div class="dropzone" @click=${()=>this.shadowRoot?.querySelector("input")?.click()}>
        <p>Click or drop file here</p>
        <input type="file" accept="${e}" hidden @change=${t=>{let o=t.target.files?.[0];o&&this.dispatchAction("change",{name:o.name,size:o.size,type:o.type})}}>
      </div>
    `}};customElements.define("forgeui-file-upload",he);var me=class extends g{static get styles(){return p`
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
  `}render(){let r=this.getString("label","Button"),e=this.getString("variant","primary"),t=this.getString("size",""),o=this.getBool("disabled"),i=this.getProp("pressed");return s`<button class="${e} ${t}" ?disabled=${o}
      aria-pressed=${i==null?d:String(!!i)}
      @click=${a=>this.handleAction(a)}>${r}<slot></slot></button>`}};customElements.define("forgeui-button",me);var ve=class extends g{static get styles(){return p`
    :host { display:flex; gap:var(--forgeui-space-xs); }
  `}render(){return s`<slot></slot>`}};customElements.define("forgeui-button-group",ve);var be=class extends g{static get styles(){return p`
    :host { display:inline-flex; }
    a { color:var(--forgeui-color-primary); text-decoration:none; font-size:var(--forgeui-text-sm); cursor:pointer;
      text-decoration-thickness:1px; text-underline-offset:2px; }
    a:hover { text-decoration:underline; }
    a:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; border-radius:2px; }
  `}render(){let r=this.getString("label",""),e=this.getString("href","#");return s`<a href="${e}">${r}<slot></slot></a>`}};customElements.define("forgeui-link",be);var xe=class extends g{static get styles(){return p`
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
  `}_statusClass(r){let e=String(r??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(e)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(e)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(e)?"neutral":["high","urgent","critical"].includes(e)?"error":["medium","med"].includes(e)?"warning":["low"].includes(e)?"info":["failed","error","rejected","blocked","overdue"].includes(e)?"error":"neutral"}_renderCell(r,e){let t=typeof r=="string"?r:r.key,o=e[t],i=r&&typeof r=="object"?r.type:void 0;if(o==null||o==="")return s`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;if(i==="badge"||i==="status"){let a=(r.variant&&typeof r.variant=="object"?r.variant[String(o).toLowerCase()]:null)||this._statusClass(o);return s`<span class="badge ${a}">${String(o)}</span>`}if(i==="number")return typeof o=="number"?o.toLocaleString():String(o);if(i==="date"){let a=typeof o=="string"||typeof o=="number"?new Date(o):o;return a instanceof Date&&!isNaN(a.getTime())?a.toLocaleDateString():String(o)}if(i==="currency"){let a=Number(o);return isNaN(a)?String(o):a.toLocaleString(void 0,{style:"currency",currency:r.currency||"USD"})}return i==="boolean"?o?"\u2713":"\u2717":String(o)}render(){let r=this.getProp("data"),e=this.getProp("columns")||[],t=this.getString("emptyMessage","No data yet"),o=this.getString("rowAction",""),i=this.getString("caption","");if(!Array.isArray(r))return s`<div class="empty">${t}</div>`;let a=e.length>0?e:r.length>0?Object.keys(r[0]):[];return a.length===0?s`<div class="empty">${t}</div>`:s`
      <table>
        ${i?s`<caption>${i}</caption>`:d}
        <thead><tr>${a.map(l=>{let c=typeof l=="string"?l:l.label||l.key,u=typeof l=="object"?l.align:void 0,h=typeof l=="object"?l.width:void 0;return s`<th class="${u==="right"?"align-right":u==="center"?"align-center":""}" style="${h?`width:${h}`:""}">${c}</th>`})}</tr></thead>
        <tbody>${r.length===0?s`<tr><td colspan=${a.length} class="empty">${t}</td></tr>`:r.map((l,c)=>{let u=!!o,h=u?String(l[typeof a[0]=="string"?a[0]:a[0]?.key]??`Row ${c+1}`):"";return s`<tr class="${u?"row-action":""}"
                tabindex=${u?0:d}
                role=${u?"button":d}
                aria-label=${u?h:d}
                @click=${u?()=>this.dispatchAction(o,{row:l,index:c}):void 0}
                @keydown=${u?f=>{(f.key==="Enter"||f.key===" ")&&(f.preventDefault(),this.dispatchAction(o,{row:l,index:c}))}:void 0}>
              ${a.map(f=>{let S=typeof f=="object"?f.align:void 0;return s`<td class="${S==="right"?"align-right":S==="center"?"align-center":""}">${this._renderCell(f,l)}</td>`})}</tr>`})}</tbody>
      </table>
    `}};customElements.define("forgeui-table",xe);var ye=class extends g{static get styles(){return p`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); overflow-wrap:break-word; min-width:0; }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); overflow-wrap:break-word; }
  `}render(){let r=this.getProp("data"),e=this.getString("emptyMessage","No items");return!Array.isArray(r)||r.length===0?s`<div class="empty">${e}</div>`:s`<div class="list">${r.map((t,o)=>s`
      <div class="item" data-index=${o}><slot name="item" .item=${t} .index=${o}>${JSON.stringify(t)}</slot></div>
    `)}</div>`}};customElements.define("forgeui-list",ye);var we=class extends g{constructor(){super(...arguments);this._palette=["var(--forgeui-color-primary)","var(--forgeui-color-success)","var(--forgeui-color-warning)","var(--forgeui-color-error)","var(--forgeui-color-info)","var(--forgeui-color-chart-6)","var(--forgeui-color-chart-7)","var(--forgeui-color-chart-8)","var(--forgeui-color-chart-9)","var(--forgeui-color-chart-10)"]}static get styles(){return p`
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
  `}_niceMax(e){if(e<=0)return 1;let t=Math.pow(10,Math.floor(Math.log10(e))),o=e/t;return(o<=1?1:o<=2?2:o<=5?5:10)*t}render(){let e=this.getString("chartType","bar"),t=this.getProp("data")||[],o=this.getString("title",""),i=this.getString("xKey","label")||this.getString("labelKey","label"),a=this.getString("yKey","value")||this.getString("valueKey","value"),l=this.getString("color","");if(!t||t.length===0)return s`
        ${o?s`<div class="title">${o}</div>`:d}
        <div class="empty">No data to display</div>
      `;let c=t.map(m=>typeof m=="number"?{label:"",value:m}:m&&typeof m=="object"?{label:String(m[i]??m.label??m.name??m.x??""),value:Number(m[a]??m.value??m.y??0)||0,color:m.color}:{label:String(m),value:0}),u=600,h=260,f={top:8,right:16,bottom:36,left:48},S=u-f.left-f.right,M=h-f.top-f.bottom,O,je=d;if(e==="pie"||e==="donut"){let m=c.reduce((w,x)=>w+Math.max(0,x.value),0)||1,C=u/2,A=h/2,z=Math.min(S,M)/2-8,_=e==="donut"?z*.55:0,b=-Math.PI/2,y=[],E=[];c.forEach((w,x)=>{let j=Math.max(0,w.value)/m,$=b,k=b+j*Math.PI*2;b=k;let L=k-$>Math.PI?1:0,V=C+z*Math.cos($),Re=A+z*Math.sin($),Ie=C+z*Math.cos(k),Le=A+z*Math.sin(k),T=w.color||this._palette[x%this._palette.length];if(E.push(T),_>0){let Oe=C+_*Math.cos($),Ve=A+_*Math.sin($),We=C+_*Math.cos(k),Te=A+_*Math.sin(k);y.push(v`<path class="slice" fill="${T}" d="M ${V} ${Re} A ${z} ${z} 0 ${L} 1 ${Ie} ${Le} L ${We} ${Te} A ${_} ${_} 0 ${L} 0 ${Oe} ${Ve} Z"/>`)}else y.push(v`<path class="slice" fill="${T}" d="M ${C} ${A} L ${V} ${Re} A ${z} ${z} 0 ${L} 1 ${Ie} ${Le} Z"/>`)}),O=v`<g>${y}</g>`,je=s`<div class="legend">${c.map((w,x)=>s`
        <span class="legend-item"><span class="swatch" style="background:${E[x]}"></span>${w.label} (${w.value})</span>
      `)}</div>`}else{let m=Math.max(...c.map(b=>b.value),0),C=this._niceMax(m),A=b=>f.top+M-b/C*M,z=4,_=[];for(let b=0;b<=z;b++){let y=C*b/z,E=A(y);_.push(v`<line class="grid" x1="${f.left}" x2="${f.left+S}" y1="${E}" y2="${E}"/>`),_.push(v`<text class="tick-label" x="${f.left-6}" y="${E+3}" text-anchor="end">${y.toLocaleString()}</text>`)}if(e==="line"||e==="area"){let b=S/Math.max(1,c.length-1),y=c.map((x,j)=>{let $=f.left+j*b,k=A(x.value);return`${j===0?"M":"L"} ${$} ${k}`}).join(" "),E=e==="area"?y+` L ${f.left+S} ${f.top+M} L ${f.left} ${f.top+M} Z`:"",w=l||"var(--forgeui-color-primary)";O=s`
          <g>${_}</g>
          ${e==="area"?v`<path class="area" d="${E}" style="fill:${w};opacity:0.15"/>`:d}
          ${v`<path class="line" d="${y}" style="stroke:${w}"/>`}
          ${c.map((x,j)=>{let $=f.left+j*b,k=A(x.value);return v`<circle class="point" cx="${$}" cy="${k}" r="3" style="fill:${w}"/>
              <text class="tick-label" x="${$}" y="${f.top+M+14}" text-anchor="middle">${x.label}</text>`})}
        `}else{let b=c.length,y=S/b,E=Math.max(2,y*.7),w=y-E;O=s`
          <g>${_}</g>
          ${c.map((x,j)=>{let $=f.left+j*y+w/2,k=A(x.value),L=Math.max(0,f.top+M-k),V=x.color||l||"var(--forgeui-color-primary)";return v`<rect class="bar" x="${$}" y="${k}" width="${E}" height="${L}" rx="2" style="fill:${V}">
                <title>${x.label}: ${x.value}</title>
              </rect>
              <text class="tick-label" x="${$+E/2}" y="${f.top+M+14}" text-anchor="middle">${x.label}</text>`})}
        `}}return s`
      ${o?s`<div class="title">${o}</div>`:d}
      <div class="wrap">
        <svg viewBox="0 0 ${u} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${o||e+" chart"}">
          ${O}
        </svg>
        ${je}
      </div>
    `}};customElements.define("forgeui-chart",we);var $e=class extends g{static get styles(){return p`
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
  `}_trendMeta(r){if(r==null||r==="")return null;if(typeof r=="number")return r>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(r)}%`}:r<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(r)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof r=="string"){let e=r.toLowerCase(),t=r.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(t){let o=parseFloat(t[1]),i=t[2];return o>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(o)}${i}`}:o<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(o)}${i}`}:{dir:"neutral",arrow:"\u2192",display:`0${i}`}}return e==="up"||e==="positive"||e==="increase"?{dir:"up",arrow:"\u2191",display:""}:e==="down"||e==="negative"||e==="decrease"?{dir:"down",arrow:"\u2193",display:""}:e==="flat"||e==="neutral"||e==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:r}}return null}render(){let r=this.getString("label",""),e=this.getProp("value"),t=this.getProp("trend"),o=this.getString("trendLabel",""),i=this.getProp("goal"),a=this.getString("unit",""),l=this.getString("suffix",""),c=this.getString("subtitle",""),u=this.getString("variant","");u&&this.setAttribute("variant",u);let h=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),f=this._trendMeta(t);return s`
      ${r?s`<div class="label">${r}</div>`:d}
      <div class="value-row">
        <span class="value">${h}</span>
        ${a?s`<span class="unit">${a}</span>`:d}
        ${l?s`<span class="suffix">${l}</span>`:d}
        ${f?s`<span class="trend ${f.dir} ${!f.display&&!o?"icon-only":""}">${f.arrow}${f.display?s` ${f.display}`:d}${o?s` ${o}`:d}</span>`:d}
      </div>
      ${c?s`<div class="subtitle">${c}</div>`:d}
      ${i!=null&&i!==""?s`<div class="goal">Goal: ${typeof i=="number"?i.toLocaleString():i}</div>`:d}
    `}};customElements.define("forgeui-metric",$e);var ke=class extends g{static get styles(){return p`
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
  `}render(){let r=this.getString("variant","info"),e=this.getString("title",""),t=this.getString("message","");return s`<div class="alert ${r}" role=${r==="error"||r==="warning"?"alert":"status"}>
      ${e?s`<strong>${e}</strong> `:d}${t}<slot></slot>
    </div>`}};customElements.define("forgeui-alert",ke);var Se=class extends g{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=e=>this._onKeydown(e);this._close=()=>{this.dispatchAction("close")}}static get styles(){return p`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-lg); min-width:min(20rem, 90vw); max-width:90vw; max-height:90vh; overflow:auto;
      border:1px solid var(--forgeui-color-border);
      box-shadow:var(--forgeui-shadow-lg); z-index:1; word-break:break-word; }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forgeui-space-xs); margin-top:var(--forgeui-space-lg); }
  `}render(){let e=this.getString("title",""),t=this.getBool("open"),o=`${this._instanceId}-title`;return t?this.setAttribute("open",""):this.removeAttribute("open"),t?s`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${e?o:d}"
        tabindex="-1"
        @click=${i=>i.stopPropagation()}
      >
        ${e?s`<h2 id="${o}" class="title">${e}</h2>`:d}
        <slot></slot>
      </div>
    `:d}updated(e){if(super.updated?.(e),e.has("props")){let t=this.getBool("open"),i=e.get("props")?.open??!1;t&&!i?this._onOpen():!t&&i&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let e=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??e)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(e){if(e.key==="Escape"){e.preventDefault(),this._close();return}e.key==="Tab"&&this._trapFocus(e)}_trapFocus(e){let t=this._allFocusableInDialog();if(t.length===0){e.preventDefault();return}let o=t[0],i=t[t.length-1],a=this.shadowRoot?.activeElement??document.activeElement;e.shiftKey?(a===o||!this._dialogContains(a))&&(e.preventDefault(),i.focus()):(a===i||!this._dialogContains(a))&&(e.preventDefault(),o.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let e=this.shadowRoot?.querySelector(".dialog");if(!e)return[];let t='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',o=Array.from(e.querySelectorAll(t)),i=e.querySelector("slot"),a=i instanceof HTMLSlotElement?i.assignedElements({flatten:!0}).flatMap(l=>[l,...Array.from(l.querySelectorAll(t))].filter(u=>u instanceof HTMLElement&&u.matches(t))):[];return[...o,...a].filter(l=>!l.disabled)}_dialogContains(e){return e?this.shadowRoot?.querySelector(".dialog")?.contains(e)??!1:!1}};customElements.define("forgeui-dialog",Se);var ze=class extends g{static get styles(){return p`
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
  `}render(){let r=this.getProp("value"),e=this.getNumber("max",100),t=r==null,o=t?0:Math.max(0,Math.min(Number(r),e)),i=t?0:o/e*100,a=this.getString("label",""),l=this.getBool("showValue");return s`
      ${a||l?s`
        <div class="meta">
          ${a?s`<span>${a}</span>`:s`<span></span>`}
          ${l?s`<span class="value">${Math.round(i)}%</span>`:d}
        </div>
      `:d}
      <div
        class="progress ${t?"indeterminate":""}"
        role="progressbar"
        aria-label="${a||"Progress"}"
        aria-valuemin="0"
        aria-valuemax="${e}"
        aria-valuenow="${t?d:o}"
        aria-valuetext="${t?"Loading":`${Math.round(i)}%`}"
      >
        <div class="bar" style=${t?"":`width:${i}%`}></div>
      </div>
    `}};customElements.define("forgeui-progress",ze);var _e=class extends g{static get styles(){return p`
    :host { display:block; position:fixed; bottom:var(--forgeui-space-lg); right:var(--forgeui-space-lg); z-index:60; }
    .toast { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-text); color:var(--forgeui-color-text-inverse); font-size:var(--forgeui-text-sm);
      box-shadow:var(--forgeui-shadow-lg); max-width:20rem; overflow-wrap:break-word; }
  `}render(){let r=this.getString("message","");return r?s`<div class="toast">${r}</div>`:s`${d}`}};customElements.define("forgeui-toast",_e);var Ee=class extends g{static get styles(){return p`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); }
    .sep { color:var(--forgeui-color-text-tertiary); }
    a { color:var(--forgeui-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-medium); }
  `}render(){let r=this.getProp("items")||[];return s`${r.map((e,t)=>{let o=t===r.length-1,i=typeof e=="string"?e:e.label,a=typeof e=="string"?"#":e.href;return s`
        ${t>0?s`<span class="sep">/</span>`:d}
        ${o?s`<span class="current">${i}</span>`:s`<a href="${a}">${i}</a>`}
      `})}`}};customElements.define("forgeui-breadcrumb",Ee);var Ae=class extends g{static get styles(){return p`
    :host { display:flex; width:100%; gap:0; }
    .step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; min-width:0; }
    /* Connector line: starts from after circle midpoint, ends at the next step's circle midpoint */
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
  `}render(){let r=this.getProp("steps")||[],e=this.getNumber("active",0);return s`${r.map((t,o)=>{let i=typeof t=="string"?t:t.label||t.title||`Step ${o+1}`,a=o===e,l=o<e;return s`<div class="step" ?active=${a} ?completed=${l}>
        <div class="circle">${l?"\u2713":o+1}</div>
        <div class="label">${i}</div>
      </div>`})}`}};customElements.define("forgeui-stepper",Ae);var Me=class extends g{static get styles(){return p`
    :host { display:block; }
    .error { padding:var(--forgeui-space-sm); background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error);
      border:1px solid var(--forgeui-color-error); border-radius:var(--forgeui-radius-md); font-size:var(--forgeui-text-sm); }
  `}render(){let r=this.getString("msg","Unknown error");return s`<div class="error" role="alert">⚠ ${r}</div>`}};customElements.define("forgeui-error",Me);var Ce=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return p`
    :host { display:block; }
    svg { display:block; }
  `}render(){let r=this.getNumber("width",400),e=this.getNumber("height",300),t=this.getString("background","transparent"),o=this.getProp("shapes")||[];return v`
      <svg width="${r}" height="${e}" style="background:${t}" viewBox="0 0 ${r} ${e}">
        ${o.map(i=>this.renderShape(i))}
      </svg>
    `}renderShape(r){let e={fill:r.fill??void 0,stroke:r.stroke??void 0,"stroke-width":r.strokeWidth??void 0,opacity:r.opacity??void 0},t=r.action?()=>{this.onAction&&this.onAction(r.action)}:void 0,o=r.action?"cursor:pointer":void 0;switch(r.type){case"rect":return v`<rect
          x="${r.x??0}" y="${r.y??0}"
          width="${r.width??0}" height="${r.height??0}"
          rx="${r.rx??0}" ry="${r.ry??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"circle":return v`<circle
          cx="${r.cx??0}" cy="${r.cy??0}" r="${r.r??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"ellipse":return v`<ellipse
          cx="${r.cx??r.x??0}" cy="${r.cy??r.y??0}"
          rx="${r.rx??(r.width?r.width/2:0)}" ry="${r.ry??(r.height?r.height/2:0)}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"line":return v`<line
          x1="${r.x1??0}" y1="${r.y1??0}"
          x2="${r.x2??0}" y2="${r.y2??0}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${t}
        />`;case"text":return v`<text
          x="${r.x??0}" y="${r.y??0}"
          fill="${e.fill??"currentColor"}"
          font-size="${r.fontSize??14}"
          font-weight="${r.fontWeight??"normal"}"
          font-family="${r.fontFamily??"sans-serif"}"
          text-anchor="${r.textAnchor??"start"}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${t}
        >${r.content??""}</text>`;case"path":return v`<path
          d="${r.d??""}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${t}
        />`;default:return v``}}};customElements.define("forgeui-drawing",Ce);export{G as ForgeAccordion,ke as ForgeAlert,ne as ForgeAvatar,ie as ForgeBadge,Ee as ForgeBreadcrumb,me as ForgeButton,ve as ForgeButtonGroup,Z as ForgeCard,we as ForgeChart,ge as ForgeCheckbox,X as ForgeContainer,fe as ForgeDatePicker,Se as ForgeDialog,Q as ForgeDivider,Ce as ForgeDrawing,se as ForgeEmptyState,he as ForgeFileUpload,U as ForgeGrid,oe as ForgeIcon,te as ForgeImage,be as ForgeLink,ye as ForgeList,$e as ForgeMetric,ue as ForgeMultiSelect,le as ForgeNumberInput,ze as ForgeProgress,ee as ForgeRepeater,ce as ForgeSelect,pe as ForgeSlider,F as ForgeSpacer,J as ForgeStack,Ae as ForgeStepper,xe as ForgeTable,Y as ForgeTabs,re as ForgeText,ae as ForgeTextInput,_e as ForgeToast,de as ForgeToggle,Me as ForgeUIError};
