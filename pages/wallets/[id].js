import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import useAuth from "../../hooks/useAuth";
import Link from "next/link";

export default function WalletDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Redirect jika belum login
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Load wallet dan transaksi
  useEffect(() => {
    if (id && user) {
      const loadData = async () => {
        const docRef = doc(db, "wallets", id);
        const walletSnap = await getDoc(docRef);
        if (walletSnap.exists()) {
          setWallet({ id: walletSnap.id, ...walletSnap.data() });
        }

        const q = query(
          collection(db, "transactions"),
          where("walletId", "==", id),
          where("userId", "==", user.uid)
        );
        const trxSnap = await getDocs(q);
        setTransactions(trxSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      };

      loadData();
    }
  }, [id, user]);

  // Hapus wallet + semua transaksi terkait
  const handleDelete = async () => {
    if (
      confirm(
        "Yakin ingin menghapus wallet ini? Semua transaksi juga akan hilang."
      )
    ) {
      try {
        const batch = writeBatch(db);

        // Hapus semua transaksi terkait wallet
        const q = query(
          collection(db, "transactions"),
          where("walletId", "==", id),
          where("userId", "==", user.uid)
        );
        const trxSnap = await getDocs(q);
        trxSnap.docs.forEach((docSnap) => {
          batch.delete(doc(db, "transactions", docSnap.id));
        });

        // Hapus wallet
        batch.delete(doc(db, "wallets", id));

        await batch.commit();

        alert("Wallet dan semua transaksi terkait berhasil dihapus!");
        router.push("/index");
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat menghapus wallet.");
      }
    }
  };

  if (!wallet) return <p className="p-6">Loading wallet...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{wallet.name}</h1>
        <div className="flex gap-2">
          <Link href="/index">
            <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              ⬅ Kembali
            </button>
          </Link>
          <Link href={`/wallets/edit/${wallet.id}`}>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              ✏ Edit
            </button>
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🗑 Hapus
          </button>
        </div>
      </div>

      {/* Saldo */}
      <div className="bg-green-100 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold">Saldo</h2>
        <p className="text-2xl font-bold text-green-700">
          Rp {wallet.balance?.toLocaleString("id-ID")}
        </p>
      </div>

      {/* Tabel transaksi */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border-b">Tanggal</th>
              <th className="p-3 border-b">Deskripsi</th>
              <th className="p-3 border-b">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trx) => (
              <tr key={trx.id} className="hover:bg-gray-50">
                <td className="p-3 border-b">{trx.date}</td>
                <td className="p-3 border-b">{trx.description}</td>
                <td className="p-3 border-b">
                  Rp {trx.amount?.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan="3"
                  className="text-center p-4 text-gray-500 italic"
                >
                  Belum ada transaksi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
