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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "wallets"), {
        name: walletName,
        balance: Number(balance),
        userId: user.uid,
      });
      setWalletName("");
      setBalance("");
      setShowForm(false);
      router.reload(); // refresh data setelah tambah
    } catch (error) {
      console.error("Error adding wallet:", error);
      alert("Terjadi kesalahan saat menambah wallet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total balance
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 backdrop-blur-sm bg-white/80 border border-white/20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Wallets
                </h1>
                <p className="text-gray-500 mt-1">
                  Manage your financial accounts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {totalBalance.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:scale-105 flex items-center space-x-2"
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
        </div>

        {/* Add Wallet Button */}
        {!showForm && (
          <div className="mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="group w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center justify-center space-x-3"
            >
              <svg
                className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
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
              <span>Create New Wallet</span>
            </button>
          </div>
        )}

        {/* Enhanced Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 backdrop-blur-sm bg-white/90 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Wallet
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={addWallet} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wallet Name
                </label>
                <input
                  placeholder="e.g., Personal Savings, Business Account"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Initial Balance
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>Create Wallet</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Enhanced Wallets Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Wallets</h2>
            <div className="text-sm text-gray-500">
              {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
            </div>
          </div>

          {wallets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {wallets.map((wallet, index) => (
                <div
                  key={wallet.id}
                  className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden border border-gray-100 cursor-pointer"
                  onClick={() => router.push(`/wallets/${wallet.id}`)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                      {wallet.name}
                    </h3>

                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-emerald-600">
                        Rp {wallet.balance.toLocaleString("id-ID")}
                      </p>
                      <p className="text-sm text-gray-500">Available balance</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500 group-hover:text-emerald-600 transition-colors">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span>View details</span>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Wallets Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first wallet to start managing your finances
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                Create Your First Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
