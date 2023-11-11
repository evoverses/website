import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { PlayFab, PlayFabClient } from "playfab-sdk";
import "server-only";
import LoginResult = PlayFabClientModels.LoginResult;
import IPlayFabError = PlayFabModule.IPlayFabError;
import IPlayFabSuccessContainer = PlayFabModule.IPlayFabSuccessContainer;

const getGoogleOAuth2Client = (): OAuth2Client => {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = process.env.NODE_ENV === "production" ? "evoverses.com" : "localhost:3000";

  // @ts-ignore
  if (!global.googleOAuth2Client) {
    // @ts-ignore
    global.googleOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${protocol}://${host}/api/auth/google/callback`,
    );
  }
  // @ts-ignore
  return global.googleOAuth2Client;
};
export const getGoogleAuthUrl = () => {
  return getGoogleOAuth2Client().generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
  });
};

const onGoogleLoginCallback = (error: IPlayFabError, result: IPlayFabSuccessContainer<LoginResult>) => {
  if (result !== null) {
    console.log("Logged in!", result.data);
    cookies().set({
      name: "evo::session",
      value: JSON.stringify(result.data),
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24,
    });

  } else if (error !== null) {
    console.log("Something went wrong");
    console.log("Here's some debug information:");
    console.log(compileErrorReport(error));
  }
};

export const loginWithGoogle = async (authorizationCode: string) => {
  const { tokens } = await getGoogleOAuth2Client().getToken(authorizationCode);
  getGoogleOAuth2Client().setCredentials(tokens);
  PlayFab.settings.titleId = process.env.PLAYFAB_TITLE_ID || "";
  PlayFabClient.LoginWithGoogleAccount({
    TitleId: PlayFab.settings.titleId,
    SetEmail: true,
    // @ts-ignore
    AccessToken: tokens.access_token,
    CreateAccount: true,
  }, onGoogleLoginCallback);
};

const compileErrorReport = (error: IPlayFabError) => {
  if (error === null) {
    return "";
  }
  let fullErrors = error.errorMessage;
  for (const paramName in error.errorDetails) {
    for (const msgIdx in error.errorDetails[paramName]) {
      fullErrors += "\n" + paramName + ": " + error.errorDetails[paramName][msgIdx];
    }
  }
  return fullErrors;
};
