import $ from 'jquery';

import { makeArray, syntaxHighlight, copyStr, httpPostJson, createInjectionCodeForURL, httpGetHeaders, remove, send_snackbarMSG_fail, httpPatchJson, send_snackbarMSG } from "./util";
import { semantifyUrl, semantifyShortUrl } from "./globals";

let semantifyToken;

var wordPressSaveBtn = {
    "name": "Save",
    "icon": "save",
    "createJsonLD": true,
    "onclick": function (res) {
        var bulk = [];
        var toSend = {};
        toSend["content"] = res.jsonLd;
        toSend["dsHash"] = res.dsHash;
        bulk.push(toSend);
        if (res.jsonLd == null) {
            return;
        }
        var iasemantify_saveWebsiteUID = res.options.smtfySemantifyWebsiteUID;
        var iasemantify_saveWebsiteSecret = res.options.smtfySemantifyWebsiteSecret;
        var annUID = $('#panel-' + res.panelId).data("smtfyAnnId");
        var annWebId = $('#panel-' + res.panelId).data("smtfyWebId");
        var annWebSecret = $('#panel-' + res.panelId).data("smtfyWebSecret");
        if (annUID) {
            //update
            var header = {
                'website-secret': annWebSecret
            };

            httpPatchJson(semantifyUrl + "/api/annotation/uid" + "/" + annUID, header, {"content": res.jsonLd}, function (patchRes) {
                if (patchRes && patchRes.statusText !== "Not Found" && patchRes.statusText !== "Forbidden") {
                    if (window.is_typo3) {
                        $.ajax({
                            type: "post",
                            url: window.myAjax.ajaxurl,

                            data: {
                                action: "iasemantify_refresh_cache",
                            },

                            success: function (res) {
                                send_snackbarMSG("Successfully updated Annotation");
                            },
                            error: function (err) {
                                send_snackbarMSG_fail("An error occurred while saving to typo3")
                            }
                        });
                    } else {
                        send_snackbarMSG("Successfully updated Annotation");
                    }
                } else {
                    send_snackbarMSG_fail("An error occurred. Please check your semantify api-key!")
                }
            });
        } else {
            //save
            var header = {
                'website-secret': iasemantify_saveWebsiteSecret
            };
            httpPostJson(semantifyUrl + "/api/annotation/" + iasemantify_saveWebsiteUID, header, bulk, function (saveRes) {
                if (saveRes && !saveRes.message) {
                    send_snackbarMSG("Successfully saved Annotation to semantify.it");
                    //$("#panel-footer-btn-Save-" + res.panelId).prop('disabled', true);

                    var ann_id = saveRes[0]["UID"];
                    $('#panel-' + res.panelId)
                        .data("smtfyAnnId", ann_id)
                        .data("smtfyWebId", iasemantify_saveWebsiteUID)
                        .data("smtfyWebSecret", iasemantify_saveWebsiteSecret);

                    var post_id = $('#ia-data').attr("data-post_id");
                    var nonce = $('#ia-data').attr("data-nonce");

                    $.ajax({
                        type: "post",
                        url: window.myAjax.ajaxurl,
                        data: {
                            action: "iasemantify_push_ann",
                            post_id: post_id,
                            nonce: nonce,
                            ann_id: ann_id,
                            ds_hash: res.dsHash,
                            web_id: iasemantify_saveWebsiteUID,
                            web_secret: iasemantify_saveWebsiteSecret,
                        },
                        success: function (res) {
                        },
                        error: function (err) {
                            send_snackbarMSG_fail("An error occurred while saving to " + (window.is_typo3 ? "typo3" : "wordpress"));
                        }
                    });
                } else {
                    send_snackbarMSG_fail("An error occurred. Please check your semantify api-key!"+ " ("+saveRes.message+")")
                }
            });
        }
    }
};

var wordPressDeleteBtn = {
    "name": "Delete",
    "icon": "close",
    "createJsonLD": false,
    "onclick": function (res) {
        var filled = $('#panel-' + res.panelId).data("smtfyAnnId");
        var annWebId = $('#panel-' + res.panelId).data("smtfyWebId");
        var annWebSecret = $('#panel-' + res.panelId).data("smtfyWebSecret");
        var result;
        remove(window.IA_currently_added_annotations, filled);
        window.IA_delete_id_whitelist.push(filled);
        //console.log($('#ia_label_checkbox_'+filled).length);
        //if($('#ia_label_checkbox_'+filled).length!==0){
        //    $('#ia_label_checkbox_'+filled).css('color','');
        //    $('#ia_add_ann_'+filled).prop('disabled',false);
        //}
        if (!filled) {
            result = true;
        } else {
            result = confirm("Do you really want to delete this annotation?");
        }

        if (result) {
            $("#panel-" + res.panelId).hide(500);

            var post_id = $('#ia-data').attr("data-post_id");
            var nonce = $('#ia-data').attr("data-nonce");

            $.ajax({
                type: "post",
                url: window.myAjax.ajaxurl,
                data: {
                    action: "iasemantify_delete_ann",
                    post_id: post_id,
                    nonce: nonce,
                    ann_id: res.annId,
                    ds_hash: res.dsHash || 'NO_DS',
                    web_id: annWebId,
                    web_secret: annWebSecret,
                },
                success: function (res) {
                },
                error: function (err) {
                    send_snackbarMSG_fail("An error occurred while deleting from wordpress")
                }
            });
        }
    }
};

var copyBtn = {
    "name": "Copy",
    "icon": "content_copy",
    "createJsonLD": true,
    "onclick": function (resp) {
        if (resp.jsonLd)
            copyStr(JSON.stringify(resp.jsonLd, null, 2));
    }
};

var deleteBtn = {
    "name": "Close",
    "icon": "close",
    "createJsonLD": false,
    "onclick": function (resp) {
        $("#panel-" + resp.panelId.toString()).hide();
    }
};

var clearBtn = {
    "name": "Clear",
    "icon": "delete",
    "onclick": function (resp) {
        resp.inputFields.forEach(function (i) {
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

        var header = {
            'website-secret': resp.options.smtfySemantifyWebsiteSecret
        };

        httpPostJson(semantifyUrl + "/api/annotation/" + resp.options.smtfySemantifyWebsiteUID, header, bulk, function (saveRes) {
            console.log(saveRes);
            if ( saveRes && saveRes[0] && saveRes[0]["UID"]) {

                snackBarOptions["content"] = "Successfully saved Annotation to semantify.it";
                $.snackbar(snackBarOptions);

                var annUrl = semantifyShortUrl + saveRes[0]["UID"];
                var dummy = document.createElement("div");
                document.body.appendChild(dummy);
                dummy.setAttribute("id", "IA_preview_id");
                $('#IA_preview_id').append(
                    '<div class="bootstrap semantify semantify-instant-annotations">' +
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

                    //Semantify.getWebsites(semantifyToken,function (websiteRes) {
                    httpGetHeaders(semantifyUrl + "/api/website", {'Authorization': 'Bearer ' + semantifyToken}, function (websiteRes) {
                        if (websiteRes) {
                            $('#IA_loginSection').after('<div class="list-group" id="IA_my_websites"><h4>Your websites: (Select one to save your annotation to) </h4> </div>');
                            websiteRes.forEach(function (ele) {

                                $('#IA_my_websites').append('<button type="button" class="list-group-item list-group-item-action" id="IA_' + ele["uid"] + '" style="padding: 5px 0">' + ele["name"] + ' (' + ele["domain"] + ')' + '</button>');
                                $('#IA_' + ele["uid"]).click(function () {
                                    $('#IA_my_websites').slideUp(100);

                                    console.log("ele", ele);
                                    var header = {
                                        'website-secret': ele["secret"]
                                    };

                                    //Semantify.saveAnnotationToWebsite(bulk, ele["uid"], ele["secret"], function (newSaveRes) {
                                    httpPostJson(semantifyUrl + "/api/annotation/" + ele["uid"], header, bulk, function (newSaveRes) {
                                        console.log(newSaveRes);
                                        if (newSaveRes && newSaveRes["0"] && newSaveRes["0"]["UID"]) {

                                            console.log("saved", newSaveRes);

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
                        '<button type="button" class="btn button-sti-red" id="IA_loginBtn" style="margin:0 10px 0 0;padding:6px 30px; line-height:24px;">Login</button>' +
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

                        //Semantify.login(credentials, function (loginResp) {
                        httpPostJson(semantifyUrl + "/api/login", undefined, credentials, function (loginResp) {
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
                snackBarOptions["content"] = "There was an error saving annotation to semantify.it";
                $.snackbar(snackBarOptions);
            }
        });
    }
};

var previewBtn = {
    "name": "Preview",
    "icon": "find_in_page",
    "createJsonLD": true,
    "onclick": function (resp) {
        if (resp.jsonLd === null) {
            return;
        }
        var dummy = document.createElement("div");
        document.body.appendChild(dummy);
        dummy.setAttribute("id", "preview_id");
        $('#preview_id').append(
            '<div class="bootstrap semantify semantify-instant-annotations">' +
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
            '</div>' +
            '</div>'
        );
        $('#preview_textArea').html(syntaxHighlight(JSON.stringify(resp.jsonLd, null, 2)));
        $('#previewModal')
            .modal()
            .on('hidden.bs.modal', function () {
                $(this).remove();
            });
        $('#IA_simple_preview_copy').click(function () {
            copyStr(JSON.stringify(resp.jsonLd, null, 2));
        });

    }
};

var defaultBtns = [previewBtn, clearBtn, saveBtn];

var wpDefaultBtns = [previewBtn, wordPressSaveBtn, wordPressDeleteBtn];

function getButtons(btnString) {
    var buttons = [];
    switch (btnString) {
        case "no" :
            buttons = [];
            break;
        case "default":
        case undefined:
        case null:
            buttons = defaultBtns.slice(); //to pass by value and not reference
            break;
        case "wp_delete":
            buttons = [wordPressDeleteBtn];
            break;
        case "wp_default":
            buttons = wpDefaultBtns.slice(); //to pass by value and not reference
            break;
        default:
            var buttonsArray = btnString.split("+");
            buttonsArray.forEach(function (b) {
                switch (b) {
                    case "preview":
                        buttons.push(previewBtn);
                        break;
                    case "clear":
                        buttons.push(clearBtn);
                        break;
                    case "delete":
                        buttons.push(deleteBtn);
                        break;
                    case "save":
                        buttons.push(saveBtn);
                        break;
                    case "copy":
                        buttons.push(copyBtn);
                        break;
                    case "wpsave":
                        buttons.push(wordPressSaveBtn);
                        break;
                }
            });
    }
    return buttons;
}

function parseButtons(userButtons){
    let buttons = [];
    for(let button of makeArray(userButtons)) {
        if (typeof button === 'string') {
            buttons = buttons.concat(getButtons(button));
        } else {
            buttons.push(button);
        }
    }
    return buttons;
}

export {
    parseButtons
}
