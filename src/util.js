import $ from 'jquery';

import { semantifyUrl, semantifyShortUrl } from "./globals";

function removeNS(str) {
    return str.split(':')[1];
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

function send_snackbarMSG_fail(message) {
    send_snackbarMSG(message, 5000, true);
}

function send_snackbarMSG(message, duration) {
    var options = {
        content: '<table class="snackbar-table"><td><i class="material-icons snackbar-icon">info</i><span>  ' + message + '</span></td></table>', // text of the snackbar
        style: "toast",
        timeout: duration ? duration : 4000,
        htmlAllowed: true,
        onClose: function () {
        }
    };
    $.snackbar(options);
}

function remove(arr, what) {
    var found = arr.indexOf(what);

    while (found !== -1) {
        arr.splice(found, 1);
        found = arr.indexOf(what);
    }
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

function httpPostJson(url, headers, json, cb) {
    httpCall("POST", url, 'application/json ; charset=utf-8', headers, json, cb);
}

function httpPatchJson(url, headers, json, cb) {
    httpCall("PATCH", url, 'application/json ; charset=utf-8', headers, json, cb);
}

function httpCall(method, url, contentType, headers, json, cb) {
    $.ajax({
        type: method,
        contentType: contentType,
        headers: headers,
        url: url,
        data: JSON.stringify(json),
        success: function (data) {
            cb(data);
        },
        error: function (data) {
            cb(data);
        }
    });
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function flatten(o) {
    var prefix = arguments[1] || "", out = arguments[2] || {}, name;
    for (name in o) {
        if (o.hasOwnProperty(name)) {
            typeof o[name] === "object" ? flatten(o[name], prefix + name + '.', out) :
                out[prefix + name] = o[name];
        }
    }
    return out;
}

function helperRemove(str) {
    if (str.indexOf(':') != -1) {
        return str.substr(str.indexOf(':') + 1);

    } else {
        return str;
    }
}

function containsArray(obj) {
    var queue = [obj],
        found = false;

    while (!found && queue.length) {

        var o = queue.shift();

        found = Object.keys(o).some(function (k) {
            if (k!=='@type' && o[k] instanceof Array && k!=='@context')
                return true;

            if (o[k] !== null && typeof o[k] === 'object')
                queue.push(o[k]);
        });

    }
    return found;
}

function stripHtml(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function syntaxHighlight(json) {
    if(typeof json === 'object'){
        json=JSON.stringify(json, null, 2);
    }
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

function makeArray(ele) {
    return Array.isArray(ele) ? ele : [ele];
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

const memoize = (fn) => {
    const cache = {};
    return (...args) => {
        const n = JSON.stringify(args);
        if (n in cache) {
            return cache[n];
        } else {
            const result = fn(...args);
            cache[n] = result;
            return result;
        }
    };
};

const memoizeCb = (fn) => {
    const cache = {};
    const func = (...args) => {
        const cb = args.pop();
        const n = JSON.stringify(args);
        if (cache[n] && cache[n].ready) {
            cb(cache[n].data);
        } else if(cache[n] && !cache[n].ready) {
            setTimeout(() => func(...args, cb), 50);
        } else {
            cache[n] = { ready: false, data: null };
            fn(...args, (result) => {
                cache[n].ready = true;
                cache[n].data = result;
                cb(result);
            });
        }
    };
    return func;
};

function idSel(str) {
    return '[id="' + str + '"]'
}

function propName(str) {
    return str.startsWith('schema') ? removeNS(str) : str;
}

function fromEntries (iterable) {
    return [...iterable].reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj
    }, {})
}


export {
    removeNS,
    unique,
    htmlList,
    remove,
    set,
    clone,
    httpCall,
    httpPostJson,
    httpPatchJson,
    httpGet,
    send_snackbarMSG,
    send_snackbarMSG_fail,
    flatten,
    helperRemove,
    containsArray,
    stripHtml,
    syntaxHighlight,
    makeArray,
    copyStr,
    createInjectionCodeForURL,
    httpGetHeaders,
    memoize,
    memoizeCb,
    idSel,
    propName,
    fromEntries
}