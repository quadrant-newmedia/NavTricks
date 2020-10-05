/*!
    NavTricks.js

    (c) Quadrant Newmedia Corporation
    https://github.com/quadrant-newmedia/NavTricks
    https://github.com/quadrant-newmedia/NavTricks/blob/master/LICENSE
*/
(function() {
'use strict';

var PREVIOUS_PAGE_KEY = 'NavTricks_previousPage';
var PAGE_DEPTH_KEY = 'NavTricks_pageDepth';
var PREVIOUS_PAGE = getPreviousPage();
var page_depth = 1;

function getRawPreviousPage() {
    // No reliable info in sessionStorage about previous page.
    // Just get we do know
    return {
        url: document.referrer,
        title: null,
    }
}
function getPreviousPage() {
    var replacing_previous = sessionStorage.NavTricks_replacingPrevious && JSON.parse(sessionStorage.NavTricks_replacingPrevious);
    if (replacing_previous) {
        sessionStorage.NavTricks_replacingPrevious = '';
        return replacing_previous;
    }

    // If this page is being reloaded/returned to via back/forward, previousPage will be stored on history
    var s = history.state || {};
    if (s.hasOwnProperty(PREVIOUS_PAGE_KEY)) return s[PREVIOUS_PAGE_KEY];

    // The user manually opened this page in new window/tab
    // Note - referrer might actually be set (if user "control+click"ed a link), but we still can't go back
    if (history.length == 1) return null

    // The user manually navigated to this page. We don't support going back to unknown pages.
    if (!document.referrer) return null

    // TODO - detect case where we're in an iframe? referrer will be set, history length may be > 1.
    // Should check referrer against parent url
    // Need to do in cross-origin safe way
    // Note - if we're running in an iframe, we also have the issue that sessionStorage is shared with parent (if same origin)
    // That will break this script entirely 
    
    if (!sessionStorage[PREVIOUS_PAGE_KEY]) return getRawPreviousPage();

    var sessionPrevious = JSON.parse(sessionStorage[PREVIOUS_PAGE_KEY]);
    if (sessionPrevious === null) {
        // This is a special case -> the previous page doesn't want us to link to back to it in any way
        // (the previous page called navigateWithoutPreviousPage())
        return null;
    }

    // The previous page was cross origin, so no reliable data in sessionStorage (it's not actually the previous page, it's just the last page visited from our domain)
    if (sessionPrevious.url != document.referrer) return getRawPreviousPage();

    return sessionPrevious;
}
function navigateWithoutPreviousPage(dest) {
    sessionStorage[PREVIOUS_PAGE_KEY] = null;
    location = dest;
}
function replaceCurrentPage(dest) {
    function complete_nav() {
        sessionStorage.NavTricks_replacingPrevious = JSON.stringify(PREVIOUS_PAGE);
        location.replace(dest)
    }
    if (page_depth > 1) {
        // Unwind current page history before going to next page
        // This is important so that if user clicks back manually, he can't cycle through meaningless states on a different page
        addEventListener('popstate', complete_nav);
        addEventListener('hashchange', complete_nav);
        setTimeout(complete_nav, 200);
        history.go(-1*(page_depth-1));
    } else {
        complete_nav();
    }
}
function previousPageIsInternal(internalHosts) {
    if (!PREVIOUS_PAGE) return false;
    internalHosts = internalHosts || [];
    internalHosts.push(location.host);
    var previousHost = PREVIOUS_PAGE.url.match(/[^/]*\/\/([^/]+)/)[1];
    for (var i = internalHosts.length - 1; i >= 0; i--) {
        if (previousHost == internalHosts[i]) return true
    }
    return false
}

function returnToPreviousPage() {
    if (!PREVIOUS_PAGE) {
        throw new Error('No known previous page.');
    }
    history.go(-1 * page_depth);
}
function withParentPage(onsuccess, onfail) {
    _withParentPage(location.pathname, onsuccess, onfail||function(){});
}
function _withParentPage(path, onsuccess, onfail) {
    if (path == '/') {
        onfail();
        return
    }
    // Pop trailing slash, if present
    if (path[path.length-1] == '/') {
        path = path.slice(0,-1);
    }    
    // pop any trailing non '/'
    while (path[path.length-1] != '/') {
        path = path.slice(0,-1);
    }

    function tryNext() {
        _withParentPage(path, onsuccess, onfail);
    }

    var r = new XMLHttpRequest();
    // Tell request to parse the document
    r.responseType = 'document';
    r.onload = function() {
        // Note - r.response will only be set if response actually contains an html document
        if (200 <= r.status && r.status <= 299 && r.response) {
            onsuccess({
                path: path,
                title: r.response.title,
            })
        }
        else {
            tryNext();
        }
    }
    r.onerror = tryNext
    r.open('get', path)
    r.send();
}

addEventListener('load', function() {
    /*
        Store current page details in session, so next page can read
        Note that this is intended to be read by the NEXT page the user navigates to, so it contains CURRENT page data.
    */
    sessionStorage[PREVIOUS_PAGE_KEY] = JSON.stringify({
        url: location.href.split('#')[0],
        title: document.title,
    });

    /*
        Store previousPage data on history, as well page_depth.
    */
    var s = history.state || {};
    s[PREVIOUS_PAGE_KEY] = PREVIOUS_PAGE;
    s[PAGE_DEPTH_KEY] = page_depth;
    history.replaceState(s, '', '');

    /*
        Patch pushState.
        Must duplicate previousPage, and increment page depth.
    */
    var _pushState = history.pushState.bind(history);
    history.pushState = function(data, title, url) {
        if (!data || JSON.stringify(data)[0] != '{') {
            throw new Error('Pages using NavTricks.js may use history.pushState, but they must pass a "simple object" (which serializes to a JSON dictionary) as the state object');
        }
        page_depth++;
        data[PREVIOUS_PAGE_KEY] = PREVIOUS_PAGE;
        data[PAGE_DEPTH_KEY] = page_depth;
        _pushState(data, title, url);
    }
});
/*
    On hashchange, fix page depth and previous page
*/
addEventListener('hashchange', function() {
    if (history.state && history.state[PAGE_DEPTH_KEY]) {
         // User went back. history.state is good to go, just need to restore page_depth
         page_depth = history.state[PAGE_DEPTH_KEY];
         return
    }

    page_depth++;
    var s = history.state || {};
    s[PREVIOUS_PAGE_KEY] = PREVIOUS_PAGE;
    s[PAGE_DEPTH_KEY] = page_depth;
    history.replaceState(s, '', '');
});
addEventListener('popstate', function() {
    try {
        page_depth = history.state[PAGE_DEPTH_KEY];
    } catch(e) {
        // Some browsers fire popstate at page load, and history.state might not have been set by us yet
    }
});

window.NavTricks = {
    navigateWithoutPreviousPage: navigateWithoutPreviousPage,
    previousPage: PREVIOUS_PAGE,
    previousPageIsInternal: previousPageIsInternal,
    returnToPreviousPage: returnToPreviousPage,
    withParentPage: withParentPage,
    goToParentPage: function(onfail) {
        onfail = onfail || function() {
            throw new Error('No parent page exists');
        }
        withParentPage(function(page) {
            location = page.path;
        }, onfail);
    },
    replaceCurrentPage: replaceCurrentPage,
};

})();