// var pageIndexKey = "com.phantomtype.sketch.abbookmark.pageIndex";
var pageIndexKey = "com.phantomtype.sketch.abbookmark.pageIndex";
var artboardIndexKey = "com.phantomtype.sketch.abbookmark.artboardIndex";
var artboardChangedHistoryKey = "com.phantomtype.sketch.abbookmark.artboardChangedHistory";
var artboardCurrentPositionKey = "com.phantomtype.sketch.abbookmark.artboardCurrentPosition";

function onBookmarkLoad(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var index = 1;

  var pageIndex = sketch.settingForKey(pageIndexKey);
  var page = doc.pages[pageIndex];

  doc.sketchObject.setCurrentPage(page.sketchObject);

  var artboardIndex = sketch.settingForKey(settingKey(doc, artboardIndexKey, index));
  var artboard = getArtboardByIndex(page, artboardIndex);
  artboard.select();
  doc.centerOnLayer(artboard);

  sketch.message(page.name + ": " + artboard.name + " load");
};

function onBookmarkSave(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;
  var index = 1;
  var pageIndex = getIndexOf(doc.pages, page); // because page.index does not work well

  sketch.setSettingForKey(pageIndexKey, pageIndex);

  var artboard = getSelectedArtboard(page);
  sketch.setSettingForKey(settingKey(doc, artboardIndexKey, index), artboard.index);

  sketch.message(page.name + ": " + artboard.name + " saved");
}

function onGoBack(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  var position = sketch.settingForKey(positionKey) - 1 || 0;
  log(">>> go back");
  log(position);
  if (position <= 0) return;

  var pageIndexKey = artboardChangedHistoryKey + ".pageIndex." + position;
  var pageIndex = sketch.settingForKey(pageIndexKey);
  log(pageIndex);

  var artboardIndexKey = artboardChangedHistoryKey + ".artboardIndex." + position;
  var artboardIndex = sketch.settingForKey(artboardIndexKey);
  log(artboardIndex);
  log("<<<");

  openArtboard(doc, pageIndex, artboardIndex);

  sketch.setSettingForKey("com.phantomtype.sketch.abbookmark.saving", "saving");

  sketch.setSettingForKey(positionKey, position);

  sketch.message(page.name);
}

function onGoforward(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  sketch.message(page.name);
}

function settingKey(document, key, index) {
  var fileName = "";
  if (document.sketchObject) {
    fileName = document.sketchObject.publisherFileName();
  } else {
    fileName = document.publisherFileName();
  }

  return key + "." + fileName + "." + index;
}

function openArtboard(doc, pageIndex, artboardIndex) {
  var page = doc.pages[pageIndex];
  doc.sketchObject.setCurrentPage(page.sketchObject);

  var artboard = getArtboardByIndex(page, artboardIndex);
  artboard.select();
  doc.centerOnLayer(artboard);
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

function getIndexOf(collections, target) {
  var r = -1;
  collections.forEach(function(data, i) {
    if (toSketchObject(data).objectID() == toSketchObject(target).objectID()) {
      r = i;
      return;
    }
  });
  return r;
}

function toSketchObject(object) {
  if (object.sketchObject) {
    return object.sketchObject;
  } else {
    return object;
  }
}

function onArtboadChanged(context) {
  var sketch = context.api();
  var saving = sketch.settingForKey("com.phantomtype.sketch.abbookmark.saving");
  if (saving == "saving") {
    sketch.setSettingForKey("com.phantomtype.sketch.abbookmark.saving", null);
    return;
  }

  var action = context.actionContext;
  var ab = action.newArtboard;
  var doc = action.document;
  var page = doc.currentPage();
  var abIndex = getIndexOf(page.layers(), ab);
  var pageIndex = getIndexOf(doc.pages(), page);

  log(">>> onArtboadChanged ***");
  log(ab.name());
  log(page.name());
  log(ab.objectID());
  log(abIndex);
  log(pageIndex);

  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  var position = sketch.settingForKey(positionKey) || 0;
  log(position);
  log("<<<")

  var pageIndexKey = artboardChangedHistoryKey + ".pageIndex." + position;
  sketch.setSettingForKey(pageIndexKey, pageIndex);

  var artboardIndexKey = artboardChangedHistoryKey + ".artboardIndex." + position;
  sketch.setSettingForKey(artboardIndexKey, abIndex);

  sketch.setSettingForKey(positionKey, position + 1);
}
