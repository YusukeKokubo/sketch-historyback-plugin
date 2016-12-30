var keyID = "com.phantomtype.sketch.artboard-warker";
var pageIndexKey = keyID + ".pageIndex";
var artboardIndexKey = keyID + "artboardIndex";
var artboardChangedHistoryPageIndexKey = keyID + ".artboardChangedHistory.pageIndex";
var artboardChangedHistoryArtboardIndexKey = keyID + ".artboardChangedHistory.artboardIndex";
var artboardCurrentPositionKey = keyID + "artboardCurrentPosition";
var artboardChangeHistoriesCountKey = keyID + "artboardChangeHistoriesCount";
var changeIgnoredKey = keyID + ".saving";

//
// Layer 0: Presentations
//

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

function onArtboadChanged(context) {
    log(">>> onArtboadChanged ***");

    var sketch = context.api();
    var action = context.actionContext;
    var doc = action.document;

    if (isFromHistoryBack(sketch, doc)) {
        log("skip due to history back");
        return;
    }

    var artboard = action.oldArtboard;
    if (artboard == null) {
        log("skip save");
        return;
    }
    if (artboard.className() == "MSSymbolMaster") {
        log("skip save because artboard is Symbol");
        return;
    }

    var page = doc.currentPage();
    var indexes = getCurrentIndexes(doc, page, artboard);
    var pageIndex = indexes["pageIndex"]
    var artboardIndex = indexes["artboardIndex"]
    var position = getCurrentPosition(sketch, doc);

    log({page, artboard, indexes, position});

    if (pageIndex < 0 || artboardIndex < 0) {
        log("save error");
        log({pageIndex, artboardIndex});
    } else if (position < 0 || position > 10) {
        log("skip due to limit");
    } else {
        saveArtboardHistry(sketch, doc, indexes, position);
        incrementCurrentPosition(sketch, doc);
        incrementHistoryCount(sketch, doc);
    }

    log("<<<")
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

function currentPosition(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  var position = sketch.settingForKey(positionKey) || 0;

  var countKey = settingKey(doc, artboardChangeHistoriesCountKey, 0);
  var count = sketch.settingForKey(countKey) || 0;

  log({position, count});
  sketch.message("position: " + position + ", count: " + count);
}

//
// Layer 1: Verbs
//

function goHistory(sketch, doc, page, position) {
  var history = loadArtboardHistry(sketch, doc, position);
  var pageIndex = history["pageIndex"];
  var artboardIndex = history["artboardIndex"];

  log({pageIndex, artboardIndex, position});

  if (pageIndex == null || artboardIndex == null) {
    log("skip because index is null");
    sketch.message("No more history");
    return null;
  } else {
    return openArtboard(sketch, doc, pageIndex, artboardIndex, true);
  }
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

function saveArtboardHistry(sketch, doc, indexes, position) {
    var pageIndex = indexes["pageIndex"];
    var artboardIndex = indexes["artboardIndex"];
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

function isFromHistoryBack(sketch, doc) {
  var savingKey = settingKey(doc, changeIgnoredKey, 0);
  var saving = sketch.settingForKey(savingKey);
  if (saving == "saving") {
    sketch.setSettingForKey(savingKey, null);
    return true;
  } else {
    return false;
  }

}

function getCurrentIndexes(doc, page, artboard) {
  var artboardIndex = getIndexOf(page.layers(), artboard);
  var pageIndex = getIndexOf(doc.pages(), page);

  return {artboardIndex, pageIndex};
}

function getCurrentPosition(sketch, doc) {
  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  return sketch.settingForKey(positionKey) || 0;
}

function incrementCurrentPosition(sketch, doc) {
  var position = getCurrentPosition(sketch, doc);
  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  sketch.setSettingForKey(positionKey, position + 1);
}

function incrementHistoryCount(sketch, doc) {
  var countKey = settingKey(doc, artboardChangeHistoriesCountKey, 0);
  var count = sketch.settingForKey(countKey) || 0;
  sketch.setSettingForKey(countKey, count + 1);
}

//
// Layer 2: Functions
//

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
  page.iterateWithFilter("isArtboard", function(a) { // TODO: Symbol Support. (as for now API don't support)
    if (a.index == index) {
      r = a;
      return;
    }
  });
  // r = page.artboards[index];
  return r;
}

function getIndexOf(collections, target) {
  var r = -1;
  // log({collections, target});
  var t = toSketchObject(target);
  if (t.objectID == undefined) return r;

  collections.forEach(function(data, i) {
    if (toSketchObject(data).objectID() == t.objectID()) {
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
