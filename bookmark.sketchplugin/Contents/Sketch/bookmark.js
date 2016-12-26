// var pageIndexKey = "com.phantomtype.sketch.abbookmark.pageIndex";
var pageNameKey = "com.phantomtype.sketch.abbookmark.pageName";
var artboardIndexKey = "com.phantomtype.sketch.abbookmark.artboardIndex";

function onBookmarkRead(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;

  var pageName = sketch.settingForKey(pageNameKey);
  var pageIndex = getIndexOfPage(doc, pageName);
  var page = doc.pages[pageIndex];

  doc.sketchObject.setCurrentPage(page.sketchObject);

  var artboardIndex = sketch.settingForKey(artboardIndexKey);
  var artboard = getArtboardByIndex(page, artboardIndex);
  artboard.select();
  doc.centerOnLayer(artboard);

  sketch.message(page.name + ": " + artboard.name + " load");
};

function onBookmarkSave(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  sketch.setSettingForKey(pageNameKey, page.name);

  var artboard = getSelectedArtboard(page);
  sketch.setSettingForKey(artboardIndexKey, artboard.index);

  sketch.message(page.name + ": " + artboard.name + " saved");
}

function getBookmarks(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  var pageName = sketch.settingForKey(pageNameKey);
  sketch.message(pageName);
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

// onBookmarkSave(context);
// onBookmarkRead(context);

// var sketch = context.api();
// var doc = sketch.selectedDocument;
// var page = doc.selectedPage;
// var ab = getArtboardByIndex(page, 2);
// log(ab.name);
// ab.select();
