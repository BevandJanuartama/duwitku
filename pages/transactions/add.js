import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import useAuth from "../../hooks/useAuth";

export default function AddTransaction() {
  const router = useRouter();
  const { walletId } = router.query;
  const { user, loading } = useAuth();

  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(walletId || "");
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
    type: "income",
  });

  // Cek login
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Ambil daftar wallet user
  useEffect(() => {
    if (user) {
      const loadWallets = async () => {
        const q = query(
          collection(db, "wallets"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setWallets(list);

        // kalau walletId dari URL ada, set otomatis
        if (walletId) setSelectedWallet(walletId);
      };
      loadWallets();
    }
  }, [user, walletId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWallet) return alert("Pilih wallet dulu.");

    // Simpan transaksi
    await addDoc(collection(db, "transactions"), {
      ...form,
      amount: Number(form.amount),
      walletId: selectedWallet,
      userId: user.uid,
    });

    // Update saldo wallet
    const walletRef = doc(db, "wallets", selectedWallet);
    const walletSnap = await getDoc(walletRef);

    if (walletSnap.exists()) {
      let newBalance = walletSnap.data().balance || 0;
      if (form.type === "income") {
        newBalance += Number(form.amount);
      } else {
        newBalance -= Number(form.amount);
      }
      await updateDoc(walletRef, { balance: newBalance });
    }

    router.push(`/wallets/${selectedWallet}`);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tambah Transaksi</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown wallet */}
        <select
          value={selectedWallet}
          onChange={(e) => setSelectedWallet(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">-- Pilih Wallet --</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} (Rp {w.balance.toLocaleString("id-ID")})
            </option>
          ))}
        </select>

        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Deskripsi"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Jumlah"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600"
        >
          Simpan
        </button>
      </form>
    </div>
  );
}
