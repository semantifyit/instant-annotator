import $ from 'jquery';
import 'moment';
import 'snackbarjs';
import 'eonasdan-bootstrap-datetimepicker';
import 'bootstrap';

import * as Util from "./util";
import { loadSchemaFiles, schemaFilesReady, getAllSubClasses, getDesc } from "./schemaOrg";
import { parseButtons } from "./buttons";
import { semantifyUrl } from "./globals";

const { httpGet, removeNS, unique, containsArray, syntaxHighlight, flatten, set, htmlList, send_snackbarMSG } = Util;

loadSchemaFiles();

let panelRoots = [];
let typeList = [];
let inputFields = [];

function getDefaultOptions() {
    return {
        buttons: 'default',
        title: undefined,
        panelColClass: "col-lg-3 col-md-4 col-sm-6 col-xs-12",
        withSubClassSelection: true,
        annotation: undefined,
        smtfyAnnotationUID: undefined,
        smtfySemantifyWebsiteUID: "Hkqtxgmkz", // default website
        smtfySemantifyWebsiteSecret: "ef0a64008d0490fc4764c2431ca4797b",
    };
}

let panelCounter = 0;

function newPanelId() {
    return 'Panel' + panelCounter++;
}

const dsCache = {};
function getDomainSpecification(dsId, isDsHash, cb) {
    if(dsCache[dsId] && dsCache[dsId].ready) {
        cb(dsCache[dsId].data);
    } else if (dsCache[dsId] && !dsCache[dsId].ready) {
        setTimeout(function() { getDomainSpecification(dsId, isDsHash, cb) }, 50);
    } else {
        dsCache[dsId] = { ready: false, data: null };
        const url = `${semantifyUrl}/api/domainSpecification/${isDsHash ? 'hash/': ''}${dsId}`;
        httpGet(url, function (ds) {
            if(!ds) {
                throw new Error("Ds with hash/id '" + dsId + "'does not exist");
            }
            ds["hash"] = isDsHash ? dsId: null;
            dsCache[dsId].ready = true;
            dsCache[dsId].data = ds;
            cb(ds);
        });
    }
}


function createIABox(...args){
    if(!schemaFilesReady()) {
        setTimeout(function () {
            createIABox(...args);
        }, 50);
        return;
    }
    addBox(...args);
}


function addBox(htmlId, ds, options, cb) {
    let $ele = $('#' + htmlId);
    if(!$ele) {
        throw new Error("Cannot find div with id " + htmlId);
    }

    const iaBox = {
        panelId: newPanelId(),
    };

    $ele.append(
        '<div id="loading' + iaBox.panelId + '" class="col-lg-3 col-md-4 col-sm-6 text-center" style="margin: 10px; padding: 10px; background: white; border-radius: 10px;">' +
        '<img src="' + semantifyUrl + '/images/loading.gif">' +
        '</div>'
    );

    const mergedOptions = Object.assign(getDefaultOptions(), options); // can use newObj = jQuery.extend(true, { }, oldObject); for deep cloning if Object.assign isn't enough
    mergedOptions.buttons = parseButtons(mergedOptions.buttons);

    if(ds) {
        if(typeof ds === 'string') {
            //dsHash
            getDomainSpecification(ds, true,function (ds) {
                generateBox(iaBox, $ele, ds, mergedOptions, cb);
            });
        } else if(ds.dsId) {
            getDomainSpecification(ds.dsId, false,function (ds) {
                generateBox(iaBox, $ele, ds, mergedOptions, cb);
            });
        } else {
            throw new Error('Either provide ds as string or {dsId: "yourdsid"}');
        }

    } else {
        generateBox(iaBox, $ele, undefined, mergedOptions, cb);
    }

}

function generateBox(iaBox, $jqueryElement, ds, options, cb){
    let myPanelId = iaBox.panelId;
    $('#loading' + myPanelId).hide();

    var curDs = ds && ds['content']["@graph"][0];
    var displayTitle = (options && options.title ? options.title : (curDs === undefined ? "Domainspecification not found" : curDs["schema:name"]));
    var dsName = displayTitle;
    var footer = (options && options.buttons && options.buttons.length > 0 ? '<div class="panel-footer text-center" id="panel-footer-' + myPanelId + '"></div>' : '');      //only display footer if there are some buttons
    $jqueryElement.append(
        '<div class="' + options.panelColClass + '" id="panel-' + myPanelId + '">' +
        '<div class="panel panel-info ">' +
        '<div class="panel-heading sti-red"> ' +
        '<h3>' + displayTitle + '</h3>' +
        '</div> ' +
        '<div class="panel-body" id="panel-body-' + myPanelId + '">' +
        '</div>' +
        footer +
        '</div>' +
        '</div>');

    if (ds) {
        var dsType;
        if(Array.isArray(curDs["sh:targetClass"])){
            dsType = [];
            for (var i of curDs["sh:targetClass"]){
                dsType.push(removeNS(i));
            }
        }else{
            dsType = removeNS(curDs["sh:targetClass"]);
        }
        var t = {
            "panelId": myPanelId,
            "name": dsName,
            "root": dsType
        };

        panelRoots.push(t);
        var dsProps = curDs["sh:property"];
        var req_props = [];
        var opt_props = [];
        var props = getProps(dsProps, "", dsType, myPanelId, false);

        for (var prop of props) {
            if (!prop["isOptional"] && !prop["rootIsOptional"]) {
                req_props.push(prop)
            } else {
                opt_props.push(prop)
            }
        }

        for (var p of req_props){
            insertInputField(myPanelId, p["name"], getDesc(p["simpleName"],p["name"]), p["type"], p["enums"], "#panel-body-", p["isOptional"], p["rootIsOptional"], p["multipleValuesAllowed"])
        }
        if (opt_props.length > 0) {
            $('#' + 'panel-body-' + myPanelId)
                .append('<button type="button" class="btn btn-block btn-default text-left" id="panel-body-opt-btn-' + myPanelId + '" style="background-color: lightgrey;">Optional<span class="caret"></button>')
                .append('<div id="panel-body-opt-' + myPanelId + '"> </div>');

            // this is because if you call onclick it would use the last recent panelId and not the current one
            (function (arg) {
                $('#' + 'panel-body-opt-btn-' + arg).click(function () {
                    var optionalContainer = $('#panel-body-opt-' + arg);
                    if (optionalContainer.css('display') === 'none') {
                        optionalContainer.slideDown(500);
                    } else {
                        optionalContainer.slideUp(500);
                    }
                });
            })(myPanelId);
            for (var p of opt_props) {
                insertInputField(myPanelId, p["name"], getDesc(p["simpleName"],p["name"]), p["type"], p["enums"], "#panel-body-opt-", p["isOptional"], p["rootIsOptional"], p["multipleValuesAllowed"])
            }
        }
        $('#panel-body-opt-' + myPanelId).slideUp(0);
        if (options.withSubClassSelection) {
            $("#panel-body-" + myPanelId).append('<hr>');
            if(Array.isArray(dsType)){
                var i=0;
                for(var t of dsType){
                    var subClasses = getAllSubClasses(t).sort();
                    $("#panel-body-" + myPanelId).append('<select name="select" class="form-control input-myBackground input-mySelect" id="' + "sub_" + myPanelId +'_'+i+ '" title="Select a sub-class if you want to specify further">');
                    var dropdown = $('#' + 'sub_' + myPanelId + '_' + i);
                    dropdown.append('<option value="' + t + '">Default: ' + t + '</option>');
                    subClasses.forEach(function (e) {
                        dropdown.append('<option value="' + e + '">' + e + '</option>');
                    });
                    dropdown.append('</select>');
                    i++;
                }
            }else{
                var subClasses = getAllSubClasses(dsType).sort();
                $("#panel-body-" + myPanelId).append('<select name="select" class="form-control input-myBackground input-mySelect" id="' + "sub_" + myPanelId + '" title="Select a sub-class if you want to specify further">');
                var dropdown = $('#' + 'sub_' + myPanelId);
                dropdown.append('<option value="' + dsType + '">Default: ' + dsType + '</option>');
                subClasses.forEach(function (e) {
                    dropdown.append('<option value="' + e + '">' + e + '</option>');
                });
                dropdown.append('</select>');
            }
        }
    } else {
        $("#panel-body-" + myPanelId).html('<pre  style="max-height:400px" id="ia_panel_' + myPanelId + '_content"></pre>');
    }

    for (var button of options.buttons) {
        (function (thisPanelId) {    // because the onclick changes with each loop all buttons would call the same function
            var name = button["name"];
            var onclick = button["onclick"];
            var additionalClasses = button["additionalClasses"];
            var icon = button.hasOwnProperty("icon") ? button["icon"] : null;
            var createJsonLD = !!button["createJsonLD"];    // default is false
            var onlyIcon = button["onlyIcon"] !== false;    //default is true

            $('#panel-footer-' + thisPanelId).append(
                '<button class="btn button-sti-red" id="panel-footer-btn-' + name + '-' + thisPanelId + '" style="margin: 5px 5px; padding: 10px 10px" ' + (additionalClasses ? additionalClasses : "") + ' title="' + name + '" >' +
                (icon ? '<i class="material-icons">' + icon + '</i>' : name) +
                (onlyIcon ? '' : ' ' + name) +
                '</button>'
            );

            $('#panel-footer-btn-' + name + '-' + thisPanelId)
                .click(function (e) {
                    e.preventDefault();
                    onclick({
                        "jsonLd": $("#panel-footer-btn-Preview-" + thisPanelId).prop("already_annotation_created") ? $("#panel-footer-btn-Preview-" + thisPanelId).prop("already_annotation_created") : (createJsonLD ? semantifyCreateJsonLd(thisPanelId) : null),
                        "dsHash": ds && ds["hash"],
                        "annId": $('#panel-' + thisPanelId).data("smtfyAnnId"),
                        "webId": $('#panel-' + thisPanelId).data("smtfyWebId"),
                        "panelId": thisPanelId,
                        inputFields,
                        options,
                        iaBox
                    });
                });

        })(myPanelId);
    }
    if(options.annotation) {
        fillBoxAnnotation(iaBox, ds, options, cb);
    } else if (options.smtfyAnnotationUID) {
        fillBoxAnnId(iaBox, ds, options, cb);
    } else if (cb) {
        cb(iaBox);
    }
}

function getProps(props, level, fatherType, myPanelId, fatherIsOptional) {
    var propList = [];
    for (var p in props) {
        if (!props.hasOwnProperty(p)) continue;
        var prop = props[p];
        var range = prop['sh:or']['@list'][0];
        var isOptional = prop["sh:minCount"] ? prop["sh:minCount"] === 0 : true;
        var name = removeNS(prop["sh:path"]);
        if (!range['sh:node'] && (range["sh:datatype"] || range['sh:in'])) {
            var simpleProp = {
                "simpleName": name,
                "name": (level === "" ? "" : level + "-") + name,
                "type": range["sh:datatype"],
                "fatherType": fatherType,
                "isOptional": isOptional,
                "multipleValuesAllowed": false, // only used for select enum, deprecate for now
                "rootIsOptional": fatherIsOptional
            };

            if (range['sh:in']) {
                simpleProp["type"] = "Enumeration";
                var enums = [];
                range['sh:in']['@list'].forEach(function (ele) {
                    enums.push(removeNS(ele));
                });
                simpleProp["enums"] = enums;
            }

            propList.push(simpleProp);
        } else if(range['sh:node']) {
            var myLevel = level === "" ? name : level + "-" + name;
            var path = myLevel + "-@type";
            var type;
            if(Array.isArray(range["sh:class"])){
                type=[];
                for(var i of range["sh:class"]){
                    type.push(removeNS(i));
                }
            }else{
                type=removeNS(range["sh:class"])
            }
            var pathType = {
                "name": type,
                "path": path,
                "panelId": myPanelId
            };
            typeList.push(pathType);
            var fIsOptional = fatherIsOptional === true || isOptional;
            propList = propList.concat(
                getProps(range["sh:node"]["sh:property"],
                    myLevel,
                    range["sh:class"],
                    myPanelId,
                    fIsOptional));
        } else {
            console.log("UNKOWN PROP", prop)
        }
    }
    return propList;
}

function insertInputField(panelId, name, desc, type, enumerations, panel, optional, rootIsOptional, multipleValuesAllowed) {
    var id = "IA_" + panelId + "_" + name;
    var temp = false;
    if (rootIsOptional && !optional) {
        temp = true;
    }
    switch (type) {
        case "xsd:string":
        case "xsd:anyURI":
        case "xsd:double":
        case "xsd:float":
        case "xsd:integer":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            break;
        case "xsd:boolean":
            $(panel + panelId).append('<select style="color:#aaa" name="select" class="form-control input-myBackground" id="' + id + '" title=" ' + desc + '"></select>');
            $('#' + id).append('<option value="" selected style="color:#aaa">'+ name + '</option><option  style="color:#000" value="true">true</option><option style="color:#000" value="false">false</option>');

            $('#' + id).change(function(){
                if ($(this).val()=="") $(this).css({color: "#aaa"});
                else $(this).css({color: "#000"});
            });

            break;
        case "xsd:date":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            $('#' + id).datetimepicker({
                format: 'YYYY-MM-DD'
            });
            break;
        case "xsd:dateTime":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            $('#' + id).datetimepicker({
                format: 'YYYY-MM-DDTHH:mm'
            });
            break;
        case "xsd:time":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            $('#' + id).datetimepicker({
                format: 'HH:mm'
            });
            break;
        case "Enumeration":
            if (multipleValuesAllowed) {
                $(panel + panelId).append('<select multiple name="select" class="form-control input-myBackground input-mySelect" id="' + id + '" title=" ' + "You can add more than one value by pressing *Ctrl* \n\n" + desc + '">');
            } else {

                $(panel + panelId).append('<select style="color:#bfc0bf" name="select" class="form-control input-myBackground" id="' + id + '" title=" ' + desc + '">');
                $('#' + id).change(function(){
                    if ($(this).val()=="") $(this).css({color: "#bfc0bf"});
                    else $(this).css({color: "#555555"});
                });
            }
            var enumField = $('#' + id);
            enumField.append('<option value="" selected style="color:#bfc0bf">Select: ' + name + '</option>');
            enumerations.forEach(function (e) {
                enumField.append('<option style="color:#555555" value="' + e + '">' + e + '</option>');
            });
            enumField.append('</select>');
            break;
    }
    $("#" + id)
        .data("type", type)
        .data("enumerations", enumerations)
        .data("isOptional", optional)
        .data("rootIsOptional", rootIsOptional)
        .data("multipleValuesAllowed", multipleValuesAllowed)
        .data("name", name);
    inputFields.push(id);
}

function getAllInputs(panelId) {
    var allInputs = [];

    for (var a of inputFields){
        var compareId = a.slice(a.indexOf("_") + 1, a.indexOf("_", a.indexOf("_") + 1));
        if (compareId === panelId.toString()) { //only inputs from same panel
            allInputs.push(a);
        }
    }
    return allInputs;
}

function fillBoxAnnId(iaBox, ds, options, cb) {
    $('#panel-' + iaBox.panelId)
        .data("smtfyAnnId", options.smtfyAnnotationUID)
        .data("smtfyWebId", options.smtfySemantifyWebsiteUID)
        .data("smtfyWebSecret", options.smtfySemantifyWebsiteSecret);
    httpGet(semantifyUrl + "/api/annotation/short/" + options.smtfyAnnotationUID, function (data) {
        if (typeof data === "string") {
            data = JSON.parse(data);
        }
        if (data === undefined) {
            $('#panel-body-' + iaBox.panelId).html("There was an error loading the annotation with id: <b>" + options.smtfyAnnotationUID + "</b> from the server!\n Reload the page or check if the annotation was deleted");
            $("#panel-footer-btn-Preview-" + iaBox.panelId).prop("disabled", true);
            $("#panel-footer-btn-Save-" + iaBox.panelId).prop("disabled", true);
        } else {
            options.annotation = data;
            fillBoxAnnotation(iaBox, ds, options, cb);
        }
    });
}

function fillBoxAnnotation(iaBox, ds, options, cb) {
    let panelId = iaBox.panelId;
    let data = options.annotation;

    if (containsArray(data)) {
        $("#panel-body-" + panelId).html('<pre id="ia_panel_' + panelId + '_content"></pre> To edit this annotation, please visit <a href="https://semantify.it">semantify.it</a>  and use the full editor. In this version, no multiple values are allowed! ');
        $("#panel-footer-btn-Preview-" + panelId).prop("already_annotation_created", data);
        $("#panel-footer-btn-Save-" + panelId).prop("disabled", true);

        var code = $("#ia_panel_" + panelId + "_content");
        code.html(syntaxHighlight(JSON.stringify(data, null, 2)));
        code.css("max-height", "200px");
        code.css("overflow", "hidden");
        code.css("text-overflow", "ellipsis");
        code.css("-webkit-mask", "linear-gradient(0deg, rgba(0,0,0,0) 20%, rgba(0,0,0,1) 70%)");

    } else {
        if (ds) {
            var flatJson = flatten(data);
            if (Array.isArray(data['@type'])) {
                var i = 0;
                for (var t of data['@type']) {
                    $('#sub_' + panelId + '_' + i).val(t).change();
                    i++;
                }
            } else {
                $('#sub_' + panelId).val(flatJson['@type']).change();
            }
            for (var a of getAllInputs(panelId)) {
                var $inputField = $("#" + a);
                var path = $inputField.data("name");
                var tempValue = flatJson[path.replace(/-/g, ".")];
                if (tempValue !== undefined && tempValue.length > 0) {
                    tempValue = tempValue.replace('http://schema.org/', '');
                }
                $inputField.val(tempValue);
            }
        } else {
            $("#panel-body-" + panelId).append('This annotation does not have any Domain Specification. Therefore you won`t be able to edit it.');
            $("#panel-footer-btn-Preview-" + panelId).prop("already_annotation_created", data);
            $("#panel-footer-btn-Save-" + panelId).prop("disabled", true);

            var code = $("#ia_panel_" + panelId + "_content");
            code.html(syntaxHighlight(JSON.stringify(data, null, 2)));
            code.css("max-height", "200px");
            code.css("overflow", "hidden");
            code.css("text-overflow", "ellipsis");
            code.css("-webkit-mask", "linear-gradient(0deg, rgba(0,0,0,0) 20%, rgba(0,0,0,1) 70%)");
        }
    }
    cb(iaBox);
}

function semantifyCreateJsonLd(id) {
    var dsName;
    var schemaName = "Thing";
    panelRoots.forEach(function (t) {
        if (t["panelId"] == id) {
            dsName = t["name"];
            schemaName = t["root"]
        }
    });
    var selected;
    if(Array.isArray(schemaName)){
        selected=[];
        for(var i in schemaName){
            selected.push($('#' + "sub_" + id+'_'+i).val());
        }
    }else{
        selected = $('#' + "sub_" + id).val();
    }
    if (selected != undefined && selected != "" && selected != null) {
        schemaName = selected;
    }
    var validPaths = [];
    var allPaths = [];
    var resultJson = {
        "@context": "http://schema.org/",
        "@type": schemaName
    };
    var allRequired = true; //variable gets false if an required field is empty
    var allRequiredPaths = true; //variable gets false if an optional field is filled in that has required properties
    var allInputs = []; //all input ids from same panel
    var notFilledRequired = []; //all inputFields that are not filled but required
    var msgs = [];

    for (var a of inputFields) {
        var compareId = a.slice(a.indexOf("_") + 1, a.indexOf("_", a.indexOf("_") + 1));
        if (compareId === id.toString()) { //only inputs from same panel
            allInputs.push(a);
        }
    };

    for (var a of allInputs) {
        var $inputField = $("#" + a);
        var value = $inputField.val();
        var path = $inputField.data("name");
        var optional = $inputField.data("isOptional");
        var rootOptional = $inputField.data("rootIsOptional");
        if ((value === undefined || value === null || value === "" || value.length === 0 || value.length == undefined) && (optional === false && rootOptional === false)) { //if variable is not optional but empty
            allRequired = false;
            notFilledRequired.push($inputField);
        }
        if ((value != undefined && value != null && value != "" && value.length != 0 && value.length != undefined) && rootOptional === true) {
            //check if all other paths and sub paths are filled in - else false allRequiredPaths
            var bAllPaths = [];
            var bPaths = path.split('-');
            while (bPaths.length > 1) {
                bPaths.pop();
                bAllPaths.push((bPaths.join("-")))
            }
            allInputs.forEach(function (b) {
                var $inputElem = $("#" + b);
                var bPath = $inputElem.data("name");
                var bOptional = $inputElem.data("isOptional");
                var bRootOptional = $inputElem.data("rootIsOptional");
                var len = (bPath.split("-"));
                len = len.length;
                var bValue = $inputElem.val();
                for (var z = 0; z < bAllPaths.length; z++) {
                    var len2 = bAllPaths[z].split("-");
                    len2 = len2.length;
                    if (bOptional == false && bRootOptional == true && (bPath.indexOf(bAllPaths[z]) >= 0) && len === len2 + 1) {
                        if (bValue === undefined || bValue === "" || bValue == null || bValue.length === 0 || bValue.length == undefined) {
                            msgs.push(bPath);
                            allRequiredPaths = false;
                        }
                    }
                }
            });
        }
        typeList.forEach(function (t) {
            if (t["panelId"] === id) {
                var typePath = {
                    "name": t["name"],
                    "path": t["path"]
                };
                allPaths.push(typePath)
            }
        });
        if (!(value === undefined || value === null || value === "" || value.length === 0 || value.length == undefined)) {

            var temp = path.split("-");
            while (temp.length > 1) {
                temp.pop();
                var x = temp.join("-") + "-@type";
                validPaths.push(x);
            }

            allPaths.forEach(function (a) {
                validPaths.forEach(function (v) {
                    if (v === a["path"]) {

                        resultJson = set(resultJson, a["path"], a["name"])
                    }
                });
            });

            resultJson = set(resultJson, path, value)
        }

    }
    if (allRequired && allRequiredPaths) {
        //var result = (JSON.stringify(resultJson));
        return resultJson;
    } else {
        if (!allRequired) {
            notFilledRequired.forEach(function(f){
                f.css({"border": "1px solid rgba(255, 0, 0, 1)","box-shadow": "0 0 10px rgba(255, 0, 0, 1)"});
                setTimeout(
                    function() {f.css({"border": "","box-shadow": ""}); },
                    3000
                );
            });
            send_snackbarMSG("Please fill in all required fields", 3000);
        } else {
            msgs = htmlList(unique(msgs));
            send_snackbarMSG("Please also fill in <ul>" + msgs.join("") + "</ul>", 3000 + (msgs.length - 1) * 1000);
            msgs.forEach(function(n){
                var g=$('#IA_'+id+'_'+n.replace(/<(?:.|\n)*?>/gm, ''));
                g.css({"border": "1px solid rgba(255, 0, 0, 1)","box-shadow": "0 0 10px rgba(255, 0, 0, 1)"});
                setTimeout(
                    function() {g.css({"border": "","box-shadow": ""}); },
                    3000
                );
            });
        }
        return null;
    }
}

const util = {
    semantifyUrl,
    remove: Util.remove,
    copyStr: Util.copyStr,
    syntaxHighlight: Util.syntaxHighlight,
    send_snackbarMSG: Util.send_snackbarMSG,
    send_snackbarMSG_fail: Util.send_snackbarMSG_fail,
    httpGetHeaders: Util.httpGetHeaders,
    httpPostJson: Util.httpPostJson,
    httpCall: Util.httpCall,
    httpGet: Util.httpGet,
};

export {
    createIABox,
    util,
}
