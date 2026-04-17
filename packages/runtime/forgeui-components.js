import{html as s,css as d,svg as M,nothing as f}from"lit";import{LitElement as Be}from"lit";import{createStore as Ue}from"tinybase";var We=new Set(["__proto__","prototype","constructor"]);function H(i){if(i.length===0||i.length>256)return!1;for(let t of i.normalize("NFC").split("."))if(We.has(t))return!1;return!0}function K(i,t){if(t.includes("/")){let e=t.split("/");if(e.length===3){let[r,o,n]=e;return i.getCell(r,o,n)}if(e.length===2){let[r,o]=e,n=i.getValue(t);if(n!==void 0)return n;let a=i.getCellIds(r,o);if(a.length>0){let l={};for(let c of a)l[c]=i.getCell(r,o,c);return l}}}return i.getValue(t)}function He(i,t){if(t.startsWith("count:")){let e=t.slice(6);return i.getRowCount(e)}if(t.startsWith("sum:")){let[e,r]=t.split(":"),[o,n]=r.split("/"),a=0,l=i.getRowIds(o);for(let c of l){let u=i.getCell(o,c,n);typeof u=="number"&&(a+=u)}return a}if(t.startsWith("avg:")){let[e,r]=t.split(":"),[o,n]=r.split("/"),a=0,l=0,c=i.getRowIds(o);for(let u of c){let h=i.getCell(o,u,n);typeof h=="number"&&(a+=h,l++)}return l>0?a/l:0}return K(i,t)}var N=null;function D(i){N=i}function V(i,t){let e=t.trim();if(e!==""){if(e.startsWith('"')&&e.endsWith('"')||e.startsWith("'")&&e.endsWith("'"))return e.slice(1,-1);if(!(e.startsWith('"')&&!e.endsWith('"')||e.startsWith("'")&&!e.endsWith("'"))){if(e==="true")return!0;if(e==="false")return!1;if(e==="null")return null;if(/^-?\d+(\.\d+)?$/.test(e))return Number(e);if(e.includes("|")){let[r,...o]=e.split("|").map(l=>l.trim()),a=V(i,r);for(let l of o){let[c,...u]=l.split(/\s+/);a=Ke(a,c,u)}return a}if(e.startsWith("item.")||e==="item"){if(e==="item")return N;let r=e.slice(5);return R(N,r)}if(e.startsWith("state.")||e==="state"){if(e==="state")return;let r=e.slice(6);return De(i,r)}return K(i,e)}}}function Ke(i,t,e){switch(t){case"values":return Array.isArray(i)?i:i&&typeof i=="object"?Object.values(i):[];case"keys":return i&&typeof i=="object"?Object.keys(i):[];case"count":case"length":return Array.isArray(i)?i.length:i&&typeof i=="object"?Object.keys(i).length:typeof i=="string"?i.length:0;case"sum":return Array.isArray(i)?i.reduce((r,o)=>r+(typeof o=="number"?o:0),0):0;case"first":return Array.isArray(i)?i[0]:void 0;case"last":return Array.isArray(i)?i[i.length-1]:void 0;default:return i}}function R(i,t){if(!i||typeof i!="object"||!t||!H(t))return;let e=t.split(".");if(e.length>32)return;let r=i;for(let o of e){if(r==null)return;r=r[o]}return r}function De(i,t){let e=i.getValue(t);if(e!==void 0)return e;let r=t.split(".");if(r.length>=3){let[n,a,l,...c]=r;if(i.hasTable(n)&&i.hasRow(n,a)){let u=i.getCell(n,a,l);if(c.length===0)return u;if(typeof u=="string")try{let h=JSON.parse(u);return R(h,c.join("."))}catch{}return}}if(r.length>=2){let[n,a,...l]=r;if(i.hasTable(n)&&i.hasRow(n,a)){let c=i.getRow(n,a);return l.length===0?c:R(c,l.join("."))}}if(r.length>=1){let[n,...a]=r;if(i.hasTable(n)){let l=i.getRowIds(n),c={};for(let u of l)c[u]=i.getRow(n,u);return a.length===0?c:R(c,a.join("."))}}let o=i.getValue(r[0]);if(typeof o=="string"&&r.length>1)try{let n=JSON.parse(o);return R(n,r.slice(1).join("."))}catch{}}function I(i,t){if(typeof t!="string"){if(t!==null&&typeof t=="object"){let e=t;if("$expr"in e)return I(i,`$expr:${e.$expr}`);if("$state"in e)return I(i,`$state:${e.$state}`);if("$computed"in e)return I(i,`$computed:${e.$computed}`);if("$item"in e)return I(i,`$item:${e.$item}`)}return t}if(t.startsWith("$state:")){let e=t.slice(7);return H(e)?K(i,e):void 0}if(t.startsWith("$computed:")){let e=t.slice(10);return e.length>1024?void 0:He(i,e)}if(t.startsWith("$item:")){let e=t.slice(6);return H(e)?e.includes(".")?R(N,e):N?.[e]:void 0}if(t.startsWith("$expr:")){let e=t.slice(6);return e.length>1024?void 0:V(i,e)}return t.length>4096?t:t.includes("{{")&&t.includes("}}")?Ve(t,i):t}function Ve(i,t){let e="",r=0;for(;r<i.length;)if(i[r]==="{"&&i[r+1]==="{"){let o=r+2,n=1,a=o;for(;a<i.length-1&&n>0;){let l=i[a],c=i[a+1];l==="{"&&c==="{"?(n++,a+=2):l==="}"&&c==="}"?(n--,a+=2):a++}if(n)e+=i[r++];else{let l=i.slice(o,a-2);if(l.length<=256){let c=V(t,l.trim());e+=c==null?"":String(c)}else e+=i.slice(r,a);r=a}}else e+=i[r++];return e}import{css as B}from"lit";var Ge=B`
  @layer tokens {
    :host {
      /* ─── Colors ─── */
      --forgeui-color-primary: #3b82f6;
      --forgeui-color-primary-hover: #2563eb;
      --forgeui-color-primary-active: #1d4ed8;
      --forgeui-color-primary-subtle: #eff6ff;
      
      --forgeui-color-success: #10b981;
      --forgeui-color-success-subtle: #ecfdf5;
      --forgeui-color-warning: #f59e0b;
      --forgeui-color-warning-subtle: #fffbeb;
      --forgeui-color-error: #ef4444;
      --forgeui-color-error-subtle: #fef2f2;
      --forgeui-color-info: #6366f1;
      --forgeui-color-info-subtle: #eef2ff;
      
      --forgeui-color-text: #1f2937;
      --forgeui-color-text-secondary: #6b7280;
      --forgeui-color-text-tertiary: #9ca3af;
      --forgeui-color-text-inverse: #ffffff;
      
      --forgeui-color-surface: #ffffff;
      --forgeui-color-surface-alt: #f9fafb;
      --forgeui-color-surface-hover: #f3f4f6;
      --forgeui-color-surface-active: #e5e7eb;
      
      --forgeui-color-border: #e5e7eb;
      --forgeui-color-border-strong: #d1d5db;
      
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
      --forgeui-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --forgeui-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --forgeui-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      
      /* ─── Transitions ─── */
      --forgeui-transition-fast: 150ms ease;
      --forgeui-transition-normal: 200ms ease;
      --forgeui-transition-slow: 300ms ease;
      
      /* ─── Sizes ─── */
      --forgeui-icon-sm: 1rem;        /* 16px */
      --forgeui-icon-md: 1.25rem;     /* 20px */
      --forgeui-icon-lg: 1.5rem;      /* 24px */
      
      --forgeui-input-height: 2.5rem; /* 40px */
      --forgeui-button-height: 2.5rem;
      --forgeui-touch-target: 2.75rem; /* 44px — Apple HIG minimum */

      /* ─── Chart palette (6–10) ─── */
      --forgeui-color-chart-6: #8b5cf6;
      --forgeui-color-chart-7: #ec4899;
      --forgeui-color-chart-8: #14b8a6;
      --forgeui-color-chart-9: #f97316;
      --forgeui-color-chart-10: #6b7280;
    }

    /* ─── Dark mode ─── */
    :host([color-scheme="dark"]),
    :host(:where([color-scheme="dark"])) {
      --forgeui-color-primary: #60a5fa;
      --forgeui-color-primary-hover: #93bbfd;
      --forgeui-color-primary-active: #3b82f6;
      --forgeui-color-primary-subtle: #1e3a5f;
      
      --forgeui-color-success: #34d399;
      --forgeui-color-success-subtle: #064e3b;
      --forgeui-color-warning: #fbbf24;
      --forgeui-color-warning-subtle: #78350f;
      --forgeui-color-error: #f87171;
      --forgeui-color-error-subtle: #7f1d1d;
      --forgeui-color-info: #818cf8;
      --forgeui-color-info-subtle: #312e81;
      
      --forgeui-color-text: #f9fafb;
      --forgeui-color-text-secondary: #d1d5db;
      --forgeui-color-text-tertiary: #9ca3af;
      --forgeui-color-text-inverse: #111827;
      
      --forgeui-color-surface: #1f2937;
      --forgeui-color-surface-alt: #374151;
      --forgeui-color-surface-hover: #4b5563;
      --forgeui-color-surface-active: #6b7280;
      
      --forgeui-color-border: #374151;
      --forgeui-color-border-strong: #4b5563;

      /* ─── Chart palette (6–10, dark) ─── */
      --forgeui-color-chart-6: #a78bfa;
      --forgeui-color-chart-7: #f472b6;
      --forgeui-color-chart-8: #2dd4bf;
      --forgeui-color-chart-9: #fb923c;
      --forgeui-color-chart-10: #9ca3af;
    }

    /* Auto-detect system preference when no explicit scheme set */
    @media (prefers-color-scheme: dark) {
      :host(:not([color-scheme])) {
        --forgeui-color-primary: #60a5fa;
        --forgeui-color-primary-hover: #93bbfd;
        --forgeui-color-primary-active: #3b82f6;
        --forgeui-color-primary-subtle: #1e3a5f;
        
        --forgeui-color-success: #34d399;
        --forgeui-color-success-subtle: #064e3b;
        --forgeui-color-warning: #fbbf24;
        --forgeui-color-warning-subtle: #78350f;
        --forgeui-color-error: #f87171;
        --forgeui-color-error-subtle: #7f1d1d;
        --forgeui-color-info: #818cf8;
        --forgeui-color-info-subtle: #312e81;
        
        --forgeui-color-text: #f9fafb;
        --forgeui-color-text-secondary: #d1d5db;
        --forgeui-color-text-tertiary: #9ca3af;
        --forgeui-color-text-inverse: #111827;
        
        --forgeui-color-surface: #1f2937;
        --forgeui-color-surface-alt: #374151;
        --forgeui-color-surface-hover: #4b5563;
        --forgeui-color-surface-active: #6b7280;
        
        --forgeui-color-border: #374151;
        --forgeui-color-border-strong: #4b5563;

        /* ─── Chart palette (6–10, dark) ─── */
        --forgeui-color-chart-6: #a78bfa;
        --forgeui-color-chart-7: #f472b6;
        --forgeui-color-chart-8: #2dd4bf;
        --forgeui-color-chart-9: #fb923c;
        --forgeui-color-chart-10: #9ca3af;
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
  }
`,Qe=B`
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
`;var O=class O extends Be{constructor(){super(...arguments);this._instanceId=`forge-${++O._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(e){if(!this.store)return e;this.itemContext&&D(this.itemContext);try{return I(this.store,e)}finally{D(null)}}getProp(e){let r=this.props?.[e];return typeof r=="string"&&(r.startsWith("$state:")||r.startsWith("$computed:")||r.startsWith("$item:")||r.startsWith("$expr:")||r.includes("{{")&&r.includes("}}"))?this.resolve(r):r}getArray(e){let r=this.getProp(e);return Array.isArray(r)?r:r&&typeof r=="object"?Object.values(r):[]}getString(e,r=""){let o=this.getProp(e);return typeof o=="string"?o:String(o??r)}getNumber(e,r=0){let o=this.getProp(e);return typeof o=="number"?o:Number(o)||r}getBool(e,r=!1){let o=this.getProp(e);return typeof o=="boolean"?o:r}dispatchAction(e,r){this.onAction&&this.onAction(e,r),this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:e,payload:r},bubbles:!0,composed:!0}))}handleAction(e){let r=this.getString("action");r&&this.dispatchAction(r,this.props)}prop(e){return this.getProp(e)}static get sharedStyles(){return[q]}gapValue(e){let r={none:"0",0:"0","3xs":"var(--forgeui-space-3xs)","2xs":"var(--forgeui-space-2xs)",xs:"var(--forgeui-space-xs)",sm:"var(--forgeui-space-sm)",md:"var(--forgeui-space-md)",lg:"var(--forgeui-space-lg)",xl:"var(--forgeui-space-xl)","2xl":"var(--forgeui-space-2xl)"};if(e==null||e==="")return"var(--forgeui-space-md)";let o=String(e);return o in r?r[o]:/^\d+(\.\d+)?$/.test(o)?`${o}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(o)?o:"var(--forgeui-space-md)"}static get styles(){return[q]}};O._instanceCounter=0;var g=O;var U=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`
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
  `}render(){let t=this.getString("direction","column"),e=t==="horizontal"||t==="row"?"row":"column",r=this.getString("gap","md"),o=this.getString("padding",""),n=this.getString("align",""),a=this.getString("justify",""),l=this.getBool("wrap"),c=this.gapValue(r),u=o?`var(--forgeui-space-${o}, var(--forgeui-space-md))`:"0";return this.setAttribute("direction",e),n&&this.setAttribute("align",n),a&&this.setAttribute("justify",a),l&&this.setAttribute("wrap",""),this.style.gap=c,this.style.padding=u,s`<slot></slot>`}};customElements.define("forgeui-stack",U);var J=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`
    :host { display: grid; min-width: 0; }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let t=this.getProp("columns"),e;typeof t=="number"?e=String(t):typeof t=="string"&&t?e=t:e="1";let r=/^\d+$/.test(e)?`repeat(${e}, minmax(0, 1fr))`:e,o=this.getString("gap","md"),n=this.gapValue(o),a=this.getString("padding",""),l=a?`var(--forgeui-space-${a}, var(--forgeui-space-md))`:"0";return this.style.gridTemplateColumns=r,this.style.gap=n,this.style.padding=l,/^\d+$/.test(e)&&Number(e)>=2&&this.setAttribute("responsive",""),s`<slot></slot>`}};customElements.define("forgeui-grid",J);var X=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`
    :host { display:block; background:var(--forgeui-color-surface); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-lg); padding:var(--forgeui-space-md); min-width:0; }
    :host([variant="elevated"]) { box-shadow:var(--forgeui-shadow-md); border-color:transparent; }
    :host([variant="compact"]) { padding:var(--forgeui-space-sm); border-radius:var(--forgeui-radius-md); }
    :host([variant="outline"]) { background:transparent; }
    :host([variant="ghost"]) { background:transparent; border-color:transparent; padding:0; }
    .header { margin-bottom:var(--forgeui-space-sm); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); color:var(--forgeui-color-text); line-height:var(--forgeui-leading-tight); }
    .subtitle { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-top:var(--forgeui-space-3xs); }
    .body { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
  `}render(){let t=this.getString("variant",""),e=this.getString("title",""),r=this.getString("subtitle","");return t&&this.setAttribute("variant",t),s`
      ${e||r?s`
        <div class="header">
          ${e?s`<div class="title">${e}</div>`:f}
          ${r?s`<div class="subtitle">${r}</div>`:f}
        </div>
      `:f}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forgeui-card",X);var Z=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let t=this.getString("maxWidth",""),e={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},r=t in e?e[t]:t,o=this.getString("padding","");return r&&r!=="none"?this.style.maxWidth=r:this.style.maxWidth="",this.style.padding=o?`var(--forgeui-space-${o}, var(--forgeui-space-md))`:"",s`<slot></slot>`}};customElements.define("forgeui-container",Z);var Y=class extends g{static get properties(){return{props:{type:Object},_active:{state:!0}}}constructor(){super(),this._active=""}static get styles(){return d`
    :host { display:block; }
    .tabs { display:flex; border-bottom:1px solid var(--forgeui-color-border); gap:var(--forgeui-space-xs); overflow-x:auto; }
    .tab { padding:var(--forgeui-space-sm) var(--forgeui-space-md); cursor:pointer; border:none; background:none;
      color:var(--forgeui-color-text-secondary); font:inherit; font-size:var(--forgeui-text-sm);
      border-bottom:2px solid transparent; transition:var(--forgeui-transition-fast); white-space:nowrap; }
    .tab:hover { color:var(--forgeui-color-text); background:var(--forgeui-color-surface-hover); }
    .tab[active] { color:var(--forgeui-color-primary); border-bottom-color:var(--forgeui-color-primary); font-weight:var(--forgeui-weight-medium); }
    .panel { padding-top:var(--forgeui-space-md); display:flex; flex-direction:column; gap:var(--forgeui-space-md); }
    ::slotted(*) { display:none; }
    ::slotted([data-active]) { display:block; }
    @media (prefers-reduced-motion: reduce) {
      .tab { transition:none; }
    }
  `}_itemKey(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.id??t.key??t.value??t.label??"":t??"")}_itemLabel(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.label??t.title??t.value??"":t??"")}updated(){Array.from(this.children).filter(e=>!(e instanceof HTMLScriptElement)).forEach((e,r)=>{String(r)===this._active||e.id===this._active||e.getAttribute("slot")===this._active?e.setAttribute("data-active",""):e.removeAttribute("data-active")})}_moveTo(t,e){let r=this._itemKey(e[t])||String(t);this._active=r,this.requestUpdate(),this.dispatchAction("tab-change",{active:r}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${t}`)?.focus()})}render(){let t=this.getProp("items")||[],e=Array.isArray(t)?t:[];!this._active&&e.length>0&&(this._active=this._itemKey(e[0])||"0");let r=e.findIndex((n,a)=>(this._itemKey(n)||String(a))===this._active),o=(n,a)=>{let l=-1;n.key==="ArrowRight"?l=(a+1)%e.length:n.key==="ArrowLeft"?l=(a-1+e.length)%e.length:n.key==="Home"?l=0:n.key==="End"&&(l=e.length-1),l!==-1&&(n.preventDefault(),this._moveTo(l,e))};return s`
      <div class="tabs" role="tablist">${e.map((n,a)=>{let l=this._itemKey(n)||String(a),c=this._itemLabel(n)||String(a+1),u=l===this._active;return s`
          <button class="tab" ?active=${u} role="tab" aria-selected=${u}
            id="${this._instanceId}-tab-${a}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${u?0:-1}"
            @click=${()=>{this._active=l,this.requestUpdate(),this.dispatchAction("tab-change",{active:l})}}
            @keydown=${h=>o(h,a)}>${c}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${r>=0?r:0}"><slot></slot></div>
    `}};customElements.define("forgeui-tabs",Y);var G=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`
    :host { display:block; }
    details { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); margin-bottom:var(--forgeui-space-2xs); }
    summary { padding:var(--forgeui-space-sm) var(--forgeui-space-md); cursor:pointer; font-weight:var(--forgeui-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forgeui-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forgeui-space-sm) var(--forgeui-space-md); }
  `}render(){let t=this.getString("title","Section");return s`<details><summary>${t}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forgeui-accordion",G);var Q=class extends g{static get styles(){return d`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forgeui-color-border); margin:var(--forgeui-space-sm) 0; }
  `}render(){return s`<hr>`}};customElements.define("forgeui-divider",Q);var F=class extends g{static get styles(){return d`:host { display:block; }`}render(){let e=`var(--forgeui-space-${this.getString("size","md")}, var(--forgeui-space-md))`;return s`<div style="height:${e}"></div>`}};customElements.define("forgeui-spacer",F);var ee=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`
    :host { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getArray("data"),e=this.getString("emptyMessage",""),r=this.getString("direction","column");(r==="row"||r==="horizontal")&&this.setAttribute("direction","row");let o=this.getString("gap","md");return this.style.gap=this.gapValue(o),t.length===0&&e?s`<div class="empty">${e}</div>`:s`<slot></slot>`}};customElements.define("forgeui-repeater",ee);var te=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`
    :host { display:block; min-width:0; }
    .heading1 { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.02em; margin:0; }
    .heading2 { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); letter-spacing:-0.01em; margin:0; }
    .heading3 { font-size:var(--forgeui-text-xl); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; }
    .heading { font-size:var(--forgeui-text-2xl); font-weight:var(--forgeui-weight-bold); line-height:var(--forgeui-leading-tight); margin:0; }
    .subheading { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); line-height:var(--forgeui-leading-tight); margin:0; }
    .label { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); color:var(--forgeui-color-text); margin:0; }
    .body { font-size:var(--forgeui-text-base); line-height:var(--forgeui-leading-normal); margin:0; }
    .caption { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin:0; }
    .muted { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin:0; }
    .code { font-family:var(--forgeui-font-mono); font-size:var(--forgeui-text-sm); background:var(--forgeui-color-surface-alt);
      padding:var(--forgeui-space-2xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm); display:inline-block; }
    .align-left { text-align:left; }
    .align-center { text-align:center; }
    .align-right { text-align:right; }
  `}render(){let t=this.getString("content",""),e=this.getString("variant","body"),o={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[e]||e,n=this.getString("colorScheme",""),a=this.getString("align",""),l=this.getString("weight",""),c={primary:"var(--forgeui-color-primary)",secondary:"var(--forgeui-color-text-secondary)",tertiary:"var(--forgeui-color-text-tertiary)",success:"var(--forgeui-color-success)",warning:"var(--forgeui-color-warning)",error:"var(--forgeui-color-error)",info:"var(--forgeui-color-info)"},u={normal:"var(--forgeui-weight-normal)",medium:"var(--forgeui-weight-medium)",semibold:"var(--forgeui-weight-semibold)",bold:"var(--forgeui-weight-bold)"},h=[];n&&c[n]&&h.push(`color:${c[n]}`),l&&u[l]&&h.push(`font-weight:${u[l]}`);let p=a?`align-${a}`:"",k=s`${t}<slot></slot>`;return o==="heading1"?s`<h1 class="${o} ${p}" style="${h.join(";")}">${k}</h1>`:o==="heading2"?s`<h2 class="${o} ${p}" style="${h.join(";")}">${k}</h2>`:o==="heading3"?s`<h3 class="${o} ${p}" style="${h.join(";")}">${k}</h3>`:s`<div class="${o} ${p}" style="${h.join(";")}">${t}<slot></slot></div>`}};customElements.define("forgeui-text",te);var re=class extends g{static get styles(){return d`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `}render(){let t=this.getString("src",""),e=this.getString("alt",""),r=this.getString("fit","contain");return t?s`<img src="${t}" alt="${e}" style="object-fit:${r}" loading="lazy">`:s`${f}`}};customElements.define("forgeui-image",re);var oe=class extends g{static get styles(){return d`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `}render(){let t=this.getString("name","circle"),e={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},r=e[t]||e.circle;return s`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${r}"/></svg>`}};customElements.define("forgeui-icon",oe);var ie=class extends g{static get styles(){return d`
    :host { display:inline-flex; align-items:center; }
    .badge { display:inline-flex; align-items:center; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-full); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-medium);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); }
    .badge[variant="success"] { background:var(--forgeui-color-success-subtle); color:var(--forgeui-color-success); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning-subtle); color:var(--forgeui-color-warning); }
    .badge[variant="error"] { background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error); }
  `}render(){let t=this.getString("label",""),e=this.getString("variant","");return s`<span class="badge" variant="${e}">${t}<slot></slot></span>`}};customElements.define("forgeui-badge",ie);var ne=class extends g{static get styles(){return d`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let t=this.getString("src",""),e=this.getString("name","?"),r=e.split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2);return s`<div class="avatar">${t?s`<img src="${t}" alt="${e}">`:r}<slot></slot></div>`}};customElements.define("forgeui-avatar",ne);var se=class extends g{static get styles(){return d`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); }
  `}render(){let t=this.getString("title","Nothing here"),e=this.getString("description","");return s`
      <div class="title">${t}</div>
      ${e?s`<div class="desc">${e}</div>`:f}
      <slot></slot>
    `}};customElements.define("forgeui-empty-state",se);var ae=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); }
    input, textarea { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-base);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); height:var(--forgeui-input-height);
      transition:border-color var(--forgeui-transition-fast); }
    input:focus, textarea:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    input::placeholder { color:var(--forgeui-color-text-tertiary); }
    textarea { height:auto; min-height:5rem; resize:vertical; }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
    .error { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-error); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),r=this.getString("hint",""),o=this.getString("error",""),n=this.getString("inputType","text"),a=this.getBool("multiline"),l=this.getString("value",""),c=this._instanceId;return s`
      ${t?s`<label for="${c}">${t}</label>`:f}
      ${a?s`<textarea id="${c}" placeholder="${e}" .value=${l} @input=${u=>this.dispatchAction("change",{value:u.target.value})}></textarea>`:s`<input id="${c}" type="${n}" placeholder="${e}" .value=${l} @input=${u=>this.dispatchAction("change",{value:u.target.value})}>`}
      ${r&&!o?s`<div class="hint">${r}</div>`:f}
      ${o?s`<div class="error">${o}</div>`:f}
    `}};customElements.define("forgeui-text-input",ae);var le=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("min"),r=this.getProp("max"),o=this.getProp("step"),n=this.getProp("value"),a=this._instanceId;return s`
      ${t?s`<label for="${a}">${t}</label>`:f}
      <input id="${a}" type="number" min=${e} max=${r} step=${o} .value=${n??""}
        @input=${l=>this.dispatchAction("change",{value:Number(l.target.value)})}>
    `}};customElements.define("forgeui-number-input",le);var ce=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    select { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("options")||[],r=this.getString("value",""),o=this._instanceId;return s`
      ${t?s`<label for="${o}">${t}</label>`:f}
      <select id="${o}" .value=${r} @change=${n=>this.dispatchAction("change",{value:n.target.value})}>
        ${e.map(n=>s`<option value=${typeof n=="string"?n:n.value} ?selected=${(typeof n=="string"?n:n.value)===r}>
          ${typeof n=="string"?n:n.label||n.value}
        </option>`)}
      </select>
    `}};customElements.define("forgeui-select",ce);var ue=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-xs); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-height:var(--forgeui-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-full);
      font-size:var(--forgeui-text-xs); }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; }
  `}render(){let t=this.getString("label",""),e=this.getProp("selected")||[];return s`
      ${t?s`<label>${t}</label>`:f}
      <div class="tags">
        ${e.map(r=>s`<span class="tag">${String(r)}<button @click=${()=>this.dispatchAction("remove",{value:r})}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forgeui-multi-select",ue);var ge=class extends g{static get styles(){return d`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); margin-bottom:var(--forgeui-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); cursor:pointer; }
    label { font-size:var(--forgeui-text-sm); cursor:pointer; }
  `}render(){let t=this.getString("label",""),e=this.getBool("checked"),r=this._instanceId;return s`
      <input id="${r}" type="checkbox" ?checked=${e} @change=${o=>this.dispatchAction("change",{checked:o.target.checked})}>
      ${t?s`<label for="${r}">${t}</label>`:f}
    `}};customElements.define("forgeui-checkbox",ge);var fe=class extends g{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let e=this.getBool("on");this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{actionId:"change",value:!e},bubbles:!0,composed:!0}))};this._onKeydown=e=>{(e.key==="Enter"||e.key===" "||e.key==="Spacebar")&&(e.preventDefault(),this._toggle())}}static get styles(){return d`
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
  `}render(){let e=this.getBool("on"),r=this.getString("label",""),o=this.getBool("disabled"),n=this._instanceId;return s`
      <label for="${n}" class="toggle-label">
        <button
          id="${n}"
          class="switch"
          role="switch"
          type="button"
          aria-checked="${e?"true":"false"}"
          ?disabled=${o}
          @click="${this._toggle}"
          @keydown="${this._onKeydown}"
        ></button>
        ${r?s`<span class="toggle-text">${r}</span>`:f}
      </label>
    `}};customElements.define("forgeui-toggle",fe);var de=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getString("value","");return s`
      ${t?s`<label>${t}</label>`:f}
      <input type="date" .value=${e} @change=${r=>this.dispatchAction("change",{value:r.target.value})}>
    `}};customElements.define("forgeui-date-picker",de);var pe=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    input[type=range] { width:100%; accent-color:var(--forgeui-color-primary); }
    .value { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
  `}render(){let t=this.getString("label",""),e=this.getNumber("min",0),r=this.getNumber("max",100),o=this.getNumber("step",1),n=this.getNumber("value",e);return s`
      ${t?s`<label>${t}</label>`:f}
      <input type="range" min=${e} max=${r} step=${o} .value=${n}
        @input=${a=>this.dispatchAction("change",{value:Number(a.target.value)})}>
      <div class="value">${n}</div>
    `}};customElements.define("forgeui-slider",pe);var he=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .dropzone { border:2px dashed var(--forgeui-color-border-strong); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forgeui-transition-fast); }
    .dropzone:hover { border-color:var(--forgeui-color-primary); }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getString("label","Upload file"),e=this.getString("accept","*");return s`
      ${t?s`<label>${t}</label>`:f}
      <div class="dropzone" @click=${()=>this.shadowRoot?.querySelector("input")?.click()}>
        <p>Click or drop file here</p>
        <input type="file" accept="${e}" hidden @change=${r=>{let o=r.target.files?.[0];o&&this.dispatchAction("change",{name:o.name,size:o.size,type:o.type})}}>
      </div>
    `}};customElements.define("forgeui-file-upload",he);var me=class extends g{static get styles(){return d`
    :host { display:inline-flex; }
    button { display:inline-flex; align-items:center; justify-content:center; gap:var(--forgeui-space-xs);
      padding:0 var(--forgeui-space-md); height:var(--forgeui-button-height); border:1px solid transparent;
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium);
      cursor:pointer; transition:all var(--forgeui-transition-fast); white-space:nowrap; }
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
  `}render(){let t=this.getString("label","Button"),e=this.getString("variant","primary"),r=this.getString("size",""),o=this.getBool("disabled"),n=this.getProp("pressed");return s`<button class="${e} ${r}" ?disabled=${o}
      aria-pressed=${n==null?f:String(!!n)}
      @click=${a=>this.handleAction(a)}>${t}<slot></slot></button>`}};customElements.define("forgeui-button",me);var ve=class extends g{static get styles(){return d`
    :host { display:flex; gap:var(--forgeui-space-xs); }
  `}render(){return s`<slot></slot>`}};customElements.define("forgeui-button-group",ve);var be=class extends g{static get styles(){return d`
    :host { display:inline-flex; }
    a { color:var(--forgeui-color-primary); text-decoration:none; font-size:var(--forgeui-text-sm); cursor:pointer; }
    a:hover { text-decoration:underline; }
  `}render(){let t=this.getString("label",""),e=this.getString("href","#");return s`<a href="${e}">${t}<slot></slot></a>`}};customElements.define("forgeui-link",be);var ye=class extends g{static get styles(){return d`
    :host { display:block; overflow-x:auto; min-width:0; width:100%; }
    table { width:100%; border-collapse:collapse; font-size:var(--forgeui-text-sm); }
    th { text-align:left; padding:var(--forgeui-space-sm); font-weight:var(--forgeui-weight-semibold);
      color:var(--forgeui-color-text-secondary); border-bottom:2px solid var(--forgeui-color-border); white-space:nowrap;
      text-transform:uppercase; letter-spacing:0.03em; font-size:var(--forgeui-text-xs); }
    td { padding:var(--forgeui-space-sm); border-bottom:1px solid var(--forgeui-color-border); vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    tbody tr:hover td { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-xl); text-align:center; color:var(--forgeui-color-text-tertiary); }
    .badge { display:inline-flex; align-items:center; padding:var(--forgeui-space-3xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-full); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-medium);
      background:var(--forgeui-color-surface-alt); color:var(--forgeui-color-text-secondary); }
    .badge.success { background:var(--forgeui-color-success-subtle); color:var(--forgeui-color-success); }
    .badge.warning { background:var(--forgeui-color-warning-subtle); color:var(--forgeui-color-warning); }
    .badge.error { background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error); }
    .badge.info, .badge.primary { background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); }
    .badge.neutral { background:var(--forgeui-color-surface-alt); color:var(--forgeui-color-text-secondary); }
    .align-right { text-align:right; }
    .align-center { text-align:center; }
    .col-right th, .col-right td { text-align:right; }
    .col-center th, .col-center td { text-align:center; }
    caption { text-align:start; font-size:var(--forgeui-text-sm); caption-side:top; padding-bottom:var(--forgeui-space-sm); color:var(--forgeui-color-text-secondary); }
    .row-action { cursor:pointer; }
    .row-action:hover td { background:var(--forgeui-color-surface-hover); }
    .row-action:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:-2px; }
  `}_statusClass(t){let e=String(t??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(e)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(e)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(e)?"neutral":["high","urgent","critical"].includes(e)?"error":["medium","med"].includes(e)?"warning":["low"].includes(e)?"info":["failed","error","rejected","blocked","overdue"].includes(e)?"error":"neutral"}_renderCell(t,e){let r=typeof t=="string"?t:t.key,o=e[r],n=t&&typeof t=="object"?t.type:void 0;if(o==null||o==="")return s`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;if(n==="badge"||n==="status"){let a=(t.variant&&typeof t.variant=="object"?t.variant[String(o).toLowerCase()]:null)||this._statusClass(o);return s`<span class="badge ${a}">${String(o)}</span>`}if(n==="number")return typeof o=="number"?o.toLocaleString():String(o);if(n==="date"){let a=typeof o=="string"||typeof o=="number"?new Date(o):o;return a instanceof Date&&!isNaN(a.getTime())?a.toLocaleDateString():String(o)}if(n==="currency"){let a=Number(o);return isNaN(a)?String(o):a.toLocaleString(void 0,{style:"currency",currency:t.currency||"USD"})}return n==="boolean"?o?"\u2713":"\u2717":String(o)}render(){let t=this.getProp("data")||[],e=this.getProp("columns")||[],r=this.getString("emptyMessage","No data yet"),o=this.getString("rowAction",""),n=this.getString("caption",""),a=e.length>0?e:t.length>0?Object.keys(t[0]):[];return a.length===0?s`<div class="empty">${r}</div>`:s`
      <table>
        ${n?s`<caption>${n}</caption>`:f}
        <thead><tr>${a.map(l=>{let c=typeof l=="string"?l:l.label||l.key,u=typeof l=="object"?l.align:void 0,h=typeof l=="object"?l.width:void 0;return s`<th class="${u==="right"?"align-right":u==="center"?"align-center":""}" style="${h?`width:${h}`:""}">${c}</th>`})}</tr></thead>
        <tbody>${t.length===0?s`<tr><td colspan=${a.length} class="empty">${r}</td></tr>`:t.map((l,c)=>{let u=!!o,h=u?String(l[typeof a[0]=="string"?a[0]:a[0]?.key]??`Row ${c+1}`):"";return s`<tr class="${u?"row-action":""}"
                tabindex=${u?0:f}
                role=${u?"button":f}
                aria-label=${u?h:f}
                @click=${u?()=>this.dispatchAction(o,{row:l,index:c}):void 0}
                @keydown=${u?p=>{(p.key==="Enter"||p.key===" ")&&(p.preventDefault(),this.dispatchAction(o,{row:l,index:c}))}:void 0}>
              ${a.map(p=>{let k=typeof p=="object"?p.align:void 0;return s`<td class="${k==="right"?"align-right":k==="center"?"align-center":""}">${this._renderCell(p,l)}</td>`})}</tr>`})}</tbody>
      </table>
    `}};customElements.define("forgeui-table",ye);var xe=class extends g{static get styles(){return d`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getProp("data")||[],e=this.getString("emptyMessage","No items");return t.length===0?s`<div class="empty">${e}</div>`:s`<div class="list">${t.map((r,o)=>s`
      <div class="item" data-index=${o}><slot name="item" .item=${r} .index=${o}>${JSON.stringify(r)}</slot></div>
    `)}</div>`}};customElements.define("forgeui-list",xe);var $e=class extends g{constructor(){super(...arguments);this._palette=["var(--forgeui-color-primary)","var(--forgeui-color-success)","var(--forgeui-color-warning)","var(--forgeui-color-error)","var(--forgeui-color-info)","var(--forgeui-color-chart-6)","var(--forgeui-color-chart-7)","var(--forgeui-color-chart-8)","var(--forgeui-color-chart-9)","var(--forgeui-color-chart-10)"]}static get styles(){return d`
    :host { display:block; min-width:0; }
    .title { font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); margin-bottom:var(--forgeui-space-xs); color:var(--forgeui-color-text); }
    .wrap { width:100%; }
    svg { width:100%; height:auto; display:block; font-family:var(--forgeui-font-family); }
    .grid { stroke:var(--forgeui-color-border); stroke-width:1; opacity:0.5; }
    .axis { stroke:var(--forgeui-color-border-strong); stroke-width:1; }
    .tick-label { fill:var(--forgeui-color-text-tertiary); font-size:10px; }
    .bar { fill:var(--forgeui-color-primary); transition:opacity 0.15s; }
    .bar:hover { opacity:0.85; }
    .line { fill:none; stroke:var(--forgeui-color-primary); stroke-width:2; }
    .point { fill:var(--forgeui-color-primary); }
    .area { fill:var(--forgeui-color-primary); opacity:0.15; }
    .slice { stroke:var(--forgeui-color-surface); stroke-width:2; }
    .legend { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-sm); margin-top:var(--forgeui-space-xs); font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
    .legend-item { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); }
    .swatch { display:inline-block; width:0.75rem; height:0.75rem; border-radius:2px; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; }
    }
  `}_niceMax(e){if(e<=0)return 1;let r=Math.pow(10,Math.floor(Math.log10(e))),o=e/r;return(o<=1?1:o<=2?2:o<=5?5:10)*r}render(){let e=this.getString("chartType","bar"),r=this.getProp("data")||[],o=this.getString("title",""),n=this.getString("xKey","label")||this.getString("labelKey","label"),a=this.getString("yKey","value")||this.getString("valueKey","value"),l=this.getString("color","");if(!r||r.length===0)return s`
        ${o?s`<div class="title">${o}</div>`:f}
        <div class="empty">No data to display</div>
      `;let c=r.map(m=>typeof m=="number"?{label:"",value:m}:m&&typeof m=="object"?{label:String(m[n]??m.label??m.name??m.x??""),value:Number(m[a]??m.value??m.y??0)||0,color:m.color}:{label:String(m),value:0}),u=600,h=260,p={top:8,right:16,bottom:36,left:48},k=u-p.left-p.right,C=h-p.top-p.bottom,P,Ae=f;if(e==="pie"||e==="donut"){let m=c.reduce((x,b)=>x+Math.max(0,b.value),0)||1,j=u/2,E=h/2,S=Math.min(k,C)/2-8,z=e==="donut"?S*.55:0,v=-Math.PI/2,y=[],_=[];c.forEach((x,b)=>{let A=Math.max(0,x.value)/m,$=v,w=v+A*Math.PI*2;v=w;let L=w-$>Math.PI?1:0,T=j+S*Math.cos($),Re=E+S*Math.sin($),Ie=j+S*Math.cos(w),Le=E+S*Math.sin(w),W=x.color||this._palette[b%this._palette.length];if(_.push(W),z>0){let Ne=j+z*Math.cos($),Pe=E+z*Math.sin($),Te=j+z*Math.cos(w),Oe=E+z*Math.sin(w);y.push(`<path class="slice" fill="${W}" d="M ${T} ${Re} A ${S} ${S} 0 ${L} 1 ${Ie} ${Le} L ${Te} ${Oe} A ${z} ${z} 0 ${L} 0 ${Ne} ${Pe} Z"/>`)}else y.push(`<path class="slice" fill="${W}" d="M ${j} ${E} L ${T} ${Re} A ${S} ${S} 0 ${L} 1 ${Ie} ${Le} Z"/>`)}),P=s`<g .innerHTML=${y.join("")}></g>`,Ae=s`<div class="legend">${c.map((x,b)=>s`
        <span class="legend-item"><span class="swatch" style="background:${_[b]}"></span>${x.label} (${x.value})</span>
      `)}</div>`}else{let m=Math.max(...c.map(v=>v.value),0),j=this._niceMax(m),E=v=>p.top+C-v/j*C,S=4,z=[];for(let v=0;v<=S;v++){let y=j*v/S,_=E(y);z.push(`<line class="grid" x1="${p.left}" x2="${p.left+k}" y1="${_}" y2="${_}"/>`),z.push(`<text class="tick-label" x="${p.left-6}" y="${_+3}" text-anchor="end">${y.toLocaleString()}</text>`)}if(e==="line"||e==="area"){let v=k/Math.max(1,c.length-1),y=c.map((b,A)=>{let $=p.left+A*v,w=E(b.value);return`${A===0?"M":"L"} ${$} ${w}`}).join(" "),_=e==="area"?y+` L ${p.left+k} ${p.top+C} L ${p.left} ${p.top+C} Z`:"",x=l||"var(--forgeui-color-primary)";P=s`
          <g .innerHTML=${z.join("")}></g>
          ${e==="area"?s`<path class="area" d="${_}" style="fill:${x};opacity:0.15"/>`:f}
          <path class="line" d="${y}" style="stroke:${x}"/>
          ${c.map((b,A)=>{let $=p.left+A*v,w=E(b.value);return M`<circle class="point" cx="${$}" cy="${w}" r="3" style="fill:${x}"/>
              <text class="tick-label" x="${$}" y="${p.top+C+14}" text-anchor="middle">${b.label}</text>`})}
        `}else{let v=c.length,y=k/v,_=Math.max(2,y*.7),x=y-_;P=s`
          <g .innerHTML=${z.join("")}></g>
          ${c.map((b,A)=>{let $=p.left+A*y+x/2,w=E(b.value),L=Math.max(0,p.top+C-w),T=b.color||l||"var(--forgeui-color-primary)";return M`<rect class="bar" x="${$}" y="${w}" width="${_}" height="${L}" rx="2" style="fill:${T}">
                <title>${b.label}: ${b.value}</title>
              </rect>
              <text class="tick-label" x="${$+_/2}" y="${p.top+C+14}" text-anchor="middle">${b.label}</text>`})}
        `}}return s`
      ${o?s`<div class="title">${o}</div>`:f}
      <div class="wrap">
        <svg viewBox="0 0 ${u} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${o||e+" chart"}">
          ${P}
        </svg>
        ${Ae}
      </div>
    `}};customElements.define("forgeui-chart",$e);var we=class extends g{static get styles(){return d`
    :host { display:flex; flex-direction:column; padding:var(--forgeui-space-md); background:var(--forgeui-color-surface);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-lg); min-width:0; gap:var(--forgeui-space-2xs); }
    :host([variant="plain"]) { background:transparent; border:none; padding:0; }
    .label { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); }
    .value-row { display:flex; align-items:baseline; gap:var(--forgeui-space-2xs); flex-wrap:wrap; }
    .value { font-size:var(--forgeui-text-3xl); font-weight:var(--forgeui-weight-bold); color:var(--forgeui-color-text); line-height:1.1; letter-spacing:-0.02em; }
    .unit, .suffix { font-size:var(--forgeui-text-base); color:var(--forgeui-color-text-secondary); font-weight:var(--forgeui-weight-medium); }
    .trend { display:inline-flex; align-items:center; gap:var(--forgeui-space-3xs); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium);
      padding:var(--forgeui-space-3xs) var(--forgeui-space-xs); border-radius:var(--forgeui-radius-sm); }
    .trend.up { color:var(--forgeui-color-success); background:var(--forgeui-color-success-subtle); }
    .trend.down { color:var(--forgeui-color-error); background:var(--forgeui-color-error-subtle); }
    .trend.neutral { color:var(--forgeui-color-text-secondary); background:var(--forgeui-color-surface-alt); }
    .subtitle { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); }
    .goal { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); }
  `}_trendMeta(t){if(t==null||t==="")return null;if(typeof t=="number")return t>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(t)}%`}:t<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(t)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof t=="string"){let e=t.toLowerCase(),r=t.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(r){let o=parseFloat(r[1]),n=r[2];return o>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(o)}${n}`}:o<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(o)}${n}`}:{dir:"neutral",arrow:"\u2192",display:`0${n}`}}return e==="up"||e==="positive"||e==="increase"?{dir:"up",arrow:"\u2191",display:""}:e==="down"||e==="negative"||e==="decrease"?{dir:"down",arrow:"\u2193",display:""}:e==="flat"||e==="neutral"||e==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:t}}return null}render(){let t=this.getString("label",""),e=this.getProp("value"),r=this.getProp("trend"),o=this.getString("trendLabel",""),n=this.getProp("goal"),a=this.getString("unit",""),l=this.getString("suffix",""),c=this.getString("subtitle",""),u=this.getString("variant","");u&&this.setAttribute("variant",u);let h=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),p=this._trendMeta(r);return s`
      ${t?s`<div class="label">${t}</div>`:f}
      <div class="value-row">
        <span class="value">${h}</span>
        ${a?s`<span class="unit">${a}</span>`:f}
        ${l?s`<span class="suffix">${l}</span>`:f}
        ${p?s`<span class="trend ${p.dir}">${p.arrow}${p.display?s` ${p.display}`:f}${o?s` ${o}`:f}</span>`:f}
      </div>
      ${c?s`<div class="subtitle">${c}</div>`:f}
      ${n!=null&&n!==""?s`<div class="goal">Goal: ${typeof n=="number"?n.toLocaleString():n}</div>`:f}
    `}};customElements.define("forgeui-metric",we);var ke=class extends g{static get styles(){return d`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    .alert { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      border-left:4px solid; font-size:var(--forgeui-text-sm); }
    .info { background:var(--forgeui-color-info-subtle); border-color:var(--forgeui-color-info); color:var(--forgeui-color-info); }
    .success { background:var(--forgeui-color-success-subtle); border-color:var(--forgeui-color-success); color:var(--forgeui-color-success); }
    .warning { background:var(--forgeui-color-warning-subtle); border-color:var(--forgeui-color-warning); color:var(--forgeui-color-warning); }
    .error { background:var(--forgeui-color-error-subtle); border-color:var(--forgeui-color-error); color:var(--forgeui-color-error); }
  `}render(){let t=this.getString("variant","info"),e=this.getString("title",""),r=this.getString("message","");return s`<div class="alert ${t}" role=${t==="error"||t==="warning"?"alert":"status"}>
      ${e?s`<strong>${e}</strong> `:f}${r}<slot></slot>
    </div>`}};customElements.define("forgeui-alert",ke);var Se=class extends g{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=e=>this._onKeydown(e);this._close=()=>{this.dispatchAction("close")}}static get styles(){return d`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-lg);
      padding:var(--forgeui-space-lg); min-width:20rem; max-width:90vw; max-height:90vh; overflow:auto;
      box-shadow:var(--forgeui-shadow-lg); z-index:1; }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forgeui-space-xs); margin-top:var(--forgeui-space-lg); }
  `}render(){let e=this.getString("title",""),r=this.getBool("open"),o=`${this._instanceId}-title`;return r?this.setAttribute("open",""):this.removeAttribute("open"),r?s`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${e?o:f}"
        tabindex="-1"
        @click=${n=>n.stopPropagation()}
      >
        ${e?s`<h2 id="${o}" class="title">${e}</h2>`:f}
        <slot></slot>
      </div>
    `:f}updated(e){if(super.updated?.(e),e.has("props")){let r=this.getBool("open"),n=e.get("props")?.open??!1;r&&!n?this._onOpen():!r&&n&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let e=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??e)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(e){if(e.key==="Escape"){e.preventDefault(),this._close();return}e.key==="Tab"&&this._trapFocus(e)}_trapFocus(e){let r=this._allFocusableInDialog();if(r.length===0){e.preventDefault();return}let o=r[0],n=r[r.length-1],a=this.shadowRoot?.activeElement??document.activeElement;e.shiftKey?(a===o||!this._dialogContains(a))&&(e.preventDefault(),n.focus()):(a===n||!this._dialogContains(a))&&(e.preventDefault(),o.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let e=this.shadowRoot?.querySelector(".dialog");if(!e)return[];let r='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',o=Array.from(e.querySelectorAll(r)),n=e.querySelector("slot"),a=n instanceof HTMLSlotElement?n.assignedElements({flatten:!0}).flatMap(l=>[l,...Array.from(l.querySelectorAll(r))].filter(u=>u instanceof HTMLElement&&u.matches(r))):[];return[...o,...a].filter(l=>!l.disabled)}_dialogContains(e){return e?this.shadowRoot?.querySelector(".dialog")?.contains(e)??!1:!1}};customElements.define("forgeui-dialog",Se);var ze=class extends g{static get styles(){return d`
    :host { display:block; }
    .progress { height:0.5rem; background:var(--forgeui-color-surface-alt); border-radius:var(--forgeui-radius-full); overflow:hidden; }
    .bar { height:100%; background:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-full); transition:width var(--forgeui-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .label { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); margin-top:var(--forgeui-space-2xs); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; animation:none; }
    }
  `}render(){let t=this.getProp("value"),e=this.getNumber("max",100),r=t==null,o=r?0:Math.max(0,Math.min(Number(t),e)),n=r?0:o/e*100;return s`
      <div
        class="progress ${r?"indeterminate":""}"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="${e}"
        aria-valuenow="${r?f:o}"
        aria-valuetext="${r?"Loading":`${Math.round(n)}%`}"
      >
        <div class="bar" style=${r?"":`width:${n}%`}></div>
      </div>
    `}};customElements.define("forgeui-progress",ze);var _e=class extends g{static get styles(){return d`
    :host { display:block; position:fixed; bottom:var(--forgeui-space-lg); right:var(--forgeui-space-lg); z-index:60; }
    .toast { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-text); color:var(--forgeui-color-text-inverse); font-size:var(--forgeui-text-sm);
      box-shadow:var(--forgeui-shadow-lg); max-width:20rem; }
  `}render(){let t=this.getString("message","");return t?s`<div class="toast">${t}</div>`:s`${f}`}};customElements.define("forgeui-toast",_e);var Ee=class extends g{static get styles(){return d`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); }
    .sep { color:var(--forgeui-color-text-tertiary); }
    a { color:var(--forgeui-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-medium); }
  `}render(){let t=this.getProp("items")||[];return s`${t.map((e,r)=>{let o=r===t.length-1,n=typeof e=="string"?e:e.label,a=typeof e=="string"?"#":e.href;return s`
        ${r>0?s`<span class="sep">/</span>`:f}
        ${o?s`<span class="current">${n}</span>`:s`<a href="${a}">${n}</a>`}
      `})}`}};customElements.define("forgeui-breadcrumb",Ee);var Me=class extends g{static get styles(){return d`
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
  `}render(){let t=this.getProp("steps")||[],e=this.getNumber("active",0);return s`${t.map((r,o)=>{let n=typeof r=="string"?r:r.label||r.title||`Step ${o+1}`,a=o===e,l=o<e;return s`<div class="step" ?active=${a} ?completed=${l}>
        <div class="circle">${l?"\u2713":o+1}</div>
        <div class="label">${n}</div>
      </div>`})}`}};customElements.define("forgeui-stepper",Me);var Ce=class extends g{static get styles(){return d`
    :host { display:block; }
    .error { padding:var(--forgeui-space-sm); background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error);
      border:1px solid var(--forgeui-color-error); border-radius:var(--forgeui-radius-md); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getString("msg","Unknown error");return s`<div class="error" role="alert">⚠ ${t}</div>`}};customElements.define("forgeui-error",Ce);var je=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return d`
    :host { display:block; }
    svg { display:block; }
  `}render(){let t=this.getNumber("width",400),e=this.getNumber("height",300),r=this.getString("background","transparent"),o=this.getProp("shapes")||[];return M`
      <svg width="${t}" height="${e}" style="background:${r}" viewBox="0 0 ${t} ${e}">
        ${o.map(n=>this.renderShape(n))}
      </svg>
    `}renderShape(t){let e={fill:t.fill??void 0,stroke:t.stroke??void 0,"stroke-width":t.strokeWidth??void 0,opacity:t.opacity??void 0},r=t.action?()=>{this.onAction&&this.onAction(t.action)}:void 0,o=t.action?"cursor:pointer":void 0;switch(t.type){case"rect":return M`<rect
          x="${t.x??0}" y="${t.y??0}"
          width="${t.width??0}" height="${t.height??0}"
          rx="${t.rx??0}" ry="${t.ry??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"circle":return M`<circle
          cx="${t.cx??0}" cy="${t.cy??0}" r="${t.r??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"ellipse":return M`<ellipse
          cx="${t.cx??t.x??0}" cy="${t.cy??t.y??0}"
          rx="${t.rx??(t.width?t.width/2:0)}" ry="${t.ry??(t.height?t.height/2:0)}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"line":return M`<line
          x1="${t.x1??0}" y1="${t.y1??0}"
          x2="${t.x2??0}" y2="${t.y2??0}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;case"text":return M`<text
          x="${t.x??0}" y="${t.y??0}"
          fill="${e.fill??"currentColor"}"
          font-size="${t.fontSize??14}"
          font-weight="${t.fontWeight??"normal"}"
          font-family="${t.fontFamily??"sans-serif"}"
          text-anchor="${t.textAnchor??"start"}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        >${t.content??""}</text>`;case"path":return M`<path
          d="${t.d??""}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${o}"
          @click=${r}
        />`;default:return M``}}};customElements.define("forgeui-drawing",je);export{G as ForgeAccordion,ke as ForgeAlert,ne as ForgeAvatar,ie as ForgeBadge,Ee as ForgeBreadcrumb,me as ForgeButton,ve as ForgeButtonGroup,X as ForgeCard,$e as ForgeChart,ge as ForgeCheckbox,Z as ForgeContainer,de as ForgeDatePicker,Se as ForgeDialog,Q as ForgeDivider,je as ForgeDrawing,se as ForgeEmptyState,Ce as ForgeError,he as ForgeFileUpload,J as ForgeGrid,oe as ForgeIcon,re as ForgeImage,be as ForgeLink,xe as ForgeList,we as ForgeMetric,ue as ForgeMultiSelect,le as ForgeNumberInput,ze as ForgeProgress,ee as ForgeRepeater,ce as ForgeSelect,pe as ForgeSlider,F as ForgeSpacer,U as ForgeStack,Me as ForgeStepper,ye as ForgeTable,Y as ForgeTabs,te as ForgeText,ae as ForgeTextInput,_e as ForgeToast,fe as ForgeToggle};
