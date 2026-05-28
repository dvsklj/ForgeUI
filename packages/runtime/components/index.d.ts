/**
 * Forge Components aggregate entrypoint.
 */
import { nothing } from 'lit';
import { ForgeUIElement } from './base.js';
export * from './actions.js';
export * from './content.js';
export * from './layout.js';
export * from './navigation.js';
export declare class ForgeTextInput extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeNumberInput extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeSelect extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeMultiSelect extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeCheckbox extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeToggle extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    private _toggle;
    private _onKeydown;
}
export declare class ForgeDatePicker extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeSlider extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeFileUpload extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    private _dragging;
    private _maxSizeBytes;
    private _newFileId;
    private _openFilePicker;
    private _onDropzoneKeydown;
    private _onFileChange;
    private _onDragOver;
    private _onDragLeave;
    private _onDrop;
    private _processFiles;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeTable extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    _statusClass(val: unknown): string;
    _renderCell(col: any, row: any): any;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeList extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeChart extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    _palette: string[];
    _niceMax(v: number): number;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeMetric extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    _trendMeta(trend: unknown): {
        dir: 'up' | 'down' | 'neutral';
        arrow: string;
        display: string;
    } | null;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeAlert extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeDialog extends ForgeUIElement {
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
export declare class ForgeProgress extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeToast extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class ForgeUIError extends ForgeUIElement {
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
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