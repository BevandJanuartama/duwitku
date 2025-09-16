import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// tambah wallet
export async function addWallet(userId, name) {
  await addDoc(collection(db, "wallets"), {
    name,
    balance: 0,
    userId,
  });
}

// ambil semua wallet user
export async function getWallets(userId) {
  const q = query(collection(db, "wallets"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
