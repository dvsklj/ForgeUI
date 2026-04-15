/**
 * Forge Component Catalog — Zod Schemas
 *
 * All 36 component prop schemas. Each schema validates the `props` field
 * of a ForgeElement manifest entry. Schemas are strict (no passthrough).
 */

import { z } from 'zod';

// ─── Shared ──────────────────────────────────────────────────────

const CssDimension = z.string().describe('CSS dimension (e.g. "100%", "16px", "1fr", "auto")');
const StatePath = z.string().describe('State binding ($state:path, $computed:expr, $item:field)');
const ActionRef = z.string().describe('Action ID from manifest actions map');

// ─── Layout (8) ─────────────────────────────────────────────────

export const StackSchema = z.object({
  direction: z.enum(['row', 'column']).default('column'),
  gap: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).default('md'),
  align: z.enum(['start', 'center', 'end', 'stretch', 'baseline']).optional(),
  justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).optional(),
  wrap: z.boolean().default(false),
  padding: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).optional(),
  width: CssDimension.optional(),
  height: CssDimension.optional(),
}).strict();

export const GridSchema = z.object({
  columns: z.union([z.number(), z.string()]).default(1),
  rows: z.union([z.number(), z.string()]).optional(),
  gap: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).default('md'),
  columnGap: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).optional(),
  rowGap: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  padding: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).optional(),
  width: CssDimension.optional(),
  height: CssDimension.optional(),
}).strict();

export const CardSchema = z.object({
  elevation: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  padding: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).default('lg'),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).default('lg'),
  outlined: z.boolean().default(false),
  header: z.string().optional(),
  width: CssDimension.optional(),
  surface: z.enum(['default', 'alt']).default('default'),
}).strict();

export const ContainerSchema = z.object({
  padding: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).optional(),
  maxWidth: CssDimension.optional(),
  centered: z.boolean().default(false),
  width: CssDimension.optional(),
  height: CssDimension.optional(),
  overflow: z.enum(['visible', 'hidden', 'scroll', 'auto']).optional(),
}).strict();

export const TabsSchema = z.object({
  tabs: z.array(z.object({
    id: z.string(),
    label: z.string(),
    icon: z.string().optional(),
  })).min(1),
  active: z.string().optional().describe('ID of the initially active tab'),
  onChange: ActionRef.optional(),
}).strict();

export const AccordionSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    defaultOpen: z.boolean().default(false),
  })).min(1),
  multiple: z.boolean().default(false),
  onChange: ActionRef.optional(),
}).strict();

export const DividerSchema = z.object({
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  spacing: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).default('md'),
  color: z.enum(['default', 'strong']).default('default'),
}).strict();

export const SpacerSchema = z.object({
  size: z.enum(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']).default('md'),
}).strict();

// ─── Content (6) ────────────────────────────────────────────────

export const TextSchema = z.object({
  content: z.string().default(''),
  variant: z.enum(['heading', 'subheading', 'body', 'caption', 'code']).default('body'),
  align: z.enum(['left', 'center', 'right']).optional(),
  weight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
  color: z.enum(['default', 'secondary', 'tertiary', 'primary', 'success', 'warning', 'error', 'info']).optional(),
  truncate: z.boolean().default(false),
  nowrap: z.boolean().default(false),
}).strict();

export const ImageSchema = z.object({
  src: z.string().default(''),
  alt: z.string().default(''),
  fit: z.enum(['cover', 'contain', 'fill', 'none']).default('cover'),
  width: CssDimension.optional(),
  height: CssDimension.optional(),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).default('none'),
  caption: z.string().optional(),
}).strict();

export const IconSchema = z.object({
  name: z.enum([
    'check', 'x', 'plus', 'minus', 'chevron-down', 'chevron-up',
    'chevron-left', 'chevron-right', 'arrow-right', 'arrow-left',
    'search', 'menu', 'close', 'home', 'star', 'heart', 'bell',
    'settings', 'user', 'trash', 'edit', 'copy', 'download',
    'upload', 'link', 'external-link', 'info', 'alert-triangle',
    'check-circle', 'x-circle', 'clock', 'filter', 'sort',
  ]).describe('Built-in icon name'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  color: z.enum(['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info']).default('default'),
}).strict();

export const BadgeSchema = z.object({
  label: z.string().default(''),
  variant: z.enum(['default', 'primary', 'success', 'warning', 'error', 'info']).default('default'),
  size: z.enum(['sm', 'md']).default('md'),
  pill: z.boolean().default(true),
}).strict();

export const AvatarSchema = z.object({
  src: z.string().optional().describe('Image URL (falls back to initials)'),
  initials: z.string().optional().describe('1-2 character fallback'),
  name: z.string().optional().describe('Full name (auto-generates initials)'),
  size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  color: z.enum(['primary', 'success', 'warning', 'error', 'info']).default('primary'),
}).strict();

export const EmptyStateSchema = z.object({
  icon: z.string().optional(),
  title: z.string().default('No data'),
  description: z.string().optional(),
  actionLabel: z.string().optional(),
  onAction: ActionRef.optional(),
}).strict();

// ─── Input (9) ──────────────────────────────────────────────────

export const TextInputSchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().default(''),
  value: z.union([StatePath, z.string()]).default(''),
  type: z.enum(['text', 'email', 'password', 'url', 'tel', 'search']).default('text'),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  readonly: z.boolean().default(false),
  error: z.string().optional(),
  hint: z.string().optional(),
  maxLength: z.number().optional(),
  onChange: ActionRef.optional(),
}).strict();

export const NumberInputSchema = z.object({
  label: z.string().optional(),
  value: z.union([StatePath, z.number()]).default(0),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().default(1),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  error: z.string().optional(),
  hint: z.string().optional(),
  onChange: ActionRef.optional(),
}).strict();

export const SelectSchema = z.object({
  label: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).min(1),
  value: z.union([StatePath, z.string()]).default(''),
  placeholder: z.string().default('Select…'),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  error: z.string().optional(),
  onChange: ActionRef.optional(),
}).strict();

export const MultiSelectSchema = z.object({
  label: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).min(1),
  values: z.union([StatePath, z.array(z.string())]).default([]),
  placeholder: z.string().default('Select…'),
  disabled: z.boolean().default(false),
  error: z.string().optional(),
  onChange: ActionRef.optional(),
}).strict();

export const CheckboxSchema = z.object({
  label: z.string().default(''),
  checked: z.union([StatePath, z.boolean()]).default(false),
  disabled: z.boolean().default(false),
  indeterminate: z.boolean().default(false),
  onChange: ActionRef.optional(),
}).strict();

export const ToggleSchema = z.object({
  label: z.string().default(''),
  checked: z.union([StatePath, z.boolean()]).default(false),
  disabled: z.boolean().default(false),
  onChange: ActionRef.optional(),
}).strict();

export const DatePickerSchema = z.object({
  label: z.string().optional(),
  value: z.union([StatePath, z.string()]).default(''),
  min: z.string().optional(),
  max: z.string().optional(),
  disabled: z.boolean().default(false),
  error: z.string().optional(),
  onChange: ActionRef.optional(),
}).strict();

export const SliderSchema = z.object({
  label: z.string().optional(),
  value: z.union([StatePath, z.number()]).default(50),
  min: z.number().default(0),
  max: z.number().default(100),
  step: z.number().default(1),
  disabled: z.boolean().default(false),
  showValue: z.boolean().default(true),
  onChange: ActionRef.optional(),
}).strict();

export const FileUploadSchema = z.object({
  label: z.string().optional(),
  accept: z.string().optional().describe('MIME types or extensions, e.g. ".png,.jpg"'),
  multiple: z.boolean().default(false),
  disabled: z.boolean().default(false),
  maxSize: z.number().optional().describe('Max file size in bytes'),
  dragDrop: z.boolean().default(true),
  onUpload: ActionRef.optional(),
}).strict();

// ─── Action (3) ─────────────────────────────────────────────────

export const ButtonSchema = z.object({
  label: z.string().default('Button'),
  variant: z.enum(['primary', 'secondary', 'ghost', 'danger']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  icon: z.string().optional(),
  iconRight: z.string().optional(),
  disabled: z.boolean().default(false),
  loading: z.boolean().default(false),
  fullWidth: z.boolean().default(false),
  onClick: ActionRef.optional(),
}).strict();

export const ButtonGroupSchema = z.object({
  buttons: z.array(z.object({
    id: z.string(),
    label: z.string(),
    variant: z.enum(['primary', 'secondary', 'ghost', 'danger']).default('secondary'),
    icon: z.string().optional(),
    disabled: z.boolean().default(false),
    onClick: ActionRef.optional(),
  })).min(1),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  direction: z.enum(['row', 'column']).default('row'),
}).strict();

export const LinkSchema = z.object({
  label: z.string().default(''),
  href: z.string().optional(),
  target: z.enum(['_self', '_blank']).default('_self'),
  icon: z.string().optional(),
  variant: z.enum(['default', 'primary', 'muted']).default('default'),
  disabled: z.boolean().default(false),
  onClick: ActionRef.optional(),
}).strict();

// ─── Data (4) ───────────────────────────────────────────────────

export const TableSchema = z.object({
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    align: z.enum(['left', 'center', 'right']).default('left'),
    width: CssDimension.optional(),
    sortable: z.boolean().default(false),
  })).min(1),
  rows: z.union([StatePath, z.array(z.record(z.unknown()))]).default([]),
  stripe: z.boolean().default(true),
  border: z.boolean().default(false),
  compact: z.boolean().default(false),
  emptyMessage: z.string().default('No data'),
  pageSize: z.number().optional(),
  onPageChange: ActionRef.optional(),
}).strict();

export const ListSchema = z.object({
  items: z.union([StatePath, z.array(z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    icon: z.string().optional(),
    avatar: z.string().optional(),
  }))]).default([]),
  selectable: z.boolean().default(false),
  selected: z.union([StatePath, z.string()]).optional(),
  density: z.enum(['compact', 'normal', 'comfortable']).default('normal'),
  dividers: z.boolean().default(true),
  onSelect: ActionRef.optional(),
}).strict();

export const ChartSchema = z.object({
  type: z.enum(['bar', 'line', 'donut', 'area', 'scatter']),
  data: z.union([StatePath, z.object({
    labels: z.array(z.string()),
    datasets: z.array(z.object({
      label: z.string().optional(),
      values: z.array(z.number()),
      color: z.string().optional(),
    })),
  })]),
  width: CssDimension.default('100%'),
  height: CssDimension.default('200px'),
  showLegend: z.boolean().default(true),
  showValues: z.boolean().default(false),
  title: z.string().optional(),
}).strict();

export const MetricSchema = z.object({
  label: z.string().default(''),
  value: z.union([StatePath, z.union([z.string(), z.number()])]).default('—'),
  trend: z.enum(['up', 'down', 'flat']).optional(),
  trendValue: z.string().optional().describe('E.g. "+12%" or "-3.2"'),
  prefix: z.string().optional().describe('E.g. "$"'),
  suffix: z.string().optional().describe('E.g. "%", " users"'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
}).strict();

// ─── Feedback (4) ───────────────────────────────────────────────

export const AlertSchema = z.object({
  variant: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  title: z.string().optional(),
  message: z.string().default(''),
  dismissible: z.boolean().default(false),
  icon: z.boolean().default(true),
  onDismiss: ActionRef.optional(),
}).strict();

export const DialogSchema = z.object({
  title: z.string().default(''),
  open: z.union([StatePath, z.boolean()]).default(false),
  width: CssDimension.optional(),
  onClose: ActionRef.optional(),
  closeOnOverlay: z.boolean().default(true),
  closeOnEscape: z.boolean().default(true),
}).strict();

export const ProgressSchema = z.object({
  value: z.union([StatePath, z.number()]).default(0),
  max: z.number().default(100),
  label: z.string().optional(),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  variant: z.enum(['default', 'success', 'warning', 'error']).default('default'),
  showValue: z.boolean().default(true),
  indeterminate: z.boolean().default(false),
}).strict();

export const ToastSchema = z.object({
  message: z.string().default(''),
  variant: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  duration: z.number().default(4000).describe('Auto-dismiss in ms, 0 = manual'),
  icon: z.boolean().default(true),
  actionLabel: z.string().optional(),
  onAction: ActionRef.optional(),
}).strict();

// ─── Navigation (2) ─────────────────────────────────────────────

export const BreadcrumbSchema = z.object({
  items: z.array(z.object({
    label: z.string(),
    href: z.string().optional(),
    onClick: ActionRef.optional(),
  })).min(1),
  separator: z.enum(['slash', 'chevron', 'arrow']).default('chevron'),
}).strict();

export const StepperSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).min(1),
  active: z.union([StatePath, z.number()]).default(0),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  linear: z.boolean().default(false),
  onChange: ActionRef.optional(),
}).strict();

// ─── Catalog Type Map ───────────────────────────────────────────

/** Maps component type name → its Zod schema */
export const catalogSchemas = {
  // Layout
  Stack: StackSchema,
  Grid: GridSchema,
  Card: CardSchema,
  Container: ContainerSchema,
  Tabs: TabsSchema,
  Accordion: AccordionSchema,
  Divider: DividerSchema,
  Spacer: SpacerSchema,
  // Content
  Text: TextSchema,
  Image: ImageSchema,
  Icon: IconSchema,
  Badge: BadgeSchema,
  Avatar: AvatarSchema,
  EmptyState: EmptyStateSchema,
  // Input
  TextInput: TextInputSchema,
  NumberInput: NumberInputSchema,
  Select: SelectSchema,
  MultiSelect: MultiSelectSchema,
  Checkbox: CheckboxSchema,
  Toggle: ToggleSchema,
  DatePicker: DatePickerSchema,
  Slider: SliderSchema,
  FileUpload: FileUploadSchema,
  // Action
  Button: ButtonSchema,
  ButtonGroup: ButtonGroupSchema,
  Link: LinkSchema,
  // Data
  Table: TableSchema,
  List: ListSchema,
  Chart: ChartSchema,
  Metric: MetricSchema,
  // Feedback
  Alert: AlertSchema,
  Dialog: DialogSchema,
  Progress: ProgressSchema,
  Toast: ToastSchema,
  // Navigation
  Breadcrumb: BreadcrumbSchema,
  Stepper: StepperSchema,
} as const;

/** Type mapping: component name → inferred props type */
export type CatalogProps = {
  [K in keyof typeof catalogSchemas]: z.infer<(typeof catalogSchemas)[K]>;
};

/** Validate component props against its schema */
export function validateProps<T extends keyof typeof catalogSchemas>(
  type: T,
  props: unknown,
): { success: true; data: CatalogProps[T] } | { success: false; errors: z.ZodError } {
  const schema = catalogSchemas[type];
  const result = schema.safeParse(props);
  if (result.success) {
    return { success: true, data: result.data as CatalogProps[T] };
  }
  return { success: false, errors: result.error };
}
