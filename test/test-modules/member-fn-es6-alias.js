//noinspection JSAnnotator
import { thing as th } from './service/lookup';
//noinspection JSAnnotator
import { nonvar as nv } from './service/lookup';
var a = 123;
var b = th('Bar');
var c = th('Present', 3);
var d = nv('A');
var e = nv('Ignored', 4);

