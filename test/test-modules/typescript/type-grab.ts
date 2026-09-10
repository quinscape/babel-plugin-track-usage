//noinspection JSFileReferences,JSAnnotator
import {multiIdent, multiMember} from './service/multi';
//noinspection JSFileReferences,JSAnnotator
import MyIdent from './service/Identifier';

function getIdent() : any
{
    return MyIdent;
}

const a = multiMember( MyIdent.aaa , { value: "abc"});
const b = multiMember( MyIdent.aaa.aaa , { value: "deep"});
const c = multiMember( MyIdent?.aaa , { value: "optional"});
const d = multiMember( MyIdent!.aaa , { value: "nonNull"});
const e = multiMember( MyIdent!.aaa?.aaa , { value: "mixed"});
const f = multiMember( { nested: MyIdent.aaa } , [ MyIdent.aaa.aaa ]);

// not statically analyzable -> not recorded
const g = multiMember( MyIdent["aaa"] , { value: "computed"});
const h = multiMember( getIdent().aaa , { value: "call"});

// allowMemberExpressions does not imply allowIdentifier
const i = multiMember( MyIdent , { value: "bare"});

// .. and allowIdentifier does not imply allowMemberExpressions
const j = multiIdent( MyIdent.aaa , { value: "identOnly"});
