import SdoAdapter from "schema-org-adapter";
import { memoizeCb } from "./util";

// vvv from semantify-core/public/domainspecifications/assets/vocabularyHandler.js

function getVocabURLForDS(ds) {
    let vocabs = [];
    if (ds && ds["@graph"][0] && Array.isArray(ds["@graph"][0]["ds:usedVocabularies"])) {
        vocabs = JSON.parse(JSON.stringify(ds["@graph"][0]["ds:usedVocabularies"]));
    }
    if (ds && ds["@graph"][0] && ds["@graph"][0]["schema:schemaVersion"]) {
        vocabs.push("https://raw.githubusercontent.com/schemaorg/schemaorg/main/data/releases/" + getSDOVersion(ds["@graph"][0]["schema:schemaVersion"]) + "/all-layers.jsonld");
    }
    return vocabs;
}

//helper function to retrieve the SDO version used in a DS
function getSDOVersion(domainSpecification) {
    let versionRegex = /.*schema\.org\/version\/([0-9\.]+)\//g;
    let match = versionRegex.exec(domainSpecification);
    return match[1];
}

// ^^^ from semantify-core/public/domainspecifications/assets/vocabularyHandler.js

const getSdoHandlerSingle = (vocabs, cb) => {
    const sdoAdapt = new SdoAdapter();
    sdoAdapt.addVocabularies(vocabs).then(() => cb(sdoAdapt));
};

const getSdoHandlerMem = memoizeCb(getSdoHandlerSingle);

const getSdoHandler = (ds, cb) => {
    const vocabs = getVocabURLForDS(ds);
    getSdoHandlerMem(vocabs, cb);
};

const getSchemaSdoHandler = (cb) => {
    const sdoAdapter = new SdoAdapter();
    sdoAdapter.constructSDOVocabularyURL('latest', 'all-layers')
        .then((sdoUrl) =>
            sdoAdapter.addVocabularies([sdoUrl])
        ).then(() => cb(sdoAdapter))
};

const getEnumMembers = (sdoAdapter, enumId) => {
    try {
        const enumInst = sdoAdapter.getEnumeration(enumId);
        return enumInst.getEnumerationMembers();
    } catch(e){
        return undefined;
    }
};


export {
    getSdoHandler,
    getSchemaSdoHandler,
    getEnumMembers
}
