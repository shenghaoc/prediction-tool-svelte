import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

import { normalizePrice, normalizeTrendData } from '$lib/prediction';
import type { PredictionActionMessage } from '$lib/prediction-action';
import { predictionDefaults, predictionSchema } from '$lib/prediction-schema';
import { e2ePredictionMessage } from '$lib/server/e2e-prediction-mock';
import { queryPredictions } from '$lib/server/prediction-query';

export type { PredictionActionMessage } from '$lib/prediction-action';

const adapter = zod4(predictionSchema);

export const load: PageServerLoad = async () => {
	const form = await superValidate(predictionDefaults, adapter);
	return { form };
};

export const actions: Actions = {
	predict: async ({ request, platform }) => {
		const form = await superValidate(request, adapter);

		if (!form.valid) {
			return fail(400, { form });
		}

		const e2eMode = request.headers.get('x-e2e-mock') ?? platform?.env?.MOCK_PREDICTIONS;
		if (e2eMode) {
			const e2eMessage = e2ePredictionMessage(e2eMode);
			if (e2eMessage) {
				if (e2eMessage.type === 'error') {
					return message(form, e2eMessage, { status: 500 });
				}
				return message(form, e2eMessage);
			}
		}

		const db = platform?.env?.DB;
		if (!db) {
			return message(
				form,
				{
					type: 'error',
					text: 'Prediction service unavailable.'
				} satisfies PredictionActionMessage,
				{ status: 500 }
			);
		}

		try {
			const result = await queryPredictions(db, form.data);
			const trendData = normalizeTrendData(result);

			if (trendData.length === 0 || !trendData.some((point) => point.value > 0)) {
				return message(
					form,
					{
						type: 'error',
						text: 'error_invalid_prediction'
					} satisfies PredictionActionMessage,
					{ status: 422 }
				);
			}

			const output = normalizePrice(trendData[trendData.length - 1]?.value ?? 0);

			return message(form, {
				type: 'success',
				trendData,
				output
			} satisfies PredictionActionMessage);
		} catch (error) {
			const text =
				error instanceof Error && error.message ? error.message : 'Prediction service unavailable.';

			return message(form, { type: 'error', text } satisfies PredictionActionMessage, {
				status: 500
			});
		}
	}
};
