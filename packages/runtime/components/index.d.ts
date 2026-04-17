/**
 * Forge Components — All 37 Lit Web Components
 *
 * Each component extends ForgeElement, uses design tokens,
 * dispatches forge-action events for declarative bindings.
 */
import { nothing } from 'lit';
import { ForgeElement } from './base.js';
export declare class ForgeStack extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeGrid extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeCard extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeContainer extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeTabs extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
        _active: {
            state: boolean;
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
export declare class ForgeAccordion extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeDivider extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeSpacer extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
/**
 * Repeater: renders a child element once per item in a data array.
 * The renderer (not this component) handles the iteration — this element
 * exists only so the type validates and so a clear empty state shows when
 * the data is empty. The actual iteration lives in renderer/index.ts.
 */
export declare class ForgeRepeater extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeText extends ForgeElement {
    static get properties(): {
        props: {
            type: ObjectConstructor;
        };
    };
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeImage extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeIcon extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeBadge extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeAvatar extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeEmptyState extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeTextInput extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeNumberInput extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeSelect extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeMultiSelect extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeCheckbox extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeToggle extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    private _toggle;
    private _onKeydown;
}
export declare class ForgeDatePicker extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeSlider extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeFileUpload extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeButton extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeButtonGroup extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeLink extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeTable extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    _statusClass(val: unknown): string;
    _renderCell(col: any, row: any): any;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeList extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeChart extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    _palette: string[];
    _niceMax(v: number): number;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeMetric extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    _trendMeta(trend: unknown): {
        dir: 'up' | 'down' | 'neutral';
        arrow: string;
        display: string;
    } | null;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeAlert extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeDialog extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    private _priorFocus;
    private _keydownHandler;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
    updated(changed: Map<string, unknown>): void;
    private _onOpen;
    private _onClose;
    disconnectedCallback(): void;
    private _onKeydown;
    private _trapFocus;
    private _firstFocusableInDialog;
    private _allFocusableInDialog;
    private _dialogContains;
    private _close;
}
export declare class ForgeProgress extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeToast extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeBreadcrumb extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeStepper extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeError extends ForgeElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeDrawing extends ForgeElement {
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