import { env } from "./env";
import browser from "webextension-polyfill";
import { GetTokenResponse, STORAGE_KEYS } from "./types";
import { storages } from "./storage";

const redirectUri = browser.identity.getRedirectURL();
const scopes = ["User.Read", "Calendars.Read"];
const tenant = env.TENANT_ID;

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

export const getToken = async (
  interactive: boolean = true
): Promise<GetTokenResponse | undefined> => {
  const token = await storages.getToken();
  // トークンが保存されていればそれを返す
  if (token) {
    return token;
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
    &prompt=consent
    &code_challenge=${codeChallenge}
    &code_challenge_method=S256
    `;

    await storages.setCodeVerifier(codeVerifier);

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
        const code = new URL(redirectUrl).searchParams.get("code");

        if (code == null) return;

        const codeVerifier = await storages.getCodeVerifier();

        const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
        const body = new URLSearchParams({
          client_id: env.CLIENT_ID,
          scope: scopes.join(" "),
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: codeVerifier ?? "",
        });
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }).then((res) => res.json());
        return response;
      })
      .catch((e) => {
        console.error(e);
        return undefined;
      });

    await storages.setToken(response);

    return response;
  }
};

export const refreshToken = async (): Promise<GetTokenResponse | undefined> => {
  const token = await storages.getToken();

  if (token?.expires_at && token.expires_at > Date.now()) {
    return token;
  }
  const refreshToken = token?.refresh_token;
  if (refreshToken) {
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: env.CLIENT_ID,
      scope: scopes.join(" "),
      refresh_token: refreshToken,
      redirect_uri: redirectUri,
      grant_type: "refresh_token",
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }).then((res) => res.json());

    await storages.setToken(response);

    return response;
  }
};

export const signOut = async () => {
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout`;
  const body = new URLSearchParams({
    client_id: env.CLIENT_ID,
    post_logout_redirect_uri: redirectUri,
  });

  await browser.identity.launchWebAuthFlow({
    url: `${url}?${body.toString()}`,
    interactive: true,
  });
};
