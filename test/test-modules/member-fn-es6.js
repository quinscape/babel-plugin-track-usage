//noinspection JSFileReferences
import lookup from './service/lookup';
var a = 123;
var b = lookup.thing('Bar');
var c = lookup.thing('Present', 3);
var d = lookup.nonvar('A');

