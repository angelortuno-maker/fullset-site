/* Fullset's account-email action page (MSG-5486): /auth/action and /es/auth/action. Plain script, no library, no
   analytics. The link brings mode, oobCode, lang and the app's public Web API key (apiKey, as in Firebase's own links);
   the page calls only Firebase's Identity Toolkit, and after a password reset the notifyPasswordChanged callable. */
(function (w, d) {
  'use strict';
  // The page's words, in its language: a JSON block in the page (data, not a script, so the CSP stays 'self').
  const T = JSON.parse(d.getElementById('auth-text').textContent);
  const NOTIFY = 'https://us-central1-angel-log-48bac.cloudfunctions.net/notifyPasswordChanged';
  const MIN_PASSWORD = 8; // the app's rule (src/lib/auth.ts MIN_PASSWORD)
  const q = new URLSearchParams(w.location.search);
  const mode = q.get('mode');
  const oobCode = q.get('oobCode');
  const apiKey = q.get('apiKey');
  const lang = q.get('lang');

  // A Spanish link on the English page (or the reverse) goes to its own page, with the same query.
  const onEs = /^\/es\//.test(w.location.pathname);
  if (lang === 'es' && !onEs) return w.location.replace('/es/auth/action' + w.location.search);
  if (lang === 'en' && onEs) return w.location.replace('/auth/action' + w.location.search);
  // The code stays in memory only: drop it from the address bar and the history.
  if (w.history && w.history.replaceState) w.history.replaceState(null, '', w.location.pathname);

  const $ = function (id) { return d.getElementById(id); };
  const show = function (id) {
    ['working', 'done', 'reset', 'failed'].forEach(function (s) { $(s).hidden = s !== id; });
    const h = $(id).querySelector('h1');
    if (h) h.focus();
  };
  const done = function (title, line) {
    $('done-title').textContent = title;
    $('done-line').textContent = line;
    show('done');
  };
  const fail = function (title, line) {
    $('failed-title').textContent = title;
    $('failed-line').textContent = line;
    show('failed');
  };

  function call(endpoint, body) {
    return fetch('https://identitytoolkit.googleapis.com/v1/accounts:' + endpoint + '?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (res.ok) return json;
        const code = String((json && json.error && json.error.message) || 'UNKNOWN').split(' ')[0];
        throw { code: code };
      });
    }, function () {
      throw { code: 'NETWORK' };
    });
  }

  function failFor(e) {
    const code = e && e.code;
    if (code === 'NETWORK') return fail(T.offlineTitle, T.offlineLine);
    if (code === 'EXPIRED_OOB_CODE' || code === 'INVALID_OOB_CODE') return fail(T.expiredTitle, T.expiredLine);
    if (code === 'USER_DISABLED' || code === 'USER_NOT_FOUND' || code === 'EMAIL_NOT_FOUND') return fail(T.accountTitle, T.accountLine);
    if (code === 'EMAIL_EXISTS') return fail(T.takenTitle, T.takenLine);
    return fail(T.errorTitle, T.errorLine);
  }

  if (!mode || !oobCode || !apiKey) return fail(T.incompleteTitle, T.incompleteLine);

  if (mode === 'verifyEmail') {
    call('update', { oobCode: oobCode }).then(function () { done(T.verifiedTitle, T.verifiedLine); }, failFor);
  } else if (mode === 'verifyAndChangeEmail') {
    call('update', { oobCode: oobCode }).then(function () { done(T.changedTitle, T.changedLine); }, failFor);
  } else if (mode === 'recoverEmail') {
    // Puts the old address back (the account's owner undoing an email change), then suggests a new password.
    call('resetPassword', { oobCode: oobCode })
      .then(function (info) {
        return call('update', { oobCode: oobCode }).then(function () {
          done(T.recoveredTitle, T.recoveredLine.replace('{email}', info.email || ''));
        });
      })
      .catch(failFor);
  } else if (mode === 'resetPassword') {
    call('resetPassword', { oobCode: oobCode }).then(function (info) {
      $('reset-for').textContent = T.resetFor.replace('{email}', info.email || '');
      show('reset');
    }, failFor);
  } else {
    fail(T.incompleteTitle, T.incompleteLine);
  }

  // Reset password: the new one twice, the app's rule shown, and the error said next to the field.
  const form = $('reset-form');
  const pw = $('pw');
  const pw2 = $('pw2');
  const err = $('reset-error');
  const save = $('reset-save');
  $('pw-toggle').addEventListener('click', function () {
    const hidden = pw.type === 'password';
    pw.type = pw2.type = hidden ? 'text' : 'password';
    this.textContent = hidden ? T.hide : T.show;
    this.setAttribute('aria-pressed', String(hidden));
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (save.disabled) return;
    err.textContent = '';
    if (pw.value.length < MIN_PASSWORD) {
      err.textContent = T.tooShort;
      return pw.focus();
    }
    if (pw.value !== pw2.value) {
      err.textContent = T.mismatch;
      return pw2.focus();
    }
    save.disabled = true;
    call('resetPassword', { oobCode: oobCode, newPassword: pw.value }).then(
      function (info) {
        done(T.savedTitle, T.savedLine);
        // The "password changed" email (MSG-5486). Best effort: the reset already went through.
        fetch(NOTIFY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { email: info.email || '', lang: onEs ? 'es' : 'en' } })
        }).catch(function () {});
      },
      function (e2) {
        save.disabled = false;
        if (e2 && String(e2.code).indexOf('WEAK_PASSWORD') === 0) {
          err.textContent = T.tooShort;
          pw.focus();
        } else failFor(e2);
      }
    );
  });
})(window, document);
