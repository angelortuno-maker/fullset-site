/* Fullset's waitlist form (fullset-site; kept in the app repo as a test fixture, change 217, AC-217-2.7).
   Plain script, no library, no build step: <script src="/waitlist.js" defer></script> beside the #waitlist form,
   which holds an input[type=email], a submit button and, optionally, a [role=status] line. */
(function (w) {
  'use strict';
  const URL = 'https://us-central1-angel-log-48bac.cloudfunctions.net/joinWaitlist';
  const LINES = {
    ok: "Thanks — one email when it's public.",
    RESOURCE_EXHAUSTED: 'Too many tries. Try again in an hour.',
    INVALID_ARGUMENT: 'Check the email address.',
    failed: "Couldn't send that. Try again."
  };

  function statusOf(form) {
    let el = form.querySelector('[role=status]');
    if (!el) {
      el = form.ownerDocument.createElement('p');
      el.setAttribute('role', 'status');
      form.appendChild(el);
    }
    return el;
  }

  function wire(form, fetchImpl) {
    const input = form.querySelector('input[type=email]');
    const button = form.querySelector('[type=submit], button');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (button.disabled) return;
      const lang = String(form.ownerDocument.documentElement.lang || '').slice(0, 2) === 'es' ? 'es' : 'en';
      const status = statusOf(form);
      button.disabled = true;
      return Promise.resolve()
        .then(function () {
          return fetchImpl(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { email: String(input.value).trim(), lang: lang } })
          });
        })
        .then(function (res) {
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function (body) {
          if (body && body.result && body.result.ok === true) {
            // Joined: the button stays off, so the same email isn't sent again.
            status.textContent = LINES.ok;
            return;
          }
          const code = body && body.error && body.error.status;
          status.textContent = LINES[code === 'RESOURCE_EXHAUSTED' || code === 'INVALID_ARGUMENT' ? code : 'failed'];
          button.disabled = false;
        })
        .catch(function () {
          status.textContent = LINES.failed;
          button.disabled = false;
        });
    });
  }

  w.FullsetWaitlist = { wire: wire };
  if (w.document) {
    const start = function () {
      const form = w.document.getElementById('waitlist');
      if (form) wire(form, w.fetch.bind(w));
    };
    if (w.document.readyState === 'loading') w.document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(window);
