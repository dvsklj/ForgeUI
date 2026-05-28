/**
 * Forge Components aggregate entrypoint.
 */
import { ForgeUIElement } from './base.js';
export * from './actions.js';
export * from './content.js';
export * from './data.js';
export * from './feedback.js';
export * from './input.js';
export * from './layout.js';
export * from './navigation.js';
export declare class ForgeDrawing extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<2>;
    renderShape(s: any): import("lit-html").TemplateResult<2>;
}
//# sourceMappingURL=index.d.ts.map