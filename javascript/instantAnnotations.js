var allDs;
var classesJson;
var classesReady = false;
var panelId = 0;

var panelRoots = [];
var typeList = [];
var inputFields = [];

var semantifyUrl = "https://staging.semantify.it";
//semantifyUrl = "http://localhost:8081";

var saveApiKey = "Sy5Zx9h6b";
var semantifyToken;

var copyBtn = {
    "name": "Copy",
    "icon": "content_copy",
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
            var id = i.slice(0, i.indexOf("_"));
            if (resp.panelId.toString() === id) {
                $("#" + i).val("");
            }
        })
    }
};

var saveBtn = {
    "name": "Save",
    "icon": "backup",
    "onclick": function (resp) {
        if (!resp.jsonLd)
            return;

        var bulk = [];
        var toSend = {};
        toSend["content"] = resp.jsonLd;
        //toSend["domainSpecification"] = dsId;
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

                var annUrl = 'https://smtfy.it/' + saveRes[0]["UID"];
                var dummy = document.createElement("div");
                document.body.appendChild(dummy);
                dummy.setAttribute("id", "IA_preview_id");
                $('#IA_preview_id').append(
                    '<div class="modal fade" id="IA_saveModal" role="dialog">' +
                    '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                    '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
                    '<h4 class="modal-title">Saved Annotation</h4>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    'Saved annotation "' + saveRes[0]["name"] + '" <div id="IA_toWebsite" style="display: inline"></div> at: <a id="IA_annUrl" href="' + annUrl + '">' + annUrl + '</a> <br/><br/>' +
                    '<a href="https://github.com/semantifyit/semantify-injection-js-sample">How do i get this annotation into my website?</a> <br/><br/><br/>' +
                    '<div id="IA_loginSection">' +
                    '</div>' +
                    '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>'
                );

                var addWebsites = function(){
                    httpGetHeaders(semantifyUrl + "/api/website", {'Authorization': 'Bearer ' + semantifyToken}, function(websiteRes){
                        if(websiteRes){
                            $('#IA_loginSection').after('<div class="list-group" id="IA_my_websites"><h4>Your websites: (Select one to save your annotation to) </h4> </div>');
                            websiteRes.forEach(function(ele){
                                $('#IA_my_websites').append('<button type="button" class="list-group-item list-group-item-action" id="IA_' + ele["apiKey"]  + '" style="padding: 5px 0">' + ele["name"] + ' (' + ele["domain"] + ')' + '</button>');
                                $('#IA_'+ele["apiKey"]).click(function(){
                                    $('#IA_my_websites').slideUp(100);
                                    httpPostJson(semantifyUrl + "/api/annotation/" + ele["apiKey"], bulk, function (newSaveRes) {
                                        if (newSaveRes) {
                                            snackBarOptions["content"] = 'Saved the annotation to: ' + ele["name"] + ' (' + ele["domain"] + ')';
                                            $.snackbar(snackBarOptions);
                                            $('#IA_toWebsite').append('to website ' + ele["name"] + ' (' + ele["domain"] + ')');
                                            var newUrl = 'https://smtfy.it/' + newSaveRes[0]["UID"];
                                            $('#IA_annUrl').html(newUrl).attr("href", newUrl)
                                        }
                                        else{
                                            snackBarOptions["content"] = 'Failed to save the annotation to: ' + ele["name"] + ' (' + ele["domain"] + ')';
                                            $.snackbar(snackBarOptions);
                                        }
                                    });

                                });
                            });
                        }
                        else{
                            snackBarOptions["content"] = "There has been an error when retrieving your websites";
                            $.snackbar(snackBarOptions);
                        }
                    });
                };

                if(!semantifyToken){
                    $('#IA_loginSection').append(
                        '<p>Want to save this Annotation to your Semantify.it account?</p>' +
                        '<button type="button" class="btn button-sti-red" id="IA_loginBtn">Login</button>' +
                        '<div id="IA_credentialsSection" hidden>' +
                        '<input type="text" class="form-control" id="IA_username" placeholder="Username/Email" title="Username/Email">' +
                        '<input type="password" class="form-control" id="IA_password" placeholder="Password" title="Password">' +
                        '</div>'
                    );
                }
                else{
                    addWebsites();
                }

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

                        httpPostJson(semantifyUrl + "/api/login" , credentials, function (loginResp) {
                            if(loginResp){
                                $('#IA_loginSection').slideUp(100);
                                semantifyToken = loginResp["token"];
                                addWebsites();
                            }
                            else{
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
    }
};

var defaultBtns = [clearBtn, copyBtn, previewBtn, saveBtn];

getClassesJson();

$('.IA_Box').each(function () {
    var dsId = $(this).data("dsid");
    var dsHash = $(this).data("dshash");
    var dsName = $(this).data("dsname");
    var buttonsChoise = $(this).data("btns");
    var buttons;
    switch (buttonsChoise) {
        case "no" :
            buttons = [];
            break;
        case "default":
        case undefined:
        case null:
            buttons = defaultBtns;
    }
    $(this).append(
        '<div id="loading' + panelId + '" class="col-lg-3 col-md-4 col-sm-6 text-center" style="margin: 10px; padding: 10px; background: white; border-radius: 10px;">' +
        '<img src="' + semantifyUrl + '/images/loading.gif">' +
        '</div>'
    );

    (function (id, jqueryElement) {
        if (dsId) {
            httpGet(semantifyUrl + "/api/domainSpecification/" + dsId, function (ds) {
                addBox(jqueryElement, id, ds, buttons);
            });
        }
        else if (dsHash) {
            httpGet(semantifyUrl + "/api/domainSpecification/hash/" + dsHash, function (ds) {
                addBox(jqueryElement, id, ds, buttons);
            });
        }
        else if (dsName) {
            httpGet(semantifyUrl + "/api/domainSpecification/searchName/" + dsName, function (dsList) {
                addBox(jqueryElement, id, dsList[0], buttons);
            });
        }
    }(panelId, $(this)));

    panelId++;
});

function getClassesJson() {
    //httpGet(semantifyUrl+"/assets/data/latest/classes.json", function (data) {
    httpGet("https://semantify.it/assets/data/3.2/classes.json", function (data) {
        classesJson = data;
        classesReady = true;
    });
}

function addBox(jqueryElement, myPanelId, ds, buttons) {
    if (!(classesReady)) {
        setTimeout(function () {
            addBox(jqueryElement, myPanelId, ds, buttons);
        }, 100);
        return;
    }

    $('#loading' + myPanelId).hide();
    var title = jqueryElement.data("title");
    var curDs = ds["content"];
    var dsName = (title ? title : (curDs === undefined ? "DS not found" : curDs["schema:name"]));
    var dsType = curDs["dsv:class"][0]["schema:name"];

    var footer = (buttons && buttons.length > 0 ? '<div class="panel-footer text-center" id="panel-footer-' + myPanelId + '"></div>' : '');      //only display footer if there are some buttons
    jqueryElement.append(
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
        insertInputField(myPanelId, p["name"], getDesc(p["fatherType"], p["simpleName"]), p["type"], p["enums"], "#panel-body-", p["isOptional"], p["rootIsOptional"])
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
            insertInputField(myPanelId, p["name"], getDesc(p["fatherType"], p["simpleName"]), p["type"], p["enums"], "#panel-body-opt-", p["isOptional"], p["rootIsOptional"])
        });

        $('#panel-body-opt-' + myPanelId).slideUp(0);

    }

    for (var j in buttons) {
        if (buttons.hasOwnProperty(j)) {
            (function (arg) {    // because the onclick changes with each loop all buttons would call the same function
                var name = buttons[j]["name"];
                var onclick = buttons[j]["onclick"];
                var additionalClasses = buttons[j]["additionalClasses"];
                var icon = buttons[j].hasOwnProperty("icon") ? buttons[j]["icon"] : null;

                $('#panel-footer-' + myPanelId).append(
                    '<button class="btn button-sti-red" id="panel-footer-btn-' + name + '-' + myPanelId + '" style="margin: 5px 5px; padding: 10px 10px" ' + (additionalClasses ? additionalClasses : "") + ' title="' + name + '" >' +
                    (icon ? '<i class="material-icons">' + icon + '</i>' : name) +
                    '</button>'
                );

                $('#panel-footer-btn-' + name + '-' + myPanelId)
                    .click(function () {
                        onclick({
                            "jsonLd": createJsonLd(arg),
                            "jsonWarning": "",
                            "dsID": "",
                            "panelId": arg
                        });
                    });

            })(myPanelId);
        }
    }
}


function insertInputField(panelId, name, desc, type, enumerations, panel, optional, rootIsOptional) {
    var id = panelId + "_" + type + "_" + name + "_" + optional + "_" + rootIsOptional;
    id = id.replace(/:/g, "-").replace(/ /g, '');
    var temp = false;
    if (rootIsOptional && !optional) {
        temp = true;
    }
    switch (type) {
        case "Text":
        case "URL":
            if (temp) {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackgroundRootOptional" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            } else {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            }
            break;
        case "Integer":
        case "Number":
        case "Float":
            if (temp) {
                $(panel + panelId).append('<input type="number" class="form-control input-myBackgroundRootOptional" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            } else {
                $(panel + panelId).append('<input type="number" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            }
            break;
        case "Boolean":
            if (temp) {
                $(panel + panelId).append('<input type="checkbox" class="form-control input-myBackgroundRootOptional" id="' + id + '" placeholder="' + name + '" title="' + desc + '"><label for=' + id + '>' + name + '</label>');
            } else {
                $(panel + panelId).append('<input type="checkbox" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '"><label for=' + id + '>' + name + '</label>');
            }
            break;
        case "Date":
            if (temp) {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackgroundRootOptional" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            } else {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            }
            $('#' + id).datetimepicker({
                format: 'L'
            });
            break;
        case "DateTime":
            if (temp) {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackgroundRootOptional" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            } else {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            }
            $('#' + id).datetimepicker();
            break;
        case "Time":
            if (temp) {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackgroundRootOptional" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            } else {
                $(panel + panelId).append('<input type="text" class="form-control input-myBackground" id="' + id + '" placeholder="' + name + '" title="' + desc + '">');
            }
            $('#' + id).datetimepicker({
                format: 'LT'
            });
            break;
        case "Enumeration":
            if (temp) {
                $(panel + panelId).append('<select name="select" class="form-control input-myBackgroundRootOptional" id="' + id + '" title=" ' + desc + '">');
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
    inputFields.push(id);
}

function getDesc(className, propertyName) {
    for (var i = 0; i < classesJson[className]["properties"].length; i++) {
        if (propertyName === classesJson[className]["properties"][i]["name"]) {
            return strip(classesJson[className]["properties"][i]["description"]);
        }
    }
}

function strip(html) {
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
                "name": (level === "" ? "" : level + ": ") + prop["schema:name"],
                "type": prop["dsv:expectedType"][0]["schema:name"],
                "fatherType": fatherType,
                "isOptional": prop["dsv:isOptional"],
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
            var myLevel = level === "" ? prop["schema:name"] : level + "." + prop["schema:name"];
            var path = myLevel + ".@type";
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
            propList = propList.concat(getProps(prop['dsv:expectedType'][0]["dsv:property"], (level === "" ? prop["schema:name"] : level + ": " + prop["schema:name"]), prop['dsv:expectedType'][0]["schema:name"], myPanelId, fIsOptional));
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
    var jsonDs;
    var validPaths = [];
    var allPaths = [];
    var resultJson = {
        "@context": "http://schema.org/",
        "@type": schemaName
    };
    for (var i in allDs) {
        if (allDs.hasOwnProperty(i))
            if (allDs[i]["content"]["schema:name"] === dsName) {
                jsonDs = allDs[i]["content"];
                break;
            }
    }
    var allRequired = true; //variable gets false if an required field is empty
    var allRequiredPaths = true; //variable gets false if an optional field is filled in that has required properties
    var allInputs = []; //all input ids from same panel
    var msgs = [];

    inputFields.forEach(function (a) {
        var compareId = a.slice(0, a.indexOf("_"));
        if (compareId === id.toString()) { //only inputs from same panel
            allInputs.push(a);
        }
    });

    allInputs.forEach(function (a) {
        var value = $("#" + a).val();
        var path = a.replace(/\-/g, ".").replace(/ /g, "").split('_');
        var optional = path[3];
        var rootOptional = path[4];
        path = path[2];
        if ((value === undefined || value === null || value === "") && (optional === "false" && rootOptional === "false")) { //if variable is not optional but empty
            allRequired = false;
        }
        if ((value != undefined && value != null && value != "") && rootOptional === "true") {
            //check if all other paths and sub paths are filled in - else false allRequiredPaths
            var bAllPaths = [];
            var bPaths = path.split('.');
            while (bPaths.length > 1) {
                bPaths.pop();
                bAllPaths.push((bPaths.join(".")))
            }
            allInputs.forEach(function (b) {
                var bPath = b.replace(/\-/g, ".").replace(/ /g, "").split('_');
                var bOptional = bPath[3];
                var bRootOptional = bPath[4]
                bPath = bPath[2];
                var len = (bPath.split("."));
                len = len.length;
                var bValue = $("#" + b).val();
                for (var z = 0; z < bAllPaths.length; z++) {
                    var len2 = bAllPaths[z].split(".");
                    len2 = len2.length;
                    if (bOptional == "false" && bRootOptional == "true" && (bPath.indexOf(bAllPaths[z]) >= 0) && len === len2 + 1) {
                        if (bValue === undefined || bValue === "" || bValue == null) {
                            msgs.push(bPath.replace(".", ":"));
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
        if (!(value === undefined || value === null || value === "")) {

            var temp = path.split(".");
            while (temp.length > 1) {
                temp.pop();
                var x = temp.join(".") + ".@type";
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
            msgs = unique(msgs);
            //msgs.length
            send_snackbarMSG("Please also fill in " + msgs.join(", "), 3000 + (msgs.length - 1) * 1000);
        }
        return null;
    }
}


function copyStr(str) {
    var dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.setAttribute("id", "dummy_id");
    dummy.setAttribute('value', str);
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

function unique(list) {
    var result = [];
    $.each(list, function (i, e) {
        if ($.inArray(e, result) == -1) result.push(e);
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
    var pList = path.split('.');
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

function httpGetHeaders(url, headers, callback){
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

