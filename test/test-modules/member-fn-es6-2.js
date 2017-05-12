//noinspection JSAnnotator
import { thing } from './service/lookup';
//noinspection JSAnnotator
import { nonvar } from './service/lookup';
var a = 123;
var b = thing('Bar');
var c = thing('Present', 3);
var d = nonvar('A');
var e = nonvar('Ignored', 4);

