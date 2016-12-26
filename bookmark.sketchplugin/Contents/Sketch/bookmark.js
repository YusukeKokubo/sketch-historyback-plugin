// var pageIndexKey = "com.phantomtype.sketch.abbookmark.pageIndex";
var pageNameKey = "com.phantomtype.sketch.abbookmark.pageName";
var artboardIndexKey = "com.phantomtype.sketch.abbookmark.artboardIndex";

function onRead1(context) {
  onBookmarkRead(context, 1);
}

function onRead2(context) {
  onBookmarkRead(context, 2);
}

function onRead3(context) {
  onBookmarkRead(context, 3);
}

function onSave1(context) {
  onBookmarkSave(context, 1);
}

function onSave2(context) {
  onBookmarkSave(context, 2);
}

function onSave3(context) {
  onBookmarkSave(context, 3);
}

function onBookmarkRead(context, index) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;

  var pageName = sketch.settingForKey(pageNameKey);
  var pageIndex = getIndexOfPage(doc, pageName);
  var page = doc.pages[pageIndex];

  doc.sketchObject.setCurrentPage(page.sketchObject);

  var artboardIndex = sketch.settingForKey(settingKey(context, artboardIndexKey, index));
  var artboard = getArtboardByIndex(page, artboardIndex);
  artboard.select();
  doc.centerOnLayer(artboard);

  sketch.message(page.name + ": " + artboard.name + " load");
};

function onBookmarkSave(context, index) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  sketch.setSettingForKey(pageNameKey, page.name);

  var artboard = getSelectedArtboard(page);
  sketch.setSettingForKey(settingKey(context, artboardIndexKey, index), artboard.index);

  sketch.message(page.name + ": " + artboard.name + " saved");
}

function getBookmarks(context, index) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  var pageName = sketch.settingForKey(settingKey(context, pageNameKey, index));
  sketch.message(pageName);
}

function settingKey(context, key, index) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var fileName = doc.sketchObject.publisherFileName();

  return key + "." + fileName + "." + index;
}

function getIndexOfPage(doc, pageName) {
  var r = -1;
  doc.pages.forEach(function(page, i) {
    if (page.name == pageName) r = i;
  });
  return r;
}

function getSelectedArtboard(page) {
  var r = null;
  page.selectedLayers.iterateWithFilter("isArtboard", function(a) {
    r = a;
    return;
  });
  return r;
}

function getArtboardByIndex(page, index) {
  var r = null;
  page.iterateWithFilter("isArtboard", function(a) {
    if (a.index == index) {
      r = a;
      return;
    }
  });
  return r;
}

// onSave1(context);

// onBookmarkSave(context);
// onBookmarkRead(context);

// var sketch = context.api();
// var doc = sketch.selectedDocument;
// var page = doc.selectedPage;
// var ab = getArtboardByIndex(page, 2);
// log(ab.name);
// ab.select();

// log(settingKey(context, pageNameKey, 0));
