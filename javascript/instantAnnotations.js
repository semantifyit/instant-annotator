
var allDs;
var classesJson;
var classesReady = false;
var DSReady = false;
var panelId = 0;

var inputElements = [];
var outputJsonLd = {};

getData();

function getData() {
    call("https://semantify.it/assets/data/3.3/classes.json", function (data) {
        classesJson = data;
        classesReady = true;
    });
    call("https://semantify.it/api/domainSpecification", function (data) {
        allDs = data;
        DSReady = true;
    });
}

function IA_Create_Deafault(id){
    var btns = [
        {
            "name": "Copy",
            "onclick": function(){
                console.log("Copy");
            }
        },
        {
            "name": "Save",
            "onclick": function(){
                console.log("save");
            }
        }
    ];

    addBox(id, "59d8963100b7916b851f158d", btns);

    addBox(id, "59d8963100b7916b851f158d");
    addBox(id, "59d8963100b7916b851f158d");
    addBox(id, "59d8963100b7916b851f158d");
    addBox(id, "59d8963100b7916b851f158d");
    addBox(id, "59d8963100b7916b851f158d");
    addBox(id, "59d8963100b7916b851f158d");
}

function addBox(htmlId, dsId, buttons){
    if(!(classesReady && DSReady)){
        setTimeout(function(){
            addBox(htmlId, dsId, buttons);
        },500);
        return;
    }
    var curDs;
    for(var i in allDs){
        if(allDs.hasOwnProperty(i))
        if(allDs[i]["_id"] === dsId){
            curDs = allDs[i];
            break;
        }
    }
    var dsName = (curDs === undefined ? "DS not found" : curDs["name"]);

    $('#'+htmlId).append(
        '<div class="panel panel-info col-lg-3 col-md-4 col-sm-6" id="panel-' + panelId + '" style="margin: 10px; padding: 10px;" >'+
            '<div class="panel-heading sti-red"> ' +
                '<h3>' + dsName + '</h3>' +
            ' </div> ' +
            '<div class="panel-body" id="panel-body-"' + panelId + '>' +
                'asd'+
            '</div>'+
            '<div class="panel-footer text-center" id="panel-footer-' + panelId + '">' +
            '</div>'+
        '</div>');

    for(var j in buttons){
        if(buttons.hasOwnProperty(j)){
            (function(){    // because the onclick changes with each loop all buttons would call the same function
                var name = buttons[j]["name"];
                var onclick = buttons[j]["onclick"];
                $('#'+'panel-footer-'+panelId)
                    .append('<button class="btn button-sti-red " style="margin: 0 5px" >'+ name +'</button>')
                    .click(function() {
                        onclick();
                    });
            })();
        }
    }

    panelId++;
}


function call(url, callback) { //return data
    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        success: function (data) {
            callback(data);
        },
        error: function () {
            console.log('error');
        }
    });
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

function copy(id){
    try {
        CopyToClipboard(id);
        send_snackbarMSG("Annotation copied into your clipboard", 3000);
    } catch (err) {
        send_snackbarMSG("Failed to copy", 3000);
    }
    clearSelection();
}

function clearSelection() {
    if ( document.selection ) {
        document.selection.empty();
    } else if ( window.getSelection ) {
        window.getSelection().removeAllRanges();
    }
}

function CopyToClipboard(id) {
    var range;
    if (document.selection) {
        range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(id));
        range.select().createTextRange();
        document.execCommand('Copy');

    } else if (window.getSelection) {
        range = document.createRange();
        range.selectNode(document.getElementById(id));
        window.getSelection().addRange(range);
        document.execCommand('Copy');
    }
}

function strip(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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

function saveAnn(){
    var url = "https://semantify.it/api/annotation/";
    var apiKey = "ByYz_MJdb";

    var annObj = {};
    annObj["content"] = outputJsonLd;

    var options = {
        htmlAllowed: true,
        style: 'toast',
        timeout: 3000
    };

    var bulk = [];
    var toSend = {};
    toSend["content"] = outputJsonLd;

    bulk.push(toSend);

    $.ajax({
        type: "POST",
        dataType: 'json',
        url: url + apiKey,
        data: bulk,
        success: function (data) {
            options['content'] ='Saved annotation in semantify';
            console.log(data);
            $.snackbar(options);
        },
        error: function () {
            options['content'] = 'Failed to save Annotation in semantify';
            $.snackbar(options);
        }
    });
}

function set(obj, path, value) {
    var schema = obj;
    var pList = path.split('.');
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
        var elem = pList[i];
        if( !schema[elem] ) schema[elem] = {};
        schema = schema[elem];
    }
    schema[pList[len-1]] = value;
    return obj;
}

function hasProp(obj, path) {
    var schema = obj;
    var pList = path.split('.');
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
        var elem = pList[i];
        if( !schema[elem] ){
            return false;
        }
        schema = schema[elem];
    }
    return schema.hasOwnProperty(pList[len-1]);
}

function deleteProp(obj, path) {
    var schema = obj;
    var pList = path.split('.');
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
        var elem = pList[i];
        if( !schema[elem] ){
            return;
        }
        schema = schema[elem];
    }
    delete schema[pList[len-1]];
    return obj;
}