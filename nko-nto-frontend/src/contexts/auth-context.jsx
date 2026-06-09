import { createContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../utils/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setEmailVerified(firebaseUser?.emailVerified ?? false);
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        setIsAdmin(!!tokenResult.claims.ROLE_ADMIN);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(name, companyName, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const token = await cred.user.getIdToken();
    await api.post('/auth/register', { name, companyName }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await cred.user.getIdToken(true);
    await sendEmailVerification(cred.user);
  }

  async function signupWithInvite(name, email, password, inviteToken) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const token = await cred.user.getIdToken();
    await api.post('/auth/register-invite', { name, inviteToken }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await cred.user.getIdToken(true);
    await sendEmailVerification(cred.user);
  }

  async function logout() {
    await signOut(auth);
    setEmailVerified(false);
  }

  async function sendVerificationEmail() {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  }

  async function refreshUser() {
    await auth.currentUser?.reload();
    setEmailVerified(auth.currentUser?.emailVerified ?? false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified, isAdmin, login, signup, signupWithInvite, logout, sendVerificationEmail, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
