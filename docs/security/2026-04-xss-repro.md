# XSS Reproduction: HTML Attribute Injection via Manifest Embedding

## Sample malicious manifest (JSON)

```json
{"id":"test-app","meta":{"title":"x' onmouseover='alert(1)"}}
```

## Rendered HTML (current/vulnerable code path)

The server in `src/server/index.ts:110` produces the attribute value by calling
`JSON.stringify(manifest).replace(/</g, '\\u003c').replace(/"/g, '&quot;')`.
Single quotes are **not** escaped. The template at line 279 embeds the result
inside a double-quoted attribute — but any `"` in the value was already
replaced with `&quot;`, so the outer delimiter is actually safe from `"` escape.
However, the current code on the fix branch already switched the attribute to
use **double quotes** (`manifest="${manifestJson}"`). The `&quot;` replacement
converts `"` → `&quot;` which safely round-trips through the double-quoted
attribute. But critically, **single quotes are never escaped**, and if any code
path or prior version used single-quoted attributes (`manifest='${manifestJson}'`),
a single quote in the value breaks containment.

For the historically-vulnerable single-quoted attribute form:

```html
<forgeui-app manifest='{"id":"test-app","meta":{"title":"x' onmouseover='alert(1)"}}' surface="standalone"></forgeui-app>
```

After the browser parses this, the attribute value ends at the unescaped `'`
and the remainder `onmouseover='alert(1)'` is interpreted as a separate
attribute on the `<forgeui-app>` element — attacker-controlled markup.

## Why the HTML is attacker-controlled

The single quote in the manifest's title field closes the `manifest='`
attribute boundary, allowing arbitrary HTML attributes to be injected into the
`<forgeui-app>` element and, depending on the component's rendering, potentially
leading to XSS.

Even with the current double-quoted attribute form, the approach of embedding
arbitrary JSON inside an HTML attribute is fragile: any future change to the
quoting style, or interaction with a parser that decodes entities differently,
re-opens the class of bug. The structural fix (script-tag payload + property
assignment) eliminates the entire class.
