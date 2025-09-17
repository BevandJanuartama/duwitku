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
    date: new Date().toISOString().split("T")[0], // Set today's date as default
    description: "",
    amount: "",
    type: "pemasukan",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
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
        if (form.type === "pemasukan") {
          newBalance += Number(form.amount);
        } else {
          newBalance -= Number(form.amount);
        }
        await updateDoc(walletRef, { balance: newBalance });
      }

      alert("Transaction successfully added!");
      router.push(`/`);
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Terjadi kesalahan saat menambah transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
              <p className="text-gray-600 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-sm bg-white/80 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Add Transaction
                </h1>
                <p className="text-gray-500 text-sm">
                  Record your income or expense
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md flex items-center space-x-2"
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
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm bg-white/90 border border-white/20">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Transaction Type Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Transaction Type
              </label>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => updateForm("type", "pemasukan")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    form.type === "pemasukan"
                      ? "bg-green-500 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm("type", "pengeluaran")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    form.type === "pengeluaran"
                      ? "bg-red-500 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
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
                      d="M20 12H4"
                    />
                  </svg>
                  <span>Expense</span>
                </button>
              </div>
            </div>

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
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                  required
                >
                  <option value="">-- Choose Wallet --</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: Rp{w.balance?.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
                <svg
                  className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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

            {/* Date Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Enter description"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => updateForm("amount", e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Transaction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
