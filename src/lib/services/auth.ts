import { auth } from "./firebase";
import {
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

/**
 * 匿名ログインを実行します
 */
export async function loginAnonymously(): Promise<User> {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous auth failed:", error);
    throw error;
  }
}

/**
 * ログイン状態を監視するストアのような役割を果たします
 */
export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
