import lookup from "./service/lookup"

const a: number = 123;
const b: number = lookup.thing('Bar');
const c: number = lookup.thing('Present', 3);
const d: number = lookup.nonvar('A');

