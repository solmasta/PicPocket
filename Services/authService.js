import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

/**
 * Configure Google Sign-In. Call once at app startup (e.g. in App.js).
 * @param {string} webClientId - OAuth 2.0 Web client ID from Google Cloud Console.
 */
export const configureGoogleSignIn = (webClientId) => {
  GoogleSignin.configure({
    webClientId,
    scopes: GOOGLE_SCOPES,
    offlineAccess: true,
  });
};

/**
 * Sign the user in with Google.
 * @returns {Promise<{user: object, tokens: {accessToken: string, idToken: string}}>}
 */
export const signIn = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    return { user: userInfo.user, tokens };
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in cancelled by user.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available.');
    }
    throw error;
  }
};

/**
 * Sign the current user out.
 */
export const signOut = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    throw new Error(`Sign-out failed: ${error.message}`);
  }
};

/**
 * Revoke app access and sign the user out completely.
 */
export const revokeAccess = async () => {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch (error) {
    throw new Error(`Revoke access failed: ${error.message}`);
  }
};

/**
 * Return the currently signed-in user, or null if not signed in.
 * @returns {Promise<object|null>}
 */
export const getCurrentUser = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (!isSignedIn) return null;
    return await GoogleSignin.getCurrentUser();
  } catch {
    return null;
  }
};

/**
 * Get a fresh access token, silently refreshing if needed.
 * @returns {Promise<string>} Access token.
 */
export const getAccessToken = async () => {
  try {
    await GoogleSignin.signInSilently();
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken;
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_REQUIRED) {
      throw new Error('User must sign in first.');
    }
    throw error;
  }
};
