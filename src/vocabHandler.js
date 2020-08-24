import SdoAdapter from "schema-org-adapter";
import { memoizeCb } from "./util";

// vvv from semantify-core/public/domainspecifications/assets/vocabularyHandler.js

function getVocabURLForDS(ds, cb) {
    let vocabs = [];
    if (ds && ds["@graph"][0] && Array.isArray(ds["@graph"][0]["ds:usedVocabularies"])) {
        vocabs = JSON.parse(JSON.stringify(ds["@graph"][0]["ds:usedVocabularies"]));
    }
    if (ds && ds["@graph"][0] && ds["@graph"][0]["schema:schemaVersion"]) {
        getSchemaSdoHandlerMem((sdoAdapter) => {
            sdoAdapter.constructSDOVocabularyURL(getSDOVersion(ds["@graph"][0]["schema:schemaVersion"]))
                .then((vocab) => {
                    vocabs.push(vocab);
                    cb(vocabs);
                })
        })
    } else {
        cb(vocabs)
    }
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
    getVocabURLForDS(ds, (vocabs) => {
        getSdoHandlerMem(vocabs, cb);
    });
};

const getSchemaSdoHandler = (cb) => {
    const sdoAdapter = new SdoAdapter();
    sdoAdapter.constructSDOVocabularyURL('latest')
        .then((sdoUrl) =>
            sdoAdapter.addVocabularies([sdoUrl])
        ).then(() => cb(sdoAdapter))
};

const getSchemaSdoHandlerMem = memoizeCb(getSchemaSdoHandler);

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
