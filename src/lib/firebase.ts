import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Explicitly request email and profile scopes
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');

export { signInWithPopup, signOut };
