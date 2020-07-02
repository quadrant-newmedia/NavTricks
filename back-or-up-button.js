addEventListener('load', function() {
    var placeholders = document.querySelectorAll('back-or-up-button');

    if (placeholders.length == 0) return

    if (NavTricks.previousPageIsInternal()) {
        for (var i = 0; i < placeholders.length; i++) {
            placeholders[i].outerHTML = '<button onclick="NavTricks.returnToPreviousPage()" class="BackButton" aria-label="back">◀ '+
                (NavTricks.previousPage.title || 'Back') +
                '</button>';
        }
    }
    else NavTricks.withParentPage(function(page) {
        for (var i = 0; i < placeholders.length; i++) {
            placeholders[i].outerHTML = '<a href="'+page.path+'" class="ParentLink">▲ '+
                (page.title||'Parent Page') +
                '<a>'
        }
    });
});