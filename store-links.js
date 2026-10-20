// Change 285: the store buttons' one config. Every `a[data-store]` on the site takes its link from here; with no
// link (or no JavaScript) a button stays on its page's #get section.
(function () {
  var LINKS = {
    // The iPhone link (APPLE_URL in the Architect's brief). Empty until Angel posts it on #597.
    apple: '',
    // The Play Store link. Empty until Play production (change 311): a test track's join link works only for listed
    // testers, so it never goes here (the Architect, #597 Oct 19 22:23).
    android: '',
  };
  var buttons = document.querySelectorAll('a[data-store]');
  for (var i = 0; i < buttons.length; i++) {
    var url = LINKS[buttons[i].getAttribute('data-store')];
    if (url) {
      buttons[i].href = url;
      buttons[i].rel = 'noopener';
    }
  }
})();
