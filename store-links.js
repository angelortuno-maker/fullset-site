// Change 285: the store buttons' one config. Every `a[data-store]` on the site takes its link from here; with no
// link (or no JavaScript) a button stays on its page's #get section, or hides if it's marked `data-hide-empty` (334).
(function () {
  var LINKS = {
    // The iPhone link (APPLE_URL in the Architect's brief). Empty until Apple approves 2.0.0 (change 334, MSG-5710): this
    // is the one line to set, and /coaches' iPhone button appears with it.
    apple: '',
    // The Play Store listing (change 334, MSG-5710: we're live). Never a test track's join link: it works only for listed
    // testers (the Architect, #597 Oct 19 22:23).
    android: 'https://play.google.com/store/apps/details?id=com.fullset.app',
  };
  var buttons = document.querySelectorAll('a[data-store]');
  for (var i = 0; i < buttons.length; i++) {
    var url = LINKS[buttons[i].getAttribute('data-store')];
    if (url) {
      buttons[i].href = url;
      buttons[i].rel = 'noopener';
    } else if (buttons[i].hasAttribute('data-hide-empty')) {
      // Change 334: a button marked so shows only once its store has a link (/coaches' hero).
      buttons[i].hidden = true;
    }
  }
})();
