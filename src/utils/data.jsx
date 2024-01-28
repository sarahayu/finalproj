import { dataFilter } from './utils';

export const data = dataFilter(
  await (await fetch('./src/assets/combine_hex_5_6_100.json')).json(),
  (d) => d.DemandBaseline
);
