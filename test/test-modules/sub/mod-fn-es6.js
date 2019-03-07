//noinspection JSFileReferences,JSAnnotator
import moduleFn from '../service/moduleFn';
//noinspection JSFileReferences,JSAnnotator
import nonvar from '../service/nonVarMod';
var a = 123;
var b = moduleFn('Foo');
var c = nonvar('A');
var e = moduleFn('NotIgnored', 2);
