//noinspection JSFileReferences,JSAnnotator
import lookup from './service/lookup';


const a = 123
const b = lookup.thing("Bar")
const c = lookup.thing("Present", 3)
const d = lookup.nonvar("A")

