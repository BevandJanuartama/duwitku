import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import useAuth from "../../hooks/useAuth";
import { useRouter } from "next/router";

export default function Wallets() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [wallets, setWallets] = useState([]);
  const [walletName, setWalletName] = useState("");
  const [balance, setBalance] = useState("");

  // Redirect ke login jika tidak login
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Load wallets user
  useEffect(() => {
    if (user) {
      const loadWallets = async () => {
        const q = query(
          collection(db, "wallets"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        setWallets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      };
      loadWallets();
    }
  }, [user]);

  // Tambah wallet baru
  const addWallet = async (e) => {
    e.preventDefault();
    if (!walletName) return;
    await addDoc(collection(db, "wallets"), {
      name: walletName,
      balance: Number(balance),
      userId: user.uid,
    });
    setWalletName("");
    setBalance("");
    router.reload(); // refresh data setelah tambah
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header: judul di kiri, tombol Back di kanan */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Wallets</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
        >
          ← Back
        </button>
      </div>

      {/* Form Tambah Wallet */}
      <form
        onSubmit={addWallet}
        className="bg-white shadow rounded-lg p-4 mb-6 space-y-3"
      >
        <input
          placeholder="Nama Wallet"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
        />
        <input
          type="number"
          placeholder="Saldo Awal"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
        />
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600"
        >
          + Tambah Wallet
        </button>
      </form>

      {/* Daftar Wallet */}
      <h2 className="text-xl font-semibold mb-3">Daftar Wallet</h2>
      <div className="grid gap-3">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="p-4 bg-green-100 rounded-lg shadow flex justify-between items-center"
          >
            <span className="font-medium">{w.name}</span>
            <span className="font-bold text-green-700">
              Rp {w.balance.toLocaleString("id-ID")}
            </span>
          </div>
        ))}
        {wallets.length === 0 && (
          <p className="text-gray-500 italic">Belum ada wallet</p>
        )}
      </div>
    </div>
  );
}
