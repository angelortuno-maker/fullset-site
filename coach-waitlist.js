/* Fullset's /coaches early-access form (fullset-site; kept in the app repo as a test fixture, change 331).
   Plain script, no library, no build step: <script src="/coach-waitlist.js" defer></script> after the forms. Each
   form[data-coach-waitlist data-source="coaches-hero|coaches-bottom"] holds an input[type=email], a select[name=clients],
   a submit button and a [role=status] line. It posts to change 217's joinWaitlist with role "coach". The form's
   data-state (joined, invalid, pick, failed, or none) lets the page's CSS show the confirmation or the error; a
   [data-joined-email] element, if there is one, shows the email that joined. */
(function (w) {
  'use strict';
  const URL = 'https://us-central1-angel-log-48bac.cloudfunctions.net/joinWaitlist';
  const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'];
  const LINES = {
    en: {
      ok: "Thanks. We'll write when coach early access opens.",
      pick: 'Pick how many clients you coach.',
      INVALID_ARGUMENT: 'Check the email address.',
      RESOURCE_EXHAUSTED: 'Too many tries. Try again in an hour.',
      failed: 'Something went wrong — try again.'
    },
    es: {
      ok: 'Gracias. Te escribimos cuando abra el acceso anticipado para coaches.',
      pick: 'Elige cuántos clientes entrenas.',
      INVALID_ARGUMENT: 'Revisa el correo.',
      RESOURCE_EXHAUSTED: 'Demasiados intentos. Prueba de nuevo en una hora.',
      failed: 'Algo salió mal — inténtalo de nuevo.'
    }
  };

  /** utm_* from the page's address, each cut to 100 characters; null when there are none. */
  function utmOf(search) {
    const out = {};
    let any = false;
    String(search || '')
      .replace(/^\?/, '')
      .split('&')
      .forEach(function (pair) {
        const i = pair.indexOf('=');
        const key = decodeURIComponent((i < 0 ? pair : pair.slice(0, i)).replace(/\+/g, ' '));
        const value = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
        const name = key.indexOf('utm_') === 0 ? key.slice(4) : null;
        if (name && UTM_KEYS.indexOf(name) >= 0 && value) {
          out[name] = value.slice(0, 100);
          any = true;
        }
      });
    return any ? out : null;
  }

  /** The form's state for the page's CSS: 'joined', 'invalid' (the email), 'pick' (the range), 'failed', or '' while editing. */
  function setState(form, state) {
    if (typeof form.setAttribute === 'function') form.setAttribute('data-state', state);
  }

  function wire(form, fetchImpl, search) {
    const input = form.querySelector('input[type=email]');
    const select = form.querySelector('select[name=clients]');
    const button = form.querySelector('[type=submit], button');
    const status = form.querySelector('[role=status]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (button.disabled) return;
      const lang = String(form.ownerDocument.documentElement.lang || '').slice(0, 2) === 'es' ? 'es' : 'en';
      const lines = LINES[lang];
      const clients = String(select.value || '');
      if (!clients) {
        setState(form, 'pick');
        status.textContent = lines.pick;
        return;
      }
      const data = {
        email: String(input.value).trim(),
        clients: clients,
        lang: lang,
        role: 'coach',
        source: form.getAttribute('data-source')
      };
      const utm = utmOf(search);
      if (utm) data.utm = utm;
      button.disabled = true;
      setState(form, '');
      return Promise.resolve()
        .then(function () {
          return fetchImpl(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
          });
        })
        .then(function (res) {
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function (body) {
          if (body && body.result && body.result.ok === true) {
            // Joined (or already on the list: the same answer): the button stays off, and the page shows the email.
            status.textContent = lines.ok;
            const shown = form.querySelector('[data-joined-email]');
            if (shown) shown.textContent = data.email;
            setState(form, 'joined');
            return;
          }
          const code = body && body.error && body.error.status;
          status.textContent = lines[code === 'RESOURCE_EXHAUSTED' || code === 'INVALID_ARGUMENT' ? code : 'failed'];
          setState(form, code === 'INVALID_ARGUMENT' ? 'invalid' : 'failed');
          button.disabled = false;
        })
        .catch(function () {
          status.textContent = lines.failed;
          setState(form, 'failed');
          button.disabled = false;
        });
    });
  }

  w.FullsetCoachWaitlist = { wire: wire };
  if (w.document) {
    const start = function () {
      const forms = w.document.querySelectorAll('form[data-coach-waitlist]');
      for (let i = 0; i < forms.length; i += 1) wire(forms[i], w.fetch.bind(w), w.location && w.location.search);
    };
    if (w.document.readyState === 'loading') w.document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(window);
