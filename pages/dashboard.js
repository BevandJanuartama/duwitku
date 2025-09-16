import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import useAuth from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Ambil wallets
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "wallets"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setWallets(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Ambil transaksi
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Pagination transaksi
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const totalIncome = transactions
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "keluar")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white rounded-2xl shadow-lg p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Selamat datang kembali, {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Logout
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Saldo</p>
                <p className="text-3xl font-bold">
                  Rp {totalBalance.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-blue-400/30 p-3 rounded-xl">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Income Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Total Pemasukan
                </p>
                <p className="text-3xl font-bold">
                  Rp {totalIncome.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-green-400/30 p-3 rounded-xl">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Expense Card */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">
                  Total Pengeluaran
                </p>
                <p className="text-3xl font-bold">
                  Rp {totalExpense.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-red-400/30 p-3 rounded-xl">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                    clipRule="evenodd"
                    transform="rotate(180 10 10)"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Wallets Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dompet Anda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {wallets.map((wallet) => (
              <Link key={wallet.id} href={`/wallets/${wallet.id}`}>
                <div className="group p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      {wallet.name}
                    </h3>
                    <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    Rp {wallet.balance?.toLocaleString("id-ID") || 0}
                  </p>
                  <p className="text-indigo-100 text-sm mt-1">
                    Klik untuk detail
                  </p>
                </div>
              </Link>
            ))}
            {wallets.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-lg">Belum ada wallet</p>
                <p className="text-sm">Tambahkan wallet pertama Anda</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/wallets">
            <button className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 font-semibold">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Tambah Wallet
            </button>
          </Link>
          <Link href="/transactions/add">
            <button className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 font-semibold">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Tambah Transaksi
            </button>
          </Link>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              Transaksi Terbaru
            </h2>
            <p className="text-gray-600 text-sm">Riwayat transaksi Anda</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Tanggal
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Wallet
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Deskripsi
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Tipe
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Jumlah
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTransactions.map((trx) => {
                  const walletName =
                    wallets.find((w) => w.id === trx.walletId)?.name ||
                    "Wallet tidak ditemukan";
                  const signedAmount =
                    trx.type === "keluar" ? -trx.amount : trx.amount;

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="p-4 text-gray-600">{trx.date}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {walletName}
                        </span>
                      </td>
                      <td className="p-4 text-gray-800 font-medium">
                        {trx.description}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            trx.type === "pemasukan"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trx.type === "pemasukan"
                            ? "Pemasukan"
                            : "Pengeluaran"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-bold ${
                            trx.type === "pemasukan"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          Rp {signedAmount.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link href={`/transactions/edit/${trx.id}`}>
                          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200 font-medium text-sm">
                            Edit
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {paginatedTransactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="text-gray-500">
                        <svg
                          className="w-16 h-16 mx-auto mb-4 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-lg font-medium">
                          Belum ada transaksi
                        </p>
                        <p className="text-sm">
                          Mulai dengan menambahkan transaksi pertama Anda
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2 bg-white rounded-xl shadow-lg p-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === i + 1
                      ? "bg-indigo-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
