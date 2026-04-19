import { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, query, where, orderBy, Timestamp, onSnapshot
} from "firebase/firestore";
import QRCode from "qrcode";

// ─── FIREBASE CONFIG ────────────────────────────────────────────────────────
// Replace with your actual Firebase config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
console.log("Firebase Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// ─── CONFIGURATION ─────────────────────────────────────────
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
    "5:00 AM - 6:00 AM",
    "6:00 AM - 7:00 AM",
    "7:00 AM - 8:00 AM",
    "8:00 AM - 9:00 AM",
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 1:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM",
    "5:00 PM - 6:00 PM",
    "6:00 PM - 7:00 PM",
    "7:00 PM - 8:00 PM",
    "8:00 PM - 9:00 PM",
    "9:00 PM - 10:00 PM",
    "10:00 PM - 11:00 PM"
  ]
},

    pickleball: {
      name: "Pickleball",
      emoji: "🏓",
      pricePerHour: 600,
      color: "#22c55e",
      slots: generateSlots(5, 23, 1, 2) // 2 courts
    }
  }
};

// ─── HELPERS ───────────────────────────────────────────────
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

const sendWhatsApp = (booking) => {
  const sport = CONFIG.sports[booking.sport];

  const message = encodeURIComponent(
    `🏟 MJ Sports Arena Booking\n\n` +
    `Name: ${booking.name}\n` +
    `Phone: ${booking.phone}\n` +
    `Sport: ${sport.name}\n` +
    `Date: ${booking.date}\n` +
    `Slot: ${booking.slot}\n\n` +
    `Amount: ₹${sport.pricePerHour}\n` +
    `UPI: ${CONFIG.upiId}`
  );

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;

 window.open(url, "_blank");
};
// ─── QR CODE MODAL ────────────────────────────────────────────────────────────
function QRModal({ sport, onClose }) {
  const [qrUrl, setQrUrl] = useState("");
  const price = CONFIG.sports[sport]?.pricePerHour || 0;
  const upiLink = `upi://pay?pa=${CONFIG.upiId}&pn=${encodeURIComponent(CONFIG.arenaName)}&am=${price}&cu=INR&tn=${encodeURIComponent(CONFIG.sports[sport]?.name + " Booking")}`;

  useEffect(() => {
    QRCode.toDataURL(upiLink, { width: 220, margin: 2, color: { dark: "#000", light: "#fff" } })
      .then(setQrUrl);
  }, [sport]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontFamily: "'Syne', sans-serif" }}>Pay via UPI</h3>
        <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: 13 }}>Scan to pay {formatCurrency(price)}</p>
        {qrUrl && <img src={qrUrl} alt="UPI QR" style={{ borderRadius: 12, width: 220 }} />}
        <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 12 }}>UPI ID: <strong style={{ color: "#e2e8f0" }}>{CONFIG.upiId}</strong></p>
        <button style={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─── BOOKING FORM ─────────────────────────────────────────────────────────────
function BookingForm({ bookedSlots, onBook }) {
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

  const bookedSlotsForDay = useMemo(() =>
    bookedSlots
      .filter((b) => b.sport === sport && b.date === date)
      .map((b) => b.slot),
    [bookedSlots, sport, date]
  );

 const handleSubmit = async (e) => {
  e.preventDefault(); // VERY IMPORTANT

  if (loading) return; // stop double click {
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
        slot,
        name: name.trim(),
        phone: phone.trim(),
        amount: sportConfig.pricePerHour,
        createdAt: new Date(),
      };
      console.log("Saving booking:", booking);

await addDoc(collection(db, "bookings"), booking);

console.log("Booking saved successfully");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSlot("");
        setName("");
        setPhone("");
      }, 3000);
      // WhatsApp confirmation
      setTimeout(() => sendWhatsApp(booking), 500);
    } catch (e) {
      setError("Booking failed. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const today = getTodayStr();

  return (
    <div style={styles.formCard}>
      <h2 style={{ ...styles.sectionTitle, marginBottom: 24 }}>Book Your Slot</h2>

      {/* Sport Selection */}
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

      {/* Date Picker */}
      <label style={styles.label}>Select Date</label>
      <input
        type="date"
        min={today}
        value={date}
        onChange={(e) => { setDate(e.target.value); setSlot(""); }}
        style={styles.input}
      />

      {/* Slot Grid */}
     {sportConfig.slots.map((s) => {
 const booked = bookedSlots.some(
    b => b.date === date && b.slot === s && b.sport === sport
  );

  const selected = slot === s;

  return (
    <button
      key={s}
      disabled={booked}
      onClick={() => !booked && setSlot(s)}
      style={{
        ...styles.slotBtn,
        background: booked
          ? "#1e293b"
          : selected
          ? sportConfig.color
          : "transparent",
        color: booked
          ? "#475569"
          : selected
          ? "#000"
          : "#cbd5e1",
        border: `1.5px solid ${
          booked ? "#1e293b" : selected ? sportConfig.color : "#334155"
        }`,
        cursor: booked ? "not-allowed" : "pointer",
        textDecoration: booked ? "line-through" : "none",
      }}
    >
      {s}
    </button>
  );
})}

      {/* User Details */}
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
          ✅ Booking confirmed! WhatsApp message opening...
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...styles.primaryBtn, background: sportConfig.color, flex: 2 }}
        >
          {loading ? "Booking..." : `Confirm Booking — ${formatCurrency(sportConfig.pricePerHour)}`}
        </button>
        <button
          onClick={() => setShowQR(true)}
          style={{ ...styles.secondaryBtn, flex: 1 }}
        >
          📱 Pay QR
        </button>
      </div>

      {showQR && <QRModal sport={sport} onClose={() => setShowQR(false)} />}
    </div>
  );
}

// ─── TODAY'S AVAILABILITY WIDGET ──────────────────────────────────────────────
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

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ bookings, onCancel, onLogout }) {
  const [tab, setTab] = useState("all");
  const [filterSport, setFilterSport] = useState("all");
  const [cancelConfirm, setCancelConfirm] = useState(null);

  const today = getTodayStr();
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const filtered = useMemo(() => {
    let base = bookings;
    if (filterSport !== "all") base = base.filter((b) => b.sport === filterSport);
    if (tab === "today") base = base.filter((b) => b.date === today);
    if (tab === "upcoming") base = base.filter((b) => b.date >= today);
    return [...base].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [bookings, tab, filterSport, today]);

  const revenue = {
    daily: bookings.filter((b) => b.date === today).reduce((s, b) => s + b.amount, 0),
    weekly: bookings.filter((b) => new Date(b.date) >= startOfWeek).reduce((s, b) => s + b.amount, 0),
    monthly: bookings.filter((b) => new Date(b.date) >= startOfMonth).reduce((s, b) => s + b.amount, 0),
    total: bookings.reduce((s, b) => s + b.amount, 0),
  };

  const handleCancel = async (id) => {
    await deleteDoc(doc(db, "bookings", id));
    onCancel(id);
    setCancelConfirm(null);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ ...styles.heroTitle, fontSize: 26, marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: "#64748b", margin: 0 }}>{CONFIG.arenaName}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Revenue Cards */}
      <div style={styles.revenueGrid}>
        {[
          { label: "Today's Revenue", value: revenue.daily, color: "#22c55e" },
          { label: "This Week", value: revenue.weekly, color: "#3b82f6" },
          { label: "This Month", value: revenue.monthly, color: "#a855f7" },
          { label: "All Time", value: revenue.total, color: "#f59e0b" },
        ].map((r) => (
          <div key={r.label} style={styles.revenueCard}>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{r.label}</span>
            <span style={{ color: r.color, fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif", display: "block", marginTop: 6 }}>
              {formatCurrency(r.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary Count */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={styles.countBadge}>📋 Total: {bookings.length}</div>
        <div style={styles.countBadge}>🏏 Cricket: {bookings.filter((b) => b.sport === "cricket").length}</div>
        <div style={styles.countBadge}>🥒 Pickleball: {bookings.filter((b) => b.sport === "pickleball").length}</div>
        <div style={styles.countBadge}>📅 Today: {bookings.filter((b) => b.date === today).length}</div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all", "All Bookings"], ["today", "Today"], ["upcoming", "Upcoming"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.filterBtn, background: tab === t ? "#3b82f6" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {["all", "cricket", "pickleball"].map((f) => (
          <button key={f} onClick={() => setFilterSport(f)} style={{ ...styles.filterBtn, background: filterSport === f ? "#334155" : "transparent", color: filterSport === f ? "#e2e8f0" : "#64748b" }}>
            {f === "all" ? "All Sports" : CONFIG.sports[f]?.emoji + " " + CONFIG.sports[f]?.name}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div style={styles.tableWrap}>
        {filtered.length === 0 ? (
          <p style={{ color: "#475569", textAlign: "center", padding: "32px 0" }}>No bookings found</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Sport", "Date", "Slot", "Customer", "Phone", "Amount", "Action"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const s = CONFIG.sports[b.sport];
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>
                      <span style={{ color: s?.color }}>{s?.emoji} {s?.name}</span>
                    </td>
                    <td style={styles.td}>{formatDate(b.date)}</td>
                    <td style={styles.td}>{b.slot}</td>
                    <td style={styles.td}>{b.name}</td>
                    <td style={styles.td}>{b.phone}</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: 600 }}>{formatCurrency(b.amount)}</td>
                    <td style={styles.td}>
                      {cancelConfirm === b.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleCancel(b.id)} style={styles.dangerBtn}>Yes</button>
                          <button onClick={() => setCancelConfirm(null)} style={styles.ghostBtn}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => setCancelConfirm(b.id)} style={styles.dangerBtn}>Cancel</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const handleLogin = () => {
    if (pw === CONFIG.adminPassword) {
      onLogin();
    } else {
      setErr("Incorrect password");
      setTimeout(() => setErr(""), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
      <div style={styles.loginCard}>
        <div style={{ fontSize: 40, marginBottom: 16, textAlign: "center" }}>🔐</div>
        <h2 style={{ textAlign: "center", fontFamily: "'Syne', sans-serif", color: "#e2e8f0", marginBottom: 24 }}>Admin Login</h2>
        <input
          type="password"
          placeholder="Enter admin password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={styles.input}
        />
        {err && <p style={styles.errorText}>{err}</p>}
        <button onClick={handleLogin} style={{ ...styles.primaryBtn, width: "100%", marginTop: 12 }}>
          Login
        </button>
      </div>
    </div>
  );
}

// ─── LANDING HERO ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={styles.hero}>
      <div style={styles.heroGlow} />
      <p style={styles.heroTag}>⚡ Premium Sports Facility</p>
      <h1 style={styles.heroTitle}>
        MJ <span style={{ color: "#22c55e" }}>Sports</span> Arena
      </h1>
      <p style={styles.heroSub}>
        Book cricket grounds & pickleball courts instantly. No calls needed.
      </p>
      <div style={styles.sportCards}>
        {Object.values(CONFIG.sports).map((s) => (
          <div key={s.name} style={{ ...styles.sportCard, borderColor: s.color + "44" }}>
            <span style={{ fontSize: 32 }}>{s.emoji}</span>
            <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 16 }}>{s.name}</span>
            <span style={{ color: s.color, fontSize: 14, fontWeight: 600 }}>{formatCurrency(s.pricePerHour)}/hr</span>
            <span style={{ color: "#64748b", fontSize: 12 }}>{s.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("home"); // home | admin | adminLogin
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "bookings"), orderBy("createdAt", "desc")),
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    return unsub;
  }, []);

  const handleBook = (booking) => {
    setBookings((prev) => [{ ...booking }, ...prev]);
  };

  const handleCancel = (id) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  if (view === "adminLogin" && !adminLoggedIn) {
    return (
      <AdminLogin onLogin={() => { setAdminLoggedIn(true); setView("admin"); }} />
    );
  }

  if (view === "admin" && adminLoggedIn) {
    return (
      <div style={{ background: "#020817", minHeight: "100vh", color: "#e2e8f0" }}>
        <AdminDashboard
          bookings={bookings}
          onCancel={handleCancel}
          onLogout={() => { setAdminLoggedIn(false); setView("home"); }}
        />
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navBrand}>🏟️ MJ Sports Arena</span>
        <button
          onClick={() => setView("adminLogin")}
          style={styles.adminBtn}
        >
          Admin →
        </button>
      </nav>

      <main style={styles.main}>
        <Hero />
        <div style={styles.contentGrid}>
          <div>
            <BookingForm bookedSlots={bookings} onBook={handleBook} />
          </div>
          <div>
            <TodayView bookedSlots={bookings} />
          </div>
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

    {/* LEFT SIDE - DETAILS */}
    <div>
      <h2 style={{ fontSize: "26px", marginBottom: "15px" }}>
        📞 Contact Us
      </h2>

      <p style={{ margin: "8px 0", fontSize: "16px" }}>
        <strong>MJ Sports Arena</strong>
      </p>

      <p style={{ margin: "8px 0" }}>
        📍 Sunny Enclave, Kharar, Punjab
      </p>

      <p style={{ margin: "8px 0" }}>
        📞 +91 9041528165
      </p>

      <p style={{ margin: "8px 0" }}>
        📧 mjsportsarena@gmail.com
      </p>

      {/* BUTTONS */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>

        {/* CALL BUTTON */}
        <a href="tel:+919876543210">
          <button style={{
            padding: "10px 18px",
            background: "#22c55e",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600"
          }}>
            📞 Call Now
          </button>
        </a>

        {/* WHATSAPP BUTTON */}
        <a href="https://wa.me/919876543210" target="_blank">
          <button style={{
            padding: "10px 18px",
            background: "#25D366",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600"
          }}>
            💬 WhatsApp
          </button>
        </a>

        {/* GOOGLE REVIEW */}
        <a href="https://www.google.com/maps/place/MJ+SPORTS+ARENA" target="_blank">
          <button style={{
            padding: "10px 18px",
            background: "#3b82f6",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            color: "white"
          }}>
            ⭐ Review Us
          </button>
        </a>

      </div>
    </div>

    {/* RIGHT SIDE - MAP */}
    <div>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3428.6700605626625!2d76.66673457537398!3d30.755768074573073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ff182a69eb9ad%3A0xe01fd32b21f88d78!2sMJ%20SPORTS%20ARENA!5e0!3m2!1sen!2sin!4v1776504223823!5m2!1sen!2sin"
        width="100%"
        height="300"
        style={{ border: 0, borderRadius: "12px" }}
        loading="lazy"
      ></iframe>
    </div>

  </div>
</div>

      <footer style={styles.footer}>
        <p style={{ margin: 0, color: "#334155" }}>
          © {new Date().getFullYear()} {CONFIG.arenaName} — Built with ❤️
        </p>
      </footer>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    background: "#020817",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    borderBottom: "1px solid #0f172a",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(2,8,23,0.92)",
  },
  navBrand: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#e2e8f0",
    letterSpacing: "-0.5px",
  },
  adminBtn: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "6px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 16px 60px",
  },
  hero: {
    textAlign: "center",
    padding: "64px 16px 48px",
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 500,
    height: 300,
    background: "radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroTag: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    margin: "0 0 16px",
  },
  heroTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(32px, 6vw, 60px)",
    fontWeight: 800,
    color: "#f8fafc",
    margin: "0 0 16px",
    letterSpacing: "-2px",
    lineHeight: 1.1,
  },
  heroSub: {
    color: "#64748b",
    fontSize: 17,
    margin: "0 0 40px",
    maxWidth: 480,
    marginLeft: "auto",
    marginRight: "auto",
  },
  sportCards: {
    display: "flex",
    gap: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  sportCard: {
    background: "#0f172a",
    border: "1px solid",
    borderRadius: 16,
    padding: "20px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
    minWidth: 180,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    marginTop: 8,
  },
  formCard: {
    background: "#0a0f1e",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: "24px",
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
  },
  sportToggle: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  sportBtn: {
    flex: 1,
    minWidth: 120,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "12px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  label: {
    display: "block",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
    outline: "none",
  },
  slotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
    gap: 8,
    marginBottom: 8,
  },
  slotBtn: {
    padding: "8px 4px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
    transition: "all 0.12s",
  },
  primaryBtn: {
    padding: "12px 20px",
    borderRadius: 12,
    border: "none",
    color: "#000",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "-0.3px",
  },
  secondaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  errorText: { color: "#f87171", fontSize: 13, margin: "8px 0 0" },
  successBox: {
    background: "#052e16",
    border: "1px solid #166534",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#4ade80",
    fontSize: 14,
    marginTop: 12,
  },
  bookingRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#0f172a",
    borderRadius: 10,
    padding: "10px 14px",
    paddingLeft: 12,
  },
  filterBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 28,
    textAlign: "center",
    maxWidth: 300,
    width: "90%",
  },
  closeBtn: {
    marginTop: 16,
    padding: "8px 24px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  revenueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  revenueCard: {
    background: "#0a0f1e",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: "16px 18px",
  },
  countBadge: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "6px 14px",
    color: "#94a3b8",
    fontSize: 13,
  },
  tableWrap: {
    background: "#0a0f1e",
    border: "1px solid #1e293b",
    borderRadius: 16,
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 700,
  },
  th: {
    padding: "12px 14px",
    textAlign: "left",
    color: "#475569",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottom: "1px solid #1e293b",
    background: "#0a0f1e",
  },
  td: {
    padding: "12px 14px",
    color: "#cbd5e1",
    fontSize: 14,
    verticalAlign: "middle",
  },
  dangerBtn: {
    padding: "5px 12px",
    borderRadius: 7,
    border: "1px solid #7f1d1d",
    background: "transparent",
    color: "#f87171",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
  },
  ghostBtn: {
    padding: "5px 12px",
    borderRadius: 7,
    border: "1px solid #334155",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
  },
  logoutBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  loginCard: {
    background: "#0a0f1e",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: "36px 32px",
    width: "100%",
    maxWidth: 340,
  },
  footer: {
    borderTop: "1px solid #0f172a",
    padding: "20px 24px",
    textAlign: "center",
  },
};
