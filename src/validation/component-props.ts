import type { ComponentType } from '../types/index.js';

const SHARED = ['id', 'bind', 'action', 'slot'];
const BASE_TEXT = ['label', 'value', 'variant'];
const INPUT_BASE = ['label', 'value'];

const defs: Record<ComponentType, string[]> = {
  Stack: [...SHARED, 'direction', 'align', 'justify', 'gap', 'spacing', 'padding', 'wrap'],
  Grid: [...SHARED, 'columns', 'gap', 'padding', 'minChildWidth'],
  Card: [...SHARED, 'variant', 'title', 'subtitle', 'padding'],
  Container: [...SHARED, 'maxWidth', 'padding'],
  Tabs: [...SHARED, 'items', 'tabs', 'activeTab', 'value'],
  Accordion: [...SHARED, 'title', 'items', 'multiple'],
  Divider: [...SHARED, 'direction', 'spacing'],
  Spacer: [...SHARED, 'size', 'height', 'width'],
  Repeater: [...SHARED, 'dataPath', 'template', 'data', 'emptyMessage', 'direction', 'gap'],
  Text: [...SHARED, 'content', 'variant', 'weight', 'color', 'colorScheme', 'align'],
  Image: [...SHARED, 'src', 'alt', 'aspectRatio', 'fit', 'radius'],
  Icon: [...SHARED, 'name', 'size', 'color'],
  Badge: [...SHARED, 'text', 'label', 'colorScheme', 'variant'],
  Avatar: [...SHARED, 'src', 'name', 'size'],
  EmptyState: [...SHARED, 'title', 'description', 'icon', 'actionLabel'],
  TextInput: [...SHARED, ...INPUT_BASE, 'placeholder', 'hint', 'error', 'multiline', 'required', 'maxLength', 'type', 'inputType'],
  NumberInput: [...SHARED, ...INPUT_BASE, 'min', 'max', 'step', 'required'],
  Select: [...SHARED, ...INPUT_BASE, 'options', 'placeholder', 'required'],
  MultiSelect: [...SHARED, ...INPUT_BASE, 'options', 'maxSelections'],
  Checkbox: [...SHARED, ...INPUT_BASE, 'description', 'checked'],
  Toggle: [...SHARED, ...INPUT_BASE, 'description', 'checked'],
  DatePicker: [...SHARED, ...INPUT_BASE, 'format', 'min', 'max'],
  Slider: [...SHARED, ...INPUT_BASE, 'min', 'max', 'step', 'showValue', 'unit'],
  FileUpload: [...SHARED, ...INPUT_BASE, 'accept', 'maxSize', 'multiple'],
  Button: [...SHARED, 'label', 'variant', 'size', 'icon', 'disabled', 'pressed'],
  ButtonGroup: [...SHARED, 'direction', 'spacing'],
  Link: [...SHARED, 'label', 'href', 'variant', 'external'],
  Table: [...SHARED, 'dataPath', 'data', 'columns', 'pageSize', 'searchable', 'selectable', 'emptyMessage', 'rowAction', 'caption'],
  List: [...SHARED, 'dataPath', 'template', 'emptyMessage', 'dividers', 'items'],
  Chart: [...SHARED, ...BASE_TEXT, 'title', 'dataPath', 'xKey', 'yKey', 'labelKey', 'valueKey', 'chartType', 'color', 'colorScheme', 'height', 'data', 'yFormat'],
  Metric: [...SHARED, ...BASE_TEXT, 'format', 'goal', 'trend', 'trendLabel', 'prefix', 'suffix', 'unit', 'subtitle'],
  Alert: [...SHARED, 'title', 'message', 'variant', 'dismissible'],
  Dialog: [...SHARED, 'title', 'trigger', 'confirmLabel', 'cancelLabel', 'open'],
  Progress: [...SHARED, ...BASE_TEXT, 'max', 'size', 'showValue'],
  Toast: [...SHARED, 'message', 'variant', 'duration'],
  Breadcrumb: [...SHARED, 'items'],
  Stepper: [...SHARED, 'steps', 'activeStep', 'variant'],
  Drawing: [...SHARED, 'width', 'height', 'background', 'shapes'],
};

export const COMPONENT_PROP_ALLOWLIST = Object.fromEntries(
  Object.entries(defs).map(([k, v]) => [k, new Set(v)])
) as unknown as Record<ComponentType, ReadonlySet<string>>;
