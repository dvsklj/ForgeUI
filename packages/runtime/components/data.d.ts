import { ForgeUIElement } from './base.js';
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
//# sourceMappingURL=data.d.ts.map