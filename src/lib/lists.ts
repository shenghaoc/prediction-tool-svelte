// Constants and static data for prediction tool
// Use these for dropdowns, validation, and API calls

// ML Model options
export const ML_MODELS = [
	'Support Vector Regression',
	'Ridge Regression'
] as const;
export type MLModel = typeof ML_MODELS[number];

// HDB Towns
export const TOWNS = [
	'ANG MO KIO',
	'BEDOK',
	'BISHAN',
	'BUKIT BATOK',
	'BUKIT MERAH',
	'BUKIT PANJANG',
	'BUKIT TIMAH',
	'CENTRAL AREA',
	'CHOA CHU KANG',
	'CLEMENTI',
	'GEYLANG',
	'HOUGANG',
	'JURONG EAST',
	'JURONG WEST',
	'KALLANG/WHAMPOA',
	'MARINE PARADE',
	'PASIR RIS',
	'PUNGGOL',
	'QUEENSTOWN',
	'SEMBAWANG',
	'SENGKANG',
	'SERANGOON',
	'TAMPINES',
	'TOA PAYOH',
	'WOODLANDS',
	'YISHUN'
] as const;
export type Town = typeof TOWNS[number];

// Storey ranges
export const STOREY_RANGES = [
	'01 TO 03',
	'04 TO 06',
	'07 TO 09',
	'10 TO 12',
	'13 TO 15',
	'16 TO 18',
	'19 TO 21',
	'22 TO 24',
	'25 TO 27',
	'28 TO 30',
	'31 TO 33',
	'34 TO 36',
	'37 TO 39',
	'40 TO 42',
	'43 TO 45',
	'46 TO 48',
	'49 TO 51'
] as const;
export type StoreyRange = typeof STOREY_RANGES[number];

// Flat models
export const FLAT_MODELS = [
	'2-room',
	'Adjoined flat',
	'Apartment',
	'DBSS',
	'Improved',
	'Improved-Maisonette',
	'Maisonette',
	'Model A',
	'Model A-Maisonette',
	'Model A2',
	'Multi Generation',
	'New Generation',
	'Premium Apartment',
	'Premium Apartment Loft',
	'Premium Maisonette',
	'Simplified',
	'Standard',
	'Terrace',
	'Type S1',
	'Type S2'
] as const;
export type FlatModel = typeof FLAT_MODELS[number];

// Available months for predictions
export const MONTHS = [
	'2017-01', '2017-02', '2017-03', '2017-04', '2017-05', '2017-06',
	'2017-07', '2017-08', '2017-09', '2017-10', '2017-11', '2017-12',
	'2018-01', '2018-02', '2018-03', '2018-04', '2018-05', '2018-06',
	'2018-07', '2018-08', '2018-09', '2018-10', '2018-11', '2018-12',
	'2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06',
	'2019-07', '2019-08', '2019-09', '2019-10', '2019-11', '2019-12',
	'2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06',
	'2020-07', '2020-08', '2020-09', '2020-10', '2020-11', '2020-12',
	'2021-01', '2021-02', '2021-03', '2021-04', '2021-05', '2021-06',
	'2021-07', '2021-08', '2021-09', '2021-10', '2021-11', '2021-12',
	'2022-01', '2022-02'
] as const;
export type Month = typeof MONTHS[number];