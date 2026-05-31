import type { TrendPoint } from '$lib/prediction';

export type PredictionActionMessage =
	| {
			type: 'success';
			trendData: TrendPoint[];
			output: number;
	  }
	| {
			type: 'error';
			text: string;
	  };
