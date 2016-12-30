var keyID = "com.phantomtype.sketch.artboard-warker";
var bookmarkPageIndexKey = keyID + ".pageIndex";
var bookmarkArtboardIndexKey = keyID + "artboardIndex";
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

  log("<<< Bookmark load ***");
  var indexes = loadBookmark(sketch, doc);
  log(indexes);

  openArtboard(sketch, doc, indexes, false);

  sketch.message("load");
  log(">>>");
};

function onBookmarkSave(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  log("<<< Bookmark save ***");

  var artboard = getSelectedArtboard(page);
  if (artboard == null) {
      sketch.alert("Please select a Artboard.", "Bookmark save");
      return;
  }

  var indexes = getIndexes(doc, page, artboard);
  log(indexes);

  saveBookmark(sketch, doc, indexes);

  sketch.message("saved");
  log(">>>");
}

function onArtboardChanged(context) {
    log(">>> onArtboadChanged ***");

    var sketch = context.api();
    var action = context.actionContext;
    var doc = action.document;

    if (isFromHistoryBack(sketch, doc)) {
        log("skip due to history back");
        return;
    }
    var position = getCurrentPosition(sketch, doc);
    saveArtboard(sketch, doc, action.oldArtboard, position - 1);
    saveArtboard(sketch, doc, action.newArtboard, position);

    incrementCurrentPosition(sketch, doc);
    incrementHistoryCount(sketch, doc);

    log("<<<")

    // logAll(sketch, doc);
}

function onGoBack(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  var position = getCurrentPosition(sketch, doc) - 1;

  log(">>> go BACK");
  var indexes = loadArtboardHistry(sketch, doc, position);
  var pageIndex = indexes["pageIndex"];
  var artboardIndex = indexes["artboardIndex"];

  log({indexes, position});

  if (pageIndex == null || artboardIndex == null) {
    log("skip because index is null");
    sketch.message("No more history");
  } else {
    openArtboard(sketch, doc, indexes, true);
    decrementCurrentPosition(sketch, doc);
    sketch.message("open");
  }
  log("<<<");

}

function onGoForward(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  var position = getCurrentPosition(sketch, doc) + 1;

  log(">>> go FORWARD");
  var indexes = loadArtboardHistry(sketch, doc, position);
  var pageIndex = indexes["pageIndex"];
  var artboardIndex = indexes["artboardIndex"];

  log({indexes, position});

  if (pageIndex == null || artboardIndex == null) {
    log("skip because index is null");
    sketch.message("No more history");
  } else {
    openArtboard(sketch, doc, indexes, true);
    incrementCurrentPosition(sketch, doc);
    sketch.message(page.name + " / " + artboard.name + " - open");
  }
  log("<<<");
}

function currentPosition(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  var position = sketch.settingForKey(positionKey) || 0;

  var countKey = settingKey(doc, artboardChangeHistoriesCountKey, 0);
  var count = sketch.settingForKey(countKey) || 0;

  log({position, count});
  logAll(sketch, doc);
  sketch.message("position: " + position + ", count: " + count);
}

//
// Layer 1: Verbs
//

function logAll(sketch, doc) {
    var count = getHistoryCount(sketch, doc);

    for (var i = 0; i < count; i++) {
        log(loadArtboardHistry(sketch, doc, i));
    }
}

function saveBookmark(sketch, doc, indexes) {
  var pageIndex = indexes["pageIndex"]
  var artboardIndex = indexes["artboardIndex"]

  sketch.setSettingForKey(settingKey(doc, bookmarkPageIndexKey, 1), pageIndex);
  sketch.setSettingForKey(settingKey(doc, bookmarkArtboardIndexKey, 1), artboardIndex);
}

function loadBookmark(sketch, doc) {
  var pageIndex = sketch.settingForKey(settingKey(doc, bookmarkPageIndexKey, 1));
  var artboardIndex = sketch.settingForKey(settingKey(doc, bookmarkArtboardIndexKey, 1));

  return {pageIndex, artboardIndex};
}

function openArtboard(sketch, doc, indexes, lockSaving) {
  var pageIndex = indexes["pageIndex"];
  var artboardIndex = indexes["artboardIndex"];
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

function saveArtboard(sketch, doc, artboard, position) {
  if (position < 0) {
    log("skip save due to position is " + position);
    return;
  }
  if (artboard == null) {
    log("skip save due to artboard is null");
    return;
  }
  if (artboard.className() == "MSSymbolMaster") {
    log("skip save due to artboard is Symbol");
    return;
  }

  var page = doc.currentPage();
  var indexes = getIndexes(doc, page, artboard);
  log({page, artboard, indexes, position});
  var pageIndex = indexes["pageIndex"];
  var artboardIndex = indexes["artboardIndex"];
  if (pageIndex >= 0 && artboardIndex >= 0) {
    saveArtboardHistry(sketch, doc, indexes, position);
  }
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

function getIndexes(doc, page, artboard) {
  var artboardIndex = null;
  if (artboard.sketchObject) {
    artboardIndex = artboard.index;
  } else {
    artboardIndex = getIndexOf(page.layers(), artboard);
  }

  var pageIndex = null;
  if (page.sketchObject) {
    pageIndex = getIndexOf(doc.pages, page); // because page.index does not work well
  } else {
    pageIndex = getIndexOf(doc.pages(), page);
  }

  return {artboardIndex, pageIndex};
}

function getCurrentPosition(sketch, doc) {
  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  return sketch.settingForKey(positionKey) || 0;
}

function getHistoryCount(sketch, doc) {
  var countKey = settingKey(doc, artboardChangeHistoriesCountKey, 0);
  var count = sketch.settingForKey(countKey) || 0;
  return count;
}

function incrementCurrentPosition(sketch, doc) {
  var position = getCurrentPosition(sketch, doc);
  var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
  sketch.setSettingForKey(positionKey, position + 1);
}

function decrementCurrentPosition(sketch, doc) {
    var position = getCurrentPosition(sketch, doc);
    var positionKey = settingKey(doc, artboardCurrentPositionKey, 0);
    sketch.setSettingForKey(positionKey, position - 1);
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
