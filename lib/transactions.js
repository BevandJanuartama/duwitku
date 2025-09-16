import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  increment,
  orderBy,
} from "firebase/firestore";

// tambah transaksi + update saldo wallet
export async function addTransaction(userId, walletId, type, amount, note) {
  const tx = {
    walletId,
    type, // "pemasukan" atau "pengeluaran"
    amount: Number(amount),
    note,
    userId,
    date: new Date(),
  };

  // simpan transaksi
  await addDoc(collection(db, "transactions"), tx);

  // update saldo wallet
  const walletRef = doc(db, "wallets", walletId);
  await updateDoc(walletRef, {
    balance: increment(type === "pemasukan" ? amount : -amount),
  });
}

// ambil transaksi berdasarkan wallet
export async function getTransactions(userId, walletId) {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    where("walletId", "==", walletId),
    orderBy("date", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
