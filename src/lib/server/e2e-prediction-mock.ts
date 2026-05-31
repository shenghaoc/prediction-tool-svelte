import { normalizePrice, normalizeTrendData } from '$lib/prediction';
import type { PredictionActionMessage } from '$lib/prediction-action';

const mockApiPayload = {
	predictions: [
		{ month: '2021-02', predictedPrice: 580000 },
		{ month: '2021-03', predictedPrice: 586000 },
		{ month: '2021-04', predictedPrice: 592000 },
		{ month: '2021-05', predictedPrice: 599000 },
		{ month: '2021-06', predictedPrice: 603000 },
		{ month: '2021-07', predictedPrice: 610000 },
		{ month: '2021-08', predictedPrice: 616000 },
		{ month: '2021-09', predictedPrice: 621000 },
		{ month: '2021-10', predictedPrice: 628000 },
		{ month: '2021-11', predictedPrice: 634000 },
		{ month: '2021-12', predictedPrice: 641000 },
		{ month: '2022-01', predictedPrice: 647000 },
		{ month: '2022-02', predictedPrice: 654321 }
	]
};

export function e2ePredictionMessage(mode: string): PredictionActionMessage | null {
	switch (mode) {
		case 'success': {
			const trendData = normalizeTrendData(mockApiPayload);
			return {
				type: 'success',
				trendData,
				output: normalizePrice(trendData[trendData.length - 1]?.value ?? 0)
			};
		}
		case 'error_500':
			return { type: 'error', text: 'Prediction service unavailable.' };
		case 'error_invalid':
			return { type: 'error', text: 'error_invalid_prediction' };
		case 'error_text':
			return { type: 'error', text: 'Bad Gateway' };
		default:
			return null;
	}
}
