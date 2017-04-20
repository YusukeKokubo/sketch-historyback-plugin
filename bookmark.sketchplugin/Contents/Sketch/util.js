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
        if (String(toSketchObject(data).objectID()) == String(id)) {
            r = data;
            return;
        }
    });
    return r;
}

function getObjectById(collections, pageId) {
    var r = null;
    collections.forEach(function (data, i) {
        if (String(toSketchObject(data).objectID()) == String(pageId)) {
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

