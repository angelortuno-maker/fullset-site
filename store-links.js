// Change 285: the store buttons' one config. Every `a[data-store]` on the site takes its link from here; with no
// link (or no JavaScript) a button marked `data-hide-empty` stays hidden (no dead links, MSG-5951), and
// `data-store-fallback` ("Get the app") shows until one of the buttons has a link (334).
(function () {
  var LINKS = {
    // The App Store page (the official badge, MSG-5951 W3). App Store ID 6818055502 (eas.json); set the link the day
    // its page opens in the US (apps.apple.com/us/app/id6818055502 was a 404 on Nov 7). This one line shows the badge.
    apple: '',
    // "Join the Android test": the Play closed test's opt-in link (MSG-5951 W3, amending MSG-5711), until Play
    // production, then the Play Store listing (WL1). Angel confirms the link before it goes here.
    android: '',
  };
  // MSG-5951 W9: the coach web (app.thefullsetapp.com). Empty keeps "Coach login" and the /coaches dashboard button
  // hidden; set it the day 327 is live in production.
  var COACH_WEB_URL = '';
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
  var coachLinks = document.querySelectorAll('a[data-coach-web]');
  for (var k = 0; k < coachLinks.length; k++) {
    if (COACH_WEB_URL) {
      coachLinks[k].href = COACH_WEB_URL;
      coachLinks[k].hidden = false;
    }
  }
})();
