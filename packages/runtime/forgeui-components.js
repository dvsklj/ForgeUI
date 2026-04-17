import{html as a,css as u,svg as M,nothing as d}from"lit";import{LitElement as Be}from"lit";import{createStore as Ue}from"tinybase";var We=new Set(["__proto__","prototype","constructor"]);function H(n){if(n.length===0||n.length>256)return!1;for(let t of n.normalize("NFC").split("."))if(We.has(t))return!1;return!0}function K(n,t){if(t.includes("/")){let e=t.split("/");if(e.length===3){let[r,o,s]=e;return n.getCell(r,o,s)}if(e.length===2){let[r,o]=e,s=n.getValue(t);if(s!==void 0)return s;let i=n.getCellIds(r,o);if(i.length>0){let l={};for(let c of i)l[c]=n.getCell(r,o,c);return l}}}return n.getValue(t)}function He(n,t){if(t.startsWith("count:")){let e=t.slice(6);return n.getRowCount(e)}if(t.startsWith("sum:")){let[e,r]=t.split(":"),[o,s]=r.split("/"),i=0,l=n.getRowIds(o);for(let c of l){let g=n.getCell(o,c,s);typeof g=="number"&&(i+=g)}return i}if(t.startsWith("avg:")){let[e,r]=t.split(":"),[o,s]=r.split("/"),i=0,l=0,c=n.getRowIds(o);for(let g of c){let h=n.getCell(o,g,s);typeof h=="number"&&(i+=h,l++)}return l>0?i/l:0}return K(n,t)}var N=null;function D(n){N=n}function V(n,t){let e=t.trim();if(e!==""){if(e.startsWith('"')&&e.endsWith('"')||e.startsWith("'")&&e.endsWith("'"))return e.slice(1,-1);if(!(e.startsWith('"')&&!e.endsWith('"')||e.startsWith("'")&&!e.endsWith("'"))){if(e==="true")return!0;if(e==="false")return!1;if(e==="null")return null;if(/^-?\d+(\.\d+)?$/.test(e))return Number(e);if(e.includes("|")){let[r,...o]=e.split("|").map(l=>l.trim()),i=V(n,r);for(let l of o){let[c,...g]=l.split(/\s+/);i=Ke(i,c,g)}return i}if(e.startsWith("item.")||e==="item"){if(e==="item")return N;let r=e.slice(5);return R(N,r)}if(e.startsWith("state.")||e==="state"){if(e==="state")return;let r=e.slice(6);return De(n,r)}return K(n,e)}}}function Ke(n,t,e){switch(t){case"values":return Array.isArray(n)?n:n&&typeof n=="object"?Object.values(n):[];case"keys":return n&&typeof n=="object"?Object.keys(n):[];case"count":case"length":return Array.isArray(n)?n.length:n&&typeof n=="object"?Object.keys(n).length:typeof n=="string"?n.length:0;case"sum":return Array.isArray(n)?n.reduce((r,o)=>r+(typeof o=="number"?o:0),0):0;case"first":return Array.isArray(n)?n[0]:void 0;case"last":return Array.isArray(n)?n[n.length-1]:void 0;default:return n}}function R(n,t){if(!n||typeof n!="object"||!t||!H(t))return;let e=t.split(".");if(e.length>32)return;let r=n;for(let o of e){if(r==null)return;r=r[o]}return r}function De(n,t){let e=n.getValue(t);if(e!==void 0)return e;let r=t.split(".");if(r.length>=3){let[s,i,l,...c]=r;if(n.hasTable(s)&&n.hasRow(s,i)){let g=n.getCell(s,i,l);if(c.length===0)return g;if(typeof g=="string")try{let h=JSON.parse(g);return R(h,c.join("."))}catch{}return}}if(r.length>=2){let[s,i,...l]=r;if(n.hasTable(s)&&n.hasRow(s,i)){let c=n.getRow(s,i);return l.length===0?c:R(c,l.join("."))}}if(r.length>=1){let[s,...i]=r;if(n.hasTable(s)){let l=n.getRowIds(s),c={};for(let g of l)c[g]=n.getRow(s,g);return i.length===0?c:R(c,i.join("."))}}let o=n.getValue(r[0]);if(typeof o=="string"&&r.length>1)try{let s=JSON.parse(o);return R(s,r.slice(1).join("."))}catch{}}function I(n,t){if(typeof t!="string"){if(t!==null&&typeof t=="object"){let e=t;if("$expr"in e)return I(n,`$expr:${e.$expr}`);if("$state"in e)return I(n,`$state:${e.$state}`);if("$computed"in e)return I(n,`$computed:${e.$computed}`);if("$item"in e)return I(n,`$item:${e.$item}`)}return t}if(t.startsWith("$state:")){let e=t.slice(7);return H(e)?K(n,e):void 0}if(t.startsWith("$computed:")){let e=t.slice(10);return e.length>1024?void 0:He(n,e)}if(t.startsWith("$item:")){let e=t.slice(6);return H(e)?e.includes(".")?R(N,e):N?.[e]:void 0}if(t.startsWith("$expr:")){let e=t.slice(6);return e.length>1024?void 0:V(n,e)}return t.length>4096?t:t.includes("{{")&&t.includes("}}")?Ve(t,n):t}function Ve(n,t){let e="",r=0;for(;r<n.length;)if(n[r]==="{"&&n[r+1]==="{"){let o=r+2,s=1,i=o;for(;i<n.length-1&&s>0;){let l=n[i],c=n[i+1];l==="{"&&c==="{"?(s++,i+=2):l==="}"&&c==="}"?(s--,i+=2):i++}if(s)e+=n[r++];else{let l=n.slice(o,i-2);if(l.length<=256){let c=V(t,l.trim());e+=c==null?"":String(c)}else e+=n.slice(r,i);r=i}}else e+=n[r++];return e}import{css as B}from"lit";var Ge=B`
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

      /* ─── Chart palette (6–10) ─── */
      --forge-color-chart-6: #8b5cf6;
      --forge-color-chart-7: #ec4899;
      --forge-color-chart-8: #14b8a6;
      --forge-color-chart-9: #f97316;
      --forge-color-chart-10: #6b7280;
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

      /* ─── Chart palette (6–10, dark) ─── */
      --forge-color-chart-6: #a78bfa;
      --forge-color-chart-7: #f472b6;
      --forge-color-chart-8: #2dd4bf;
      --forge-color-chart-9: #fb923c;
      --forge-color-chart-10: #9ca3af;
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

        /* ─── Chart palette (6–10, dark) ─── */
        --forge-color-chart-6: #a78bfa;
        --forge-color-chart-7: #f472b6;
        --forge-color-chart-8: #2dd4bf;
        --forge-color-chart-9: #fb923c;
        --forge-color-chart-10: #9ca3af;
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
`,Qe=B`
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
`,q=B`
  :host {
    display: block;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;var O=class O extends Be{constructor(){super(...arguments);this._instanceId=`forge-${++O._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(e){if(!this.store)return e;this.itemContext&&D(this.itemContext);try{return I(this.store,e)}finally{D(null)}}getProp(e){let r=this.props?.[e];return typeof r=="string"&&(r.startsWith("$state:")||r.startsWith("$computed:")||r.startsWith("$item:")||r.startsWith("$expr:")||r.includes("{{")&&r.includes("}}"))?this.resolve(r):r}getArray(e){let r=this.getProp(e);return Array.isArray(r)?r:r&&typeof r=="object"?Object.values(r):[]}getString(e,r=""){let o=this.getProp(e);return typeof o=="string"?o:String(o??r)}getNumber(e,r=0){let o=this.getProp(e);return typeof o=="number"?o:Number(o)||r}getBool(e,r=!1){let o=this.getProp(e);return typeof o=="boolean"?o:r}dispatchAction(e,r){this.onAction&&this.onAction(e,r),this.dispatchEvent(new CustomEvent("forge-action",{detail:{action:e,payload:r},bubbles:!0,composed:!0}))}handleAction(e){let r=this.getString("action");r&&this.dispatchAction(r,this.props)}prop(e){return this.getProp(e)}static get sharedStyles(){return[q]}gapValue(e){let r={none:"0",0:"0","3xs":"var(--forge-space-3xs)","2xs":"var(--forge-space-2xs)",xs:"var(--forge-space-xs)",sm:"var(--forge-space-sm)",md:"var(--forge-space-md)",lg:"var(--forge-space-lg)",xl:"var(--forge-space-xl)","2xl":"var(--forge-space-2xl)"};if(e==null||e==="")return"var(--forge-space-md)";let o=String(e);return o in r?r[o]:/^\d+(\.\d+)?$/.test(o)?`${o}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(o)?o:"var(--forge-space-md)"}static get styles(){return[q]}};O._instanceCounter=0;var f=O;var U=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`
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
  `}render(){let t=this.getString("direction","column"),e=t==="horizontal"||t==="row"?"row":"column",r=this.getString("gap","md"),o=this.getString("padding",""),s=this.getString("align",""),i=this.getString("justify",""),l=this.getBool("wrap"),c=this.gapValue(r),g=o?`var(--forge-space-${o}, var(--forge-space-md))`:"0";return this.setAttribute("direction",e),s&&this.setAttribute("align",s),i&&this.setAttribute("justify",i),l&&this.setAttribute("wrap",""),this.style.gap=c,this.style.padding=g,a`<slot></slot>`}};customElements.define("forge-stack",U);var J=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`
    :host { display: grid; min-width: 0; }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let t=this.getProp("columns"),e;typeof t=="number"?e=String(t):typeof t=="string"&&t?e=t:e="1";let r=/^\d+$/.test(e)?`repeat(${e}, minmax(0, 1fr))`:e,o=this.getString("gap","md"),s=this.gapValue(o),i=this.getString("padding",""),l=i?`var(--forge-space-${i}, var(--forge-space-md))`:"0";return this.style.gridTemplateColumns=r,this.style.gap=s,this.style.padding=l,/^\d+$/.test(e)&&Number(e)>=2&&this.setAttribute("responsive",""),a`<slot></slot>`}};customElements.define("forge-grid",J);var X=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`
    :host { display:block; background:var(--forge-color-surface); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-lg); padding:var(--forge-space-md); min-width:0; }
    :host([variant="elevated"]) { box-shadow:var(--forge-shadow-md); border-color:transparent; }
    :host([variant="compact"]) { padding:var(--forge-space-sm); border-radius:var(--forge-radius-md); }
    :host([variant="outline"]) { background:transparent; }
    :host([variant="ghost"]) { background:transparent; border-color:transparent; padding:0; }
    .header { margin-bottom:var(--forge-space-sm); }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); color:var(--forge-color-text); line-height:var(--forge-leading-tight); }
    .subtitle { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-3xs); }
    .body { display:flex; flex-direction:column; gap:var(--forge-space-md); min-width:0; }
  `}render(){let t=this.getString("variant",""),e=this.getString("title",""),r=this.getString("subtitle","");return t&&this.setAttribute("variant",t),a`
      ${e||r?a`
        <div class="header">
          ${e?a`<div class="title">${e}</div>`:d}
          ${r?a`<div class="subtitle">${r}</div>`:d}
        </div>
      `:d}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forge-card",X);var Z=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let t=this.getString("maxWidth",""),e={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},r=t in e?e[t]:t,o=this.getString("padding","");return r&&r!=="none"?this.style.maxWidth=r:this.style.maxWidth="",this.style.padding=o?`var(--forge-space-${o}, var(--forge-space-md))`:"",a`<slot></slot>`}};customElements.define("forge-container",Z);var Y=class extends f{static get properties(){return{props:{type:Object},_active:{state:!0}}}constructor(){super(),this._active=""}static get styles(){return u`
    :host { display:block; }
    .tabs { display:flex; border-bottom:1px solid var(--forge-color-border); gap:var(--forge-space-xs); overflow-x:auto; }
    .tab { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; border:none; background:none;
      color:var(--forge-color-text-secondary); font:inherit; font-size:var(--forge-text-sm);
      border-bottom:2px solid transparent; transition:var(--forge-transition-fast); white-space:nowrap; }
    .tab:hover { color:var(--forge-color-text); background:var(--forge-color-surface-hover); }
    .tab[active] { color:var(--forge-color-primary); border-bottom-color:var(--forge-color-primary); font-weight:var(--forge-weight-medium); }
    .panel { padding-top:var(--forge-space-md); display:flex; flex-direction:column; gap:var(--forge-space-md); }
    ::slotted(*) { display:none; }
    ::slotted([data-active]) { display:block; }
    @media (prefers-reduced-motion: reduce) {
      .tab { transition:none; }
    }
  `}_itemKey(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.id??t.key??t.value??t.label??"":t??"")}_itemLabel(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.label??t.title??t.value??"":t??"")}updated(){Array.from(this.children).filter(e=>!(e instanceof HTMLScriptElement)).forEach((e,r)=>{String(r)===this._active||e.id===this._active||e.getAttribute("slot")===this._active?e.setAttribute("data-active",""):e.removeAttribute("data-active")})}_moveTo(t,e){let r=this._itemKey(e[t])||String(t);this._active=r,this.requestUpdate(),this.dispatchAction("tab-change",{active:r}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${t}`)?.focus()})}render(){let t=this.getProp("items")||[],e=Array.isArray(t)?t:[];!this._active&&e.length>0&&(this._active=this._itemKey(e[0])||"0");let r=e.findIndex((s,i)=>(this._itemKey(s)||String(i))===this._active),o=(s,i)=>{let l=-1;s.key==="ArrowRight"?l=(i+1)%e.length:s.key==="ArrowLeft"?l=(i-1+e.length)%e.length:s.key==="Home"?l=0:s.key==="End"&&(l=e.length-1),l!==-1&&(s.preventDefault(),this._moveTo(l,e))};return a`
      <div class="tabs" role="tablist">${e.map((s,i)=>{let l=this._itemKey(s)||String(i),c=this._itemLabel(s)||String(i+1),g=l===this._active;return a`
          <button class="tab" ?active=${g} role="tab" aria-selected=${g}
            id="${this._instanceId}-tab-${i}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${g?0:-1}"
            @click=${()=>{this._active=l,this.requestUpdate(),this.dispatchAction("tab-change",{active:l})}}
            @keydown=${h=>o(h,i)}>${c}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${r>=0?r:0}"><slot></slot></div>
    `}};customElements.define("forge-tabs",Y);var G=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`
    :host { display:block; }
    details { border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); margin-bottom:var(--forge-space-2xs); }
    summary { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; font-weight:var(--forge-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forge-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forge-space-sm) var(--forge-space-md); }
  `}render(){let t=this.getString("title","Section");return a`<details><summary>${t}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forge-accordion",G);var Q=class extends f{static get styles(){return u`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forge-color-border); margin:var(--forge-space-sm) 0; }
  `}render(){return a`<hr>`}};customElements.define("forge-divider",Q);var F=class extends f{static get styles(){return u`:host { display:block; }`}render(){let e=`var(--forge-space-${this.getString("size","md")}, var(--forge-space-md))`;return a`<div style="height:${e}"></div>`}};customElements.define("forge-spacer",F);var ee=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`
    :host { display:flex; flex-direction:column; gap:var(--forge-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
  `}render(){let t=this.getArray("data"),e=this.getString("emptyMessage",""),r=this.getString("direction","column");(r==="row"||r==="horizontal")&&this.setAttribute("direction","row");let o=this.getString("gap","md");return this.style.gap=this.gapValue(o),t.length===0&&e?a`<div class="empty">${e}</div>`:a`<slot></slot>`}};customElements.define("forge-repeater",ee);var te=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`
    :host { display:block; min-width:0; }
    .heading1 { font-size:var(--forge-text-3xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); letter-spacing:-0.02em; margin:0; }
    .heading2 { font-size:var(--forge-text-2xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); letter-spacing:-0.01em; margin:0; }
    .heading3 { font-size:var(--forge-text-xl); font-weight:var(--forge-weight-semibold); line-height:var(--forge-leading-tight); margin:0; }
    .heading { font-size:var(--forge-text-2xl); font-weight:var(--forge-weight-bold); line-height:var(--forge-leading-tight); margin:0; }
    .subheading { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); line-height:var(--forge-leading-tight); margin:0; }
    .label { font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); color:var(--forge-color-text); margin:0; }
    .body { font-size:var(--forge-text-base); line-height:var(--forge-leading-normal); margin:0; }
    .caption { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); margin:0; }
    .muted { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin:0; }
    .code { font-family:var(--forge-font-mono); font-size:var(--forge-text-sm); background:var(--forge-color-surface-alt);
      padding:var(--forge-space-2xs) var(--forge-space-xs); border-radius:var(--forge-radius-sm); display:inline-block; }
    .align-left { text-align:left; }
    .align-center { text-align:center; }
    .align-right { text-align:right; }
  `}render(){let t=this.getString("content",""),e=this.getString("variant","body"),o={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[e]||e,s=this.getString("colorScheme",""),i=this.getString("align",""),l=this.getString("weight",""),c={primary:"var(--forge-color-primary)",secondary:"var(--forge-color-text-secondary)",tertiary:"var(--forge-color-text-tertiary)",success:"var(--forge-color-success)",warning:"var(--forge-color-warning)",error:"var(--forge-color-error)",info:"var(--forge-color-info)"},g={normal:"var(--forge-weight-normal)",medium:"var(--forge-weight-medium)",semibold:"var(--forge-weight-semibold)",bold:"var(--forge-weight-bold)"},h=[];s&&c[s]&&h.push(`color:${c[s]}`),l&&g[l]&&h.push(`font-weight:${g[l]}`);let p=i?`align-${i}`:"",k=a`${t}<slot></slot>`;return o==="heading1"?a`<h1 class="${o} ${p}" style="${h.join(";")}">${k}</h1>`:o==="heading2"?a`<h2 class="${o} ${p}" style="${h.join(";")}">${k}</h2>`:o==="heading3"?a`<h3 class="${o} ${p}" style="${h.join(";")}">${k}</h3>`:a`<div class="${o} ${p}" style="${h.join(";")}">${t}<slot></slot></div>`}};customElements.define("forge-text",te);var re=class extends f{static get styles(){return u`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forge-radius-md); }
  `}render(){let t=this.getString("src",""),e=this.getString("alt",""),r=this.getString("fit","contain");return t?a`<img src="${t}" alt="${e}" style="object-fit:${r}" loading="lazy">`:a`${d}`}};customElements.define("forge-image",re);var oe=class extends f{static get styles(){return u`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forge-icon-md); height:var(--forge-icon-md); fill:currentColor; }
  `}render(){let t=this.getString("name","circle"),e={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},r=e[t]||e.circle;return a`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${r}"/></svg>`}};customElements.define("forge-icon",oe);var ne=class extends f{static get styles(){return u`
    :host { display:inline-flex; align-items:center; }
    .badge { display:inline-flex; align-items:center; padding:var(--forge-space-2xs) var(--forge-space-xs);
      border-radius:var(--forge-radius-full); font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); }
    .badge[variant="success"] { background:var(--forge-color-success-subtle); color:var(--forge-color-success); }
    .badge[variant="warning"] { background:var(--forge-color-warning-subtle); color:var(--forge-color-warning); }
    .badge[variant="error"] { background:var(--forge-color-error-subtle); color:var(--forge-color-error); }
  `}render(){let t=this.getString("label",""),e=this.getString("variant","");return a`<span class="badge" variant="${e}">${t}<slot></slot></span>`}};customElements.define("forge-badge",ne);var se=class extends f{static get styles(){return u`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forge-radius-full); background:var(--forge-color-primary-subtle);
      color:var(--forge-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forge-weight-semibold); font-size:var(--forge-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let t=this.getString("src",""),e=this.getString("name","?"),r=e.split(" ").map(o=>o[0]).join("").toUpperCase().slice(0,2);return a`<div class="avatar">${t?a`<img src="${t}" alt="${e}">`:r}<slot></slot></div>`}};customElements.define("forge-avatar",se);var ae=class extends f{static get styles(){return u`
    :host { display:block; text-align:center; padding:var(--forge-space-2xl) var(--forge-space-lg); }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-xs); }
    .desc { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-bottom:var(--forge-space-md); }
  `}render(){let t=this.getString("title","Nothing here"),e=this.getString("description","");return a`
      <div class="title">${t}</div>
      ${e?a`<div class="desc">${e}</div>`:d}
      <slot></slot>
    `}};customElements.define("forge-empty-state",ae);var ie=class extends f{static get styles(){return u`
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
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),r=this.getString("hint",""),o=this.getString("error",""),s=this.getString("inputType","text"),i=this.getBool("multiline"),l=this.getString("value",""),c=this._instanceId;return a`
      ${t?a`<label for="${c}">${t}</label>`:d}
      ${i?a`<textarea id="${c}" placeholder="${e}" .value=${l} @input=${g=>this.dispatchAction("change",{value:g.target.value})}></textarea>`:a`<input id="${c}" type="${s}" placeholder="${e}" .value=${l} @input=${g=>this.dispatchAction("change",{value:g.target.value})}>`}
      ${r&&!o?a`<div class="hint">${r}</div>`:d}
      ${o?a`<div class="error">${o}</div>`:d}
    `}};customElements.define("forge-text-input",ie);var le=class extends f{static get styles(){return u`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("min"),r=this.getProp("max"),o=this.getProp("step"),s=this.getProp("value"),i=this._instanceId;return a`
      ${t?a`<label for="${i}">${t}</label>`:d}
      <input id="${i}" type="number" min=${e} max=${r} step=${o} .value=${s??""}
        @input=${l=>this.dispatchAction("change",{value:Number(l.target.value)})}>
    `}};customElements.define("forge-number-input",le);var ce=class extends f{static get styles(){return u`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    select { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    select:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("options")||[],r=this.getString("value",""),o=this._instanceId;return a`
      ${t?a`<label for="${o}">${t}</label>`:d}
      <select id="${o}" .value=${r} @change=${s=>this.dispatchAction("change",{value:s.target.value})}>
        ${e.map(s=>a`<option value=${typeof s=="string"?s:s.value} ?selected=${(typeof s=="string"?s:s.value)===r}>
          ${typeof s=="string"?s:s.label||s.value}
        </option>`)}
      </select>
    `}};customElements.define("forge-select",ce);var ge=class extends f{static get styles(){return u`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forge-space-2xs); padding:var(--forge-space-xs); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); min-height:var(--forge-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forge-space-2xs); padding:var(--forge-space-2xs) var(--forge-space-xs);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); border-radius:var(--forge-radius-full);
      font-size:var(--forge-text-xs); }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; }
  `}render(){let t=this.getString("label",""),e=this.getProp("selected")||[];return a`
      ${t?a`<label>${t}</label>`:d}
      <div class="tags">
        ${e.map(r=>a`<span class="tag">${String(r)}<button @click=${()=>this.dispatchAction("remove",{value:r})}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forge-multi-select",ge);var fe=class extends f{static get styles(){return u`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); margin-bottom:var(--forge-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forge-color-primary); cursor:pointer; }
    label { font-size:var(--forge-text-sm); cursor:pointer; }
  `}render(){let t=this.getString("label",""),e=this.getBool("checked"),r=this._instanceId;return a`
      <input id="${r}" type="checkbox" ?checked=${e} @change=${o=>this.dispatchAction("change",{checked:o.target.checked})}>
      ${t?a`<label for="${r}">${t}</label>`:d}
    `}};customElements.define("forge-checkbox",fe);var de=class extends f{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let e=this.getBool("on");this.dispatchEvent(new CustomEvent("forge-action",{detail:{actionId:"change",value:!e},bubbles:!0,composed:!0}))};this._onKeydown=e=>{(e.key==="Enter"||e.key===" "||e.key==="Spacebar")&&(e.preventDefault(),this._toggle())}}static get styles(){return u`
    :host { display:flex; align-items:center; gap:var(--forge-space-sm); margin-bottom:var(--forge-space-xs); }
    .switch { position:relative; width:2.75rem; height:1.5rem; background:var(--forge-color-border-strong);
      border-radius:var(--forge-radius-full); cursor:pointer; border:none; padding:0;
      transition:background var(--forge-transition-fast); }
    .switch[aria-checked="true"] { background:var(--forge-color-primary); }
    .switch::after { content:''; position:absolute; top:2px; left:2px; width:1.25rem; height:1.25rem;
      background:var(--forge-color-surface); border-radius:var(--forge-radius-full); transition:transform var(--forge-transition-fast); }
    .switch[aria-checked="true"]::after { transform:translateX(1.25rem); }
    .switch:focus-visible { outline:2px solid var(--forge-color-primary); outline-offset:2px; }
    .switch:disabled { opacity:0.5; cursor:not-allowed; }
    .toggle-label { display:inline-flex; align-items:center; gap:var(--forge-space-sm); cursor:pointer; }
    .toggle-text { font-size:var(--forge-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .switch, .switch::after { transition:none; }
    }
  `}render(){let e=this.getBool("on"),r=this.getString("label",""),o=this.getBool("disabled"),s=this._instanceId;return a`
      <label for="${s}" class="toggle-label">
        <button
          id="${s}"
          class="switch"
          role="switch"
          type="button"
          aria-checked="${e?"true":"false"}"
          ?disabled=${o}
          @click="${this._toggle}"
          @keydown="${this._onKeydown}"
        ></button>
        ${r?a`<span class="toggle-text">${r}</span>`:d}
      </label>
    `}};customElements.define("forge-toggle",de);var ue=class extends f{static get styles(){return u`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getString("value","");return a`
      ${t?a`<label>${t}</label>`:d}
      <input type="date" .value=${e} @change=${r=>this.dispatchAction("change",{value:r.target.value})}>
    `}};customElements.define("forge-date-picker",ue);var pe=class extends f{static get styles(){return u`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input[type=range] { width:100%; accent-color:var(--forge-color-primary); }
    .value { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); }
  `}render(){let t=this.getString("label",""),e=this.getNumber("min",0),r=this.getNumber("max",100),o=this.getNumber("step",1),s=this.getNumber("value",e);return a`
      ${t?a`<label>${t}</label>`:d}
      <input type="range" min=${e} max=${r} step=${o} .value=${s}
        @input=${i=>this.dispatchAction("change",{value:Number(i.target.value)})}>
      <div class="value">${s}</div>
    `}};customElements.define("forge-slider",pe);var he=class extends f{static get styles(){return u`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .dropzone { border:2px dashed var(--forge-color-border-strong); border-radius:var(--forge-radius-md);
      padding:var(--forge-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forge-transition-fast); }
    .dropzone:hover { border-color:var(--forge-color-primary); }
    .dropzone p { color:var(--forge-color-text-secondary); font-size:var(--forge-text-sm); }
  `}render(){let t=this.getString("label","Upload file"),e=this.getString("accept","*");return a`
      ${t?a`<label>${t}</label>`:d}
      <div class="dropzone" @click=${()=>this.shadowRoot?.querySelector("input")?.click()}>
        <p>Click or drop file here</p>
        <input type="file" accept="${e}" hidden @change=${r=>{let o=r.target.files?.[0];o&&this.dispatchAction("change",{name:o.name,size:o.size,type:o.type})}}>
      </div>
    `}};customElements.define("forge-file-upload",he);var me=class extends f{static get styles(){return u`
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
    button[aria-pressed="true"] { background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); }
    @media (prefers-reduced-motion: reduce) {
      button { transition:none; }
    }
  `}render(){let t=this.getString("label","Button"),e=this.getString("variant","primary"),r=this.getString("size",""),o=this.getBool("disabled"),s=this.getProp("pressed");return a`<button class="${e} ${r}" ?disabled=${o}
      aria-pressed=${s==null?d:String(!!s)}
      @click=${i=>this.handleAction(i)}>${t}<slot></slot></button>`}};customElements.define("forge-button",me);var ve=class extends f{static get styles(){return u`
    :host { display:flex; gap:var(--forge-space-xs); }
  `}render(){return a`<slot></slot>`}};customElements.define("forge-button-group",ve);var be=class extends f{static get styles(){return u`
    :host { display:inline-flex; }
    a { color:var(--forge-color-primary); text-decoration:none; font-size:var(--forge-text-sm); cursor:pointer; }
    a:hover { text-decoration:underline; }
  `}render(){let t=this.getString("label",""),e=this.getString("href","#");return a`<a href="${e}">${t}<slot></slot></a>`}};customElements.define("forge-link",be);var ye=class extends f{static get styles(){return u`
    :host { display:block; overflow-x:auto; min-width:0; width:100%; }
    table { width:100%; border-collapse:collapse; font-size:var(--forge-text-sm); }
    th { text-align:left; padding:var(--forge-space-sm); font-weight:var(--forge-weight-semibold);
      color:var(--forge-color-text-secondary); border-bottom:2px solid var(--forge-color-border); white-space:nowrap;
      text-transform:uppercase; letter-spacing:0.03em; font-size:var(--forge-text-xs); }
    td { padding:var(--forge-space-sm); border-bottom:1px solid var(--forge-color-border); vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    tbody tr:hover td { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-xl); text-align:center; color:var(--forge-color-text-tertiary); }
    .badge { display:inline-flex; align-items:center; padding:var(--forge-space-3xs) var(--forge-space-xs);
      border-radius:var(--forge-radius-full); font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-surface-alt); color:var(--forge-color-text-secondary); }
    .badge.success { background:var(--forge-color-success-subtle); color:var(--forge-color-success); }
    .badge.warning { background:var(--forge-color-warning-subtle); color:var(--forge-color-warning); }
    .badge.error { background:var(--forge-color-error-subtle); color:var(--forge-color-error); }
    .badge.info, .badge.primary { background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); }
    .badge.neutral { background:var(--forge-color-surface-alt); color:var(--forge-color-text-secondary); }
    .align-right { text-align:right; }
    .align-center { text-align:center; }
    .col-right th, .col-right td { text-align:right; }
    .col-center th, .col-center td { text-align:center; }
    caption { text-align:start; font-size:var(--forge-text-sm); caption-side:top; padding-bottom:var(--forge-space-sm); color:var(--forge-color-text-secondary); }
    .row-action { cursor:pointer; }
    .row-action:hover td { background:var(--forge-color-surface-hover); }
    .row-action:focus-visible { outline:2px solid var(--forge-color-primary); outline-offset:-2px; }
  `}_statusClass(t){let e=String(t??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(e)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(e)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(e)?"neutral":["high","urgent","critical"].includes(e)?"error":["medium","med"].includes(e)?"warning":["low"].includes(e)?"info":["failed","error","rejected","blocked","overdue"].includes(e)?"error":"neutral"}_renderCell(t,e){let r=typeof t=="string"?t:t.key,o=e[r],s=t&&typeof t=="object"?t.type:void 0;if(o==null||o==="")return a`<span style="color:var(--forge-color-text-tertiary)">—</span>`;if(s==="badge"||s==="status"){let i=(t.variant&&typeof t.variant=="object"?t.variant[String(o).toLowerCase()]:null)||this._statusClass(o);return a`<span class="badge ${i}">${String(o)}</span>`}if(s==="number")return typeof o=="number"?o.toLocaleString():String(o);if(s==="date"){let i=typeof o=="string"||typeof o=="number"?new Date(o):o;return i instanceof Date&&!isNaN(i.getTime())?i.toLocaleDateString():String(o)}if(s==="currency"){let i=Number(o);return isNaN(i)?String(o):i.toLocaleString(void 0,{style:"currency",currency:t.currency||"USD"})}return s==="boolean"?o?"\u2713":"\u2717":String(o)}render(){let t=this.getProp("data")||[],e=this.getProp("columns")||[],r=this.getString("emptyMessage","No data yet"),o=this.getString("rowAction",""),s=this.getString("caption",""),i=e.length>0?e:t.length>0?Object.keys(t[0]):[];return i.length===0?a`<div class="empty">${r}</div>`:a`
      <table>
        ${s?a`<caption>${s}</caption>`:d}
        <thead><tr>${i.map(l=>{let c=typeof l=="string"?l:l.label||l.key,g=typeof l=="object"?l.align:void 0,h=typeof l=="object"?l.width:void 0;return a`<th class="${g==="right"?"align-right":g==="center"?"align-center":""}" style="${h?`width:${h}`:""}">${c}</th>`})}</tr></thead>
        <tbody>${t.length===0?a`<tr><td colspan=${i.length} class="empty">${r}</td></tr>`:t.map((l,c)=>{let g=!!o,h=g?String(l[typeof i[0]=="string"?i[0]:i[0]?.key]??`Row ${c+1}`):"";return a`<tr class="${g?"row-action":""}"
                tabindex=${g?0:d}
                role=${g?"button":d}
                aria-label=${g?h:d}
                @click=${g?()=>this.dispatchAction(o,{row:l,index:c}):void 0}
                @keydown=${g?p=>{(p.key==="Enter"||p.key===" ")&&(p.preventDefault(),this.dispatchAction(o,{row:l,index:c}))}:void 0}>
              ${i.map(p=>{let k=typeof p=="object"?p.align:void 0;return a`<td class="${k==="right"?"align-right":k==="center"?"align-center":""}">${this._renderCell(p,l)}</td>`})}</tr>`})}</tbody>
      </table>
    `}};customElements.define("forge-table",ye);var xe=class extends f{static get styles(){return u`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forge-space-xs); }
    .item { padding:var(--forge-space-sm); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md);
      display:flex; align-items:center; gap:var(--forge-space-sm); }
    .item:hover { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
  `}render(){let t=this.getProp("data")||[],e=this.getString("emptyMessage","No items");return t.length===0?a`<div class="empty">${e}</div>`:a`<div class="list">${t.map((r,o)=>a`
      <div class="item" data-index=${o}><slot name="item" .item=${r} .index=${o}>${JSON.stringify(r)}</slot></div>
    `)}</div>`}};customElements.define("forge-list",xe);var $e=class extends f{constructor(){super(...arguments);this._palette=["var(--forge-color-primary)","var(--forge-color-success)","var(--forge-color-warning)","var(--forge-color-error)","var(--forge-color-info)","var(--forge-color-chart-6)","var(--forge-color-chart-7)","var(--forge-color-chart-8)","var(--forge-color-chart-9)","var(--forge-color-chart-10)"]}static get styles(){return u`
    :host { display:block; min-width:0; }
    .title { font-weight:var(--forge-weight-semibold); font-size:var(--forge-text-sm); margin-bottom:var(--forge-space-xs); color:var(--forge-color-text); }
    .wrap { width:100%; }
    svg { width:100%; height:auto; display:block; font-family:var(--forge-font-family); }
    .grid { stroke:var(--forge-color-border); stroke-width:1; opacity:0.5; }
    .axis { stroke:var(--forge-color-border-strong); stroke-width:1; }
    .tick-label { fill:var(--forge-color-text-tertiary); font-size:10px; }
    .bar { fill:var(--forge-color-primary); transition:opacity 0.15s; }
    .bar:hover { opacity:0.85; }
    .line { fill:none; stroke:var(--forge-color-primary); stroke-width:2; }
    .point { fill:var(--forge-color-primary); }
    .area { fill:var(--forge-color-primary); opacity:0.15; }
    .slice { stroke:var(--forge-color-surface); stroke-width:2; }
    .legend { display:flex; flex-wrap:wrap; gap:var(--forge-space-sm); margin-top:var(--forge-space-xs); font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); }
    .legend-item { display:inline-flex; align-items:center; gap:var(--forge-space-2xs); }
    .swatch { display:inline-block; width:0.75rem; height:0.75rem; border-radius:2px; }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; }
    }
  `}_niceMax(e){if(e<=0)return 1;let r=Math.pow(10,Math.floor(Math.log10(e))),o=e/r;return(o<=1?1:o<=2?2:o<=5?5:10)*r}render(){let e=this.getString("chartType","bar"),r=this.getProp("data")||[],o=this.getString("title",""),s=this.getString("xKey","label")||this.getString("labelKey","label"),i=this.getString("yKey","value")||this.getString("valueKey","value"),l=this.getString("color","");if(!r||r.length===0)return a`
        ${o?a`<div class="title">${o}</div>`:d}
        <div class="empty">No data to display</div>
      `;let c=r.map(m=>typeof m=="number"?{label:"",value:m}:m&&typeof m=="object"?{label:String(m[s]??m.label??m.name??m.x??""),value:Number(m[i]??m.value??m.y??0)||0,color:m.color}:{label:String(m),value:0}),g=600,h=260,p={top:8,right:16,bottom:36,left:48},k=g-p.left-p.right,C=h-p.top-p.bottom,P,Ae=d;if(e==="pie"||e==="donut"){let m=c.reduce((x,b)=>x+Math.max(0,b.value),0)||1,j=g/2,E=h/2,S=Math.min(k,C)/2-8,z=e==="donut"?S*.55:0,v=-Math.PI/2,y=[],_=[];c.forEach((x,b)=>{let A=Math.max(0,x.value)/m,$=v,w=v+A*Math.PI*2;v=w;let L=w-$>Math.PI?1:0,T=j+S*Math.cos($),Re=E+S*Math.sin($),Ie=j+S*Math.cos(w),Le=E+S*Math.sin(w),W=x.color||this._palette[b%this._palette.length];if(_.push(W),z>0){let Ne=j+z*Math.cos($),Pe=E+z*Math.sin($),Te=j+z*Math.cos(w),Oe=E+z*Math.sin(w);y.push(`<path class="slice" fill="${W}" d="M ${T} ${Re} A ${S} ${S} 0 ${L} 1 ${Ie} ${Le} L ${Te} ${Oe} A ${z} ${z} 0 ${L} 0 ${Ne} ${Pe} Z"/>`)}else y.push(`<path class="slice" fill="${W}" d="M ${j} ${E} L ${T} ${Re} A ${S} ${S} 0 ${L} 1 ${Ie} ${Le} Z"/>`)}),P=a`<g .innerHTML=${y.join("")}></g>`,Ae=a`<div class="legend">${c.map((x,b)=>a`
        <span class="legend-item"><span class="swatch" style="background:${_[b]}"></span>${x.label} (${x.value})</span>
      `)}</div>`}else{let m=Math.max(...c.map(v=>v.value),0),j=this._niceMax(m),E=v=>p.top+C-v/j*C,S=4,z=[];for(let v=0;v<=S;v++){let y=j*v/S,_=E(y);z.push(`<line class="grid" x1="${p.left}" x2="${p.left+k}" y1="${_}" y2="${_}"/>`),z.push(`<text class="tick-label" x="${p.left-6}" y="${_+3}" text-anchor="end">${y.toLocaleString()}</text>`)}if(e==="line"||e==="area"){let v=k/Math.max(1,c.length-1),y=c.map((b,A)=>{let $=p.left+A*v,w=E(b.value);return`${A===0?"M":"L"} ${$} ${w}`}).join(" "),_=e==="area"?y+` L ${p.left+k} ${p.top+C} L ${p.left} ${p.top+C} Z`:"",x=l||"var(--forge-color-primary)";P=a`
          <g .innerHTML=${z.join("")}></g>
          ${e==="area"?a`<path class="area" d="${_}" style="fill:${x};opacity:0.15"/>`:d}
          <path class="line" d="${y}" style="stroke:${x}"/>
          ${c.map((b,A)=>{let $=p.left+A*v,w=E(b.value);return M`<circle class="point" cx="${$}" cy="${w}" r="3" style="fill:${x}"/>
              <text class="tick-label" x="${$}" y="${p.top+C+14}" text-anchor="middle">${b.label}</text>`})}
        `}else{let v=c.length,y=k/v,_=Math.max(2,y*.7),x=y-_;P=a`
          <g .innerHTML=${z.join("")}></g>
          ${c.map((b,A)=>{let $=p.left+A*y+x/2,w=E(b.value),L=Math.max(0,p.top+C-w),T=b.color||l||"var(--forge-color-primary)";return M`<rect class="bar" x="${$}" y="${w}" width="${_}" height="${L}" rx="2" style="fill:${T}">
                <title>${b.label}: ${b.value}</title>
              </rect>
              <text class="tick-label" x="${$+_/2}" y="${p.top+C+14}" text-anchor="middle">${b.label}</text>`})}
        `}}return a`
      ${o?a`<div class="title">${o}</div>`:d}
      <div class="wrap">
        <svg viewBox="0 0 ${g} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${o||e+" chart"}">
          ${P}
        </svg>
        ${Ae}
      </div>
    `}};customElements.define("forge-chart",$e);var we=class extends f{static get styles(){return u`
    :host { display:flex; flex-direction:column; padding:var(--forge-space-md); background:var(--forge-color-surface);
      border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-lg); min-width:0; gap:var(--forge-space-2xs); }
    :host([variant="plain"]) { background:transparent; border:none; padding:0; }
    .label { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); font-weight:var(--forge-weight-medium); }
    .value-row { display:flex; align-items:baseline; gap:var(--forge-space-2xs); flex-wrap:wrap; }
    .value { font-size:var(--forge-text-3xl); font-weight:var(--forge-weight-bold); color:var(--forge-color-text); line-height:1.1; letter-spacing:-0.02em; }
    .unit, .suffix { font-size:var(--forge-text-base); color:var(--forge-color-text-secondary); font-weight:var(--forge-weight-medium); }
    .trend { display:inline-flex; align-items:center; gap:var(--forge-space-3xs); font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium);
      padding:var(--forge-space-3xs) var(--forge-space-xs); border-radius:var(--forge-radius-sm); }
    .trend.up { color:var(--forge-color-success); background:var(--forge-color-success-subtle); }
    .trend.down { color:var(--forge-color-error); background:var(--forge-color-error-subtle); }
    .trend.neutral { color:var(--forge-color-text-secondary); background:var(--forge-color-surface-alt); }
    .subtitle { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); }
    .goal { font-size:var(--forge-text-xs); color:var(--forge-color-text-tertiary); }
  `}_trendMeta(t){if(t==null||t==="")return null;if(typeof t=="number")return t>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(t)}%`}:t<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(t)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof t=="string"){let e=t.toLowerCase(),r=t.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(r){let o=parseFloat(r[1]),s=r[2];return o>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(o)}${s}`}:o<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(o)}${s}`}:{dir:"neutral",arrow:"\u2192",display:`0${s}`}}return e==="up"||e==="positive"||e==="increase"?{dir:"up",arrow:"\u2191",display:""}:e==="down"||e==="negative"||e==="decrease"?{dir:"down",arrow:"\u2193",display:""}:e==="flat"||e==="neutral"||e==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:t}}return null}render(){let t=this.getString("label",""),e=this.getProp("value"),r=this.getProp("trend"),o=this.getString("trendLabel",""),s=this.getProp("goal"),i=this.getString("unit",""),l=this.getString("suffix",""),c=this.getString("subtitle",""),g=this.getString("variant","");g&&this.setAttribute("variant",g);let h=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),p=this._trendMeta(r);return a`
      ${t?a`<div class="label">${t}</div>`:d}
      <div class="value-row">
        <span class="value">${h}</span>
        ${i?a`<span class="unit">${i}</span>`:d}
        ${l?a`<span class="suffix">${l}</span>`:d}
        ${p?a`<span class="trend ${p.dir}">${p.arrow}${p.display?a` ${p.display}`:d}${o?a` ${o}`:d}</span>`:d}
      </div>
      ${c?a`<div class="subtitle">${c}</div>`:d}
      ${s!=null&&s!==""?a`<div class="goal">Goal: ${typeof s=="number"?s.toLocaleString():s}</div>`:d}
    `}};customElements.define("forge-metric",we);var ke=class extends f{static get styles(){return u`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    .alert { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      border-left:4px solid; font-size:var(--forge-text-sm); }
    .info { background:var(--forge-color-info-subtle); border-color:var(--forge-color-info); color:var(--forge-color-info); }
    .success { background:var(--forge-color-success-subtle); border-color:var(--forge-color-success); color:var(--forge-color-success); }
    .warning { background:var(--forge-color-warning-subtle); border-color:var(--forge-color-warning); color:var(--forge-color-warning); }
    .error { background:var(--forge-color-error-subtle); border-color:var(--forge-color-error); color:var(--forge-color-error); }
  `}render(){let t=this.getString("variant","info"),e=this.getString("title",""),r=this.getString("message","");return a`<div class="alert ${t}" role=${t==="error"||t==="warning"?"alert":"status"}>
      ${e?a`<strong>${e}</strong> `:d}${r}<slot></slot>
    </div>`}};customElements.define("forge-alert",ke);var Se=class extends f{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=e=>this._onKeydown(e);this._close=()=>{this.dispatchAction("close")}}static get styles(){return u`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forge-color-surface); border-radius:var(--forge-radius-lg);
      padding:var(--forge-space-lg); min-width:20rem; max-width:90vw; max-height:90vh; overflow:auto;
      box-shadow:var(--forge-shadow-lg); z-index:1; }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forge-space-xs); margin-top:var(--forge-space-lg); }
  `}render(){let e=this.getString("title",""),r=this.getBool("open"),o=`${this._instanceId}-title`;return r?this.setAttribute("open",""):this.removeAttribute("open"),r?a`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${e?o:d}"
        tabindex="-1"
        @click=${s=>s.stopPropagation()}
      >
        ${e?a`<h2 id="${o}" class="title">${e}</h2>`:d}
        <slot></slot>
      </div>
    `:d}updated(e){if(super.updated?.(e),e.has("props")){let r=this.getBool("open"),s=e.get("props")?.open??!1;r&&!s?this._onOpen():!r&&s&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let e=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??e)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(e){if(e.key==="Escape"){e.preventDefault(),this._close();return}e.key==="Tab"&&this._trapFocus(e)}_trapFocus(e){let r=this._allFocusableInDialog();if(r.length===0){e.preventDefault();return}let o=r[0],s=r[r.length-1],i=this.shadowRoot?.activeElement??document.activeElement;e.shiftKey?(i===o||!this._dialogContains(i))&&(e.preventDefault(),s.focus()):(i===s||!this._dialogContains(i))&&(e.preventDefault(),o.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let e=this.shadowRoot?.querySelector(".dialog");if(!e)return[];let r='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',o=Array.from(e.querySelectorAll(r)),s=e.querySelector("slot"),i=s instanceof HTMLSlotElement?s.assignedElements({flatten:!0}).flatMap(l=>[l,...Array.from(l.querySelectorAll(r))].filter(g=>g instanceof HTMLElement&&g.matches(r))):[];return[...o,...i].filter(l=>!l.disabled)}_dialogContains(e){return e?this.shadowRoot?.querySelector(".dialog")?.contains(e)??!1:!1}};customElements.define("forge-dialog",Se);var ze=class extends f{static get styles(){return u`
    :host { display:block; }
    .progress { height:0.5rem; background:var(--forge-color-surface-alt); border-radius:var(--forge-radius-full); overflow:hidden; }
    .bar { height:100%; background:var(--forge-color-primary); border-radius:var(--forge-radius-full); transition:width var(--forge-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-2xs); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; animation:none; }
    }
  `}render(){let t=this.getProp("value"),e=this.getNumber("max",100),r=t==null,o=r?0:Math.max(0,Math.min(Number(t),e)),s=r?0:o/e*100;return a`
      <div
        class="progress ${r?"indeterminate":""}"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="${e}"
        aria-valuenow="${r?d:o}"
        aria-valuetext="${r?"Loading":`${Math.round(s)}%`}"
      >
        <div class="bar" style=${r?"":`width:${s}%`}></div>
      </div>
    `}};customElements.define("forge-progress",ze);var _e=class extends f{static get styles(){return u`
    :host { display:block; position:fixed; bottom:var(--forge-space-lg); right:var(--forge-space-lg); z-index:60; }
    .toast { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      background:var(--forge-color-text); color:var(--forge-color-text-inverse); font-size:var(--forge-text-sm);
      box-shadow:var(--forge-shadow-lg); max-width:20rem; }
  `}render(){let t=this.getString("message","");return t?a`<div class="toast">${t}</div>`:a`${d}`}};customElements.define("forge-toast",_e);var Ee=class extends f{static get styles(){return u`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); font-size:var(--forge-text-sm); }
    .sep { color:var(--forge-color-text-tertiary); }
    a { color:var(--forge-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forge-color-text); font-weight:var(--forge-weight-medium); }
  `}render(){let t=this.getProp("items")||[];return a`${t.map((e,r)=>{let o=r===t.length-1,s=typeof e=="string"?e:e.label,i=typeof e=="string"?"#":e.href;return a`
        ${r>0?a`<span class="sep">/</span>`:d}
        ${o?a`<span class="current">${s}</span>`:a`<a href="${i}">${s}</a>`}
      `})}`}};customElements.define("forge-breadcrumb",Ee);var Me=class extends f{static get styles(){return u`
    :host { display:flex; width:100%; gap:0; }
    .step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; min-width:0; }
    /* Connector line: starts from after circle midpoint, ends at the next step's circle midpoint */
    .step:not(:last-child)::after { content:''; position:absolute; top:0.75rem;
      left:calc(50% + 0.875rem); right:calc(-50% + 0.875rem); height:2px;
      background:var(--forge-color-border); z-index:0; }
    .step:not(:last-child)[completed]::after { background:var(--forge-color-primary); }
    .circle { width:1.75rem; height:1.75rem; border-radius:var(--forge-radius-full); display:flex; align-items:center;
      justify-content:center; font-size:var(--forge-text-xs); font-weight:var(--forge-weight-semibold);
      background:var(--forge-color-surface); color:var(--forge-color-text-secondary); border:2px solid var(--forge-color-border); z-index:1;
      box-sizing:border-box; position:relative; }
    .step[active] .circle { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
    .step[completed] .circle { background:var(--forge-color-primary); color:var(--forge-color-text-inverse); border-color:var(--forge-color-primary); }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-xs); text-align:center; padding:0 var(--forge-space-2xs); }
    .step[active] .label { color:var(--forge-color-text); font-weight:var(--forge-weight-semibold); }
    .step[completed] .label { color:var(--forge-color-text); }
  `}render(){let t=this.getProp("steps")||[],e=this.getNumber("active",0);return a`${t.map((r,o)=>{let s=typeof r=="string"?r:r.label||r.title||`Step ${o+1}`,i=o===e,l=o<e;return a`<div class="step" ?active=${i} ?completed=${l}>
        <div class="circle">${l?"\u2713":o+1}</div>
        <div class="label">${s}</div>
      </div>`})}`}};customElements.define("forge-stepper",Me);var Ce=class extends f{static get styles(){return u`
    :host { display:block; }
    .error { padding:var(--forge-space-sm); background:var(--forge-color-error-subtle); color:var(--forge-color-error);
      border:1px solid var(--forge-color-error); border-radius:var(--forge-radius-md); font-size:var(--forge-text-sm); }
  `}render(){let t=this.getString("msg","Unknown error");return a`<div class="error" role="alert">⚠ ${t}</div>`}};customElements.define("forge-error",Ce);var je=class extends f{static get properties(){return{props:{type:Object}}}static get styles(){return u`
    :host { display:block; }
    svg { display:block; }
  `}render(){let t=this.getNumber("width",400),e=this.getNumber("height",300),r=this.getString("background","transparent"),o=this.getProp("shapes")||[];return M`
      <svg width="${t}" height="${e}" style="background:${r}" viewBox="0 0 ${t} ${e}">
        ${o.map(s=>this.renderShape(s))}
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
        />`;default:return M``}}};customElements.define("forge-drawing",je);export{G as ForgeAccordion,ke as ForgeAlert,se as ForgeAvatar,ne as ForgeBadge,Ee as ForgeBreadcrumb,me as ForgeButton,ve as ForgeButtonGroup,X as ForgeCard,$e as ForgeChart,fe as ForgeCheckbox,Z as ForgeContainer,ue as ForgeDatePicker,Se as ForgeDialog,Q as ForgeDivider,je as ForgeDrawing,ae as ForgeEmptyState,Ce as ForgeError,he as ForgeFileUpload,J as ForgeGrid,oe as ForgeIcon,re as ForgeImage,be as ForgeLink,xe as ForgeList,we as ForgeMetric,ge as ForgeMultiSelect,le as ForgeNumberInput,ze as ForgeProgress,ee as ForgeRepeater,ce as ForgeSelect,pe as ForgeSlider,F as ForgeSpacer,U as ForgeStack,Me as ForgeStepper,ye as ForgeTable,Y as ForgeTabs,te as ForgeText,ie as ForgeTextInput,_e as ForgeToast,de as ForgeToggle};
