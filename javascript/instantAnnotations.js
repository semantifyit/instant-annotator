"use strict";

var sdoProperties;
var sdoPropertiesReady = false;
var sdoClasses;
var sdoClassesReady = false;
var panelId = "IAPanel0";
var panelCount = 0;

var panelRoots = [];
var typeList = [];
var inputFields = [];

var semantifyUrl = "https://semantify.it";
//semantifyUrl = "http://localhost:8081";

var semantifyShortUrl = "https://smtfy.it/";
//semantifyShortUrl = "https://staging.semantify.it/api/annotation/short/";

var saveApiKey = "Hkqtxgmkz";
var semantifyToken;

var copyBtn = {
    "name": "Copy",
    "icon": "content_copy",
    "createJsonLD": true,
    "onclick": function (resp) {
        console.log("Copy");
        if (resp.jsonLd)
            copyStr(JSON.stringify(resp.jsonLd, null, 2));
    }
};

var clearBtn = {
    "name": "Clear",
    "icon": "delete",
    "onclick": function (resp) {
        console.log("Clear");
        inputFields.forEach(function (i) {
            var id = i.slice(i.indexOf("_") + 1, i.indexOf("_", i.indexOf("_") + 1));
            if (resp.panelId.toString() === id) {
                $("#" + i).val("");
            }
        })
    }
};

var saveBtn = {
    "name": "Save",
    "icon": "save", //backup
    "onlyIcon": false,
    "createJsonLD": true,
    "onclick": function (resp) {
        if (!resp.jsonLd)
            return;

        var bulk = [];
        var toSend = {};
        toSend["content"] = resp.jsonLd;
        toSend["dsHash"] = resp.dsHash;
        bulk.push(toSend);

        var snackBarOptions = {
            htmlAllowed: true,
            style: 'toast',
            timeout: 3000
        };

        httpPostJson(semantifyUrl + "/api/annotation/" + saveApiKey, bulk, function (saveRes) {
            if (saveRes) {
                snackBarOptions["content"] = "Successfully saved Annotation to semantify.it";
                $.snackbar(snackBarOptions);

                var annUrl = semantifyShortUrl + saveRes[0]["UID"];
                var dummy = document.createElement("div");
                document.body.appendChild(dummy);
                dummy.setAttribute("id", "IA_preview_id");
                $('#IA_preview_id').append(
                    '<div class="modal fade" id="IA_saveModal" role="dialog">' +
                    '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                    '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
                    '<h3 class="modal-title">Successfully saved JSON-LD annotation!</h3>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<pre id="IA_preview_textArea" style="max-height: 300px;"></pre>' +
                    '<button class="btn btn-default" id="IA_preview_copy" style="float: right; position:relative;bottom:55px; right:5px "> <i class="material-icons">content_copy</i> Copy</button>' +
                    '<br/>' +
                    'Saved annotation "<b>' + saveRes[0]["name"] + '" </b><div id="IA_toWebsite" style="display: inline"></div> at: <a target="_blank" id="IA_annUrl" href="' + annUrl + '">' + annUrl + '</a> <br/><br/>' +
                    '<button class="btn btn-default" style="margin:0; padding: 2px; text-transform:none; font-weight:normal" id="IA_JS_inject"><span class="caret"/>  How do i get this annotation into my website?</button>' +
                    '<br/><br/><br/>' +
                    '<div id="IA_loginSection">' +
                    '</div>' +
                    '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>'
                );
                $('#IA_preview_copy').click(function () {
                    copyStr(JSON.stringify(resp.jsonLd, null, 2));
                });

                $('#IA_JS_inject').after(
                    '<div id="IA_JS_inject_area" style="display:none;">' +
                    '<br/> Add this Javascript code to your Website: ' +
                    '<pre id="IA_JS_inject_code"></pre>' +
                    '<button class="btn btn-default" id="IA_inject_copy" style="float: right; position:relative;bottom:55px; right:5px "> <i class="material-icons">content_copy</i> Copy</button>' +
                    '</div>'
                );
                var injectCode = createInjectionCodeForURL(saveRes[0]["UID"]);
                $('#IA_inject_copy').click(function () {
                    copyStr(injectCode);
                });
                $('#IA_JS_inject_code').html(injectCode);

                $('#IA_JS_inject').click(function () {
                    if ($('#IA_JS_inject_area').html()) {
                        if ($('#IA_JS_inject_area').css('display') === 'none') {
                            $('#IA_JS_inject_area').slideDown(200);
                        }
                        else {
                            $('#IA_JS_inject_area').slideUp(200);
                        }
                    }
                });

                $('#IA_preview_textArea').html(syntaxHighlight(JSON.stringify(resp.jsonLd, null, 2)));
                var addWebsites = function () {
                    httpGetHeaders(semantifyUrl + "/api/website", {'Authorization': 'Bearer ' + semantifyToken}, function (websiteRes) {
                        if (websiteRes) {
                            $('#IA_loginSection').after('<div class="list-group" id="IA_my_websites"><h4>Your websites: (Select one to save your annotation to) </h4> </div>');
                            websiteRes.forEach(function (ele) {
                                $('#IA_my_websites').append('<button type="button" class="list-group-item list-group-item-action" id="IA_' + ele["apiKey"] + '" style="padding: 5px 0">' + ele["name"] + ' (' + ele["domain"] + ')' + '</button>');
                                $('#IA_' + ele["apiKey"]).click(function () {
                                    $('#IA_my_websites').slideUp(100);
                                    httpPostJson(semantifyUrl + "/api/annotation/" + ele["apiKey"], bulk, function (newSaveRes) {
                                        if (newSaveRes) {
                                            snackBarOptions["content"] = 'Saved the annotation to: ' + ele["name"] + ' (' + ele["domain"] + ')';
                                            $.snackbar(snackBarOptions);
                                            $('#IA_toWebsite').append('to website <b>' + ele["name"] + (ele["domain"] ? ' (' + ele["domain"] + ')' : '') + '</b>');
                                            var newUrl = semantifyShortUrl + newSaveRes[0]["UID"];
                                            $('#IA_annUrl').html(newUrl).attr("href", newUrl);
                                            var newInjectCode = createInjectionCodeForURL(newSaveRes[0]["UID"]);
                                            $('#IA_inject_copy').click(function () {
                                                copyStr(newInjectCode);
                                            });
                                            $('#IA_JS_inject_code').html(newInjectCode);
                                        }
                                        else {
                                            snackBarOptions["content"] = 'Failed to save the annotation to: ' + ele["name"] + ' (' + ele["domain"] + ')';
                                            $.snackbar(snackBarOptions);
                                        }
                                    });

                                });
                            });
                        }
                        else {
                            snackBarOptions["content"] = "There has been an error when retrieving your websites";
                            $.snackbar(snackBarOptions);
                        }
                    });
                };
                //var str = createInjectionCodeForURL(UID);

                if (!semantifyToken) {
                    $('#IA_loginSection').append(
                        '<p>Want to save this Annotation to your Semantify.it account?</p>' +
                        '<button type="button" class="btn button-sti-red" id="IA_loginBtn" style="margin:0 10px 0 0">Login</button>' +
                        //style on login btn is because the icon makes the button larger
                        '<button type="button" class="btn button-sti-red" id="IA_registerBtn" style="padding:6px 30px" onclick=" window.open(\'https://semantify.it/register\',\'_blank\')" title="Register at semantify.it"> <i class="material-icons">open_in_new</i>  Register</button>' +
                        '<div id="IA_credentialsSection" hidden>' +
                        '<input type="text" class="form-control" id="IA_username" placeholder="Username/Email" title="Username/Email">' +
                        '<input type="password" class="form-control" id="IA_password" placeholder="Password" title="Password">' +
                        '</div>'
                    );
                }
                else {
                    addWebsites();
                }

                var loginOnEnter = function (event) {
                    if (event.keyCode === 13) {
                        $("#IA_loginBtn").click();
                    }
                };

                $("#IA_username").keyup(function (event) {
                    loginOnEnter(event);
                });
                $("#IA_password").keyup(function (event) {
                    loginOnEnter(event);
                });

                $('#IA_saveModal')
                    .modal()
                    .on('hidden.bs.modal', function () {
                        $(this).remove();
                    });

                $('#IA_loginBtn').click(function () {
                    if ($('#IA_credentialsSection').css('display') === 'none') {
                        $('#IA_credentialsSection').slideDown(100);
                    }
                    else {
                        var credentials = {
                            identifier: $('#IA_username').val(),
                            password: $('#IA_password').val()
                        };

                        httpPostJson(semantifyUrl + "/api/login", credentials, function (loginResp) {
                            if (loginResp) {
                                $('#IA_loginSection').slideUp(100);
                                semantifyToken = loginResp["token"];
                                addWebsites();
                            }
                            else {
                                snackBarOptions["content"] = "Couldn't log in to semantify.it";
                                $.snackbar(snackBarOptions);
                            }
                        });
                    }
                });
            }
            else {
                snackBarOptions["content"] = "Successfully saved Annotation to semantify.it";
                $.snackbar(snackBarOptions);
            }
        });
    }
};
var previewBtn = {
    "name": "Preview",
    "icon": "code",
    "createJsonLD": true,
    "onclick": function (resp) {
        if (resp.jsonLd === null) {
            return;
        }
        console.log("preview");
        var dummy = document.createElement("div");
        document.body.appendChild(dummy);
        dummy.setAttribute("id", "preview_id");
        $('#preview_id').append(
            '<div class="modal fade" id="previewModal" role="dialog">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
            '<h4 class="modal-title">Preview JSON-LD</h4>' +
            '</div>' +
            '<div class="modal-body">' +
            '<pre id="preview_textArea" style="max-height: 500px;"></pre>' +
            '<button class="btn btn-default" id="IA_simple_preview_copy" style="float: right; position:relative;bottom:55px; right:5px "> <i class="material-icons">content_copy</i> Copy</button>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );
        $('#preview_textArea').html(syntaxHighlight(JSON.stringify(resp.jsonLd, null, 2)));
        $('#previewModal').modal();
        $('#IA_simple_preview_copy').click(function () {
            copyStr(JSON.stringify(resp.jsonLd, null, 2));
        });
    }
};

var defaultBtns = [clearBtn, saveBtn];

IA_Init();

function IA_Init() {
    getClassesJson();
    getTreeJson();

    $('.IA_Box').each(function () {
        var dsId = $(this).data("dsid");
        var dsHash = $(this).data("dshash");
        var dsName = $(this).data("dsname");
        var buttonsChoice = $(this).data("btns");
        var sub = $(this).data("sub");

        var buttons = [];
        switch (buttonsChoice) {
            case "no" :
                buttons = [];
                break;
            case "default":
            case undefined:
            case null:
                buttons = defaultBtns.slice(); //to pass by value and not reference
                break;
            default:
                var buttonsArray = buttonsChoice.split("+");
                buttonsArray.forEach(function (b) {
                    switch (b) {
                        case "preview":
                            buttons.push(previewBtn);
                            break;
                        case "clear":
                            buttons.push(clearBtn);
                            break;
                        case "save":
                            buttons.push(saveBtn);
                            break;
                        case "copy":
                            buttons.push(copyBtn);
                            break;
                    }
                });
        }

        $(this).children('div').each(function () {
            if ($(this).hasClass('IA_Btn')) {
                var button = {};
                button["name"] = $(this).data("name");
                button["icon"] = $(this).data("icon");
                button["onlyIcon"] = $(this).data("onlyIcon");
                button["createJsonLD"] = !!$(this).data("createjsonld");
                button["onclick"] = window[$(this).data("onclick")];
                buttons.push(button);
            }
        });

        $(this).append(
            '<div id="loading' + panelId + '" class="col-lg-3 col-md-4 col-sm-6 text-center" style="margin: 10px; padding: 10px; background: white; border-radius: 10px;">' +
            '<img src="' + semantifyUrl + '/images/loading.gif">' +
            '</div>'
        );

        (function (id, $jqueryElement) {
            if (dsId) {
                httpGet(semantifyUrl + "/api/domainSpecification/" + dsId, function (ds) {
                    ds["hash"] = null;
                    addBox($jqueryElement, id, ds, buttons, sub);
                });
            }
            else if (dsHash) {
                httpGet(semantifyUrl + "/api/domainSpecification/hash/" + dsHash, function (ds) {
                    ds["hash"] = dsHash;
                    addBox($jqueryElement, id, ds, buttons, sub);
                });
            }
            else if (dsName) {
                httpGet(semantifyUrl + "/api/domainSpecification/searchName/" + dsName, function (dsList) {
                    var ds = dsList[0];
                    ds["hash"] = null;
                    addBox($jqueryElement, id, ds, buttons, sub);
                });
            }
        }(panelId, $(this), sub));

        panelCount++;
        panelId = "IAPanel" + panelCount;

    });

}

function getClassesJson() {
    httpGet("https://semantify.it/assets/data/latest/sdo_properties.min.json", function (data) {
        sdoProperties = data;
        sdoPropertiesReady = true;
    });
}

function getTreeJson() {
    httpGet("https://semantify.it/assets/data/latest/sdo_classes.json", function (data) {
        sdoClasses = data;
        sdoClassesReady = true;
    });
}

function addBox($jqueryElement, myPanelId, ds, buttons, sub) {
    if (!(sdoPropertiesReady) || !(sdoClassesReady)) {
        setTimeout(function () {
            addBox($jqueryElement, myPanelId, ds, buttons, sub);
        }, 100);
        return;
    }

    $('#loading' + myPanelId).hide();
    var title = $jqueryElement.data("title");
    var curDs = ds["content"];
    var dsName = (title ? title : (curDs === undefined ? "DS not found" : curDs["schema:name"]));
    var dsType = curDs["dsv:class"][0]["schema:name"];


    var footer = (buttons && buttons.length > 0 ? '<div class="panel-footer text-center" id="panel-footer-' + myPanelId + '"></div>' : '');      //only display footer if there are some buttons
    $jqueryElement.append(
        '<div class="panel panel-info col-lg-3 col-md-4 col-sm-6" id="panel-' + myPanelId + '" style="margin: 10px; padding: 10px;" >' +
        '<div class="panel-heading sti-red"> ' +
        '<h3>' + dsName + '</h3>' +
        '</div> ' +
        '<div class="panel-body" id="panel-body-' + myPanelId + '">' +
        '</div>' +
        footer +
        '</div>');
    var t = {
        "panelId": myPanelId,
        "name": curDs["schema:name"],
        "root": curDs["dsv:class"][0]["schema:name"]
    };

    panelRoots.push(t);
    var dsProps = curDs["dsv:class"][0]["dsv:property"];
    var req_props = [];
    var opt_props = [];
    var props = getProps(dsProps, "", dsType, myPanelId, false);

    props.forEach(function (prop) {
        if (!prop["isOptional"] && !prop["rootIsOptional"]) {
            req_props.push(prop)
        }
        else {
            opt_props.push(prop)
        }
    });

    req_props.forEach(function (p) {
        insertInputField(myPanelId, p["name"], getDesc(p["simpleName"]), p["type"], p["enums"], "#panel-body-", p["isOptional"], p["rootIsOptional"], p["multipleValuesAllowed"])
    });

    if (opt_props.length > 0) {
        $('#' + 'panel-body-' + myPanelId)
            .append('<button type="button" class="btn btn-block btn-default text-left" id="panel-body-opt-btn-' + myPanelId + '" style="background-color: lightgrey;">Optional Fields <span class="caret"></button>')
            .append('<div id="panel-body-opt-' + myPanelId + '"> </div>');

        // this is because if you call onclick it would use the last recent panelId and not the current one
        (function (arg) {
            $('#' + 'panel-body-opt-btn-' + arg).click(function () {
                var optionalContainer = $('#panel-body-opt-' + arg);
                if (optionalContainer.css('display') === 'none') {
                    optionalContainer.slideDown(500);
                }
                else {
                    optionalContainer.slideUp(500);
                }
            });
        })(myPanelId);

        opt_props.forEach(function (p) {
            insertInputField(myPanelId, p["name"], getDesc(p["simpleName"]), p["type"], p["enums"], "#panel-body-opt-", p["isOptional"], p["rootIsOptional"], p["multipleValuesAllowed"])
        });

        $('#panel-body-opt-' + myPanelId).slideUp(0);
        if (sub === true) {
            var subClasses = getSubClasses(dsType).sort();
            $("#panel-body-" + myPanelId).append('<select name="select" class="form-control input-myBackground input-mySelect" id="' + "sub_" + myPanelId + '" title="Select a sub-class if you want to specify further">');
            var dropdown = $('#' + 'sub_' + myPanelId);
            dropdown.append('<option value="">Default: ' + dsType + '</option>');
            subClasses.forEach(function (e) {
                dropdown.append('<option value="' + e + '">' + e + '</option>');
            });
            dropdown.append('</select>');
        }
    }

    for (var j in buttons) {
        if (buttons.hasOwnProperty(j)) {
            (function (arg) {    // because the onclick changes with each loop all buttons would call the same function
                var name = buttons[j]["name"];
                var onclick = buttons[j]["onclick"];
                var additionalClasses = buttons[j]["additionalClasses"];
                var icon = buttons[j].hasOwnProperty("icon") ? buttons[j]["icon"] : null;
                var createJsonLD = !!buttons[j]["createJsonLD"];    // default is false
                var onlyIcon = buttons[j]["onlyIcon"] !== false;    //default is true

                $('#panel-footer-' + myPanelId).append(
                    '<button class="btn button-sti-red" id="panel-footer-btn-' + name + '-' + myPanelId + '" style="margin: 5px 5px; padding: 10px 10px" ' + (additionalClasses ? additionalClasses : "") + ' title="' + name + '" >' +
                    (icon ? '<i class="material-icons">' + icon + '</i>' : name) +
                    (onlyIcon ? '' : ' ' + name) +
                    '</button>'
                );

                $('#panel-footer-btn-' + name + '-' + myPanelId)
                    .click(function () {
                        onclick({
                            "jsonLd": createJsonLD ? createJsonLd(arg) : null,
                            "jsonWarning": "",
                            "dsID": "",
                            "dsHash": ds["hash"],
                            "panelId": arg
                        });
                    });

            })(myPanelId);
        }
    }
}


function insertInputField(panelId, name, desc, type, enumerations, panel, optional, rootIsOptional, multipleValuesAllowed) {
    var id = "IA_" + panelId + "_" + name;
    var temp = false;
    if (rootIsOptional && !optional) {
        temp = true;
    }
    switch (type) {
        case "Text":
        case "URL":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            break;
        case "Integer":
        case "Number":
        case "Float":
            $(panel + panelId).append('<input type="number" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');

            break;
        case "Boolean":
            $(panel + panelId).append('<input type="checkbox" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '"><label for=' + id + '>' + name + '</label>');
            $("#" + id)
                .val("false")
                .on('change', function () {
                    if ($(this).is(':checked')) {
                        $(this).attr('value', 'true');
                    } else {
                        $(this).attr('value', 'false');
                    }
                });
            break;
        case "Date":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            $('#' + id).datetimepicker({
                format: 'L'
            });
            break;
        case "DateTime":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            $('#' + id).datetimepicker();
            break;
        case "Time":
            $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            $('#' + id).datetimepicker({
                format: 'LT'
            });
            break;
        case "Enumeration":
            if (multipleValuesAllowed) {
                $(panel + panelId).append('<select multiple name="select" class="form-control input-myBackground input-mySelect" id="' + id + '" title=" ' + "You can add more than one value by pressing *Ctrl* \n\n" + desc + '">');
            } else {
                $(panel + panelId).append('<select name="select" class="form-control input-myBackground" id="' + id + '" title=" ' + desc + '">');
            }
            var enumField = $('#' + id);
            enumField.append('<option value="" disabled selected>Select: ' + name + '</option>');
            enumerations.forEach(function (e) {
                enumField.append('<option value="' + e + '">' + e + '</option>');
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

function getDesc(propertyName) {
    return stripHtml(sdoProperties[propertyName]["description"]);
}

function stripHtml(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function getProps(props, level, fatherType, myPanelId, fatherIsOptional) {
    var propList = [];
    for (var p in props) {
        if (!props.hasOwnProperty(p)) continue;
        var prop = props[p];
        if (prop['dsv:expectedType'][0]['@type'] !== "dsv:RestrictedClass") {
            var simpleProp = {
                "simpleName": prop["schema:name"],
                "name": (level === "" ? "" : level + "-") + prop["schema:name"],
                "type": prop["dsv:expectedType"][0]["schema:name"],
                "fatherType": fatherType,
                "isOptional": prop["dsv:isOptional"],
                "multipleValuesAllowed": prop["dsv:multipleValuesAllowed"],
                "rootIsOptional": fatherIsOptional
            };

            if (prop['dsv:expectedType'][0]['@type'] === 'dsv:RestrictedEnumeration') {
                simpleProp["type"] = "Enumeration";
                var enums = [];
                prop['dsv:expectedType'][0]['dsv:expectedEnumerationValue'].forEach(function (ele) {
                    enums.push(ele["schema:name"]);
                });
                simpleProp["enums"] = enums;
            }

            propList.push(simpleProp);
        }
        else {
            var myLevel = level === "" ? prop["schema:name"] : level + "-" + prop["schema:name"];
            var path = myLevel + "-@type";
            var pathType = {
                "name": prop['dsv:expectedType'][0]['schema:name'],
                "path": path,
                "panelId": myPanelId
            };
            typeList.push(pathType);
            var fIsOptional = false;
            if (fatherIsOptional === true || prop['dsv:isOptional'] === true) {
                fIsOptional = true;
            }
            propList = propList.concat(getProps(prop['dsv:expectedType'][0]["dsv:property"], (level === "" ? prop["schema:name"] : level + "-" + prop["schema:name"]), prop['dsv:expectedType'][0]["schema:name"], myPanelId, fIsOptional));
        }
    }
    return propList;
}

function createJsonLd(id) {
    var dsName;
    var schemaName = "Thing";
    panelRoots.forEach(function (t) {
        if (t["panelId"] == id) {
            dsName = t["name"];
            schemaName = t["root"]
        }
    });
    var selected = $('#' + "sub_" + id).val();
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
    var msgs = [];

    inputFields.forEach(function (a) {
        var compareId = a.slice(a.indexOf("_") + 1, a.indexOf("_", a.indexOf("_") + 1));
        if (compareId === id.toString()) { //only inputs from same panel
            allInputs.push(a);
        }
    });

    allInputs.forEach(function (a) {
        var $inputField = $("#" + a);
        var value = $inputField.val();
        var path = $inputField.data("name");
        var optional = $inputField.data("isOptional");
        var rootOptional = $inputField.data("rootIsOptional");
        if ((value === undefined || value === null || value === "" || value.length === 0 || value.length == undefined) && (optional === false && rootOptional === false)) { //if variable is not optional but empty
            allRequired = false;
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
        if (!(value === undefined || value === null || value === "" || value.length === 0 || value.length == undefined )) {

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

    });
    if (allRequired && allRequiredPaths) {
        var result = (JSON.stringify(resultJson));
        return resultJson;
    } else {
        if (!allRequired) {
            send_snackbarMSG("Please fill in all required fields", 3000);
        } else {
            msgs = htmlList(unique(msgs));
            send_snackbarMSG("Please also fill in <ul>" + msgs.join("") + "</ul>", 3000 + (msgs.length - 1) * 1000);
        }
        return null;
    }
}

function createInjectionCodeForURL(UID) {
    var code = "function appendAnnotation() {\n" +
        "\tvar element = document.createElement('script');\n" +
        "\telement.type = 'application/ld+json';\n" +
        "\telement.text = this.responseText;\n" +
        "\tdocument.querySelector('head').appendChild(element);\n" +
        "}\n" +
        "var request = new XMLHttpRequest();\n" +
        "request.onload = appendAnnotation;\n" +
        'request.open("get", "' + semantifyShortUrl + UID + '", true);\n' +
        "request.send();";
    return code;
}

function copyStr(str) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.setAttribute("id", "dummy_id");
    dummy.value = str;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    send_snackbarMSG("Annotation copied into your clipboard", 3000);
}

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function getSubClasses(type) {
    var subClasses = [];
    if (!sdoClasses.hasOwnProperty(type))
        if (sdoClasses[type].hasOwnProperty("subClasses")) {
            subClasses = subClasses.concat(sdoClasses[type]["subClasses"]);
            subClasses.forEach(function (subclass) {
                subClasses = subClasses.concat(getSubClasses(subclass));
            });
        }
    return subClasses;
}

function unique(list) {
    var result = [];
    $.each(list, function (i, e) {
        if ($.inArray(e, result) == -1) result.push(e);
    });
    return result;
}

function htmlList(list) {
    var result = [];
    $.each(list, function (i, e) {
        result.push("<li>" + e + "</li> \n");
    });
    return result;
}


function send_snackbarMSG(message, duration) {
    var options = {
        content: '<table class="snackbar-table"><td><i class="material-icons snackbar-icon">info</i><span>  ' + message + '</span></td></table>', // text of the snackbar
        style: "toast",
        timeout: duration,
        htmlAllowed: true,
        onClose: function () {
        }
    };
    $.snackbar(options);
}

function set(obj, path, value) {
    var schema = obj;
    var pList = path.split('-');
    var len = pList.length;
    for (var i = 0; i < len - 1; i++) {
        var elem = pList[i];
        if (!schema[elem]) schema[elem] = {};
        schema = schema[elem];
    }
    schema[pList[len - 1]] = value;
    return obj;
}

function httpGet(url, callback) {
    httpGetHeaders(url, null, callback);
}

function httpGetHeaders(url, headers, callback) {
    $.ajax({
        type: 'GET',
        url: url,
        headers: headers,
        success: function (data) {
            callback(data);
        },
        error: function () {
            callback();
        }
    });
}

function httpPostJson(url, json, callback) {
    $.ajax({
        type: "POST",
        contentType: 'application/json ; charset=utf-8',
        url: url,
        data: JSON.stringify(json),
        success: function (data) {
            callback(data);
        },
        error: function () {
            callback();
        }
    });
}
