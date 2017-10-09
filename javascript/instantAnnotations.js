
var allDs;
var memoryProcess={};
var memoryInput={};

function create() {
    getSpecificDS();
}

function getSpecificDS() {
  $.getJSON("./json/classes.json", function(json){
        memoryInput["classes"] = json;
        console.log(json);
      });

    getAllDS(function (data) {
        allDs = data;
        var index = 0;
        var i = 0;
        data.forEach(function(item){
            var simpleDS = item['content'];
            if(!(simpleDS['schema:name'].includes('Simple'))){
                //return;                   //should be put in later
            }
            if(simpleDS['schema:name'] === 'SimpleEvent'){
                index = i;
            }
            var dsName = simpleDS['schema:name'].replace('Simple', '');
            $('#dsList').append('<option value=' + dsName+'>' + dsName + '</option>');
            i++;
        });

        $('#dsList')
            .prop('selectedIndex', index)
            .change(function () {
                changeSelectedDomainSpecification();
            });
        changeSelectedDomainSpecification();
    });
}


function changeSelectedDomainSpecification() {
    var selectedIndex = $('#dsList').prop('selectedIndex');
    var curDs = allDs[selectedIndex];
    var ds = curDs['content'];
    var dsName = ds['schema:name'].replace('Simple', '');
    memoryInput.domainSpecification=ds;
    ci_createAnnotationInputForm();

    $('#textArea').html(syntaxHighlight(JSON.stringify(ds, null, 2)));
}

function getAllDS(callback) { //return data
    $.ajax({
        type: 'GET',
        url: 'https://semantify.it/api/domainSpecification',
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
    var options = {
        htmlAllowed: true,
        style: 'toast',
        timeout: 3000
    };
    try {
        CopyToClipboard(id);
        options['content'] ='<table class="snackbar-table"><td><i class="material-icons snackbar-icon">content_paste</i><span>  Annotation copied into your clipboard.</span></td></table>',
        $.snackbar(options);
    } catch (err) {
        options['content'] = 'Failed to copy';
        $.snackbar(options);
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

//Step 1: create input form for dsv:class array
//handle header content and content handling
//active restricted class is in memoryProcess.actualRestrictedClass
function ci_createAnnotationInputForm() {
    var headingElement =  $('#ST2Heading'); //header element
    headingElement.html(''); //clear previous header content
    memoryProcess.actualRestrictedClass = memoryInput.domainSpecification["dsv:class"][0]; //save actual used restricted class
    if(memoryInput.domainSpecification["dsv:class"].length === 1){
        //only 1 restricted class in the DS root
        headingElement.html('<h4>Annotate '+memoryProcess.actualRestrictedClass["schema:name"]+'</h4>');
    } else {
        //multiple classes in DS root
        headingElement.html('<div class="row"><div class="col-md-1" style="padding-top: 6px;"><h4>Annotate</h4></div><div class="col-md-2"><select class="form-control input-myBackground" style="background-color: white !important; padding-bottom: 0px;" id="actualRestrictedClassSelector"></select></div></div>');
        for(var i = 0 ; i< memoryInput.domainSpecification["dsv:class"].length;i++ ){
            $('#actualRestrictedClassSelector').append('<option value="'+i+'">'+memoryInput.domainSpecification["dsv:class"][i]['schema:name']+'</option>');
        }
        $('#actualRestrictedClassSelector').change(function() {
            memoryProcess.actualRestrictedClass = memoryInput.domainSpecification["dsv:class"][$('#actualRestrictedClassSelector option:selected').val()];
            ci_createForm_restrictedClass();
        });
    }
    //in any case: create form for the first restricted class in the dsv:class array
    ci_createForm_restrictedClass()
}

//Step 2: create input form for a certain restricted class
function ci_createForm_restrictedClass() {
    var bodyElementName = 'ST2Content'; // content element name
    $('#'+bodyElementName).html(''); //clear previous content
    $('#'+bodyElementName).append('<div id="'+bodyElementName+'_properties_container">');
    ci_createPropertiesContainer(bodyElementName, memoryProcess.actualRestrictedClass, 0);
}

//Step 3: create properties container for a restricted class
function ci_createPropertiesContainer(rootElementName, restrictedClass, level) {

    var actualClassName = restrictedClass["schema:name"];
    var propertiesArray = restrictedClass["dsv:property"];

    //create memory variables
    memoryProcess[rootElementName]= {};
    memoryProcess[rootElementName].valueIdRegister = {}; //to add/delete input fields for properties
    memoryProcess[rootElementName].usedOptionalProperties = {}; //to store which optional properties are used

    //process every property
    $("#"+rootElementName+"_properties_container").html(''); //clear content first
    for(var i=0;i<propertiesArray.length;i++){
        ci_createPropertyInputSegment(actualClassName, propertiesArray[i], rootElementName, level);
    }
}

//step 4: append property segment in a property container
function ci_createPropertyInputSegment(actualClassName, restrictedProperty, rootElementName, level) {

    var propertyName = restrictedProperty["schema:name"];
    var isOptional = restrictedProperty["dsv:isOptional"];
    var multipleValuesAllowed = restrictedProperty["dsv:multipleValuesAllowed"];
    var containsRestrictedClass = ci_helper_containsRestrictedClassInExpectedTypeArray(restrictedProperty);

    //add container for this property
    $('#'+rootElementName+"_properties_container").append('<div id="'+rootElementName+'_'+propertyName+'_container" class="row propertyContainer">');

    if(multipleValuesAllowed){
        //if there are multiple values allowed the value container goes under the  property name
        $('#'+rootElementName+'_'+propertyName+'_container').append('<div id="'+rootElementName+'_'+propertyName+'_nameContainer" class="col-md-12 propertyNameContainer">');
        $('#'+rootElementName+'_'+propertyName+'_container').append('<div id="'+rootElementName+'_'+propertyName+'_inputAreaContainer" class="col-md-12">');

    } else if(containsRestrictedClass){
        //if there is a possible restricted class, put the input container also under the name
        $('#'+rootElementName+'_'+propertyName+'_container').append('<div id="'+rootElementName+'_'+propertyName+'_nameContainer" class="col-md-12 propertyNameContainer">');
        $('#'+rootElementName+'_'+propertyName+'_container').append('<div id="'+rootElementName+'_'+propertyName+'_inputAreaContainer" class="col-md-offset-1 col-md-11 containerBG">');

    } else {
        //there can be only 1 input for this property
        $('#'+rootElementName+'_'+propertyName+'_container').append('<div id="'+rootElementName+'_'+propertyName+'_nameContainer" class="col-md-3 propertyNameContainer">');
        $('#'+rootElementName+'_'+propertyName+'_container').append('<div id="'+rootElementName+'_'+propertyName+'_inputAreaContainer" class="col-md-9">');
    }

    //fill property name container
    $('#'+rootElementName+'_'+propertyName+'_nameContainer').html(ci_helper_createHTMLCodeForPropertyName(actualClassName,propertyName,rootElementName,isOptional,multipleValuesAllowed,level));


    //data
    if(isOptional){
        memoryProcess[rootElementName].usedOptionalProperties[propertyName] = true;
    }
    memoryProcess[rootElementName].valueIdRegister[propertyName] = [];
    //add propertyData in container as data
    $('#'+rootElementName+'_'+propertyName+'_container').data('propertyObject',restrictedProperty);

    //create one input container
    ci_addValueContainerToPropertyBody(propertyName,rootElementName,level);

}

function ci_addValueContainerToPropertyBody(propertyName,rootElementName,level) {

    var restrictedProperty = $('#'+rootElementName+'_'+propertyName+'_container').data('propertyObject');
    var isOptional = restrictedProperty["dsv:isOptional"];
    var multipleValuesAllowed = restrictedProperty["dsv:multipleValuesAllowed"];
    var expectedTypeArray = restrictedProperty["dsv:expectedType"];//ci_helper_getExpectedTypeArrayForPropertyObject(restrictedProperty);


    //get new value for new element
    var newID;
    if(memoryProcess[rootElementName].valueIdRegister[propertyName].length === 0){
        newID = 1;
    } else {
        newID = 1 + memoryProcess[rootElementName].valueIdRegister[propertyName][memoryProcess[rootElementName].valueIdRegister[propertyName].length-1];
    }
    //register id for new value
    memoryProcess[rootElementName].valueIdRegister[propertyName].push(newID);
    //append value container
    $('#'+rootElementName+'_'+propertyName+'_inputAreaContainer').append('<div class="row" id="'+rootElementName+'_'+propertyName+'_valueContainer_'+newID+'">');

    if(expectedTypeArray.length === 1){
        //if there is only 1 possible value type for this property
        if(multipleValuesAllowed){
            //delete value button needed
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-1 deleteContainer" id="'+rootElementName+'_'+propertyName+'_deleteContainer_'+newID+'">');
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-11" id="'+rootElementName+'_'+propertyName+'_inputContainer_'+newID+'">');
        } else {
            //no delete value button needed
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-12" id="'+rootElementName+'_'+propertyName+'_inputContainer_'+newID+'">');
        }
    } else{
        //if there are multiple value types for this property
        if(multipleValuesAllowed){
            //delete value button needed
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-1 deleteContainer" id="'+rootElementName+'_'+propertyName+'_deleteContainer_'+newID+'">');
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-2 " id="'+rootElementName+'_'+propertyName+'_valueTypeSelectorContainer_'+newID+'">');
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-9 " id="'+rootElementName+'_'+propertyName+'_inputContainer_'+newID+'">');
        } else {
            //no delete value button needed
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-2 " id="'+rootElementName+'_'+propertyName+'_valueTypeSelectorContainer_'+newID+'">');
            $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-10 " id="'+rootElementName+'_'+propertyName+'_inputContainer_'+newID+'">');
        }
        //append value type selection
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelectorContainer_'+newID).append('<select id="'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID+'" class="form-control input-myBackground">');
        //add options to value type for each expected value type
        for(var i=0;i<expectedTypeArray.length;i++){
            $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).append('<option>'+expectedTypeArray[i]["schema:name"]+'</option>');
        }
        //select first option element for expected type selection
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).prop('selectedIndex',0);
        //add data to dom element of select
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).data('containerElement','#'+rootElementName+'_'+propertyName+'_inputContainer_'+newID);
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).data('subContainerName',rootElementName+'_'+propertyName+'_subContainer_'+newID);
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).data('expectedTypeArray', expectedTypeArray);
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).data('propertyName',propertyName);
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).data('rootElementName',rootElementName);
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).data('valueTypeID',newID);
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).data('level',level);
        //set changeListener for expected type selection
        $('#'+rootElementName+'_'+propertyName+'_valueTypeSelector_'+newID).change(function() {
            ci_setPropertyInputToContainer(this, true);
        });
    }
    //add delete button if needed
    if(multipleValuesAllowed){
        $('#'+rootElementName+'_'+propertyName+'_deleteContainer_'+newID).append('<span class="double-margin"><a href="javascript:ci_userButton_removeValueContainerFromPropertyBody(\''+rootElementName+'\',\''+propertyName+'\',\''+newID+'\')" class="btn btn-danger btn-fab btn-fab-mini my-fab-info" data-toggle="tooltip" data-placement="top" title="delete this input field/element"  tabindex="-1" ><i class="material-icons my-fab-icon iconSmall">delete</i></a></span>');
        //append sub container for maybe used class input area
        $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-offset-1 col-md-11 containerBG" id="'+rootElementName+'_'+propertyName+'_subContainer_'+newID+'">');
    } else {

        //append sub container for maybe used class input area
        $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+newID).append('<div class="col-md-12 containerBG" id="'+rootElementName+'_'+propertyName+'_subContainer_'+newID+'">');
    }



    //bind data for process_setPropertyInputToContainer() in dom of select
    var inputContainerElement = '#'+rootElementName+'_'+propertyName+'_inputContainer_'+newID;
    $(inputContainerElement).data('containerElement',inputContainerElement);
    $(inputContainerElement).data('subContainerName',rootElementName+'_'+propertyName+'_subContainer_'+newID);
    $(inputContainerElement).data('expectedTypeArray', expectedTypeArray);
    $(inputContainerElement).data('propertyName',propertyName);
    $(inputContainerElement).data('rootElementName',rootElementName);
    $(inputContainerElement).data('valueTypeID',newID);
    $(inputContainerElement).data('level',level);

    ci_setPropertyInputToContainer(inputContainerElement, false); //create input field for first type
}

function ci_setPropertyInputToContainer(inputContainerElement, fromSelect) {
    inputContainerElement = $(inputContainerElement);
    var containerElement =  $(inputContainerElement.data('containerElement'));
    var subContainerElement =  $('#'+inputContainerElement.data('subContainerName'));
    var expectedTypeArray = inputContainerElement.data('expectedTypeArray');
    var rootElementName = inputContainerElement.data('rootElementName');
    var propertyName = inputContainerElement.data('propertyName');
    var valueTypeID = inputContainerElement.data('valueTypeID');
    var level = inputContainerElement.data('level');

    //get data of expected value type
    var expectedTypeData;
    if(fromSelect){
        var selectedExpectedTypeName = inputContainerElement.val();
        for(var i=0;i<expectedTypeArray.length;i++){
            if(expectedTypeArray[i]["schema:name"] === selectedExpectedTypeName){
                expectedTypeData = expectedTypeArray[i];
                break;
            }
        }
    } else {
        expectedTypeData = expectedTypeArray[0];
    }

    //clear content of container
    containerElement.html('');
    subContainerElement.html('');
    //further actions depend on the type (not name) of the expected value type
    switch (expectedTypeData['@type']){
    case "schema:DataType":
            //further actions depend on the name of the expected value type
        switch (expectedTypeData['schema:name']){
        case "Boolean":
            containerElement.append('<div class="checkbox form-group"><label><input type="checkbox" class="" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'"></label></div>');
            break;
        case "Date":
            containerElement.append('<input type="date" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" >');
            break;
        case "DateTime":
            containerElement.append('<input type="datetime-local" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" >');
            break;
        case "Time":
            containerElement.append('<input type="time" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" >');
            break;
        case "Number":
            containerElement.append('<input type="number" step="any" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" >');
            break;
        case "Float":
            containerElement.append('<input type="number" step="any" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" >');
            break;
        case "Integer":
            containerElement.append('<input type="number" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" >');
            break;
        case "Text":
            containerElement.append('<input type="text" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" placeholder="'+propertyName+'">');
            break;
        case "URL":
            containerElement.append('<input type="text" class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" placeholder="'+propertyName+'">');
            break;
        }
        break;
    case "schema:Class":
            //todo implement
        subContainerElement.append('schema:Class - '+expectedTypeData['schema:name']);
        alert("Your DomainSpecification contains 'schema:Class' as expected type for a property value. This is not supported in this editor to keep the user input procedure simple! Please use a DomainSpecification without 'schema:Class'.");
        break;
    case "dsv:RestrictedEnumeration":
        containerElement.append('<select class="form-control input-myBackground" id="'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID+'" >');
        for(var i=0; i<expectedTypeData["dsv:expectedEnumerationValue"].length; i++){
            $('#'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID).append('<option value="'+expectedTypeData["dsv:expectedEnumerationValue"][i]['schema:name']+'">'+expectedTypeData["dsv:expectedEnumerationValue"][i]['schema:name']+'</option>');
        }
        $('#'+rootElementName+'_'+propertyName+'_inputField_'+valueTypeID).prop('selectedIndex',0);
        break;
    case "dsv:RestrictedClass":
            // case undefined: //for expected types of restricted class
        ci_createClassAnnotationStructure(inputContainerElement.data('subContainerName'));
        ci_createPropertiesContainer(inputContainerElement.data('subContainerName'),expectedTypeData,(parseInt(level)+1)%3);
        break;
    default:
        break;

    }
}


function ci_createClassAnnotationStructure(rootElementName){
    var rootElement = $('#'+rootElementName);
    rootElement.append('<div id="'+rootElementName+'_properties_container">');
}


//new
//called from button listener
function ci_userButton_addValueContainerToPropertyBody(propertyName,rootElementName,level){
    send_snackbarMSG("Added input element for the Property "+propertyName+".", 3000);
    ci_addValueContainerToPropertyBody(propertyName,rootElementName,level);
    $('html, body').animate({
        scrollTop: $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+memoryProcess[rootElementName].valueIdRegister[propertyName][memoryProcess[rootElementName].valueIdRegister[propertyName].length-1]).offset().top
    }, 750);
}

//new
//called from button listener
function ci_userButton_removeValueContainerFromPropertyBody(rootElementName,propertyName, id){
    //check if there is only one element
    if(memoryProcess[rootElementName].valueIdRegister[propertyName].length<2){
        send_snackbarMSG("You can not delete the last input element for the Property "+propertyName+".", 3000);
    } else {
        send_snackbarMSG("Deleted input element for the Property "+propertyName+".", 3000);
        ci_removeValueContainerFromPropertyBody(rootElementName,propertyName, id);
        $('html, body').animate({
            scrollTop: $('#'+rootElementName+'_'+propertyName+'_valueContainer_'+memoryProcess[rootElementName].valueIdRegister[propertyName][memoryProcess[rootElementName].valueIdRegister[propertyName].length-1]).offset().top
        }, 750);
    }
}

//new
//if a property has multiple values enabled, it is possible to delete value elements, this is done here
function ci_removeValueContainerFromPropertyBody(rootElementName,propertyName, id){
    var index = $.inArray(parseInt(id),memoryProcess[rootElementName].valueIdRegister[propertyName]);
    if(index == -1){
        console.log("No element with id "+id+" to remove in process_removeValueContainerFromPropertyBody for property "+propertyName);
        return;
    } else {
        //register id out
        memoryProcess[rootElementName].valueIdRegister[propertyName].splice(index, 1 );
        //remove element
        $("#"+rootElementName+"_"+propertyName+'_valueContainer_'+id).remove();
    }
}

//new
//switch visibility for optional properties
function ci_propertyUsageSwitch(propertyName,rootElementName) {
    var used = memoryProcess[rootElementName].usedOptionalProperties[propertyName];
    if(used){
        memoryProcess[rootElementName].usedOptionalProperties[propertyName] = false;
        $('#'+rootElementName+'_'+propertyName+'_inputAreaContainer').slideUp(500);
        $('#'+rootElementName+'_'+propertyName+'_link').html('<i class="material-icons my-fab-icon iconSmall">visibility</i>');
        send_snackbarMSG("Property '"+propertyName+"' will not be used for the annotation.", 3000);
    } else {
        memoryProcess[rootElementName].usedOptionalProperties[propertyName] = true;
        $('#'+rootElementName+'_'+propertyName+'_inputAreaContainer').slideDown(500);
        $('#'+rootElementName+'_'+propertyName+'_link').html('<i class="material-icons my-fab-icon iconSmall">visibility_off</i>');
        send_snackbarMSG("Property '"+propertyName+"' is now being used for the annotation.", 3000);
    }
}

function ci_helper_getExpectedTypeObjectForClassName(className, expectedTypeArray){
    for(var i=0;i<expectedTypeArray.length;i++){
        if(className == expectedTypeArray[i]["schema:name"]){
            return expectedTypeArray[i];
        }
    }
    return null;
}

//checks if there is a restricted class in the expected types of a given restricted property
function ci_helper_containsRestrictedClassInExpectedTypeArray(restrictedProperty) {
    for(var i=0;i<restrictedProperty['dsv:expectedType'].length;i++){
        if(restrictedProperty['dsv:expectedType'][i]['@type'] === "dsv:RestrictedClass"){
            return true;
        }
    }
    return false;
}

function ci_helper_createHTMLCodeForPropertyName(className,propertyName,rootElementName,isOptional,multipleValuesAllowed,level){
    var htmlCode = '';
    //information button
      //htmlCode = htmlCode.concat('<span class="double-margin"><a href="javascript:subProcess_openModalPropertyInfo(\''+className+'\', \''+propertyName+'\')" class="btn btn-info btn-fab btn-fab-mini my-fab-info" data-toggle="tooltip" data-placement="top" title="Show description"  tabindex="-1" ><i class="material-icons my-fab-icon">info_outline</i></a></span>');
    //isOptional -> add button to show/hide value input section
    if(isOptional){
        htmlCode = htmlCode.concat('<span class="double-margin"><a id="'+rootElementName+'_'+propertyName+'_link" href="javascript:ci_propertyUsageSwitch(\''+propertyName+'\', \''+rootElementName+'\')" class="btn btn-warning btn-fab btn-fab-mini my-fab-info" data-toggle="tooltip" data-placement="top" title="hide/use this property for the annotation"  tabindex="-1" ><i class="material-icons my-fab-icon iconSmall">visibility_off</i></a></span>');
    }
    //property name
    htmlCode = htmlCode.concat('<span title="'+ cleanHtmlTags(subProcess_openModalPropertyInfo(className,propertyName)) +'" class="double-margin propertyName">'+propertyName+'</span>');
    //multipleValuesAllowed -> multiple values button to add new input field
    if(multipleValuesAllowed){
        htmlCode = htmlCode.concat('<span class="double-margin"><a href="javascript:ci_userButton_addValueContainerToPropertyBody(\''+propertyName+'\',\''+rootElementName+'\',\''+level+'\')" class="btn btn-success btn-fab btn-fab-mini my-fab-info" data-toggle="tooltip" data-placement="top" title="add another input field/element"  tabindex="-1" ><i class="material-icons my-fab-icon iconSmall">add</i></a></span>');
    }
    return htmlCode;
}


//new ST2 when a expected type for a class is changed, this callback is called
function ci_refreshActualSelectedClass(callingElement) {
    callingElement = $(callingElement);
    var selectedRestrictedClassName = callingElement.val();
    var headerElement = $(callingElement.data('headerElement'));
    var rootElementName = callingElement.data('rootElementName');
    var selectedRestrictedClassData = ci_helper_getExpectedTypeObjectForClassName(selectedRestrictedClassName, callingElement.data('expectedTypeArray'));
    if(headerElement != undefined){
        //heading
        headerElement.html('<h4>Annotate '+selectedRestrictedClassName+'<span class="double-margin"><a href="javascript:modal_openModalClassInfo(\''+selectedRestrictedClassName+'\')" class="btn btn-info btn-fab btn-fab-mini my-fab-info" tabindex="-1" ><i class="material-icons my-fab-icon">info_outline</i></a></span></h4>');
    }
    ci_createPropertiesContainer(rootElementName,selectedRestrictedClassData, 0);
}

function send_snackbarMSG(message, duration) {
    var options = {
        content: '<table class="snackbar-table"><td><i class="material-icons snackbar-icon">info</i><span>  ' + message + '</span></td></table>', // text of the snackbar
        style: "toast", // add a custom class to your snackbar
        timeout: duration, // time in milliseconds after the snackbar autohides, 0 is disabled
        htmlAllowed: true, // allows HTML as content value
        onClose: function () {
        } // callback called when the snackbar gets closed.
    };
    $.snackbar(options);
}

function subProcess_openModalPropertyInfo(className, propertyName) {
    var propertiesArray = memoryInput["classes"][className]['properties'];
    var description = "";
    for(var i=0;i<propertiesArray.length;i++){
        if(propertyName == propertiesArray[i].name){
            description = propertiesArray[i].description;
            break;
        }
    }
    console.log(description);
    return description;
}

function repairLinksInHTMLCode(htmlCode) {
    htmlCode = htmlCode.replace(/ href=\"\//g, ' href=\"https://schema.org/');
    htmlCode = htmlCode.replace(/<a /g, '<a target="_blank" ');
    return htmlCode;
}

function cleanHtmlTags(str) {
    return str.replace(/<(?:.|\n)*?>/gm, '');
}
