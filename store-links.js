// Change 285: the store buttons' one config. Every `a[data-store]` on the site takes its link from here; with no
// link (or no JavaScript) a button stays on its page's #get section.
(function () {
  var LINKS = {
    // The iPhone link (APPLE_URL in the Architect's brief). Empty until Angel posts it on #597.
    apple: '',
    // The Play internal-test opt-in (launch/12; the Architect, #597 Oct 18 20:45).
    android: 'https://play.google.com/apps/internaltest/4701681073761031718',
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
