import React, { useState, useEffect, useMemo } from "react";
import { Car, MapPin, Pencil, Trash2 } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

// Generate time slots in 15 min increments
const generateAllTimeSlots = () => {
  const slots = [];
  let hour = 0,
    minute = 0;
  while (hour < 24) {
    slots.push(
      `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`
    );
    minute += 15;
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }
  return slots;
};

// Format time to 12-hour format with AM/PM
const formatTime12hr = (time24) => {
  let [hour, minute] = time24.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")} ${ampm}`;
};

// List of cities
const cities = [
  "Paris, France",
  "Marseille, France",
  "Lyon, France",
  "Toulouse, France",
  "Nice, France",
  "Nantes, France",
  "Strasbourg, France",
  "Montpellier, France",
  "Bordeaux, France",
  "Lille, France",
  "Rennes, France",
  "Reims, France",
  "Le Havre, France",
  "Saint-Étienne, France",
  "Toulon, France",
  "Angers, France",
  "Grenoble, France",
  "Dijon, France",
  "Nîmes, France",
  "Aix-en-Provence, France",
];

export default function Booking({ user, onLogout, showMessage }) {
  const [form, setForm] = useState({
    pickupLocation: "",
    dropoffLocation: "",
    pickupDate: "",
    pickupTime: "",
    returnDate: "",
    returnTime: "",
  });
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const offset = 5;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const snapshot = await getDocs(collection(db, "bookings"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBookings(data);
      } catch (err) {
        showMessage &&
          showMessage("Échec du chargement des réservations", "error");
      }
    };
    fetchBookings();
  }, [showMessage]);

  const handleInput = (field, val, isSelect = false) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "pickupLocation" && !isSelect) {
      setPickupSuggestions(
        cities
          .filter((c) => c.toLowerCase().includes(val.toLowerCase()))
          .slice(0, 5)
      );
    }
    if (field === "dropoffLocation" && !isSelect) {
      setDropoffSuggestions(
        cities
          .filter((c) => c.toLowerCase().includes(val.toLowerCase()))
          .slice(0, 5)
      );
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.pickupLocation)
      newErrors.pickupLocation = "Le lieu de prise en charge est requis";
    if (!form.dropoffLocation)
      newErrors.dropoffLocation = "Le lieu de dépôt est requis";
    if (!form.pickupDate)
      newErrors.pickupDate = "La date de prise en charge est requise";
    if (!form.pickupTime)
      newErrors.pickupTime = "L'heure de prise en charge est requise";
    if (!form.returnDate)
      newErrors.returnDate = "La date de retour est requise";
    if (!form.returnTime)
      newErrors.returnTime = "L'heure de retour est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getBookedTimes = (date, excludeId = null) =>
    bookings
      .filter((b) => b.pickupDate === date && b.id !== excludeId)
      .map((b) => b.pickupTime);

  const handleSubmit = async () => {
    if (!validate()) return;
    if (
      bookings.some(
        (b) =>
          b.pickupDate === form.pickupDate &&
          b.pickupTime === form.pickupTime &&
          b.id !== editingId
      )
    ) {
      setErrors({ pickupTime: "Ce créneau horaire est déjà réservé" });
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "bookings", editingId), form);
        setBookings((prev) =>
          prev.map((b) => (b.id === editingId ? { ...b, ...form } : b))
        );
        showMessage && showMessage("Réservation mise à jour", "success");
      } else {
        const newBooking = {
          ...form,
          email: user.email,
          createdAt: new Date().toISOString(),
          bookingId: "BK" + Date.now().toString().slice(-6),
        };
        const docRef = await addDoc(collection(db, "bookings"), newBooking);
        setBookings((prev) => [...prev, { ...newBooking, id: docRef.id }]);
        showMessage && showMessage("Réservation réussie", "success");
      }
      setForm({
        pickupLocation: "",
        dropoffLocation: "",
        pickupDate: "",
        pickupTime: "",
        returnDate: "",
        returnTime: "",
      });
      setEditingId(null);
    } catch (err) {
      showMessage &&
        showMessage("Échec de l'enregistrement de la réservation", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b) => {
    setForm({
      pickupLocation: b.pickupLocation,
      dropoffLocation: b.dropoffLocation,
      pickupDate: b.pickupDate,
      pickupTime: b.pickupTime,
      returnDate: b.returnDate || "",
      returnTime: b.returnTime || "",
    });
    setEditingId(b.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette réservation ?")) return;
    await deleteDoc(doc(db, "bookings", id));
    setBookings((prev) => prev.filter((b) => b.id !== id));
    showMessage && showMessage("Réservation supprimée", "success");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      pickupLocation: "",
      dropoffLocation: "",
      pickupDate: "",
      pickupTime: "",
      returnDate: "",
      returnTime: "",
    });
    setErrors({});
  };

  const timeSlots = generateAllTimeSlots();

  const renderSuggestions = (list, onSelect) => (
    <div className="absolute bg-white border mt-1 rounded shadow max-h-40 overflow-y-auto w-full z-10">
      {list.map((city, i) => (
        <div
          key={i}
          onClick={() => onSelect(city)}
          className="cursor-pointer px-3 py-2 hover:bg-gray-100 flex items-center"
        >
          <MapPin className="w-4 h-4 mr-2" /> {city}
        </div>
      ))}
    </div>
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) =>
      Object.values(b).join(" ").toLowerCase().includes(search.toLowerCase())
    );
  }, [bookings, search]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * offset;
    return filteredBookings.slice(start, start + offset);
  }, [filteredBookings, currentPage]);

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center text-gray-800">
            <Car className="mr-2" />{" "}
            {editingId ? "Modifier la réservation" : "Réserver un taxi"}
          </h2>
          {user && (
            <p className="text-sm text-gray-600 ml-1 mt-1">
              Connecté en tant que :{" "}
              <span className="font-semibold">{user.email}</span>
            </p>
          )}
        </div>
        <button
          onClick={onLogout}
          className="text-red-600 hover:underline text-sm"
        >
          Déconnexion
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Pickup Location */}
        <div className="relative">
          <label className="block mb-1 font-medium">Pickup Location *</label>
          <input
            type="text"
            className={`w-full border px-3 py-2 rounded focus:outline-yellow-400 ${
              errors.pickupLocation ? "border-red-500" : "border-gray-300"
            }`}
            value={form.pickupLocation}
            onChange={(e) => handleInput("pickupLocation", e.target.value)}
            onBlur={() => setTimeout(() => setPickupSuggestions([]), 150)}
            autoComplete="off"
            placeholder="Enter pickup location"
          />
          {errors.pickupLocation && (
            <p className="text-red-600 text-xs mt-1">{errors.pickupLocation}</p>
          )}
          {pickupSuggestions.length > 0 &&
            renderSuggestions(pickupSuggestions, (city) =>
              handleInput("pickupLocation", city, true)
            )}
        </div>

        {/* Dropoff Location */}
        <div className="relative">
          <label className="block mb-1 font-medium">Dropoff Location *</label>
          <input
            type="text"
            className={`w-full border px-3 py-2 rounded focus:outline-yellow-400 ${
              errors.dropoffLocation ? "border-red-500" : "border-gray-300"
            }`}
            value={form.dropoffLocation}
            onChange={(e) => handleInput("dropoffLocation", e.target.value)}
            onBlur={() => setTimeout(() => setDropoffSuggestions([]), 150)}
            autoComplete="off"
            placeholder="Enter dropoff location"
          />
          {errors.dropoffLocation && (
            <p className="text-red-600 text-xs mt-1">
              {errors.dropoffLocation}
            </p>
          )}
          {dropoffSuggestions.length > 0 &&
            renderSuggestions(dropoffSuggestions, (city) =>
              handleInput("dropoffLocation", city, true)
            )}
        </div>

        {/* Pickup Date */}
        <div>
          <label className="block mb-1 font-medium">Pickup Date *</label>
          <input
            type="date"
            className={`w-full border px-3 py-2 rounded focus:outline-yellow-400 ${
              errors.pickupDate ? "border-red-500" : "border-gray-300"
            }`}
            value={form.pickupDate}
            onChange={(e) => handleInput("pickupDate", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.pickupDate && (
            <p className="text-red-600 text-xs mt-1">{errors.pickupDate}</p>
          )}
        </div>

        {/* Return Date */}
        <div>
          <label className="block mb-1 font-medium">Return Date</label>
          <input
            type="date"
            className={`w-full border px-3 py-2 rounded focus:outline-yellow-400 ${
              errors.pickupDate ? "border-red-500" : "border-gray-300"
            }`}
            value={form.returnDate}
            onChange={(e) => handleInput("returnDate", e.target.value)}
            min={form.returnDate || new Date().toISOString().split("T")[0]}
          />
          {errors.pickupDate && (
            <p className="text-red-600 text-xs mt-1">{errors.returnDate}</p>
          )}
        </div>

        {/* Pickup Time */}
        <div className="md:col-span-1">
          <label className="block mb-1 font-medium">Pickup Time *</label>
          <div className="max-h-40 overflow-y-auto grid grid-cols-4 gap-1 border rounded p-2">
            {timeSlots.map((time) => {
              const booked = getBookedTimes(
                form.pickupDate,
                editingId
              ).includes(time);
              const selected = form.pickupTime === time;
              return (
                <button
                  key={time}
                  disabled={booked}
                  onClick={() => handleInput("pickupTime", time)}
                  className={`text-xs py-1 rounded border text-center ${
                    booked
                      ? "bg-red-100 text-red-600 cursor-not-allowed"
                      : selected
                      ? "bg-yellow-300 border-yellow-500 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {formatTime12hr(time)}
                </button>
              );
            })}
          </div>
          {errors.pickupTime && (
            <p className="text-red-600 text-xs mt-1">{errors.pickupTime}</p>
          )}
        </div>

        {/* Return Time */}
        <div className="md:col-span-1">
          <label className="block mb-1 font-medium">Return Time</label>
          <div className="max-h-40 overflow-y-auto grid grid-cols-4 gap-1 border rounded p-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleInput("returnTime", time)}
                className={`text-xs py-1 rounded border text-center ${
                  form.returnTime === time
                    ? "bg-yellow-300 border-yellow-500 font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                {formatTime12hr(time)}
              </button>
            ))}
          </div>
          {errors.pickupTime && (
            <p className="text-red-600 text-xs mt-1">{errors.returnTime}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-2 rounded disabled:opacity-60"
        >
          {loading ? "Saving..." : editingId ? "Update Booking" : "Book Taxi"}
        </button>
        {editingId && (
          <button
            onClick={cancelEdit}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Booking List with Search */}
      <section className="mt-12">
        <h3 className="text-xl font-bold mb-4">Your Bookings</h3>
        <div className="flex justify-between items-center mb-3">
          <input
            type="text"
            placeholder="Search bookings..."
            className="border px-3 py-2 rounded w-full max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {filteredBookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Return</th>
                  <th className="px-4 py-3">Pickup Date</th>
                  <th className="px-4 py-3">Pickup Time</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 divide-y">
                {paginatedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">{b.bookingId || "N/A"}</td>
                    <td className="px-4 py-3">{b.email}</td>
                    <td className="px-4 py-3">{b.pickupLocation}</td>
                    <td className="px-4 py-3">{b.dropoffLocation}</td>
                    <td className="px-4 py-3">{b.pickupDate}</td>
                    <td className="px-4 py-3">
                      {formatTime12hr(b.pickupTime)}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(b)}
                        title="Edit"
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredBookings.length > offset && (
              <div className="flex justify-end items-center gap-2 px-4 py-3">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {currentPage} of{" "}
                  {Math.ceil(filteredBookings.length / offset)}
                </span>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={
                    currentPage === Math.ceil(filteredBookings.length / offset)
                  }
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
