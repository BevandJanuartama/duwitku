import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import useAuth from "../../../hooks/useAuth";

export default function EditTransaction() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();

  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("pemasukan"); // default tipe
  const [oldWalletId, setOldWalletId] = useState("");
  const [oldAmount, setOldAmount] = useState(0);
  const [oldType, setOldType] = useState("pemasukan");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Load wallets
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

  // Load transaksi
  useEffect(() => {
    if (!id || !user) return;

    const loadTransaction = async () => {
      const docRef = doc(db, "transactions", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWalletId(data.walletId || "");
        setDate(data.date || "");
        setDescription(data.description || "");
        setAmount(data.amount || 0);
        setType(data.type || "pemasukan");
        setOldWalletId(data.walletId);
        setOldAmount(data.amount || 0);
        setOldType(data.type || "pemasukan");
      } else {
        alert("Transaksi tidak ditemukan!");
        router.push("/dashboard");
      }
    };

    loadTransaction();
  }, [id, user, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!walletId || !date || !description || !amount || !type) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      const newAmount = Number(amount);

      // Hitung perubahan saldo lama
      let oldSignedAmount = oldType === "pemasukan" ? oldAmount : -oldAmount;
      let newSignedAmount = type === "pemasukan" ? newAmount : -newAmount;

      // Jika wallet tidak berubah
      if (oldWalletId === walletId) {
        const walletRef = doc(db, "wallets", walletId);
        const walletSnap = await getDoc(walletRef);
        if (walletSnap.exists()) {
          const currentBalance = walletSnap.data().balance || 0;
          await updateDoc(walletRef, {
            balance: currentBalance - oldSignedAmount + newSignedAmount,
          });
        }
      } else {
        // Wallet lama: kurangi saldo lama
        if (oldWalletId) {
          const oldWalletRef = doc(db, "wallets", oldWalletId);
          const oldWalletSnap = await getDoc(oldWalletRef);
          if (oldWalletSnap.exists()) {
            const oldBalance = oldWalletSnap.data().balance || 0;
            await updateDoc(oldWalletRef, {
              balance: oldBalance - oldSignedAmount,
            });
          }
        }
        // Wallet baru: tambah saldo baru
        if (walletId) {
          const newWalletRef = doc(db, "wallets", walletId);
          const newWalletSnap = await getDoc(newWalletRef);
          if (newWalletSnap.exists()) {
            const newBalance = newWalletSnap.data().balance || 0;
            await updateDoc(newWalletRef, {
              balance: newBalance + newSignedAmount,
            });
          }
        }
      }

      // Update transaksi
      const docRef = doc(db, "transactions", id);
      await updateDoc(docRef, {
        walletId,
        date,
        description,
        amount: newAmount,
        type,
      });

      alert("Transaksi berhasil diperbarui!");
      router.push("/index");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memperbarui transaksi.");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Transaksi</h1>

      <form
        onSubmit={handleUpdate}
        className="bg-white shadow rounded-lg p-4 space-y-3"
      >
        {/* Wallet */}
        <select
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
          required
        >
          <option value="">-- Pilih Wallet --</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {/* Tanggal */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
          required
        />

        {/* Deskripsi */}
        <input
          type="text"
          placeholder="Deskripsi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
          required
        />

        {/* Jumlah */}
        <input
          type="number"
          placeholder="Jumlah"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
          required
        />

        {/* Pemasukan/Keluar */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-300 outline-none"
          required
        >
          <option value="pemasukan">Pemasukan</option>
          <option value="keluar">Keluar</option>
        </select>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.push("/index")}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Update Transaksi
          </button>
        </div>
      </form>
    </div>
  );
}
