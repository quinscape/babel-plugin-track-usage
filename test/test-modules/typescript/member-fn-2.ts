import { thing, nonvar } from "./service/lookup"

const a = 123;
const b: number = thing('Bar');
const c: number = thing('Present', 3);
const d: number = nonvar('A');

