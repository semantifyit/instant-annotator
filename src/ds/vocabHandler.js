import sdoAdapter from "./sdoAdapter";
import { memoizeCb } from "../util";

// vvv from semantify-core/public/domainspecifications/assets/vocabularyHandler.js


//helper function to determine used vocabularies and versions of the given DS
function analyzeDSVocabularies(ds) {
    let vocabularies = [];
    if (ds && ds["@graph"] && ds["@graph"][0] && ds["@graph"][0]["schema:schemaVersion"]) {
        vocabularies.push(ds["@graph"][0]["schema:schemaVersion"]);
    }
    if (ds && ds["@context"]) {
        let contextKeys = Object.keys(ds["@context"]);
        let standardContextIdentifiers = ["rdf", "rdfs", "sh", "xsd", "schema", "sh:targetClass", "sh:property", "sh:path", "sh:nodeKind", "sh:datatype", "sh:node", "sh:class", "sh:or", "sh:in"];
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
    for (let i = 0; i < vocabulariesArray.length; i++) {
        if (vocabulariesArray[i].indexOf("schema.org") !== -1) {
            result.push("https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/" + getSDOVersion(vocabulariesArray[i]) + "/all-layers.jsonld");
        } else if (vocabulariesArray[i].indexOf("dachkg.org") !== -1) {
            let dachVocabURL = "https://raw.githubusercontent.com/STIInnsbruck/dachkg-schema/master/schema/dachkg_schema.json";
            result.push(dachVocabURL);
        }
    }
    return result;
}

//helper function to retrieve the SDO version used in a DS
function getSDOVersion(domainSpecification) {
    let versionRegex = /.*schema\.org\/version\/([0-9\.]+)\//g;
    let match = versionRegex.exec(domainSpecification);
    return parseFloat(match[1]);
}

// ^^^ from semantify-core/public/domainspecifications/assets/vocabularyHandler.js

const getSdoHandlerSingle = (ds, cb) => {
    const sdoAdapt = new sdoAdapter();
    const vocabs = getVocabURLForIRIs(analyzeDSVocabularies(ds));
    sdoAdapt.addVocabularies(vocabs, () => cb(sdoAdapt));
};

const getSdoHandler = memoizeCb(getSdoHandlerSingle);


export {
    getSdoHandler,
}