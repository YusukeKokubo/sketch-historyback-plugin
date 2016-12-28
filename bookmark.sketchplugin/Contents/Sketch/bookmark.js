// var pageIndexKey = "com.phantomtype.sketch.abbookmark.pageIndex";
var pageIndexKey = "com.phantomtype.sketch.abbookmark.pageIndex";
var artboardIndexKey = "com.phantomtype.sketch.abbookmark.artboardIndex";
var artboardChangedHistoryKey = "com.phantomtype.sketch.abbookmark.artboardChangedHistory";
var artboardChangedHistoryPageIndexKey = artboardChangedHistoryKey + ".pageIndex";
var artboardChangedHistoryArtboardIndexKey = artboardChangedHistoryKey + ".artboardIndex";
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
  if (position <= 0) {
    log("skip back");
    sketch.message("No more history");
    return;
  }
  var history = loadArtboardHistry(sketch, doc, position);
  var pageIndex = history["pageIndex"];
  var artboardIndex = history["artboardIndex"];

  log({pageIndex, artboardIndex, position});

  if (pageIndex == null || artboardIndex == null) {
    log("skip back because index is null");
  } else {
    sketch.setSettingForKey("com.phantomtype.sketch.abbookmark.saving", "saving");
    openArtboard(doc, pageIndex, artboardIndex);
  }
  log("<<<");

  saveArtboardHistry(sketch, doc, null, null, position); // delete old history
  sketch.setSettingForKey(positionKey, position); // decrement position

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
  var result = key + "." + fileName + "." + index;
  log(result);
  return result;
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
  log(">>> onArtboadChanged ***");

  var sketch = context.api();
  var saving = sketch.settingForKey("com.phantomtype.sketch.abbookmark.saving");
  if (saving == "saving") {
    sketch.setSettingForKey("com.phantomtype.sketch.abbookmark.saving", null);
    log("skip save");
    return;
  }

  var action = context.actionContext;
  var artboard = action.oldArtboard;

  if (artboard == null) {
    log("skip save");
    return;
  }

  var doc = action.document;
  var page = doc.currentPage();
  var artboardIndex = getIndexOf(page.layers(), artboard);
  var pageIndex = getIndexOf(doc.pages(), page);

  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  var position = sketch.settingForKey(positionKey) || 0;

  log({artboard, page, artboardIndex, pageIndex, position});

  saveArtboardHistry(sketch, doc, pageIndex, artboardIndex, position);

  sketch.setSettingForKey(positionKey, position + 1);
  log("<<<")
}

function saveArtboardHistry(sketch, doc, pageIndex, artboardIndex, position) {
  var pageIndexKey = settingKey(doc, artboardChangedHistoryPageIndexKey, position);
  sketch.setSettingForKey(pageIndexKey, pageIndex);

  var artboardIndexKey = settingKey(doc, artboardChangedHistoryArtboardIndexKey, position);
  sketch.setSettingForKey(artboardIndexKey, artboardIndex);
}

function loadArtboardHistry(sketch, doc, position) {
  var pageIndexKey = settingKey(doc, artboardChangedHistoryPageIndexKey, position);
  var pageIndex = sketch.settingForKey(pageIndexKey);

  var artboardIndexKey = settingKey(doc, artboardChangedHistoryArtboardIndexKey, position);
  var artboardIndex = sketch.settingForKey(artboardIndexKey);

  return {pageIndex, artboardIndex};
}
