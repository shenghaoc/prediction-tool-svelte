export const ML_MODELS = ['linear_regression', 'random_forest', 'xgboost'] as const;
export type MLModel = (typeof ML_MODELS)[number];

export const TOWNS = ['ANG MO KIO', 'BEDOK', 'BISHAN'] as const;
export type Town = (typeof TOWNS)[number];

export const STOREY_RANGES = ['01 TO 03', '04 TO 06', '07 TO 09'] as const;
export type StoreyRange = (typeof STOREY_RANGES)[number];

export const FLAT_MODELS = ['2 ROOM', '3 ROOM', '4 ROOM'] as const;
export type FlatModel = (typeof FLAT_MODELS)[number];
