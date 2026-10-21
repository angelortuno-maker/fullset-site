// Change 285: the store buttons' one config. Every `a[data-store]` on the site takes its link from here; with no
// link (or no JavaScript) a button stays on its page's #get section, or, marked `data-hide-empty`, stays hidden; and
// `data-store-fallback` ("Get the app") shows until one of those has a link (334).
(function () {
  var LINKS = {
    // The iPhone link (APPLE_URL in the Architect's brief). Set it the day Apple approves 2.0.0 (MSG-5711): this is the
    // one line, and /coaches' iPhone button appears with it.
    apple: '',
    // The Play Store listing, set the day Play production goes live (MSG-5711); until then a non-tester gets a 404. Never
    // a test track's join link: it works only for listed testers (the Architect, #597 Oct 19 22:23).
    android: '',
  };
  var buttons = document.querySelectorAll('a[data-store]');
  var anyShown = false;
  for (var i = 0; i < buttons.length; i++) {
    var url = LINKS[buttons[i].getAttribute('data-store')];
    if (url) {
      buttons[i].href = url;
      buttons[i].rel = 'noopener';
      // Change 334: a `data-hide-empty` button ships hidden (so with no JavaScript too) and shows once its store has a link.
      if (buttons[i].hasAttribute('data-hide-empty')) {
        buttons[i].hidden = false;
        anyShown = true;
      }
    }
  }
  // Change 334 (MSG-5711): "Get the app" stands in for the store buttons until one of them has a link.
  var fallbacks = document.querySelectorAll('[data-store-fallback]');
  for (var j = 0; j < fallbacks.length; j++) fallbacks[j].hidden = anyShown;
})();
