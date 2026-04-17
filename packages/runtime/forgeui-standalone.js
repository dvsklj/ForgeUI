import{LitElement as Ft,html as We}from"lit";import{createStore as yt}from"tinybase";var bt=new Set(["__proto__","prototype","constructor"]);function H(s){if(s.length===0||s.length>256)return!1;for(let e of s.normalize("NFC").split("."))if(bt.has(e))return!1;return!0}function K(s,e){if(e.includes("/")){let t=e.split("/");if(t.length===3){let[o,i,r]=t;return s.getCell(o,i,r)}if(t.length===2){let[o,i]=t,r=s.getValue(e);if(r!==void 0)return r;let l=s.getCellIds(o,i);if(l.length>0){let a={};for(let n of l)a[n]=s.getCell(o,i,n);return a}}}return s.getValue(e)}function vt(s,e){if(e.startsWith("count:")){let t=e.slice(6);return s.getRowCount(t)}if(e.startsWith("sum:")){let[t,o]=e.split(":"),[i,r]=o.split("/"),l=0,a=s.getRowIds(i);for(let n of a){let u=s.getCell(i,n,r);typeof u=="number"&&(l+=u)}return l}if(e.startsWith("avg:")){let[t,o]=e.split(":"),[i,r]=o.split("/"),l=0,a=0,n=s.getRowIds(i);for(let u of n){let c=s.getCell(i,u,r);typeof c=="number"&&(l+=c,a++)}return a>0?l/a:0}return K(s,e)}var U=null;function z(s){U=s}function G(s,e){let t=e.trim();if(t!==""){if(t.startsWith('"')&&t.endsWith('"')||t.startsWith("'")&&t.endsWith("'"))return t.slice(1,-1);if(!(t.startsWith('"')&&!t.endsWith('"')||t.startsWith("'")&&!t.endsWith("'"))){if(t==="true")return!0;if(t==="false")return!1;if(t==="null")return null;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t.includes("|")){let[o,...i]=t.split("|").map(a=>a.trim()),l=G(s,o);for(let a of i){let[n,...u]=a.split(/\s+/);l=xt(l,n,u)}return l}if(t.startsWith("item.")||t==="item"){if(t==="item")return U;let o=t.slice(5);return L(U,o)}if(t.startsWith("state.")||t==="state"){if(t==="state")return;let o=t.slice(6);return $t(s,o)}return K(s,t)}}}function xt(s,e,t){switch(e){case"values":return Array.isArray(s)?s:s&&typeof s=="object"?Object.values(s):[];case"keys":return s&&typeof s=="object"?Object.keys(s):[];case"count":case"length":return Array.isArray(s)?s.length:s&&typeof s=="object"?Object.keys(s).length:typeof s=="string"?s.length:0;case"sum":return Array.isArray(s)?s.reduce((o,i)=>o+(typeof i=="number"?i:0),0):0;case"first":return Array.isArray(s)?s[0]:void 0;case"last":return Array.isArray(s)?s[s.length-1]:void 0;default:return s}}function L(s,e){if(!s||typeof s!="object"||!e||!H(e))return;let t=e.split(".");if(t.length>32)return;let o=s;for(let i of t){if(o==null)return;o=o[i]}return o}function $t(s,e){let t=s.getValue(e);if(t!==void 0)return t;let o=e.split(".");if(o.length>=3){let[r,l,a,...n]=o;if(s.hasTable(r)&&s.hasRow(r,l)){let u=s.getCell(r,l,a);if(n.length===0)return u;if(typeof u=="string")try{let c=JSON.parse(u);return L(c,n.join("."))}catch{}return}}if(o.length>=2){let[r,l,...a]=o;if(s.hasTable(r)&&s.hasRow(r,l)){let n=s.getRow(r,l);return a.length===0?n:L(n,a.join("."))}}if(o.length>=1){let[r,...l]=o;if(s.hasTable(r)){let a=s.getRowIds(r),n={};for(let u of a)n[u]=s.getRow(r,u);return l.length===0?n:L(n,l.join("."))}}let i=s.getValue(o[0]);if(typeof i=="string"&&o.length>1)try{let r=JSON.parse(i);return L(r,o.slice(1).join("."))}catch{}}function M(s,e){if(typeof e!="string"){if(e!==null&&typeof e=="object"){let t=e;if("$expr"in t)return M(s,`$expr:${t.$expr}`);if("$state"in t)return M(s,`$state:${t.$state}`);if("$computed"in t)return M(s,`$computed:${t.$computed}`);if("$item"in t)return M(s,`$item:${t.$item}`)}return e}if(e.startsWith("$state:")){let t=e.slice(7);return H(t)?K(s,t):void 0}if(e.startsWith("$computed:")){let t=e.slice(10);return t.length>1024?void 0:vt(s,t)}if(e.startsWith("$item:")){let t=e.slice(6);return H(t)?t.includes(".")?L(U,t):U?.[t]:void 0}if(e.startsWith("$expr:")){let t=e.slice(6);return t.length>1024?void 0:G(s,t)}return e.length>4096?e:e.includes("{{")&&e.includes("}}")?wt(e,s):e}function wt(s,e){let t="",o=0;for(;o<s.length;)if(s[o]==="{"&&s[o+1]==="{"){let i=o+2,r=1,l=i;for(;l<s.length-1&&r>0;){let a=s[l],n=s[l+1];a==="{"&&n==="{"?(r++,l+=2):a==="}"&&n==="}"?(r--,l+=2):l++}if(r)t+=s[o++];else{let a=s.slice(i,l-2);if(a.length<=256){let n=G(e,a.trim());t+=n==null?"":String(n)}else t+=s.slice(o,l);o=l}}else t+=s[o++];return t}function kt(s){if(!s)return{};let e={};for(let[t,o]of Object.entries(s.tables)){e[t]={};for(let[i,r]of Object.entries(o.columns))e[t][i]={type:r.type}}return e}function J(s){let e=yt();if(s.schema){let t=kt(s.schema);e.setTablesSchema(t)}if(s.initialState)for(let[t,o]of Object.entries(s.initialState))typeof o=="string"||typeof o=="number"||typeof o=="boolean"?e.setValue(t,o):typeof o=="object"&&o!==null&&e.setValue(t,JSON.stringify(o));return e}function Y(s,e){let{type:t,path:o,operation:i,key:r,value:l}=e;if(t!=="mutateState"||!o)return!1;switch(i){case"set":{if(o.includes("/")){let a=o.split("/");if(a.length===3){let[n,u,c]=a;return s.setCell(n,u,c,l),!0}}return s.setValue(o,l),!0}case"append":{let a=o,n=r||`row_${Date.now()}`;if(typeof l=="object"&&l!==null){for(let[u,c]of Object.entries(l))(typeof c=="string"||typeof c=="number"||typeof c=="boolean")&&s.setCell(a,n,u,c);return!0}return!1}case"delete":{let a=o,n=r;return n?(s.delRow(a,n),!0):!1}case"update":{let a=o,n=r;if(n&&typeof l=="object"&&l!==null){for(let[u,c]of Object.entries(l))(typeof c=="string"||typeof c=="number"||typeof c=="boolean")&&s.setCell(a,n,u,c);return!0}return!1}case"increment":{if(o.includes("/")){let n=o.split("/");if(n.length===3){let[u,c,p]=n,g=s.getCell(u,c,p);if(typeof g=="number")return s.setCell(u,c,p,g+(l||1)),!0}}let a=s.getValue(o);return typeof a=="number"?(s.setValue(o,a+(l||1)),!0):!1}case"decrement":{if(o.includes("/")){let n=o.split("/");if(n.length===3){let[u,c,p]=n,g=s.getCell(u,c,p);if(typeof g=="number")return s.setCell(u,c,p,g-(l||1)),!0}}let a=s.getValue(o);return typeof a=="number"?(s.setValue(o,a-(l||1)),!0):!1}case"toggle":{if(o.includes("/")){let n=o.split("/");if(n.length===3){let[u,c,p]=n,g=s.getCell(u,c,p);if(typeof g=="boolean")return s.setCell(u,c,p,!g),!0}}let a=s.getValue(o);return typeof a=="boolean"?(s.setValue(o,!a),!0):!1}default:return!1}}var Je={Stack:"layout",Grid:"layout",Card:"layout",Container:"layout",Tabs:"layout",Accordion:"layout",Divider:"layout",Spacer:"layout",Repeater:"layout",Text:"content",Image:"content",Icon:"content",Badge:"content",Avatar:"content",EmptyState:"content",TextInput:"input",NumberInput:"input",Select:"input",MultiSelect:"input",Checkbox:"input",Toggle:"input",DatePicker:"input",Slider:"input",FileUpload:"input",Button:"action",ButtonGroup:"action",Link:"action",Table:"data",List:"data",Chart:"data",Metric:"data",Alert:"feedback",Dialog:"feedback",Progress:"feedback",Toast:"feedback",Breadcrumb:"navigation",Stepper:"navigation",Drawing:"drawing"},St={layout:["Stack","Grid","Card","Container","Tabs","Accordion","Divider","Spacer","Repeater"],content:["Text","Image","Icon","Badge","Avatar","EmptyState"],input:["TextInput","NumberInput","Select","MultiSelect","Checkbox","Toggle","DatePicker","Slider","FileUpload"],action:["Button","ButtonGroup","Link"],data:["Table","List","Chart","Metric"],feedback:["Alert","Dialog","Progress","Toast"],navigation:["Breadcrumb","Stepper"],drawing:["Drawing"]},Ye=St,Ze=Object.keys(Je);function D(s){return s in Je}import Qe from"ajv/dist/runtime/ucs2length.js";var et=tt,Xe={type:"object",required:["manifest","id","root","elements"],additionalProperties:!1,properties:{manifest:{type:"string",pattern:"^0\\.\\d+\\.\\d+$"},id:{type:"string",minLength:1,maxLength:128},root:{type:"string",minLength:1},schema:{type:"object",additionalProperties:!1,properties:{version:{type:"integer",minimum:1},tables:{type:"object"},migrations:{type:"array"},views:{type:"object"}}},state:{type:"object"},elements:{type:"object",minProperties:1,additionalProperties:{type:"object",required:["type"],additionalProperties:!1,properties:{type:{type:"string",enum:["Stack","Grid","Card","Container","Tabs","Accordion","Divider","Spacer","Repeater","Text","Image","Icon","Badge","Avatar","EmptyState","TextInput","NumberInput","Select","MultiSelect","Checkbox","Toggle","DatePicker","Slider","FileUpload","Button","ButtonGroup","Link","Table","List","Chart","Metric","Alert","Dialog","Progress","Toast","Breadcrumb","Stepper","Drawing"]},props:{type:"object"},children:{type:"array",items:{type:"string"}},visible:{type:"object"}}}},actions:{type:"object"},meta:{type:"object"},persistState:{type:"boolean"},skipPersistState:{type:"boolean"},dataAccess:{type:"object",additionalProperties:!1,properties:{enabled:{type:"boolean"},readable:{type:"array",items:{type:"string"}},restricted:{type:"array",items:{type:"string"}},summaries:{type:"boolean"}}}}},At=Object.prototype.hasOwnProperty,Z=Qe.default??Qe,_t=new RegExp("^0\\.\\d+\\.\\d+$","u");function tt(s,{instancePath:e="",parentData:t,parentDataProperty:o,rootData:i=s}={}){let r=null,l=0;if(s&&typeof s=="object"&&!Array.isArray(s)){if(s.manifest===void 0){let a={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"manifest"},message:"must have required property 'manifest'"};r===null?r=[a]:r.push(a),l++}if(s.id===void 0){let a={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};r===null?r=[a]:r.push(a),l++}if(s.root===void 0){let a={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"root"},message:"must have required property 'root'"};r===null?r=[a]:r.push(a),l++}if(s.elements===void 0){let a={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"elements"},message:"must have required property 'elements'"};r===null?r=[a]:r.push(a),l++}for(let a in s)if(!At.call(Xe.properties,a)){let n={instancePath:e,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:a},message:"must NOT have additional properties"};r===null?r=[n]:r.push(n),l++}if(s.manifest!==void 0){let a=s.manifest;if(typeof a=="string"){if(!_t.test(a)){let n={instancePath:e+"/manifest",schemaPath:"#/properties/manifest/pattern",keyword:"pattern",params:{pattern:"^0\\.\\d+\\.\\d+$"},message:'must match pattern "^0\\.\\d+\\.\\d+$"'};r===null?r=[n]:r.push(n),l++}}else{let n={instancePath:e+"/manifest",schemaPath:"#/properties/manifest/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[n]:r.push(n),l++}}if(s.id!==void 0){let a=s.id;if(typeof a=="string"){if(Z(a)>128){let n={instancePath:e+"/id",schemaPath:"#/properties/id/maxLength",keyword:"maxLength",params:{limit:128},message:"must NOT have more than 128 characters"};r===null?r=[n]:r.push(n),l++}if(Z(a)<1){let n={instancePath:e+"/id",schemaPath:"#/properties/id/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};r===null?r=[n]:r.push(n),l++}}else{let n={instancePath:e+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[n]:r.push(n),l++}}if(s.root!==void 0){let a=s.root;if(typeof a=="string"){if(Z(a)<1){let n={instancePath:e+"/root",schemaPath:"#/properties/root/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};r===null?r=[n]:r.push(n),l++}}else{let n={instancePath:e+"/root",schemaPath:"#/properties/root/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[n]:r.push(n),l++}}if(s.schema!==void 0){let a=s.schema;if(a&&typeof a=="object"&&!Array.isArray(a)){for(let n in a)if(!(n==="version"||n==="tables"||n==="migrations"||n==="views")){let u={instancePath:e+"/schema",schemaPath:"#/properties/schema/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:n},message:"must NOT have additional properties"};r===null?r=[u]:r.push(u),l++}if(a.version!==void 0){let n=a.version;if(!(typeof n=="number"&&!(n%1)&&!isNaN(n)&&isFinite(n))){let u={instancePath:e+"/schema/version",schemaPath:"#/properties/schema/properties/version/type",keyword:"type",params:{type:"integer"},message:"must be integer"};r===null?r=[u]:r.push(u),l++}if(typeof n=="number"&&isFinite(n)&&(n<1||isNaN(n))){let u={instancePath:e+"/schema/version",schemaPath:"#/properties/schema/properties/version/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};r===null?r=[u]:r.push(u),l++}}if(a.tables!==void 0){let n=a.tables;if(!(n&&typeof n=="object"&&!Array.isArray(n))){let u={instancePath:e+"/schema/tables",schemaPath:"#/properties/schema/properties/tables/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[u]:r.push(u),l++}}if(a.migrations!==void 0&&!Array.isArray(a.migrations)){let n={instancePath:e+"/schema/migrations",schemaPath:"#/properties/schema/properties/migrations/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[n]:r.push(n),l++}if(a.views!==void 0){let n=a.views;if(!(n&&typeof n=="object"&&!Array.isArray(n))){let u={instancePath:e+"/schema/views",schemaPath:"#/properties/schema/properties/views/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[u]:r.push(u),l++}}}else{let n={instancePath:e+"/schema",schemaPath:"#/properties/schema/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),l++}}if(s.state!==void 0){let a=s.state;if(!(a&&typeof a=="object"&&!Array.isArray(a))){let n={instancePath:e+"/state",schemaPath:"#/properties/state/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),l++}}if(s.elements!==void 0){let a=s.elements;if(a&&typeof a=="object"&&!Array.isArray(a)){if(Object.keys(a).length<1){let n={instancePath:e+"/elements",schemaPath:"#/properties/elements/minProperties",keyword:"minProperties",params:{limit:1},message:"must NOT have fewer than 1 properties"};r===null?r=[n]:r.push(n),l++}for(let n in a){let u=a[n];if(u&&typeof u=="object"&&!Array.isArray(u)){if(u.type===void 0){let c={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};r===null?r=[c]:r.push(c),l++}for(let c in u)if(!(c==="type"||c==="props"||c==="children"||c==="visible")){let p={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:c},message:"must NOT have additional properties"};r===null?r=[p]:r.push(p),l++}if(u.type!==void 0){let c=u.type;if(typeof c!="string"){let p={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/elements/additionalProperties/properties/type/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[p]:r.push(p),l++}if(!(c==="Stack"||c==="Grid"||c==="Card"||c==="Container"||c==="Tabs"||c==="Accordion"||c==="Divider"||c==="Spacer"||c==="Repeater"||c==="Text"||c==="Image"||c==="Icon"||c==="Badge"||c==="Avatar"||c==="EmptyState"||c==="TextInput"||c==="NumberInput"||c==="Select"||c==="MultiSelect"||c==="Checkbox"||c==="Toggle"||c==="DatePicker"||c==="Slider"||c==="FileUpload"||c==="Button"||c==="ButtonGroup"||c==="Link"||c==="Table"||c==="List"||c==="Chart"||c==="Metric"||c==="Alert"||c==="Dialog"||c==="Progress"||c==="Toast"||c==="Breadcrumb"||c==="Stepper"||c==="Drawing")){let p={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/elements/additionalProperties/properties/type/enum",keyword:"enum",params:{allowedValues:Xe.properties.elements.additionalProperties.properties.type.enum},message:"must be equal to one of the allowed values"};r===null?r=[p]:r.push(p),l++}}if(u.props!==void 0){let c=u.props;if(!(c&&typeof c=="object"&&!Array.isArray(c))){let p={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1")+"/props",schemaPath:"#/properties/elements/additionalProperties/properties/props/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[p]:r.push(p),l++}}if(u.children!==void 0){let c=u.children;if(Array.isArray(c)){let p=c.length;for(let g=0;g<p;g++)if(typeof c[g]!="string"){let w={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1")+"/children/"+g,schemaPath:"#/properties/elements/additionalProperties/properties/children/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[w]:r.push(w),l++}}else{let p={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1")+"/children",schemaPath:"#/properties/elements/additionalProperties/properties/children/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[p]:r.push(p),l++}}if(u.visible!==void 0){let c=u.visible;if(!(c&&typeof c=="object"&&!Array.isArray(c))){let p={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1")+"/visible",schemaPath:"#/properties/elements/additionalProperties/properties/visible/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[p]:r.push(p),l++}}}else{let c={instancePath:e+"/elements/"+n.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[c]:r.push(c),l++}}}else{let n={instancePath:e+"/elements",schemaPath:"#/properties/elements/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),l++}}if(s.actions!==void 0){let a=s.actions;if(!(a&&typeof a=="object"&&!Array.isArray(a))){let n={instancePath:e+"/actions",schemaPath:"#/properties/actions/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),l++}}if(s.meta!==void 0){let a=s.meta;if(!(a&&typeof a=="object"&&!Array.isArray(a))){let n={instancePath:e+"/meta",schemaPath:"#/properties/meta/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),l++}}if(s.persistState!==void 0&&typeof s.persistState!="boolean"){let a={instancePath:e+"/persistState",schemaPath:"#/properties/persistState/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[a]:r.push(a),l++}if(s.skipPersistState!==void 0&&typeof s.skipPersistState!="boolean"){let a={instancePath:e+"/skipPersistState",schemaPath:"#/properties/skipPersistState/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[a]:r.push(a),l++}if(s.dataAccess!==void 0){let a=s.dataAccess;if(a&&typeof a=="object"&&!Array.isArray(a)){for(let n in a)if(!(n==="enabled"||n==="readable"||n==="restricted"||n==="summaries")){let u={instancePath:e+"/dataAccess",schemaPath:"#/properties/dataAccess/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:n},message:"must NOT have additional properties"};r===null?r=[u]:r.push(u),l++}if(a.enabled!==void 0&&typeof a.enabled!="boolean"){let n={instancePath:e+"/dataAccess/enabled",schemaPath:"#/properties/dataAccess/properties/enabled/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[n]:r.push(n),l++}if(a.readable!==void 0){let n=a.readable;if(Array.isArray(n)){let u=n.length;for(let c=0;c<u;c++)if(typeof n[c]!="string"){let p={instancePath:e+"/dataAccess/readable/"+c,schemaPath:"#/properties/dataAccess/properties/readable/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[p]:r.push(p),l++}}else{let u={instancePath:e+"/dataAccess/readable",schemaPath:"#/properties/dataAccess/properties/readable/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[u]:r.push(u),l++}}if(a.restricted!==void 0){let n=a.restricted;if(Array.isArray(n)){let u=n.length;for(let c=0;c<u;c++)if(typeof n[c]!="string"){let p={instancePath:e+"/dataAccess/restricted/"+c,schemaPath:"#/properties/dataAccess/properties/restricted/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[p]:r.push(p),l++}}else{let u={instancePath:e+"/dataAccess/restricted",schemaPath:"#/properties/dataAccess/properties/restricted/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[u]:r.push(u),l++}}if(a.summaries!==void 0&&typeof a.summaries!="boolean"){let n={instancePath:e+"/dataAccess/summaries",schemaPath:"#/properties/dataAccess/properties/summaries/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[n]:r.push(n),l++}}else{let n={instancePath:e+"/dataAccess",schemaPath:"#/properties/dataAccess/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),l++}}}else{let a={instancePath:e,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[a]:r.push(a),l++}return tt.errors=r,l===0}var X=et,rt=["javascript:","data:text/html","data:text/javascript","data:application/javascript","vbscript:","file:"],Pt=["https:","http:","data:image/","data:font/","data:application/octet-stream","mailto:","tel:","#"],Ct=/^on[a-z]+$/i,ot=[/<\s*script/i,/<\s*iframe/i,/<\s*object/i,/<\s*embed/i,/javascript\s*:/i,/data\s*:\s*text\/html/i,/expression\s*\(/i,/url\s*\(\s*javascript/i];function Q(s){let e=[];if(!X(s)&&X.errors){for(let r of X.errors)e.push({path:r.instancePath||"/",message:r.message||"Schema validation error",severity:"error"});return{valid:!1,errors:e,warnings:[]}}let o=s;Et(o,e),jt(o,e),Mt(o,e),It(o,e);let i=JSON.stringify(o).length;return i>1e5&&e.push({path:"/",message:`Manifest size (${(i/1024).toFixed(1)}KB) exceeds 100KB limit`,severity:"warning"}),{valid:!e.some(r=>r.severity==="error"),errors:e.filter(r=>r.severity==="error"),warnings:e.filter(r=>r.severity!=="error")}}function Et(s,e){for(let[t,o]of Object.entries(s.elements))if(o.props){for(let[i,r]of Object.entries(o.props))if(typeof r=="string"){for(let l of ot)l.test(r)&&e.push({path:`/elements/${t}/props/${i}`,message:`Potentially dangerous content detected (matches ${l.source})`,severity:"error"});if(it(r)){let l=r.toLowerCase().trim();for(let a of rt)l.startsWith(a)&&e.push({path:`/elements/${t}/props/${i}`,message:`Dangerous URL scheme rejected: ${a}`,severity:"error"});Pt.some(a=>l.startsWith(a))||l.startsWith("data:")&&e.push({path:`/elements/${t}/props/${i}`,message:`Data URL scheme not in allowlist: ${l.split(";")[0]}`,severity:"warning"})}Ct.test(i)&&e.push({path:`/elements/${t}/props/${i}`,message:`Event handler property not allowed: ${i}`,severity:"error"})}if(o.children){for(let i of o.children)if(typeof i=="string")for(let r of ot)r.test(i)&&e.push({path:`/elements/${t}/children`,message:`Potentially dangerous content in children: ${r.source}`,severity:"error"})}}if(s.actions){for(let[t,o]of Object.entries(s.actions))if(o.data){for(let[i,r]of Object.entries(o.data))if(typeof r=="string"&&it(r)){let l=r.toLowerCase().trim();for(let a of rt)l.startsWith(a)&&e.push({path:`/actions/${t}/data/${i}`,message:`Dangerous URL scheme in action data: ${a}`,severity:"error"})}}}}function it(s){return/^[a-z][a-z0-9+.-]*:/i.test(s)}function jt(s,e){let t=s.schema?.tables?Object.keys(s.schema.tables):[],o=new Set;if(s.state)for(let i of Object.keys(s.state))o.add(i);if(!(t.length===0&&o.size===0)){for(let[i,r]of Object.entries(s.elements))if(r.props)for(let[l,a]of Object.entries(r.props)){if(typeof a=="string"&&a.startsWith("$state:")){let n=a.slice(7),u=n.split("/")[0].split(".")[0];u&&!o.has(u)&&!t.includes(u)&&e.push({path:`/elements/${i}/props/${l}`,message:`$state:${n} references unknown state path`,severity:"warning"})}if(typeof a=="string"&&a.startsWith("$computed:")){let n=a.slice(10);if(n.startsWith("sum:")||n.startsWith("avg:")){let[u,c]=n.split(":"),[p,g]=c.split("/");t.includes(p)?g&&s.schema?.tables[p]&&(Object.keys(s.schema.tables[p].columns).includes(g)||e.push({path:`/elements/${i}/props/${l}`,message:`$computed references unknown column: ${p}/${g}`,severity:"error"})):e.push({path:`/elements/${i}/props/${l}`,message:`$computed references unknown table: ${p}`,severity:"error"})}else if(n.startsWith("count:")){let u=n.slice(6);t.includes(u)||e.push({path:`/elements/${i}/props/${l}`,message:`$computed:count references unknown table: ${u}`,severity:"error"})}}}}}function Mt(s,e){for(let[t,o]of Object.entries(s.elements))D(o.type)||e.push({path:`/elements/${t}/type`,message:`Unknown component type: ${o.type}`,severity:"error"})}function It(s,e){let t=new Set(Object.keys(s.elements));t.has(s.root)||e.push({path:"/root",message:`Root element "${s.root}" not found in elements`,severity:"error"});for(let[o,i]of Object.entries(s.elements))if(i.children)for(let r of i.children)t.has(r)||e.push({path:`/elements/${o}/children`,message:`Child element "${r}" not found in elements`,severity:"error"});Tt(s,e)}function Tt(s,e){let t=new Set,o=new Set;function i(r,l){if(o.has(r))return e.push({path:`/elements/${r}`,message:`Circular reference detected: ${[...l,r].join(" \u2192 ")}`,severity:"error"}),!0;if(t.has(r))return!1;t.add(r),o.add(r);let a=s.elements[r];if(a?.children){for(let n of a.children)if(i(n,[...l,r]))return!0}return o.delete(r),!1}i(s.root,[])}function Rt(s){let e=s.trim(),t=e.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);return t?t[1].trim():e}import{html as f}from"lit";function st(s){return ee(s.manifest.root,s)}function ee(s,e){try{let t=e.manifest.elements[s];if(!t)return f``;if(t.visible&&!zt(t.visible,e))return f``;let o=t.type;if(o==="Repeater")return Lt(t,e);let i=at(t.props||{},e),r=(t.children||[]).map(l=>ee(l,e));switch(o){case"Stack":return f`<forgeui-stack .props=${i} .store=${e.store} .onAction=${e.onAction} .itemContext=${e.itemContext||null}>${r}</forgeui-stack>`;case"Grid":return f`<forgeui-grid .props=${i} .store=${e.store} .onAction=${e.onAction}>${r}</forgeui-grid>`;case"Card":return f`<forgeui-card .props=${i} .store=${e.store} .onAction=${e.onAction}>${r}</forgeui-card>`;case"Container":return f`<forgeui-container .props=${i} .store=${e.store}>${r}</forgeui-container>`;case"Tabs":return f`<forgeui-tabs .props=${i} .store=${e.store} .onAction=${e.onAction}>${r}</forgeui-tabs>`;case"Accordion":return f`<forgeui-accordion .props=${i} .store=${e.store}>${r}</forgeui-accordion>`;case"Divider":return f`<forgeui-divider .props=${i} .store=${e.store}></forgeui-divider>`;case"Spacer":return f`<forgeui-spacer .props=${i} .store=${e.store}></forgeui-spacer>`;case"Text":return f`<forgeui-text .props=${i} .store=${e.store}></forgeui-text>`;case"Image":return f`<forgeui-image .props=${i} .store=${e.store}></forgeui-image>`;case"Icon":return f`<forgeui-icon .props=${i} .store=${e.store}></forgeui-icon>`;case"Badge":return f`<forgeui-badge .props=${i} .store=${e.store}></forgeui-badge>`;case"Avatar":return f`<forgeui-avatar .props=${i} .store=${e.store}></forgeui-avatar>`;case"EmptyState":return f`<forgeui-empty-state .props=${i} .store=${e.store}></forgeui-empty-state>`;case"TextInput":return f`<forgeui-text-input .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-text-input>`;case"NumberInput":return f`<forgeui-number-input .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-number-input>`;case"Select":return f`<forgeui-select .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-select>`;case"MultiSelect":return f`<forgeui-multi-select .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-multi-select>`;case"Checkbox":return f`<forgeui-checkbox .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-checkbox>`;case"Toggle":return f`<forgeui-toggle .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-toggle>`;case"DatePicker":return f`<forgeui-date-picker .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-date-picker>`;case"Slider":return f`<forgeui-slider .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-slider>`;case"FileUpload":return f`<forgeui-file-upload .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-file-upload>`;case"Button":return f`<forgeui-button .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-button>`;case"ButtonGroup":return f`<forgeui-button-group .props=${i} .store=${e.store} .onAction=${e.onAction}>${r}</forgeui-button-group>`;case"Link":return f`<forgeui-link .props=${i} .store=${e.store}></forgeui-link>`;case"Table":return f`<forgeui-table .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-table>`;case"List":return f`<forgeui-list .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-list>`;case"Chart":return f`<forgeui-chart .props=${i} .store=${e.store}></forgeui-chart>`;case"Metric":return f`<forgeui-metric .props=${i} .store=${e.store}></forgeui-metric>`;case"Alert":return f`<forgeui-alert .props=${i} .store=${e.store}>${r}</forgeui-alert>`;case"Dialog":return f`<forgeui-dialog .props=${i} .store=${e.store} .onAction=${e.onAction}>${r}</forgeui-dialog>`;case"Progress":return f`<forgeui-progress .props=${i} .store=${e.store}></forgeui-progress>`;case"Toast":return f`<forgeui-toast .props=${i} .store=${e.store}></forgeui-toast>`;case"Breadcrumb":return f`<forgeui-breadcrumb .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-breadcrumb>`;case"Stepper":return f`<forgeui-stepper .props=${i} .store=${e.store} .onAction=${e.onAction}>${r}</forgeui-stepper>`;case"Drawing":return f`<forgeui-drawing .props=${i} .store=${e.store} .onAction=${e.onAction}></forgeui-drawing>`;default:return f`<forgeui-error .props=${{msg:`Unknown: ${o}`}} .store=${e.store}></forgeui-error>`}}catch(t){return console.warn(`[forgeui] renderElement("${s}") threw:`,t?.message||t),f`<forgeui-error .props=${{msg:`Element "${s}" failed to render: ${t?.message||"unknown error"}`}} .store=${e.store}></forgeui-error>`}}function Lt(s,e){let t=at(s.props||{},e),o=t.data,i=[];Array.isArray(o)?i=o:o&&typeof o=="object"&&(i=Object.values(o));let r=s.children||[];if(r.length===0)return f`<forgeui-repeater .props=${t} .store=${e.store}></forgeui-repeater>`;let l=[];for(let a=0;a<i.length;a++){let n=i[a],u=typeof n=="object"&&n!==null?{...n,_index:a}:{value:n,_index:a},c={...e,itemContext:u};z(u);try{for(let p of r)l.push(ee(p,c))}finally{z(null)}}return i.length===0?f`<forgeui-repeater .props=${t} .store=${e.store}></forgeui-repeater>`:f`<forgeui-repeater .props=${t} .store=${e.store}>${l}</forgeui-repeater>`}function at(s,e){let t={};for(let[o,i]of Object.entries(s))t[o]=M(e.store,i);return t}function zt(s,e){if(!s||typeof s!="object")return!0;let t=s.$when??s;if(!t||typeof t!="object")return!0;let{path:o,eq:i,neq:r,gt:l,gte:a,lt:n,lte:u,in:c,exists:p}=t;if(!o||typeof o!="string")return!0;let g=M(e.store,`$state:${o}`);return p!==void 0?p?g!==void 0:g===void 0:i!==void 0?g===i:r!==void 0?g!==r:l!==void 0&&typeof g=="number"?g>l:a!==void 0&&typeof g=="number"?g>=a:n!==void 0&&typeof g=="number"?g<n:u!==void 0&&typeof g=="number"?g<=u:c!==void 0&&Array.isArray(c)?c.includes(g):!0}import{css as te}from"lit";var nt=te`
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
`,lt=te`
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
`,re=te`
  :host {
    display: block;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;function oe(s="default"){switch(s){case"minimal":return ct();case"default":return ut();case"full":return Nt()}}function ct(){return["You can create interactive web applications by generating Forge manifests \u2014 declarative JSON that describes UI, data, and behavior. You never write code.","","MANIFEST STRUCTURE:","{",'  "manifest": "0.1.0",','  "id": "my-app",','  "root": "root-element-id",','  "state": { "key": "initial value" },','  "elements": {','    "root-element-id": {','      "type": "Stack",','      "props": { "spacing": "md" },','      "children": ["child1", "child2"]',"    }","  },",'  "actions": { "actionName": { "type": "mutateState", "path": "state/path" } }',"}","",'ELEMENT FORMAT: { "type": "ComponentName", "props": {}, "children": ["id"] }','Root element is set in "root" field. All elements are a flat map \u2014 reference by ID, never nest.',"","COMPONENTS (37 types):",Object.entries(Ye).map(([t,o])=>`  ${t}: ${o.join(", ")}`).join(`
`),"","STATE BINDINGS:","  $state:path         \u2014 reactive value","  $computed:path       \u2014 derived from table data","  $item:field          \u2014 current item in Repeater","  $form:fieldId        \u2014 value from input component","","DESIGN TOKENS:","  Spacing: xs, sm, md, lg, xl","  Colors: primary, secondary, success, warning, error, muted, default","  Sizes: sm, md, lg","  Radius: none, sm, md, lg, full","","Never use raw CSS values, hex colors, or pixel sizes. Always use tokens.","","EXAMPLE:","{",'  "manifest": "0.1.0", "id": "hello", "root": "root",','  "elements": {','    "root": { "type": "Card", "props": { "title": "Hello World" }, "children": ["msg", "btn"] },','    "msg": { "type": "Text", "props": { "content": "Welcome to Forge!", "variant": "heading2" } },','    "btn": { "type": "Button", "props": { "label": "Click Me", "action": "greet" } }',"  },",'  "actions": { "greet": { "type": "setState", "path": "greeting", "value": "Hello!" } }',"}"].join(`
`)}function ut(){return[ct(),"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","DETAILED COMPONENT REFERENCE","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","LAYOUT:",'  Stack(spacing, direction: "vertical"|"horizontal", align: "start"|"center"|"end"|"stretch", gap)','  Grid(columns: number|"auto", gap, minChildWidth)','  Card(title?, variant: "default"|"outlined"|"elevated"|"compact", padding)','  Container(maxWidth: "sm"|"md"|"lg"|"xl"|"full", padding)',"  Tabs(items: string[], bind: $state:path)","  Accordion(items: [{title, contentId}], multiple?: boolean)",'  Divider(direction: "horizontal"|"vertical", spacing)',"  Spacer(size)","","CONTENT:",'  Text(content: string|$binding, variant: "body"|"heading1"|"heading2"|"heading3"|"caption"|"label"|"code", weight, color, align)','  Image(src, alt, aspectRatio: "auto"|"1:1"|"4:3"|"16:9", fit: "cover"|"contain"|"fill", radius)',"  Icon(name, size, color)",'  Badge(text|$binding, colorScheme, variant: "solid"|"subtle"|"outline")',"  Avatar(src?, name, size)","  EmptyState(title, description, icon?, actionLabel?, action?)","","INPUT:","  TextInput(label, placeholder?, bind: $state:path, multiline?, required?, maxLength?)","  NumberInput(label, bind: $state:path, min?, max?, step?, required?)","  Select(label, options: [{value, label}]|string[], bind: $state:path, placeholder?, required?)","  MultiSelect(label, options: [{value, label}]|string[], bind: $state:path, maxSelections?)","  Checkbox(label, bind: $state:path, description?)","  Toggle(label, bind: $state:path, description?)",'  DatePicker(label, bind: $state:path, format: "date"|"datetime"|"time", min?, max?)',"  Slider(label, bind: $state:path, min, max, step, showValue?)","  FileUpload(label, accept?, maxSize?, multiple?, bind: $state:path)","","ACTION:",'  Button(label, action, variant: "primary"|"secondary"|"danger"|"ghost", size, icon?, disabled?)','  ButtonGroup(direction: "horizontal"|"vertical", spacing)','  Link(label, href, variant: "default"|"subtle"|"bold", external?)',"","DATA:","  Table(dataPath, columns: [{key, label, sortable?, format?}], pageSize?, searchable?, emptyMessage?)","  List(dataPath, template: elementId, emptyMessage?, dividers?)",'  Chart(variant: "line"|"bar"|"donut"|"area"|"scatter"|"pie", dataPath, xKey?, yKey?, colorScheme?, height?)','  Metric(label, value|$binding, format: "number"|"currency"|"percent", goal?, trend?: "up"|"down"|"flat", prefix?, suffix?)',"","FEEDBACK:",'  Alert(title, message?, variant: "info"|"success"|"warning"|"error", dismissible?)',"  Dialog(title, trigger: elementId, confirmLabel?, cancelLabel?, action?)",'  Progress(value|$binding, max, variant: "bar"|"ring", size, label?)','  Toast(message, variant: "info"|"success"|"warning"|"error", duration?)',"","NAVIGATION:","  Breadcrumb(items: [{label, view?}])",'  Stepper(steps: [{label, description?}], activeStep: $state:path, variant: "horizontal"|"vertical")',"","DRAWING:","  Drawing(width, height, shapes: Shape[], viewBox?)","  Shape types: rect, circle, ellipse, line, text, arrow, path, icon, badge","  Shapes use design tokens for fill/stroke. Never raw SVG.","","CONDITIONAL RENDERING:",'{ "type": "Alert", "props": { ... }, "visible": { "$when": { "path": "state/path", "gt": 0 } } }',"Operators: eq, neq, gt, lt, gte, lte, in, notIn, exists.","","REPEATER PATTERN:",'{ "type": "Repeater", "props": { "dataPath": "tableName", "template": "templateElementId" } }',"Template element uses $item:field bindings for each row.","","ACTIONS:","  mutateState \u2014 append/update/delete rows in a table. Path is the table name.","  setState \u2014 set a state value.","  submitForm \u2014 collect form inputs and trigger an action.","  navigate \u2014 switch views.","","SCHEMA (optional, for persistent data):",'{ "version": 1, "tables": { "tableName": { "columns": { "col": { "type": "string|number|boolean" } } } } }',"","GUIDELINES:","1. Always use design tokens \u2014 never raw CSS, hex colors, or pixel sizes.","2. Use flat element maps \u2014 reference children by ID, never nest.","3. Use Repeater for lists \u2014 define template once, bind to data.","4. Always handle empty states with EmptyState component.","5. Use conditional visibility for show/hide logic.",'6. State paths use "/" separators: "view/active", "goals/calories".',"7. Actions are declarative \u2014 never write JavaScript.","8. Keep manifests under 100KB."].join(`
`)}function Nt(){return[ut(),"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","DATA ACCESS (Reading App Data)","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","Forge apps can optionally allow the LLM to read user data for personalized updates.","This is DISABLED by default. The user must consent at app creation time.","","PERMISSION DECLARATION:",'{ "dataAccess": { "enabled": true, "readable": ["table1"], "restricted": ["table2"] } }',"  enabled: false (default) \u2014 LLM cannot read any app data.",'  enabled: true \u2014 LLM can read tables in "readable". Tables in "restricted" are never sent.','  Always inform the user: "This app allows the AI to read your [data] for personalized updates."',"","READING DATA VIA TOOLS:","","forgeui_read_app_data \u2014 returns raw rows from permitted tables:",'  Input: { app_id, tables: ["tableName"], limit: 20, since: "2026-04-01" }',"  Output: { schema, data: { tableName: [...rows] }, rowCounts }","","forgeui_query_app_data \u2014 returns aggregated summaries (more token-efficient):",'  Input: { app_id, queries: [{ table, aggregate: "count|max|min|avg|trend", groupBy?, column?, where? }] }',"  Output: { results: [{ data: {...} }] }","","PREFER forgeui_query_app_data over forgeui_read_app_data.","Summaries cost ~50-150 tokens vs. ~2,000+ for raw rows.","","THE DATA INTERACTION LOOP:","1. Read \u2014 call forgeui_query_app_data to understand user data (trends, patterns, gaps)","2. Reason \u2014 identify what should change in the app (adjust targets, add alerts, modify plans)","3. Update \u2014 call forgeui_update_app with a manifest patch to modify the app structure","","The LLM updates the MANIFEST (app structure, plans, goals, UI), not the user's raw data.","Workout logs, tracked meals, journal entries stay untouched in TinyBase.","The LLM modifies the app AROUND the data.","","Example: the LLM reads that squat weight has plateaued for 3 weeks. It sends a manifest patch",'that changes the squat rep scheme from 5\xD75 to 3\xD78, adds an Alert saying "Deload week \u2014 lighter',`weight, more reps," and updates the goal Metric. The user's logged workouts are unchanged \u2014 only the plan adapts.`,"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","EXAMPLE \u2014 HABIT TRACKER","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","{",'  "manifest": "0.1.0",','  "id": "habit-tracker",','  "root": "shell",','  "schema": { "version": 1, "tables": { "habits": { "columns": {','    "name": { "type": "string" },','    "streak": { "type": "number", "default": 0 },','    "done_today": { "type": "boolean", "default": false },','    "icon": { "type": "string", "default": "star" }',"  } } } },",'  "state": { "view/active": "today" },','  "elements": {','    "shell": { "type": "Container", "props": { "maxWidth": "md", "padding": "lg" }, "children": ["header", "tabs", "content"] },','    "header": { "type": "Stack", "props": { "direction": "horizontal", "align": "center", "spacing": "md" }, "children": ["title", "streak-metric"] },','    "title": { "type": "Text", "props": { "content": "Daily Habits", "variant": "heading1" } },','    "streak-metric": { "type": "Metric", "props": { "label": "Best Streak", "value": "$computed:habits/maxStreak", "format": "number", "suffix": " days" } },','    "tabs": { "type": "Tabs", "props": { "items": ["Today", "All Habits", "Add New"], "bind": "$state:view/active" } },','    "content": { "type": "Stack", "props": { "spacing": "md" }, "children": ["habit-list", "empty"] },','    "habit-list": { "type": "Repeater", "props": { "dataPath": "habits", "template": "habit-row" } },','    "habit-row": { "type": "Card", "props": { "variant": "outlined", "padding": "md" }, "children": ["habit-info", "habit-toggle"] },','    "habit-info": { "type": "Stack", "props": { "direction": "horizontal", "align": "center", "spacing": "sm" }, "children": ["habit-icon", "habit-name", "habit-streak"] },','    "habit-icon": { "type": "Icon", "props": { "name": "$item:icon", "size": "md", "color": "primary" } },','    "habit-name": { "type": "Text", "props": { "content": "$item:name", "weight": "medium" } },','    "habit-streak": { "type": "Badge", "props": { "text": "$item:streak", "colorScheme": "success", "variant": "subtle" } },','    "habit-toggle": { "type": "Toggle", "props": { "label": "Done today", "bind": "$item:done_today" } },','    "empty": { "type": "EmptyState", "props": { "title": "No habits yet", "description": "Add your first habit to start tracking", "icon": "plus-circle", "actionLabel": "Add Habit", "action": "show-add-form" }, "visible": { "$when": { "path": "habits", "eq": [] } } }',"  },",'  "actions": {','    "toggle-habit": { "type": "mutateState", "path": "habits", "operation": "update", "key": "{{id}}", "data": { "done_today": "{{!done_today}}" } },','    "add-habit": { "type": "mutateState", "path": "habits", "operation": "append", "data": { "name": "$form:habit-name", "icon": "$form:habit-icon", "streak": 0, "done_today": false } },','    "delete-habit": { "type": "mutateState", "path": "habits", "operation": "delete", "key": "{{id}}" },','    "show-add-form": { "type": "setState", "path": "view/active", "value": "Add New" }',"  }","}","","For sets of repetitive actions (one per day, one per item, etc.), define a single parameterized action and pass the distinguishing value at dispatch time rather than defining one action per item.","","GUIDELINES:","1. Always use design tokens \u2014 never raw CSS, hex colors, or pixel sizes.","2. Keep manifests under ~100KB \u2014 if an app needs more, it outgrew Forge.","3. Use flat element maps \u2014 reference children by ID, never nest.","4. Data tables use pagination \u2014 never dump hundreds of rows; set pageSize on Table.","5. Actions are declarative \u2014 never write JavaScript callbacks or event handlers.","6. Shapes in Drawing are data \u2014 never write raw SVG markup. Use the shape types.",'7. State paths use "/" separators: "view/active", "goals/calories".',"8. Prefer Repeater for lists \u2014 define template once, bind to data path.","9. Always handle empty states with EmptyState component.",'10. Use conditional visibility: "visible": {"$when": {...}} to show/hide elements.',"11. Data access is opt-in \u2014 set dataAccess.enabled: false (or omit) unless user wants LLM to read data.","12. Prefer query over read \u2014 use forgeui_query_app_data for aggregates instead of forgeui_read_app_data.","13. Never modify user data directly \u2014 read to reason, then update the manifest, not the records."].join(`
`)}function ie(){return{type:"object",required:["manifest","id","elements"],properties:{manifest:{type:"string",const:"0.1.0"},id:{type:"string",pattern:"^[a-z0-9][a-z0-9-]*$"},root:{type:"string"},title:{type:"string"},schema:{type:"object",properties:{version:{type:"number"},tables:{type:"object",additionalProperties:{type:"object",properties:{columns:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:["string","number","boolean"]},default:{}},required:["type"]}}},required:["columns"]}}}},state:{type:"object",additionalProperties:{}},elements:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:Ze},props:{type:"object"},children:{type:"array",items:{type:"string"}},visible:{type:"object",properties:{$when:{type:"object",properties:{path:{type:"string"},eq:{},neq:{},gt:{type:"number"},lt:{type:"number"},gte:{type:"number"},lte:{type:"number"},in:{type:"array"},notIn:{type:"array"},exists:{type:"boolean"}},required:["path"]}}}},required:["type"]}},actions:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:["mutateState","setState","navigate","submitForm"]},path:{type:"string"},value:{},operation:{type:"string",enum:["append","update","delete"]},data:{type:"object"},key:{type:"string"},formId:{type:"string"},action:{type:"string"}},required:["type"]}},dataAccess:{type:"object",properties:{enabled:{type:"boolean",default:!1},readable:{type:"array",items:{type:"string"}},restricted:{type:"array",items:{type:"string"}},summaries:{type:"boolean",default:!1}}},persistState:{type:"boolean"},skipPersistState:{type:"boolean"}}}}var Ot={container:"Stack",row:"Stack",column:"Stack",text:"Text",heading:"Text",label:"Text",image:"Image",icon:"Icon",button:"Button",link:"Link",textInput:"TextInput",numberInput:"NumberInput",checkbox:"Checkbox",toggle:"Toggle",select:"Select",divider:"Divider",spacer:"Spacer",card:"Card",table:"Table",list:"List",alert:"Alert",progress:"Progress",badge:"Badge",avatar:"Avatar"};function Ut(s){let e={},t=0;function o(a){let n=a.id||`a2ui-${t++}`,u=Ot[a.type];if(!u||!D(u))return e[n]={type:"Text",props:{content:`[Unsupported A2UI type: ${a.type}]`,variant:"caption",colorScheme:"secondary"}},n;let c=Dt(a.type,a.props||{}),p=(a.children||[]).map(g=>o(g));return e[n]={type:u,props:c,children:p.length>0?p:void 0},n}let r=(s.components||s.content||[]).map(a=>o(a)),l=r.length===1?r[0]:"a2ui-root";return r.length>1&&(e[l]={type:"Stack",props:{gap:"md"},children:r}),{manifest:"0.1.0",id:`a2ui-${Date.now()}`,root:l,elements:e,actions:{}}}function Dt(s,e){let t={...e};switch(s){case"heading":t.variant="heading",t.content=e.text||e.content||"",delete t.text;break;case"text":case"label":t.content=e.text||e.content||"",delete t.text;break;case"row":t.direction="row",t.gap=e.gap||e.spacing||"md";break;case"column":t.direction="column",t.gap=e.gap||e.spacing||"md";break;case"container":t.gap=e.gap||e.spacing||"md";break;case"image":t.src=e.src||e.url||"",t.alt=e.alt||"";break;case"button":t.label=e.text||e.label||"",t.variant=e.variant||e.style||"default";break;case"textInput":t.placeholder=e.placeholder||"",t.value=e.value||"",t.label=e.label||"";break;case"numberInput":t.placeholder=e.placeholder||"",t.value=e.value??0,t.label=e.label||"";break;case"select":e.options&&Array.isArray(e.options)&&(t.options=e.options.map(o=>typeof o=="string"?{value:o,label:o}:o));break;case"alert":t.variant=e.type||e.severity||"info",t.content=e.message||e.text||e.content||"",delete t.message,delete t.text;break;case"progress":t.value=e.value??e.percent??0;break}return t}function dt(s){if(!s||typeof s!="object")return!1;let e=s;return!!(Array.isArray(e.components)||Array.isArray(e.content)||typeof e.type=="string"&&(e.type==="adaptive-card"||e.type.startsWith("a2ui"))||typeof e.version=="string"&&e.version.startsWith("a2ui")||!e.elements&&!e.manifest&&Array.isArray(e.content))}function se(s){return dt(s)?Ut(s):s}function Vt(s){return`forgeui_${(s||"global").replace(/[^a-zA-Z0-9-]/g,"_")}`}function pt(s,e,t="none"){let o=Vt(e),i=t,r=null,l=!1,a=!1,n=null,u=null,c=null,p=[];function g(){let b=w();for(let v of p)try{v(b)}catch{}}function w(){return{mode:i,isPersisting:r!=null&&l,lastSaved:n,lastLoaded:u,error:c,dbName:i==="indexeddb"?o:null}}async function R(){if(r)return r;try{let{createIndexedDbPersister:b}=await import("tinybase/persisters/persister-indexed-db");return r=b(s,o),c=null,r}catch(b){throw c=`IndexedDB unavailable: ${b.message}`,g(),b}}async function N(){if(i==="none")return;let b=await R();try{await b.load(),u=Date.now()}catch(v){c=`Load failed: ${v.message}`,g()}try{b.startAutoSave(),l=!0}catch(v){c=`Auto-save failed: ${v.message}`}try{b.startAutoLoad(1),a=!0}catch(v){c=`Auto-load failed: ${v.message}`}g()}async function x(){if(r){l&&(r.stopAutoSave(),l=!1),a&&(r.stopAutoLoad(),a=!1);try{await r.save(),n=Date.now()}catch(b){c=`Final save failed: ${b.message}`}g()}}async function j(){if(!(i==="none"||!r)){try{await r.save(),n=Date.now(),c=null}catch(b){c=`Save failed: ${b.message}`}g()}}async function E(){if(!(i==="none"||!r)){try{await r.load(),u=Date.now(),c=null}catch(b){c=`Load failed: ${b.message}`}g()}}async function S(){if(await x(),r){try{r.destroy()}catch{}r=null}p=[],g()}function A(b){if(b===i)return;let v=i;i=b,v==="indexeddb"&&b==="none"&&(r&&l&&(r.stopAutoSave(),l=!1),r&&a&&(r.stopAutoLoad(),a=!1)),b==="indexeddb"&&v==="none"&&N().catch(()=>{}),g()}function $(b){return p.push(b),()=>{p=p.filter(v=>v!==b)}}return{start:N,stop:x,save:j,load:E,setMode:A,getStatus:w,addListener:$,destroy:S}}var F=class{constructor(e=50){this._stack=[];this._position=-1;this._listeners=[];this._maxDepth=e}push(e){if(this._position<this._stack.length-1&&(this._stack=this._stack.slice(0,this._position+1)),this._position>=0){let t=this._stack[this._position];if(JSON.stringify(t)===JSON.stringify(e))return}this._stack.push(structuredClone(e)),this._stack.length>this._maxDepth?this._stack.shift():this._position++,this._notifyListeners()}undo(){return this._position<=0?null:(this._position--,this._notifyListeners(),structuredClone(this._stack[this._position]))}redo(){return this._position>=this._stack.length-1?null:(this._position++,this._notifyListeners(),structuredClone(this._stack[this._position]))}current(){return this._position<0?null:structuredClone(this._stack[this._position])}jumpTo(e){return e<0||e>=this._stack.length?null:(this._position=e,this._notifyListeners(),structuredClone(this._stack[this._position]))}getState(){return{canUndo:this._position>0,canRedo:this._position<this._stack.length-1,position:this._position,total:this._stack.length}}getTimeline(){return this._stack.map((e,t)=>({position:t,id:e.id}))}clear(){this._stack=[],this._position=-1,this._notifyListeners()}addListener(e){return this._listeners.push(e),()=>{this._listeners=this._listeners.filter(t=>t!==e)}}_notifyListeners(){let e=this.getState();for(let t of this._listeners)try{t(e)}catch{}}};import{html as d,css as y,svg as I,nothing as h}from"lit";import{LitElement as qt}from"lit";var B=class B extends qt{constructor(){super(...arguments);this._instanceId=`forge-${++B._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(t){if(!this.store)return t;this.itemContext&&z(this.itemContext);try{return M(this.store,t)}finally{z(null)}}getProp(t){let o=this.props?.[t];return typeof o=="string"&&(o.startsWith("$state:")||o.startsWith("$computed:")||o.startsWith("$item:")||o.startsWith("$expr:")||o.includes("{{")&&o.includes("}}"))?this.resolve(o):o}getArray(t){let o=this.getProp(t);return Array.isArray(o)?o:o&&typeof o=="object"?Object.values(o):[]}getString(t,o=""){let i=this.getProp(t);return typeof i=="string"?i:String(i??o)}getNumber(t,o=0){let i=this.getProp(t);return typeof i=="number"?i:Number(i)||o}getBool(t,o=!1){let i=this.getProp(t);return typeof i=="boolean"?i:o}dispatchAction(t,o){this.onAction&&this.onAction(t,o),this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:t,payload:o},bubbles:!0,composed:!0}))}handleAction(t){let o=this.getString("action");o&&this.dispatchAction(o,this.props)}prop(t){return this.getProp(t)}static get sharedStyles(){return[re]}gapValue(t){let o={none:"0",0:"0","3xs":"var(--forgeui-space-3xs)","2xs":"var(--forgeui-space-2xs)",xs:"var(--forgeui-space-xs)",sm:"var(--forgeui-space-sm)",md:"var(--forgeui-space-md)",lg:"var(--forgeui-space-lg)",xl:"var(--forgeui-space-xl)","2xl":"var(--forgeui-space-2xl)"};if(t==null||t==="")return"var(--forgeui-space-md)";let i=String(t);return i in o?o[i]:/^\d+(\.\d+)?$/.test(i)?`${i}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(i)?i:"var(--forgeui-space-md)"}static get styles(){return[re]}};B._instanceCounter=0;var m=B;var ae=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
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
  `}render(){let e=this.getString("direction","column"),t=e==="horizontal"||e==="row"?"row":"column",o=this.getString("gap","md"),i=this.getString("padding",""),r=this.getString("align",""),l=this.getString("justify",""),a=this.getBool("wrap"),n=this.gapValue(o),u=i?`var(--forgeui-space-${i}, var(--forgeui-space-md))`:"0";return this.setAttribute("direction",t),r&&this.setAttribute("align",r),l&&this.setAttribute("justify",l),a&&this.setAttribute("wrap",""),this.style.gap=n,this.style.padding=u,d`<slot></slot>`}};customElements.define("forgeui-stack",ae);var ne=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display: grid; min-width: 0; }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let e=this.getProp("columns"),t;typeof e=="number"?t=String(e):typeof e=="string"&&e?t=e:t="1";let o=/^\d+$/.test(t)?`repeat(${t}, minmax(0, 1fr))`:t,i=this.getString("gap","md"),r=this.gapValue(i),l=this.getString("padding",""),a=l?`var(--forgeui-space-${l}, var(--forgeui-space-md))`:"0";return this.style.gridTemplateColumns=o,this.style.gap=r,this.style.padding=a,/^\d+$/.test(t)&&Number(t)>=2&&this.setAttribute("responsive",""),d`<slot></slot>`}};customElements.define("forgeui-grid",ne);var le=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
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
  `}render(){let e=this.getString("variant",""),t=this.getString("title",""),o=this.getString("subtitle","");return e&&this.setAttribute("variant",e),d`
      ${t||o?d`
        <div class="header">
          ${t?d`<div class="title">${t}</div>`:h}
          ${o?d`<div class="subtitle">${o}</div>`:h}
        </div>
      `:h}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forgeui-card",le);var ce=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let e=this.getString("maxWidth",""),t={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},o=e in t?t[e]:e,i=this.getString("padding","");return o&&o!=="none"?this.style.maxWidth=o:this.style.maxWidth="",this.style.padding=i?`var(--forgeui-space-${i}, var(--forgeui-space-md))`:"",d`<slot></slot>`}};customElements.define("forgeui-container",ce);var ue=class extends m{static get properties(){return{props:{type:Object},_active:{state:!0}}}constructor(){super(),this._active=""}static get styles(){return y`
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
  `}_itemKey(e){return typeof e=="string"?e:String(e&&typeof e=="object"?e.id??e.key??e.value??e.label??"":e??"")}_itemLabel(e){return typeof e=="string"?e:String(e&&typeof e=="object"?e.label??e.title??e.value??"":e??"")}updated(){Array.from(this.children).filter(t=>!(t instanceof HTMLScriptElement)).forEach((t,o)=>{String(o)===this._active||t.id===this._active||t.getAttribute("slot")===this._active?t.setAttribute("data-active",""):t.removeAttribute("data-active")})}_moveTo(e,t){let o=this._itemKey(t[e])||String(e);this._active=o,this.requestUpdate(),this.dispatchAction("tab-change",{active:o}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${e}`)?.focus()})}render(){let e=this.getProp("items")||[],t=Array.isArray(e)?e:[];!this._active&&t.length>0&&(this._active=this._itemKey(t[0])||"0");let o=t.findIndex((r,l)=>(this._itemKey(r)||String(l))===this._active),i=(r,l)=>{let a=-1;r.key==="ArrowRight"?a=(l+1)%t.length:r.key==="ArrowLeft"?a=(l-1+t.length)%t.length:r.key==="Home"?a=0:r.key==="End"&&(a=t.length-1),a!==-1&&(r.preventDefault(),this._moveTo(a,t))};return d`
      <div class="tabs" role="tablist">${t.map((r,l)=>{let a=this._itemKey(r)||String(l),n=this._itemLabel(r)||String(l+1),u=a===this._active;return d`
          <button class="tab" ?active=${u} role="tab" aria-selected=${u}
            id="${this._instanceId}-tab-${l}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${u?0:-1}"
            @click=${()=>{this._active=a,this.requestUpdate(),this.dispatchAction("tab-change",{active:a})}}
            @keydown=${c=>i(c,l)}>${n}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${o>=0?o:0}"><slot></slot></div>
    `}};customElements.define("forgeui-tabs",ue);var de=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display:block; }
    details { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); margin-bottom:var(--forgeui-space-2xs); }
    summary { padding:var(--forgeui-space-sm) var(--forgeui-space-md); cursor:pointer; font-weight:var(--forgeui-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forgeui-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forgeui-space-sm) var(--forgeui-space-md); }
  `}render(){let e=this.getString("title","Section");return d`<details><summary>${e}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forgeui-accordion",de);var pe=class extends m{static get styles(){return y`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forgeui-color-border); margin:var(--forgeui-space-sm) 0; }
  `}render(){return d`<hr>`}};customElements.define("forgeui-divider",pe);var ge=class extends m{static get styles(){return y`:host { display:block; }`}render(){let t=`var(--forgeui-space-${this.getString("size","md")}, var(--forgeui-space-md))`;return d`<div style="height:${t}"></div>`}};customElements.define("forgeui-spacer",ge);var fe=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let e=this.getArray("data"),t=this.getString("emptyMessage",""),o=this.getString("direction","column");(o==="row"||o==="horizontal")&&this.setAttribute("direction","row");let i=this.getString("gap","md");return this.style.gap=this.gapValue(i),e.length===0&&t?d`<div class="empty">${t}</div>`:d`<slot></slot>`}};customElements.define("forgeui-repeater",fe);var me=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
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
  `}render(){let e=this.getString("content",""),t=this.getString("variant","body"),i={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[t]||t,r=this.getString("colorScheme",""),l=this.getString("align",""),a=this.getString("weight",""),n={primary:"var(--forgeui-color-primary)",secondary:"var(--forgeui-color-text-secondary)",tertiary:"var(--forgeui-color-text-tertiary)",success:"var(--forgeui-color-success)",warning:"var(--forgeui-color-warning)",error:"var(--forgeui-color-error)",info:"var(--forgeui-color-info)"},u={normal:"var(--forgeui-weight-normal)",medium:"var(--forgeui-weight-medium)",semibold:"var(--forgeui-weight-semibold)",bold:"var(--forgeui-weight-bold)"},c=[];r&&n[r]&&c.push(`color:${n[r]}`),a&&u[a]&&c.push(`font-weight:${u[a]}`);let p=l?`align-${l}`:"",g=d`${e}<slot></slot>`;return i==="heading1"?d`<h1 class="${i} ${p}" style="${c.join(";")}">${g}</h1>`:i==="heading2"?d`<h2 class="${i} ${p}" style="${c.join(";")}">${g}</h2>`:i==="heading3"?d`<h3 class="${i} ${p}" style="${c.join(";")}">${g}</h3>`:d`<div class="${i} ${p}" style="${c.join(";")}">${e}<slot></slot></div>`}};customElements.define("forgeui-text",me);var he=class extends m{static get styles(){return y`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `}render(){let e=this.getString("src",""),t=this.getString("alt",""),o=this.getString("fit","contain");return e?d`<img src="${e}" alt="${t}" style="object-fit:${o}" loading="lazy">`:d`${h}`}};customElements.define("forgeui-image",he);var ye=class extends m{static get styles(){return y`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `}render(){let e=this.getString("name","circle"),t={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},o=t[e]||t.circle;return d`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${o}"/></svg>`}};customElements.define("forgeui-icon",ye);var be=class extends m{static get styles(){return y`
    :host { display:inline-flex; align-items:center; }
    .badge { display:inline-flex; align-items:center; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-full); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-medium);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); }
    .badge[variant="success"] { background:var(--forgeui-color-success-subtle); color:var(--forgeui-color-success); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning-subtle); color:var(--forgeui-color-warning); }
    .badge[variant="error"] { background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error); }
  `}render(){let e=this.getString("label",""),t=this.getString("variant","");return d`<span class="badge" variant="${t}">${e}<slot></slot></span>`}};customElements.define("forgeui-badge",be);var ve=class extends m{static get styles(){return y`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let e=this.getString("src",""),t=this.getString("name","?"),o=t.split(" ").map(i=>i[0]).join("").toUpperCase().slice(0,2);return d`<div class="avatar">${e?d`<img src="${e}" alt="${t}">`:o}<slot></slot></div>`}};customElements.define("forgeui-avatar",ve);var xe=class extends m{static get styles(){return y`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); }
  `}render(){let e=this.getString("title","Nothing here"),t=this.getString("description","");return d`
      <div class="title">${e}</div>
      ${t?d`<div class="desc">${t}</div>`:h}
      <slot></slot>
    `}};customElements.define("forgeui-empty-state",xe);var $e=class extends m{static get styles(){return y`
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
  `}render(){let e=this.getString("label",""),t=this.getString("placeholder",""),o=this.getString("hint",""),i=this.getString("error",""),r=this.getString("inputType","text"),l=this.getBool("multiline"),a=this.getString("value",""),n=this._instanceId;return d`
      ${e?d`<label for="${n}">${e}</label>`:h}
      ${l?d`<textarea id="${n}" placeholder="${t}" .value=${a} @input=${u=>this.dispatchAction("change",{value:u.target.value})}></textarea>`:d`<input id="${n}" type="${r}" placeholder="${t}" .value=${a} @input=${u=>this.dispatchAction("change",{value:u.target.value})}>`}
      ${o&&!i?d`<div class="hint">${o}</div>`:h}
      ${i?d`<div class="error">${i}</div>`:h}
    `}};customElements.define("forgeui-text-input",$e);var we=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),t=this.getProp("min"),o=this.getProp("max"),i=this.getProp("step"),r=this.getProp("value"),l=this._instanceId;return d`
      ${e?d`<label for="${l}">${e}</label>`:h}
      <input id="${l}" type="number" min=${t} max=${o} step=${i} .value=${r??""}
        @input=${a=>this.dispatchAction("change",{value:Number(a.target.value)})}>
    `}};customElements.define("forgeui-number-input",we);var ke=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    select { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),t=this.getProp("options")||[],o=this.getString("value",""),i=this._instanceId;return d`
      ${e?d`<label for="${i}">${e}</label>`:h}
      <select id="${i}" .value=${o} @change=${r=>this.dispatchAction("change",{value:r.target.value})}>
        ${t.map(r=>d`<option value=${typeof r=="string"?r:r.value} ?selected=${(typeof r=="string"?r:r.value)===o}>
          ${typeof r=="string"?r:r.label||r.value}
        </option>`)}
      </select>
    `}};customElements.define("forgeui-select",ke);var Se=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-xs); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); min-height:var(--forgeui-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forgeui-space-2xs); padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      background:var(--forgeui-color-primary-subtle); color:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-full);
      font-size:var(--forgeui-text-xs); }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; }
  `}render(){let e=this.getString("label",""),t=this.getProp("selected")||[];return d`
      ${e?d`<label>${e}</label>`:h}
      <div class="tags">
        ${t.map(o=>d`<span class="tag">${String(o)}<button @click=${()=>this.dispatchAction("remove",{value:o})}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forgeui-multi-select",Se);var Ae=class extends m{static get styles(){return y`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); margin-bottom:var(--forgeui-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); cursor:pointer; }
    label { font-size:var(--forgeui-text-sm); cursor:pointer; }
  `}render(){let e=this.getString("label",""),t=this.getBool("checked"),o=this._instanceId;return d`
      <input id="${o}" type="checkbox" ?checked=${t} @change=${i=>this.dispatchAction("change",{checked:i.target.checked})}>
      ${e?d`<label for="${o}">${e}</label>`:h}
    `}};customElements.define("forgeui-checkbox",Ae);var _e=class extends m{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let t=this.getBool("on");this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{actionId:"change",value:!t},bubbles:!0,composed:!0}))};this._onKeydown=t=>{(t.key==="Enter"||t.key===" "||t.key==="Spacebar")&&(t.preventDefault(),this._toggle())}}static get styles(){return y`
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
  `}render(){let t=this.getBool("on"),o=this.getString("label",""),i=this.getBool("disabled"),r=this._instanceId;return d`
      <label for="${r}" class="toggle-label">
        <button
          id="${r}"
          class="switch"
          role="switch"
          type="button"
          aria-checked="${t?"true":"false"}"
          ?disabled=${i}
          @click="${this._toggle}"
          @keydown="${this._onKeydown}"
        ></button>
        ${o?d`<span class="toggle-text">${o}</span>`:h}
      </label>
    `}};customElements.define("forgeui-toggle",_e);var Pe=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),t=this.getString("value","");return d`
      ${e?d`<label>${e}</label>`:h}
      <input type="date" .value=${t} @change=${o=>this.dispatchAction("change",{value:o.target.value})}>
    `}};customElements.define("forgeui-date-picker",Pe);var Ce=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    input[type=range] { width:100%; accent-color:var(--forgeui-color-primary); }
    .value { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
  `}render(){let e=this.getString("label",""),t=this.getNumber("min",0),o=this.getNumber("max",100),i=this.getNumber("step",1),r=this.getNumber("value",t);return d`
      ${e?d`<label>${e}</label>`:h}
      <input type="range" min=${t} max=${o} step=${i} .value=${r}
        @input=${l=>this.dispatchAction("change",{value:Number(l.target.value)})}>
      <div class="value">${r}</div>
    `}};customElements.define("forgeui-slider",Ce);var Ee=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .dropzone { border:2px dashed var(--forgeui-color-border-strong); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forgeui-transition-fast); }
    .dropzone:hover { border-color:var(--forgeui-color-primary); }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `}render(){let e=this.getString("label","Upload file"),t=this.getString("accept","*");return d`
      ${e?d`<label>${e}</label>`:h}
      <div class="dropzone" @click=${()=>this.shadowRoot?.querySelector("input")?.click()}>
        <p>Click or drop file here</p>
        <input type="file" accept="${t}" hidden @change=${o=>{let i=o.target.files?.[0];i&&this.dispatchAction("change",{name:i.name,size:i.size,type:i.type})}}>
      </div>
    `}};customElements.define("forgeui-file-upload",Ee);var je=class extends m{static get styles(){return y`
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
  `}render(){let e=this.getString("label","Button"),t=this.getString("variant","primary"),o=this.getString("size",""),i=this.getBool("disabled"),r=this.getProp("pressed");return d`<button class="${t} ${o}" ?disabled=${i}
      aria-pressed=${r==null?h:String(!!r)}
      @click=${l=>this.handleAction(l)}>${e}<slot></slot></button>`}};customElements.define("forgeui-button",je);var Me=class extends m{static get styles(){return y`
    :host { display:flex; gap:var(--forgeui-space-xs); }
  `}render(){return d`<slot></slot>`}};customElements.define("forgeui-button-group",Me);var Ie=class extends m{static get styles(){return y`
    :host { display:inline-flex; }
    a { color:var(--forgeui-color-primary); text-decoration:none; font-size:var(--forgeui-text-sm); cursor:pointer; }
    a:hover { text-decoration:underline; }
  `}render(){let e=this.getString("label",""),t=this.getString("href","#");return d`<a href="${t}">${e}<slot></slot></a>`}};customElements.define("forgeui-link",Ie);var Te=class extends m{static get styles(){return y`
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
  `}_statusClass(e){let t=String(e??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(t)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(t)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(t)?"neutral":["high","urgent","critical"].includes(t)?"error":["medium","med"].includes(t)?"warning":["low"].includes(t)?"info":["failed","error","rejected","blocked","overdue"].includes(t)?"error":"neutral"}_renderCell(e,t){let o=typeof e=="string"?e:e.key,i=t[o],r=e&&typeof e=="object"?e.type:void 0;if(i==null||i==="")return d`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;if(r==="badge"||r==="status"){let l=(e.variant&&typeof e.variant=="object"?e.variant[String(i).toLowerCase()]:null)||this._statusClass(i);return d`<span class="badge ${l}">${String(i)}</span>`}if(r==="number")return typeof i=="number"?i.toLocaleString():String(i);if(r==="date"){let l=typeof i=="string"||typeof i=="number"?new Date(i):i;return l instanceof Date&&!isNaN(l.getTime())?l.toLocaleDateString():String(i)}if(r==="currency"){let l=Number(i);return isNaN(l)?String(i):l.toLocaleString(void 0,{style:"currency",currency:e.currency||"USD"})}return r==="boolean"?i?"\u2713":"\u2717":String(i)}render(){let e=this.getProp("data")||[],t=this.getProp("columns")||[],o=this.getString("emptyMessage","No data yet"),i=this.getString("rowAction",""),r=this.getString("caption",""),l=t.length>0?t:e.length>0?Object.keys(e[0]):[];return l.length===0?d`<div class="empty">${o}</div>`:d`
      <table>
        ${r?d`<caption>${r}</caption>`:h}
        <thead><tr>${l.map(a=>{let n=typeof a=="string"?a:a.label||a.key,u=typeof a=="object"?a.align:void 0,c=typeof a=="object"?a.width:void 0;return d`<th class="${u==="right"?"align-right":u==="center"?"align-center":""}" style="${c?`width:${c}`:""}">${n}</th>`})}</tr></thead>
        <tbody>${e.length===0?d`<tr><td colspan=${l.length} class="empty">${o}</td></tr>`:e.map((a,n)=>{let u=!!i,c=u?String(a[typeof l[0]=="string"?l[0]:l[0]?.key]??`Row ${n+1}`):"";return d`<tr class="${u?"row-action":""}"
                tabindex=${u?0:h}
                role=${u?"button":h}
                aria-label=${u?c:h}
                @click=${u?()=>this.dispatchAction(i,{row:a,index:n}):void 0}
                @keydown=${u?p=>{(p.key==="Enter"||p.key===" ")&&(p.preventDefault(),this.dispatchAction(i,{row:a,index:n}))}:void 0}>
              ${l.map(p=>{let g=typeof p=="object"?p.align:void 0;return d`<td class="${g==="right"?"align-right":g==="center"?"align-center":""}">${this._renderCell(p,a)}</td>`})}</tr>`})}</tbody>
      </table>
    `}};customElements.define("forgeui-table",Te);var Re=class extends m{static get styles(){return y`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let e=this.getProp("data")||[],t=this.getString("emptyMessage","No items");return e.length===0?d`<div class="empty">${t}</div>`:d`<div class="list">${e.map((o,i)=>d`
      <div class="item" data-index=${i}><slot name="item" .item=${o} .index=${i}>${JSON.stringify(o)}</slot></div>
    `)}</div>`}};customElements.define("forgeui-list",Re);var Le=class extends m{constructor(){super(...arguments);this._palette=["var(--forgeui-color-primary)","var(--forgeui-color-success)","var(--forgeui-color-warning)","var(--forgeui-color-error)","var(--forgeui-color-info)","var(--forgeui-color-chart-6)","var(--forgeui-color-chart-7)","var(--forgeui-color-chart-8)","var(--forgeui-color-chart-9)","var(--forgeui-color-chart-10)"]}static get styles(){return y`
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
  `}_niceMax(t){if(t<=0)return 1;let o=Math.pow(10,Math.floor(Math.log10(t))),i=t/o;return(i<=1?1:i<=2?2:i<=5?5:10)*o}render(){let t=this.getString("chartType","bar"),o=this.getProp("data")||[],i=this.getString("title",""),r=this.getString("xKey","label")||this.getString("labelKey","label"),l=this.getString("yKey","value")||this.getString("valueKey","value"),a=this.getString("color","");if(!o||o.length===0)return d`
        ${i?d`<div class="title">${i}</div>`:h}
        <div class="empty">No data to display</div>
      `;let n=o.map(x=>typeof x=="number"?{label:"",value:x}:x&&typeof x=="object"?{label:String(x[r]??x.label??x.name??x.x??""),value:Number(x[l]??x.value??x.y??0)||0,color:x.color}:{label:String(x),value:0}),u=600,c=260,p={top:8,right:16,bottom:36,left:48},g=u-p.left-p.right,w=c-p.top-p.bottom,R,N=h;if(t==="pie"||t==="donut"){let x=n.reduce((_,k)=>_+Math.max(0,k.value),0)||1,j=u/2,E=c/2,S=Math.min(g,w)/2-8,A=t==="donut"?S*.55:0,$=-Math.PI/2,b=[],v=[];n.forEach((_,k)=>{let T=Math.max(0,_.value)/x,P=$,C=$+T*Math.PI*2;$=C;let O=C-P>Math.PI?1:0,q=j+S*Math.cos(P),He=E+S*Math.sin(P),Ke=j+S*Math.cos(C),Ge=E+S*Math.sin(C),W=_.color||this._palette[k%this._palette.length];if(v.push(W),A>0){let gt=j+A*Math.cos(P),ft=E+A*Math.sin(P),mt=j+A*Math.cos(C),ht=E+A*Math.sin(C);b.push(`<path class="slice" fill="${W}" d="M ${q} ${He} A ${S} ${S} 0 ${O} 1 ${Ke} ${Ge} L ${mt} ${ht} A ${A} ${A} 0 ${O} 0 ${gt} ${ft} Z"/>`)}else b.push(`<path class="slice" fill="${W}" d="M ${j} ${E} L ${q} ${He} A ${S} ${S} 0 ${O} 1 ${Ke} ${Ge} Z"/>`)}),R=d`<g .innerHTML=${b.join("")}></g>`,N=d`<div class="legend">${n.map((_,k)=>d`
        <span class="legend-item"><span class="swatch" style="background:${v[k]}"></span>${_.label} (${_.value})</span>
      `)}</div>`}else{let x=Math.max(...n.map($=>$.value),0),j=this._niceMax(x),E=$=>p.top+w-$/j*w,S=4,A=[];for(let $=0;$<=S;$++){let b=j*$/S,v=E(b);A.push(`<line class="grid" x1="${p.left}" x2="${p.left+g}" y1="${v}" y2="${v}"/>`),A.push(`<text class="tick-label" x="${p.left-6}" y="${v+3}" text-anchor="end">${b.toLocaleString()}</text>`)}if(t==="line"||t==="area"){let $=g/Math.max(1,n.length-1),b=n.map((k,T)=>{let P=p.left+T*$,C=E(k.value);return`${T===0?"M":"L"} ${P} ${C}`}).join(" "),v=t==="area"?b+` L ${p.left+g} ${p.top+w} L ${p.left} ${p.top+w} Z`:"",_=a||"var(--forgeui-color-primary)";R=d`
          <g .innerHTML=${A.join("")}></g>
          ${t==="area"?d`<path class="area" d="${v}" style="fill:${_};opacity:0.15"/>`:h}
          <path class="line" d="${b}" style="stroke:${_}"/>
          ${n.map((k,T)=>{let P=p.left+T*$,C=E(k.value);return I`<circle class="point" cx="${P}" cy="${C}" r="3" style="fill:${_}"/>
              <text class="tick-label" x="${P}" y="${p.top+w+14}" text-anchor="middle">${k.label}</text>`})}
        `}else{let $=n.length,b=g/$,v=Math.max(2,b*.7),_=b-v;R=d`
          <g .innerHTML=${A.join("")}></g>
          ${n.map((k,T)=>{let P=p.left+T*b+_/2,C=E(k.value),O=Math.max(0,p.top+w-C),q=k.color||a||"var(--forgeui-color-primary)";return I`<rect class="bar" x="${P}" y="${C}" width="${v}" height="${O}" rx="2" style="fill:${q}">
                <title>${k.label}: ${k.value}</title>
              </rect>
              <text class="tick-label" x="${P+v/2}" y="${p.top+w+14}" text-anchor="middle">${k.label}</text>`})}
        `}}return d`
      ${i?d`<div class="title">${i}</div>`:h}
      <div class="wrap">
        <svg viewBox="0 0 ${u} ${c}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${i||t+" chart"}">
          ${R}
        </svg>
        ${N}
      </div>
    `}};customElements.define("forgeui-chart",Le);var ze=class extends m{static get styles(){return y`
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
  `}_trendMeta(e){if(e==null||e==="")return null;if(typeof e=="number")return e>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(e)}%`}:e<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(e)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof e=="string"){let t=e.toLowerCase(),o=e.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(o){let i=parseFloat(o[1]),r=o[2];return i>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(i)}${r}`}:i<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(i)}${r}`}:{dir:"neutral",arrow:"\u2192",display:`0${r}`}}return t==="up"||t==="positive"||t==="increase"?{dir:"up",arrow:"\u2191",display:""}:t==="down"||t==="negative"||t==="decrease"?{dir:"down",arrow:"\u2193",display:""}:t==="flat"||t==="neutral"||t==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:e}}return null}render(){let e=this.getString("label",""),t=this.getProp("value"),o=this.getProp("trend"),i=this.getString("trendLabel",""),r=this.getProp("goal"),l=this.getString("unit",""),a=this.getString("suffix",""),n=this.getString("subtitle",""),u=this.getString("variant","");u&&this.setAttribute("variant",u);let c=typeof t=="number"?t.toLocaleString():t==null||t===""?"\u2014":String(t),p=this._trendMeta(o);return d`
      ${e?d`<div class="label">${e}</div>`:h}
      <div class="value-row">
        <span class="value">${c}</span>
        ${l?d`<span class="unit">${l}</span>`:h}
        ${a?d`<span class="suffix">${a}</span>`:h}
        ${p?d`<span class="trend ${p.dir}">${p.arrow}${p.display?d` ${p.display}`:h}${i?d` ${i}`:h}</span>`:h}
      </div>
      ${n?d`<div class="subtitle">${n}</div>`:h}
      ${r!=null&&r!==""?d`<div class="goal">Goal: ${typeof r=="number"?r.toLocaleString():r}</div>`:h}
    `}};customElements.define("forgeui-metric",ze);var Ne=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    .alert { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      border-left:4px solid; font-size:var(--forgeui-text-sm); }
    .info { background:var(--forgeui-color-info-subtle); border-color:var(--forgeui-color-info); color:var(--forgeui-color-info); }
    .success { background:var(--forgeui-color-success-subtle); border-color:var(--forgeui-color-success); color:var(--forgeui-color-success); }
    .warning { background:var(--forgeui-color-warning-subtle); border-color:var(--forgeui-color-warning); color:var(--forgeui-color-warning); }
    .error { background:var(--forgeui-color-error-subtle); border-color:var(--forgeui-color-error); color:var(--forgeui-color-error); }
  `}render(){let e=this.getString("variant","info"),t=this.getString("title",""),o=this.getString("message","");return d`<div class="alert ${e}" role=${e==="error"||e==="warning"?"alert":"status"}>
      ${t?d`<strong>${t}</strong> `:h}${o}<slot></slot>
    </div>`}};customElements.define("forgeui-alert",Ne);var Oe=class extends m{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=t=>this._onKeydown(t);this._close=()=>{this.dispatchAction("close")}}static get styles(){return y`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-lg);
      padding:var(--forgeui-space-lg); min-width:20rem; max-width:90vw; max-height:90vh; overflow:auto;
      box-shadow:var(--forgeui-shadow-lg); z-index:1; }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forgeui-space-xs); margin-top:var(--forgeui-space-lg); }
  `}render(){let t=this.getString("title",""),o=this.getBool("open"),i=`${this._instanceId}-title`;return o?this.setAttribute("open",""):this.removeAttribute("open"),o?d`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${t?i:h}"
        tabindex="-1"
        @click=${r=>r.stopPropagation()}
      >
        ${t?d`<h2 id="${i}" class="title">${t}</h2>`:h}
        <slot></slot>
      </div>
    `:h}updated(t){if(super.updated?.(t),t.has("props")){let o=this.getBool("open"),r=t.get("props")?.open??!1;o&&!r?this._onOpen():!o&&r&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let t=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??t)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(t){if(t.key==="Escape"){t.preventDefault(),this._close();return}t.key==="Tab"&&this._trapFocus(t)}_trapFocus(t){let o=this._allFocusableInDialog();if(o.length===0){t.preventDefault();return}let i=o[0],r=o[o.length-1],l=this.shadowRoot?.activeElement??document.activeElement;t.shiftKey?(l===i||!this._dialogContains(l))&&(t.preventDefault(),r.focus()):(l===r||!this._dialogContains(l))&&(t.preventDefault(),i.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let t=this.shadowRoot?.querySelector(".dialog");if(!t)return[];let o='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',i=Array.from(t.querySelectorAll(o)),r=t.querySelector("slot"),l=r instanceof HTMLSlotElement?r.assignedElements({flatten:!0}).flatMap(a=>[a,...Array.from(a.querySelectorAll(o))].filter(u=>u instanceof HTMLElement&&u.matches(o))):[];return[...i,...l].filter(a=>!a.disabled)}_dialogContains(t){return t?this.shadowRoot?.querySelector(".dialog")?.contains(t)??!1:!1}};customElements.define("forgeui-dialog",Oe);var Ue=class extends m{static get styles(){return y`
    :host { display:block; }
    .progress { height:0.5rem; background:var(--forgeui-color-surface-alt); border-radius:var(--forgeui-radius-full); overflow:hidden; }
    .bar { height:100%; background:var(--forgeui-color-primary); border-radius:var(--forgeui-radius-full); transition:width var(--forgeui-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .label { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); margin-top:var(--forgeui-space-2xs); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; animation:none; }
    }
  `}render(){let e=this.getProp("value"),t=this.getNumber("max",100),o=e==null,i=o?0:Math.max(0,Math.min(Number(e),t)),r=o?0:i/t*100;return d`
      <div
        class="progress ${o?"indeterminate":""}"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="${t}"
        aria-valuenow="${o?h:i}"
        aria-valuetext="${o?"Loading":`${Math.round(r)}%`}"
      >
        <div class="bar" style=${o?"":`width:${r}%`}></div>
      </div>
    `}};customElements.define("forgeui-progress",Ue);var De=class extends m{static get styles(){return y`
    :host { display:block; position:fixed; bottom:var(--forgeui-space-lg); right:var(--forgeui-space-lg); z-index:60; }
    .toast { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-text); color:var(--forgeui-color-text-inverse); font-size:var(--forgeui-text-sm);
      box-shadow:var(--forgeui-shadow-lg); max-width:20rem; }
  `}render(){let e=this.getString("message","");return e?d`<div class="toast">${e}</div>`:d`${h}`}};customElements.define("forgeui-toast",De);var Ve=class extends m{static get styles(){return y`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); }
    .sep { color:var(--forgeui-color-text-tertiary); }
    a { color:var(--forgeui-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-medium); }
  `}render(){let e=this.getProp("items")||[];return d`${e.map((t,o)=>{let i=o===e.length-1,r=typeof t=="string"?t:t.label,l=typeof t=="string"?"#":t.href;return d`
        ${o>0?d`<span class="sep">/</span>`:h}
        ${i?d`<span class="current">${r}</span>`:d`<a href="${l}">${r}</a>`}
      `})}`}};customElements.define("forgeui-breadcrumb",Ve);var qe=class extends m{static get styles(){return y`
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
  `}render(){let e=this.getProp("steps")||[],t=this.getNumber("active",0);return d`${e.map((o,i)=>{let r=typeof o=="string"?o:o.label||o.title||`Step ${i+1}`,l=i===t,a=i<t;return d`<div class="step" ?active=${l} ?completed=${a}>
        <div class="circle">${a?"\u2713":i+1}</div>
        <div class="label">${r}</div>
      </div>`})}`}};customElements.define("forgeui-stepper",qe);var Fe=class extends m{static get styles(){return y`
    :host { display:block; }
    .error { padding:var(--forgeui-space-sm); background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error);
      border:1px solid var(--forgeui-color-error); border-radius:var(--forgeui-radius-md); font-size:var(--forgeui-text-sm); }
  `}render(){let e=this.getString("msg","Unknown error");return d`<div class="error" role="alert">⚠ ${e}</div>`}};customElements.define("forgeui-error",Fe);var Be=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display:block; }
    svg { display:block; }
  `}render(){let e=this.getNumber("width",400),t=this.getNumber("height",300),o=this.getString("background","transparent"),i=this.getProp("shapes")||[];return I`
      <svg width="${e}" height="${t}" style="background:${o}" viewBox="0 0 ${e} ${t}">
        ${i.map(r=>this.renderShape(r))}
      </svg>
    `}renderShape(e){let t={fill:e.fill??void 0,stroke:e.stroke??void 0,"stroke-width":e.strokeWidth??void 0,opacity:e.opacity??void 0},o=e.action?()=>{this.onAction&&this.onAction(e.action)}:void 0,i=e.action?"cursor:pointer":void 0;switch(e.type){case"rect":return I`<rect
          x="${e.x??0}" y="${e.y??0}"
          width="${e.width??0}" height="${e.height??0}"
          rx="${e.rx??0}" ry="${e.ry??0}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??0}"
          opacity="${t.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"circle":return I`<circle
          cx="${e.cx??0}" cy="${e.cy??0}" r="${e.r??0}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??0}"
          opacity="${t.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"ellipse":return I`<ellipse
          cx="${e.cx??e.x??0}" cy="${e.cy??e.y??0}"
          rx="${e.rx??(e.width?e.width/2:0)}" ry="${e.ry??(e.height?e.height/2:0)}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??0}"
          opacity="${t.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"line":return I`<line
          x1="${e.x1??0}" y1="${e.y1??0}"
          x2="${e.x2??0}" y2="${e.y2??0}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??1}"
          opacity="${t.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"text":return I`<text
          x="${e.x??0}" y="${e.y??0}"
          fill="${t.fill??"currentColor"}"
          font-size="${e.fontSize??14}"
          font-weight="${e.fontWeight??"normal"}"
          font-family="${e.fontFamily??"sans-serif"}"
          text-anchor="${e.textAnchor??"start"}"
          opacity="${t.opacity??1}"
          style="${i}"
          @click=${o}
        >${e.content??""}</text>`;case"path":return I`<path
          d="${e.d??""}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??1}"
          opacity="${t.opacity??1}"
          style="${i}"
          @click=${o}
        />`;default:return I``}}};customElements.define("forgeui-drawing",Be);var V=class extends Ft{constructor(){super();this._activeView="";this._persister=null;this._undoStack=new F(50);this.surface="standalone"}static get properties(){return{manifest:{type:Object},src:{type:String},surface:{type:String,reflect:!0},colorScheme:{type:String,reflect:!0}}}connectedCallback(){super.connectedCallback(),this._readInlineManifest(),this._initManifest()}async disconnectedCallback(){super.disconnectedCallback(),this._persister&&(await this._persister.destroy(),this._persister=null)}_readInlineManifest(){if(this.manifest)return;let t=this.querySelector('script[type="application/json"]');if(t?.textContent)try{this.manifest=JSON.parse(t.textContent)}catch(o){console.error("[Forge] Failed to parse inline manifest JSON:",o)}}updated(t){(t.has("manifest")||t.has("src"))&&this._initManifest()}_initManifest(){let t=this.manifest;if(!t&&this.src)try{t=JSON.parse(this.src)}catch(i){this._validation={valid:!1,errors:[{path:"/",message:`Invalid JSON: ${i.message}`,severity:"error"}],warnings:[]};return}if(!t)return;t=se(t);let o=Q(t);this._validation=o,o.valid||console.error("[Forge] Manifest validation failed:",o.errors),this._parsedManifest=t,this._store=J({schema:t.schema,initialState:t.state}),this._activeView=t.root,this._setupPersistence(t).then(()=>this.requestUpdate()).catch(i=>{console.warn("[forgeui] persister setup failed:",i),this.requestUpdate()}),this._undoStack.push(t),this.dispatchEvent(new CustomEvent("forgeui-ready",{detail:{appId:t.id},bubbles:!0,composed:!0})),this.requestUpdate()}render(){if(!this._parsedManifest||!this._store)return this._validation&&!this._validation.valid?this._renderErrors():We`<div style="padding:1rem;color:var(--forgeui-color-text-secondary)">Loading...</div>`;let t={manifest:this._parsedManifest,store:this._store,activeView:this._activeView,onAction:this._handleAction.bind(this)};return st(t)}_renderErrors(){let t=this._validation?.errors||[];return We`
      <div style="padding:var(--forgeui-space-md);font-family:var(--forgeui-font-family)">
        <div style="color:var(--forgeui-color-error);font-weight:var(--forgeui-weight-semibold);margin-bottom:var(--forgeui-space-sm)">
          Manifest Validation Errors
        </div>
        ${t.map(o=>We`
          <div style="font-size:var(--forgeui-text-sm);color:var(--forgeui-color-text-secondary);margin-bottom:var(--forgeui-space-2xs)">
            <code>${o.path}</code>: ${o.message}
          </div>
        `)}
      </div>
    `}async _setupPersistence(t){if(!this._store)return;this._persister&&(await this._persister.destroy(),this._persister=null);let o,i=this.surface;if(t.persistState===!0?o="indexeddb":t.skipPersistState===!0?o="none":o=i==="standalone"||i==="embed"?"indexeddb":"none",o!=="none"){this._persister=pt(this._store,t.id,o);try{await this._persister.start()}catch{this._persister=null}}}getPersistenceStatus(){return this._persister?.getStatus()??null}_handleAction(t,o){let i=this._parsedManifest;if(!i?.actions||!this._store)return;let r=i.actions[t];if(!r){console.warn(`[Forge] Unknown action: ${t}`);return}switch(r.type){case"mutateState":{let l=r.key?.replace("{{id}}",String(o?.id||""));Y(this._store,{type:r.type,path:r.path,operation:r.operation,key:l,value:r.value??o}),this.requestUpdate();break}case"navigate":{r.target&&(this._activeView=r.target,this.requestUpdate());break}case"callApi":{console.warn("[Forge] callApi requires Forge Server (Ring 2+)");break}default:this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:t,payload:o,definition:r},bubbles:!0,composed:!0}))}}getStore(){return this._store}getManifest(){return this._parsedManifest}getValidation(){return this._validation}dispatchAction(t,o){this._handleAction(t,o)}pushManifestUpdate(t){this._undoStack.push(t)}undo(){let t=this._undoStack.undo();return t&&(this.manifest=t,this.requestUpdate()),t}redo(){let t=this._undoStack.redo();return t&&(this.manifest=t,this.requestUpdate()),t}getUndoRedoState(){return this._undoStack.getState()}static catalogPrompt(t){return oe(t)}static catalogJsonSchema(){return ie()}};V.styles=[nt,lt];customElements.define("forgeui-app",V);export{V as ForgeUIApp,oe as catalogPrompt,ie as catalogToJsonSchema,J as createForgeUIStore,Y as executeAction,Rt as extractManifest,se as ingestPayload,dt as isA2UIPayload,D as isValidComponentType,M as resolveRef,Q as validateManifest};
