import sdoAdapter from "./sdoAdapter";
import { memoizeCb } from "../util";
import { semantifyUrl } from '../globals';

// vvv from semantify-core/public/domainspecifications/assets/vocabularyHandler.js


//helper function to determine used vocabularies and versions of the given DS
function analyzeDSVocabularies(ds) {
    let vocabularies = [];
    if (ds && ds["@graph"] && ds["@graph"][0] && ds["@graph"][0]["schema:schemaVersion"]) {
        vocabularies.push(ds["@graph"][0]["schema:schemaVersion"]);
    }
    if (ds && ds["@context"]) {
        let contextKeys = Object.keys(ds["@context"]);
        let standardContextIdentifiers = ["rdf", "rdfs", "sh", "xsd", "schema", "sh:targetClass", "sh:property", "sh:path", "sh:nodeKind", "sh:datatype", "sh:node", "sh:class", "sh:or", "sh:in", "sh:languageIn", "sh:equals", "sh:disjoint", "sh:lessThan", "sh:lessThanOrEquals"];
        for (let i = 0; i < contextKeys.length; i++) {
            if (standardContextIdentifiers.indexOf(contextKeys[i]) === -1) {
                vocabularies.push(ds["@context"][contextKeys[i]]);
            }
        }
    }
    return vocabularies;
}

//constructs the URL for given vocabulary IRIs
function getVocabURLForIRIs(vocabulariesArray) {
    let result = [];
    let semantifyApiVocab = semantifyUrl + "/api/vocabulary/namespace/";
    for (let i = 0; i < vocabulariesArray.length; i++) {
        if (vocabulariesArray[i].indexOf("schema.org") !== -1) {
            result.push("https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/" + getSDOVersion(vocabulariesArray[i]) + "/all-layers.jsonld");
        } else if (vocabulariesArray[i].indexOf("dachkg.org") !== -1) {
            result.push(semantifyApiVocab + encodeURIComponent(vocabulariesArray[i]));
        }
    }
    return result;
}

//helper function to retrieve the SDO version used in a DS
function getSDOVersion(domainSpecification) {
    let versionRegex = /.*schema\.org\/version\/([0-9\.]+)\//g;
    let match = versionRegex.exec(domainSpecification);
    return match[1];
}

// ^^^ from semantify-core/public/domainspecifications/assets/vocabularyHandler.js

const getSdoHandlerSingle = (vocabs, cb) => {
    const sdoAdapt = new sdoAdapter();
    sdoAdapt.addVocabularies(vocabs, () => cb(sdoAdapt));
};

const getSdoHandlerMem = memoizeCb(getSdoHandlerSingle);

const getSdoHandler = (ds, cb) => {
    const vocabs = getVocabURLForIRIs(analyzeDSVocabularies(ds));
    getSdoHandlerMem(vocabs, cb);
};

const getSchemaSdoHandler = (cb) => {
    const sdoAdapt = new sdoAdapter();
    sdoAdapt.addVocabularies(["https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/5.0/all-layers.jsonld"], () => cb(sdoAdapt));
};


export {
    getSdoHandler,
    getSchemaSdoHandler
}