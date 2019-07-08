![semantify.it](https://semantify.it/images/logo.png)

# Instant Annotation

The Instant-Annotator is a lightweight editor to create [schema.org](schema.org) annotations. It is used to annotate things like events, recipes, articles .. in regards to the [recommended properties by google](https://developers.google.com/search/docs/guides/).

To use it simply fill in at least all required fields (all fields above optional) and hit Save. In case of success a window will open showing you that the JSON-LD annotation was automatically saved to [semantify.it](semantify.it) and thus can be accessible by a short URL (eg. smtfy.it/abcde).
Additionally, you can add the just created annotation to your semantify account by simply using the login fields in this new window. Just enter your semantify credentials, select a website you want to save the annotation to and your done. The next time you visit you semantify.it account, you will see that annotation on your selected website.

## Adding The Instant-Annotator To Your Website

### CSS

When you download the package, just include the css file:

```html
<link rel="stylesheet" href="./css/instantAnnotations.css"/>
```

### Javascript

For the javascript file you have 2 options: Either include the bundled file that includes all dependencies or
the standalone file and add all js dependencies manually.

With Bundle:
```html
<script src="./dist/instantAnnotation.bundle.js"></script>
```

Standalone:
```html
<script src="./dist/instantAnnotation.js"></script>
```


#### Javascript Dependencies -- OPTIONAL

>This plugin depends on few javascript libraries. They are bundled automatically in the `.bundle.js` file, but if you want to load them by yourself, you could also do it.
* [jquery](https://code.jquery.com/) 
* [snackbarjs](https://cdnjs.com/libraries/snackbarjs) 
* [moment.js](https://cdnjs.com/libraries/moment.js/) 
* [bootstrap](https://www.bootstrapcdn.com/) 
* [bootstrap-datetimepicker](https://cdnjs.com/libraries/bootstrap-datetimepicker) 
* [semantify-api-js](https://github.com/semantifyit/semantify-api-js) 


```html
/* jQuery */
<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
/* bootstrap */
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
/* bootstrapMaterialDesign */
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-material-design/0.5.9/js/material.min.js"></script>
/* snackbar */
<script src="https://cdnjs.cloudflare.com/ajax/libs/snackbarjs/1.1.0/snackbar.min.js"></script>
/* moment */
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
/* datepicker */
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min.js"></script>
```

See examples/withBundle.html, where all dependencies are loaded manually.

## Adding boxes

It is fairly easy to add boxes to your html

HTML: 
```html
<div class="semantify-instant-annotations">
    <div id="myIABox"></div>
</div>
```

The inner div is an instance of a Instant Annotation box.
The outer div is for our css to work, make sure your boxes are surrounded by this div (or that css class).

JavaScript:
```js
InstantAnnotation.createIABox('myIABox', 'w8Ki-xnbG'); // html-id, domainSpecification-hash
```

To specify which domainspecification should be attributed to the box the 2nd function parameter has to be changed.

## Options
You can further customize the boxes using a options object:

```js
InstantAnnotation.createIABox('myIABox', 'w8Ki-xnbG', options);
```

The possible options are:
- title: string, the title of the box,
- panelColClass: string, css class(es) to add to the main bootstrap panel (eg. change col classes, width, ..),
- withSubClassSelection: boolean, allow the selection of subclassed (default is true)
- annotation: object, fill the box with a preexisting annotation
- smtfyAnnotationUID: string, fill the box with a semantify annotation,
- smtfySemantifyWebsiteUID: string, for save button, to which semantify website (uid) to save to
- smtfySemantifyWebsiteSecret: string, same as above, only website secret

Example:
```js
InstantAnnotation.createIABox('myIABox', 'w8Ki-xnbG', {
    title: "Hello World",
    panelColClass: "fullwidth", // define fullwidth class in css
    withSubClassSelection: true,
    smtfyAnnotationUID: "some semantify annotation uid",
    smtfySemantifyWebsiteUID: "some semantify website uid",
    smtfySemantifyWebsiteSecret: "some semantify website secret",
});
```

### Buttons
Buttons can be changed and selected via the options buttons field.

The predefined buttons:
- **clear**: Clears the all input fields.
- **copy**: Copies the resulting jsonLd to the clipboard.
- **preview**: Creates a preview of the resulting jsonLd.
- **save**: Saves the resulting jsonLd on semantify, shows a preview of the resulting jsonLd and a short link to the saved annotation on the server. It also gives you the option to save the result on your semantify account (login required). <br /> <br />

To select the buttons, provide the button string with the options obj, for multiple make an array:

```js
 const options = {
    buttons: ['clear', 'save']
 }
```

In addition to or instead of the default buttons, new custom buttons can be added via the options object.
To do this add new object to buttons array.

```js
const myButton = {
    name: "Alert",
    icon: "add_alert", // some icon from https://material.io/tools/icons/?style=baseline
    createJsonLD: true, // if the button should trigger the creation of the annotation
    onclick: function (res) {
        alert("Your annotation: " + JSON.stringify(res.jsonld));
    },
};

const options = {
  buttons: ['preview', myButton],
}
```

### CallBack
You can also add a callback to the function call, to know when the box is finished creating:
```js
InstantAnnotation.createIABox(htmlId, dshash, options, function(){
    console.log('finished box');
});
```

##About

### How can I add even more information to my annotation

If you can't find an appropriate field for your information, you can copy and edit your annotation on your own. Make sure that you use types and properties provided by [schema.org](schema.org). Keep in mind that all fields that are currently listed in the Instant-Annotation are the only fields that will be read by Google.

### How does it work?

The Instant-Annotator uses so-called domain specifications. Those are customizable restrictions on [schema.org](schema.org) types and its properties. Those domain specifications provide the information of required and optional fields, as well as the ranges of schema.org properties.

### How can I add even more information to my annotation

If you can't find an appropriate field for your information, you can copy and edit your annotation on your own. Make sure that you use types and properties provided by [schema.org](schema.org). Keep in mind that all fields that are currently listed in the Instant-Annotation are the only fields that will be read by Google.


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


To see a full example of instant annotation check out:

### [Example Web Page](https://semantifyit.github.io/ia)
