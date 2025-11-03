//noinspection JSFileReferences,JSAnnotator
import { thing as th } from './service/lookup';
//noinspection JSFileReferences,JSAnnotator
import { nonvar as nv } from './service/lookup';


const a : number = 123
const b: number = th("Bar")
const c: number = th("Present", 3)
const d: number = nv("A")

