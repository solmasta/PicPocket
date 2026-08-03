/**
 * Minimal popup-based OAuth helper for providers without a client SDK
 * (OneDrive, Dropbox). Opens the provider's authorize URL in a popup, polls
 * its location until it lands back on our own origin (the redirect URI),
 * then reads the token out of the URL fragment.
 *
 * This uses each provider's implicit "token" grant (response_type=token)
 * rather than the authorization-code + PKCE flow they now recommend, so
 * that no backend token-exchange endpoint is required — the whole app is a
 * static frontend today. Both Microsoft and Dropbox still support the
 * token grant for this kind of light client-side use; revisit if either
 * provider drops it.
 */
export function openOAuthPopup(authUrl, { redirectUri, pollIntervalMs = 400, timeoutMs = 120000 }) {
  return new Promise((resolve, reject) => {
    const popup = window.open(authUrl, 'oauth-popup', 'width=520,height=680');
    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
      return;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        reject(new Error('Sign-in window was closed before completing.'));
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        popup.close();
        reject(new Error('Sign-in timed out.'));
        return;
      }

      let popupUrl;
      try {
        // Throws while the popup is still on the provider's own (cross-origin)
        // domain — that's expected and just means "keep polling."
        popupUrl = popup.location.href;
      } catch {
        return;
      }

      if (popupUrl && popupUrl.indexOf(redirectUri) === 0) {
        clearInterval(timer);
        const url = new URL(popupUrl);
        const params = new URLSearchParams(url.hash ? url.hash.slice(1) : url.search.slice(1));
        popup.close();

        const error = params.get('error');
        if (error) {
          reject(new Error(params.get('error_description') || error));
          return;
        }
        resolve(Object.fromEntries(params.entries()));
      }
    }, pollIntervalMs);
  });
}
