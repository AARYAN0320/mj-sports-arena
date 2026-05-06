import { useState, useEffect, useMemo, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, onSnapshot, query, orderBy
} from "firebase/firestore";
import QRCode from "qrcode";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

function generateSlots(startHour, endHour, duration = 1, courts = 1) {
  const slots = [];
  for (let h = startHour; h < endHour; h += duration) {
    const start = formatHour(h);
    const end = formatHour(h + duration);
    for (let c = 1; c <= courts; c++) {
      slots.push(`${start} - ${end} (Court ${c})`);
    }
  }
  return slots;
}

function formatHour(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
}

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const CONFIG = {
  arenaName: "MJ Sports Arena",
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || "admin123",
  upiId: import.meta.env.VITE_UPI_ID || "yourname@upi",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210",

  sports: {
    cricket: {
      name: "Cricket",
      emoji: "🏏",
      pricePerHour: 1200,
      color: "#f59e0b",
      slots: [
        "5:00 AM - 6:00 AM", "6:00 AM - 7:00 AM", "7:00 AM - 8:00 AM",
        "8:00 AM - 9:00 AM", "9:00 AM - 10:00 AM", "10:00 AM - 11:00 AM",
        "11:00 AM - 12:00 PM", "12:00 PM - 1:00 PM", "1:00 PM - 2:00 PM",
        "2:00 PM - 3:00 PM", "3:00 PM - 4:00 PM", "4:00 PM - 5:00 PM",
        "5:00 PM - 6:00 PM", "6:00 PM - 7:00 PM", "7:00 PM - 8:00 PM",
        "8:00 PM - 9:00 PM", "9:00 PM - 10:00 PM", "10:00 PM - 11:00 PM"
      ]
    },
    pickleball: {
      name: "Pickleball",
      emoji: "🏓",
      pricePerHour: 600,
      color: "#22c55e",
      slots: generateSlots(5, 23, 1, 2)
    }
  }
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    background: "linear-gradient(135deg, #020817 0%, #1e293b 100%)",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  nav: {
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(20px)",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navBrand: {
    fontSize: "1.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  adminBtn: {
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    marginTop: "2rem",
  },
  formCard: {
    background: "rgba(30, 41, 59, 0.6)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "2rem",
    border: "1px solid rgba(71, 85, 105, 0.3)",
  },
  sectionTitle: {
    fontSize: "1.75rem",
    fontWeight: 800,
    margin: "0 0 1rem 0",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  sportToggle: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  sportBtn: {
    padding: "1rem 1.25rem",
    borderRadius: "16px",
    border: "2px solid",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
  },
  label: {
    display: "block",
    margin: "1rem 0 0.5rem 0",
    fontWeight: 600,
    color: "#94a3b8",
    fontSize: "0.875rem",
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem",
    border: "2px solid #334155",
    borderRadius: "12px",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    fontSize: "1rem",
    transition: "all 0.2s",
  },
  slotBtn: {
    padding: "0.875rem 1rem",
    borderRadius: "12px",
    border: "2px solid",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.2s",
    textAlign: "left",
  },
  primaryBtn: {
    padding: "1rem 1.5rem",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },
  secondaryBtn: {
    padding: "1rem 1.5rem",
    border: "2px solid #3b82f6",
    background: "transparent",
    color: "#3b82f6",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#1e293b",
    padding: "2rem",
    borderRadius: "20px",
    maxWidth: "320px",
    width: "90%",
    textAlign: "center",
    border: "1px solid rgba(71, 85, 105, 0.3)",
  },
  closeBtn: {
    marginTop: "1rem",
    padding: "0.75rem 2rem",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
  },
  errorText: {
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.1)",
    padding: "0.75rem",
    borderRadius: "8px",
    margin: "1rem 0",
    borderLeft: "4px solid #ef4444",
  },
  successBox: {
    background: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
    padding: "1rem",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: 600,
    margin: "1rem 0",
    border: "2px solid rgba(34, 197, 94, 0.3)",
  },
  filterBtn: {
    padding: "0.5rem 1rem",
    border: "1px solid #334155",
    background: "transparent",
    color: "#64748b",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  bookingRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    background: "rgba(15, 23, 42, 0.5)",
    borderRadius: "12px",
  },
  hero: {
    textAlign: "center",
    padding: "3rem 2rem",
    background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)",
    borderRadius: "24px",
    marginBottom: "2rem",
    border: "1px solid rgba(59, 130, 246, 0.2)",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getTodayStr = () => new Date().toISOString().split("T")[0];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
// 🔥 NEW FIXED WhatsApp function
const sendWhatsAppFixed = (booking) => {
  const sport = CONFIG.sports[booking.sport];
  const cleanWhatsApp = CONFIG.whatsappNumber.replace(/[^0-9]/g, ''); // Remove +,-,spaces
  
  const message = `🏟️ MJ Sports Arena - BOOKING CONFIRMED!%0A%0A` +
    `👤 ${booking.name}%0A` +
    `📱 ${booking.phone}%0A` +
    `⚽ ${sport.emoji} ${sport.name}%0A` +
    `📅 ${booking.date}%0A` +
    `⏰ ${booking.slot}%0A%0A` +
    `💰 ${formatCurrency(sport.pricePerHour)}%0A` +
    `📍 Kharar, Punjab`;

  const url = `https://wa.me/${cleanWhatsApp}?text=${message}`;
  
  console.log("📱 WhatsApp opening:", url);
  window.open(url, '_blank', 'noopener,noreferrer');
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={styles.hero}>
      <h1 style={{ fontSize: "3rem", fontWeight: 900, margin: "0 0 1rem", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        MJ Sports Arena
      </h1>
      <p style={{ fontSize: "1.25rem", color: "#94a3b8", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
        Book cricket & pickleball slots instantly. Real-time availability. Secure payments.
      </p>
    </div>
  );
}

function QRModal({ sport, onClose }) {
  const [qrUrl, setQrUrl] = useState("");
  const price = CONFIG.sports[sport]?.pricePerHour || 0;
  const upiLink = `upi://pay?pa=${encodeURIComponent(CONFIG.upiId)}&pn=${encodeURIComponent(CONFIG.arenaName)}&am=${price}&cu=INR&tn=${encodeURIComponent(CONFIG.sports[sport]?.name + " Booking")}`;

  useEffect(() => {
    QRCode.toDataURL(upiLink, { width: 220, margin: 2, color: { dark: "#000", light: "#fff" } })
      .then(setQrUrl)
      .catch(console.error);
  }, [sport, upiLink]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontFamily: "'Inter', sans-serif" }}>Pay via UPI</h3>
        <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: 13 }}>Scan to pay {formatCurrency(price)}</p>
        {qrUrl && <img src={qrUrl} alt="UPI QR" style={{ borderRadius: 12, width: 220 }} />}
        <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 12 }}>UPI ID: <strong style={{ color: "#e2e8f0" }}>{CONFIG.upiId}</strong></p>
        <button style={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function BookingForm({ bookedSlots, isFirebaseReady = false }) {
  const [sport, setSport] = useState("cricket");
  const [date, setDate] = useState(getTodayStr());
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const sportConfig = CONFIG.sports[sport];
  const bookedSlotsForDay = useMemo(() => {
  if (!isFirebaseReady) return [];
  
  return bookedSlots
    .filter((b) => 
      b.sport === sport && 
      b.date === date && 
      typeof b.slot === 'string'
    )
    .map((b) => b.slot.trim());
}, [bookedSlots, sport, date, isFirebaseReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!slot || !name.trim() || !phone.trim()) {
      setError("Please fill all fields and select a slot.");
      return;
    }
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const booking = {
        sport,
        date,
        slot: slot.trim(),
        name: name.trim(),
        phone: phone.trim(),
        amount: sportConfig.pricePerHour,
        createdAt: new Date().toISOString(),
      };

      console.log("💾 Saving to Firebase:", booking);
      await addDoc(collection(db, "bookings"), booking);
      
      console.log("✅ Booking saved successfully!");
      
      setName("");
      setPhone("");
      setSlot("");
      setSuccess(true);
      setTimeout(() => {
  sendWhatsAppFixed(booking);  // 🔥 Use fixed function
  setSuccess(false);
}, 800); // Slightly faster

    } catch (e) {
      console.error("❌ Error:", e);
      setError("Booking failed. Check internet connection.");
    } finally {
      setLoading(false);
    }
  };

const today = getTodayStr();

// 🔥 ADD THIS BLOCK HERE 👇
if (!isFirebaseReady) {
  return (
    <div style={styles.formCard}>
      <div style={{ 
        textAlign: "center", 
        padding: "3rem", 
        color: "#94a3b8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{ fontSize: "2.5rem" }}>⚡</div>
        <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
          Loading available slots...
        </div>
        <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>
          Connecting to Firebase (2 seconds)
        </div>
      </div>
    </div>
  );
}

  return (
    <div style={styles.formCard}>
      <h2 style={{ ...styles.sectionTitle, marginBottom: 24 }}>Book Your Slot</h2>

      <div style={styles.sportToggle}>
        {Object.entries(CONFIG.sports).map(([key, s]) => (
          <button
            key={key}
            onClick={() => { setSport(key); setSlot(""); }}
            style={{
              ...styles.sportBtn,
              background: sport === key ? s.color : "transparent",
              color: sport === key ? "#000" : "#94a3b8",
              border: `1.5px solid ${sport === key ? s.color : "#334155"}`,
            }}
          >
            <span style={{ fontSize: 20 }}>{s.emoji}</span>
            <span style={{ fontWeight: 600 }}>{s.name}</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{formatCurrency(s.pricePerHour)}/hr</span>
          </button>
        ))}
      </div>

      <label style={styles.label}>Select Date</label>
      <input
        type="date"
        min={today}
        value={date}
        onChange={(e) => { setDate(e.target.value); setSlot(""); }}
        style={styles.input}
      />

      <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "1rem" }}>
       {sportConfig.slots.map((s) => {
  const cleanSlot = s.trim();
  const booked = bookedSlotsForDay.includes(cleanSlot);
  const selected = slot === cleanSlot;
          return (
            <button
              key={s}
              disabled={booked}
              oonClick={() => !booked && setSlot(cleanSlot)}
              style={{
                ...styles.slotBtn,
                background: booked ? "#1e293b" : selected ? sportConfig.color : "transparent",
                color: booked ? "#475569" : selected ? "#000" : "#cbd5e1",
                border: `1.5px solid ${booked ? "#1e293b" : selected ? sportConfig.color : "#334155"}`,
                cursor: booked ? "not-allowed" : "pointer",
                textDecoration: booked ? "line-through" : "none",
                marginBottom: 6,
                width: "100%"
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      <label style={styles.label}>Your Name</label>
      <input
        type="text"
        placeholder="Enter your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
      />
      
      <label style={styles.label}>Phone Number</label>
      <input
        type="tel"
        placeholder="10-digit mobile number"
        value={phone}
        maxLength={10}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
        style={styles.input}
      />

      {error && <p style={styles.errorText}>{error}</p>}
      {success && (
        <div style={styles.successBox}>
          ✅ Booking confirmed! WhatsApp opening...
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={handleSubmit}
          disabled={loading || !slot || !name || !phone}
          style={{ ...styles.primaryBtn, background: sportConfig.color, flex: 2 }}
        >
          {loading ? "Booking..." : `Confirm Booking — ${formatCurrency(sportConfig.pricePerHour)}`}
        </button>
        <button
          onClick={() => setShowQR(true)}
          style={{ ...styles.secondaryBtn, flex: 1 }}
          disabled={!slot}
        >
          📱 Pay QR
        </button>
      </div>

      {showQR && <QRModal sport={sport} onClose={() => setShowQR(false)} />}
    </div>
  );
}

function TodayView({ bookedSlots }) {
  const [filter, setFilter] = useState("all");
  const today = getTodayStr();
  const todayBookings = useMemo(() =>
    bookedSlots.filter((b) => b.date === today),
    [bookedSlots, today]
  );
  const displayed = filter === "all" ? todayBookings : todayBookings.filter((b) => b.sport === filter);

  return (
    <div style={styles.formCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={styles.sectionTitle}>Today's Availability</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "cricket", "pickleball"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                background: filter === f ? "#3b82f6" : "transparent",
                color: filter === f ? "#fff" : "#64748b",
                borderColor: filter === f ? "#3b82f6" : "#334155",
              }}
            >
              {f === "all" ? "All" : CONFIG.sports[f]?.emoji + " " + CONFIG.sports[f]?.name}
            </button>
          ))}
        </div>
      </div>

      {displayed.length === 0 ? (
        <p style={{ color: "#475569", textAlign: "center", padding: "24px 0" }}>
          {filter === "all" ? "No bookings today yet!" : `No ${CONFIG.sports[filter]?.name} bookings today`}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {displayed.map((b, i) => {
            const s = CONFIG.sports[b.sport];
            return (
              <div key={i} style={{ ...styles.bookingRow, borderLeft: `3px solid ${s?.color}` }}>
                <span style={{ fontSize: 18 }}>{s?.emoji}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 14 }}>{b.slot}</span>
                  <span style={{ color: "#64748b", fontSize: 12, marginLeft: 8 }}>{b.name}</span>
                </div>
                <span style={{ color: s?.color, fontSize: 13, fontWeight: 600 }}>
                  {formatCurrency(b.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === CONFIG.adminPassword) {
      onLogin();
    } else {
      setError("Wrong password!");
    }
  };

  return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={styles.formCard}>
        <h2 style={styles.sectionTitle}>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Enter admin password"
          />
          {error && <p style={styles.errorText}>{error}</p>}
          <button type="submit" style={{ ...styles.primaryBtn, background: "#3b82f6", width: "100%", marginTop: "1rem" }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ bookings, onCancel, onLogout }) {
  const today = getTodayStr();

  const todayBookings = bookings.filter(b => b.date === today);

  return (
    <div style={{ background: "#020817", minHeight: "100vh", color: "#e2e8f0" }}>
      <div style={styles.nav}>
        <span style={styles.navBrand}>Admin Dashboard</span>
        <button onClick={onLogout} style={{ ...styles.adminBtn, background: "#ef4444" }}>Logout</button>
      </div>
      
      <div style={styles.main}>
        <div style={styles.formCard}>
          <h2 style={styles.sectionTitle}>Today's Bookings ({todayBookings.length})</h2>
          {todayBookings.length === 0 ? (
            <p style={{ color: "#475569", textAlign: "center", padding: "2rem" }}>No bookings today</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {todayBookings.map((booking) => {
                const sport = CONFIG.sports[booking.sport];
                return (
                  <div key={booking.id} style={{
                    ...styles.bookingRow,
                    borderLeft: `4px solid ${sport.color}`,
                    padding: "1.25rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                      <span style={{ fontSize: 24 }}>{sport.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{booking.slot}</div>
                        <div style={{ color: "#94a3b8" }}>{booking.name} • {booking.phone}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: sport.color }}>{formatCurrency(booking.amount)}</div>
                      <button
                        onClick={() => {
                          if (confirm("Cancel this booking?")) {
                            onCancel(booking.id);
                          }
                        }}
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem 1rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("home");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  useEffect(() => {
  console.log("🔥 Connecting to Firebase...");
  
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log("📊 Bookings loaded:", data.length);
    setBookings(data);
    
    // 🔥 FIX: Mark Firebase ready
    setIsFirebaseReady(true);
  }, (error) => {
    console.error("❌ Firebase error:", error);
    setIsFirebaseReady(true); // Still ready even on error
  });

  return () => unsubscribe();
}, []);

  const handleCancel = useCallback((id) => {
    deleteDoc(doc(db, "bookings", id));
  }, []);

  if (view === "adminLogin" && !adminLoggedIn) {
    return <AdminLogin onLogin={() => { setAdminLoggedIn(true); setView("admin"); }} />;
  }

  if (view === "admin" && adminLoggedIn) {
    return (
      <AdminDashboard 
        bookings={bookings} 
        onCancel={handleCancel} 
        onLogout={() => { 
          setAdminLoggedIn(false); 
          setView("home"); 
        }} 
      />
    );
  }

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <span style={styles.navBrand}>🏟️ MJ Sports Arena</span>
        <button onClick={() => setView("adminLogin")} style={styles.adminBtn}>Admin →</button>
      </nav>

      <main style={styles.main}>
        <Hero />
        <div style={styles.contentGrid}>
  <div><BookingForm bookedSlots={bookings} isFirebaseReady={isFirebaseReady} /></div>
  <div><TodayView bookedSlots={bookings} isFirebaseReady={isFirebaseReady} /></div>
</div>
      </main>

      {/* CONTACT SECTION */}
      <div style={{
        marginTop: "60px",
        padding: "40px 20px",
        background: "#0f172a",
        color: "white"
      }}>
        <div style={{
          maxWidth: "1100px",
          margin: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: "26px", marginBottom: "15px" }}>📞 Contact Us</h2>
            <p style={{ margin: "8px 0", fontSize: "16px" }}><strong>MJ Sports Arena</strong></p>
            <p style={{ margin: "8px 0" }}>📍 Sunny Enclave, Kharar, Punjab</p>
            <p style={{ margin: "8px 0" }}>📞 +91 9041528165</p>
            <p style={{ margin: "8px 0" }}>📧 mjsportsarena@gmail.com</p>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a href="tel:+919041528165">
                <button style={{
                  padding: "10px 18px",
                  background: "#22c55e",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}>📞 Call Now</button>
              </a>
              <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                <button style={{
                  padding: "10px 18px",
                  background: "#25D366",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}>💬 WhatsApp</button>
              </a>
            </div>
          </div>
          <div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3475.4891742999997!2d76.63523431525879!3d30.804999681849997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDUwJzE3LjkiTiA3NmszOSeaCcyOS4zIlE!5e0!3m2!1sen!2sin!4v1699999999999"
              width="100%"
              height="300"
              style={{ border: 0, borderRadius: "12px" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="MJ Sports Arena Location"
            />
          </div>
        </div>
      </div>
    </div>
  );
}