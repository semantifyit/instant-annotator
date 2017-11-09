![semantify.it](https://semantify.it/images/logo.png)

# Instant Annotation for Semantify.it

# Description
The instant-annotator is a leightweight editor from [semantify.it](www.semantify.it) to annotate things like Event, Recipe, Article .. with the [google recommended](https://developers.google.com/search/docs/guides/) fields.

# Add The Instant-Annotator To Your Website
```html
<div class="IA_Box" data-dshash="HASH" data-sub="SUBCLASSES" data-btns="BTNS" data-title="TITLE"></div>
```
**HASH**: The hash of the type (see below)<br />
**SUBCLASSES**:Either "true" or "false". If this is set to "true", an optional dropdown with all sub classes will appear (For example: for the type Event a dropdown with Festival, FoodEvent,..)<br />
**BTNS**: The buttons (see below)<br />
**TITLE**: The title of the box<br />


# Hashes 
- [Article](https://developers.google.com/search/docs/data-types/articles)
:

- [Event](https://developers.google.com/search/docs/data-types/events)
:

- [JobPosting](https://developers.google.com/search/docs/data-types/job-postings)
:

- [LocalBusiness](https://developers.google.com/search/docs/data-types/local-businesses)
:

- [Recipe](https://developers.google.com/search/docs/data-types/recipes)
:

# Buttons
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
You can also create your own buttons. Therefore you need: <br />
- The button element:<br />
```html
<div class="IA_Btn" data-name="NAME" data-icon="ICON" data-createjsonld="CREATE" data-onclick=yourFunction></div>
```
Where NAME is the name of your button, ICON is the icon of your button (use the name of [material icons](https://material.io/icons/)), CREATE is "true" or "false" (if set to true, a jsonLd result is created) and  yourFunction is your function.
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
