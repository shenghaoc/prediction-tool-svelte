import { writable } from 'svelte/store';

export const lang = writable<'en' | 'zh'>(typeof window !== 'undefined' ? (localStorage.getItem('lang') as 'en' | 'zh') || 'en' : 'en');

const en = {
  price_prediction: 'HDB Price Prediction',
  prediction_form: 'Prediction Form',
  ml_model: 'ML Model',
  select_ml_model: 'Select model',
  town: 'Town',
  select_town: 'Select town',
  storey_range: 'Storey range',
  flat_model: 'Flat model',
  floor_area: 'Floor area (sqm)',
  lease_commence_date: 'Lease commence year',
  get_prediction: 'Get prediction',
  reset_form: 'Reset',
  predicted_price: 'Predicted Price'
};

const zh = {
  price_prediction: '组屋价格预测',
  prediction_form: '预测表单',
  ml_model: '模型',
  select_ml_model: '选择模型',
  town: '地点',
  select_town: '选择地点',
  storey_range: '楼层范围',
  flat_model: '单位类型',
  floor_area: '面积 (平方米)',
  lease_commence_date: '建屋年份',
  get_prediction: '预测',
  reset_form: '重置',
  predicted_price: '预测价格'
};

export function t(key: keyof typeof en, l: 'en' | 'zh') {
  return l === 'en' ? en[key] : zh[key];
}
