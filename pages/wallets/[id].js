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
  const [isDeleting, setIsDeleting] = useState(false);

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
      setIsDeleting(true);
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
        router.push("/");
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat menghapus wallet.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600 font-medium">
                Loading wallet details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with improved styling */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-sm bg-white/80 border border-white/20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {wallet.name}
                </h1>
                <p className="text-gray-500 text-sm">
                  Wallet Details & Transactions
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/">
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:scale-105 flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>Back</span>
                </button>
              </Link>

              <Link href={`/wallets/edit/${wallet.id}`}>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit</span>
                </button>
              </Link>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Balance Card */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-10 -translate-x-10"></div>
          <div className="relative z-10">
            {/* <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white/90">
                Current Balance
              </h2>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-15 h-15"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div> */}
            <p className="text-4xl font-bold mb-2">
              Rp {wallet.balance?.toLocaleString("id-ID")}
            </p>
            <p className="text-white/80 text-sm">
              {transactions.length}{" "}
              {transactions.length === 1 ? "transaction" : "transactions"}{" "}
              recorded
            </p>
          </div>
        </div>

        {/* Enhanced Transactions Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm bg-white/80 border border-white/20">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Transaction History
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Latest first</span>
              </div>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((trx, index) => (
                    <tr
                      key={trx.id}
                      className="hover:bg-gray-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {trx.date}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {trx.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${
                            trx.amount >= 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trx.amount >= 0 ? "+" : ""}Rp{" "}
                          {trx.amount?.toLocaleString("id-ID")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Transactions Yet
              </h3>
              <p className="text-gray-500">
                Start adding transactions to see them here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
