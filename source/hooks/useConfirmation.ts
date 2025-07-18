import {useState, useCallback} from 'react';

export interface ConfirmationConfig {
	width?: number;
	borderColor?: string;
	paddingX?: number;
	paddingY?: number;
	loadingText?: string;
}

export interface ConfirmationState {
	isVisible: boolean;
	isLoading: boolean;
	config: ConfirmationConfig;
	onConfirm: ((confirmed: boolean) => void) | null;
}

export interface ConfirmationActions {
	show: (config?: ConfirmationConfig) => Promise<boolean>;
	hide: () => void;
	setLoading: (loading: boolean) => void;
	handleConfirm: (confirmed: boolean) => void;
}

export function useConfirmation(): ConfirmationState & ConfirmationActions {
	const [state, setState] = useState<ConfirmationState>({
		isVisible: false,
		isLoading: false,
		config: {},
		onConfirm: null,
	});

	const show = useCallback(
		(config: ConfirmationConfig = {}): Promise<boolean> => {
			return new Promise<boolean>(resolve => {
				setState({
					isVisible: true,
					isLoading: false,
					config,
					onConfirm: resolve,
				});
			});
		},
		[],
	);

	const hide = useCallback(() => {
		setState({
			isVisible: false,
			isLoading: false,
			config: {},
			onConfirm: null,
		});
	}, []);

	const setLoading = useCallback((loading: boolean) => {
		setState(prev => ({
			...prev,
			isLoading: loading,
		}));
	}, []);

	const handleConfirm = useCallback(
		(confirmed: boolean) => {
			if (state.onConfirm) {
				state.onConfirm(confirmed);
			}
			hide();
		},
		[state.onConfirm, hide],
	);

	return {
		...state,
		show,
		hide,
		setLoading,
		handleConfirm,
	};
}
