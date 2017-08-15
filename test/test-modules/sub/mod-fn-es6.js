//noinspection JSAnnotator
import moduleFn from '../service/moduleFn';
//noinspection JSAnnotator
import nonvar from '../service/nonVarMod';
var a = 123;
var b = moduleFn('Foo');
var c = nonvar('A');
var d = nonvar('Ignored', 1);
var e = moduleFn('NotIgnored', 2);
