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
**multiple buttons can be added by seperating them with "+"**
Example:
```html
<div class="IA_Box" data-dshash="HASH" data-btns="preview+clear+save+copy" data-title="TITLE"></div>
```

<h3>asdf</h3>
