//noinspection JSFileReferences,JSAnnotator
import moduleFn from './service/moduleFn';
//noinspection JSFileReferences,JSAnnotator
import nonvar from './service/nonVarMod';


const a = 123
const b = moduleFn("Foo")
const c = nonvar("A")
const d = moduleFn("NotIgnored", 2)
const e = nonvar("A", "B")
