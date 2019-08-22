import { removeNS, stripHtml } from "./util";

function getDesc(sdoAdapter, propertyName, fullPath) {
    try {
        return `${fullPath}:\n${stripHtml(sdoAdapter.getProperty(propertyName).getDescription())}`;
    } catch (e) {
        return fullPath;
    }
}

function getAllSubClasses(sdoAdapter, base) {
    try {
        return sdoAdapter.getClass(base).getSubClasses().map(c => removeNS(c));
    } catch (e) {
        return [base];
    }
}

export {
    getDesc,
    getAllSubClasses,
}