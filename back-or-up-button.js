addEventListener('load', function() {
    var placeholders = document.querySelectorAll('back-or-up-button');
    if (NavTricks.previousPageIsInternal()) {
        for (var i = placeholders.length - 1; i >= 0; i--) {
            placeholders[i].outerHTML = '<button onclick="NavTricks.returnToPreviousPage()">&lt '+
                NavTricks.previousPage.title || 'Back' +
                '</button>';
        }
    }
    else NavTricks.withParentPage(function(page) {
        for (var i = placeholders.length - 1; i >= 0; i--) {
            placeholders[i].outerHTML = '<a href="'+page.path+'">^ '+
                page.title||'Parent Page' +
                '<a>'
        }
    });
});