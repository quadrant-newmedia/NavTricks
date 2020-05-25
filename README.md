# NavTricks.js

Encouraging the user to go back in history (ie. `history.back()`) can be a very powerful design pattern for many workflows. This works especially well when navigating from a "detail" page back to a filterable, paginated "list" page.

Unfortunately, `history.back()` has some serious limitations:
- it is asynchronous, and you cannot tell if it will succeed or not (ie. if the user opened the link to this page in a new tab)
- you cannot tell which page it will return the user to (you probably don't want to return them to a Google search, if that's how they got here)
- if the current page has used `history.pushState()` or hash links, then you actually need to go back multiple history entries, not just one

This project aims to implement a wrapper around the history API, making it easier to implement a well-behaved "Smart Back Button". 

Not only do we address the above issues, but we also:
- provide access to the `document.title` of the previous page, allowing you to inject that into your back button
- provide a means to determine the "parent page", for use as a fallback when the user navigated to the page directly or via a link from an external site

## Recommended Usage

- clone this project as a submodule
- add `<script defer src="/my_static_files/vendor/NavTricks/NavTricks.js"></script>` to your page

## The `NavTricks` Object
After `NavTricks.js` has run, there will be a global `NavTricks` object, with the following properites available.

### `previousPage`

If the user cannot go back in browser history, this property will be `null`. Otherwise, this will be an object with `url` and `title` properties. `url` will always be set (to an absolute url), but `title` may be null. `title` will only be set (to the `document.title` of the previous page) if the previous page was from the same domain as the current page, and that page also included `NavTricks.js`. 

### `previousPageIsInternal([internalHosts]) -> Boolean`

This can be used to check verify that there is a previous page, and that that page is on an "internal host". 

By default, we check against only the host of the current page. You may, optionally, pass an array of extra hosts (no protocol - just host/domain name with optional :port_number) to treat as "internal".

Generally, you'll want to verify that this is true before you render a "back" button. If false, you'll probably want to render a default/fallback link instead (ie. for cases where the user landed on this page via a web search).

### `returnToPreviousPage() -> undefined`

Basically, this is just `history.back()`, except that we keep track of extra history states created via `history.pushState()` and in-page hash links, and go back the appropriate number of history entries.

Will throw an error if there is no previous page (ie. `NavTricks.previousPage === null`).

Asynchronous. 

### `replaceCurrentPage(url) -> undefined`

Useful on "form pages", which, after completion, should be "overwritten" by some other page.

Sample use case:
- user is on "Author List" page
- user clicks "Add Author" link, which navigates to a new page
- user completes the add author form, which is handled via javascript
- the "Add Author" page executes `NavTricks.replaceCurrentPage(url_of_newly_created_author)`
- the user is now on the "Author Detail" page of the new author, and can go back directly to the "Author List"

This is basically just `location.replace(url)`, except that we make sure the next page knows that it's "previous page" is the current page's previous page, rather than the current page itself.

**TODO:** if the current page has used `history.pushState()` or hash links, then first "unwind" those extra history entries (via `history.go(-n)`) before executing `location.replace()`. Wait for a proper test case before implementing.

### `withParentPage(onSuccess, onFail) -> undefined`

This is mostly intended as a fallback for times when `previousPageIsInternal()` returns false.

If the current path is `/foo/bar/baz/x`, then this will "search" for a valid parent page, starting with `/foo/bar/baz/`, then trying `/foo/bar/`, `/foo/`, and `/`.

For each possible parent page, try to fetch (GET) the page via xhr. If the request returns a valid html document, then call `onSuccess({path: path_of_valid_parent_page, title: title_of_returned_document})`.

If no valid parent page is found, call `onFail()`.

## Demo

This folder contains a simple demo of most of the features of NavTricks. Run a server rooted at this folder to see it in action. In particular, have a look at `back-or-up-button.js`. You may want to copy that script to your own project, and modify as needed.
