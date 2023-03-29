import { env } from "./env";
import browser from "webextension-polyfill";
import { STORAGE_KEYS } from "./types";

const redirectUri = browser.identity.getRedirectURL();
const scopes = ["User.Read", "Calendars.Read"];

const createRandomString = (): string => {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.";
  let random = "";
  const randomValues = Array.from(crypto.getRandomValues(new Uint8Array(43)));
  randomValues.forEach((v) => (random += charset[v % charset.length]));
  return random;
};

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64UrlDigest = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return base64UrlDigest;
};

export const getToken = async (interactive: boolean = true) => {
  const storage = await browser.storage.local.get(STORAGE_KEYS.TOKEN);
  const savedToken: string | undefined = storage[STORAGE_KEYS.TOKEN];

  // トークンが保存されていればそれを返す
  if (savedToken) {
    return savedToken;
  } else {
    const codeVerifier = createRandomString();
    const codeChallenge = await createCodeChallenge(codeVerifier);

    const authUrl = `https://login.microsoftonline.com/${
      env.TENANT_ID
    }/oauth2/v2.0/authorize
    ?client_id=${env.CLIENT_ID}
    &response_type=code
    &redirect_uri=${encodeURIComponent(redirectUri)}
    &scope=${encodeURIComponent(scopes.join(" "))}
    &response_mode=query
    &prompt=select_account
    &code_challenge=${codeChallenge}
    &code_challenge_method=S256
    `;

    await browser.storage.local.set({
      [STORAGE_KEYS.CODE_VERIFIER]: codeVerifier,
    });

    const response = await browser.identity
      .launchWebAuthFlow({
        url: authUrl,
        interactive,
      })
      .then(async (redirectUrl) => {
        if (browser.runtime.lastError) {
          console.error(browser.runtime.lastError);
          return;
        }
        if (redirectUrl == null) return;
        const code = new URL(redirectUrl).searchParams.get("code");
        if (code == null) return;
        const result = await browser.storage.local.get(
          STORAGE_KEYS.CODE_VERIFIER
        );
        const code_verifier = result[STORAGE_KEYS.CODE_VERIFIER];

        const url = `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/token`;
        const body = new URLSearchParams({
          client_id: env.CLIENT_ID,
          scope: scopes.join(" "),
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: code_verifier,
        });
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }).then((res) => res.json());
        return response;
      });

    await browser.storage.local.set({
      [STORAGE_KEYS.TOKEN]: response.access_token,
    });

    return response?.access_token as string | undefined;
  }
};

export const signOut = async () => {
  const url = `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/logout`;
  const body = new URLSearchParams({
    client_id: env.CLIENT_ID,
    post_logout_redirect_uri: redirectUri,
  });

  await browser.identity.launchWebAuthFlow({
    url: `${url}?${body.toString()}`,
    interactive: true,
  });
};
