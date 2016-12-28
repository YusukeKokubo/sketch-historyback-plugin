var keyID = "com.phantomtype.sketch.artboard-warker";
var pageIndexKey = keyID + ".pageIndex";
var artboardIndexKey = keyID + "artboardIndex";
var artboardChangedHistoryPageIndexKey = keyID + ".artboardChangedHistory.pageIndex";
var artboardChangedHistoryArtboardIndexKey = keyID + ".artboardChangedHistory.artboardIndex";
var artboardCurrentPositionKey = keyID + "artboardCurrentPosition";
var changeIgnoredKey = keyID + ".saving";

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

  sketch.message(page.name + " / " + artboard.name + " - load");
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

  sketch.message(page.name + " / " + artboard.name + " - saved");
}

function onGoBack(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  var position = sketch.settingForKey(positionKey) || 0;

  log(">>> go BACK");
  var artboard = goHistory(sketch, doc, page, position - 1);
  log("<<<");

  if (artboard) {
    sketch.setSettingForKey(positionKey, position - 1); // decrement position
    sketch.message(page.name + " / " + artboard.name + " - open");
  }
}

function onGoForward(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  var position = sketch.settingForKey(positionKey) || 0;

  log(">>> go FORWARD");
  var artboard = goHistory(sketch, doc, page, position + 1);
  log("<<<");

  if (artboard) {
    sketch.setSettingForKey(positionKey, position + 1); // increment position
    sketch.message(page.name + " / " + artboard.name + " - open");
  }
}

function goHistory(sketch, doc, page, position) {
  if (position <= 0) {
    log("skip ");
    sketch.message("No more history");
    return;
  }
  var history = loadArtboardHistry(sketch, doc, position);
  var pageIndex = history["pageIndex"];
  var artboardIndex = history["artboardIndex"];

  log({pageIndex, artboardIndex, position});

  if (pageIndex == null || artboardIndex == null) {
    log("skip because index is null");
    return null;
  } else {
    return openArtboard(sketch, doc, pageIndex, artboardIndex, true);
  }
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

function openArtboard(sketch, doc, pageIndex, artboardIndex, lockSaving) {
  var page = doc.pages[pageIndex];
  doc.sketchObject.setCurrentPage(page.sketchObject);

  var artboard = getArtboardByIndex(page, artboardIndex);

  if (lockSaving) {
    sketch.setSettingForKey(settingKey(doc, changeIgnoredKey, 0), "saving");
  }

  artboard.select();
  doc.centerOnLayer(artboard);

  return artboard;
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
  var action = context.actionContext;
  var doc = action.document;

  var savingKey = settingKey(doc, changeIgnoredKey, 0);
  var saving = sketch.settingForKey(savingKey);
  if (saving == "saving") {
    sketch.setSettingForKey(savingKey, null);
    log("skip save");
    return;
  }

  var artboard = action.oldArtboard;
  if (artboard == null) {
    log("skip save");
    return;
  }

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
