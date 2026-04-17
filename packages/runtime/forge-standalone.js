import{LitElement as qt,html as We}from"lit";import{createStore as yt}from"tinybase";var bt=new Set(["__proto__","prototype","constructor"]);function H(a){if(a.length===0||a.length>256)return!1;for(let e of a.normalize("NFC").split("."))if(bt.has(e))return!1;return!0}function K(a,e){if(e.includes("/")){let t=e.split("/");if(t.length===3){let[o,s,r]=t;return a.getCell(o,s,r)}if(t.length===2){let[o,s]=t,r=a.getValue(e);if(r!==void 0)return r;let l=a.getCellIds(o,s);if(l.length>0){let n={};for(let i of l)n[i]=a.getCell(o,s,i);return n}}}return a.getValue(e)}function vt(a,e){if(e.startsWith("count:")){let t=e.slice(6);return a.getRowCount(t)}if(e.startsWith("sum:")){let[t,o]=e.split(":"),[s,r]=o.split("/"),l=0,n=a.getRowIds(s);for(let i of n){let d=a.getCell(s,i,r);typeof d=="number"&&(l+=d)}return l}if(e.startsWith("avg:")){let[t,o]=e.split(":"),[s,r]=o.split("/"),l=0,n=0,i=a.getRowIds(s);for(let d of i){let c=a.getCell(s,d,r);typeof c=="number"&&(l+=c,n++)}return n>0?l/n:0}return K(a,e)}var D=null;function z(a){D=a}function G(a,e){let t=e.trim();if(t!==""){if(t.startsWith('"')&&t.endsWith('"')||t.startsWith("'")&&t.endsWith("'"))return t.slice(1,-1);if(!(t.startsWith('"')&&!t.endsWith('"')||t.startsWith("'")&&!t.endsWith("'"))){if(t==="true")return!0;if(t==="false")return!1;if(t==="null")return null;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t.includes("|")){let[o,...s]=t.split("|").map(n=>n.trim()),l=G(a,o);for(let n of s){let[i,...d]=n.split(/\s+/);l=xt(l,i,d)}return l}if(t.startsWith("item.")||t==="item"){if(t==="item")return D;let o=t.slice(5);return L(D,o)}if(t.startsWith("state.")||t==="state"){if(t==="state")return;let o=t.slice(6);return $t(a,o)}return K(a,t)}}}function xt(a,e,t){switch(e){case"values":return Array.isArray(a)?a:a&&typeof a=="object"?Object.values(a):[];case"keys":return a&&typeof a=="object"?Object.keys(a):[];case"count":case"length":return Array.isArray(a)?a.length:a&&typeof a=="object"?Object.keys(a).length:typeof a=="string"?a.length:0;case"sum":return Array.isArray(a)?a.reduce((o,s)=>o+(typeof s=="number"?s:0),0):0;case"first":return Array.isArray(a)?a[0]:void 0;case"last":return Array.isArray(a)?a[a.length-1]:void 0;default:return a}}function L(a,e){if(!a||typeof a!="object"||!e||!H(e))return;let t=e.split(".");if(t.length>32)return;let o=a;for(let s of t){if(o==null)return;o=o[s]}return o}function $t(a,e){let t=a.getValue(e);if(t!==void 0)return t;let o=e.split(".");if(o.length>=3){let[r,l,n,...i]=o;if(a.hasTable(r)&&a.hasRow(r,l)){let d=a.getCell(r,l,n);if(i.length===0)return d;if(typeof d=="string")try{let c=JSON.parse(d);return L(c,i.join("."))}catch{}return}}if(o.length>=2){let[r,l,...n]=o;if(a.hasTable(r)&&a.hasRow(r,l)){let i=a.getRow(r,l);return n.length===0?i:L(i,n.join("."))}}if(o.length>=1){let[r,...l]=o;if(a.hasTable(r)){let n=a.getRowIds(r),i={};for(let d of n)i[d]=a.getRow(r,d);return l.length===0?i:L(i,l.join("."))}}let s=a.getValue(o[0]);if(typeof s=="string"&&o.length>1)try{let r=JSON.parse(s);return L(r,o.slice(1).join("."))}catch{}}function M(a,e){if(typeof e!="string"){if(e!==null&&typeof e=="object"){let t=e;if("$expr"in t)return M(a,`$expr:${t.$expr}`);if("$state"in t)return M(a,`$state:${t.$state}`);if("$computed"in t)return M(a,`$computed:${t.$computed}`);if("$item"in t)return M(a,`$item:${t.$item}`)}return e}if(e.startsWith("$state:")){let t=e.slice(7);return H(t)?K(a,t):void 0}if(e.startsWith("$computed:")){let t=e.slice(10);return t.length>1024?void 0:vt(a,t)}if(e.startsWith("$item:")){let t=e.slice(6);return H(t)?t.includes(".")?L(D,t):D?.[t]:void 0}if(e.startsWith("$expr:")){let t=e.slice(6);return t.length>1024?void 0:G(a,t)}return e.length>4096?e:e.includes("{{")&&e.includes("}}")?wt(e,a):e}function wt(a,e){let t="",o=0;for(;o<a.length;)if(a[o]==="{"&&a[o+1]==="{"){let s=o+2,r=1,l=s;for(;l<a.length-1&&r>0;){let n=a[l],i=a[l+1];n==="{"&&i==="{"?(r++,l+=2):n==="}"&&i==="}"?(r--,l+=2):l++}if(r)t+=a[o++];else{let n=a.slice(s,l-2);if(n.length<=256){let i=G(e,n.trim());t+=i==null?"":String(i)}else t+=a.slice(o,l);o=l}}else t+=a[o++];return t}function kt(a){if(!a)return{};let e={};for(let[t,o]of Object.entries(a.tables)){e[t]={};for(let[s,r]of Object.entries(o.columns))e[t][s]={type:r.type}}return e}function J(a){let e=yt();if(a.schema){let t=kt(a.schema);e.setTablesSchema(t)}if(a.initialState)for(let[t,o]of Object.entries(a.initialState))typeof o=="string"||typeof o=="number"||typeof o=="boolean"?e.setValue(t,o):typeof o=="object"&&o!==null&&e.setValue(t,JSON.stringify(o));return e}function Y(a,e){let{type:t,path:o,operation:s,key:r,value:l}=e;if(t!=="mutateState"||!o)return!1;switch(s){case"set":{if(o.includes("/")){let n=o.split("/");if(n.length===3){let[i,d,c]=n;return a.setCell(i,d,c,l),!0}}return a.setValue(o,l),!0}case"append":{let n=o,i=r||`row_${Date.now()}`;if(typeof l=="object"&&l!==null){for(let[d,c]of Object.entries(l))(typeof c=="string"||typeof c=="number"||typeof c=="boolean")&&a.setCell(n,i,d,c);return!0}return!1}case"delete":{let n=o,i=r;return i?(a.delRow(n,i),!0):!1}case"update":{let n=o,i=r;if(i&&typeof l=="object"&&l!==null){for(let[d,c]of Object.entries(l))(typeof c=="string"||typeof c=="number"||typeof c=="boolean")&&a.setCell(n,i,d,c);return!0}return!1}case"increment":{if(o.includes("/")){let i=o.split("/");if(i.length===3){let[d,c,g]=i,f=a.getCell(d,c,g);if(typeof f=="number")return a.setCell(d,c,g,f+(l||1)),!0}}let n=a.getValue(o);return typeof n=="number"?(a.setValue(o,n+(l||1)),!0):!1}case"decrement":{if(o.includes("/")){let i=o.split("/");if(i.length===3){let[d,c,g]=i,f=a.getCell(d,c,g);if(typeof f=="number")return a.setCell(d,c,g,f-(l||1)),!0}}let n=a.getValue(o);return typeof n=="number"?(a.setValue(o,n-(l||1)),!0):!1}case"toggle":{if(o.includes("/")){let i=o.split("/");if(i.length===3){let[d,c,g]=i,f=a.getCell(d,c,g);if(typeof f=="boolean")return a.setCell(d,c,g,!f),!0}}let n=a.getValue(o);return typeof n=="boolean"?(a.setValue(o,!n),!0):!1}default:return!1}}var Je={Stack:"layout",Grid:"layout",Card:"layout",Container:"layout",Tabs:"layout",Accordion:"layout",Divider:"layout",Spacer:"layout",Repeater:"layout",Text:"content",Image:"content",Icon:"content",Badge:"content",Avatar:"content",EmptyState:"content",TextInput:"input",NumberInput:"input",Select:"input",MultiSelect:"input",Checkbox:"input",Toggle:"input",DatePicker:"input",Slider:"input",FileUpload:"input",Button:"action",ButtonGroup:"action",Link:"action",Table:"data",List:"data",Chart:"data",Metric:"data",Alert:"feedback",Dialog:"feedback",Progress:"feedback",Toast:"feedback",Breadcrumb:"navigation",Stepper:"navigation",Drawing:"drawing"},St={layout:["Stack","Grid","Card","Container","Tabs","Accordion","Divider","Spacer","Repeater"],content:["Text","Image","Icon","Badge","Avatar","EmptyState"],input:["TextInput","NumberInput","Select","MultiSelect","Checkbox","Toggle","DatePicker","Slider","FileUpload"],action:["Button","ButtonGroup","Link"],data:["Table","List","Chart","Metric"],feedback:["Alert","Dialog","Progress","Toast"],navigation:["Breadcrumb","Stepper"],drawing:["Drawing"]},Ye=St,Ze=Object.keys(Je);function U(a){return a in Je}import Qe from"ajv/dist/runtime/ucs2length.js";var et=tt,Xe={type:"object",required:["manifest","id","root","elements"],additionalProperties:!1,properties:{manifest:{type:"string",pattern:"^0\\.\\d+\\.\\d+$"},id:{type:"string",minLength:1,maxLength:128},root:{type:"string",minLength:1},schema:{type:"object",additionalProperties:!1,properties:{version:{type:"integer",minimum:1},tables:{type:"object"},migrations:{type:"array"},views:{type:"object"}}},state:{type:"object"},elements:{type:"object",minProperties:1,additionalProperties:{type:"object",required:["type"],additionalProperties:!1,properties:{type:{type:"string",enum:["Stack","Grid","Card","Container","Tabs","Accordion","Divider","Spacer","Repeater","Text","Image","Icon","Badge","Avatar","EmptyState","TextInput","NumberInput","Select","MultiSelect","Checkbox","Toggle","DatePicker","Slider","FileUpload","Button","ButtonGroup","Link","Table","List","Chart","Metric","Alert","Dialog","Progress","Toast","Breadcrumb","Stepper","Drawing"]},props:{type:"object"},children:{type:"array",items:{type:"string"}},visible:{type:"object"}}}},actions:{type:"object"},meta:{type:"object"},persistState:{type:"boolean"},skipPersistState:{type:"boolean"},dataAccess:{type:"object",additionalProperties:!1,properties:{enabled:{type:"boolean"},readable:{type:"array",items:{type:"string"}},restricted:{type:"array",items:{type:"string"}},summaries:{type:"boolean"}}}}},At=Object.prototype.hasOwnProperty,Z=Qe.default??Qe,_t=new RegExp("^0\\.\\d+\\.\\d+$","u");function tt(a,{instancePath:e="",parentData:t,parentDataProperty:o,rootData:s=a}={}){let r=null,l=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.manifest===void 0){let n={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"manifest"},message:"must have required property 'manifest'"};r===null?r=[n]:r.push(n),l++}if(a.id===void 0){let n={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};r===null?r=[n]:r.push(n),l++}if(a.root===void 0){let n={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"root"},message:"must have required property 'root'"};r===null?r=[n]:r.push(n),l++}if(a.elements===void 0){let n={instancePath:e,schemaPath:"#/required",keyword:"required",params:{missingProperty:"elements"},message:"must have required property 'elements'"};r===null?r=[n]:r.push(n),l++}for(let n in a)if(!At.call(Xe.properties,n)){let i={instancePath:e,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:n},message:"must NOT have additional properties"};r===null?r=[i]:r.push(i),l++}if(a.manifest!==void 0){let n=a.manifest;if(typeof n=="string"){if(!_t.test(n)){let i={instancePath:e+"/manifest",schemaPath:"#/properties/manifest/pattern",keyword:"pattern",params:{pattern:"^0\\.\\d+\\.\\d+$"},message:'must match pattern "^0\\.\\d+\\.\\d+$"'};r===null?r=[i]:r.push(i),l++}}else{let i={instancePath:e+"/manifest",schemaPath:"#/properties/manifest/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[i]:r.push(i),l++}}if(a.id!==void 0){let n=a.id;if(typeof n=="string"){if(Z(n)>128){let i={instancePath:e+"/id",schemaPath:"#/properties/id/maxLength",keyword:"maxLength",params:{limit:128},message:"must NOT have more than 128 characters"};r===null?r=[i]:r.push(i),l++}if(Z(n)<1){let i={instancePath:e+"/id",schemaPath:"#/properties/id/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};r===null?r=[i]:r.push(i),l++}}else{let i={instancePath:e+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[i]:r.push(i),l++}}if(a.root!==void 0){let n=a.root;if(typeof n=="string"){if(Z(n)<1){let i={instancePath:e+"/root",schemaPath:"#/properties/root/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};r===null?r=[i]:r.push(i),l++}}else{let i={instancePath:e+"/root",schemaPath:"#/properties/root/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[i]:r.push(i),l++}}if(a.schema!==void 0){let n=a.schema;if(n&&typeof n=="object"&&!Array.isArray(n)){for(let i in n)if(!(i==="version"||i==="tables"||i==="migrations"||i==="views")){let d={instancePath:e+"/schema",schemaPath:"#/properties/schema/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:i},message:"must NOT have additional properties"};r===null?r=[d]:r.push(d),l++}if(n.version!==void 0){let i=n.version;if(!(typeof i=="number"&&!(i%1)&&!isNaN(i)&&isFinite(i))){let d={instancePath:e+"/schema/version",schemaPath:"#/properties/schema/properties/version/type",keyword:"type",params:{type:"integer"},message:"must be integer"};r===null?r=[d]:r.push(d),l++}if(typeof i=="number"&&isFinite(i)&&(i<1||isNaN(i))){let d={instancePath:e+"/schema/version",schemaPath:"#/properties/schema/properties/version/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};r===null?r=[d]:r.push(d),l++}}if(n.tables!==void 0){let i=n.tables;if(!(i&&typeof i=="object"&&!Array.isArray(i))){let d={instancePath:e+"/schema/tables",schemaPath:"#/properties/schema/properties/tables/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[d]:r.push(d),l++}}if(n.migrations!==void 0&&!Array.isArray(n.migrations)){let i={instancePath:e+"/schema/migrations",schemaPath:"#/properties/schema/properties/migrations/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[i]:r.push(i),l++}if(n.views!==void 0){let i=n.views;if(!(i&&typeof i=="object"&&!Array.isArray(i))){let d={instancePath:e+"/schema/views",schemaPath:"#/properties/schema/properties/views/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[d]:r.push(d),l++}}}else{let i={instancePath:e+"/schema",schemaPath:"#/properties/schema/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[i]:r.push(i),l++}}if(a.state!==void 0){let n=a.state;if(!(n&&typeof n=="object"&&!Array.isArray(n))){let i={instancePath:e+"/state",schemaPath:"#/properties/state/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[i]:r.push(i),l++}}if(a.elements!==void 0){let n=a.elements;if(n&&typeof n=="object"&&!Array.isArray(n)){if(Object.keys(n).length<1){let i={instancePath:e+"/elements",schemaPath:"#/properties/elements/minProperties",keyword:"minProperties",params:{limit:1},message:"must NOT have fewer than 1 properties"};r===null?r=[i]:r.push(i),l++}for(let i in n){let d=n[i];if(d&&typeof d=="object"&&!Array.isArray(d)){if(d.type===void 0){let c={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};r===null?r=[c]:r.push(c),l++}for(let c in d)if(!(c==="type"||c==="props"||c==="children"||c==="visible")){let g={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:c},message:"must NOT have additional properties"};r===null?r=[g]:r.push(g),l++}if(d.type!==void 0){let c=d.type;if(typeof c!="string"){let g={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/elements/additionalProperties/properties/type/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[g]:r.push(g),l++}if(!(c==="Stack"||c==="Grid"||c==="Card"||c==="Container"||c==="Tabs"||c==="Accordion"||c==="Divider"||c==="Spacer"||c==="Repeater"||c==="Text"||c==="Image"||c==="Icon"||c==="Badge"||c==="Avatar"||c==="EmptyState"||c==="TextInput"||c==="NumberInput"||c==="Select"||c==="MultiSelect"||c==="Checkbox"||c==="Toggle"||c==="DatePicker"||c==="Slider"||c==="FileUpload"||c==="Button"||c==="ButtonGroup"||c==="Link"||c==="Table"||c==="List"||c==="Chart"||c==="Metric"||c==="Alert"||c==="Dialog"||c==="Progress"||c==="Toast"||c==="Breadcrumb"||c==="Stepper"||c==="Drawing")){let g={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/elements/additionalProperties/properties/type/enum",keyword:"enum",params:{allowedValues:Xe.properties.elements.additionalProperties.properties.type.enum},message:"must be equal to one of the allowed values"};r===null?r=[g]:r.push(g),l++}}if(d.props!==void 0){let c=d.props;if(!(c&&typeof c=="object"&&!Array.isArray(c))){let g={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1")+"/props",schemaPath:"#/properties/elements/additionalProperties/properties/props/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[g]:r.push(g),l++}}if(d.children!==void 0){let c=d.children;if(Array.isArray(c)){let g=c.length;for(let f=0;f<g;f++)if(typeof c[f]!="string"){let w={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1")+"/children/"+f,schemaPath:"#/properties/elements/additionalProperties/properties/children/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[w]:r.push(w),l++}}else{let g={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1")+"/children",schemaPath:"#/properties/elements/additionalProperties/properties/children/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[g]:r.push(g),l++}}if(d.visible!==void 0){let c=d.visible;if(!(c&&typeof c=="object"&&!Array.isArray(c))){let g={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1")+"/visible",schemaPath:"#/properties/elements/additionalProperties/properties/visible/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[g]:r.push(g),l++}}}else{let c={instancePath:e+"/elements/"+i.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[c]:r.push(c),l++}}}else{let i={instancePath:e+"/elements",schemaPath:"#/properties/elements/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[i]:r.push(i),l++}}if(a.actions!==void 0){let n=a.actions;if(!(n&&typeof n=="object"&&!Array.isArray(n))){let i={instancePath:e+"/actions",schemaPath:"#/properties/actions/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[i]:r.push(i),l++}}if(a.meta!==void 0){let n=a.meta;if(!(n&&typeof n=="object"&&!Array.isArray(n))){let i={instancePath:e+"/meta",schemaPath:"#/properties/meta/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[i]:r.push(i),l++}}if(a.persistState!==void 0&&typeof a.persistState!="boolean"){let n={instancePath:e+"/persistState",schemaPath:"#/properties/persistState/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[n]:r.push(n),l++}if(a.skipPersistState!==void 0&&typeof a.skipPersistState!="boolean"){let n={instancePath:e+"/skipPersistState",schemaPath:"#/properties/skipPersistState/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[n]:r.push(n),l++}if(a.dataAccess!==void 0){let n=a.dataAccess;if(n&&typeof n=="object"&&!Array.isArray(n)){for(let i in n)if(!(i==="enabled"||i==="readable"||i==="restricted"||i==="summaries")){let d={instancePath:e+"/dataAccess",schemaPath:"#/properties/dataAccess/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:i},message:"must NOT have additional properties"};r===null?r=[d]:r.push(d),l++}if(n.enabled!==void 0&&typeof n.enabled!="boolean"){let i={instancePath:e+"/dataAccess/enabled",schemaPath:"#/properties/dataAccess/properties/enabled/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[i]:r.push(i),l++}if(n.readable!==void 0){let i=n.readable;if(Array.isArray(i)){let d=i.length;for(let c=0;c<d;c++)if(typeof i[c]!="string"){let g={instancePath:e+"/dataAccess/readable/"+c,schemaPath:"#/properties/dataAccess/properties/readable/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[g]:r.push(g),l++}}else{let d={instancePath:e+"/dataAccess/readable",schemaPath:"#/properties/dataAccess/properties/readable/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[d]:r.push(d),l++}}if(n.restricted!==void 0){let i=n.restricted;if(Array.isArray(i)){let d=i.length;for(let c=0;c<d;c++)if(typeof i[c]!="string"){let g={instancePath:e+"/dataAccess/restricted/"+c,schemaPath:"#/properties/dataAccess/properties/restricted/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[g]:r.push(g),l++}}else{let d={instancePath:e+"/dataAccess/restricted",schemaPath:"#/properties/dataAccess/properties/restricted/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[d]:r.push(d),l++}}if(n.summaries!==void 0&&typeof n.summaries!="boolean"){let i={instancePath:e+"/dataAccess/summaries",schemaPath:"#/properties/dataAccess/properties/summaries/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[i]:r.push(i),l++}}else{let i={instancePath:e+"/dataAccess",schemaPath:"#/properties/dataAccess/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[i]:r.push(i),l++}}}else{let n={instancePath:e,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),l++}return tt.errors=r,l===0}var X=et,rt=["javascript:","data:text/html","data:text/javascript","data:application/javascript","vbscript:","file:"],Pt=["https:","http:","data:image/","data:font/","data:application/octet-stream","mailto:","tel:","#"],Ct=/^on[a-z]+$/i,ot=[/<\s*script/i,/<\s*iframe/i,/<\s*object/i,/<\s*embed/i,/javascript\s*:/i,/data\s*:\s*text\/html/i,/expression\s*\(/i,/url\s*\(\s*javascript/i];function Q(a){let e=[];if(!X(a)&&X.errors){for(let r of X.errors)e.push({path:r.instancePath||"/",message:r.message||"Schema validation error",severity:"error"});return{valid:!1,errors:e,warnings:[]}}let o=a;Et(o,e),jt(o,e),Mt(o,e),Tt(o,e);let s=JSON.stringify(o).length;return s>1e5&&e.push({path:"/",message:`Manifest size (${(s/1024).toFixed(1)}KB) exceeds 100KB limit`,severity:"warning"}),{valid:!e.some(r=>r.severity==="error"),errors:e.filter(r=>r.severity==="error"),warnings:e.filter(r=>r.severity!=="error")}}function Et(a,e){for(let[t,o]of Object.entries(a.elements))if(o.props){for(let[s,r]of Object.entries(o.props))if(typeof r=="string"){for(let l of ot)l.test(r)&&e.push({path:`/elements/${t}/props/${s}`,message:`Potentially dangerous content detected (matches ${l.source})`,severity:"error"});if(st(r)){let l=r.toLowerCase().trim();for(let n of rt)l.startsWith(n)&&e.push({path:`/elements/${t}/props/${s}`,message:`Dangerous URL scheme rejected: ${n}`,severity:"error"});Pt.some(n=>l.startsWith(n))||l.startsWith("data:")&&e.push({path:`/elements/${t}/props/${s}`,message:`Data URL scheme not in allowlist: ${l.split(";")[0]}`,severity:"warning"})}Ct.test(s)&&e.push({path:`/elements/${t}/props/${s}`,message:`Event handler property not allowed: ${s}`,severity:"error"})}if(o.children){for(let s of o.children)if(typeof s=="string")for(let r of ot)r.test(s)&&e.push({path:`/elements/${t}/children`,message:`Potentially dangerous content in children: ${r.source}`,severity:"error"})}}if(a.actions){for(let[t,o]of Object.entries(a.actions))if(o.data){for(let[s,r]of Object.entries(o.data))if(typeof r=="string"&&st(r)){let l=r.toLowerCase().trim();for(let n of rt)l.startsWith(n)&&e.push({path:`/actions/${t}/data/${s}`,message:`Dangerous URL scheme in action data: ${n}`,severity:"error"})}}}}function st(a){return/^[a-z][a-z0-9+.-]*:/i.test(a)}function jt(a,e){let t=a.schema?.tables?Object.keys(a.schema.tables):[],o=new Set;if(a.state)for(let s of Object.keys(a.state))o.add(s);if(!(t.length===0&&o.size===0)){for(let[s,r]of Object.entries(a.elements))if(r.props)for(let[l,n]of Object.entries(r.props)){if(typeof n=="string"&&n.startsWith("$state:")){let i=n.slice(7),d=i.split("/")[0].split(".")[0];d&&!o.has(d)&&!t.includes(d)&&e.push({path:`/elements/${s}/props/${l}`,message:`$state:${i} references unknown state path`,severity:"warning"})}if(typeof n=="string"&&n.startsWith("$computed:")){let i=n.slice(10);if(i.startsWith("sum:")||i.startsWith("avg:")){let[d,c]=i.split(":"),[g,f]=c.split("/");t.includes(g)?f&&a.schema?.tables[g]&&(Object.keys(a.schema.tables[g].columns).includes(f)||e.push({path:`/elements/${s}/props/${l}`,message:`$computed references unknown column: ${g}/${f}`,severity:"error"})):e.push({path:`/elements/${s}/props/${l}`,message:`$computed references unknown table: ${g}`,severity:"error"})}else if(i.startsWith("count:")){let d=i.slice(6);t.includes(d)||e.push({path:`/elements/${s}/props/${l}`,message:`$computed:count references unknown table: ${d}`,severity:"error"})}}}}}function Mt(a,e){for(let[t,o]of Object.entries(a.elements))U(o.type)||e.push({path:`/elements/${t}/type`,message:`Unknown component type: ${o.type}`,severity:"error"})}function Tt(a,e){let t=new Set(Object.keys(a.elements));t.has(a.root)||e.push({path:"/root",message:`Root element "${a.root}" not found in elements`,severity:"error"});for(let[o,s]of Object.entries(a.elements))if(s.children)for(let r of s.children)t.has(r)||e.push({path:`/elements/${o}/children`,message:`Child element "${r}" not found in elements`,severity:"error"});Rt(a,e)}function Rt(a,e){let t=new Set,o=new Set;function s(r,l){if(o.has(r))return e.push({path:`/elements/${r}`,message:`Circular reference detected: ${[...l,r].join(" \u2192 ")}`,severity:"error"}),!0;if(t.has(r))return!1;t.add(r),o.add(r);let n=a.elements[r];if(n?.children){for(let i of n.children)if(s(i,[...l,r]))return!0}return o.delete(r),!1}s(a.root,[])}import{html as u}from"lit";function at(a){return ee(a.manifest.root,a)}function ee(a,e){try{let t=e.manifest.elements[a];if(!t)return u``;if(t.visible&&!Lt(t.visible,e))return u``;let o=t.type;if(o==="Repeater")return It(t,e);let s=nt(t.props||{},e),r=(t.children||[]).map(l=>ee(l,e));switch(o){case"Stack":return u`<forge-stack .props=${s} .store=${e.store} .onAction=${e.onAction} .itemContext=${e.itemContext||null}>${r}</forge-stack>`;case"Grid":return u`<forge-grid .props=${s} .store=${e.store} .onAction=${e.onAction}>${r}</forge-grid>`;case"Card":return u`<forge-card .props=${s} .store=${e.store} .onAction=${e.onAction}>${r}</forge-card>`;case"Container":return u`<forge-container .props=${s} .store=${e.store}>${r}</forge-container>`;case"Tabs":return u`<forge-tabs .props=${s} .store=${e.store} .onAction=${e.onAction}>${r}</forge-tabs>`;case"Accordion":return u`<forge-accordion .props=${s} .store=${e.store}>${r}</forge-accordion>`;case"Divider":return u`<forge-divider .props=${s} .store=${e.store}></forge-divider>`;case"Spacer":return u`<forge-spacer .props=${s} .store=${e.store}></forge-spacer>`;case"Text":return u`<forge-text .props=${s} .store=${e.store}></forge-text>`;case"Image":return u`<forge-image .props=${s} .store=${e.store}></forge-image>`;case"Icon":return u`<forge-icon .props=${s} .store=${e.store}></forge-icon>`;case"Badge":return u`<forge-badge .props=${s} .store=${e.store}></forge-badge>`;case"Avatar":return u`<forge-avatar .props=${s} .store=${e.store}></forge-avatar>`;case"EmptyState":return u`<forge-empty-state .props=${s} .store=${e.store}></forge-empty-state>`;case"TextInput":return u`<forge-text-input .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-text-input>`;case"NumberInput":return u`<forge-number-input .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-number-input>`;case"Select":return u`<forge-select .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-select>`;case"MultiSelect":return u`<forge-multi-select .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-multi-select>`;case"Checkbox":return u`<forge-checkbox .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-checkbox>`;case"Toggle":return u`<forge-toggle .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-toggle>`;case"DatePicker":return u`<forge-date-picker .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-date-picker>`;case"Slider":return u`<forge-slider .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-slider>`;case"FileUpload":return u`<forge-file-upload .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-file-upload>`;case"Button":return u`<forge-button .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-button>`;case"ButtonGroup":return u`<forge-button-group .props=${s} .store=${e.store} .onAction=${e.onAction}>${r}</forge-button-group>`;case"Link":return u`<forge-link .props=${s} .store=${e.store}></forge-link>`;case"Table":return u`<forge-table .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-table>`;case"List":return u`<forge-list .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-list>`;case"Chart":return u`<forge-chart .props=${s} .store=${e.store}></forge-chart>`;case"Metric":return u`<forge-metric .props=${s} .store=${e.store}></forge-metric>`;case"Alert":return u`<forge-alert .props=${s} .store=${e.store}>${r}</forge-alert>`;case"Dialog":return u`<forge-dialog .props=${s} .store=${e.store} .onAction=${e.onAction}>${r}</forge-dialog>`;case"Progress":return u`<forge-progress .props=${s} .store=${e.store}></forge-progress>`;case"Toast":return u`<forge-toast .props=${s} .store=${e.store}></forge-toast>`;case"Breadcrumb":return u`<forge-breadcrumb .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-breadcrumb>`;case"Stepper":return u`<forge-stepper .props=${s} .store=${e.store} .onAction=${e.onAction}>${r}</forge-stepper>`;case"Drawing":return u`<forge-drawing .props=${s} .store=${e.store} .onAction=${e.onAction}></forge-drawing>`;default:return u`<forge-error .props=${{msg:`Unknown: ${o}`}} .store=${e.store}></forge-error>`}}catch(t){return console.warn(`[forge] renderElement("${a}") threw:`,t?.message||t),u`<forge-error .props=${{msg:`Element "${a}" failed to render: ${t?.message||"unknown error"}`}} .store=${e.store}></forge-error>`}}function It(a,e){let t=nt(a.props||{},e),o=t.data,s=[];Array.isArray(o)?s=o:o&&typeof o=="object"&&(s=Object.values(o));let r=a.children||[];if(r.length===0)return u`<forge-repeater .props=${t} .store=${e.store}></forge-repeater>`;let l=[];for(let n=0;n<s.length;n++){let i=s[n],d=typeof i=="object"&&i!==null?{...i,_index:n}:{value:i,_index:n},c={...e,itemContext:d};z(d);try{for(let g of r)l.push(ee(g,c))}finally{z(null)}}return s.length===0?u`<forge-repeater .props=${t} .store=${e.store}></forge-repeater>`:u`<forge-repeater .props=${t} .store=${e.store}>${l}</forge-repeater>`}function nt(a,e){let t={};for(let[o,s]of Object.entries(a))t[o]=M(e.store,s);return t}function Lt(a,e){if(!a||typeof a!="object")return!0;let t=a.$when??a;if(!t||typeof t!="object")return!0;let{path:o,eq:s,neq:r,gt:l,gte:n,lt:i,lte:d,in:c,exists:g}=t;if(!o||typeof o!="string")return!0;let f=M(e.store,`$state:${o}`);return g!==void 0?g?f!==void 0:f===void 0:s!==void 0?f===s:r!==void 0?f!==r:l!==void 0&&typeof f=="number"?f>l:n!==void 0&&typeof f=="number"?f>=n:i!==void 0&&typeof f=="number"?f<i:d!==void 0&&typeof f=="number"?f<=d:c!==void 0&&Array.isArray(c)?c.includes(f):!0}import{css as te}from"lit";var it=te`
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
`,lt=te`
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
`,re=te`
  :host {
    display: block;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;function oe(a="default"){switch(a){case"minimal":return ct();case"default":return dt();case"full":return zt()}}function ct(){return["You can create interactive web applications by generating Forge manifests \u2014 declarative JSON that describes UI, data, and behavior. You never write code.","","MANIFEST STRUCTURE:","{",'  "manifest": "0.1.0",','  "id": "my-app",','  "root": "root-element-id",','  "state": { "key": "initial value" },','  "elements": {','    "root-element-id": {','      "type": "Stack",','      "props": { "spacing": "md" },','      "children": ["child1", "child2"]',"    }","  },",'  "actions": { "actionName": { "type": "mutateState", "path": "state/path" } }',"}","",'ELEMENT FORMAT: { "type": "ComponentName", "props": {}, "children": ["id"] }','Root element is set in "root" field. All elements are a flat map \u2014 reference by ID, never nest.',"","COMPONENTS (37 types):",Object.entries(Ye).map(([t,o])=>`  ${t}: ${o.join(", ")}`).join(`
`),"","STATE BINDINGS:","  $state:path         \u2014 reactive value","  $computed:path       \u2014 derived from table data","  $item:field          \u2014 current item in Repeater","  $form:fieldId        \u2014 value from input component","","DESIGN TOKENS:","  Spacing: xs, sm, md, lg, xl","  Colors: primary, secondary, success, warning, error, muted, default","  Sizes: sm, md, lg","  Radius: none, sm, md, lg, full","","Never use raw CSS values, hex colors, or pixel sizes. Always use tokens.","","EXAMPLE:","{",'  "manifest": "0.1.0", "id": "hello", "root": "root",','  "elements": {','    "root": { "type": "Card", "props": { "title": "Hello World" }, "children": ["msg", "btn"] },','    "msg": { "type": "Text", "props": { "content": "Welcome to Forge!", "variant": "heading2" } },','    "btn": { "type": "Button", "props": { "label": "Click Me", "action": "greet" } }',"  },",'  "actions": { "greet": { "type": "setState", "path": "greeting", "value": "Hello!" } }',"}"].join(`
`)}function dt(){return[ct(),"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","DETAILED COMPONENT REFERENCE","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","LAYOUT:",'  Stack(spacing, direction: "vertical"|"horizontal", align: "start"|"center"|"end"|"stretch", gap)','  Grid(columns: number|"auto", gap, minChildWidth)','  Card(title?, variant: "default"|"outlined"|"elevated"|"compact", padding)','  Container(maxWidth: "sm"|"md"|"lg"|"xl"|"full", padding)',"  Tabs(items: string[], bind: $state:path)","  Accordion(items: [{title, contentId}], multiple?: boolean)",'  Divider(direction: "horizontal"|"vertical", spacing)',"  Spacer(size)","","CONTENT:",'  Text(content: string|$binding, variant: "body"|"heading1"|"heading2"|"heading3"|"caption"|"label"|"code", weight, color, align)','  Image(src, alt, aspectRatio: "auto"|"1:1"|"4:3"|"16:9", fit: "cover"|"contain"|"fill", radius)',"  Icon(name, size, color)",'  Badge(text|$binding, colorScheme, variant: "solid"|"subtle"|"outline")',"  Avatar(src?, name, size)","  EmptyState(title, description, icon?, actionLabel?, action?)","","INPUT:","  TextInput(label, placeholder?, bind: $state:path, multiline?, required?, maxLength?)","  NumberInput(label, bind: $state:path, min?, max?, step?, required?)","  Select(label, options: [{value, label}]|string[], bind: $state:path, placeholder?, required?)","  MultiSelect(label, options: [{value, label}]|string[], bind: $state:path, maxSelections?)","  Checkbox(label, bind: $state:path, description?)","  Toggle(label, bind: $state:path, description?)",'  DatePicker(label, bind: $state:path, format: "date"|"datetime"|"time", min?, max?)',"  Slider(label, bind: $state:path, min, max, step, showValue?)","  FileUpload(label, accept?, maxSize?, multiple?, bind: $state:path)","","ACTION:",'  Button(label, action, variant: "primary"|"secondary"|"danger"|"ghost", size, icon?, disabled?)','  ButtonGroup(direction: "horizontal"|"vertical", spacing)','  Link(label, href, variant: "default"|"subtle"|"bold", external?)',"","DATA:","  Table(dataPath, columns: [{key, label, sortable?, format?}], pageSize?, searchable?, emptyMessage?)","  List(dataPath, template: elementId, emptyMessage?, dividers?)",'  Chart(variant: "line"|"bar"|"donut"|"area"|"scatter"|"pie", dataPath, xKey?, yKey?, colorScheme?, height?)','  Metric(label, value|$binding, format: "number"|"currency"|"percent", goal?, trend?: "up"|"down"|"flat", prefix?, suffix?)',"","FEEDBACK:",'  Alert(title, message?, variant: "info"|"success"|"warning"|"error", dismissible?)',"  Dialog(title, trigger: elementId, confirmLabel?, cancelLabel?, action?)",'  Progress(value|$binding, max, variant: "bar"|"ring", size, label?)','  Toast(message, variant: "info"|"success"|"warning"|"error", duration?)',"","NAVIGATION:","  Breadcrumb(items: [{label, view?}])",'  Stepper(steps: [{label, description?}], activeStep: $state:path, variant: "horizontal"|"vertical")',"","DRAWING:","  Drawing(width, height, shapes: Shape[], viewBox?)","  Shape types: rect, circle, ellipse, line, text, arrow, path, icon, badge","  Shapes use design tokens for fill/stroke. Never raw SVG.","","CONDITIONAL RENDERING:",'{ "type": "Alert", "props": { ... }, "visible": { "$when": { "path": "state/path", "gt": 0 } } }',"Operators: eq, neq, gt, lt, gte, lte, in, notIn, exists.","","REPEATER PATTERN:",'{ "type": "Repeater", "props": { "dataPath": "tableName", "template": "templateElementId" } }',"Template element uses $item:field bindings for each row.","","ACTIONS:","  mutateState \u2014 append/update/delete rows in a table. Path is the table name.","  setState \u2014 set a state value.","  submitForm \u2014 collect form inputs and trigger an action.","  navigate \u2014 switch views.","","SCHEMA (optional, for persistent data):",'{ "version": 1, "tables": { "tableName": { "columns": { "col": { "type": "string|number|boolean" } } } } }',"","GUIDELINES:","1. Always use design tokens \u2014 never raw CSS, hex colors, or pixel sizes.","2. Use flat element maps \u2014 reference children by ID, never nest.","3. Use Repeater for lists \u2014 define template once, bind to data.","4. Always handle empty states with EmptyState component.","5. Use conditional visibility for show/hide logic.",'6. State paths use "/" separators: "view/active", "goals/calories".',"7. Actions are declarative \u2014 never write JavaScript.","8. Keep manifests under 100KB."].join(`
`)}function zt(){return[dt(),"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","DATA ACCESS (Reading App Data)","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","Forge apps can optionally allow the LLM to read user data for personalized updates.","This is DISABLED by default. The user must consent at app creation time.","","PERMISSION DECLARATION:",'{ "dataAccess": { "enabled": true, "readable": ["table1"], "restricted": ["table2"] } }',"  enabled: false (default) \u2014 LLM cannot read any app data.",'  enabled: true \u2014 LLM can read tables in "readable". Tables in "restricted" are never sent.','  Always inform the user: "This app allows the AI to read your [data] for personalized updates."',"","READING DATA VIA TOOLS:","","forge_read_app_data \u2014 returns raw rows from permitted tables:",'  Input: { app_id, tables: ["tableName"], limit: 20, since: "2026-04-01" }',"  Output: { schema, data: { tableName: [...rows] }, rowCounts }","","forge_query_app_data \u2014 returns aggregated summaries (more token-efficient):",'  Input: { app_id, queries: [{ table, aggregate: "count|max|min|avg|trend", groupBy?, column?, where? }] }',"  Output: { results: [{ data: {...} }] }","","PREFER forge_query_app_data over forge_read_app_data.","Summaries cost ~50-150 tokens vs. ~2,000+ for raw rows.","","THE DATA INTERACTION LOOP:","1. Read \u2014 call forge_query_app_data to understand user data (trends, patterns, gaps)","2. Reason \u2014 identify what should change in the app (adjust targets, add alerts, modify plans)","3. Update \u2014 call forge_update_app with a manifest patch to modify the app structure","","The LLM updates the MANIFEST (app structure, plans, goals, UI), not the user's raw data.","Workout logs, tracked meals, journal entries stay untouched in TinyBase.","The LLM modifies the app AROUND the data.","","Example: the LLM reads that squat weight has plateaued for 3 weeks. It sends a manifest patch",'that changes the squat rep scheme from 5\xD75 to 3\xD78, adds an Alert saying "Deload week \u2014 lighter',`weight, more reps," and updates the goal Metric. The user's logged workouts are unchanged \u2014 only the plan adapts.`,"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","EXAMPLE \u2014 HABIT TRACKER","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","{",'  "manifest": "0.1.0",','  "id": "habit-tracker",','  "root": "shell",','  "schema": { "version": 1, "tables": { "habits": { "columns": {','    "name": { "type": "string" },','    "streak": { "type": "number", "default": 0 },','    "done_today": { "type": "boolean", "default": false },','    "icon": { "type": "string", "default": "star" }',"  } } } },",'  "state": { "view/active": "today" },','  "elements": {','    "shell": { "type": "Container", "props": { "maxWidth": "md", "padding": "lg" }, "children": ["header", "tabs", "content"] },','    "header": { "type": "Stack", "props": { "direction": "horizontal", "align": "center", "spacing": "md" }, "children": ["title", "streak-metric"] },','    "title": { "type": "Text", "props": { "content": "Daily Habits", "variant": "heading1" } },','    "streak-metric": { "type": "Metric", "props": { "label": "Best Streak", "value": "$computed:habits/maxStreak", "format": "number", "suffix": " days" } },','    "tabs": { "type": "Tabs", "props": { "items": ["Today", "All Habits", "Add New"], "bind": "$state:view/active" } },','    "content": { "type": "Stack", "props": { "spacing": "md" }, "children": ["habit-list", "empty"] },','    "habit-list": { "type": "Repeater", "props": { "dataPath": "habits", "template": "habit-row" } },','    "habit-row": { "type": "Card", "props": { "variant": "outlined", "padding": "md" }, "children": ["habit-info", "habit-toggle"] },','    "habit-info": { "type": "Stack", "props": { "direction": "horizontal", "align": "center", "spacing": "sm" }, "children": ["habit-icon", "habit-name", "habit-streak"] },','    "habit-icon": { "type": "Icon", "props": { "name": "$item:icon", "size": "md", "color": "primary" } },','    "habit-name": { "type": "Text", "props": { "content": "$item:name", "weight": "medium" } },','    "habit-streak": { "type": "Badge", "props": { "text": "$item:streak", "colorScheme": "success", "variant": "subtle" } },','    "habit-toggle": { "type": "Toggle", "props": { "label": "Done today", "bind": "$item:done_today" } },','    "empty": { "type": "EmptyState", "props": { "title": "No habits yet", "description": "Add your first habit to start tracking", "icon": "plus-circle", "actionLabel": "Add Habit", "action": "show-add-form" }, "visible": { "$when": { "path": "habits", "eq": [] } } }',"  },",'  "actions": {','    "toggle-habit": { "type": "mutateState", "path": "habits", "operation": "update", "key": "{{id}}", "data": { "done_today": "{{!done_today}}" } },','    "add-habit": { "type": "mutateState", "path": "habits", "operation": "append", "data": { "name": "$form:habit-name", "icon": "$form:habit-icon", "streak": 0, "done_today": false } },','    "delete-habit": { "type": "mutateState", "path": "habits", "operation": "delete", "key": "{{id}}" },','    "show-add-form": { "type": "setState", "path": "view/active", "value": "Add New" }',"  }","}","","GUIDELINES:","1. Always use design tokens \u2014 never raw CSS, hex colors, or pixel sizes.","2. Keep manifests under ~100KB \u2014 if an app needs more, it outgrew Forge.","3. Use flat element maps \u2014 reference children by ID, never nest.","4. Data tables use pagination \u2014 never dump hundreds of rows; set pageSize on Table.","5. Actions are declarative \u2014 never write JavaScript callbacks or event handlers.","6. Shapes in Drawing are data \u2014 never write raw SVG markup. Use the shape types.",'7. State paths use "/" separators: "view/active", "goals/calories".',"8. Prefer Repeater for lists \u2014 define template once, bind to data path.","9. Always handle empty states with EmptyState component.",'10. Use conditional visibility: "visible": {"$when": {...}} to show/hide elements.',"11. Data access is opt-in \u2014 set dataAccess.enabled: false (or omit) unless user wants LLM to read data.","12. Prefer query over read \u2014 use forge_query_app_data for aggregates instead of forge_read_app_data.","13. Never modify user data directly \u2014 read to reason, then update the manifest, not the records."].join(`
`)}function se(){return{type:"object",required:["manifest","id","elements"],properties:{manifest:{type:"string",const:"0.1.0"},id:{type:"string",pattern:"^[a-z0-9][a-z0-9-]*$"},root:{type:"string"},title:{type:"string"},schema:{type:"object",properties:{version:{type:"number"},tables:{type:"object",additionalProperties:{type:"object",properties:{columns:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:["string","number","boolean"]},default:{}},required:["type"]}}},required:["columns"]}}}},state:{type:"object",additionalProperties:{}},elements:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:Ze},props:{type:"object"},children:{type:"array",items:{type:"string"}},visible:{type:"object",properties:{$when:{type:"object",properties:{path:{type:"string"},eq:{},neq:{},gt:{type:"number"},lt:{type:"number"},gte:{type:"number"},lte:{type:"number"},in:{type:"array"},notIn:{type:"array"},exists:{type:"boolean"}},required:["path"]}}}},required:["type"]}},actions:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:["mutateState","setState","navigate","submitForm"]},path:{type:"string"},value:{},operation:{type:"string",enum:["append","update","delete"]},data:{type:"object"},key:{type:"string"},formId:{type:"string"},action:{type:"string"}},required:["type"]}},dataAccess:{type:"object",properties:{enabled:{type:"boolean",default:!1},readable:{type:"array",items:{type:"string"}},restricted:{type:"array",items:{type:"string"}},summaries:{type:"boolean",default:!1}}},persistState:{type:"boolean"},skipPersistState:{type:"boolean"}}}}var Nt={container:"Stack",row:"Stack",column:"Stack",text:"Text",heading:"Text",label:"Text",image:"Image",icon:"Icon",button:"Button",link:"Link",textInput:"TextInput",numberInput:"NumberInput",checkbox:"Checkbox",toggle:"Toggle",select:"Select",divider:"Divider",spacer:"Spacer",card:"Card",table:"Table",list:"List",alert:"Alert",progress:"Progress",badge:"Badge",avatar:"Avatar"};function Ot(a){let e={},t=0;function o(n){let i=n.id||`a2ui-${t++}`,d=Nt[n.type];if(!d||!U(d))return e[i]={type:"Text",props:{content:`[Unsupported A2UI type: ${n.type}]`,variant:"caption",colorScheme:"secondary"}},i;let c=Dt(n.type,n.props||{}),g=(n.children||[]).map(f=>o(f));return e[i]={type:d,props:c,children:g.length>0?g:void 0},i}let r=(a.components||a.content||[]).map(n=>o(n)),l=r.length===1?r[0]:"a2ui-root";return r.length>1&&(e[l]={type:"Stack",props:{gap:"md"},children:r}),{manifest:"0.1.0",id:`a2ui-${Date.now()}`,root:l,elements:e,actions:{}}}function Dt(a,e){let t={...e};switch(a){case"heading":t.variant="heading",t.content=e.text||e.content||"",delete t.text;break;case"text":case"label":t.content=e.text||e.content||"",delete t.text;break;case"row":t.direction="row",t.gap=e.gap||e.spacing||"md";break;case"column":t.direction="column",t.gap=e.gap||e.spacing||"md";break;case"container":t.gap=e.gap||e.spacing||"md";break;case"image":t.src=e.src||e.url||"",t.alt=e.alt||"";break;case"button":t.label=e.text||e.label||"",t.variant=e.variant||e.style||"default";break;case"textInput":t.placeholder=e.placeholder||"",t.value=e.value||"",t.label=e.label||"";break;case"numberInput":t.placeholder=e.placeholder||"",t.value=e.value??0,t.label=e.label||"";break;case"select":e.options&&Array.isArray(e.options)&&(t.options=e.options.map(o=>typeof o=="string"?{value:o,label:o}:o));break;case"alert":t.variant=e.type||e.severity||"info",t.content=e.message||e.text||e.content||"",delete t.message,delete t.text;break;case"progress":t.value=e.value??e.percent??0;break}return t}function pt(a){if(!a||typeof a!="object")return!1;let e=a;return!!(Array.isArray(e.components)||Array.isArray(e.content)||typeof e.type=="string"&&(e.type==="adaptive-card"||e.type.startsWith("a2ui"))||typeof e.version=="string"&&e.version.startsWith("a2ui")||!e.elements&&!e.manifest&&Array.isArray(e.content))}function ae(a){return pt(a)?Ot(a):a}function Ut(a){return`forge_${(a||"global").replace(/[^a-zA-Z0-9-]/g,"_")}`}function gt(a,e,t="none"){let o=Ut(e),s=t,r=null,l=!1,n=!1,i=null,d=null,c=null,g=[];function f(){let b=w();for(let v of g)try{v(b)}catch{}}function w(){return{mode:s,isPersisting:r!=null&&l,lastSaved:i,lastLoaded:d,error:c,dbName:s==="indexeddb"?o:null}}async function I(){if(r)return r;try{let{createIndexedDbPersister:b}=await import("tinybase/persisters/persister-indexed-db");return r=b(a,o),c=null,r}catch(b){throw c=`IndexedDB unavailable: ${b.message}`,f(),b}}async function N(){if(s==="none")return;let b=await I();try{await b.load(),d=Date.now()}catch(v){c=`Load failed: ${v.message}`,f()}try{b.startAutoSave(),l=!0}catch(v){c=`Auto-save failed: ${v.message}`}try{b.startAutoLoad(1),n=!0}catch(v){c=`Auto-load failed: ${v.message}`}f()}async function x(){if(r){l&&(r.stopAutoSave(),l=!1),n&&(r.stopAutoLoad(),n=!1);try{await r.save(),i=Date.now()}catch(b){c=`Final save failed: ${b.message}`}f()}}async function j(){if(!(s==="none"||!r)){try{await r.save(),i=Date.now(),c=null}catch(b){c=`Save failed: ${b.message}`}f()}}async function E(){if(!(s==="none"||!r)){try{await r.load(),d=Date.now(),c=null}catch(b){c=`Load failed: ${b.message}`}f()}}async function S(){if(await x(),r){try{r.destroy()}catch{}r=null}g=[],f()}function A(b){if(b===s)return;let v=s;s=b,v==="indexeddb"&&b==="none"&&(r&&l&&(r.stopAutoSave(),l=!1),r&&n&&(r.stopAutoLoad(),n=!1)),b==="indexeddb"&&v==="none"&&N().catch(()=>{}),f()}function $(b){return g.push(b),()=>{g=g.filter(v=>v!==b)}}return{start:N,stop:x,save:j,load:E,setMode:A,getStatus:w,addListener:$,destroy:S}}var F=class{constructor(e=50){this._stack=[];this._position=-1;this._listeners=[];this._maxDepth=e}push(e){if(this._position<this._stack.length-1&&(this._stack=this._stack.slice(0,this._position+1)),this._position>=0){let t=this._stack[this._position];if(JSON.stringify(t)===JSON.stringify(e))return}this._stack.push(structuredClone(e)),this._stack.length>this._maxDepth?this._stack.shift():this._position++,this._notifyListeners()}undo(){return this._position<=0?null:(this._position--,this._notifyListeners(),structuredClone(this._stack[this._position]))}redo(){return this._position>=this._stack.length-1?null:(this._position++,this._notifyListeners(),structuredClone(this._stack[this._position]))}current(){return this._position<0?null:structuredClone(this._stack[this._position])}jumpTo(e){return e<0||e>=this._stack.length?null:(this._position=e,this._notifyListeners(),structuredClone(this._stack[this._position]))}getState(){return{canUndo:this._position>0,canRedo:this._position<this._stack.length-1,position:this._position,total:this._stack.length}}getTimeline(){return this._stack.map((e,t)=>({position:t,id:e.id}))}clear(){this._stack=[],this._position=-1,this._notifyListeners()}addListener(e){return this._listeners.push(e),()=>{this._listeners=this._listeners.filter(t=>t!==e)}}_notifyListeners(){let e=this.getState();for(let t of this._listeners)try{t(e)}catch{}}};import{html as p,css as y,svg as T,nothing as h}from"lit";import{LitElement as Vt}from"lit";var B=class B extends Vt{constructor(){super(...arguments);this._instanceId=`forge-${++B._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(t){if(!this.store)return t;this.itemContext&&z(this.itemContext);try{return M(this.store,t)}finally{z(null)}}getProp(t){let o=this.props?.[t];return typeof o=="string"&&(o.startsWith("$state:")||o.startsWith("$computed:")||o.startsWith("$item:")||o.startsWith("$expr:")||o.includes("{{")&&o.includes("}}"))?this.resolve(o):o}getArray(t){let o=this.getProp(t);return Array.isArray(o)?o:o&&typeof o=="object"?Object.values(o):[]}getString(t,o=""){let s=this.getProp(t);return typeof s=="string"?s:String(s??o)}getNumber(t,o=0){let s=this.getProp(t);return typeof s=="number"?s:Number(s)||o}getBool(t,o=!1){let s=this.getProp(t);return typeof s=="boolean"?s:o}dispatchAction(t,o){this.onAction&&this.onAction(t,o),this.dispatchEvent(new CustomEvent("forge-action",{detail:{action:t,payload:o},bubbles:!0,composed:!0}))}handleAction(t){let o=this.getString("action");o&&this.dispatchAction(o,this.props)}prop(t){return this.getProp(t)}static get sharedStyles(){return[re]}gapValue(t){let o={none:"0",0:"0","3xs":"var(--forge-space-3xs)","2xs":"var(--forge-space-2xs)",xs:"var(--forge-space-xs)",sm:"var(--forge-space-sm)",md:"var(--forge-space-md)",lg:"var(--forge-space-lg)",xl:"var(--forge-space-xl)","2xl":"var(--forge-space-2xl)"};if(t==null||t==="")return"var(--forge-space-md)";let s=String(t);return s in o?o[s]:/^\d+(\.\d+)?$/.test(s)?`${s}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(s)?s:"var(--forge-space-md)"}static get styles(){return[re]}};B._instanceCounter=0;var m=B;var ne=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
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
  `}render(){let e=this.getString("direction","column"),t=e==="horizontal"||e==="row"?"row":"column",o=this.getString("gap","md"),s=this.getString("padding",""),r=this.getString("align",""),l=this.getString("justify",""),n=this.getBool("wrap"),i=this.gapValue(o),d=s?`var(--forge-space-${s}, var(--forge-space-md))`:"0";return this.setAttribute("direction",t),r&&this.setAttribute("align",r),l&&this.setAttribute("justify",l),n&&this.setAttribute("wrap",""),this.style.gap=i,this.style.padding=d,p`<slot></slot>`}};customElements.define("forge-stack",ne);var ie=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display: grid; min-width: 0; }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let e=this.getProp("columns"),t;typeof e=="number"?t=String(e):typeof e=="string"&&e?t=e:t="1";let o=/^\d+$/.test(t)?`repeat(${t}, minmax(0, 1fr))`:t,s=this.getString("gap","md"),r=this.gapValue(s),l=this.getString("padding",""),n=l?`var(--forge-space-${l}, var(--forge-space-md))`:"0";return this.style.gridTemplateColumns=o,this.style.gap=r,this.style.padding=n,/^\d+$/.test(t)&&Number(t)>=2&&this.setAttribute("responsive",""),p`<slot></slot>`}};customElements.define("forge-grid",ie);var le=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
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
  `}render(){let e=this.getString("variant",""),t=this.getString("title",""),o=this.getString("subtitle","");return e&&this.setAttribute("variant",e),p`
      ${t||o?p`
        <div class="header">
          ${t?p`<div class="title">${t}</div>`:h}
          ${o?p`<div class="subtitle">${o}</div>`:h}
        </div>
      `:h}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forge-card",le);var ce=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let e=this.getString("maxWidth",""),t={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},o=e in t?t[e]:e,s=this.getString("padding","");return o&&o!=="none"?this.style.maxWidth=o:this.style.maxWidth="",this.style.padding=s?`var(--forge-space-${s}, var(--forge-space-md))`:"",p`<slot></slot>`}};customElements.define("forge-container",ce);var de=class extends m{static get properties(){return{props:{type:Object},_active:{state:!0}}}constructor(){super(),this._active=""}static get styles(){return y`
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
  `}_itemKey(e){return typeof e=="string"?e:String(e&&typeof e=="object"?e.id??e.key??e.value??e.label??"":e??"")}_itemLabel(e){return typeof e=="string"?e:String(e&&typeof e=="object"?e.label??e.title??e.value??"":e??"")}updated(){Array.from(this.children).filter(t=>!(t instanceof HTMLScriptElement)).forEach((t,o)=>{String(o)===this._active||t.id===this._active||t.getAttribute("slot")===this._active?t.setAttribute("data-active",""):t.removeAttribute("data-active")})}_moveTo(e,t){let o=this._itemKey(t[e])||String(e);this._active=o,this.requestUpdate(),this.dispatchAction("tab-change",{active:o}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${e}`)?.focus()})}render(){let e=this.getProp("items")||[],t=Array.isArray(e)?e:[];!this._active&&t.length>0&&(this._active=this._itemKey(t[0])||"0");let o=t.findIndex((r,l)=>(this._itemKey(r)||String(l))===this._active),s=(r,l)=>{let n=-1;r.key==="ArrowRight"?n=(l+1)%t.length:r.key==="ArrowLeft"?n=(l-1+t.length)%t.length:r.key==="Home"?n=0:r.key==="End"&&(n=t.length-1),n!==-1&&(r.preventDefault(),this._moveTo(n,t))};return p`
      <div class="tabs" role="tablist">${t.map((r,l)=>{let n=this._itemKey(r)||String(l),i=this._itemLabel(r)||String(l+1),d=n===this._active;return p`
          <button class="tab" ?active=${d} role="tab" aria-selected=${d}
            id="${this._instanceId}-tab-${l}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${d?0:-1}"
            @click=${()=>{this._active=n,this.requestUpdate(),this.dispatchAction("tab-change",{active:n})}}
            @keydown=${c=>s(c,l)}>${i}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${o>=0?o:0}"><slot></slot></div>
    `}};customElements.define("forge-tabs",de);var pe=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display:block; }
    details { border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); margin-bottom:var(--forge-space-2xs); }
    summary { padding:var(--forge-space-sm) var(--forge-space-md); cursor:pointer; font-weight:var(--forge-weight-medium);
      list-style:none; display:flex; justify-content:space-between; align-items:center; }
    summary::-webkit-details-marker { display:none; }
    summary::after { content:'▸'; transition:transform var(--forge-transition-fast); }
    details[open] summary::after { transform:rotate(90deg); }
    .content { padding:var(--forge-space-sm) var(--forge-space-md); }
  `}render(){let e=this.getString("title","Section");return p`<details><summary>${e}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forge-accordion",pe);var ge=class extends m{static get styles(){return y`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forge-color-border); margin:var(--forge-space-sm) 0; }
  `}render(){return p`<hr>`}};customElements.define("forge-divider",ge);var fe=class extends m{static get styles(){return y`:host { display:block; }`}render(){let t=`var(--forge-space-${this.getString("size","md")}, var(--forge-space-md))`;return p`<div style="height:${t}"></div>`}};customElements.define("forge-spacer",fe);var ue=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display:flex; flex-direction:column; gap:var(--forge-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getArray("data"),t=this.getString("emptyMessage",""),o=this.getString("direction","column");(o==="row"||o==="horizontal")&&this.setAttribute("direction","row");let s=this.getString("gap","md");return this.style.gap=this.gapValue(s),e.length===0&&t?p`<div class="empty">${t}</div>`:p`<slot></slot>`}};customElements.define("forge-repeater",ue);var me=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
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
  `}render(){let e=this.getString("content",""),t=this.getString("variant","body"),s={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[t]||t,r=this.getString("colorScheme",""),l=this.getString("align",""),n=this.getString("weight",""),i={primary:"var(--forge-color-primary)",secondary:"var(--forge-color-text-secondary)",tertiary:"var(--forge-color-text-tertiary)",success:"var(--forge-color-success)",warning:"var(--forge-color-warning)",error:"var(--forge-color-error)",info:"var(--forge-color-info)"},d={normal:"var(--forge-weight-normal)",medium:"var(--forge-weight-medium)",semibold:"var(--forge-weight-semibold)",bold:"var(--forge-weight-bold)"},c=[];r&&i[r]&&c.push(`color:${i[r]}`),n&&d[n]&&c.push(`font-weight:${d[n]}`);let g=l?`align-${l}`:"",f=p`${e}<slot></slot>`;return s==="heading1"?p`<h1 class="${s} ${g}" style="${c.join(";")}">${f}</h1>`:s==="heading2"?p`<h2 class="${s} ${g}" style="${c.join(";")}">${f}</h2>`:s==="heading3"?p`<h3 class="${s} ${g}" style="${c.join(";")}">${f}</h3>`:p`<div class="${s} ${g}" style="${c.join(";")}">${e}<slot></slot></div>`}};customElements.define("forge-text",me);var he=class extends m{static get styles(){return y`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forge-radius-md); }
  `}render(){let e=this.getString("src",""),t=this.getString("alt",""),o=this.getString("fit","contain");return e?p`<img src="${e}" alt="${t}" style="object-fit:${o}" loading="lazy">`:p`${h}`}};customElements.define("forge-image",he);var ye=class extends m{static get styles(){return y`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forge-icon-md); height:var(--forge-icon-md); fill:currentColor; }
  `}render(){let e=this.getString("name","circle"),t={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},o=t[e]||t.circle;return p`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${o}"/></svg>`}};customElements.define("forge-icon",ye);var be=class extends m{static get styles(){return y`
    :host { display:inline-flex; align-items:center; }
    .badge { display:inline-flex; align-items:center; padding:var(--forge-space-2xs) var(--forge-space-xs);
      border-radius:var(--forge-radius-full); font-size:var(--forge-text-xs); font-weight:var(--forge-weight-medium);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); }
    .badge[variant="success"] { background:var(--forge-color-success-subtle); color:var(--forge-color-success); }
    .badge[variant="warning"] { background:var(--forge-color-warning-subtle); color:var(--forge-color-warning); }
    .badge[variant="error"] { background:var(--forge-color-error-subtle); color:var(--forge-color-error); }
  `}render(){let e=this.getString("label",""),t=this.getString("variant","");return p`<span class="badge" variant="${t}">${e}<slot></slot></span>`}};customElements.define("forge-badge",be);var ve=class extends m{static get styles(){return y`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forge-radius-full); background:var(--forge-color-primary-subtle);
      color:var(--forge-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forge-weight-semibold); font-size:var(--forge-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let e=this.getString("src",""),t=this.getString("name","?"),o=t.split(" ").map(s=>s[0]).join("").toUpperCase().slice(0,2);return p`<div class="avatar">${e?p`<img src="${e}" alt="${t}">`:o}<slot></slot></div>`}};customElements.define("forge-avatar",ve);var xe=class extends m{static get styles(){return y`
    :host { display:block; text-align:center; padding:var(--forge-space-2xl) var(--forge-space-lg); }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-xs); }
    .desc { font-size:var(--forge-text-sm); color:var(--forge-color-text-secondary); margin-bottom:var(--forge-space-md); }
  `}render(){let e=this.getString("title","Nothing here"),t=this.getString("description","");return p`
      <div class="title">${e}</div>
      ${t?p`<div class="desc">${t}</div>`:h}
      <slot></slot>
    `}};customElements.define("forge-empty-state",xe);var $e=class extends m{static get styles(){return y`
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
  `}render(){let e=this.getString("label",""),t=this.getString("placeholder",""),o=this.getString("hint",""),s=this.getString("error",""),r=this.getString("inputType","text"),l=this.getBool("multiline"),n=this.getString("value",""),i=this._instanceId;return p`
      ${e?p`<label for="${i}">${e}</label>`:h}
      ${l?p`<textarea id="${i}" placeholder="${t}" .value=${n} @input=${d=>this.dispatchAction("change",{value:d.target.value})}></textarea>`:p`<input id="${i}" type="${r}" placeholder="${t}" .value=${n} @input=${d=>this.dispatchAction("change",{value:d.target.value})}>`}
      ${o&&!s?p`<div class="hint">${o}</div>`:h}
      ${s?p`<div class="error">${s}</div>`:h}
    `}};customElements.define("forge-text-input",$e);var we=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),t=this.getProp("min"),o=this.getProp("max"),s=this.getProp("step"),r=this.getProp("value"),l=this._instanceId;return p`
      ${e?p`<label for="${l}">${e}</label>`:h}
      <input id="${l}" type="number" min=${t} max=${o} step=${s} .value=${r??""}
        @input=${n=>this.dispatchAction("change",{value:Number(n.target.value)})}>
    `}};customElements.define("forge-number-input",we);var ke=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    select { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    select:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),t=this.getProp("options")||[],o=this.getString("value",""),s=this._instanceId;return p`
      ${e?p`<label for="${s}">${e}</label>`:h}
      <select id="${s}" .value=${o} @change=${r=>this.dispatchAction("change",{value:r.target.value})}>
        ${t.map(r=>p`<option value=${typeof r=="string"?r:r.value} ?selected=${(typeof r=="string"?r:r.value)===o}>
          ${typeof r=="string"?r:r.label||r.value}
        </option>`)}
      </select>
    `}};customElements.define("forge-select",ke);var Se=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .tags { display:flex; flex-wrap:wrap; gap:var(--forge-space-2xs); padding:var(--forge-space-xs); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md); min-height:var(--forge-input-height); }
    .tag { display:inline-flex; align-items:center; gap:var(--forge-space-2xs); padding:var(--forge-space-2xs) var(--forge-space-xs);
      background:var(--forge-color-primary-subtle); color:var(--forge-color-primary); border-radius:var(--forge-radius-full);
      font-size:var(--forge-text-xs); }
    .tag button { background:none; border:none; cursor:pointer; color:inherit; font:inherit; padding:0; }
  `}render(){let e=this.getString("label",""),t=this.getProp("selected")||[];return p`
      ${e?p`<label>${e}</label>`:h}
      <div class="tags">
        ${t.map(o=>p`<span class="tag">${String(o)}<button @click=${()=>this.dispatchAction("remove",{value:o})}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forge-multi-select",Se);var Ae=class extends m{static get styles(){return y`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); margin-bottom:var(--forge-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forge-color-primary); cursor:pointer; }
    label { font-size:var(--forge-text-sm); cursor:pointer; }
  `}render(){let e=this.getString("label",""),t=this.getBool("checked"),o=this._instanceId;return p`
      <input id="${o}" type="checkbox" ?checked=${t} @change=${s=>this.dispatchAction("change",{checked:s.target.checked})}>
      ${e?p`<label for="${o}">${e}</label>`:h}
    `}};customElements.define("forge-checkbox",Ae);var _e=class extends m{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let t=this.getBool("on");this.dispatchEvent(new CustomEvent("forge-action",{detail:{actionId:"change",value:!t},bubbles:!0,composed:!0}))};this._onKeydown=t=>{(t.key==="Enter"||t.key===" "||t.key==="Spacebar")&&(t.preventDefault(),this._toggle())}}static get styles(){return y`
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
  `}render(){let t=this.getBool("on"),o=this.getString("label",""),s=this.getBool("disabled"),r=this._instanceId;return p`
      <label for="${r}" class="toggle-label">
        <button
          id="${r}"
          class="switch"
          role="switch"
          type="button"
          aria-checked="${t?"true":"false"}"
          ?disabled=${s}
          @click="${this._toggle}"
          @keydown="${this._onKeydown}"
        ></button>
        ${o?p`<span class="toggle-text">${o}</span>`:h}
      </label>
    `}};customElements.define("forge-toggle",_e);var Pe=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input { width:100%; padding:var(--forge-space-xs) var(--forge-space-sm); border:1px solid var(--forge-color-border);
      border-radius:var(--forge-radius-md); font:inherit; height:var(--forge-input-height);
      background:var(--forge-color-surface); color:var(--forge-color-text); }
    input:focus { outline:none; border-color:var(--forge-color-primary); box-shadow:0 0 0 3px var(--forge-color-primary-subtle); }
  `}render(){let e=this.getString("label",""),t=this.getString("value","");return p`
      ${e?p`<label>${e}</label>`:h}
      <input type="date" .value=${t} @change=${o=>this.dispatchAction("change",{value:o.target.value})}>
    `}};customElements.define("forge-date-picker",Pe);var Ce=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    input[type=range] { width:100%; accent-color:var(--forge-color-primary); }
    .value { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); }
  `}render(){let e=this.getString("label",""),t=this.getNumber("min",0),o=this.getNumber("max",100),s=this.getNumber("step",1),r=this.getNumber("value",t);return p`
      ${e?p`<label>${e}</label>`:h}
      <input type="range" min=${t} max=${o} step=${s} .value=${r}
        @input=${l=>this.dispatchAction("change",{value:Number(l.target.value)})}>
      <div class="value">${r}</div>
    `}};customElements.define("forge-slider",Ce);var Ee=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    label { display:block; font-size:var(--forge-text-sm); font-weight:var(--forge-weight-medium); margin-bottom:var(--forge-space-2xs); }
    .dropzone { border:2px dashed var(--forge-color-border-strong); border-radius:var(--forge-radius-md);
      padding:var(--forge-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forge-transition-fast); }
    .dropzone:hover { border-color:var(--forge-color-primary); }
    .dropzone p { color:var(--forge-color-text-secondary); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getString("label","Upload file"),t=this.getString("accept","*");return p`
      ${e?p`<label>${e}</label>`:h}
      <div class="dropzone" @click=${()=>this.shadowRoot?.querySelector("input")?.click()}>
        <p>Click or drop file here</p>
        <input type="file" accept="${t}" hidden @change=${o=>{let s=o.target.files?.[0];s&&this.dispatchAction("change",{name:s.name,size:s.size,type:s.type})}}>
      </div>
    `}};customElements.define("forge-file-upload",Ee);var je=class extends m{static get styles(){return y`
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
  `}render(){let e=this.getString("label","Button"),t=this.getString("variant","primary"),o=this.getString("size",""),s=this.getBool("disabled"),r=this.getProp("pressed");return p`<button class="${t} ${o}" ?disabled=${s}
      aria-pressed=${r==null?h:String(!!r)}
      @click=${l=>this.handleAction(l)}>${e}<slot></slot></button>`}};customElements.define("forge-button",je);var Me=class extends m{static get styles(){return y`
    :host { display:flex; gap:var(--forge-space-xs); }
  `}render(){return p`<slot></slot>`}};customElements.define("forge-button-group",Me);var Te=class extends m{static get styles(){return y`
    :host { display:inline-flex; }
    a { color:var(--forge-color-primary); text-decoration:none; font-size:var(--forge-text-sm); cursor:pointer; }
    a:hover { text-decoration:underline; }
  `}render(){let e=this.getString("label",""),t=this.getString("href","#");return p`<a href="${t}">${e}<slot></slot></a>`}};customElements.define("forge-link",Te);var Re=class extends m{static get styles(){return y`
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
  `}_statusClass(e){let t=String(e??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(t)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(t)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(t)?"neutral":["high","urgent","critical"].includes(t)?"error":["medium","med"].includes(t)?"warning":["low"].includes(t)?"info":["failed","error","rejected","blocked","overdue"].includes(t)?"error":"neutral"}_renderCell(e,t){let o=typeof e=="string"?e:e.key,s=t[o],r=e&&typeof e=="object"?e.type:void 0;if(s==null||s==="")return p`<span style="color:var(--forge-color-text-tertiary)">—</span>`;if(r==="badge"||r==="status"){let l=(e.variant&&typeof e.variant=="object"?e.variant[String(s).toLowerCase()]:null)||this._statusClass(s);return p`<span class="badge ${l}">${String(s)}</span>`}if(r==="number")return typeof s=="number"?s.toLocaleString():String(s);if(r==="date"){let l=typeof s=="string"||typeof s=="number"?new Date(s):s;return l instanceof Date&&!isNaN(l.getTime())?l.toLocaleDateString():String(s)}if(r==="currency"){let l=Number(s);return isNaN(l)?String(s):l.toLocaleString(void 0,{style:"currency",currency:e.currency||"USD"})}return r==="boolean"?s?"\u2713":"\u2717":String(s)}render(){let e=this.getProp("data")||[],t=this.getProp("columns")||[],o=this.getString("emptyMessage","No data yet"),s=this.getString("rowAction",""),r=this.getString("caption",""),l=t.length>0?t:e.length>0?Object.keys(e[0]):[];return l.length===0?p`<div class="empty">${o}</div>`:p`
      <table>
        ${r?p`<caption>${r}</caption>`:h}
        <thead><tr>${l.map(n=>{let i=typeof n=="string"?n:n.label||n.key,d=typeof n=="object"?n.align:void 0,c=typeof n=="object"?n.width:void 0;return p`<th class="${d==="right"?"align-right":d==="center"?"align-center":""}" style="${c?`width:${c}`:""}">${i}</th>`})}</tr></thead>
        <tbody>${e.length===0?p`<tr><td colspan=${l.length} class="empty">${o}</td></tr>`:e.map((n,i)=>{let d=!!s,c=d?String(n[typeof l[0]=="string"?l[0]:l[0]?.key]??`Row ${i+1}`):"";return p`<tr class="${d?"row-action":""}"
                tabindex=${d?0:h}
                role=${d?"button":h}
                aria-label=${d?c:h}
                @click=${d?()=>this.dispatchAction(s,{row:n,index:i}):void 0}
                @keydown=${d?g=>{(g.key==="Enter"||g.key===" ")&&(g.preventDefault(),this.dispatchAction(s,{row:n,index:i}))}:void 0}>
              ${l.map(g=>{let f=typeof g=="object"?g.align:void 0;return p`<td class="${f==="right"?"align-right":f==="center"?"align-center":""}">${this._renderCell(g,n)}</td>`})}</tr>`})}</tbody>
      </table>
    `}};customElements.define("forge-table",Re);var Ie=class extends m{static get styles(){return y`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forge-space-xs); }
    .item { padding:var(--forge-space-sm); border:1px solid var(--forge-color-border); border-radius:var(--forge-radius-md);
      display:flex; align-items:center; gap:var(--forge-space-sm); }
    .item:hover { background:var(--forge-color-surface-hover); }
    .empty { padding:var(--forge-space-lg); text-align:center; color:var(--forge-color-text-tertiary); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getProp("data")||[],t=this.getString("emptyMessage","No items");return e.length===0?p`<div class="empty">${t}</div>`:p`<div class="list">${e.map((o,s)=>p`
      <div class="item" data-index=${s}><slot name="item" .item=${o} .index=${s}>${JSON.stringify(o)}</slot></div>
    `)}</div>`}};customElements.define("forge-list",Ie);var Le=class extends m{constructor(){super(...arguments);this._palette=["var(--forge-color-primary)","var(--forge-color-success)","var(--forge-color-warning)","var(--forge-color-error)","var(--forge-color-info)","var(--forge-color-chart-6)","var(--forge-color-chart-7)","var(--forge-color-chart-8)","var(--forge-color-chart-9)","var(--forge-color-chart-10)"]}static get styles(){return y`
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
  `}_niceMax(t){if(t<=0)return 1;let o=Math.pow(10,Math.floor(Math.log10(t))),s=t/o;return(s<=1?1:s<=2?2:s<=5?5:10)*o}render(){let t=this.getString("chartType","bar"),o=this.getProp("data")||[],s=this.getString("title",""),r=this.getString("xKey","label")||this.getString("labelKey","label"),l=this.getString("yKey","value")||this.getString("valueKey","value"),n=this.getString("color","");if(!o||o.length===0)return p`
        ${s?p`<div class="title">${s}</div>`:h}
        <div class="empty">No data to display</div>
      `;let i=o.map(x=>typeof x=="number"?{label:"",value:x}:x&&typeof x=="object"?{label:String(x[r]??x.label??x.name??x.x??""),value:Number(x[l]??x.value??x.y??0)||0,color:x.color}:{label:String(x),value:0}),d=600,c=260,g={top:8,right:16,bottom:36,left:48},f=d-g.left-g.right,w=c-g.top-g.bottom,I,N=h;if(t==="pie"||t==="donut"){let x=i.reduce((_,k)=>_+Math.max(0,k.value),0)||1,j=d/2,E=c/2,S=Math.min(f,w)/2-8,A=t==="donut"?S*.55:0,$=-Math.PI/2,b=[],v=[];i.forEach((_,k)=>{let R=Math.max(0,_.value)/x,P=$,C=$+R*Math.PI*2;$=C;let O=C-P>Math.PI?1:0,q=j+S*Math.cos(P),He=E+S*Math.sin(P),Ke=j+S*Math.cos(C),Ge=E+S*Math.sin(C),W=_.color||this._palette[k%this._palette.length];if(v.push(W),A>0){let ft=j+A*Math.cos(P),ut=E+A*Math.sin(P),mt=j+A*Math.cos(C),ht=E+A*Math.sin(C);b.push(`<path class="slice" fill="${W}" d="M ${q} ${He} A ${S} ${S} 0 ${O} 1 ${Ke} ${Ge} L ${mt} ${ht} A ${A} ${A} 0 ${O} 0 ${ft} ${ut} Z"/>`)}else b.push(`<path class="slice" fill="${W}" d="M ${j} ${E} L ${q} ${He} A ${S} ${S} 0 ${O} 1 ${Ke} ${Ge} Z"/>`)}),I=p`<g .innerHTML=${b.join("")}></g>`,N=p`<div class="legend">${i.map((_,k)=>p`
        <span class="legend-item"><span class="swatch" style="background:${v[k]}"></span>${_.label} (${_.value})</span>
      `)}</div>`}else{let x=Math.max(...i.map($=>$.value),0),j=this._niceMax(x),E=$=>g.top+w-$/j*w,S=4,A=[];for(let $=0;$<=S;$++){let b=j*$/S,v=E(b);A.push(`<line class="grid" x1="${g.left}" x2="${g.left+f}" y1="${v}" y2="${v}"/>`),A.push(`<text class="tick-label" x="${g.left-6}" y="${v+3}" text-anchor="end">${b.toLocaleString()}</text>`)}if(t==="line"||t==="area"){let $=f/Math.max(1,i.length-1),b=i.map((k,R)=>{let P=g.left+R*$,C=E(k.value);return`${R===0?"M":"L"} ${P} ${C}`}).join(" "),v=t==="area"?b+` L ${g.left+f} ${g.top+w} L ${g.left} ${g.top+w} Z`:"",_=n||"var(--forge-color-primary)";I=p`
          <g .innerHTML=${A.join("")}></g>
          ${t==="area"?p`<path class="area" d="${v}" style="fill:${_};opacity:0.15"/>`:h}
          <path class="line" d="${b}" style="stroke:${_}"/>
          ${i.map((k,R)=>{let P=g.left+R*$,C=E(k.value);return T`<circle class="point" cx="${P}" cy="${C}" r="3" style="fill:${_}"/>
              <text class="tick-label" x="${P}" y="${g.top+w+14}" text-anchor="middle">${k.label}</text>`})}
        `}else{let $=i.length,b=f/$,v=Math.max(2,b*.7),_=b-v;I=p`
          <g .innerHTML=${A.join("")}></g>
          ${i.map((k,R)=>{let P=g.left+R*b+_/2,C=E(k.value),O=Math.max(0,g.top+w-C),q=k.color||n||"var(--forge-color-primary)";return T`<rect class="bar" x="${P}" y="${C}" width="${v}" height="${O}" rx="2" style="fill:${q}">
                <title>${k.label}: ${k.value}</title>
              </rect>
              <text class="tick-label" x="${P+v/2}" y="${g.top+w+14}" text-anchor="middle">${k.label}</text>`})}
        `}}return p`
      ${s?p`<div class="title">${s}</div>`:h}
      <div class="wrap">
        <svg viewBox="0 0 ${d} ${c}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${s||t+" chart"}">
          ${I}
        </svg>
        ${N}
      </div>
    `}};customElements.define("forge-chart",Le);var ze=class extends m{static get styles(){return y`
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
  `}_trendMeta(e){if(e==null||e==="")return null;if(typeof e=="number")return e>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(e)}%`}:e<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(e)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof e=="string"){let t=e.toLowerCase(),o=e.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(o){let s=parseFloat(o[1]),r=o[2];return s>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(s)}${r}`}:s<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(s)}${r}`}:{dir:"neutral",arrow:"\u2192",display:`0${r}`}}return t==="up"||t==="positive"||t==="increase"?{dir:"up",arrow:"\u2191",display:""}:t==="down"||t==="negative"||t==="decrease"?{dir:"down",arrow:"\u2193",display:""}:t==="flat"||t==="neutral"||t==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:e}}return null}render(){let e=this.getString("label",""),t=this.getProp("value"),o=this.getProp("trend"),s=this.getString("trendLabel",""),r=this.getProp("goal"),l=this.getString("unit",""),n=this.getString("suffix",""),i=this.getString("subtitle",""),d=this.getString("variant","");d&&this.setAttribute("variant",d);let c=typeof t=="number"?t.toLocaleString():t==null||t===""?"\u2014":String(t),g=this._trendMeta(o);return p`
      ${e?p`<div class="label">${e}</div>`:h}
      <div class="value-row">
        <span class="value">${c}</span>
        ${l?p`<span class="unit">${l}</span>`:h}
        ${n?p`<span class="suffix">${n}</span>`:h}
        ${g?p`<span class="trend ${g.dir}">${g.arrow}${g.display?p` ${g.display}`:h}${s?p` ${s}`:h}</span>`:h}
      </div>
      ${i?p`<div class="subtitle">${i}</div>`:h}
      ${r!=null&&r!==""?p`<div class="goal">Goal: ${typeof r=="number"?r.toLocaleString():r}</div>`:h}
    `}};customElements.define("forge-metric",ze);var Ne=class extends m{static get styles(){return y`
    :host { display:block; margin-bottom:var(--forge-space-sm); }
    .alert { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      border-left:4px solid; font-size:var(--forge-text-sm); }
    .info { background:var(--forge-color-info-subtle); border-color:var(--forge-color-info); color:var(--forge-color-info); }
    .success { background:var(--forge-color-success-subtle); border-color:var(--forge-color-success); color:var(--forge-color-success); }
    .warning { background:var(--forge-color-warning-subtle); border-color:var(--forge-color-warning); color:var(--forge-color-warning); }
    .error { background:var(--forge-color-error-subtle); border-color:var(--forge-color-error); color:var(--forge-color-error); }
  `}render(){let e=this.getString("variant","info"),t=this.getString("title",""),o=this.getString("message","");return p`<div class="alert ${e}" role=${e==="error"||e==="warning"?"alert":"status"}>
      ${t?p`<strong>${t}</strong> `:h}${o}<slot></slot>
    </div>`}};customElements.define("forge-alert",Ne);var Oe=class extends m{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=t=>this._onKeydown(t);this._close=()=>{this.dispatchAction("close")}}static get styles(){return y`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forge-color-surface); border-radius:var(--forge-radius-lg);
      padding:var(--forge-space-lg); min-width:20rem; max-width:90vw; max-height:90vh; overflow:auto;
      box-shadow:var(--forge-shadow-lg); z-index:1; }
    .title { font-size:var(--forge-text-lg); font-weight:var(--forge-weight-semibold); margin-bottom:var(--forge-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forge-space-xs); margin-top:var(--forge-space-lg); }
  `}render(){let t=this.getString("title",""),o=this.getBool("open"),s=`${this._instanceId}-title`;return o?this.setAttribute("open",""):this.removeAttribute("open"),o?p`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${t?s:h}"
        tabindex="-1"
        @click=${r=>r.stopPropagation()}
      >
        ${t?p`<h2 id="${s}" class="title">${t}</h2>`:h}
        <slot></slot>
      </div>
    `:h}updated(t){if(super.updated?.(t),t.has("props")){let o=this.getBool("open"),r=t.get("props")?.open??!1;o&&!r?this._onOpen():!o&&r&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let t=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??t)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(t){if(t.key==="Escape"){t.preventDefault(),this._close();return}t.key==="Tab"&&this._trapFocus(t)}_trapFocus(t){let o=this._allFocusableInDialog();if(o.length===0){t.preventDefault();return}let s=o[0],r=o[o.length-1],l=this.shadowRoot?.activeElement??document.activeElement;t.shiftKey?(l===s||!this._dialogContains(l))&&(t.preventDefault(),r.focus()):(l===r||!this._dialogContains(l))&&(t.preventDefault(),s.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let t=this.shadowRoot?.querySelector(".dialog");if(!t)return[];let o='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',s=Array.from(t.querySelectorAll(o)),r=t.querySelector("slot"),l=r instanceof HTMLSlotElement?r.assignedElements({flatten:!0}).flatMap(n=>[n,...Array.from(n.querySelectorAll(o))].filter(d=>d instanceof HTMLElement&&d.matches(o))):[];return[...s,...l].filter(n=>!n.disabled)}_dialogContains(t){return t?this.shadowRoot?.querySelector(".dialog")?.contains(t)??!1:!1}};customElements.define("forge-dialog",Oe);var De=class extends m{static get styles(){return y`
    :host { display:block; }
    .progress { height:0.5rem; background:var(--forge-color-surface-alt); border-radius:var(--forge-radius-full); overflow:hidden; }
    .bar { height:100%; background:var(--forge-color-primary); border-radius:var(--forge-radius-full); transition:width var(--forge-transition-normal); }
    .indeterminate .bar { width:30%; animation:indeterminate 1.5s ease infinite; }
    @keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
    .label { font-size:var(--forge-text-xs); color:var(--forge-color-text-secondary); margin-top:var(--forge-space-2xs); }
    @media (prefers-reduced-motion: reduce) {
      .bar { transition:none; animation:none; }
    }
  `}render(){let e=this.getProp("value"),t=this.getNumber("max",100),o=e==null,s=o?0:Math.max(0,Math.min(Number(e),t)),r=o?0:s/t*100;return p`
      <div
        class="progress ${o?"indeterminate":""}"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="${t}"
        aria-valuenow="${o?h:s}"
        aria-valuetext="${o?"Loading":`${Math.round(r)}%`}"
      >
        <div class="bar" style=${o?"":`width:${r}%`}></div>
      </div>
    `}};customElements.define("forge-progress",De);var Ue=class extends m{static get styles(){return y`
    :host { display:block; position:fixed; bottom:var(--forge-space-lg); right:var(--forge-space-lg); z-index:60; }
    .toast { padding:var(--forge-space-sm) var(--forge-space-md); border-radius:var(--forge-radius-md);
      background:var(--forge-color-text); color:var(--forge-color-text-inverse); font-size:var(--forge-text-sm);
      box-shadow:var(--forge-shadow-lg); max-width:20rem; }
  `}render(){let e=this.getString("message","");return e?p`<div class="toast">${e}</div>`:p`${h}`}};customElements.define("forge-toast",Ue);var Ve=class extends m{static get styles(){return y`
    :host { display:flex; align-items:center; gap:var(--forge-space-xs); font-size:var(--forge-text-sm); }
    .sep { color:var(--forge-color-text-tertiary); }
    a { color:var(--forge-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forge-color-text); font-weight:var(--forge-weight-medium); }
  `}render(){let e=this.getProp("items")||[];return p`${e.map((t,o)=>{let s=o===e.length-1,r=typeof t=="string"?t:t.label,l=typeof t=="string"?"#":t.href;return p`
        ${o>0?p`<span class="sep">/</span>`:h}
        ${s?p`<span class="current">${r}</span>`:p`<a href="${l}">${r}</a>`}
      `})}`}};customElements.define("forge-breadcrumb",Ve);var qe=class extends m{static get styles(){return y`
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
  `}render(){let e=this.getProp("steps")||[],t=this.getNumber("active",0);return p`${e.map((o,s)=>{let r=typeof o=="string"?o:o.label||o.title||`Step ${s+1}`,l=s===t,n=s<t;return p`<div class="step" ?active=${l} ?completed=${n}>
        <div class="circle">${n?"\u2713":s+1}</div>
        <div class="label">${r}</div>
      </div>`})}`}};customElements.define("forge-stepper",qe);var Fe=class extends m{static get styles(){return y`
    :host { display:block; }
    .error { padding:var(--forge-space-sm); background:var(--forge-color-error-subtle); color:var(--forge-color-error);
      border:1px solid var(--forge-color-error); border-radius:var(--forge-radius-md); font-size:var(--forge-text-sm); }
  `}render(){let e=this.getString("msg","Unknown error");return p`<div class="error" role="alert">⚠ ${e}</div>`}};customElements.define("forge-error",Fe);var Be=class extends m{static get properties(){return{props:{type:Object}}}static get styles(){return y`
    :host { display:block; }
    svg { display:block; }
  `}render(){let e=this.getNumber("width",400),t=this.getNumber("height",300),o=this.getString("background","transparent"),s=this.getProp("shapes")||[];return T`
      <svg width="${e}" height="${t}" style="background:${o}" viewBox="0 0 ${e} ${t}">
        ${s.map(r=>this.renderShape(r))}
      </svg>
    `}renderShape(e){let t={fill:e.fill??void 0,stroke:e.stroke??void 0,"stroke-width":e.strokeWidth??void 0,opacity:e.opacity??void 0},o=e.action?()=>{this.onAction&&this.onAction(e.action)}:void 0,s=e.action?"cursor:pointer":void 0;switch(e.type){case"rect":return T`<rect
          x="${e.x??0}" y="${e.y??0}"
          width="${e.width??0}" height="${e.height??0}"
          rx="${e.rx??0}" ry="${e.ry??0}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??0}"
          opacity="${t.opacity??1}"
          style="${s}"
          @click=${o}
        />`;case"circle":return T`<circle
          cx="${e.cx??0}" cy="${e.cy??0}" r="${e.r??0}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??0}"
          opacity="${t.opacity??1}"
          style="${s}"
          @click=${o}
        />`;case"ellipse":return T`<ellipse
          cx="${e.cx??e.x??0}" cy="${e.cy??e.y??0}"
          rx="${e.rx??(e.width?e.width/2:0)}" ry="${e.ry??(e.height?e.height/2:0)}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??0}"
          opacity="${t.opacity??1}"
          style="${s}"
          @click=${o}
        />`;case"line":return T`<line
          x1="${e.x1??0}" y1="${e.y1??0}"
          x2="${e.x2??0}" y2="${e.y2??0}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??1}"
          opacity="${t.opacity??1}"
          style="${s}"
          @click=${o}
        />`;case"text":return T`<text
          x="${e.x??0}" y="${e.y??0}"
          fill="${t.fill??"currentColor"}"
          font-size="${e.fontSize??14}"
          font-weight="${e.fontWeight??"normal"}"
          font-family="${e.fontFamily??"sans-serif"}"
          text-anchor="${e.textAnchor??"start"}"
          opacity="${t.opacity??1}"
          style="${s}"
          @click=${o}
        >${e.content??""}</text>`;case"path":return T`<path
          d="${e.d??""}"
          fill="${t.fill??"none"}"
          stroke="${t.stroke??"none"}"
          stroke-width="${t["stroke-width"]??1}"
          opacity="${t.opacity??1}"
          style="${s}"
          @click=${o}
        />`;default:return T``}}};customElements.define("forge-drawing",Be);var V=class extends qt{constructor(){super();this._activeView="";this._persister=null;this._undoStack=new F(50);this.surface="standalone"}static get properties(){return{manifest:{type:Object},src:{type:String},surface:{type:String,reflect:!0},colorScheme:{type:String,reflect:!0}}}connectedCallback(){super.connectedCallback(),this._readInlineManifest(),this._initManifest()}async disconnectedCallback(){super.disconnectedCallback(),this._persister&&(await this._persister.destroy(),this._persister=null)}_readInlineManifest(){if(this.manifest)return;let t=this.querySelector('script[type="application/json"]');if(t?.textContent)try{this.manifest=JSON.parse(t.textContent)}catch(o){console.error("[Forge] Failed to parse inline manifest JSON:",o)}}updated(t){(t.has("manifest")||t.has("src"))&&this._initManifest()}_initManifest(){let t=this.manifest;if(!t&&this.src)try{t=JSON.parse(this.src)}catch(s){this._validation={valid:!1,errors:[{path:"/",message:`Invalid JSON: ${s.message}`,severity:"error"}],warnings:[]};return}if(!t)return;t=ae(t);let o=Q(t);this._validation=o,o.valid||console.error("[Forge] Manifest validation failed:",o.errors),this._parsedManifest=t,this._store=J({schema:t.schema,initialState:t.state}),this._activeView=t.root,this._setupPersistence(t).then(()=>this.requestUpdate()).catch(s=>{console.warn("[forge] persister setup failed:",s),this.requestUpdate()}),this._undoStack.push(t),this.dispatchEvent(new CustomEvent("forge-ready",{detail:{appId:t.id},bubbles:!0,composed:!0})),this.requestUpdate()}render(){if(!this._parsedManifest||!this._store)return this._validation&&!this._validation.valid?this._renderErrors():We`<div style="padding:1rem;color:var(--forge-color-text-secondary)">Loading...</div>`;let t={manifest:this._parsedManifest,store:this._store,activeView:this._activeView,onAction:this._handleAction.bind(this)};return at(t)}_renderErrors(){let t=this._validation?.errors||[];return We`
      <div style="padding:var(--forge-space-md);font-family:var(--forge-font-family)">
        <div style="color:var(--forge-color-error);font-weight:var(--forge-weight-semibold);margin-bottom:var(--forge-space-sm)">
          Manifest Validation Errors
        </div>
        ${t.map(o=>We`
          <div style="font-size:var(--forge-text-sm);color:var(--forge-color-text-secondary);margin-bottom:var(--forge-space-2xs)">
            <code>${o.path}</code>: ${o.message}
          </div>
        `)}
      </div>
    `}async _setupPersistence(t){if(!this._store)return;this._persister&&(await this._persister.destroy(),this._persister=null);let o,s=this.surface;if(t.persistState===!0?o="indexeddb":t.skipPersistState===!0?o="none":o=s==="standalone"||s==="embed"?"indexeddb":"none",o!=="none"){this._persister=gt(this._store,t.id,o);try{await this._persister.start()}catch{this._persister=null}}}getPersistenceStatus(){return this._persister?.getStatus()??null}_handleAction(t,o){let s=this._parsedManifest;if(!s?.actions||!this._store)return;let r=s.actions[t];if(!r){console.warn(`[Forge] Unknown action: ${t}`);return}switch(r.type){case"mutateState":{let l=r.key?.replace("{{id}}",String(o?.id||""));Y(this._store,{type:r.type,path:r.path,operation:r.operation,key:l,value:r.value??o}),this.requestUpdate();break}case"navigate":{r.target&&(this._activeView=r.target,this.requestUpdate());break}case"callApi":{console.warn("[Forge] callApi requires Forge Server (Ring 2+)");break}default:this.dispatchEvent(new CustomEvent("forge-action",{detail:{action:t,payload:o,definition:r},bubbles:!0,composed:!0}))}}getStore(){return this._store}getManifest(){return this._parsedManifest}getValidation(){return this._validation}dispatchAction(t,o){this._handleAction(t,o)}pushManifestUpdate(t){this._undoStack.push(t)}undo(){let t=this._undoStack.undo();return t&&(this.manifest=t,this.requestUpdate()),t}redo(){let t=this._undoStack.redo();return t&&(this.manifest=t,this.requestUpdate()),t}getUndoRedoState(){return this._undoStack.getState()}static catalogPrompt(t){return oe(t)}static catalogJsonSchema(){return se()}};V.styles=[it,lt];customElements.define("forge-app",V);export{V as ForgeApp,oe as catalogPrompt,se as catalogToJsonSchema,J as createForgeStore,Y as executeAction,ae as ingestPayload,pt as isA2UIPayload,U as isValidComponentType,M as resolveRef,Q as validateManifest};
