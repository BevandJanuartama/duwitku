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
  const [type, setType] = useState("pemasukan");
  const [oldWalletId, setOldWalletId] = useState("");
  const [oldAmount, setOldAmount] = useState(0);
  const [oldType, setOldType] = useState("pemasukan");
  const [isUpdating, setIsUpdating] = useState(false);
  const [transactionLoaded, setTransactionLoaded] = useState(false);

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
      try {
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
          setTransactionLoaded(true);
        } else {
          alert("Transaksi tidak ditemukan!");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error loading transaction:", error);
        alert("Terjadi kesalahan saat memuat transaksi.");
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

    setIsUpdating(true);
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
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memperbarui transaksi.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !transactionLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
              <p className="text-gray-600 font-medium">
                Loading transaction details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-sm bg-white/80 border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Edit Transaction
              </h1>
              <p className="text-gray-500 text-sm">
                Update your transaction details
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm bg-white/90 border border-white/20">
          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            {/* Wallet Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-500"
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
                Select Wallet
              </label>
              <div className="relative">
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                  required
                >
                  <option value="">-- Choose Wallet --</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} - Rp {w.balance?.toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-500"
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
                Transaction Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                Description
              </label>
              <input
                type="text"
                placeholder="e.g., Grocery shopping, Salary, Rent payment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Amount and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
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
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm3-2V2h6v2H9z"
                    />
                  </svg>
                  Transaction Type
                </label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    required
                  >
                    <option value="pemasukan">Income</option>
                    <option value="pengeluaran">Expense</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Type Indicator */}
            {type && (
              <div
                className={`p-4 rounded-xl border-2 border-dashed ${
                  type === "pemasukan"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      type === "pemasukan" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {type === "pemasukan" ? (
                      <svg
                        className="w-4 h-4 text-green-600"
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
                    ) : (
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      type === "pemasukan" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    This will {type === "pemasukan" ? "increase" : "decrease"}{" "}
                    your wallet balance
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center space-x-2"
              >
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
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Updating...</span>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Update Transaction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
