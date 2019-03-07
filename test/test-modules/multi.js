//noinspection JSFileReferences
import multi, { multiVar } from './service/multi';
//noinspection JSFileReferences
import { multiVar2 } from './service/multi2';

const b = multi('Foo', 1);
const c = multi('Bar', "xxx", 2);
const d = multi('Baz', { baz: 3, "name": "Bazi", obj: { complex: true} });
const e = multiVar('Qux', 'Quux', 4);
const f = multiVar2('Bla', 'Fasel', 5);
const g = multiVar2('Ignored',  'Not Literal' + 5);
