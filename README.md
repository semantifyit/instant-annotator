![semantify.it](https://semantify.it/images/logo.png)

# Instant Annotation

The Instant-Annotator is a lightweight editor to create [schema.org](schema.org) annotations. It is used to annotate things like events, recipes, articles .. in regards to the [recommended properties by google](https://developers.google.com/search/docs/guides/).

To use it simply fill in at least all required fields (all fields above optional) and hit Save. In case of success a window will open showing you that the JSON-LD annotation was automatically saved to [semantify.it](semantify.it) and thus can be accessible by a short url (eg. smtfy.it/abcde).
Additionally you can add the just created annotation to your semantify account by simply using the login fields in this new window. Just enter your semantify credentials, select a website you want to save the annotation to and your done. The next time you visit you semantify.it account, you will see that annotation under your selected website.

### How can I add even more information to my annotation

If you can't find an appropriate field for your information, you can copy and edit your annotation on your own. Make sure that you use types and properties provided by [schema.org](schema.org). Keep in mind that all fields that are currently listed in the Instant-Annotation are the only fields that will be read by Google.

### How does it work?

The Instant-Annotator uses so called domainspecifications. Those are customisable restrictions on [schema.org](schema.org) types and its properties. Those domain specification provide the information of required and optional fields, as well as the ranges of schema.org properties.


# Adding The Instant-Annotator To Your Website

In case you want to customise the Instant-Annotator, or just simply have easy access to it on your own website, we have provided to possibility to do just that.

### Javascript Dependencies
Fist off you will need a few mandatory javascript dependencies:

* [jquery](https://code.jquery.com/) JS
* [snackbarjs](https://cdnjs.com/libraries/snackbarjs) JS + CSS
* [moment.js](https://cdnjs.com/libraries/moment.js/) JS
* [bootstrap](https://www.bootstrapcdn.com/) JS + CSS
* [bootstrap-datetimepicker](https://cdnjs.com/libraries/bootstrap-datetimepicker) JS

And finnally the Instant-Annotator itself:

`https://raw.githubusercontent.com/semantifyit/instant_annotator/master/javascript/instantAnnotations.js`

Make sure that when you add the instantAnnotation.js script in your html to add a `defer` as in `<script defer src="...`. This makes sure that the file is loaded after the html document is fully created. It is needed because the js file needs to go through the HTML document to find where to add the boxes.
If you don't want to defer the loading you would have to add a

```html
<scipt>
IA_Init();
</script>
```

to the end of your html file. Or simply call the `function IA_Init();` after creating the code for the boxes (see next section).

### CSS Classes

Of course CSS classes are optional, but without the Instant Annotation Boxes wouldn't look like anything.
In addition to those listed with the JS Dependencies:

* [bootstrap-material-design](https://cdnjs.com/libraries/bootstrap-material-design)

## Adding boxes

It is fairly easy to add boxes to your html
```html
<div class="IA_Box" data-dsname="Name_of_the_domainspecification"></div>
```

To specify which domainspecification should be attributed to the box either the field `data-dsname` or has to be edited or `data-dshash` has to be present.

### Domainspecifications with their hashes:
- [SimpleArticle](https://developers.google.com/search/docs/data-types/articles)
:H1TlMn-4M1f
- [SimpleEvent](https://developers.google.com/search/docs/data-types/events)
:SyqlG3b4Mkf
- [SimpleJobPosting](https://developers.google.com/search/docs/data-types/job-postings)
:rkhlM3-EGyM
- [SimpleLocalBusiness](https://developers.google.com/search/docs/data-types/local-businesses)
:Byigf2ZEfJf
- [SimpleRecipe](https://developers.google.com/search/docs/data-types/recipes)
:ry0lz3ZVf1G

It is furthermore possible to customize the box with the help of a few html data attributes:

required: (one of)

**data-dsname**: The name of the domainspecification<br />
**data-dshash**: The hash (id) of the domainspecification<br />

optional:

**data-sub**: Either "true" or "false". If this is set to "true", an optional dropdown with all sub classes of the schema.org type will appear (For example: for the type Event a dropdown with Festival, FoodEvent,..)<br />
**data-btns**: The buttons you want to add (see below)<br />
**data-title**: The title of the box<br />

## Buttons
- **clear**: Clears the all input fields.
- **copy**: Copies the resulting jsonLd to the clipboard.
- **preview**: Creates a preview of the resulting jsonLd.
- **save**: Saves the resulting jsonLd on semantify, shows a preview of the resulting jsonLd and a short link to the saved annotation on the server. It also gives you the option to save the result on your semantify account (login required). <br /> <br />
**multiple buttons can be added by seperating them with "+"**<br />
Example:
```html
data-btns="preview+clear+save+copy"
```
or
```html
data-btns="preview+clear"
```
### Default Buttons:
The default buttons are clear and save.
```html
data-btns="default"
```

### Creating Own Buttons:
You can also create your own buttons with their own onclick function. Therefore you need: <br />
- The button element:<br />
```html
<div class="IA_Btn" data-name="NAME" data-icon="ICON" data-createjsonld="CREATE" data-onclick=yourFunction></div>
```
Where NAME is the name of your button, ICON is the icon of your button (use the name of [material icons](https://material.io/icons/)), CREATE is "true" or "false" (if set to true, a jsonLd result is created) and  yourFunction is the function that should be called onclick.
- The javascript code:<br />
```html
<script>
function yourFunction(response){
                    console.log(response);
                    console.log(response["panelId"]);
                    console.log(response["jsonLd"]);
                }
<script>
```
The response contains the id of the box and the jsonLD if data-createJsonLD is set to "true". <br />
**Example:**<br />
```html
<div class="IA_Box" data-dshash="Z1wBPe7" data-sub="true">
                <script>
                function downloadClick(response){
                    console.log("Download");
                    console.log(response);
                }
                function closeClick(response){
                    console.log("Close panel");
                    $("#panel-"+response["panelId"]).hide( "slow");
                }
                </script>
                <div class="IA_Btn" data-name="Download" data-icon="file_download" data-createjsonld="true" data-onclick=downloadClick></div>
                <div class="IA_Btn" data-name="Close" data-icon="close" data-createjsonld="false" data-onclick=closeClick></div>
</div>
```

To see a full example with custom buttons check out our demo webpage:

### [Example Web Page](https://semantifyit.github.io/ia)


![semantify.it](https://semantify.it/images/logo.png)

# Instant Annotation

The Instant-Annotator is a lightweight editor to create [schema.org](schema.org) annotations. It is used to annotate things like events, recipes, articles .. in regards to the [recommended properties by google](https://developers.google.com/search/docs/guides/).

To use it simply fill in at least all required fields (all fields above optional) and hit Save. In case of success a window will open showing you that the JSON-LD annotation was automatically saved to [semantify.it](semantify.it) and thus can be accessible by a short url (eg. smtfy.it/abcde).
Additionally you can add the just created annotation to your semantify account by simply using the login fields in this new window. Just enter your semantify credentials, select a website you want to save the annotation to and your done. The next time you visit you semantify.it account, you will see that annotation under your selected website.

### How can I add even more information to my annotation

If you can't find an appropriate field for your information, you can copy and edit your annotation on your own. Make sure that you use types and properties provided by [schema.org](schema.org). Keep in mind that all fields that are currently listed in the Instant-Annotation are the only fields that will be read by Google.

### How does it work?

The Instant-Annotator uses so called domainspecifications. Those are customisable restrictions on [schema.org](schema.org) types and its properties. Those domain specification provide the information of required and optional fields, as well as the ranges of schema.org properties.


# Adding The Instant-Annotator To Your Website

In case you want to customise the Instant-Annotator, or just simply have easy access to it on your own website, we have provided to possibility to do just that.

### Javascript Dependencies
Fist off you will need a few mandatory javascript dependencies:

* [jquery](https://code.jquery.com/) JS
* [snackbarjs](https://cdnjs.com/libraries/snackbarjs) JS + CSS
* [moment.js](https://cdnjs.com/libraries/moment.js/) JS
* [bootstrap](https://www.bootstrapcdn.com/) JS + CSS
* [bootstrap-datetimepicker](https://cdnjs.com/libraries/bootstrap-datetimepicker) JS

And finnally the Instant-Annotator itself:

`https://raw.githubusercontent.com/semantifyit/instant_annotator/master/javascript/instantAnnotations.js`

Make sure that when you add the instantAnnotation.js script in your html to add a `defer` as in `<script defer src="...`. This makes sure that the file is loaded after the html document is fully created. It is needed because the js file needs to go through the HTML document to find where to add the boxes.
If you don't want to defer the loading you would have to add a

```html
<scipt>
IA_Init();
</script>
```

to the end of your html file. Or simply call the `function IA_Init();` after creating the code for the boxes (see next section).

### CSS Classes

Of course CSS classes are optional, but without the Instant Annotation Boxes wouldn't look like anything.
In addition to those listed with the JS Dependencies:

* [bootstrap-material-design](https://cdnjs.com/libraries/bootstrap-material-design)

## Adding boxes

It is fairly easy to add boxes to your html
```html
<div class="IA_Box" data-dsname="Name_of_the_domainspecification"></div>
```

To specify which domainspecification should be attributed to the box either the field `data-dsname` or has to be edited or `data-dshash` has to be present.

### Domainspecifications with their hashes:
- [SimpleArticle](https://developers.google.com/search/docs/data-types/articles)
:H1TlMn-4M1f
- [SimpleEvent](https://developers.google.com/search/docs/data-types/events)
:SyqlG3b4Mkf
- [SimpleJobPosting](https://developers.google.com/search/docs/data-types/job-postings)
:rkhlM3-EGyM
- [SimpleLocalBusiness](https://developers.google.com/search/docs/data-types/local-businesses)
:Byigf2ZEfJf
- [SimpleRecipe](https://developers.google.com/search/docs/data-types/recipes)
:ry0lz3ZVf1G

It is furthermore possible to customize the box with the help of a few html data attributes:

required: (one of)

**data-dsname**: The name of the domainspecification<br />
**data-dshash**: The hash (id) of the domainspecification<br />

optional:

**data-sub**: Either "true" or "false". If this is set to "true", an optional dropdown with all sub classes of the schema.org type will appear (For example: for the type Event a dropdown with Festival, FoodEvent,..)<br />
**data-btns**: The buttons you want to add (see below)<br />
**data-title**: The title of the box<br />

## Buttons
- **clear**: Clears the all input fields.
- **copy**: Copies the resulting jsonLd to the clipboard.
- **preview**: Creates a preview of the resulting jsonLd.
- **save**: Saves the resulting jsonLd on semantify, shows a preview of the resulting jsonLd and a short link to the saved annotation on the server. It also gives you the option to save the result on your semantify account (login required). <br /> <br />
**multiple buttons can be added by seperating them with "+"**<br />
Example:
```html
data-btns="preview+clear+save+copy"
```
or
```html
data-btns="preview+clear"
```
### Default Buttons:
The default buttons are clear and save.
```html
data-btns="default"
```

### Creating Own Buttons:
You can also create your own buttons with their own onclick function. Therefore you need: <br />
- The button element:<br />
```html
<div class="IA_Btn" data-name="NAME" data-icon="ICON" data-createjsonld="CREATE" data-onclick=yourFunction></div>
```
Where NAME is the name of your button, ICON is the icon of your button (use the name of [material icons](https://material.io/icons/)), CREATE is "true" or "false" (if set to true, a jsonLd result is created) and  yourFunction is the function that should be called onclick.
- The javascript code:<br />
```html
<script>
function yourFunction(response){
                    console.log(response);
                    console.log(response["panelId"]);
                    console.log(response["jsonLd"]);
                }
<script>
```
The response contains the id of the box and the jsonLD if data-createJsonLD is set to "true". <br />
**Example:**<br />
```html
<div class="IA_Box" data-dshash="Z1wBPe7" data-sub="true">
                <script>
                function downloadClick(response){
                    console.log("Download");
                    console.log(response);
                }
                function closeClick(response){
                    console.log("Close panel");
                    $("#panel-"+response["panelId"]).hide( "slow");
                }
                </script>
                <div class="IA_Btn" data-name="Download" data-icon="file_download" data-createjsonld="true" data-onclick=downloadClick></div>
                <div class="IA_Btn" data-name="Close" data-icon="close" data-createjsonld="false" data-onclick=closeClick></div>
</div>
```

To see a full example with custom buttons check out our demo webpage:

### [Example Web Page](https://semantifyit.github.io/ia)


