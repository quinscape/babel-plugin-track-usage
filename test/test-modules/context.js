// noinspection JSFileReferences
import { contextTarget, arrayContextTarget, objectContextTarget } from './service/contextTarget';

let bbb;
const aaa = contextTarget("PARAMS", 12)
bbb = arrayContextTarget("PARAMS", 34)
const ccc = arrayContextTarget("PARAMS", 35)

export default function Home({ foos = objectContextTarget("PARAMS", 56) })
{

}

