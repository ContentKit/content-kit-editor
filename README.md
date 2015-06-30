## ContentKit-Editor [![Build Status](https://travis-ci.org/bustlelabs/content-kit-editor.svg?branch=master)](https://travis-ci.org/bustlelabs/content-kit-editor)

ContentKit is a modern WYSIWYG editor supporting interactive cards. Try a
demo at [http://content-kit.herokuapp.com/](http://content-kit.herokuapp.com/).

ContentKit articles (we will use the term article, but any kind of content could
be authored) are built from models. Models represent rows of content, and can
be static or dynamic.

For example, the teardown of an article might look like:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 ┌──────────┐                                 │
│                                 │ Article  │                                 │
│                                 └──────────┘                                 │
│┌────────────────────────────────────────────────────────────────────────────┐│
││                              ┌──────────────┐                              ││
││                              │ MarkupModel  │                              ││
││                              └──────────────┘                              ││
││ <h2>One Weird Trick</h2>                                                   ││
│└────────────────────────────────────────────────────────────────────────────┘│
│┌────────────────────────────────────────────────────────────────────────────┐│
││                              ┌──────────────┐                              ││
││                              │  BlockModel  │                              ││
││                              └──────────────┘                              ││
││ <p>                                                                        ││
││   You will never guess what <i>happens</i>                                 ││
││   when these cats take a <b>bath</b>                                       ││
││ </p>                                                                       ││
│└────────────────────────────────────────────────────────────────────────────┘│
│┌────────────────────────────────────────────────────────────────────────────┐│
││                              ┌──────────────┐                              ││
││                              │  EmbedModel  │                              ││
││                              └──────────────┘                              ││
││ <img src="http://some-cdn.com/uploaded.jpg" />                             ││
││ <!-- this HTML is generated by the embed API endpoint at edit-time -->     ││
│└────────────────────────────────────────────────────────────────────────────┘│
│┌────────────────────────────────────────────────────────────────────────────┐│
││                         ┌────────────────────────┐                         ││
││                         │ BlockModel (type CARD) │                         ││
││                         └────────────────────────┘                         ││
││ node.innerHTML = 'Cards can change content at render time. For example,    ││
││ use an Ember component';                                                   ││
│└────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Usage

ContentKit is attached to a DOM node when the `Editor` factory is instantiated.

```js
var editor = new ContentKit.Editor(this.element, options);
```

`options` is an object which may include the following properties:

* `stickyToolbar` - a boolean option enabling a persistent header with
  formatting tools. Default is true for touch devices.
* `placeholder` - default text to show before a user starts typing.
* `spellcheck` - a boolean option enabling spellcheck. Default is true.
* `autofocus` - a boolean option for grabbing input focus when an editor is
  rendered.
* `serverHost` - a URL prefix for embed and image API request. **[FIXME Remove]**
* `cards` - an object describing available cards.

### Public Editor API

* `editor.loadPost(post)` - render the editor with a post. **[FIXME Implement]**
* `editor.serializePost()` - serialize the current post for persistence. **[FIXME Implement]**

### Contributing

Running ContentKit tests and demo server locally requires the following dependencies:

* [node.js](http://nodejs.org/) ([install package](http://nodejs.org/download/)) or `brew install node`
* `gulp`, via `npm install -g gulp`

To run tests:

```
gulp test
```

To run the demo server:

```
npm start && open http://localhost:5000
```

To ensure ContentKit rebuilds while you work with it:

```
gulp watch
```

For uploads and embeds to work, you will have to configure AWS and
Embedly keys as environment variables:

```bash
export AWS_ACCESS_KEY_ID=XXXXXX
export AWS_SECRET_ACCESS_KEY=XXXXXX
export EMBEDLY_KEY=XXXXXX
```

Also, set the `bucketName` in `server/config.json` with the name of your AWS
S3 bucket for uploading files.
