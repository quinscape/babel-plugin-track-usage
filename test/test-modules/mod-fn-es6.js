//noinspection JSFileReferences,JSAnnotator
import moduleFn from './service/moduleFn';
//noinspection JSFileReferences,JSAnnotator
import nonvar from './service/nonVarMod';
var a = 123;
var b = moduleFn('Foo');
var c = nonvar('A');
var d = moduleFn('NotIgnored', 2);
var e = nonvar('A', 'B');
