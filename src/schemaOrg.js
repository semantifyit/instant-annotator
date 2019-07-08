import {clone, httpGet, unique, stripHtml} from "./util";

let sdoProperties;
let sdoClasses;

function getPropertiesJson() {
    httpGet("https://semantify.it/assets/data/latest/sdo_properties.json", function (data) {
        sdoProperties = data;
    });
}

function getClassesJson() {
    httpGet("https://semantify.it/assets/data/latest/sdo_classes.json", function (data) {
        sdoClasses = data;
    });
}

function loadSchemaFiles() {
    getPropertiesJson();
    getClassesJson();
}

function getDesc(propertyName, fullPath) {
    if(sdoProperties[propertyName]){
        return stripHtml(fullPath+':\n'+sdoProperties[propertyName]["description"]);
    }else{
        return stripHtml(fullPath+':\n'+'Sorry, no description available!');
    }
}

function getAllSubClasses(base) {
    if(!sdoClasses[base]){
        return base;
    }
    var subClasses = clone(sdoClasses[base].subClasses);
    subClasses.forEach(function (c) {
        subClasses = subClasses.concat(getAllSubClasses(c));
    });
    subClasses.push(base);
    return unique(subClasses);
}

function schemaFilesReady(){
    return sdoProperties && sdoClasses;
}

export {
    loadSchemaFiles,
    schemaFilesReady,
    getDesc,
    getAllSubClasses,
}