//noinspection JSFileReferences,JSAnnotator
import { multiIdent, multiMember } from './service/multi';
//noinspection JSFileReferences,JSAnnotator
import MyIdent from './service/Identifier';

function getIdent()
{
    return MyIdent;
}

const a = multiMember( MyIdent.aaa , { value: "abc"});
const b = multiMember( MyIdent.aaa.aaa , { value: "deep"});
const c = multiMember( MyIdent?.aaa , { value: "optional"});
const d = multiMember( { nested: MyIdent.aaa } , [ MyIdent.aaa.aaa ]);

// not statically analyzable -> not recorded
const e = multiMember( MyIdent["aaa"] , { value: "computed"});
const f = multiMember( getIdent().aaa , { value: "call"});

// allowMemberExpressions does not imply allowIdentifier
const g = multiMember( MyIdent , { value: "bare"});

// .. and allowIdentifier does not imply allowMemberExpressions
const h = multiIdent( MyIdent.aaa , { value: "identOnly"});
