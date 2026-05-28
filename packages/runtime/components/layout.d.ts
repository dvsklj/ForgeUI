import { ForgeUIElement } from './base.js';
export declare class ForgePageHeader extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeStack extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeGrid extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeCard extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeContainer extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeTabs extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    _active: string;
    constructor();
    static get styles(): import("lit").CSSResult;
    _itemKey(item: any): string;
    _itemLabel(item: any): string;
    updated(): void;
    _moveTo(newIndex: number, arr: any[]): void;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeAccordion extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeDivider extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeSpacer extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeRepeater extends ForgeUIElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=layout.d.ts.map