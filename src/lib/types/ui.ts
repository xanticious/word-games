/**
 * Common UI component props
 */
export interface BaseComponentProps {
	class?: string;
	id?: string;
	'data-testid'?: string;
}

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
	size?: 'small' | 'medium' | 'large';
	disabled?: boolean;
	loading?: boolean;
	onclick?: () => void;
	children: any; // Svelte snippet
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
	open: boolean;
	title?: string;
	onclose?: () => void;
	children: any; // Svelte snippet
}

/**
 * Toast notification
 */
export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message?: string;
	duration?: number; // milliseconds, 0 for persistent
	timestamp: number;
}

/**
 * Navigation item
 */
export interface NavItem {
	id: string;
	label: string;
	icon?: string;
	route?: string;
	onclick?: () => void;
	active?: boolean;
	disabled?: boolean;
}

/**
 * Form field validation
 */
export interface ValidationRule {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	custom?: (value: any) => boolean | string;
}

/**
 * Form field state
 */
export interface FieldState {
	value: any;
	touched: boolean;
	dirty: boolean;
	valid: boolean;
	errors: string[];
}
