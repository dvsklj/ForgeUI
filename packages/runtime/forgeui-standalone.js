import{LitElement as Jr,html as ne}from"lit";import{createStore as gr}from"tinybase";var he="__forgeui_schema_version";function G(s,t){s.setValue(he,t)}function be(s,t){let e=t?.version;if(!t||!Number.isInteger(e)||e<1)return{migrated:!1};let o=new Map;for(let n of t.migrations??[])if(!(n.to<=n.from)){if(o.has(n.from)){console.warn(`[forgeui] duplicate schema migration from v${n.from}; ignoring later entry`);continue}o.set(n.from,n)}let i=lr(s,t);if(i>=e)return G(s,e),{migrated:!1};let r=i,c=!1;for(;r<e;){let n=o.get(r);if(!n)return{migrated:c,missingStep:r};cr(s,n);for(let a of n.operations)dr(s,a);r=n.to,G(s,r),c=!0}return{migrated:c}}function lr(s,t){let e=s.getValue(he);return typeof e=="number"&&Number.isInteger(e)&&e>=1?e:t.version}function cr(s,t){if(!t.operations.some(ur))return;let e={version:t.from,tables:s.getTables(),values:s.getValues()};s.setValue(`__forgeui_migration_backup_${t.from}_${t.to}`,JSON.stringify(e))}function ur(s){return s.op==="drop_column"||s.op==="drop_table"||s.op==="rename_column"}function dr(s,t){switch(t.op){case"add_table":s.setTable(t.table,{});return;case"drop_table":s.delTable(t.table);return;case"add_column":{let o=("definition"in t?t.definition:void 0)?.default??t.default;if(!pr(o))return;for(let i of s.getRowIds(t.table))s.hasCell(t.table,i,t.column)||s.setCell(t.table,i,t.column,o);return}case"drop_column":for(let e of s.getRowIds(t.table))s.delCell(t.table,e,t.column);return;case"rename_column":for(let e of s.getRowIds(t.table))if(s.hasCell(t.table,e,t.from)){let o=s.getCell(t.table,e,t.from);s.setCell(t.table,e,t.to,o),s.delCell(t.table,e,t.from)}return}}function pr(s){return typeof s=="string"||typeof s=="number"||typeof s=="boolean"}var fr=new Set(["__proto__","prototype","constructor"]);function te(s){if(s.length===0||s.length>256)return!1;for(let t of s.normalize("NFC").split("."))if(fr.has(t))return!1;return!0}function ye(s,t){if(t.includes("/")){let e=t.split("/");if(e.length===3){let[o,i,r]=e;return s.getCell(o,i,r)}if(e.length===2){let[o,i]=e,r=s.getValue(t);if(r!==void 0)return r;let c=s.getCellIds(o,i);if(c.length>0){let n={};for(let a of c)n[a]=s.getCell(o,i,a);return n}}}return s.getValue(t)}function mr(s,t){if(t.startsWith("count:")){let e=t.slice(6);return s.getRowCount(e)}if(t.startsWith("sum:")){let[e,o]=t.split(":"),[i,r]=o.split("/"),c=0,n=s.getRowIds(i);for(let a of n){let u=s.getCell(i,a,r);typeof u=="number"&&(c+=u)}return c}if(t.startsWith("avg:")){let[e,o]=t.split(":"),[i,r]=o.split("/"),c=0,n=0,a=s.getRowIds(i);for(let u of a){let l=s.getCell(i,u,r);typeof l=="number"&&(c+=l,n++)}return n>0?c/n:0}return ye(s,t)}var re=null;function J(s){re=s}function hr(s,t){if(t.length>1024)return;let e="(state\\.[a-zA-Z_][a-zA-Z0-9_.]*|-?\\d+(?:\\.\\d+)?)",o=t.trim().match(new RegExp(`^${e}\\s*(>=|<=|[+\\-*/><])\\s*${e}$`));if(!o)return;let i=jt(s,o[1]),r=jt(s,o[3]);if(!(typeof i!="number"||typeof r!="number"))switch(o[2]){case"+":return i+r;case"-":return i-r;case"*":return i*r;case"/":return r===0?void 0:i/r;case">":return i>r;case"<":return i<r;case">=":return i>=r;case"<=":return i<=r}}function jt(s,t){if(/^-?\d/.test(t))return Number(t);if(!t.startsWith("state."))return;let e=t.slice(6);return te(e)?Rt(s,e):void 0}function ve(s,t){let e=t.trim();if(e==="")return;if(e.startsWith('"')&&e.endsWith('"')||e.startsWith("'")&&e.endsWith("'"))return e.slice(1,-1);if(e.startsWith('"')&&!e.endsWith('"')||e.startsWith("'")&&!e.endsWith("'"))return;if(e==="true")return!0;if(e==="false")return!1;if(e==="null")return null;if(/^-?\d+(\.\d+)?$/.test(e))return Number(e);if(/(?:[+\-*/%]|===?|!==?|>=?|<=?|\&\&|\|\|)/.test(e)&&!e.includes("|"))return hr(s,e);if(e.includes("|")){let[i,...r]=e.split("|").map(a=>a.trim()),n=ve(s,i);for(let a of r){let[u,...l]=a.split(/\s+/);n=br(n,u,l)}return n}if(e.startsWith("item.")||e==="item"){if(e==="item")return re;let i=e.slice(5);return H(re,i)}if(e.startsWith("state.")||e==="state"){if(e==="state")return;let i=e.slice(6);return Rt(s,i)}return ye(s,e)}function br(s,t,e){switch(t){case"values":return Array.isArray(s)?s:s&&typeof s=="object"?Object.values(s):[];case"keys":return s&&typeof s=="object"?Object.keys(s):[];case"count":case"length":return Array.isArray(s)?s.length:s&&typeof s=="object"?Object.keys(s).length:typeof s=="string"?s.length:0;case"sum":return Array.isArray(s)?s.reduce((o,i)=>o+(typeof i=="number"?i:0),0):0;case"first":return Array.isArray(s)?s[0]:void 0;case"last":return Array.isArray(s)?s[s.length-1]:void 0;default:return s}}function H(s,t){if(!s||typeof s!="object"||!t||!te(t))return;let e=t.split(".");if(e.length>32)return;let o=s;for(let i of e){if(o==null)return;o=o[i]}return o}function Rt(s,t){if(!te(t))return;let e=s.getValue(t);if(e!==void 0){if(typeof e=="string")try{return JSON.parse(e)}catch{}return e}let o=t.split(".");if(o.length>=3){let[r,c,n,...a]=o;if(s.hasTable(r)&&s.hasRow(r,c)){let u=s.getCell(r,c,n);if(a.length===0)return u;if(typeof u=="string")try{let l=JSON.parse(u);return H(l,a.join("."))}catch{}return}}if(o.length>=2){let[r,c,...n]=o;if(s.hasTable(r)&&s.hasRow(r,c)){let a=s.getRow(r,c);return n.length===0?a:H(a,n.join("."))}}if(o.length>=1){let[r,...c]=o;if(s.hasTable(r)){let n=s.getRowIds(r),a={};for(let u of n)a[u]=s.getRow(r,u);return c.length===0?a:H(a,c.join("."))}}let i=s.getValue(o[0]);if(typeof i=="string"&&o.length>1)try{let r=JSON.parse(i);return H(r,o.slice(1).join("."))}catch{}}function T(s,t){if(typeof t!="string"){if(t!==null&&typeof t=="object"){let e=t;if("$expr"in e)return T(s,`$expr:${e.$expr}`);if("$state"in e)return T(s,`$state:${e.$state}`);if("$computed"in e)return T(s,`$computed:${e.$computed}`);if("$item"in e)return T(s,`$item:${e.$item}`)}return t}if(t.startsWith("$state:")){let e=t.slice(7);return te(e)?ye(s,e):void 0}if(t.startsWith("$computed:")){let e=t.slice(10);return e.length>1024?void 0:mr(s,e)}if(t.startsWith("$item:")){let e=t.slice(6);return te(e)?e.includes(".")?H(re,e):re?.[e]:void 0}if(t.startsWith("$expr:")){let e=t.slice(6);return e.length>1024?void 0:ve(s,e)}return t.length>4096?t:t.includes("{{")&&t.includes("}}")?yr(t,s):t}function yr(s,t){let e="",o=0;for(;o<s.length;)if(s[o]==="{"&&s[o+1]==="{"){let i=o+2,r=1,c=i;for(;c<s.length-1&&r>0;){let n=s[c],a=s[c+1];n==="{"&&a==="{"?(r++,c+=2):n==="}"&&a==="}"?(r--,c+=2):c++}if(r)e+=s[o++];else{let n=s.slice(i,c-2);if(n.length<=256){let a=n.trim(),u=a.startsWith("$")?T(t,a):ve(t,a);e+=u==null?"":String(u)}else e+=s.slice(o,c);o=c}}else e+=s[o++];return e}function vr(s){if(!s)return{};let t={};for(let[e,o]of Object.entries(s.tables)){t[e]={};for(let[i,r]of Object.entries(o.columns))t[e][i]={type:r.type}}return t}function xe(s){let t=gr();if(s.schema&&!s.deferSchema&&Y(t,s.schema),s.initialState)for(let[e,o]of Object.entries(s.initialState))typeof o=="string"||typeof o=="number"||typeof o=="boolean"?t.setValue(e,o):typeof o=="object"&&o!==null&&t.setValue(e,JSON.stringify(o));return t}function Y(s,t){if(!t)return;let e=vr(t);s.setTablesSchema(e),G(s,t.version)}function oe(s,t){let{type:e,path:o,operation:i,key:r,value:c}=t;if(e!=="mutateState"||!o)return!1;switch(i){case"set":{if(o.includes("/")){let n=o.split("/");if(n.length===3){let[a,u,l]=n;return s.setCell(a,u,l,c),!0}}return s.setValue(o,c),!0}case"append":{let n=o,a=r||`row_${Date.now()}`;if(typeof c=="object"&&c!==null){for(let[u,l]of Object.entries(c))(typeof l=="string"||typeof l=="number"||typeof l=="boolean")&&s.setCell(n,a,u,l);return!0}return!1}case"delete":{let n=o,a=r;return a?(s.delRow(n,a),!0):!1}case"update":{let n=o,a=r;if(a&&typeof c=="object"&&c!==null){for(let[u,l]of Object.entries(c))(typeof l=="string"||typeof l=="number"||typeof l=="boolean")&&s.setCell(n,a,u,l);return!0}return!1}case"increment":{if(o.includes("/")){let a=o.split("/");if(a.length===3){let[u,l,d]=a,p=s.getCell(u,l,d);if(typeof p=="number")return s.setCell(u,l,d,p+(c||1)),!0}}let n=s.getValue(o);return typeof n=="number"?(s.setValue(o,n+(c||1)),!0):!1}case"decrement":{if(o.includes("/")){let a=o.split("/");if(a.length===3){let[u,l,d]=a,p=s.getCell(u,l,d);if(typeof p=="number")return s.setCell(u,l,d,p-(c||1)),!0}}let n=s.getValue(o);return typeof n=="number"?(s.setValue(o,n-(c||1)),!0):!1}case"toggle":{if(o.includes("/")){let a=o.split("/");if(a.length===3){let[u,l,d]=a,p=s.getCell(u,l,d);if(typeof p=="boolean")return s.setCell(u,l,d,!p),!0}}let n=s.getValue(o);return typeof n=="boolean"?(s.setValue(o,!n),!0):!1}default:return!1}}var Lt={Stack:"layout",Grid:"layout",Card:"layout",Container:"layout",Tabs:"layout",Accordion:"layout",Divider:"layout",Spacer:"layout",Repeater:"layout",Text:"content",Image:"content",Icon:"content",Badge:"content",Avatar:"content",EmptyState:"content",Form:"input",FieldGroup:"input",TextInput:"input",Textarea:"input",NumberInput:"input",Select:"input",Combobox:"input",MultiSelect:"input",RadioGroup:"input",Checkbox:"input",Toggle:"input",DatePicker:"input",Slider:"input",FileUpload:"input",Button:"action",ButtonGroup:"action",Link:"action",Table:"data",List:"data",Chart:"data",Metric:"data",StatCard:"data",KpiGrid:"data",Alert:"feedback",Dialog:"feedback",Progress:"feedback",Toast:"feedback",Breadcrumb:"navigation",Stepper:"navigation",SearchBox:"navigation",Pagination:"navigation",Drawing:"drawing"},xr={layout:["Stack","Grid","Card","Container","Tabs","Accordion","Divider","Spacer","Repeater"],content:["Text","Image","Icon","Badge","Avatar","EmptyState"],input:["Form","FieldGroup","TextInput","Textarea","NumberInput","Select","Combobox","MultiSelect","RadioGroup","Checkbox","Toggle","DatePicker","Slider","FileUpload"],action:["Button","ButtonGroup","Link"],data:["Table","List","Chart","Metric","StatCard","KpiGrid"],feedback:["Alert","Dialog","Progress","Toast"],navigation:["Breadcrumb","Stepper","SearchBox","Pagination"],drawing:["Drawing"]},zt=xr,ue=Object.keys(Lt);function ie(s){return s in Lt}var m=["id","bind","action","slot"],de=["label","value","variant"],D=["label","value"],wr={Stack:[...m,"direction","align","justify","gap","spacing","padding","wrap"],Grid:[...m,"columns","gap","padding","minChildWidth"],Card:[...m,"variant","title","subtitle","padding"],Container:[...m,"maxWidth","padding"],Tabs:[...m,"items","tabs","activeTab","value"],Accordion:[...m,"title","items","multiple"],Divider:[...m,"direction","spacing"],Spacer:[...m,"size","height","width"],Repeater:[...m,"dataPath","template","data","emptyMessage","direction","gap"],Text:[...m,"content","variant","weight","color","colorScheme","align"],Image:[...m,"src","alt","aspectRatio","fit","radius"],Icon:[...m,"name","size","color"],Badge:[...m,"text","label","colorScheme","variant"],Avatar:[...m,"src","name","size"],EmptyState:[...m,"title","description","icon","actionLabel"],Form:[...m,"action"],FieldGroup:[...m,"label","description","error"],TextInput:[...m,...D,"placeholder","hint","error","multiline","required","maxLength","type","inputType"],Textarea:[...m,...D,"placeholder","hint","error","required","maxLength","rows","disabled"],NumberInput:[...m,...D,"min","max","step","required"],Select:[...m,...D,"options","placeholder","required"],Combobox:[...m,...D,"options","placeholder","hint","required","disabled"],MultiSelect:[...m,...D,"options","maxSelections"],RadioGroup:[...m,...D,"options","hint","required","disabled"],Checkbox:[...m,...D,"description","checked"],Toggle:[...m,...D,"description","checked"],DatePicker:[...m,...D,"format","min","max"],Slider:[...m,...D,"min","max","step","showValue","unit"],FileUpload:[...m,...D,"accept","maxSize","multiple"],Button:[...m,"label","variant","size","icon","disabled","pressed"],ButtonGroup:[...m,"direction","spacing"],Link:[...m,"label","href","variant","external"],Table:[...m,"dataPath","data","columns","pageSize","searchable","selectable","emptyMessage","rowAction","caption"],List:[...m,"dataPath","template","emptyMessage","dividers","items"],Chart:[...m,...de,"title","dataPath","xKey","yKey","labelKey","valueKey","chartType","color","colorScheme","height","data","yFormat"],Metric:[...m,...de,"format","goal","trend","trendLabel","prefix","suffix","unit","subtitle"],StatCard:[...m,...de,"trend","trendLabel","unit","subtitle"],KpiGrid:[...m,"columns","gap"],Alert:[...m,"title","message","variant","dismissible"],Dialog:[...m,"title","trigger","confirmLabel","cancelLabel","open"],Progress:[...m,...de,"max","size","showValue"],Toast:[...m,"message","variant","duration"],Breadcrumb:[...m,"items"],Stepper:[...m,"steps","activeStep","variant"],SearchBox:[...m,...D,"placeholder","disabled"],Pagination:[...m,"page","totalPages","label"],Drawing:[...m,"width","height","background","shapes"]},Dt=Object.fromEntries(Object.entries(wr).map(([s,t])=>[s,new Set(t)]));import Ot from"ajv/dist/runtime/ucs2length.js";var Nt=Ut,se={type:"object",required:["manifest","id","root","elements"],additionalProperties:!1,properties:{manifest:{type:"string",pattern:"^0\\.\\d+\\.\\d+$"},id:{type:"string",minLength:1,maxLength:128},root:{type:"string",minLength:1},schema:{type:"object",additionalProperties:!1,properties:{version:{type:"integer",minimum:1},tables:{type:"object"},migrations:{type:"array"},views:{type:"object"}}},state:{type:"object"},elements:{type:"object",minProperties:1,additionalProperties:{type:"object",required:["type"],additionalProperties:!1,properties:{type:{type:"string",enum:["Stack","Grid","Card","Container","Tabs","Accordion","Divider","Spacer","Repeater","Text","Image","Icon","Badge","Avatar","EmptyState","Form","FieldGroup","TextInput","Textarea","NumberInput","Select","Combobox","MultiSelect","RadioGroup","Checkbox","Toggle","DatePicker","Slider","FileUpload","Button","ButtonGroup","Link","Table","List","Chart","Metric","StatCard","KpiGrid","Alert","Dialog","Progress","Toast","Breadcrumb","Stepper","SearchBox","Pagination","Drawing"]},props:{type:"object"},children:{type:"array",items:{type:"string"}},visible:{type:"object"}}}},actions:{type:"object",additionalProperties:{type:"object",required:["type"],properties:{type:{type:"string",enum:["mutateState","navigate","openDialog","closeDialog","callApi","toast","custom"]},path:{type:"string"},value:{},operation:{type:"string",enum:["set","append","update","delete","increment","decrement","toggle"]},set:{type:"object"},data:{type:"object"},key:{type:"string"},formId:{type:"string"},action:{type:"string"},target:{type:"string"},url:{type:"string"},method:{type:"string",enum:["GET","POST","PUT","PATCH","DELETE","get","post","put","patch","delete"]},body:{type:"object"},message:{type:"string"},duration:{type:"number",minimum:0}}}},meta:{type:"object"},persistState:{type:"boolean"},skipPersistState:{type:"boolean"},dataAccess:{type:"object",additionalProperties:!1,properties:{enabled:{type:"boolean"},readable:{type:"array",items:{type:"string"}},restricted:{type:"array",items:{type:"string"}},summaries:{type:"boolean"}}}}},$r=Object.prototype.hasOwnProperty,we=Ot.default??Ot,kr=new RegExp("^0\\.\\d+\\.\\d+$","u");function Ut(s,{instancePath:t="",parentData:e,parentDataProperty:o,rootData:i=s}={}){let r=null,c=0;if(s&&typeof s=="object"&&!Array.isArray(s)){if(s.manifest===void 0){let n={instancePath:t,schemaPath:"#/required",keyword:"required",params:{missingProperty:"manifest"},message:"must have required property 'manifest'"};r===null?r=[n]:r.push(n),c++}if(s.id===void 0){let n={instancePath:t,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};r===null?r=[n]:r.push(n),c++}if(s.root===void 0){let n={instancePath:t,schemaPath:"#/required",keyword:"required",params:{missingProperty:"root"},message:"must have required property 'root'"};r===null?r=[n]:r.push(n),c++}if(s.elements===void 0){let n={instancePath:t,schemaPath:"#/required",keyword:"required",params:{missingProperty:"elements"},message:"must have required property 'elements'"};r===null?r=[n]:r.push(n),c++}for(let n in s)if(!$r.call(se.properties,n)){let a={instancePath:t,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:n},message:"must NOT have additional properties"};r===null?r=[a]:r.push(a),c++}if(s.manifest!==void 0){let n=s.manifest;if(typeof n=="string"){if(!kr.test(n)){let a={instancePath:t+"/manifest",schemaPath:"#/properties/manifest/pattern",keyword:"pattern",params:{pattern:"^0\\.\\d+\\.\\d+$"},message:'must match pattern "^0\\.\\d+\\.\\d+$"'};r===null?r=[a]:r.push(a),c++}}else{let a={instancePath:t+"/manifest",schemaPath:"#/properties/manifest/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[a]:r.push(a),c++}}if(s.id!==void 0){let n=s.id;if(typeof n=="string"){if(we(n)>128){let a={instancePath:t+"/id",schemaPath:"#/properties/id/maxLength",keyword:"maxLength",params:{limit:128},message:"must NOT have more than 128 characters"};r===null?r=[a]:r.push(a),c++}if(we(n)<1){let a={instancePath:t+"/id",schemaPath:"#/properties/id/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};r===null?r=[a]:r.push(a),c++}}else{let a={instancePath:t+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[a]:r.push(a),c++}}if(s.root!==void 0){let n=s.root;if(typeof n=="string"){if(we(n)<1){let a={instancePath:t+"/root",schemaPath:"#/properties/root/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};r===null?r=[a]:r.push(a),c++}}else{let a={instancePath:t+"/root",schemaPath:"#/properties/root/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[a]:r.push(a),c++}}if(s.schema!==void 0){let n=s.schema;if(n&&typeof n=="object"&&!Array.isArray(n)){for(let a in n)if(!(a==="version"||a==="tables"||a==="migrations"||a==="views")){let u={instancePath:t+"/schema",schemaPath:"#/properties/schema/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:a},message:"must NOT have additional properties"};r===null?r=[u]:r.push(u),c++}if(n.version!==void 0){let a=n.version;if(!(typeof a=="number"&&!(a%1)&&!isNaN(a)&&isFinite(a))){let u={instancePath:t+"/schema/version",schemaPath:"#/properties/schema/properties/version/type",keyword:"type",params:{type:"integer"},message:"must be integer"};r===null?r=[u]:r.push(u),c++}if(typeof a=="number"&&isFinite(a)&&(a<1||isNaN(a))){let u={instancePath:t+"/schema/version",schemaPath:"#/properties/schema/properties/version/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};r===null?r=[u]:r.push(u),c++}}if(n.tables!==void 0){let a=n.tables;if(!(a&&typeof a=="object"&&!Array.isArray(a))){let u={instancePath:t+"/schema/tables",schemaPath:"#/properties/schema/properties/tables/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[u]:r.push(u),c++}}if(n.migrations!==void 0&&!Array.isArray(n.migrations)){let a={instancePath:t+"/schema/migrations",schemaPath:"#/properties/schema/properties/migrations/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[a]:r.push(a),c++}if(n.views!==void 0){let a=n.views;if(!(a&&typeof a=="object"&&!Array.isArray(a))){let u={instancePath:t+"/schema/views",schemaPath:"#/properties/schema/properties/views/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[u]:r.push(u),c++}}}else{let a={instancePath:t+"/schema",schemaPath:"#/properties/schema/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[a]:r.push(a),c++}}if(s.state!==void 0){let n=s.state;if(!(n&&typeof n=="object"&&!Array.isArray(n))){let a={instancePath:t+"/state",schemaPath:"#/properties/state/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[a]:r.push(a),c++}}if(s.elements!==void 0){let n=s.elements;if(n&&typeof n=="object"&&!Array.isArray(n)){if(Object.keys(n).length<1){let a={instancePath:t+"/elements",schemaPath:"#/properties/elements/minProperties",keyword:"minProperties",params:{limit:1},message:"must NOT have fewer than 1 properties"};r===null?r=[a]:r.push(a),c++}for(let a in n){let u=n[a];if(u&&typeof u=="object"&&!Array.isArray(u)){if(u.type===void 0){let l={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};r===null?r=[l]:r.push(l),c++}for(let l in u)if(!(l==="type"||l==="props"||l==="children"||l==="visible")){let d={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};r===null?r=[d]:r.push(d),c++}if(u.type!==void 0){let l=u.type;if(typeof l!="string"){let d={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/elements/additionalProperties/properties/type/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[d]:r.push(d),c++}if(!(l==="Stack"||l==="Grid"||l==="Card"||l==="Container"||l==="Tabs"||l==="Accordion"||l==="Divider"||l==="Spacer"||l==="Repeater"||l==="Text"||l==="Image"||l==="Icon"||l==="Badge"||l==="Avatar"||l==="EmptyState"||l==="Form"||l==="FieldGroup"||l==="TextInput"||l==="Textarea"||l==="NumberInput"||l==="Select"||l==="Combobox"||l==="MultiSelect"||l==="RadioGroup"||l==="Checkbox"||l==="Toggle"||l==="DatePicker"||l==="Slider"||l==="FileUpload"||l==="Button"||l==="ButtonGroup"||l==="Link"||l==="Table"||l==="List"||l==="Chart"||l==="Metric"||l==="StatCard"||l==="KpiGrid"||l==="Alert"||l==="Dialog"||l==="Progress"||l==="Toast"||l==="Breadcrumb"||l==="Stepper"||l==="SearchBox"||l==="Pagination"||l==="Drawing")){let d={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/elements/additionalProperties/properties/type/enum",keyword:"enum",params:{allowedValues:se.properties.elements.additionalProperties.properties.type.enum},message:"must be equal to one of the allowed values"};r===null?r=[d]:r.push(d),c++}}if(u.props!==void 0){let l=u.props;if(!(l&&typeof l=="object"&&!Array.isArray(l))){let d={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/props",schemaPath:"#/properties/elements/additionalProperties/properties/props/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[d]:r.push(d),c++}}if(u.children!==void 0){let l=u.children;if(Array.isArray(l)){let d=l.length;for(let p=0;p<d;p++)if(typeof l[p]!="string"){let v={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/children/"+p,schemaPath:"#/properties/elements/additionalProperties/properties/children/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[v]:r.push(v),c++}}else{let d={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/children",schemaPath:"#/properties/elements/additionalProperties/properties/children/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[d]:r.push(d),c++}}if(u.visible!==void 0){let l=u.visible;if(!(l&&typeof l=="object"&&!Array.isArray(l))){let d={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/visible",schemaPath:"#/properties/elements/additionalProperties/properties/visible/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[d]:r.push(d),c++}}}else{let l={instancePath:t+"/elements/"+a.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/elements/additionalProperties/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[l]:r.push(l),c++}}}else{let a={instancePath:t+"/elements",schemaPath:"#/properties/elements/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[a]:r.push(a),c++}}if(s.actions!==void 0){let n=s.actions;if(n&&typeof n=="object"&&!Array.isArray(n))for(let a in n){let u=n[a];if(u&&typeof u=="object"&&!Array.isArray(u)){if(u.type===void 0){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/actions/additionalProperties/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};r===null?r=[l]:r.push(l),c++}if(u.type!==void 0){let l=u.type;if(typeof l!="string"){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/actions/additionalProperties/properties/type/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[d]:r.push(d),c++}if(!(l==="mutateState"||l==="navigate"||l==="openDialog"||l==="closeDialog"||l==="callApi"||l==="toast"||l==="custom")){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/type",schemaPath:"#/properties/actions/additionalProperties/properties/type/enum",keyword:"enum",params:{allowedValues:se.properties.actions.additionalProperties.properties.type.enum},message:"must be equal to one of the allowed values"};r===null?r=[d]:r.push(d),c++}}if(u.path!==void 0&&typeof u.path!="string"){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/path",schemaPath:"#/properties/actions/additionalProperties/properties/path/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[l]:r.push(l),c++}if(u.operation!==void 0){let l=u.operation;if(typeof l!="string"){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/operation",schemaPath:"#/properties/actions/additionalProperties/properties/operation/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[d]:r.push(d),c++}if(!(l==="set"||l==="append"||l==="update"||l==="delete"||l==="increment"||l==="decrement"||l==="toggle")){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/operation",schemaPath:"#/properties/actions/additionalProperties/properties/operation/enum",keyword:"enum",params:{allowedValues:se.properties.actions.additionalProperties.properties.operation.enum},message:"must be equal to one of the allowed values"};r===null?r=[d]:r.push(d),c++}}if(u.set!==void 0){let l=u.set;if(!(l&&typeof l=="object"&&!Array.isArray(l))){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/set",schemaPath:"#/properties/actions/additionalProperties/properties/set/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[d]:r.push(d),c++}}if(u.data!==void 0){let l=u.data;if(!(l&&typeof l=="object"&&!Array.isArray(l))){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/data",schemaPath:"#/properties/actions/additionalProperties/properties/data/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[d]:r.push(d),c++}}if(u.key!==void 0&&typeof u.key!="string"){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/key",schemaPath:"#/properties/actions/additionalProperties/properties/key/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[l]:r.push(l),c++}if(u.formId!==void 0&&typeof u.formId!="string"){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/formId",schemaPath:"#/properties/actions/additionalProperties/properties/formId/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[l]:r.push(l),c++}if(u.action!==void 0&&typeof u.action!="string"){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/action",schemaPath:"#/properties/actions/additionalProperties/properties/action/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[l]:r.push(l),c++}if(u.target!==void 0&&typeof u.target!="string"){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/target",schemaPath:"#/properties/actions/additionalProperties/properties/target/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[l]:r.push(l),c++}if(u.url!==void 0&&typeof u.url!="string"){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/url",schemaPath:"#/properties/actions/additionalProperties/properties/url/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[l]:r.push(l),c++}if(u.method!==void 0){let l=u.method;if(typeof l!="string"){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/method",schemaPath:"#/properties/actions/additionalProperties/properties/method/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[d]:r.push(d),c++}if(!(l==="GET"||l==="POST"||l==="PUT"||l==="PATCH"||l==="DELETE"||l==="get"||l==="post"||l==="put"||l==="patch"||l==="delete")){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/method",schemaPath:"#/properties/actions/additionalProperties/properties/method/enum",keyword:"enum",params:{allowedValues:se.properties.actions.additionalProperties.properties.method.enum},message:"must be equal to one of the allowed values"};r===null?r=[d]:r.push(d),c++}}if(u.body!==void 0){let l=u.body;if(!(l&&typeof l=="object"&&!Array.isArray(l))){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/body",schemaPath:"#/properties/actions/additionalProperties/properties/body/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[d]:r.push(d),c++}}if(u.message!==void 0&&typeof u.message!="string"){let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/message",schemaPath:"#/properties/actions/additionalProperties/properties/message/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[l]:r.push(l),c++}if(u.duration!==void 0){let l=u.duration;if(typeof l=="number"&&isFinite(l)){if(l<0||isNaN(l)){let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/duration",schemaPath:"#/properties/actions/additionalProperties/properties/duration/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};r===null?r=[d]:r.push(d),c++}}else{let d={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1")+"/duration",schemaPath:"#/properties/actions/additionalProperties/properties/duration/type",keyword:"type",params:{type:"number"},message:"must be number"};r===null?r=[d]:r.push(d),c++}}}else{let l={instancePath:t+"/actions/"+a.replace(/~/g,"~0").replace(/\//g,"~1"),schemaPath:"#/properties/actions/additionalProperties/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[l]:r.push(l),c++}}else{let a={instancePath:t+"/actions",schemaPath:"#/properties/actions/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[a]:r.push(a),c++}}if(s.meta!==void 0){let n=s.meta;if(!(n&&typeof n=="object"&&!Array.isArray(n))){let a={instancePath:t+"/meta",schemaPath:"#/properties/meta/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[a]:r.push(a),c++}}if(s.persistState!==void 0&&typeof s.persistState!="boolean"){let n={instancePath:t+"/persistState",schemaPath:"#/properties/persistState/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[n]:r.push(n),c++}if(s.skipPersistState!==void 0&&typeof s.skipPersistState!="boolean"){let n={instancePath:t+"/skipPersistState",schemaPath:"#/properties/skipPersistState/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[n]:r.push(n),c++}if(s.dataAccess!==void 0){let n=s.dataAccess;if(n&&typeof n=="object"&&!Array.isArray(n)){for(let a in n)if(!(a==="enabled"||a==="readable"||a==="restricted"||a==="summaries")){let u={instancePath:t+"/dataAccess",schemaPath:"#/properties/dataAccess/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:a},message:"must NOT have additional properties"};r===null?r=[u]:r.push(u),c++}if(n.enabled!==void 0&&typeof n.enabled!="boolean"){let a={instancePath:t+"/dataAccess/enabled",schemaPath:"#/properties/dataAccess/properties/enabled/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[a]:r.push(a),c++}if(n.readable!==void 0){let a=n.readable;if(Array.isArray(a)){let u=a.length;for(let l=0;l<u;l++)if(typeof a[l]!="string"){let d={instancePath:t+"/dataAccess/readable/"+l,schemaPath:"#/properties/dataAccess/properties/readable/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[d]:r.push(d),c++}}else{let u={instancePath:t+"/dataAccess/readable",schemaPath:"#/properties/dataAccess/properties/readable/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[u]:r.push(u),c++}}if(n.restricted!==void 0){let a=n.restricted;if(Array.isArray(a)){let u=a.length;for(let l=0;l<u;l++)if(typeof a[l]!="string"){let d={instancePath:t+"/dataAccess/restricted/"+l,schemaPath:"#/properties/dataAccess/properties/restricted/items/type",keyword:"type",params:{type:"string"},message:"must be string"};r===null?r=[d]:r.push(d),c++}}else{let u={instancePath:t+"/dataAccess/restricted",schemaPath:"#/properties/dataAccess/properties/restricted/type",keyword:"type",params:{type:"array"},message:"must be array"};r===null?r=[u]:r.push(u),c++}}if(n.summaries!==void 0&&typeof n.summaries!="boolean"){let a={instancePath:t+"/dataAccess/summaries",schemaPath:"#/properties/dataAccess/properties/summaries/type",keyword:"type",params:{type:"boolean"},message:"must be boolean"};r===null?r=[a]:r.push(a),c++}}else{let a={instancePath:t+"/dataAccess",schemaPath:"#/properties/dataAccess/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[a]:r.push(a),c++}}}else{let n={instancePath:t,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};r===null?r=[n]:r.push(n),c++}return Ut.errors=r,c===0}var $e=Nt,Sr=["javascript:","data:text/html","data:text/javascript","data:application/javascript","vbscript:","file:"],_r=["https:","http:","data:image/","blob:"],Bt=["https:","http:","mailto:","tel:","#"],Ar=["https:","http:"],Pr=/^on[a-z]+$/i,Ft=[/<\s*script/i,/<\s*iframe/i,/<\s*object/i,/<\s*embed/i,/javascript\s*:/i,/data\s*:\s*text\/html/i,/expression\s*\(/i,/url\s*\(\s*javascript/i];function Se(s){let t=[];if(!$e(s)&&$e.errors){for(let r of $e.errors)t.push({path:r.instancePath||"/",message:r.message||"Schema validation error",severity:"error"});return{valid:!1,errors:t,warnings:[]}}let o=s;Er(o,t),Mr(o,t),Cr(o,t),zr(o,t),jr(o,t);let i=JSON.stringify(o).length;return i>1e5&&t.push({path:"/",message:`Manifest size (${(i/1024).toFixed(1)}KB) exceeds 100KB limit`,severity:"warning"}),{valid:!t.some(r=>r.severity==="error"),errors:t.filter(r=>r.severity==="error"),warnings:t.filter(r=>r.severity!=="error")}}function Er(s,t){for(let[e,o]of Object.entries(s.elements))if(o.props){for(let[i,r]of Object.entries(o.props))if(typeof r=="string"){for(let c of Ft)c.test(r)&&t.push({path:`/elements/${e}/props/${i}`,message:`Potentially dangerous content detected (matches ${c.source})`,severity:"error"});ke(r,`/elements/${e}/props/${i}`,t,Tr(o.type,i)),Pr.test(i)&&t.push({path:`/elements/${e}/props/${i}`,message:`Event handler property not allowed: ${i}`,severity:"error"})}if(o.type==="Breadcrumb"&&Array.isArray(o.props.items)&&o.props.items.forEach((i,r)=>{!i||typeof i!="object"||Array.isArray(i)||ke(i.href,`/elements/${e}/props/items/${r}/href`,t,Bt)}),o.children){for(let i of o.children)if(typeof i=="string")for(let r of Ft)r.test(i)&&t.push({path:`/elements/${e}/children`,message:`Potentially dangerous content in children: ${r.source}`,severity:"error"})}}if(s.actions)for(let[e,o]of Object.entries(s.actions))ke(o.url,`/actions/${e}/url`,t,o.type==="callApi"?Ar:void 0)}function Tr(s,t){if(t==="src"&&(s==="Image"||s==="Avatar"))return _r;if(t==="href"&&s==="Link")return Bt}function ke(s,t,e,o){if(typeof s!="string"||!Ir(s))return;let i=s.toLowerCase().trim();for(let r of Sr)if(i.startsWith(r)){e.push({path:t,message:`Dangerous URL scheme rejected: ${r}`,severity:"error"});return}o&&!o.some(r=>i.startsWith(r))&&e.push({path:t,message:"URL not allowed",severity:"error"})}function Ir(s){return/^[a-z][a-z0-9+.-]*:/i.test(s)}function Mr(s,t){let e=s.schema?.tables?Object.keys(s.schema.tables):[],o=new Set;if(s.state)for(let i of Object.keys(s.state))o.add(i);if(!(e.length===0&&o.size===0)){for(let[i,r]of Object.entries(s.elements))if(r.props)for(let[c,n]of Object.entries(r.props)){if(typeof n=="string"&&n.startsWith("$state:")){let a=n.slice(7),u=a.split("/")[0].split(".")[0];u&&!o.has(u)&&!e.includes(u)&&t.push({path:`/elements/${i}/props/${c}`,message:`$state:${a} references unknown state path`,severity:"warning"})}if(typeof n=="string"&&n.startsWith("$computed:")){let a=n.slice(10);if(a.startsWith("sum:")||a.startsWith("avg:")){let[u,l]=a.split(":"),[d,p]=l.split("/");e.includes(d)?p&&s.schema?.tables[d]&&(Object.keys(s.schema.tables[d].columns).includes(p)||t.push({path:`/elements/${i}/props/${c}`,message:`$computed references unknown column: ${d}/${p}`,severity:"error"})):t.push({path:`/elements/${i}/props/${c}`,message:`$computed references unknown table: ${d}`,severity:"error"})}else if(a.startsWith("count:")){let u=a.slice(6);e.includes(u)||t.push({path:`/elements/${i}/props/${c}`,message:`$computed:count references unknown table: ${u}`,severity:"error"})}}}}}function Cr(s,t){for(let[e,o]of Object.entries(s.elements))ie(o.type)||t.push({path:`/elements/${e}/type`,message:`Unknown component type: ${o.type}`,severity:"error"})}function jr(s,t){let e=new Set(Object.keys(s.elements));e.has(s.root)||t.push({path:"/root",message:`Root element "${s.root}" not found in elements`,severity:"error"});for(let[o,i]of Object.entries(s.elements))if(i.children)for(let r of i.children)e.has(r)||t.push({path:`/elements/${o}/children`,message:`Child element "${r}" not found in elements`,severity:"error"});Rr(s,t)}function Rr(s,t){let e=new Set,o=new Set;function i(r,c){if(o.has(r))return t.push({path:`/elements/${r}`,message:`Circular reference detected: ${[...c,r].join(" \u2192 ")}`,severity:"error"}),!0;if(e.has(r))return!1;e.add(r),o.add(r);let n=s.elements[r];if(n?.children){for(let a of n.children)if(i(a,[...c,r]))return!0}return o.delete(r),!1}i(s.root,[])}function Lr(s){let t=s.trim(),e=t.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);return e?e[1].trim():t}function zr(s,t){for(let[e,o]of Object.entries(s.elements)){if(!o.props)continue;let i=Dt[o.type];if(i)for(let r of Object.keys(o.props))i.has(r)||t.push({path:`/elements/${e}/props/${r}`,message:`Unknown prop "${r}" for component type ${o.type}`,severity:"error"})}}import{html as f}from"lit";function Vt(s){return _e(s.manifest.root,s)}function _e(s,t){try{let e=t.manifest.elements[s];if(!e)return f``;if(e.visible&&!Or(e.visible,t))return f``;let o=e.type;if(o==="Repeater")return Dr(e,t);let i=qt(e.props||{},t),r=(e.children||[]).map(c=>_e(c,t));switch(o){case"Stack":return f`<forgeui-stack .props=${i} .store=${t.store} .onAction=${t.onAction} .itemContext=${t.itemContext||null}>${r}</forgeui-stack>`;case"Grid":return f`<forgeui-grid .props=${i} .store=${t.store} .onAction=${t.onAction}>${r}</forgeui-grid>`;case"Card":return f`<forgeui-card .props=${i} .store=${t.store} .onAction=${t.onAction}>${r}</forgeui-card>`;case"Container":return f`<forgeui-container .props=${i} .store=${t.store}>${r}</forgeui-container>`;case"Tabs":return f`<forgeui-tabs .props=${i} .store=${t.store} .onAction=${t.onAction}>${r}</forgeui-tabs>`;case"Accordion":return f`<forgeui-accordion .props=${i} .store=${t.store}>${r}</forgeui-accordion>`;case"Divider":return f`<forgeui-divider .props=${i} .store=${t.store}></forgeui-divider>`;case"Spacer":return f`<forgeui-spacer .props=${i} .store=${t.store}></forgeui-spacer>`;case"Text":return f`<forgeui-text .props=${i} .store=${t.store}></forgeui-text>`;case"Image":return f`<forgeui-image .props=${i} .store=${t.store}></forgeui-image>`;case"Icon":return f`<forgeui-icon .props=${i} .store=${t.store}></forgeui-icon>`;case"Badge":return f`<forgeui-badge .props=${i} .store=${t.store}></forgeui-badge>`;case"Avatar":return f`<forgeui-avatar .props=${i} .store=${t.store}></forgeui-avatar>`;case"EmptyState":return f`<forgeui-empty-state .props=${i} .store=${t.store}></forgeui-empty-state>`;case"Form":return f`<forgeui-form .props=${i} .store=${t.store} .onAction=${t.onAction}>${r}</forgeui-form>`;case"FieldGroup":return f`<forgeui-field-group .props=${i} .store=${t.store}>${r}</forgeui-field-group>`;case"TextInput":return f`<forgeui-text-input .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-text-input>`;case"Textarea":return f`<forgeui-textarea .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-textarea>`;case"NumberInput":return f`<forgeui-number-input .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-number-input>`;case"Select":return f`<forgeui-select .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-select>`;case"Combobox":return f`<forgeui-combobox .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-combobox>`;case"MultiSelect":return f`<forgeui-multi-select .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-multi-select>`;case"RadioGroup":return f`<forgeui-radio-group .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-radio-group>`;case"Checkbox":return f`<forgeui-checkbox .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-checkbox>`;case"Toggle":return f`<forgeui-toggle .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-toggle>`;case"DatePicker":return f`<forgeui-date-picker .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-date-picker>`;case"Slider":return f`<forgeui-slider .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-slider>`;case"FileUpload":return f`<forgeui-file-upload .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-file-upload>`;case"Button":return f`<forgeui-button .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-button>`;case"ButtonGroup":return f`<forgeui-button-group .props=${i} .store=${t.store} .onAction=${t.onAction}>${r}</forgeui-button-group>`;case"Link":return f`<forgeui-link .props=${i} .store=${t.store}></forgeui-link>`;case"Table":return f`<forgeui-table .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-table>`;case"List":return f`<forgeui-list .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-list>`;case"Chart":return f`<forgeui-chart .props=${i} .store=${t.store}></forgeui-chart>`;case"Metric":return f`<forgeui-metric .props=${i} .store=${t.store}></forgeui-metric>`;case"StatCard":return f`<forgeui-stat-card .props=${i} .store=${t.store}></forgeui-stat-card>`;case"KpiGrid":return f`<forgeui-kpi-grid .props=${i} .store=${t.store}>${r}</forgeui-kpi-grid>`;case"Alert":return f`<forgeui-alert .props=${i} .store=${t.store}>${r}</forgeui-alert>`;case"Dialog":return f`<forgeui-dialog .props=${i} .store=${t.store} .onAction=${t.onAction}>${r}</forgeui-dialog>`;case"Progress":return f`<forgeui-progress .props=${i} .store=${t.store}></forgeui-progress>`;case"Toast":return f`<forgeui-toast .props=${i} .store=${t.store}></forgeui-toast>`;case"Breadcrumb":return f`<forgeui-breadcrumb .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-breadcrumb>`;case"Stepper":return f`<forgeui-stepper .props=${i} .store=${t.store} .onAction=${t.onAction}>${r}</forgeui-stepper>`;case"SearchBox":return f`<forgeui-search-box .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-search-box>`;case"Pagination":return f`<forgeui-pagination .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-pagination>`;case"Drawing":return f`<forgeui-drawing .props=${i} .store=${t.store} .onAction=${t.onAction}></forgeui-drawing>`;default:return f`<forgeui-error .props=${{msg:`Unknown: ${o}`}} .store=${t.store}></forgeui-error>`}}catch(e){return console.warn(`[forgeui] renderElement("${s}") threw:`,e?.message||e),f`<forgeui-error .props=${{msg:`Element "${s}" failed to render: ${e?.message||"unknown error"}`}} .store=${t.store}></forgeui-error>`}}function Dr(s,t){let e=qt(s.props||{},t),o=e.data,i=[];Array.isArray(o)?i=o:o&&typeof o=="object"&&(i=Object.values(o));let r=s.children||[];if(r.length===0)return f`<forgeui-repeater .props=${e} .store=${t.store}></forgeui-repeater>`;let c=[];for(let n=0;n<i.length;n++){let a=i[n],u=typeof a=="object"&&a!==null?{...a,_index:n}:{value:a,_index:n},l={...t,itemContext:u};J(u);try{for(let d of r)c.push(_e(d,l))}finally{J(null)}}return i.length===0?f`<forgeui-repeater .props=${e} .store=${t.store}></forgeui-repeater>`:f`<forgeui-repeater .props=${e} .store=${t.store}>${c}</forgeui-repeater>`}function qt(s,t){let e={};for(let[o,i]of Object.entries(s))e[o]=o==="bind"?i:T(t.store,i);return e}function Or(s,t){if(!s||typeof s!="object")return!0;let e=s.$when??s;if(!e||typeof e!="object")return!0;let{path:o,eq:i,neq:r,gt:c,gte:n,lt:a,lte:u,in:l,exists:d}=e;if(!o||typeof o!="string")return!0;let p=T(t.store,`$state:${o}`);return d!==void 0?d?p!==void 0:p===void 0:i!==void 0?p===i:r!==void 0?p!==r:c!==void 0&&typeof p=="number"?p>c:n!==void 0&&typeof p=="number"?p>=n:a!==void 0&&typeof p=="number"?p<a:u!==void 0&&typeof p=="number"?p<=u:l!==void 0&&Array.isArray(l)?l.includes(p):!0}import{css as Ae}from"lit";var Kt=Ae`
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
`,Wt=Ae`
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
`,Pe=Ae`
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
`;var Gt=["mutateState","navigate","openDialog","closeDialog","callApi","toast","custom"],Ht=["set","append","update","delete","increment","decrement","toggle"],Jt=["GET","POST","PUT","PATCH","DELETE","get","post","put","patch","delete"];function Ee(s="default"){switch(s){case"minimal":return Yt();case"default":return Zt();case"full":return Nr()}}function Yt(){let t=Object.entries(zt).map(([e,o])=>`  ${e}: ${o.join(", ")}`).join(`
`);return["You can create interactive web applications by generating Forge manifests \u2014 declarative JSON that describes UI, data, and behavior. You never write code.","","MANIFEST STRUCTURE:","{",'  "manifest": "0.1.0",','  "id": "my-app",','  "root": "root-element-id",','  "state": { "key": "initial value" },','  "elements": {','    "root-element-id": {','      "type": "Stack",','      "props": { "spacing": "md" },','      "children": ["child1", "child2"]',"    }","  },",'  "actions": { "actionName": { "type": "mutateState", "path": "state/path" } }',"}","",'ELEMENT FORMAT: { "type": "ComponentName", "props": {}, "children": ["id"] }','Root element is set in "root" field. All elements are a flat map \u2014 reference by ID, never nest.',"",`COMPONENTS (${ue.length} types):`,t,"","STATE BINDINGS:","  $state:path         \u2014 reactive value","  $computed:path       \u2014 derived from table data","  $item:field          \u2014 current item in Repeater","  $form:fieldId        \u2014 value from input component","","DESIGN TOKENS:","  Spacing: none, 3xs, 2xs, xs, sm, md, lg, xl, 2xl","  Colors: primary, secondary, success, warning, error, muted, default","  Sizes: sm, md, lg","  Radius: none, sm, md, lg, full","","Never use raw CSS values, hex colors, or pixel sizes. Always use tokens.","Responsive rules: Grid(columns>=2) auto-collapses on mobile. Stack wrap:true for horizontal button rows.",'If the app offers dark and light modes, include an explicit Toggle bound to state such as "$state:settings/dark" or "$state:theme/dark"; do not rely on hidden/system-only theme switching.',"","EXAMPLE:","{",'  "manifest": "0.1.0", "id": "hello", "root": "root",','  "elements": {','    "root": { "type": "Card", "props": { "title": "Hello World" }, "children": ["msg", "btn"] },','    "msg": { "type": "Text", "props": { "content": "Welcome to Forge!", "variant": "heading2" } },','    "btn": { "type": "Button", "props": { "label": "Click Me", "action": "greet" } }',"  },",'  "actions": { "greet": { "type": "mutateState", "path": "greeting", "operation": "set", "value": "Hello!" } }',"}"].join(`
`)}function Zt(){return[Yt(),"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","DETAILED COMPONENT REFERENCE","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","LAYOUT:",'  Stack(spacing, direction: "vertical"|"horizontal", align: "start"|"center"|"end"|"stretch", gap)','  Grid(columns: number|"auto", gap, minChildWidth)','  Card(title?, variant: "default"|"outlined"|"elevated"|"compact", padding)','  Container(maxWidth: "sm"|"md"|"lg"|"xl"|"full", padding)',"  Tabs(items: string[], bind: $state:path)","  Accordion(items: [{title, contentId}], multiple?: boolean)",'  Divider(direction: "horizontal"|"vertical", spacing)',"  Spacer(size)","","CONTENT:",'  Text(content: string|$binding, variant: "body"|"heading1"|"heading2"|"heading3"|"caption"|"label"|"code", weight, color, align)','  Image(src, alt, aspectRatio: "auto"|"1:1"|"4:3"|"16:9", fit: "cover"|"contain"|"fill", radius)',"  Icon(name, size, color)",'  Badge(text|$binding, colorScheme, variant: "solid"|"subtle"|"outline")',"  Avatar(src?, name, size)","  EmptyState(title, description, icon?, actionLabel?, action?)","","INPUT:","  Form(action?, children) \u2014 semantic submit wrapper for form fields.","  FieldGroup(label, description?, error?, children) \u2014 groups related fields.","  TextInput(label, placeholder?, bind: $state:path, multiline?, required?, maxLength?)","  Textarea(label, placeholder?, bind: $state:path, rows?, required?, maxLength?)","  NumberInput(label, bind: $state:path, min?, max?, step?, required?)","  Select(label, options: [{value, label}]|string[], bind: $state:path, placeholder?, required?)","  Combobox(label, options: [{value, label}]|string[], bind: $state:path, placeholder?, required?)","  MultiSelect(label, options: [{value, label}]|string[], bind: $state:path, maxSelections?)","  RadioGroup(label, options: [{value, label}]|string[], bind: $state:path, hint?)","  Checkbox(label, bind: $state:path, description?)","  Toggle(label, bind: $state:path, description?)",'  DatePicker(label, bind: $state:path, format: "date"|"datetime"|"time", min?, max?)',"  Slider(label, bind: $state:path, min, max, step, showValue?)","  FileUpload(label, accept?, maxSize?, multiple?, bind: $state:path)","","ACTION:",'  Button(label, action, variant: "primary"|"secondary"|"danger"|"ghost", size, icon?, disabled?)','  ButtonGroup(direction: "horizontal"|"vertical", spacing)','  Link(label, href, variant: "default"|"subtle"|"bold", external?)',"","DATA:","  Table(dataPath, columns: [{key, label, sortable?, format?}], pageSize?, searchable?, emptyMessage?)","  List(dataPath, template: elementId, emptyMessage?, dividers?)",'  Chart(variant: "line"|"bar"|"donut"|"area"|"scatter"|"pie", dataPath, xKey?, yKey?, colorScheme?, height?)','  Metric(label, value|$binding, format: "number"|"currency"|"percent", goal?, trend?: "up"|"down"|"flat", prefix?, suffix?)',"  StatCard(label, value|$binding, trend?, trendLabel?, subtitle?, unit?)","  KpiGrid(columns?, gap?, children) \u2014 responsive KPI card grid.","","FEEDBACK:",'  Alert(title, message?, variant: "info"|"success"|"warning"|"error", dismissible?)',"  Dialog(title, trigger: elementId, confirmLabel?, cancelLabel?, action?)",'  Progress(value|$binding, max, variant: "bar"|"ring", size, label?)','  Toast(message, variant: "info"|"success"|"warning"|"error", duration?)',"","NAVIGATION:","  Breadcrumb(items: [{label, view?}])",'  Stepper(steps: [{label, description?}], activeStep: $state:path, variant: "horizontal"|"vertical")',"  SearchBox(label?, placeholder?, bind: $state:path)","  Pagination(page|$binding, totalPages, label?)","","DRAWING:","  Drawing(width, height, background?, shapes: Shape[])","  Shape types: rect, circle, ellipse, line, text, path","  For custom icons: use a 24x24 box, 1-4 simple shapes, currentColor, 2px strokes, and no raw SVG markup.","","THEME MODES:",'  If you include or imply dark/light mode, always add a visible Toggle labeled "Dark Mode" or "Theme" and bind it to state such as $state:settings/dark or $state:theme/dark.',"  Keep both modes token-driven. Never create a dark/light mode with raw hex colors, inline CSS, or hidden state only.","","CONDITIONAL RENDERING:",'{ "type": "Alert", "props": { ... }, "visible": { "$when": { "path": "state/path", "gt": 0 } } }',"Operators: eq, neq, gt, lt, gte, lte, in, notIn, exists.","","REPEATER PATTERN:",'{ "type": "Repeater", "props": { "dataPath": "tableName", "template": "templateElementId" } }',"Template element uses $item:field bindings for each row.","","ACTIONS:","  mutateState \u2014 set, increment, decrement, or toggle a value; append/update/delete rows in a table.","  navigate \u2014 switch the active view by element ID.","  openDialog / closeDialog \u2014 control Dialog elements by target ID.","  toast \u2014 show a transient Toast message.","  callApi \u2014 call same-origin or HTTPS APIs and emit result/error events.","  custom \u2014 emit a forgeui-action event for host-provided behavior.","","SCHEMA (optional, for persistent data):",'{ "version": 1, "tables": { "tableName": { "columns": { "col": { "type": "string|number|boolean" } } } } }',"","GUIDELINES:","1. Always use design tokens \u2014 never raw CSS, hex colors, or pixel sizes.","2. Use flat element maps \u2014 reference children by ID, never nest.","3. Use Repeater for lists \u2014 define template once, bind to data.","4. Always handle empty states with EmptyState component.","5. Use conditional visibility for show/hide logic.",'6. State paths use "/" separators: "view/active", "goals/calories".',"7. Actions are declarative \u2014 never write JavaScript.","8. Keep manifests under 100KB.","9. Write mobile-safe layouts: KpiGrid for KPI cards, short labels, wrap:true for button rows.","10. Prefer token gap/padding values (sm, md, lg) over raw numbers.","11. If dark/light modes exist, include a visible bound Toggle so users can switch modes."].join(`
`)}function Nr(){return[Zt(),"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","DATA ACCESS (Reading App Data)","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","Forge apps can optionally allow the LLM to read user data for personalized updates.","This is DISABLED by default. The user must consent at app creation time.","","PERMISSION DECLARATION:",'{ "dataAccess": { "enabled": true, "readable": ["table1"], "restricted": ["table2"] } }',"  enabled: false (default) \u2014 LLM cannot read any app data.",'  enabled: true \u2014 LLM can read tables in "readable". Tables in "restricted" are never sent.','  Always inform the user: "This app allows the AI to read your [data] for personalized updates."',"","READING DATA VIA TOOLS:","","forgeui_read_app_data \u2014 returns raw rows from permitted tables:",'  Input: { app_id, tables: ["tableName"], limit: 20, since: "2026-04-01" }',"  Output: { schema, data: { tableName: [...rows] }, rowCounts }","","forgeui_query_app_data \u2014 returns aggregated summaries (more token-efficient):",'  Input: { app_id, queries: [{ table, aggregate: "count|max|min|avg|trend", groupBy?, column?, where? }] }',"  Output: { results: [{ data: {...} }] }","","PREFER forgeui_query_app_data over forgeui_read_app_data.","Summaries cost ~50-150 tokens vs. ~2,000+ for raw rows.","","THE DATA INTERACTION LOOP:","1. Read \u2014 call forgeui_query_app_data to understand user data (trends, patterns, gaps)","2. Reason \u2014 identify what should change in the app (adjust targets, add alerts, modify plans)","3. Update \u2014 call forgeui_update_app with a manifest patch to modify the app structure","","The LLM updates the MANIFEST (app structure, plans, goals, UI), not the user's raw data.","Workout logs, tracked meals, journal entries stay untouched in TinyBase.","The LLM modifies the app AROUND the data.","","Example: the LLM reads that squat weight has plateaued for 3 weeks. It sends a manifest patch",'that changes the squat rep scheme from 5\xD75 to 3\xD78, adds an Alert saying "Deload week \u2014 lighter',`weight, more reps," and updates the goal Metric. The user's logged workouts are unchanged \u2014 only the plan adapts.`,"","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","EXAMPLE \u2014 HABIT TRACKER","\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500","","{",'  "manifest": "0.1.0",','  "id": "habit-tracker",','  "root": "shell",','  "schema": { "version": 1, "tables": { "habits": { "columns": {','    "name": { "type": "string" },','    "streak": { "type": "number", "default": 0 },','    "done_today": { "type": "boolean", "default": false },','    "icon": { "type": "string", "default": "star" }',"  } } } },",'  "state": { "view/active": "today" },','  "elements": {','    "shell": { "type": "Container", "props": { "maxWidth": "md", "padding": "lg" }, "children": ["header", "tabs", "content"] },','    "header": { "type": "Stack", "props": { "direction": "horizontal", "align": "center", "spacing": "md" }, "children": ["title", "streak-metric"] },','    "title": { "type": "Text", "props": { "content": "Daily Habits", "variant": "heading1" } },','    "streak-metric": { "type": "Metric", "props": { "label": "Best Streak", "value": "$computed:habits/maxStreak", "format": "number", "suffix": " days" } },','    "tabs": { "type": "Tabs", "props": { "items": ["Today", "All Habits", "Add New"], "bind": "$state:view/active" } },','    "content": { "type": "Stack", "props": { "spacing": "md" }, "children": ["habit-list", "empty"] },','    "habit-list": { "type": "Repeater", "props": { "dataPath": "habits", "template": "habit-row" } },','    "habit-row": { "type": "Card", "props": { "variant": "outlined", "padding": "md" }, "children": ["habit-info", "habit-toggle"] },','    "habit-info": { "type": "Stack", "props": { "direction": "horizontal", "align": "center", "spacing": "sm" }, "children": ["habit-icon", "habit-name", "habit-streak"] },','    "habit-icon": { "type": "Icon", "props": { "name": "$item:icon", "size": "md", "color": "primary" } },','    "habit-name": { "type": "Text", "props": { "content": "$item:name", "weight": "medium" } },','    "habit-streak": { "type": "Badge", "props": { "text": "$item:streak", "colorScheme": "success", "variant": "subtle" } },','    "habit-toggle": { "type": "Toggle", "props": { "label": "Done today", "bind": "$item:done_today" } },','    "empty": { "type": "EmptyState", "props": { "title": "No habits yet", "description": "Add your first habit to start tracking", "icon": "plus-circle", "actionLabel": "Add Habit", "action": "show-add-form" }, "visible": { "$when": { "path": "habits", "eq": [] } } }',"  },",'  "actions": {','    "toggle-habit": { "type": "mutateState", "path": "habits", "operation": "update", "key": "{{id}}", "data": { "done_today": "{{!done_today}}" } },','    "add-habit": { "type": "mutateState", "path": "habits", "operation": "append", "data": { "name": "$form:habit-name", "icon": "$form:habit-icon", "streak": 0, "done_today": false } },','    "delete-habit": { "type": "mutateState", "path": "habits", "operation": "delete", "key": "{{id}}" },','    "show-add-form": { "type": "mutateState", "path": "view/active", "operation": "set", "value": "Add New" }',"  }","}","","For sets of repetitive actions (one per day, one per item, etc.), define a single parameterized action and pass the distinguishing value at dispatch time rather than defining one action per item.","",'Theme rule: when an app has dark/light modes, include a visible Toggle labeled "Dark Mode" or "Theme" bound to state (for example "$state:settings/dark"). A generated manifest must not include theme state without an on-screen toggle.',"","GUIDELINES:","1. Always use design tokens \u2014 never raw CSS, hex colors, or pixel sizes.","2. Keep manifests under ~100KB \u2014 if an app needs more, it outgrew Forge.","3. Use flat element maps \u2014 reference children by ID, never nest.","4. Data tables use pagination \u2014 never dump hundreds of rows; set pageSize on Table.","5. Actions are declarative \u2014 never write JavaScript callbacks or event handlers.","6. Shapes in Drawing are data \u2014 never write raw SVG markup. Use the shape types.",'7. State paths use "/" separators: "view/active", "goals/calories".',"8. Prefer Repeater for lists \u2014 define template once, bind to data path.","9. Always handle empty states with EmptyState component.",'10. Use conditional visibility: "visible": {"$when": {...}} to show/hide elements.',"11. Data access is opt-in \u2014 set dataAccess.enabled: false (or omit) unless user wants LLM to read data.","12. Prefer query over read \u2014 use forgeui_query_app_data for aggregates instead of forgeui_read_app_data.","13. Never modify user data directly \u2014 read to reason, then update the manifest, not the records.","14. Write mobile-safe layouts: KpiGrid for KPI cards, short labels, wrap:true for horizontal button rows.","15. Prefer token gap/padding values (sm, md, lg) over raw numbers.","16. If dark/light modes exist, include a visible bound Toggle so users can switch modes."].join(`
`)}function Te(){return{type:"object",required:["manifest","id","elements"],properties:{manifest:{type:"string",const:"0.1.0"},id:{type:"string",pattern:"^[a-z0-9][a-z0-9-]*$"},root:{type:"string"},title:{type:"string"},schema:{type:"object",properties:{version:{type:"number"},tables:{type:"object",additionalProperties:{type:"object",properties:{columns:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:["string","number","boolean"]},default:{}},required:["type"]}}},required:["columns"]}}}},state:{type:"object",additionalProperties:{}},elements:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:ue},props:{type:"object"},children:{type:"array",items:{type:"string"}},visible:{type:"object",properties:{$when:{type:"object",properties:{path:{type:"string"},eq:{},neq:{},gt:{type:"number"},lt:{type:"number"},gte:{type:"number"},lte:{type:"number"},in:{type:"array"},notIn:{type:"array"},exists:{type:"boolean"}},required:["path"]}}}},required:["type"]}},actions:{type:"object",additionalProperties:{type:"object",properties:{type:{type:"string",enum:[...Gt]},path:{type:"string"},value:{},operation:{type:"string",enum:[...Ht]},set:{type:"object"},data:{type:"object"},key:{type:"string"},formId:{type:"string"},action:{type:"string"},target:{type:"string"},url:{type:"string"},method:{type:"string",enum:[...Jt]},body:{type:"object"},message:{type:"string"},duration:{type:"number",minimum:0}},required:["type"]}},dataAccess:{type:"object",properties:{enabled:{type:"boolean",default:!1},readable:{type:"array",items:{type:"string"}},restricted:{type:"array",items:{type:"string"}},summaries:{type:"boolean",default:!1}}},persistState:{type:"boolean"},skipPersistState:{type:"boolean"}}}}var Ur={container:"Stack",row:"Stack",column:"Stack",text:"Text",heading:"Text",label:"Text",image:"Image",icon:"Icon",button:"Button",link:"Link",textInput:"TextInput",textarea:"Textarea",textArea:"Textarea",numberInput:"NumberInput",checkbox:"Checkbox",toggle:"Toggle",select:"Select",divider:"Divider",spacer:"Spacer",card:"Card",table:"Table",list:"List",alert:"Alert",progress:"Progress",badge:"Badge",avatar:"Avatar"};function Fr(s){let t={},e=0;function o(n){let a=n.id||`a2ui-${e++}`,u=Ur[n.type];if(!u||!ie(u))return t[a]={type:"Text",props:{content:`[Unsupported A2UI type: ${n.type}]`,variant:"caption",colorScheme:"secondary"}},a;let l=Br(n.type,n.props||{}),d=(n.children||[]).map(p=>o(p));return t[a]={type:u,props:l,children:d.length>0?d:void 0},a}let r=(s.components||s.content||[]).map(n=>o(n)),c=r.length===1?r[0]:"a2ui-root";return r.length>1&&(t[c]={type:"Stack",props:{gap:"md"},children:r}),{manifest:"0.1.0",id:`a2ui-${Date.now()}`,root:c,elements:t,actions:{}}}function Br(s,t){let e={...t};switch(s){case"heading":e.variant="heading",e.content=t.text||t.content||"",delete e.text;break;case"text":case"label":e.content=t.text||t.content||"",delete e.text;break;case"row":e.direction="row",e.gap=t.gap||t.spacing||"md";break;case"column":e.direction="column",e.gap=t.gap||t.spacing||"md";break;case"container":e.gap=t.gap||t.spacing||"md";break;case"image":e.src=t.src||t.url||"",e.alt=t.alt||"";break;case"button":e.label=t.text||t.label||"",e.variant=t.variant||t.style||"default";break;case"textInput":case"textarea":case"textArea":e.placeholder=t.placeholder||"",e.value=t.value||"",e.label=t.label||"";break;case"numberInput":e.placeholder=t.placeholder||"",e.value=t.value??0,e.label=t.label||"";break;case"select":t.options&&Array.isArray(t.options)&&(e.options=t.options.map(o=>typeof o=="string"?{value:o,label:o}:o));break;case"alert":e.variant=t.type||t.severity||"info",e.content=t.message||t.text||t.content||"",delete e.message,delete e.text;break;case"progress":e.value=t.value??t.percent??0;break}return e}function Xt(s){if(!s||typeof s!="object")return!1;let t=s;return!!(Array.isArray(t.components)||Array.isArray(t.content)||typeof t.type=="string"&&(t.type==="adaptive-card"||t.type.startsWith("a2ui"))||typeof t.version=="string"&&t.version.startsWith("a2ui")||!t.elements&&!t.manifest&&Array.isArray(t.content))}function Ie(s){return Xt(s)?Fr(s):s}function Qt(s){return`forgeui_${(s||"global").replace(/[^a-zA-Z0-9-]/g,"_")}`}var Me="f";function Vr(s){return new Promise((t,e)=>{let o=r=>e(r??new Error("IDB"));if(!globalThis.indexedDB)return o();let i=indexedDB.open(`${Qt(s)}_f`,1);i.onupgradeneeded=()=>{i.result.createObjectStore(Me)},i.onsuccess=()=>t(i.result),i.onerror=i.onblocked=()=>o(i.error)})}async function er(s,t){if(s.length===0)return;let e=null;try{e=await Vr(t),await new Promise((o,i)=>{let r=e.transaction(Me,"readwrite"),c=r.objectStore(Me);for(let{file:n,id:a}of s)c.put(n,a);r.oncomplete=()=>o(),r.onerror=r.onabort=()=>i(r.error)})}catch{return}finally{e?.close()}}function tr(s,t,e="none"){let o=Qt(t),i=e,r=null,c=!1,n=!1,a=null,u=null,l=null,d=[];function p(){let h=v();for(let w of d)try{w(h)}catch{}}function v(){return{mode:i,isPersisting:r!=null&&c,lastSaved:a,lastLoaded:u,error:l,dbName:i==="indexeddb"?o:null}}async function N(){if(r)return r;try{let{createIndexedDbPersister:h}=await import("tinybase/persisters/persister-indexed-db");return r=h(s,o),l=null,r}catch(h){throw l=`IndexedDB unavailable: ${h.message}`,p(),h}}async function P(){if(i==="none")return;let h=await N();try{await h.load(),u=Date.now()}catch(w){l=`Load failed: ${w.message}`,p()}try{h.startAutoSave(),c=!0}catch(w){l=`Auto-save failed: ${w.message}`}try{h.startAutoLoad(1),n=!0}catch(w){l=`Auto-load failed: ${w.message}`}p()}async function x(){if(r){c&&(r.stopAutoSave(),c=!1),n&&(r.stopAutoLoad(),n=!1);try{await r.save(),a=Date.now()}catch(h){l=`Final save failed: ${h.message}`}p()}}async function I(){if(!(i==="none"||!r)){try{await r.save(),a=Date.now(),l=null}catch(h){l=`Save failed: ${h.message}`}p()}}async function S(){if(!(i==="none"||!r)){try{await r.load(),u=Date.now(),l=null}catch(h){l=`Load failed: ${h.message}`}p()}}async function E(){if(await x(),r){try{r.destroy()}catch{}r=null}d=[],p()}function $(h){if(h===i)return;let w=i;i=h,w==="indexeddb"&&h==="none"&&(r&&c&&(r.stopAutoSave(),c=!1),r&&n&&(r.stopAutoLoad(),n=!1)),h==="indexeddb"&&w==="none"&&P().catch(()=>{}),p()}function _(h){return d.push(h),()=>{d=d.filter(w=>w!==h)}}return{start:P,stop:x,save:I,load:S,setMode:$,getStatus:v,addListener:_,destroy:E}}var pe=class{constructor(t=50){this._stack=[];this._position=-1;this._listeners=[];this._maxDepth=t}push(t){if(this._position<this._stack.length-1&&(this._stack=this._stack.slice(0,this._position+1)),this._position>=0){let e=this._stack[this._position];if(JSON.stringify(e)===JSON.stringify(t))return}this._stack.push(structuredClone(t)),this._stack.length>this._maxDepth?this._stack.shift():this._position++,this._notifyListeners()}undo(){return this._position<=0?null:(this._position--,this._notifyListeners(),structuredClone(this._stack[this._position]))}redo(){return this._position>=this._stack.length-1?null:(this._position++,this._notifyListeners(),structuredClone(this._stack[this._position]))}current(){return this._position<0?null:structuredClone(this._stack[this._position])}jumpTo(t){return t<0||t>=this._stack.length?null:(this._position=t,this._notifyListeners(),structuredClone(this._stack[this._position]))}getState(){return{canUndo:this._position>0,canRedo:this._position<this._stack.length-1,position:this._position,total:this._stack.length}}getTimeline(){return this._stack.map((t,e)=>({position:e,id:t.id}))}clear(){this._stack=[],this._position=-1,this._notifyListeners()}addListener(t){return this._listeners.push(t),()=>{this._listeners=this._listeners.filter(e=>e!==t)}}_notifyListeners(){let t=this.getState();for(let e of this._listeners)try{e(t)}catch{}}};function rr(s){if(!Z(s))return s;let t=typeof s.manifest=="string"?s.manifest:"";if(!(/^0\.0(?:\.|$)/.test(t)||!t&&("version"in s||"manifestVersion"in s||"components"in s||"rootElement"in s||qr(s.elements))))return s;let r={...s,manifest:"0.1.0"};if(delete r.version,delete r.manifestVersion,!r.elements&&Z(r.components)&&(r.elements=r.components,delete r.components),!r.root&&typeof r.rootElement=="string"&&(r.root=r.rootElement,delete r.rootElement),Z(r.elements)){let c={};for(let[n,a]of Object.entries(r.elements)){if(!Z(a))continue;let u={...a};!u.type&&typeof u.component=="string"&&(u.type=u.component,delete u.component),c[n]=u}r.elements=c}return r}function qr(s){return Z(s)?Object.values(s).some(t=>Z(t)&&"component"in t):!1}function Z(s){return s!==null&&typeof s=="object"&&!Array.isArray(s)}import{html as Le,css as ze,nothing as Wr}from"lit";import{LitElement as Kr}from"lit";var ge=class ge extends Kr{constructor(){super(...arguments);this._instanceId=`forge-${++ge._instanceCounter}`;this.props={};this.store=null;this.onAction=null;this.itemContext=null}static get properties(){return{props:{type:Object}}}connectedCallback(){super.connectedCallback()}resolve(e){if(!this.store)return e;this.itemContext&&J(this.itemContext);try{return T(this.store,e)}finally{J(null)}}getProp(e){let o=this.props?.[e];return typeof o=="string"&&(o.startsWith("$state:")||o.startsWith("$computed:")||o.startsWith("$item:")||o.startsWith("$expr:")||o.includes("{{")&&o.includes("}}"))?this.resolve(o):o}getArray(e){let o=this.getProp(e);return Array.isArray(o)?o:o&&typeof o=="object"?Object.values(o):[]}getString(e,o=""){let i=this.getProp(e);return typeof i=="string"?i:String(i??o)}getNumber(e,o=0){let i=this.getProp(e);return typeof i=="number"?i:Number(i)||o}getBool(e,o=!1){let i=this.getProp(e);return typeof i=="boolean"?i:o}getBoundProp(e,o){let i=typeof this.props?.bind=="string"?this.props.bind:"";if(i){let c=this.resolve(i);if(c!==void 0)return c}let r=this.getProp(e);return r===void 0?o:r}dispatchAction(e,o){let i=typeof this.props?.bind=="string"?this.props.bind:"",r=i?{...o||{},bind:i}:o;this.onAction&&this.onAction(e,r),this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:e,payload:r},bubbles:!0,composed:!0}))}handleAction(e){let o=this.getString("action");o&&this.dispatchAction(o,this.props)}prop(e){return this.getProp(e)}static get sharedStyles(){return[Pe]}gapValue(e){let o={none:"0",0:"0","3xs":"var(--forgeui-space-3xs)","2xs":"var(--forgeui-space-2xs)",xs:"var(--forgeui-space-xs)",sm:"var(--forgeui-space-sm)",md:"var(--forgeui-space-md)",lg:"var(--forgeui-space-lg)",xl:"var(--forgeui-space-xl)","2xl":"var(--forgeui-space-2xl)"};if(e==null||e==="")return"var(--forgeui-space-md)";let i=String(e);return i in o?o[i]:/^\d+(\.\d+)?$/.test(i)?`${i}px`:/^\d+(\.\d+)?(px|rem|em|%|vw|vh|ch)$/.test(i)?i:"var(--forgeui-space-md)"}static get styles(){return[Pe]}};ge._instanceCounter=0;var g=ge;var Ce=class extends g{static get styles(){return ze`
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
  `}render(){let t=this.getString("label","Button"),e=this.getString("variant","primary"),o=this.getString("size",""),i=this.getBool("disabled"),r=this.getProp("pressed");return Le`<button class="${e} ${o}" ?disabled=${i}
      aria-pressed=${r==null?Wr:String(!!r)}
      @click=${c=>this.handleAction(c)}>${t}<slot></slot></button>`}};customElements.define("forgeui-button",Ce);var je=class extends g{static get styles(){return ze`
    :host { display:flex; gap:var(--forgeui-space-xs); }
  `}render(){return Le`<slot></slot>`}};customElements.define("forgeui-button-group",je);var Re=class extends g{static get styles(){return ze`
    :host { display:inline-flex; }
    a { color:var(--forgeui-color-primary); text-decoration:none; font-size:var(--forgeui-text-sm); cursor:pointer;
      text-decoration-thickness:1px; text-underline-offset:2px; }
    a:hover { text-decoration:underline; }
    a:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; border-radius:2px; }
  `}render(){let t=this.getString("label",""),e=this.getString("href","#");return Le`<a href="${e}">${t}<slot></slot></a>`}};customElements.define("forgeui-link",Re);import{html as O,css as X,nothing as or}from"lit";var De=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return X`
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
  `}render(){let t=this.getString("content",""),e=this.getString("variant","body"),i={h1:"heading1",h2:"heading2",h3:"heading3",title:"heading2",subtitle:"subheading",paragraph:"body",text:"body",secondary:"muted",tertiary:"caption"}[e]||e,r=this.getString("colorScheme",""),c=this.getString("align",""),n=this.getString("weight",""),a={primary:"var(--forgeui-color-primary)",secondary:"var(--forgeui-color-text-secondary)",tertiary:"var(--forgeui-color-text-tertiary)",success:"var(--forgeui-color-success)",warning:"var(--forgeui-color-warning)",error:"var(--forgeui-color-error)",info:"var(--forgeui-color-info)"},u={normal:"var(--forgeui-weight-normal)",medium:"var(--forgeui-weight-medium)",semibold:"var(--forgeui-weight-semibold)",bold:"var(--forgeui-weight-bold)"},l=[];r&&a[r]&&l.push(`color:${a[r]}`),n&&u[n]&&l.push(`font-weight:${u[n]}`);let d=c?`align-${c}`:"",p=O`${t}<slot></slot>`;return i==="heading1"?O`<h1 class="${i} ${d}" style="${l.join(";")}">${p}</h1>`:i==="heading2"?O`<h2 class="${i} ${d}" style="${l.join(";")}">${p}</h2>`:i==="heading3"?O`<h3 class="${i} ${d}" style="${l.join(";")}">${p}</h3>`:O`<div class="${i} ${d}" style="${l.join(";")}">${t}<slot></slot></div>`}};customElements.define("forgeui-text",De);var Oe=class extends g{static get styles(){return X`
    :host { display:block; }
    img { max-width:100%; height:auto; display:block; border-radius:var(--forgeui-radius-md); }
  `}render(){let t=this.getString("src",""),e=this.getString("alt",""),o=this.getString("fit","contain");return t?O`<img src="${t}" alt="${e}" style="object-fit:${o}" loading="lazy">`:O`${or}`}};customElements.define("forgeui-image",Oe);var Ne=class extends g{static get styles(){return X`
    :host { display:inline-flex; align-items:center; justify-content:center; }
    svg { width:var(--forgeui-icon-md); height:var(--forgeui-icon-md); fill:currentColor; }
  `}render(){let t=this.getString("name","circle"),e={check:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",x:"M6 18L18 6M6 6l12 12",plus:"M12 4v16m8-8H4",minus:"M20 12H4",chevron:"M9 5l7 7-7 7",arrow:"M13 7l5 5m0 0l-5 5m5-5H6",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.063 8.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z",circle:"M12 2a10 10 0 100 20 10 10 0 000-20z",alert:"M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"},o=e[t]||e.circle;return O`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${o}"/></svg>`}};customElements.define("forgeui-icon",Ne);var Ue=class extends g{static get styles(){return X`
    :host { display:inline-flex; align-items:center; max-width:100%; }
    .badge { display:inline-flex; align-items:center; min-height:1.5rem; padding:var(--forgeui-space-2xs) var(--forgeui-space-xs);
      border-radius:var(--forgeui-radius-sm); font-size:var(--forgeui-text-xs); font-weight:var(--forgeui-weight-bold);
      background:var(--forgeui-color-primary); color:var(--forgeui-color-text-inverse); letter-spacing:0.01em;
      max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .badge[variant="success"] { background:var(--forgeui-color-success); color:var(--forgeui-color-text-inverse); }
    .badge[variant="warning"] { background:var(--forgeui-color-warning); color:var(--forgeui-color-text-inverse); }
    .badge[variant="error"] { background:var(--forgeui-color-error); color:var(--forgeui-color-text-inverse); }
  `}render(){let t=this.getString("text","")||this.getString("label",""),e=this.getString("variant","");return O`<span class="badge" variant="${e}">${t}<slot></slot></span>`}};customElements.define("forgeui-badge",Ue);var Fe=class extends g{static get styles(){return X`
    :host { display:inline-flex; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:var(--forgeui-radius-full); background:var(--forgeui-color-primary-subtle);
      color:var(--forgeui-color-primary); display:flex; align-items:center; justify-content:center;
      font-weight:var(--forgeui-weight-semibold); font-size:var(--forgeui-text-sm); overflow:hidden; }
    img { width:100%; height:100%; object-fit:cover; }
  `}render(){let t=this.getString("src",""),e=this.getString("name","?"),o=e.split(" ").map(i=>i[0]).join("").toUpperCase().slice(0,2);return O`<div class="avatar">${t?O`<img src="${t}" alt="${e}">`:o}<slot></slot></div>`}};customElements.define("forgeui-avatar",Fe);var Be=class extends g{static get styles(){return X`
    :host { display:block; text-align:center; padding:var(--forgeui-space-2xl) var(--forgeui-space-lg); }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-xs); overflow-wrap:break-word; }
    .desc { font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text-secondary); margin-bottom:var(--forgeui-space-md); overflow-wrap:break-word; }
  `}render(){let t=this.getString("title","Nothing here"),e=this.getString("description","");return O`
      <div class="title">${t}</div>
      ${e?O`<div class="desc">${e}</div>`:or}
      <slot></slot>
    `}};customElements.define("forgeui-empty-state",Be);import{html as y,css as Q,svg as F,nothing as k}from"lit";var Ve=class extends g{constructor(){super(...arguments);this._query="";this._sortKey="";this._sortDir="asc";this._page=0}static get styles(){return Q`
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
  `}_colKey(e){return typeof e=="string"?e:String(e?.key??"")}_colLabel(e){return typeof e=="string"?e:String(e?.label??e?.key??"")}_statusClass(e){let o=String(e??"").toLowerCase().trim();return["done","complete","completed","success","active","ok","approved","paid"].includes(o)?"success":["in progress","in-progress","pending","warning","waiting","review"].includes(o)?"warning":["to do","to-do","todo","backlog","draft","new","inactive"].includes(o)?"neutral":["high","urgent","critical"].includes(o)?"error":["medium","med"].includes(o)?"warning":["low"].includes(o)?"info":["failed","error","rejected","blocked","overdue"].includes(o)?"error":"neutral"}_renderCell(e,o){let i=this._colKey(e),r=o[i],c=e&&typeof e=="object"?e.type:void 0;if(r==null||r==="")return y`<span style="color:var(--forgeui-color-text-tertiary)">—</span>`;if(c==="badge"||c==="status"){let n=(e.variant&&typeof e.variant=="object"?e.variant[String(r).toLowerCase()]:null)||this._statusClass(r);return y`<span class="badge ${n}">${String(r)}</span>`}if(c==="number")return typeof r=="number"?r.toLocaleString():String(r);if(c==="date"){let n=typeof r=="string"||typeof r=="number"?new Date(r):r;return n instanceof Date&&!isNaN(n.getTime())?n.toLocaleDateString():String(r)}if(c==="currency"){let n=Number(r);return isNaN(n)?String(r):n.toLocaleString(void 0,{style:"currency",currency:e.currency||"USD"})}return c==="boolean"?r?"\u2713":"\u2717":String(r)}_sortBy(e){e&&(this._sortKey===e?this._sortDir=this._sortDir==="asc"?"desc":"asc":(this._sortKey=e,this._sortDir="asc"),this._page=0,this.requestUpdate())}_setQuery(e){this._query=e,this._page=0,this.requestUpdate()}_filteredRows(e,o){let i=this._query.trim().toLowerCase();return i?e.filter(r=>o.some(c=>String(r[this._colKey(c)]??"").toLowerCase().includes(i))):e}_sortedRows(e){if(!this._sortKey)return e;let o=this._sortDir==="asc"?1:-1;return[...e].sort((i,r)=>{let c=i?.[this._sortKey],n=r?.[this._sortKey];if(typeof c=="number"&&typeof n=="number")return(c-n)*o;let a=String(c??"").toLowerCase(),u=String(n??"").toLowerCase();return(a>u?1:a<u?-1:0)*o})}_setPage(e,o){this._page=Math.max(0,Math.min(e,Math.max(0,o-1))),this.requestUpdate()}render(){let e=this.getProp("data"),o=this.getProp("columns")||[],i=this.getString("emptyMessage","No data yet"),r=this.getString("rowAction",""),c=this.getString("caption",""),n=this.getBool("searchable",!1),a=Math.max(0,Math.floor(this.getNumber("pageSize",0)));if(!Array.isArray(e))return y`<div class="empty">${i}</div>`;let u=o.length>0?o:e.length>0?Object.keys(e[0]):[];if(u.length===0)return y`<div class="empty">${i}</div>`;let l=this._filteredRows(e,u),d=this._sortedRows(l),p=a>0?Math.max(1,Math.ceil(d.length/a)):1,v=Math.min(this._page,p-1);v!==this._page&&(this._page=v);let N=a>0?d.slice(v*a,v*a+a):d;return y`
      ${n?y`
        <input class="search-input" .value=${this._query} aria-label="Search"
          @input=${P=>this._setQuery(P.target.value)} />
      `:k}
      <table>
        ${c?y`<caption>${c}</caption>`:k}
        <thead><tr>${u.map(P=>{let x=this._colLabel(P),I=this._colKey(P),S=typeof P=="object"?P.align:void 0,E=typeof P=="object"?P.width:void 0,$=S==="right"?"align-right":S==="center"?"align-center":"",_=typeof P=="object"&&P.sortable===!0,h=this._sortKey===I;return y`<th class="${$}" style="${E?`width:${E}`:""}" aria-sort=${h?this._sortDir==="asc"?"ascending":"descending":k}>
            ${_?y`
              <button type="button" @click=${()=>this._sortBy(I)}>
                <span>${x}</span>${h?y`<span class="sort" aria-hidden="true">${this._sortDir==="asc"?"\u25B2":"\u25BC"}</span>`:k}
              </button>
            `:x}
          </th>`})}</tr></thead>
        <tbody>${N.length===0?y`<tr><td colspan=${u.length} class="empty">${i}</td></tr>`:N.map((P,x)=>{let I=a>0?v*a+x:x,S=!!r,E=S?String(P[typeof u[0]=="string"?u[0]:u[0]?.key]??`Row ${x+1}`):"";return y`<tr class="${S?"row-action":""}"
                tabindex=${S?0:k}
                role=${S?"button":k}
                aria-label=${S?E:k}
                @click=${S?()=>this.dispatchAction(r,{row:P,index:I}):void 0}
                @keydown=${S?$=>{($.key==="Enter"||$.key===" ")&&($.preventDefault(),this.dispatchAction(r,{row:P,index:I}))}:void 0}>
              ${u.map($=>{let _=typeof $=="object"?$.align:void 0;return y`<td class="${_==="right"?"align-right":_==="center"?"align-center":""}">${this._renderCell($,P)}</td>`})}</tr>`})}</tbody>
      </table>
      ${a>0&&d.length>0?y`
        <nav class="pager">
          <button type="button" ?disabled=${v===0} @click=${()=>this._setPage(v-1,p)}>Prev</button>
          <span>${v+1} / ${p}</span>
          <button type="button" ?disabled=${v>=p-1} @click=${()=>this._setPage(v+1,p)}>Next</button>
        </nav>
      `:k}
    `}};customElements.define("forgeui-table",Ve);var qe=class extends g{static get styles(){return Q`
    :host { display:block; }
    .list { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    .item { padding:var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md);
      display:flex; align-items:center; gap:var(--forgeui-space-sm); overflow-wrap:break-word; min-width:0; }
    .item:hover { background:var(--forgeui-color-surface-hover); }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); overflow-wrap:break-word; }
  `}render(){let t=this.getProp("data"),e=this.getString("dataPath","");!("data"in(this.props||{}))&&e&&this.store?.hasTable(e)&&(t=Object.values(this.store.getTable(e)));let o=this.getString("emptyMessage","No items");return!Array.isArray(t)||t.length===0?y`<div class="empty">${o}</div>`:y`<div class="list">${t.map((i,r)=>y`
      <div class="item" data-index=${r}><slot name="item" .item=${i} .index=${r}>${JSON.stringify(i)}</slot></div>
    `)}</div>`}};customElements.define("forgeui-list",qe);var Ke=class extends g{constructor(){super(...arguments);this._palette=["var(--forgeui-color-primary)","var(--forgeui-color-success)","var(--forgeui-color-warning)","var(--forgeui-color-error)","var(--forgeui-color-info)","var(--forgeui-color-chart-6)","var(--forgeui-color-chart-7)","var(--forgeui-color-chart-8)","var(--forgeui-color-chart-9)","var(--forgeui-color-chart-10)"]}static get styles(){return Q`
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
  `}_niceMax(e){if(e<=0)return 1;let o=Math.pow(10,Math.floor(Math.log10(e))),i=e/o;return(i<=1?1:i<=2?2:i<=5?5:10)*o}render(){let e=this.getString("chartType","bar"),o=this.getProp("data")||[],i=this.getString("title",""),r=this.getString("xKey","label")||this.getString("labelKey","label"),c=this.getString("yKey","value")||this.getString("valueKey","value"),n=this.getString("color","");if(!o||o.length===0)return y`
        ${i?y`<div class="title">${i}</div>`:k}
        <div class="empty">No data to display</div>
      `;let a=o.map(x=>typeof x=="number"?{label:"",value:x}:x&&typeof x=="object"?{label:String(x[r]??x.label??x.name??x.x??""),value:Number(x[c]??x.value??x.y??0)||0,color:x.color}:{label:String(x),value:0}),u=600,l=260,d={top:8,right:16,bottom:36,left:48},p=u-d.left-d.right,v=l-d.top-d.bottom,N,P=k;if(e==="pie"||e==="donut"){let x=a.reduce((R,M)=>R+Math.max(0,M.value),0)||1,I=u/2,S=l/2,E=Math.min(p,v)/2-8,$=e==="donut"?E*.55:0,_=-Math.PI/2,h=[],w=[];a.forEach((R,M)=>{let q=Math.max(0,R.value)/x,L=_,z=_+q*Math.PI*2;_=z;let ee=z-L>Math.PI?1:0,ce=I+E*Math.cos(L),It=S+E*Math.sin(L),Mt=I+E*Math.cos(z),Ct=S+E*Math.sin(z),me=R.color||this._palette[M%this._palette.length];if(w.push(me),$>0){let ir=I+$*Math.cos(L),sr=S+$*Math.sin(L),ar=I+$*Math.cos(z),nr=S+$*Math.sin(z);h.push(F`<path class="slice" fill="${me}" d="M ${ce} ${It} A ${E} ${E} 0 ${ee} 1 ${Mt} ${Ct} L ${ar} ${nr} A ${$} ${$} 0 ${ee} 0 ${ir} ${sr} Z"/>`)}else h.push(F`<path class="slice" fill="${me}" d="M ${I} ${S} L ${ce} ${It} A ${E} ${E} 0 ${ee} 1 ${Mt} ${Ct} Z"/>`)}),N=F`<g>${h}</g>`,P=y`<div class="legend">${a.map((R,M)=>y`
        <span class="legend-item"><span class="swatch" style="background:${w[M]}"></span>${R.label} (${R.value})</span>
      `)}</div>`}else{let x=Math.max(...a.map(_=>_.value),0),I=this._niceMax(x),S=_=>d.top+v-_/I*v,E=4,$=[];for(let _=0;_<=E;_++){let h=I*_/E,w=S(h);$.push(F`<line class="grid" x1="${d.left}" x2="${d.left+p}" y1="${w}" y2="${w}"/>`),$.push(F`<text class="tick-label" x="${d.left-6}" y="${w+3}" text-anchor="end">${h.toLocaleString()}</text>`)}if(e==="line"||e==="area"){let _=p/Math.max(1,a.length-1),h=a.map((M,q)=>{let L=d.left+q*_,z=S(M.value);return`${q===0?"M":"L"} ${L} ${z}`}).join(" "),w=e==="area"?h+` L ${d.left+p} ${d.top+v} L ${d.left} ${d.top+v} Z`:"",R=n||"var(--forgeui-color-primary)";N=y`
          <g>${$}</g>
          ${e==="area"?F`<path class="area" d="${w}" style="fill:${R};opacity:0.15"/>`:k}
          ${F`<path class="line" d="${h}" style="stroke:${R}"/>`}
          ${a.map((M,q)=>{let L=d.left+q*_,z=S(M.value);return F`<circle class="point" cx="${L}" cy="${z}" r="3" style="fill:${R}"/>
              <text class="tick-label" x="${L}" y="${d.top+v+14}" text-anchor="middle">${M.label}</text>`})}
        `}else{let _=a.length,h=p/_,w=Math.max(2,h*.7),R=h-w;N=y`
          <g>${$}</g>
          ${a.map((M,q)=>{let L=d.left+q*h+R/2,z=S(M.value),ee=Math.max(0,d.top+v-z),ce=M.color||n||"var(--forgeui-color-primary)";return F`<rect class="bar" x="${L}" y="${z}" width="${w}" height="${ee}" rx="2" style="fill:${ce}">
                <title>${M.label}: ${M.value}</title>
              </rect>
              <text class="tick-label" x="${L+w/2}" y="${d.top+v+14}" text-anchor="middle">${M.label}</text>`})}
        `}}return y`
      ${i?y`<div class="title">${i}</div>`:k}
      <div class="wrap">
        <svg viewBox="0 0 ${u} ${l}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${i||e+" chart"}">
          ${N}
        </svg>
        ${P}
      </div>
    `}};customElements.define("forgeui-chart",Ke);var We=class extends g{static get styles(){return Q`
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
  `}_trendClass(t){let e=String(t??"").toLowerCase();return e==="up"||e==="positive"||e.startsWith("+")?"up":e==="down"||e==="negative"||e.startsWith("-")?"down":"neutral"}render(){let t=this.getString("label",""),e=this.getProp("value"),o=this.getProp("trend"),i=this.getString("trendLabel",""),r=this.getString("subtitle",""),c=this.getString("unit",""),n=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),a=i||(o==null?"":String(o)),u=this._trendClass(o);return y`<div class="card">
      <div class="top">
        ${t?y`<div class="label">${t}</div>`:k}
        ${a?y`<span class="trend ${u}">${u==="up"?"\u2191":u==="down"?"\u2193":"\u2192"} ${a}</span>`:k}
      </div>
      <div class="value">${n}${c?y` <span class="meta">${c}</span>`:k}</div>
      ${r?y`<div class="meta">${r}</div>`:k}
    </div>`}};customElements.define("forgeui-stat-card",We);var Ge=class extends g{static get styles(){return Q`
    :host { display:grid; min-width:0; gap:var(--forgeui-space-md); grid-template-columns:repeat(auto-fit,minmax(min(12rem,100%),1fr)); }
  `}render(){let t=Math.max(0,Math.floor(this.getNumber("columns",0))),e=this.gapValue(this.getString("gap","md"));return this.style.gap=e,this.style.gridTemplateColumns=t>0?`repeat(${t}, minmax(0, 1fr))`:"",y`<slot></slot>`}};customElements.define("forgeui-kpi-grid",Ge);var He=class extends g{static get styles(){return Q`
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
  `}_trendMeta(t){if(t==null||t==="")return null;if(typeof t=="number")return t>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(t)}%`}:t<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(t)}%`}:{dir:"neutral",arrow:"\u2192",display:"0%"};if(typeof t=="string"){let e=t.toLowerCase(),o=t.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*(%?)\s*$/);if(o){let i=parseFloat(o[1]),r=o[2];return i>0?{dir:"up",arrow:"\u2191",display:`${Math.abs(i)}${r}`}:i<0?{dir:"down",arrow:"\u2193",display:`${Math.abs(i)}${r}`}:{dir:"neutral",arrow:"\u2192",display:`0${r}`}}return e==="up"||e==="positive"||e==="increase"?{dir:"up",arrow:"\u2191",display:""}:e==="down"||e==="negative"||e==="decrease"?{dir:"down",arrow:"\u2193",display:""}:e==="flat"||e==="neutral"||e==="same"?{dir:"neutral",arrow:"\u2192",display:""}:{dir:"neutral",arrow:"",display:t}}return null}render(){let t=this.getString("label",""),e=this.getProp("value"),o=this.getProp("trend"),i=this.getString("trendLabel",""),r=this.getProp("goal"),c=this.getString("unit",""),n=this.getString("suffix",""),a=this.getString("subtitle",""),u=this.getString("variant","");u&&this.setAttribute("variant",u);let l=typeof e=="number"?e.toLocaleString():e==null||e===""?"\u2014":String(e),d=this._trendMeta(o);return y`
      ${t?y`<div class="label">${t}</div>`:k}
      <div class="value-row">
        <span class="value">${l}</span>
        ${c?y`<span class="unit">${c}</span>`:k}
        ${n?y`<span class="suffix">${n}</span>`:k}
        ${d?y`<span class="trend ${d.dir} ${!d.display&&!i?"icon-only":""}">${d.arrow}${d.display?y` ${d.display}`:k}${i?y` ${i}`:k}</span>`:k}
      </div>
      ${a?y`<div class="subtitle">${a}</div>`:k}
      ${r!=null&&r!==""?y`<div class="goal">Goal: ${typeof r=="number"?r.toLocaleString():r}</div>`:k}
    `}};customElements.define("forgeui-metric",He);import{css as Gr,svg as K}from"lit";var Je=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return Gr`
    :host { display:block; }
    svg { display:block; }
  `}render(){let t=this.getNumber("width",400),e=this.getNumber("height",300),o=this.getString("background","transparent"),i=this.getProp("shapes")||[];return K`
      <svg width="${t}" height="${e}" style="background:${o}" viewBox="0 0 ${t} ${e}">
        ${i.map(r=>this.renderShape(r))}
      </svg>
    `}renderShape(t){let e={fill:t.fill??void 0,stroke:t.stroke??void 0,"stroke-width":t.strokeWidth??void 0,opacity:t.opacity??void 0},o=t.action?()=>{this.onAction&&this.onAction(t.action)}:void 0,i=t.action?"cursor:pointer":void 0;switch(t.type){case"rect":return K`<rect
          x="${t.x??0}" y="${t.y??0}"
          width="${t.width??0}" height="${t.height??0}"
          rx="${t.rx??0}" ry="${t.ry??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"circle":return K`<circle
          cx="${t.cx??0}" cy="${t.cy??0}" r="${t.r??0}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"ellipse":return K`<ellipse
          cx="${t.cx??t.x??0}" cy="${t.cy??t.y??0}"
          rx="${t.rx??(t.width?t.width/2:0)}" ry="${t.ry??(t.height?t.height/2:0)}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??0}"
          opacity="${e.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"line":return K`<line
          x1="${t.x1??0}" y1="${t.y1??0}"
          x2="${t.x2??0}" y2="${t.y2??0}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${i}"
          @click=${o}
        />`;case"text":return K`<text
          x="${t.x??0}" y="${t.y??0}"
          fill="${e.fill??"currentColor"}"
          font-size="${t.fontSize??14}"
          font-weight="${t.fontWeight??"normal"}"
          font-family="${t.fontFamily??"sans-serif"}"
          text-anchor="${t.textAnchor??"start"}"
          opacity="${e.opacity??1}"
          style="${i}"
          @click=${o}
        >${t.content??""}</text>`;case"path":return K`<path
          d="${t.d??""}"
          fill="${e.fill??"none"}"
          stroke="${e.stroke??"none"}"
          stroke-width="${e["stroke-width"]??1}"
          opacity="${e.opacity??1}"
          style="${i}"
          @click=${o}
        />`;default:return K``}}};customElements.define("forgeui-drawing",Je);import{html as U,css as ae,nothing as W}from"lit";var Ye=class extends g{static get styles(){return ae`
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
  `}render(){let t=this.getString("variant","info"),e=this.getString("title",""),o=this.getString("message","");return U`<div class="alert ${t}" role=${t==="error"||t==="warning"?"alert":"status"}>
      ${e?U`<strong>${e}</strong> `:W}${o}<slot></slot>
    </div>`}};customElements.define("forgeui-alert",Ye);var Ze=class extends g{constructor(){super(...arguments);this._priorFocus=null;this._keydownHandler=e=>this._onKeydown(e);this._close=()=>{this.dispatchAction("close")}}static get styles(){return ae`
    :host { display:none; }
    :host([open]) { display:flex; position:fixed; inset:0; z-index:50; align-items:center; justify-content:center; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); }
    .dialog { position:relative; background:var(--forgeui-color-surface); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-lg); min-width:min(20rem, 90vw); max-width:90vw; max-height:90vh; overflow:auto;
      border:1px solid var(--forgeui-color-border);
      box-shadow:var(--forgeui-shadow-lg); z-index:1; word-break:break-word; }
    .title { font-size:var(--forgeui-text-lg); font-weight:var(--forgeui-weight-semibold); margin-bottom:var(--forgeui-space-md); }
    .actions { display:flex; justify-content:flex-end; gap:var(--forgeui-space-xs); margin-top:var(--forgeui-space-lg); }
  `}render(){let e=this.getString("title",""),o=this.getBool("open"),i=`${this._instanceId}-title`;return o?this.setAttribute("open",""):this.removeAttribute("open"),o?U`
      <div class="backdrop" @click=${this._close}></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${e?i:W}"
        tabindex="-1"
        @click=${r=>r.stopPropagation()}
      >
        ${e?U`<h2 id="${i}" class="title">${e}</h2>`:W}
        <slot></slot>
      </div>
    `:W}updated(e){if(super.updated?.(e),e.has("props")){let o=this.getBool("open"),r=e.get("props")?.open??!1;o&&!r?this._onOpen():!o&&r&&this._onClose()}}_onOpen(){this._priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,document.addEventListener("keydown",this._keydownHandler),requestAnimationFrame(()=>{let e=this.shadowRoot?.querySelector(".dialog");(this._firstFocusableInDialog()??e)?.focus()})}_onClose(){document.removeEventListener("keydown",this._keydownHandler),this._priorFocus instanceof HTMLElement&&this._priorFocus.focus(),this._priorFocus=null}disconnectedCallback(){super.disconnectedCallback?.(),document.removeEventListener("keydown",this._keydownHandler)}_onKeydown(e){if(e.key==="Escape"){e.preventDefault(),this._close();return}e.key==="Tab"&&this._trapFocus(e)}_trapFocus(e){let o=this._allFocusableInDialog();if(o.length===0){e.preventDefault();return}let i=o[0],r=o[o.length-1],c=this.shadowRoot?.activeElement??document.activeElement;e.shiftKey?(c===i||!this._dialogContains(c))&&(e.preventDefault(),r.focus()):(c===r||!this._dialogContains(c))&&(e.preventDefault(),i.focus())}_firstFocusableInDialog(){return this._allFocusableInDialog()[0]??null}_allFocusableInDialog(){let e=this.shadowRoot?.querySelector(".dialog");if(!e)return[];let o='button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',i=Array.from(e.querySelectorAll(o)),r=e.querySelector("slot"),c=r instanceof HTMLSlotElement?r.assignedElements({flatten:!0}).flatMap(n=>[n,...Array.from(n.querySelectorAll(o))].filter(u=>u instanceof HTMLElement&&u.matches(o))):[];return[...i,...c].filter(n=>!n.disabled)}_dialogContains(e){return e?this.shadowRoot?.querySelector(".dialog")?.contains(e)??!1:!1}};customElements.define("forgeui-dialog",Ze);var Xe=class extends g{static get styles(){return ae`
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
  `}render(){let t=this.getProp("value"),e=this.getNumber("max",100),o=t==null,i=o?0:Math.max(0,Math.min(Number(t),e)),r=o?0:i/e*100,c=this.getString("label",""),n=this.getBool("showValue");return U`
      ${c||n?U`
        <div class="meta">
          ${c?U`<span>${c}</span>`:U`<span></span>`}
          ${n?U`<span class="value">${Math.round(r)}%</span>`:W}
        </div>
      `:W}
      <div
        class="progress ${o?"indeterminate":""}"
        role="progressbar"
        aria-label="${c||"Progress"}"
        aria-valuemin="0"
        aria-valuemax="${e}"
        aria-valuenow="${o?W:i}"
        aria-valuetext="${o?"Loading":`${Math.round(r)}%`}"
      >
        <div class="bar" style=${o?"":`width:${r}%`}></div>
      </div>
    `}};customElements.define("forgeui-progress",Xe);var Qe=class extends g{static get styles(){return ae`
    :host { display:block; position:fixed; bottom:var(--forgeui-space-lg); right:var(--forgeui-space-lg); z-index:60; }
    .toast { padding:var(--forgeui-space-sm) var(--forgeui-space-md); border-radius:var(--forgeui-radius-md);
      background:var(--forgeui-color-text); color:var(--forgeui-color-text-inverse); font-size:var(--forgeui-text-sm);
      box-shadow:var(--forgeui-shadow-lg); max-width:20rem; overflow-wrap:break-word; }
  `}render(){let t=this.getString("message","");return t?U`<div class="toast">${t}</div>`:U`${W}`}};customElements.define("forgeui-toast",Qe);var et=class extends g{static get styles(){return ae`
    :host { display:block; }
    .error { padding:var(--forgeui-space-sm); background:var(--forgeui-color-error-subtle); color:var(--forgeui-color-error);
      border:1px solid var(--forgeui-color-error); border-radius:var(--forgeui-radius-md); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getString("msg","Unknown error");return U`<div class="error" role="alert">⚠ ${t}</div>`}};customElements.define("forgeui-error",et);import{html as b,css as C,nothing as A}from"lit";var tt=class extends g{static get styles(){return C`
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
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),o=this.getString("hint",""),i=this.getString("error",""),r=this.getString("inputType","")||this.getString("type","text"),c=this.getBool("multiline"),n=String(this.getBoundProp("value","")??""),a=this._instanceId;return b`
      ${t?b`<label for="${a}">${t}</label>`:A}
      ${c?b`<textarea id="${a}" placeholder="${e}" .value=${n} @input=${u=>this.dispatchAction("change",{value:u.target.value})}></textarea>`:b`<input id="${a}" type="${r}" placeholder="${e}" .value=${n} @input=${u=>this.dispatchAction("change",{value:u.target.value})}>`}
      ${o&&!i?b`<div class="hint">${o}</div>`:A}
      ${i?b`<div class="error">${i}</div>`:A}
    `}};customElements.define("forgeui-text-input",tt);var rt=class extends g{static get styles(){return C`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); overflow-wrap:break-word; }
    textarea { width:100%; min-height:5rem; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; font-size:var(--forgeui-text-base); background:var(--forgeui-color-surface);
      color:var(--forgeui-color-text); transition:border-color var(--forgeui-transition-fast); box-sizing:border-box; min-width:0; resize:vertical; }
    textarea:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    textarea::placeholder { color:var(--forgeui-color-text-tertiary); }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
    .error { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-error); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),o=this.getString("hint",""),i=this.getString("error",""),r=Math.max(1,Math.floor(this.getNumber("rows",4))),c=this.getProp("maxLength"),n=this.getBool("required"),a=this.getBool("disabled"),u=String(this.getBoundProp("value","")??""),l=this._instanceId;return b`
      ${t?b`<label for="${l}">${t}</label>`:A}
      <textarea id="${l}" rows=${r} placeholder="${e}" maxlength=${c??A}
        ?required=${n} ?disabled=${a} .value=${u}
        @input=${d=>this.dispatchAction("change",{value:d.target.value})}></textarea>
      ${o&&!i?b`<div class="hint">${o}</div>`:A}
      ${i?b`<div class="error">${i}</div>`:A}
    `}};customElements.define("forgeui-textarea",rt);var ot=class extends g{static get styles(){return C`
    :host { display:block; min-width:0; }
    form { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
  `}render(){let t=this.getString("action","");return b`<form @submit=${e=>{e.preventDefault();let o={submitted:!0};t&&this.dispatchAction(t,o),this.dispatchEvent(new CustomEvent("forgeui-submit",{detail:o,bubbles:!0,composed:!0}))}}><slot></slot></form>`}};customElements.define("forgeui-form",ot);var it=class extends g{static get styles(){return C`
    :host { display:block; min-width:0; }
    fieldset { border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); padding:var(--forgeui-space-md); margin:0; min-width:0; }
    legend { padding:0 var(--forgeui-space-2xs); color:var(--forgeui-color-text); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-semibold); }
    .body { display:flex; flex-direction:column; gap:var(--forgeui-space-sm); }
    .description { color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-xs); margin-bottom:var(--forgeui-space-sm); }
    .error { color:var(--forgeui-color-error); font-size:var(--forgeui-text-xs); margin-top:var(--forgeui-space-sm); }
  `}render(){let t=this.getString("label",""),e=this.getString("description",""),o=this.getString("error","");return b`<fieldset>
      ${t?b`<legend>${t}</legend>`:A}
      ${e?b`<div class="description">${e}</div>`:A}
      <div class="body"><slot></slot></div>
      ${o?b`<div class="error">${o}</div>`:A}
    </fieldset>`}};customElements.define("forgeui-field-group",it);var st=class extends g{static get styles(){return C`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("min"),o=this.getProp("max"),i=this.getProp("step"),r=this.getBoundProp("value"),c=this._instanceId;return b`
      ${t?b`<label for="${c}">${t}</label>`:A}
      <input id="${c}" type="number" min=${e} max=${o} step=${i} .value=${r??""}
        @input=${n=>this.dispatchAction("change",{value:Number(n.target.value)})}>
    `}};customElements.define("forgeui-number-input",st);var at=class extends g{static get styles(){return C`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    select { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    select:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getProp("options")||[],o=String(this.getBoundProp("value","")??""),i=this._instanceId;return b`
      ${t?b`<label for="${i}">${t}</label>`:A}
      <select id="${i}" .value=${o} @change=${r=>this.dispatchAction("change",{value:r.target.value})}>
        ${e.map(r=>b`<option value=${typeof r=="string"?r:r.value} ?selected=${(typeof r=="string"?r:r.value)===o}>
          ${typeof r=="string"?r:r.label||r.value}
        </option>`)}
      </select>
    `}};customElements.define("forgeui-select",at);var nt=class extends g{static get styles(){return C`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("placeholder",""),o=this.getString("hint",""),i=this.getProp("options")||[],r=String(this.getBoundProp("value","")??""),c=this.getBool("disabled"),n=this.getBool("required"),a=this._instanceId,u=`${a}-list`;return b`
      ${t?b`<label for="${a}">${t}</label>`:A}
      <input id="${a}" list="${u}" role="combobox" aria-autocomplete="list"
        placeholder="${e}" .value=${r} ?disabled=${c} ?required=${n}
        @input=${l=>this.dispatchAction("change",{value:l.target.value})}>
      <datalist id="${u}">
        ${i.map(l=>{let d=String(typeof l=="string"?l:l?.value??l?.label??""),p=typeof l=="string"?"":String(l?.label??"");return b`<option value=${d} label=${p}></option>`})}
      </datalist>
      ${o?b`<div class="hint">${o}</div>`:A}
    `}};customElements.define("forgeui-combobox",nt);var lt=class extends g{static get styles(){return C`
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
  `}render(){let t=this.getString("label",""),e=this.getProp("options")||[],o=this.getBoundProp("value",this.getProp("selected")??[]),i=Number(this.getProp("maxSelections")),r=Number.isFinite(i)&&i>=0?i:1/0,c=(Array.isArray(o)?o.map(l=>String(l)):[]).slice(0,r),n=this.getBool("disabled"),a=this._instanceId,u=l=>{let d=c.filter(p=>p!==l);this.dispatchAction("remove",{value:l}),this.dispatchAction("change",{value:d,selected:d})};return b`
      ${t?b`<label for="${a}">${t}</label>`:A}
      <select id="${a}" multiple ?disabled=${n}
        @change=${l=>{let d=Array.from(l.target.selectedOptions).map(p=>p.value).slice(0,r);this.dispatchAction("change",{value:d,selected:d})}}>
        ${e.map(l=>{let d=String(typeof l=="string"?l:l?.value??l?.label??"");return b`<option value=${d} ?selected=${c.includes(d)}>
            ${typeof l=="string"?l:l?.label??d}
          </option>`})}
      </select>
      <div class="tags">
        ${c.map(l=>b`<span class="tag">${l}<button type="button" aria-label=${`Remove ${l}`} @click=${()=>u(l)}>×</button></span>`)}
        <slot></slot>
      </div>
    `}};customElements.define("forgeui-multi-select",lt);var ct=class extends g{static get styles(){return C`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    fieldset { border:0; padding:0; margin:0; min-width:0; }
    legend { font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); color:var(--forgeui-color-text); }
    .options { display:flex; flex-direction:column; gap:var(--forgeui-space-xs); }
    label { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); color:var(--forgeui-color-text); cursor:pointer; overflow-wrap:anywhere; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); flex:0 0 auto; }
    .hint { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-tertiary); margin-top:var(--forgeui-space-2xs); }
  `}render(){let t=this.getString("label",""),e=this.getString("hint",""),o=this.getProp("options")||[],i=String(this.getBoundProp("value","")??""),r=this.getBool("disabled"),c=this._instanceId;return b`
      <fieldset ?disabled=${r}>
        ${t?b`<legend>${t}</legend>`:A}
        <div class="options">
          ${o.map((n,a)=>{let u=String(typeof n=="string"?n:n?.value??n?.label??""),l=String(typeof n=="string"?n:n?.label??u),d=`${c}-${a}`;return b`<label for=${d}>
              <input id=${d} type="radio" name=${c} value=${u} ?checked=${u===i}
                @change=${p=>this.dispatchAction("change",{value:p.target.value})}>
              <span>${l}</span>
            </label>`})}
        </div>
      </fieldset>
      ${e?b`<div class="hint">${e}</div>`:A}
    `}};customElements.define("forgeui-radio-group",ct);var ut=class extends g{static get styles(){return C`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); margin-bottom:var(--forgeui-space-xs); cursor:pointer; }
    input { width:1.125rem; height:1.125rem; accent-color:var(--forgeui-color-primary); cursor:pointer; }
    label { font-size:var(--forgeui-text-sm); cursor:pointer; }
    :focus-within label { text-decoration:underline; }
  `}render(){let t=this.getString("label",""),e=!!this.getBoundProp("checked",this.getProp("value")??!1),o=this._instanceId;return b`
      <input id="${o}" type="checkbox" ?checked=${e} @change=${i=>this.dispatchAction("change",{checked:i.target.checked})}>
      ${t?b`<label for="${o}">${t}</label>`:A}
    `}};customElements.define("forgeui-checkbox",ut);var dt=class extends g{constructor(){super(...arguments);this._toggle=()=>{if(this.getBool("disabled"))return;let e=!!this.getBoundProp("on",this.getProp("value")??!1);this.dispatchAction("change",{value:!e,checked:!e})};this._onKeydown=e=>{(e.key==="Enter"||e.key===" "||e.key==="Spacebar")&&(e.preventDefault(),this._toggle())}}static get styles(){return C`
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
  `}render(){let e=!!this.getBoundProp("on",this.getProp("value")??!1),o=this.getString("label",""),i=this.getBool("disabled"),r=this._instanceId;return b`
      <label for="${r}" class="toggle-label">
        <button
          id="${r}"
          class="switch"
          role="switch"
          type="button"
          aria-checked="${e?"true":"false"}"
          ?disabled=${i}
          @click="${this._toggle}"
          @keydown="${this._onKeydown}"
        ></button>
        ${o?b`<span class="toggle-text">${o}</span>`:A}
      </label>
    `}};customElements.define("forgeui-toggle",dt);var pt=class extends g{static get styles(){return C`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input { width:100%; padding:var(--forgeui-space-xs) var(--forgeui-space-sm); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); font:inherit; height:var(--forgeui-input-height);
      background:var(--forgeui-color-surface); color:var(--forgeui-color-text); box-sizing:border-box; min-width:0; }
    input:focus { outline:none; border-color:var(--forgeui-color-primary); box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle); }
  `}render(){let t=this.getString("label",""),e=this.getString("value",""),o=this._instanceId;return b`
      ${t?b`<label for="${o}">${t}</label>`:A}
      <input id="${o}" type="date" .value=${e} @change=${i=>this.dispatchAction("change",{value:i.target.value})}>
    `}};customElements.define("forgeui-date-picker",pt);var gt=class extends g{static get styles(){return C`
    :host { display:block; flex:1 1 auto; min-width:0; max-width:100%; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); overflow-wrap:break-word; }
    input[type=range] { width:100%; accent-color:var(--forgeui-color-primary); min-width:0; }
    .value { font-size:var(--forgeui-text-xs); color:var(--forgeui-color-text-secondary); }
  `}render(){let t=this.getString("label",""),e=this.getNumber("min",0),o=this.getNumber("max",100),i=this.getNumber("step",1),r=this.getBoundProp("value",e),c=Number(r);Number.isFinite(c)||(c=e);let n=this._instanceId;return b`
      ${t?b`<label for="${n}">${t}</label>`:A}
      <input id="${n}" type="range" min=${e} max=${o} step=${i} .value=${c}
        @input=${a=>this.dispatchAction("change",{value:Number(a.target.value)})}>
      <div class="value">${c}</div>
    `}};customElements.define("forgeui-slider",gt);var ft=class extends g{constructor(){super(...arguments);this._dragging=!1;this._openFilePicker=()=>{this.shadowRoot?.querySelector('input[type="file"]')?.click()};this._onDropzoneKeydown=e=>{e.key!=="Enter"&&e.key!==" "||(e.preventDefault(),this._openFilePicker())};this._onFileChange=e=>{let o=Array.from(e.target.files??[]);this._processFiles(o)};this._onDragOver=e=>{e.preventDefault(),!this._dragging&&(this._dragging=!0,this.requestUpdate())};this._onDragLeave=e=>{e.currentTarget===e.target&&(this._dragging=!1,this.requestUpdate())};this._onDrop=e=>{e.preventDefault(),this._dragging=!1,this.requestUpdate(),this._processFiles(Array.from(e.dataTransfer?.files??[]))}}static get styles(){return C`
    :host { display:block; margin-bottom:var(--forgeui-space-sm); }
    label { display:block; font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); margin-bottom:var(--forgeui-space-2xs); }
    .dropzone { border:2px dashed var(--forgeui-color-border-strong); border-radius:var(--forgeui-radius-md);
      padding:var(--forgeui-space-xl); text-align:center; cursor:pointer; transition:border-color var(--forgeui-transition-fast); }
    .dropzone:hover, .dropzone.dragging { border-color:var(--forgeui-color-primary); background:var(--forgeui-color-primary-subtle); }
    .dropzone:focus-visible { outline:3px solid var(--forgeui-color-focus); outline-offset:2px; }
    .dropzone p { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); }
  `}_maxSizeBytes(){let e=this.getProp("maxSize");if(typeof e=="number"&&Number.isFinite(e)&&e>=0)return Math.floor(e);if(typeof e!="string")return null;let o=e.trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);if(!o)return null;let i=Number(o[1]),r=(o[2]||"b").toLowerCase(),c=r==="gb"?1<<30:r==="mb"?1<<20:r==="kb"?1024:1,n=i*c;return Number.isFinite(n)?Math.floor(n):null}_newFileId(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}_${Math.random().toString(36).slice(2)}`}_processFiles(e){let o=this.getBool("multiple"),i=this._maxSizeBytes(),r=(o?e:e.slice(0,1)).map(d=>{let p=this._newFileId(),v=i==null||d.size<=i,N={id:p,name:d.name,size:d.size,type:d.type,lastModified:d.lastModified,accepted:v,storageKey:v?p:null};return v||(N.error="maxSize"),[d,N]}),c=r.filter(([,d])=>d.accepted),n=r.map(([,d])=>d),a=c.map(([,d])=>d),u=o?a:a[0]??null,l=a[0]??null;this.dispatchAction("change",{id:l?.id??null,uuid:l?.id??null,name:l?.name??null,size:l?.size??null,type:l?.type??null,lastModified:l?.lastModified??null,storageKey:l?.storageKey??null,value:u,files:n,rejected:n.filter(d=>!d.accepted),multiple:o,maxSize:i}),er(c.map(([d,p])=>({file:d,id:p.id})))}render(){let e=this.getString("label","Upload file"),o=this.getString("accept","*"),i=this.getBool("multiple");return b`
      ${e?b`<label>${e}</label>`:A}
      <div class="dropzone ${this._dragging?"dragging":""}" role="button" tabindex="0"
        @click=${this._openFilePicker} @keydown=${this._onDropzoneKeydown}
        @dragover=${this._onDragOver} @dragleave=${this._onDragLeave} @drop=${this._onDrop}>
        <p>Drop</p>
        <input type="file" accept="${o}" ?multiple=${i} hidden @change=${this._onFileChange}>
      </div>
    `}};customElements.define("forgeui-file-upload",ft);import{html as j,css as B,nothing as mt}from"lit";var ht=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return B`
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
  `}render(){let t=this.getString("direction","column"),e=t==="horizontal"||t==="row"?"row":"column",o=this.getString("gap","")||this.getString("spacing","md"),i=this.getString("padding",""),r=this.getString("align",""),c=this.getString("justify",""),n=this.getBool("wrap"),a=this.gapValue(o),u=i?this.gapValue(i):"0";return this.setAttribute("direction",e),r&&this.setAttribute("align",r),c&&this.setAttribute("justify",c),n&&this.setAttribute("wrap",""),this.style.gap=a,this.style.padding=u,j`<slot></slot>`}};customElements.define("forgeui-stack",ht);var bt=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return B`
    :host { display: grid; min-width: 0; }
    @media (max-width: 900px) {
      :host([responsive]) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 640px) {
      :host([responsive]) { grid-template-columns: 1fr !important; }
    }
  `}render(){let t=this.getProp("columns"),e;typeof t=="number"?e=String(t):typeof t=="string"&&t?e=t:e="1";let o=/^\d+$/.test(e)?`repeat(${e}, minmax(0, 1fr))`:e,i=this.getString("gap","md"),r=this.gapValue(i),c=this.getString("padding",""),n=c?this.gapValue(c):"0";return this.style.gridTemplateColumns=o,this.style.gap=r,this.style.padding=n,/^\d+$/.test(e)&&Number(e)>=2&&this.setAttribute("responsive",""),j`<slot></slot>`}};customElements.define("forgeui-grid",bt);var yt=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return B`
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
  `}render(){let t=this.getString("variant",""),e=this.getString("title",""),o=this.getString("subtitle","");return t&&this.setAttribute("variant",t),j`
      ${e||o?j`
        <div class="header">
          ${e?j`<div class="title">${e}</div>`:mt}
          ${o?j`<div class="subtitle">${o}</div>`:mt}
        </div>
      `:mt}
      <div class="body"><slot></slot></div>
    `}};customElements.define("forgeui-card",yt);var vt=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return B`:host { display:block; margin-inline:auto; width:100%; box-sizing:border-box; }`}render(){let t=this.getString("maxWidth",""),e={sm:"640px",md:"768px",lg:"1024px",xl:"1280px","2xl":"1536px",full:"100%",none:"none","":""},o=t in e?e[t]:t,i=this.getString("padding","");return o&&o!=="none"?this.style.maxWidth=o:this.style.maxWidth="",this.style.padding=i?this.gapValue(i):"",j`<slot></slot>`}};customElements.define("forgeui-container",vt);var xt=class extends g{static get properties(){return{props:{type:Object}}}constructor(){super(),this._active=""}static get styles(){return B`
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
  `}_itemKey(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.id??t.key??t.value??t.label??"":t??"")}_itemLabel(t){return typeof t=="string"?t:String(t&&typeof t=="object"?t.label??t.title??t.value??"":t??"")}updated(){Array.from(this.children).filter(e=>!(e instanceof HTMLScriptElement)).forEach((e,o)=>{let i=(e.props||{}).slot??e.getAttribute("slot");String(o)===this._active||i===this._active?e.setAttribute("data-active",""):e.removeAttribute("data-active")})}_moveTo(t,e){let o=this._itemKey(e[t])||String(t);this._active=o,this.requestUpdate(),this.dispatchAction("tab-change",{active:o,value:o}),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(`#${this._instanceId}-tab-${t}`)?.focus()})}render(){let t=this.getProp("items")||this.getProp("tabs")||[],e=Array.isArray(t)?t:[],o=this.getBoundProp("activeTab",this.getProp("value"));o!==void 0&&String(o)!==this._active&&(this._active=String(o)),!this._active&&e.length>0&&(this._active=this._itemKey(e[0])||"0");let i=e.findIndex((c,n)=>(this._itemKey(c)||String(n))===this._active),r=(c,n)=>{let a=-1;c.key==="ArrowRight"?a=(n+1)%e.length:c.key==="ArrowLeft"?a=(n-1+e.length)%e.length:c.key==="Home"?a=0:c.key==="End"&&(a=e.length-1),a!==-1&&(c.preventDefault(),this._moveTo(a,e))};return j`
      <div class="tabs" role="tablist">${e.map((c,n)=>{let a=this._itemKey(c)||String(n),u=this._itemLabel(c)||String(n+1),l=a===this._active;return j`
          <button class="tab" ?active=${l} role="tab" aria-selected=${l}
            id="${this._instanceId}-tab-${n}"
            aria-controls="${this._instanceId}-panel"
            tabindex="${l?0:-1}"
            @click=${()=>{this._active=a,this.requestUpdate(),this.dispatchAction("tab-change",{active:a,value:a})}}
            @keydown=${d=>r(d,n)}>${u}</button>
        `})}</div>
      <div class="panel" role="tabpanel" id="${this._instanceId}-panel"
        aria-labelledby="${this._instanceId}-tab-${i>=0?i:0}"><slot></slot></div>
    `}};customElements.define("forgeui-tabs",xt);var wt=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return B`
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
  `}render(){let t=this.getString("title","Section");return j`<details><summary>${t}</summary><div class="content"><slot></slot></div></details>`}};customElements.define("forgeui-accordion",wt);var $t=class extends g{static get styles(){return B`
    :host { display:block; }
    hr { border:none; border-top:1px solid var(--forgeui-color-border); margin:var(--forgeui-space-sm) 0; }
  `}render(){return j`<hr>`}};customElements.define("forgeui-divider",$t);var kt=class extends g{static get styles(){return B`:host { display:block; }`}render(){let t=this.getString("size","md"),e=this.getString("height",""),o=this.getString("width",""),i=e?this.gapValue(e):this.gapValue(t),r=o?/^\d+(\.\d+)?%$/.test(o)?o:this.gapValue(o):"";return j`<div style="height:${i};${r?`width:${r}`:""}"></div>`}};customElements.define("forgeui-spacer",kt);var St=class extends g{static get properties(){return{props:{type:Object}}}static get styles(){return B`
    :host { display:flex; flex-direction:column; gap:var(--forgeui-space-md); min-width:0; }
    :host([direction="row"]) { flex-direction:row; flex-wrap:wrap; }
    .empty { padding:var(--forgeui-space-lg); text-align:center; color:var(--forgeui-color-text-tertiary); font-size:var(--forgeui-text-sm); }
  `}render(){let t=this.getArray("data"),e=this.getString("emptyMessage",""),o=this.getString("direction","column");(o==="row"||o==="horizontal")&&this.setAttribute("direction","row");let i=this.getString("gap","md");return this.style.gap=this.gapValue(i),t.length===0&&e?j`<div class="empty">${e}</div>`:j`<slot></slot>`}};customElements.define("forgeui-repeater",St);import{html as V,css as fe,nothing as Hr}from"lit";var _t=class extends g{static get styles(){return fe`
    :host { display:flex; align-items:center; gap:var(--forgeui-space-xs); font-size:var(--forgeui-text-sm); }
    .sep { color:var(--forgeui-color-text-tertiary); }
    a { color:var(--forgeui-color-primary); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .current { color:var(--forgeui-color-text); font-weight:var(--forgeui-weight-medium); }
  `}render(){let t=this.getProp("items")||[];return V`${t.map((e,o)=>{let i=o===t.length-1,r=typeof e=="string"?e:e.label,c=typeof e=="string"?"#":e.href;return V`
        ${o>0?V`<span class="sep">/</span>`:Hr}
        ${i?V`<span class="current">${r}</span>`:V`<a href="${c}">${r}</a>`}
      `})}`}};customElements.define("forgeui-breadcrumb",_t);var At=class extends g{static get styles(){return fe`
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
  `}render(){let t=this.getProp("steps")||[],e=this.getBoundProp("active",this.getProp("activeStep")??0),o=Number(e)||0;return V`${t.map((i,r)=>{let c=typeof i=="string"?i:i.label||i.title||`Step ${r+1}`,n=r===o,a=r<o;return V`<div class="step" ?active=${n} ?completed=${a}>
        <div class="circle">${a?"\u2713":r+1}</div>
        <div class="label">${c}</div>
      </div>`})}`}};customElements.define("forgeui-stepper",At);var Pt=class extends g{static get styles(){return fe`
    :host { display:block; min-width:0; }
    .field { display:flex; flex-direction:column; gap:var(--forgeui-space-2xs); min-width:0; }
    label { color:var(--forgeui-color-text); font-size:var(--forgeui-text-sm); font-weight:var(--forgeui-weight-medium); }
    input { width:100%; min-height:var(--forgeui-touch-target); box-sizing:border-box; padding:0 var(--forgeui-space-md);
      border:1px solid var(--forgeui-color-border); border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface);
      color:var(--forgeui-color-text); font:inherit; font-size:var(--forgeui-text-sm); }
    input:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    input::placeholder { color:var(--forgeui-color-text-tertiary); }
  `}render(){let t=this.getString("label","Search"),e=this.getString("placeholder","Search"),o=String(this.getBoundProp("value","")??""),i=this.getBool("disabled"),r=this.getString("action","change"),c=this._instanceId;return V`<div class="field">
      <label for="${c}">${t}</label>
      <input id="${c}" type="search" placeholder="${e}" .value=${o} ?disabled=${i}
        @input=${n=>{let a=n.target.value;this.dispatchAction(r,{value:a,query:a})}}>
    </div>`}};customElements.define("forgeui-search-box",Pt);var Et=class extends g{static get styles(){return fe`
    :host { display:flex; align-items:center; justify-content:space-between; gap:var(--forgeui-space-sm); min-width:0; }
    .status { color:var(--forgeui-color-text-secondary); font-size:var(--forgeui-text-sm); overflow-wrap:anywhere; }
    .controls { display:inline-flex; align-items:center; gap:var(--forgeui-space-xs); }
    button { min-width:var(--forgeui-touch-target); min-height:var(--forgeui-touch-target); border:1px solid var(--forgeui-color-border);
      border-radius:var(--forgeui-radius-md); background:var(--forgeui-color-surface); color:var(--forgeui-color-text);
      cursor:pointer; font:inherit; font-size:var(--forgeui-text-sm); }
    button:hover:not(:disabled) { background:var(--forgeui-color-surface-hover); }
    button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }
    button:disabled { opacity:0.5; cursor:not-allowed; }
  `}render(){let t=Math.max(1,Math.floor(Number(this.getBoundProp("page",this.getProp("page")??1))||1)),e=Math.max(1,Math.floor(this.getNumber("totalPages",1))),o=Math.min(t,e),i=this.getString("label",`Page ${o} of ${e}`),r=this.getString("action","page-change"),c=n=>{let a=Math.min(e,Math.max(1,n));this.dispatchAction(r,{value:a,page:a,totalPages:e})};return V`
      <div class="status" aria-live="polite">${i}</div>
      <div class="controls">
        <button type="button" aria-label="Previous page" ?disabled=${o<=1} @click=${()=>c(o-1)}>‹</button>
        <button type="button" aria-label="Next page" ?disabled=${o>=e} @click=${()=>c(o+1)}>›</button>
      </div>
    `}};customElements.define("forgeui-pagination",Et);function Tt(s){return!!s&&typeof s=="object"&&!Array.isArray(s)}var le=class extends Jr{constructor(){super();this._activeView="";this._persister=null;this._undoStack=new pe(50);this._openDialogs=[];this._runtimeToasts=[];this._nextToastId=1;this.surface="standalone"}static get properties(){return{manifest:{type:Object},src:{type:String},surface:{type:String,reflect:!0},colorScheme:{type:String,reflect:!0}}}connectedCallback(){super.connectedCallback(),this._readInlineManifest(),this._initManifest()}async disconnectedCallback(){super.disconnectedCallback(),this._persister&&(await this._persister.destroy(),this._persister=null)}_readInlineManifest(){if(this.manifest)return;let e=this.querySelector('script[type="application/json"]');if(e?.textContent)try{this.manifest=JSON.parse(e.textContent)}catch(o){console.error("[Forge] Failed to parse inline manifest JSON:",o)}}updated(e){(e.has("manifest")||e.has("src"))&&this._initManifest()}_initManifest(){let e=this.manifest;if(!e&&this.src)try{e=JSON.parse(this.src)}catch(i){this._validation={valid:!1,errors:[{path:"/",message:`Invalid JSON: ${i.message}`,severity:"error"}],warnings:[]};return}if(!e)return;e=Ie(e),e=rr(e);let o=Se(e);this._validation=o,o.valid||console.error("[ForgeUI] Manifest validation failed:",JSON.stringify(o.errors,null,2)),this._parsedManifest=e,this._store=xe({schema:e.schema,initialState:e.state,deferSchema:this._persistenceModeFor(e)!=="none"}),this._activeView=e.root,this._setupPersistence(e).then(()=>this.requestUpdate()).catch(i=>{console.warn("[forgeui] persister setup failed:",i),this.requestUpdate()}),this._undoStack.push(e),this.dispatchEvent(new CustomEvent("forgeui-ready",{detail:{appId:e.id},bubbles:!0,composed:!0})),this.requestUpdate()}render(){if(!this._parsedManifest||!this._store)return this._validation&&!this._validation.valid?this._renderErrors():ne`<div style="padding:1rem;color:var(--forgeui-color-text-secondary)">Loading...</div>`;let e={manifest:this._parsedManifest,store:this._store,activeView:this._activeView,onAction:this._handleAction.bind(this)};return ne`
      ${Vt(e)}
      ${this._runtimeToasts.map(o=>ne`
        <forgeui-toast .props=${o.props} .store=${this._store}></forgeui-toast>
      `)}
    `}_renderErrors(){let e=this._validation?.errors||[];return ne`
      <div style="padding:var(--forgeui-space-md);font-family:var(--forgeui-font-family)">
        <div style="color:var(--forgeui-color-error);font-weight:var(--forgeui-weight-semibold);margin-bottom:var(--forgeui-space-sm)">
          Manifest Validation Errors
        </div>
        ${e.map(o=>ne`
          <div style="font-size:var(--forgeui-text-sm);color:var(--forgeui-color-text-secondary);margin-bottom:var(--forgeui-space-2xs)">
            <code>${o.path}</code>: ${o.message}
          </div>
        `)}
      </div>
    `}async _setupPersistence(e){if(!this._store)return;this._persister&&(await this._persister.destroy(),this._persister=null);let o=this._persistenceModeFor(e);if(o==="none"){this._emitPersist("disabled",null);return}this._persister=tr(this._store,e.id,o),this._emitPersist("loading",this._persister.getStatus());try{await this._persister.start();let i=be(this._store,e.schema);i.missingStep!==void 0?(console.warn(`[forgeui] schema migration chain is missing a step from v${i.missingStep} to v${e.schema?.version}`),Y(this._store,e.schema),G(this._store,i.missingStep),i.migrated&&await this._persister.save()):i.migrated?(Y(this._store,e.schema),await this._persister.save()):Y(this._store,e.schema);let r=this._persister.getStatus();this._emitPersist(r.error?"failed":"ready",r)}catch(i){Y(this._store,e.schema);let r=this._persister?.getStatus()??null;this._emitPersist("failed",r,i instanceof Error?i.message:String(i)),this._persister=null}}_persistenceModeFor(e){return e.persistState===!0?"indexeddb":e.skipPersistState===!0?"none":this.surface==="standalone"||this.surface==="embed"?"indexeddb":"none"}getPersistenceStatus(){return this._persister?.getStatus()??null}_emitPersist(e,o,i){this.dispatchEvent(new CustomEvent("forgeui-persistence",{detail:{state:e,status:o,error:i},bubbles:!0,composed:!0}))}_handleAction(e,o){let i=this._parsedManifest;if(!i||!this._store)return;let r=typeof o?.bind=="string"?o.bind:"",c=!1;if(r[7]&&r.startsWith("$state:")){let a=o?.value??o?.checked??o?.active;a!==void 0&&(oe(this._store,{type:"mutateState",path:r.slice(7),operation:"set",value:a}),c=!0,this.requestUpdate())}if(!i.actions){this._handleImplicitDialogClose(e)&&this.requestUpdate();return}let n=i.actions[e];if(!(!n&&c)){if(!n){if(this._handleImplicitDialogClose(e))return;console.warn(`[Forge] Unknown action: ${e}`);return}switch(n.type){case"mutateState":{if(n.set&&typeof n.set=="object")for(let[a,u]of Object.entries(n.set))oe(this._store,{type:n.type,path:a,operation:"set",value:typeof u=="string"?T(this._store,u):u});else{let a=n.key?.replace("{{id}}",String(o?.id||"")),u=n.path?.replace("{{id}}",String(o?.id||"")),l=n.value??o;typeof l=="string"?l=T(this._store,l):l&&typeof l=="object"&&(l=Object.fromEntries(Object.entries(l).map(([d,p])=>[d,typeof p=="string"?T(this._store,p):p]))),oe(this._store,{type:n.type,path:u,operation:n.operation,key:a,value:l})}this.requestUpdate();break}case"navigate":{n.target&&(this._activeView=n.target,this.requestUpdate());break}case"openDialog":{let a=typeof n.target=="string"?n.target:"";a&&this._setDialogOpen(a,!0);break}case"closeDialog":{let a=typeof n.target=="string"?n.target:this._openDialogs[this._openDialogs.length-1]||"";a&&this._setDialogOpen(a,!1);break}case"toast":{this._showToast(n,o);break}case"callApi":{this._callApi(e,n,o);break}default:this.dispatchEvent(new CustomEvent("forgeui-action",{detail:{action:e,payload:o,definition:n},bubbles:!0,composed:!0}))}}}_handleImplicitDialogClose(e){if(e!=="close")return!1;let o=this._openDialogs[this._openDialogs.length-1]||"";return o?(this._setDialogOpen(o,!1),!0):!1}_setDialogOpen(e,o){let i=this._parsedManifest;if(!i)return;let r=i.elements[e];if(!r||r.type!=="Dialog"){console.warn(`[Forge] Dialog action target is not a Dialog element: ${e}`);return}this._parsedManifest={...i,elements:{...i.elements,[e]:{...r,props:{...r.props||{},open:o}}}},this._openDialogs=o?[...this._openDialogs.filter(c=>c!==e),e]:this._openDialogs.filter(c=>c!==e),this.requestUpdate()}_showToast(e,o){let i=Tt(e.data)?e.data:{},r=this._stringFromAction(e.message??i.message??e.value??o?.message);if(!r)return;let c=e.duration??i.duration,n=typeof c=="number"&&Number.isFinite(c)?Math.max(0,c):3e3,a=this._nextToastId++;this._runtimeToasts=[...this._runtimeToasts,{id:a,props:{...i,message:r}}],this.requestUpdate(),n>0&&window.setTimeout(()=>{this._runtimeToasts=this._runtimeToasts.filter(u=>u.id!==a),this.requestUpdate()},n)}async _callApi(e,o,i){let r=this._stringFromAction(o.url);if(!r){this._dispatchApiError(e,i,"callApi action requires a url");return}let c=this._safeRequestUrl(r);if(!c){this._dispatchApiError(e,i,`Blocked unsafe callApi URL: ${r}`);return}let n=this._safeMethod(o.method),a=Tt(o.body)?o.body:void 0,u=a&&n!=="GET"?this._resolveActionValue(a):void 0;try{let l=await fetch(c,{method:n,headers:u===void 0?void 0:{"content-type":"application/json"},body:u===void 0?void 0:JSON.stringify(u)}),d=await this._readApiResponse(l),p={action:e,payload:i,status:l.status,ok:l.ok,result:d};this.dispatchEvent(new CustomEvent("forgeui-api-result",{detail:p,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("forgeui-action-result",{detail:p,bubbles:!0,composed:!0}))}catch(l){this._dispatchApiError(e,i,l instanceof Error?l.message:String(l))}}_safeRequestUrl(e){try{let o=globalThis.location?.href||"http://localhost/",i=new URL(e,o);return i.protocol!=="http:"&&i.protocol!=="https:"?null:i.href}catch{return null}}_safeMethod(e){let o=typeof e=="string"?e.toUpperCase():"GET";return["GET","POST","PUT","PATCH","DELETE"].includes(o)?o:"GET"}async _readApiResponse(e){return(e.headers.get("content-type")||"").includes("application/json")?e.json():e.text()}_dispatchApiError(e,o,i){let r={action:e,payload:o,ok:!1,error:i};this.dispatchEvent(new CustomEvent("forgeui-api-error",{detail:r,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("forgeui-action-result",{detail:r,bubbles:!0,composed:!0}))}_resolveActionValue(e){return typeof e=="string"?T(this._store,e):Array.isArray(e)?e.map(o=>this._resolveActionValue(o)):Tt(e)?Object.fromEntries(Object.entries(e).map(([o,i])=>[o,this._resolveActionValue(i)])):e}_stringFromAction(e){let o=typeof e=="string"?T(this._store,e):e;return typeof o=="string"?o:""}getStore(){return this._store}getManifest(){return this._parsedManifest}getValidation(){return this._validation}dispatchAction(e,o){this._handleAction(e,o)}pushManifestUpdate(e){this._undoStack.push(e)}undo(){let e=this._undoStack.undo();return e&&(this.manifest=e,this.requestUpdate()),e}redo(){let e=this._undoStack.redo();return e&&(this.manifest=e,this.requestUpdate()),e}getUndoRedoState(){return this._undoStack.getState()}static catalogPrompt(e){return Ee(e)}static catalogJsonSchema(){return Te()}};le.styles=[Kt,Wt];customElements.define("forgeui-app",le);export{le as ForgeUIApp,Ee as catalogPrompt,Te as catalogToJsonSchema,xe as createForgeUIStore,oe as executeAction,Lr as extractManifest,Ie as ingestPayload,Xt as isA2UIPayload,ie as isValidComponentType,T as resolveRef,Se as validateManifest};
