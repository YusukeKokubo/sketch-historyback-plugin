// var pageIndexKey = "com.phantomtype.sketch.abbookmark.pageIndex";
var pageNameKey = "com.phantomtype.sketch.abbookmark.pageName";

function onBookmarkRead(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;

  var pageName = sketch.settingForKey(pageNameKey);
  var pageIndex = getIndexOfPage(doc, pageName);
  log(pageIndex);
  doc.sketchObject.setCurrentPage(doc.pages[pageIndex].sketchObject);
  sketch.message(pageName + " load");
};

function onBookmarkSave(context) {
  var sketch = context.api();
  var doc = sketch.selectedDocument;
  var page = doc.selectedPage;

  sketch.setSettingForKey(pageNameKey, page.name);
  sketch.message(page.name + " saved");
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
