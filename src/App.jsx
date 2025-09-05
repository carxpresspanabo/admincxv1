import React, { useEffect, useMemo, useState } from "react";

// CarXpress Rental Organizer — BETA (slim, full file)
// - Starts empty (no demo data)
// - Driver's rate is customizable in Settings
// - Removed: Export CSV, Delete buttons, Import/Export JSON, Revenue card
// - Topbar button: Download leads (names + phones from Customers and Bookings)

// ---------- Utilities ----------
const STORAGE_KEY = "carxpress_rental_data_v1";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return "₱0";
  return `₱${Number(n).toLocaleString("en-PH", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
}

function toDateInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseDT(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  const ms = Math.max(0, b - a);
  const d = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, d);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function download(filename, text, type = "text/plain;charset=utf-8") {
  try {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Sorry, the download couldn't start. Please try again.");
  }
}L(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Sorry, the download couldn't start. Please try again.");
  }
}L(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Sorry, the download couldn't start. Please try again.");
  }
});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// ---------- Data Store (starts EMPTY) ----------
function usePersistentState() {
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return {
      vehicles: [],
      customers: [],
      bookings: [],
      settings: {
        company: "CarXpress Panabo - Rent a Car",
        address: "Panabo City, Davao del Norte",
        phone: "0961 896 3062",
        email: "carxpress@example.com",
        driverRatePerDay: 800,
      },
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, setState];
}

// ---------- UI Primitives ----------
function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={classNames("px-2 py-0.5 text-xs rounded-full", tones[tone])}>{children}</span>;
}

function Card({ title, actions, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <div className="flex gap-2">{actions}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TextInput({ label, value, onChange, type = "text", placeholder, required, ...props }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        type={type}
        className="mt-1 w-full rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    </label>
  );
}

function Select({ label, value, onChange, options = [], required, ...props }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <select
        className="mt-1 w-full rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 border px-3 py-2 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((o, i) => (
          <option key={o.value ?? i} value={o.value ?? o.label}>{o.label ?? String(o.value)}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" className="rounded" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
    </div>
  );
}

// ---------- Core App ----------
export default function App() {
  const [data, setData] = usePersistentState();
  const [tab, setTab] = useState("dashboard");

  // Search & filters
  const [bookingQuery, setBookingQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const vehicles = data.vehicles;
  const customers = data.customers;
  const bookings = data.bookings;

  const totalFleet = vehicles.length;
  const outUnits = bookings.filter((b) => b.status === "Ongoing" || b.status === "Reserved").length;
  const availableUnits = Math.max(0, totalFleet - outUnits);

  function save(fn) {
    setData((prev) => ({ ...prev, ...fn(prev) }));
  }

  // CRUD helpers
  function addVehicle(v) { save((prev) => ({ vehicles: [...prev.vehicles, v] })); }
  function updateVehicle(id, patch) { save((prev) => ({ vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...patch } : v) })); }
  function deleteVehicle(id) { save((prev) => ({ vehicles: prev.vehicles.filter(v => v.id !== id) })); }

  function addCustomer(c) { save((prev) => ({ customers: [...prev.customers, c] })); }
  function updateCustomer(id, patch) { save((prev) => ({ customers: prev.customers.map(c => c.id === id ? { ...c, ...patch } : c) })); }
  function deleteCustomer(id) { save((prev) => ({ customers: prev.customers.filter(c => c.id !== id) })); }

  function addBooking(b) { save((prev) => ({ bookings: [b, ...prev.bookings] })); }
  function updateBooking(id, patch) { save((prev) => ({ bookings: prev.bookings.map(b => b.id === id ? { ...b, ...patch } : b) })); }
  function deleteBooking(id) { save((prev) => ({ bookings: prev.bookings.filter(b => b.id !== id) })); }

  // Leads downloader (names + phones from customers and previous bookings)
  function downloadLeads() {
  const mafunction downloadLeads() {
  const map = new Map();
  customers.forEach((c) => {
    const phoneKey = (c.phone || '').replace(/\\s+/g, '');
    const key = phoneKey || (c.name || '').toLowerCase();
    if (!key) return;
    map.set(key, { name: c.name || '', phone: c.phone || '' });
  });
  bookings.forEach((b) => {
    const phoneKey = (b.customerPhone || '').replace(/\\s+/g, '');
    const key = phoneKey || (b.customerName || '').toLowerCase();
    if (!key) return;
    if (!map.has(key)) map.set(key, { name: b.customerName || '', phone: b.customerPhone || '' });
  });
  const header = ['Name','Phone'];
  const rows = [...map.values()].filter(x => x.name || x.phone).map(x => [x.name, x.phone]);
  if (rows.length === 0) {
    alert('No leads to download yet. Add customers or bookings first.');
    return;
  }
  const csv = [header, ...rows]
    .map(r => r.map(x => `\"${String(x ?? '').replace(/\"/g,'\"\"')}\"`).join(','))
    .join('\\n');
  const filename = `leads_${new Date().toISOString().slice(0,10)}.csv`;
  download(filename, csv, 'text/csv;charset=utf-8');
}    const phoneKey = (b.customerPhone || '').replace(/\\s+/g, '');
    const key = phoneKey || (b.customerName || '').toLowerCase();
    if (!key) return;
    if (!map.has(key)) map.set(key, { name: b.customerName || '', phone: b.customerPhone || '' });
  });
  const header = ['Name','Phone'];
  const rows = [...map.values()].filter(x => x.name || x.phone).map(x => [x.name, x.phone]);
  if (rows.length === 0) {
    alert('No leads to download yet. Add customers or bookings first.');
    return;
  }
  const csv = [header, ...rows]
    .map(r => r.map(x => `\"${String(x ?? '').replace(/\"/g,'\"\"')}\"`).join(','))
    .join('\\n');
  const filename = `leads_${new Date().toISOString().slice(0,10)}.csv`;
  download(filename, csv, 'text/csv;charset=utf-8');
}honeKey = (b.customerPhone || '').replace(/\\s+/g, '');
    const key = phoneKey || (b.customerName || '').toLowerCase();
    if (!key) return;
    if (!map.has(key)) map.set(key, { name: b.customerName || '', phone: b.customerPhone || '' });
  });
  const header = ['Name','Phone'];
  const rows = [...map.values()].filter(x => x.name || x.phone).map(x => [x.name, x.phone]);
  if (rows.length === 0) {
    alert('No leads to download yet. Add customers or bookings first.');
    return;
  }
  const csv = [header, ...rows]
    .map(r => r.map(x => `\"${String(x ?? '').replace(/\"/g,'\"\"')}\"`).join(','))
    .join('\\n');
  const filename = `leads_${new Date().toISOString().slice(0,10)}.csv`;
  download(filename, csv, 'text/csv;charset=utf-8');
});
    });
    bookings.forEach((b) => {
      const phoneKey = (b.customerPhone || '').replace(/\s+/g, '');
      const key = phoneKey || (b.customerName || '').toLowerCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, { name: b.customerName || '', phone: b.customerPhone || '' });
    });
    const header = ["Name","Phone"];
    const rows = [...map.values()].filter(x => x.name || x.phone).map(x => [x.name, x.phone]);
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    download(`leads_${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv;charset=utf-8');
  }

  // Tiny tests
  try {
    console.assert(daysBetween(new Date("2024-01-01"), new Date("2024-01-02")) === 1, "daysBetween 1d");
    console.assert(overlaps(new Date(0), new Date(10), new Date(5), new Date(15)) === true, "overlaps true");
    console.assert(overlaps(new Date(0), new Date(5), new Date(5), new Date(10)) === false, "overlaps edge");
    console.assert(parseDT("bad-date-string") === null, "parseDT invalid");
  } catch {}

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white grid place-content-center font-bold">CX</div>
            <div>
              <div className="font-semibold">{data.settings.company}</div>
              <div className="text-xs text-slate-500">Rental Organizer <Badge tone="violet">BETA</Badge></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadLeads} className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50">Download leads</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-3 lg:col-span-2">
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "bookings", label: "Bookings" },
              { id: "vehicles", label: "Vehicles" },
              { id: "customers", label: "Customers" },
              { id: "settings", label: "Settings" },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={classNames("w-full text-left px-3 py-2 rounded-xl", tab === t.id ? "bg-slate-900 text-white" : "hover:bg-white border border-transparent hover:border-slate-200")}>{t.label}</button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="md:col-span-9 lg:col-span-10 space-y-6">
          {tab === "dashboard" && (
            <Dashboard vehicles={vehicles} bookings={bookings} availableUnits={availableUnits} />
          )}

          {tab === "bookings" && (
            <Bookings
              data={data}
              addBooking={addBooking}
              updateBooking={updateBooking}
              deleteBooking={deleteBooking}
              filters={{ bookingQuery, setBookingQuery, vehicleFilter, setVehicleFilter, statusFilter, setStatusFilter }}
            />
          )}

          {tab === "vehicles" && (
            <Vehicles vehicles={vehicles} addVehicle={addVehicle} updateVehicle={updateVehicle} deleteVehicle={deleteVehicle} bookings={bookings} />
          )}

          {tab === "customers" && (
            <Customers customers={customers} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} bookings={bookings} />
          )}

          {tab === "settings" && (
            <Settings data={data} setData={setData} />
          )}
        </main>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ vehicles, bookings, availableUnits }) {
  const today = new Date();
  const upcoming = useMemo(() => bookings
    .filter((b) => new Date(b.pickup) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => new Date(a.pickup) - new Date(b.pickup))
    .slice(0, 5), [bookings]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Overview" subtitle="Quick snapshot of fleet and rentals" />

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Available Units" actions={<Badge tone="green">Live</Badge>}>
          <div className="text-4xl font-bold">{availableUnits}</div>
          <p className="text-slate-500 text-sm mt-1">Out of {vehicles.length} total vehicles</p>
        </Card>
        <Card title="Active/Reserved Bookings">
          <div className="text-4xl font-bold">{bookings.filter((b) => ["Ongoing", "Reserved"].includes(b.status)).length}</div>
          <p className="text-slate-500 text-sm mt-1">Now + upcoming</p>
        </Card>
      </div>

      <Card title="Next 5 Pickups">
        {upcoming.length === 0 ? (
          <div className="text-slate-500">No upcoming pickups yet.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Date/Time</th>
                  <th className="py-2 pr-4">Vehicle</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="py-2 pr-4">{new Date(b.pickup).toLocaleString()}</td>
                    <td className="py-2 pr-4">{b.vehicleId} <span className="text-slate-400">({b.vehiclePlate})</span></td>
                    <td className="py-2 pr-4">{b.customerName}</td>
                    <td className="py-2 pr-4"><Badge tone={b.status === "Reserved" ? "blue" : b.status === "Ongoing" ? "amber" : "slate"}>{b.status}</Badge></td>
                    <td className="py-2 pr-0 text-right">{formatCurrency(b.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- Bookings ----------
function Bookings({ data, addBooking, updateBooking, deleteBooking, filters }) {
  const { vehicles, customers, bookings, settings } = data;
  const { bookingQuery, setBookingQuery, vehicleFilter, setVehicleFilter, statusFilter, setStatusFilter } = filters;
  const [showForm, setShowForm] = useState(false);

  const filtered = bookings.filter((b) => {
    const q = bookingQuery.toLowerCase();
    const matchQ = !q || [b.id, b.vehicleId, b.vehiclePlate, b.customerName, b.customerPhone, b.customerEmail].some((x) => String(x).toLowerCase().includes(q));
    const matchV = !vehicleFilter || b.vehicleId === vehicleFilter;
    const matchS = !statusFilter || b.status === statusFilter;
    return matchQ && matchV && matchS;
  });

  function printBooking(b) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Booking ${b.id}</title>
      <style>
        body{font-family: ui-sans-serif, system-ui; padding:24px}
        h1{margin:0}
        .row{display:flex; gap:24px}
        .box{border:1px solid #e5e7eb; border-radius:12px; padding:12px; margin-top:12px}
        table{width:100%; border-collapse:collapse}
        td,th{border-top:1px solid #e5e7eb; padding:8px; text-align:left}
      </style>
      </head><body>
      <h1>CarXpress Booking</h1>
      <p><strong>ID:</strong> ${b.id} &nbsp; <strong>Status:</strong> ${b.status}</p>
      <div class="row">
        <div class="box" style="flex:1">
          <h3>Customer</h3>
          <p>${b.customerName}<br>${b.customerPhone}<br>${b.customerEmail}</p>
        </div>
        <div class="box" style="flex:1">
          <h3>Vehicle</h3>
          <p>${b.vehicleId} - ${b.vehiclePlate}<br>Rate/day: ${formatCurrency(b.ratePerDay)}</p>
        </div>
      </div>
      <div class="box">
        <h3>Schedule</h3>
        <table>
          <tr><th>Pickup</th><td>${new Date(b.pickup).toLocaleString()}</td></tr>
          <tr><th>Return</th><td>${new Date(b.dropoff).toLocaleString()}</td></tr>
          <tr><th>Days</th><td>${b.days}</td></tr>
        </table>
      </div>
      <div class="box">
        <h3>Charges</h3>
        <table>
          <tr><th>Base</th><td>${formatCurrency(b.ratePerDay)} x ${b.days}</td></tr>
          <tr><th>Driver</th><td>${b.withDriver ? formatCurrency((b.driverRatePerDay || 0) * b.days) : "-"}</td></tr>
          <tr><th>Delivery</th><td>${formatCurrency(b.deliveryFee || 0)}</td></tr>
          <tr><th>Deposit</th><td>${formatCurrency(b.deposit || 0)}</td></tr>
          <tr><th><strong>Total</strong></th><td><strong>${formatCurrency(b.total)}</strong></td></tr>
        </table>
      </div>
      <p><em>Notes:</em> ${b.notes || ""}</p>
      <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Bookings" subtitle="Track reservations, pickups, and returns" />

      <div className="flex flex-wrap gap-2 items-end">
        <TextInput label="Search" value={bookingQuery} onChange={setBookingQuery} placeholder="ID, customer, plate..." />
        <Select label="Vehicle" value={vehicleFilter} onChange={setVehicleFilter} options={[...new Set(vehicles.map(v => v.id))].map(v => ({ value: v, label: v }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={["Reserved","Ongoing","Completed","Cancelled"].map(s => ({ value: s, label: s }))} />
        <div className="ml-auto flex gap-2">
          <button onClick={() => setShowForm(true)} className="px-3 py-2 rounded-xl bg-slate-900 text-white">New Booking</button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Vehicle</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Pickup</th>
              <th className="py-2 pr-4">Return</th>
              <th className="py-2 pr-4">Days</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4 text-right">Total</th>
              <th className="py-2 pr-0 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="py-2 pr-4 font-mono">{b.id}</td>
                <td className="py-2 pr-4">{b.vehicleId} <span className="text-slate-400">({b.vehiclePlate})</span></td>
                <td className="py-2 pr-4">{b.customerName}</td>
                <td className="py-2 pr-4">{new Date(b.pickup).toLocaleString()}</td>
                <td className="py-2 pr-4">{new Date(b.dropoff).toLocaleString()}</td>
                <td className="py-2 pr-4">{b.days}</td>
                <td className="py-2 pr-4"><Badge tone={b.status === "Reserved" ? "blue" : b.status === "Ongoing" ? "amber" : b.status === "Completed" ? "green" : "red"}>{b.status}</Badge></td>
                <td className="py-2 pr-4 text-right">{formatCurrency(b.total)}</td>
                <td className="py-2 pr-0 text-right">
                  <div className="inline-flex gap-2">
                    {b.status !== "Completed" && (
                      <button onClick={() => updateBooking(b.id, { status: b.status === "Reserved" ? "Ongoing" : "Completed" })} className="px-2 py-1 rounded-lg border">{b.status === "Reserved" ? "Start" : "Complete"}</button>
                    )}
                    <button onClick={() => printBooking(b)} className="px-2 py-1 rounded-lg border">Print</button>
                    {/* Delete removed by request */}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-slate-500 py-6 text-center">No bookings yet. Click "New Booking".</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <BookingForm
          onClose={() => setShowForm(false)}
          vehicles={vehicles}
          customers={customers}
          addBooking={addBooking}
          existingBookings={bookings}
          driverRatePerDay={settings.driverRatePerDay || 0}
        />
      )}
    </div>
  );
}

function BookingForm({ onClose, vehicles, customers, addBooking, existingBookings, driverRatePerDay }) {
  const [vehicleId, setVehicleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [pickup, setPickup] = useState(toDateInputValue(new Date()));
  const [dropoff, setDropoff] = useState(toDateInputValue(new Date(Date.now() + 24*60*60*1000)));
  const [ratePerDay, setRatePerDay] = useState("");
  const [withDriver, setWithDriver] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [notes, setNotes] = useState("");

  const veh = vehicles.find((v) => v.id === vehicleId);
  useEffect(() => { if (veh) setRatePerDay(String(veh.ratePerDay ?? "")); }, [vehicleId]);

  const d1 = parseDT(pickup); const d2 = parseDT(dropoff);
  const days = d1 && d2 ? daysBetween(d1, d2) : 1;
  const driverFee = withDriver ? Number(driverRatePerDay || 0) * days : 0; // per day from settings
  const base = Number(ratePerDay || 0) * days;
  const total = base + Number(deliveryFee || 0) + driverFee - Number(deposit || 0);

  const conflicts = useMemo(() => {
    if (!veh || !d1 || !d2) return [];
    return existingBookings.filter((b) => b.vehicleId === veh.id && ["Reserved","Ongoing"].includes(b.status) && overlaps(new Date(b.pickup), new Date(b.dropoff), d1, d2));
  }, [veh, d1, d2, existingBookings]);

  function submit(e) {
    e.preventDefault();
    if (!veh) return alert("Select a vehicle");
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return alert("Select a customer");
    if (conflicts.length) return alert("This schedule conflicts with an existing booking.");

    const id = `BK-${Date.now().toString().slice(-6)}`;
    const b = {
      id,
      status: "Reserved",
      vehicleId: veh.id,
      vehiclePlate: veh.plate,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      pickup: d1.toISOString(),
      dropoff: d2.toISOString(),
      days,
      ratePerDay: Number(ratePerDay || 0),
      withDriver,
      driverRatePerDay: Number(driverRatePerDay || 0),
      deliveryFee: Number(deliveryFee || 0),
      deposit: Number(deposit || 0),
      total,
      notes,
    };
    addBooking(b);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">New Booking</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">Close</button>
        </div>
        <form onSubmit={submit} className="p-4 grid md:grid-cols-2 gap-4">
          <Select label="Vehicle" value={vehicleId} onChange={setVehicleId} required options={vehicles.map((v) => ({ value: v.id, label: `${v.id} (${v.plate})` }))} />
          <Select label="Customer" value={customerId} onChange={setCustomerId} required options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` }))} />

          <TextInput label="Pickup" type="datetime-local" value={pickup} onChange={setPickup} required />
          <TextInput label="Return" type="datetime-local" value={dropoff} onChange={setDropoff} required />

          <TextInput label="Rate per day (₱)" type="number" value={ratePerDay} onChange={setRatePerDay} required />
          <TextInput label="Delivery fee (₱)" type="number" value={deliveryFee} onChange={(v) => setDeliveryFee(Number(v))} />

          <div className="flex items-end justify-between gap-4">
            <Toggle label={`With driver (${formatCurrency(driverRatePerDay)}/day)`} checked={withDriver} onChange={setWithDriver} />
            <TextInput label="Deposit (₱)" type="number" value={deposit} onChange={(v) => setDeposit(Number(v))} />
          </div>

          <label className="md:col-span-2 text-sm">
            <span className="text-slate-700">Notes</span>
            <textarea className="mt-1 w-full rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 border px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Requirements, pickup location, etc." />
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-sm text-slate-500">Days</div>
              <div className="text-lg font-semibold">{days}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Base</div>
              <div className="text-lg font-semibold">{formatCurrency(base)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Driver</div>
              <div className="text-lg font-semibold">{formatCurrency(driverFee)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Delivery</div>
              <div className="text-lg font-semibold">{formatCurrency(deliveryFee)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Deposit</div>
              <div className="text-lg font-semibold">{formatCurrency(deposit)}</div>
            </div>
            <div className="ml-auto">
              <div className="text-sm text-slate-500">Total</div>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
              {conflicts.length > 0 && (
                <div className="text-red-600 text-xs mt-1">Warning: schedule conflicts with {conflicts.length} existing booking(s).</div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border bg-white">Cancel</button>
            <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white">Save Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Vehicles ----------
function Vehicles({ vehicles, addVehicle, updateVehicle, deleteVehicle, bookings }) {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const list = vehicles.filter((v) => {
    const s = q.toLowerCase();
    return !s || [v.id, v.make, v.model, v.plate, v.type].some((x) => String(x).toLowerCase().includes(s));
  });

  function countBusy(vId) {
    return bookings.filter((b) => b.vehicleId === vId && ["Reserved","Ongoing"].includes(b.status)).length;
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Vehicles" subtitle="Fleet overview and rates" />

      <div className="flex items-end gap-2">
        <TextInput label="Search" value={q} onChange={setQ} placeholder="ID, plate, model..." />
        <div className="ml-auto">
          <button onClick={() => setShowAdd(true)} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Add Vehicle</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {list.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{v.id} <span className="text-slate-400">({v.plate})</span></div>
                <div className="text-slate-600 text-sm">{v.year} {v.make} {v.model} • {v.trans} • {v.seats} seats</div>
              </div>
              <Badge tone={countBusy(v.id) ? "amber" : "green"}>{countBusy(v.id) ? "Booked" : "Available"}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-slate-500 text-sm">Type: {v.type}</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold">{formatCurrency(v.ratePerDay)}/day</div>
                <button onClick={() => setEditing(v)} className="px-2 py-1 rounded-lg border">Edit</button>
                {/* Delete button removed by request */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <VehicleForm onClose={() => setShowAdd(false)} addVehicle={addVehicle} />
      )}

      {editing && (
        <EditVehicleForm
          vehicle={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            const casted = { ...patch };
            if (casted.year != null) casted.year = Number(casted.year);
            if (casted.seats != null) casted.seats = Number(casted.seats);
            if (casted.ratePerDay != null) casted.ratePerDay = Number(casted.ratePerDay);
            updateVehicle(editing.id, casted);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function VehicleForm({ onClose, addVehicle }) {
  const [f, setF] = useState({ id: "", type: "Sedan", make: "", model: "", year: 2024, plate: "", trans: "AT", seats: 5, ratePerDay: 1500, status: "Available" });

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!f.id || !f.plate) return alert("ID and Plate are required.");
    addVehicle({ ...f, year: Number(f.year), seats: Number(f.seats), ratePerDay: Number(f.ratePerDay) });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Add Vehicle</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">Close</button>
        </div>
        <form onSubmit={submit} className="p-4 grid md:grid-cols-2 gap-4">
          <TextInput label="Vehicle ID" value={f.id} onChange={(v) => set("id", v)} required />
          <Select label="Type" value={f.type} onChange={(v) => set("type", v)} options={["Hatchback","Sedan","MPV","Pickup","Van"].map(x => ({ value: x, label: x }))} />
          <TextInput label="Make" value={f.make} onChange={(v) => set("make", v)} required />
          <TextInput label="Model" value={f.model} onChange={(v) => set("model", v)} required />
          <TextInput label="Year" type="number" value={f.year} onChange={(v) => set("year", v)} required />
          <TextInput label="Plate" value={f.plate} onChange={(v) => set("plate", v)} required />
          <Select label="Transmission" value={f.trans} onChange={(v) => set("trans", v)} options={["AT","MT"].map(x => ({ value: x, label: x }))} />
          <TextInput label="Seats" type="number" value={f.seats} onChange={(v) => set("seats", v)} required />
          <TextInput label="Rate per day (₱)" type="number" value={f.ratePerDay} onChange={(v) => set("ratePerDay", v)} required />
          <Select label="Status" value={f.status} onChange={(v) => set("status", v)} options={["Available","With Driver Only","Maintenance"].map(x => ({ value: x, label: x }))} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border bg-white">Cancel</button>
            <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white">Save Vehicle</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditVehicleForm({ vehicle, onClose, onSave }) {
  const [f, setF] = useState({
    id: vehicle.id,
    type: vehicle.type,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plate: vehicle.plate,
    trans: vehicle.trans,
    seats: vehicle.seats,
    ratePerDay: vehicle.ratePerDay,
    status: vehicle.status,
  });
  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }
  function submit(e) {
    e.preventDefault();
    onSave({ ...f });
  }
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Edit Vehicle</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-lg border">Close</button>
        </div>
        <form onSubmit={submit} className="p-4 grid md:grid-cols-2 gap-4">
          <TextInput label="Vehicle ID" value={f.id} onChange={(v) => set("id", v)} disabled />
          <Select label="Type" value={f.type} onChange={(v) => set("type", v)} options={["Hatchback","Sedan","MPV","Pickup","Van"].map(x => ({ value: x, label: x }))} />
          <TextInput label="Make" value={f.make} onChange={(v) => set("make", v)} required />
          <TextInput label="Model" value={f.model} onChange={(v) => set("model", v)} required />
          <TextInput label="Year" type="number" value={f.year} onChange={(v) => set("year", v)} required />
          <TextInput label="Plate" value={f.plate} onChange={(v) => set("plate", v)} required />
          <Select label="Transmission" value={f.trans} onChange={(v) => set("trans", v)} options={["AT","MT"].map(x => ({ value: x, label: x }))} />
          <TextInput label="Seats" type="number" value={f.seats} onChange={(v) => set("seats", v)} required />
          <TextInput label="Rate per day (₱)" type="number" value={f.ratePerDay} onChange={(v) => set("ratePerDay", v)} required />
          <Select label="Status" value={f.status} onChange={(v) => set("status", v)} options={["Available","With Driver Only","Maintenance"].map(x => ({ value: x, label: x }))} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border bg-white">Cancel</button>
            <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Customers ----------
function Customers({ customers, addCustomer, updateCustomer, deleteCustomer, bookings }) {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const list = customers.filter((c) => {
    const s = q.toLowerCase();
    return !s || [c.name, c.phone, c.email, c.idNo].some((x) => String(x).toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Customers" subtitle="Renter records and contacts" />

      <div className="flex items-end gap-2">
        <TextInput label="Search" value={q} onChange={setQ} placeholder="Name, phone, email..." />
        <div className="ml-auto">
          <button onClick={() => setShowAdd(true)} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Add Customer</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {list.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border p-4">
            <div className="font-semibold">{c.name}</div>
            <div className="text-sm text-slate-600">{c.phone} • {c.email}</div>
            <div className="text-sm text-slate-500 mt-1">{c.idType}: {c.idNo}</div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setEditing(c)} className="px-2 py-1 rounded-lg border">Edit</button>
              {/* Delete button removed by request */}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-slate-500">No customers yet.</div>
        )}
      </div>

      {showAdd && <CustomerForm onClose={() => setShowAdd(false)} addCustomer={addCustomer} />}

      {editing && (
        <EditCustomerForm
          customer={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => { updateCustomer(editing.id, patch); setEditing(null); }}
        />
      )}
    </div>
  );
}

function CustomerForm({ onClose, addCustomer }) {
  const [f, setF] = useState({ id: "CUS-" + Math.floor(Math.random()*9000+1000), name: "", phone: "", email: "", idType: "Driver's License", idNo: "" });
  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }
  function submit(e) {e.preventDefault();
if (!f.name || !f.phone) return alert("Name and phone are required.");
addCustomer(f);
onClose();
}


return (
<div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
<div className="bg-white w-full max-w-xl rounded-2xl shadow-xl">
<div className="flex items-center justify-between px-4 py-3 border-b">
<h3 className="font-semibold">Add Customer</h3>
<button onClick={onClose} className="px-2 py-1 rounded-lg border">Close</button>
</div>
<form onSubmit={submit} className="p-4 grid md:grid-cols-2 gap-4">
<TextInput label="Full name" value={f.name} onChange={(v) => set("name", v)} required />
<TextInput label="Phone" value={f.phone} onChange={(v) => set("phone", v)} required />
<TextInput label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} />
<Select label="ID Type" value={f.idType} onChange={(v) => set("idType", v)} options={["Driver's License","UMID","Passport","SSS","PhilID"].map(x => ({ value: x, label: x }))} />
<TextInput label="ID Number" value={f.idNo} onChange={(v) => set("idNo", v)} />
<div className="md:col-span-2 flex justify-end gap-2">
<button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border bg-white">Cancel</button>
<button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white">Save Customer</button>
</div>
</form>
</div>
</div>
);
}


function EditCustomerForm({ customer, onClose, onSave }) {
const [f, setF] = useState({
name: customer.name,
phone: customer.phone,
email: customer.email,
idType: customer.idType,
idNo: customer.idNo,
});
function set(k, v) { setF((p) => ({ ...p, [k]: v })); }
function submit(e) {
e.preventDefault(); onSave({ ...f });
}
return (
<div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
<div className="bg-white w-full max-w-xl rounded-2xl shadow-xl">
<div className="flex items-center justify-between px-4 py-3 border-b">
<h3 className="font-semibold">Edit Customer</h3>
<button onClick={onClose} className="px-2 py-1 rounded-lg border">Close</button>
</div>
<form onSubmit={submit} className="p-4 grid md:grid-cols-2 gap-4">
<TextInput label="Full name" value={f.name} onChange={(v) => set("name", v)} required />
<TextInput label="Phone" value={f.phone} onChange={(v) => set("phone", v)} required />
<TextInput label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} />
<Select label="ID Type" value={f.idType} onChange={(v) => set("idType", v)} options={["Driver's License","UMID","Passport","SSS","PhilID"].map(x => ({ value: x, label: x }))} />
<TextInput label="ID Number" value={f.idNo} onChange={(v) => set("idNo", v)} />
<div className="md:col-span-2 flex justify-end gap-2">
<button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border bg-white">Cancel</button>
<button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white">Save Changes</button>
</div>
</form>
</div>
</div>
);
}


function Settings({ data, setData }) {
const [company, setCompany] = useState(data.settings.company);
const [address, setAddress] = useState(data.settings.address);
const [phone, setPhone] = useState(data.settings.phone);
const [email, setEmail] = useState(data.settings.email);