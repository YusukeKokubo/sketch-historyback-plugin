var keyID = "com.phantomtype.sketchplugin.historyback";
var CURRENT_POSITION_KEY = keyID + ".currentPosition";
var COUNT_KEY = keyID + ".countKey";
var SAVING_STATE_KEY = keyID + ".saving";

var PAGE_KEY = keyID + ".history.page";
var ARTBOARD_KEY = keyID + ".history.artboard";

var is_debug = true;

//
// Layer 0: Presentations
//

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
    debug("oldArtboard", action.oldArtboard);
    saveArtboard(sketch, doc, action.oldArtboard, position);
    debug("newArtboard", action.newArtboard);
    saveArtboard(sketch, doc, action.newArtboard, position + 1);

    saveCurrentPosition(sketch, doc, position + 1);
    saveHistoryCount(sketch, doc, position + 1);

    log("<<<")
}

function onGoBack(context) {
    var sketch = context.api();
    var doc = sketch.selectedDocument;

    var position = getCurrentPosition(sketch, doc) - 1;

    log(">>> go BACK");
    var ids = loadArtboardHistory(sketch, doc, position);
    var pageId = ids["pageId"]
    var artboardId = ids["artboardId"]

    if (pageId == null || artboardId == null) {
        log("skip because id is null");
        sketch.message("No more history");
    } else {
        var payload = findArtboard(doc, ids);
        openArtboard(sketch, doc, payload["page"], payload["artboard"]);
        saveCurrentPosition(sketch, doc, position);
    }
    log("<<<");
}

function onGoForward(context) {
    var sketch = context.api();
    var doc = sketch.selectedDocument;

    var position = getCurrentPosition(sketch, doc) + 1;

    log(">>> go FORWARD");
    var ids = loadArtboardHistory(sketch, doc, position);
    var pageId = ids["pageId"]
    var artboardId = ids["artboardId"]

    if (pageId == null || artboardId == null) {
        log("skip because index is null");
        sketch.message("No more history");
    } else {
        var payload = findArtboard(doc, ids);
        openArtboard(sketch, doc, payload["page"], payload["artboard"]);
        saveCurrentPosition(sketch, doc, position);
    }
    log("<<<");
}

function showHistories(context) {
    var sketch = context.api();
    var doc = sketch.selectedDocument;
    log(">>> choice History");

    var p = histories(sketch, doc);
    var ps = p["pages"]
    var as = p["artboards"]

    var choice = choiceArtboard(sketch, doc, as);

    if (choice[0] == 1000) {
        var i = choice[1];
        openArtboard(sketch, doc, ps[i], as[i]);
        saveCurrentPosition(sketch, doc, i);
    }
    log("<<<");
}

//
// Layer 1: Verbs
//

function openArtboard(sketch, doc, page, artboard) {
    toSketchObject(doc).setCurrentPage(toSketchObject(page));

    sketch.setSettingForKey(settingKey(doc, SAVING_STATE_KEY, 0), "saving");

    // Don't use JavaScript API due to support Symbol.
    // artboard.select();
    toSketchObject(artboard).select_byExpandingSelection(true, false);
    // doc.centerOnLayer(artboard);
    toSketchObject(doc).currentView().centerRect_(artboard.rect());

    debug("openArtboard", {page, artboard});

    return {page, artboard};
}

function findArtboard(doc, ids) {
    var page = getObjectById(doc.pages, ids["pageId"])
    var artboard = getObjectById2(page.sketchObject.layers, ids["artboardId"])

    debug("findArtboard", {page, artboard});

    return {page, artboard};
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

    var page = doc.currentPage();
    debug("saveHistory", page);
    if (toSketchObject(artboard).objectID) {
        saveArtboardHistory(sketch, doc, page, artboard, position)
    }
}

function loadArtboardHistory(sketch, doc, position) {
    var pageKey = settingKey(doc, PAGE_KEY, position);
    var pageId = sketch.settingForKey(pageKey)

    var artboardKey = settingKey(doc, ARTBOARD_KEY, position);
    var artboardId = sketch.settingForKey(artboardKey);

    debug("loadArtboardHistory", {pageId, artboardId});
    return {pageId, artboardId};
}

function isFromHistoryBack(sketch, doc) {
    var savingKey = settingKey(doc, SAVING_STATE_KEY, 0);
    var saving = sketch.settingForKey(savingKey);
    if (saving == "saving") {
        sketch.setSettingForKey(savingKey, null);
        return true;
    } else {
        return false;
    }

}

function getCurrentPosition(sketch, doc) {
    var positionKey = settingKey(doc, CURRENT_POSITION_KEY, 0);
    return sketch.settingForKey(positionKey) || 0;
}

function getHistoryCount(sketch, doc) {
    var countKey = settingKey(doc, COUNT_KEY, 0);
    var count = sketch.settingForKey(countKey) || 0;
    return count;
}

function saveCurrentPosition(sketch, doc, position) {
    var positionKey = settingKey(doc, CURRENT_POSITION_KEY, 0);
    sketch.setSettingForKey(positionKey, position);
}

function saveHistoryCount(sketch, doc, position) {
    var countKey = settingKey(doc, COUNT_KEY, 0);
    sketch.setSettingForKey(countKey, position);
}

function histories(sketch, doc) {
    var count = getHistoryCount(sketch, doc);
    var position = getCurrentPosition(sketch, doc)
    var pages = []
    var artboards = []
    debug("count, position", {count, position})

    for (var i = 0; i < count; i++) {
        var ids = loadArtboardHistory(sketch, doc, i);
        if (ids["pageId"] && ids["artboardId"]) {
            var payload = findArtboard(doc, ids);
            pages.push(payload["page"])
            artboards.push(payload["artboard"])
        }
    }

    debug("pages, artboards", {pages, artboards});

    return {pages, artboards}
}

function choiceArtboard(sketch, doc, artboards) {
    var count = getHistoryCount(sketch, doc);
    var position = getCurrentPosition(sketch, doc);
    var items = [];
    artboards.forEach(function (data, i) {
        items.push(i + ": " + data.name());
    });

    debug("items", items)
    var choice = sketch.getSelectionFromUser("count: " + count + ", position: " + position, items, 0);
    debug("choice", choice)

    return choice;
}


//
// Layer 2: Functions
//

function saveArtboardHistory(sketch, doc, page, artboard, position) {
    var pageKey = settingKey(doc, PAGE_KEY, position);
    var pid = toSketchObject(page).objectID();
    debug("pageKey", {pageKey, pid})
    sketch.setSettingForKey(pageKey, pid);

    var artboardKey = settingKey(doc, ARTBOARD_KEY, position);
    var aid = toSketchObject(artboard).objectID();
    debug("artboardKey", {artboardKey, aid})
    sketch.setSettingForKey(artboardKey, aid);
}

function settingKey(document, key, index) {
    var fileName = "";
    if (document.sketchObject) {
        fileName = document.sketchObject.cloudName();
    } else {
        fileName = document.cloudName();
    }
    var result = key + "." + fileName + "." + index;
    return result;
}

function getObjectById2(cs, id) {
    debug("cs", {cs, id});
    var r = null;
    cs().forEach(function (data) {
        if (toSketchObject(data).objectID() == id) {
            r = data;
            return;
        }
    });
    return r;
}

function getObjectById(collections, pageId) {
    var r = null;
    collections.forEach(function (data, i) {
        if (toSketchObject(data).objectID() == pageId) {
            r = data;
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

//
// Layer 2: Logging
//

function debug(msg, body) {
    if (is_debug) {
        log("***" + msg);
        log(body);
    }
}

