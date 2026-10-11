"use strict";

/* =========================
   CONFIGURATION
========================= */

const STORAGE_KEY = "bookease_appointments_v1";
const USER_KEY = "bookease_demo_user_v1";

const $ = (id) => document.getElementById(id);

let toastTimer;

const translations = {
    en: {
        name: "Full Name *",
        email: "Email Address *",
        phone: "Phone Number *",
        category: "Service Category *",
        service: "Service / Provider *",
        date: "Appointment Date *",
        time: "Available Time *",
        notes: "Additional Notes",
        submit: "Confirm Booking →",
        clear: "Clear Form"
    },

    ta: {
        name: "முழு பெயர் *",
        email: "மின்னஞ்சல் முகவரி *",
        phone: "தொலைபேசி எண் *",
        category: "சேவை வகை *",
        service: "சேவை / வழங்குநர் *",
        date: "சந்திப்பு தேதி *",
        time: "கிடைக்கும் நேரம் *",
        notes: "கூடுதல் குறிப்புகள்",
        submit: "முன்பதிவை உறுதிசெய் →",
        clear: "படிவத்தை அழி"
    },

    hi: {
        name: "पूरा नाम *",
        email: "ईमेल पता *",
        phone: "फोन नंबर *",
        category: "सेवा श्रेणी *",
        service: "सेवा / प्रदाता *",
        date: "अपॉइंटमेंट की तारीख *",
        time: "उपलब्ध समय *",
        notes: "अतिरिक्त जानकारी",
        submit: "बुकिंग की पुष्टि करें →",
        clear: "फॉर्म साफ करें"
    }
};

/* =========================
   DATA STORAGE
========================= */

function getBookings() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to read bookings:", error);
        return [];
    }
}

function saveBookings(bookings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
        return true;
    } catch (error) {
        console.error("Unable to save bookings:", error);
        showToast("Could not save data. Check browser storage.", "error");
        return false;
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
    } catch (error) {
        return null;
    }
}

function saveCurrentUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/* =========================
   NOTIFICATIONS
========================= */

function showToast(message, type = "success") {
    const toast = $("toast");

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.className = "toast";
    }, 3500);
}

/* =========================
   PAGE NAVIGATION
========================= */

function showLanding() {
    $("landingPage").classList.remove("hidden");
    $("loginPage").classList.add("hidden");
    $("appDashboard").classList.add("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showLogin() {
    $("landingPage").classList.add("hidden");
    $("loginPage").classList.remove("hidden");
    $("appDashboard").classList.add("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDashboard() {
    $("landingPage").classList.add("hidden");
    $("loginPage").classList.add("hidden");
    $("appDashboard").classList.remove("hidden");

    updateProfile();
    showSection("overview");
    renderDashboard();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSection(sectionName) {
    const sections = {
        overview: "overviewSection",
        book: "bookSection",
        appointments: "appointmentsSection"
    };

    Object.values(sections).forEach((id) => {
        $(id).classList.add("hidden");
    });

    if (!sections[sectionName]) {
        sectionName = "overview";
    }

    $(sections[sectionName]).classList.remove("hidden");

    document.querySelectorAll(".side-link[data-section]").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );
    });

    if (sectionName === "appointments") {
        renderAppointments();
    }

    if (sectionName === "overview") {
        renderDashboard();
    }
}

/* =========================
   LOGIN / LOGOUT
========================= */

$("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = $("loginName").value.trim();
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const role = $("userRole").value;

    if (!name || !email || password.length < 4) {
        showToast("Please enter valid login details.", "error");
        return;
    }

    // Demo only: no real password verification is performed.
    const user = { name, email, role };

    saveCurrentUser(user);

    $("bookingName").value = name;
    $("bookingEmail").value = email;

    $("loginPassword").value = "";

    showDashboard();
    showToast(`Welcome to BookEase, ${name}!`);
});

$("logoutButton").addEventListener("click", function () {
    sessionStorage.removeItem(USER_KEY);

    $("loginForm").reset();

    showLanding();
    showToast("You have signed out.");
});

function updateProfile() {
    const user = getCurrentUser();

    if (!user) {
        showLogin();
        return;
    }

    $("welcomeTitle").textContent = `Welcome, ${user.name}!`;
    $("profileName").textContent = user.name;
    $("profileRole").textContent =
        user.role.charAt(0).toUpperCase() + user.role.slice(1) + " Account";

    $("userAvatar").textContent = user.name.charAt(0).toUpperCase();

    $("bookingName").value = user.name;
    $("bookingEmail").value = user.email;
}

/* =========================
   BOOKING FORM
========================= */

function setMinimumDate() {
    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    $("bookingDate").min = localToday;
}

function generateTimeSlots() {
    const slots = [];

    // Demo availability: every 30 minutes, 9:00 AM–5:00 PM.
    for (let hour = 9; hour <= 16; hour++) {
        for (const minute of [0, 30]) {
            const value =
                String(hour).padStart(2, "0") + ":" +
                String(minute).padStart(2, "0");

            const date = new Date();
            date.setHours(hour, minute, 0, 0);

            const label = date.toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });

            slots.push({ value, label });
        }
    }

    slots.push({ value: "17:00", label: "5:00 PM" });

    return slots;
}

function getServiceKey() {
    const category = $("bookingCategory").value.trim().toLowerCase();
    const service = $("bookingService").value.trim().toLowerCase();

    return `${category}|${service}`;
}

function getSlotBookings(date, serviceKey) {
    return getBookings().filter((booking) => {
        return booking.date === date &&
            booking.serviceKey === serviceKey &&
            booking.status === "Booked";
    });
}

function updateTimeSlots() {
    const date = $("bookingDate").value;
    const service = $("bookingService").value.trim();
    const category = $("bookingCategory").value;
    const timeSelect = $("bookingTime");
    const message = $("slotMessage");

    timeSelect.innerHTML = "";

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "Select a time";
    timeSelect.appendChild(firstOption);

    if (!date || !service || !category) {
        firstOption.textContent = "Select category, service, and date first";
        message.textContent = "Enter the service details to see availability.";
        return;
    }

    const serviceKey = getServiceKey();
    const existing = getSlotBookings(date, serviceKey);

    const now = new Date();
    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let availableCount = 0;

    generateTimeSlots().forEach((slot) => {
        const isBooked = existing.some((booking) => booking.time === slot.value);

        const slotDateTime = new Date(`${date}T${slot.value}:00`);
        const isPast = selectedDate.getTime() === today.getTime() &&
            slotDateTime <= now;

        const option = document.createElement("option");
        option.value = slot.value;
        option.textContent = isBooked
            ? `${slot.label} — Already booked`
            : isPast
                ? `${slot.label} — Past time`
                : slot.label;

        option.disabled = isBooked || isPast;

        if (!isBooked && !isPast) {
            availableCount++;
        }

        timeSelect.appendChild(option);
    });

    message.textContent = availableCount
        ? `${availableCount} time slots available.`
        : "No available slots. Try another date or service.";
}

$("bookingDate").addEventListener("change", updateTimeSlots);
$("bookingService").addEventListener("input", updateTimeSlots);
$("bookingCategory").addEventListener("change", updateTimeSlots);

$("bookingForm").addEventListener("reset", function () {
    setTimeout(() => {
        updateTimeSlots();
        applyBookingLanguage("en");
    }, 0);
});

$("bookingForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = $("bookingName").value.trim();
    const email = $("bookingEmail").value.trim().toLowerCase();
    const phone = $("bookingPhone").value.trim();
    const category = $("bookingCategory").value;
    const service = $("bookingService").value.trim();
    const date = $("bookingDate").value;
    const time = $("bookingTime").value;
    const notes = $("bookingNotes").value.trim();

    if (!name || !email || !phone || !category || !service || !date || !time) {
        showToast("Please complete all required fields.", "error");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        showToast("Enter a valid 10-digit phone number.", "error");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
        showToast("Please select today or a future date.", "error");
        return;
    }

    const serviceKey = getServiceKey();

    // Check again immediately before saving to reduce duplicate bookings.
    const bookings = getBookings();

    const duplicate = bookings.some((booking) => {
        return booking.date === date &&
            booking.time === time &&
            booking.serviceKey === serviceKey &&
            booking.status === "Booked";
    });

    if (duplicate) {
        showToast("This time slot is already booked. Choose another.", "error");
        updateTimeSlots();
        return;
    }

    const booking = {
        id: createBookingId(),
        name,
        email,
        phone,
        category,
        service,
        serviceKey,
        date,
        time,
        notes,
        language: $("bookingLanguage").value,
        status: "Booked",
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);

    if (!saveBookings(bookings)) {
        return;
    }

    $("bookingForm").reset();
    updateProfile();
    setMinimumDate();
    renderDashboard();
    showSection("appointments");

    showToast(`Booking confirmed! Your ID is ${booking.id}`);
});

function createBookingId() {
    return "BE-" +
        Date.now().toString(36).toUpperCase() + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
}

/* =========================
   DASHBOARD SUMMARY
========================= */

function getUserBookings() {
    const user = getCurrentUser();

    if (!user) {
        return [];
    }

    const allBookings = getBookings();

    // Demo admin and manager accounts can view every booking.
    if (user.role === "admin" || user.role === "manager") {
        return allBookings;
    }

    return allBookings.filter((booking) => {
        return booking.email.toLowerCase() === user.email.toLowerCase();
    });
}

function isUpcoming(booking) {
    if (booking.status !== "Booked") {
        return false;
    }

    return new Date(`${booking.date}T${booking.time}:00`) >= new Date();
}

function renderDashboard() {
    const bookings = getUserBookings();

    $("totalBookings").textContent = bookings.length;

    $("upcomingBookings").textContent =
        bookings.filter(isUpcoming).length;

    $("completedBookings").textContent =
        bookings.filter((booking) => {
            return booking.status === "Booked" && !isUpcoming(booking);
        }).length;

    $("cancelledBookings").textContent =
        bookings.filter((booking) => booking.status === "Cancelled").length;

    const recent = [...bookings]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 4);

    const container = $("recentBookings");
    container.innerHTML = "";

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No bookings yet.</p>
                <p>Create your first booking to get started.</p>
            </div>
        `;
        return;
    }

    const list = document.createElement("div");
    list.className = "booking-list";

    recent.forEach((booking) => {
        list.appendChild(createBookingCard(booking));
    });

    container.appendChild(list);
}

/* =========================
   BOOKINGS LIST
========================= */

function renderAppointments() {
    const search = $("searchBookings").value.trim().toLowerCase();
    const status = $("statusFilter").value;

    let bookings = getUserBookings();

    if (status !== "all") {
        bookings = bookings.filter((booking) => booking.status === status);
    }

    if (search) {
        bookings = bookings.filter((booking) => {
            return [
                booking.id,
                booking.name,
                booking.email,
                booking.category,
                booking.service,
                booking.date
            ].some((value) => String(value || "").toLowerCase().includes(search));
        });
    }

    bookings.sort((a, b) => {
        return b.createdAt.localeCompare(a.createdAt);
    });

    const container = $("appointmentsList");
    container.innerHTML = "";

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No bookings match your search.
            </div>
        `;
        return;
    }

    const list = document.createElement("div");
    list.className = "booking-list";

    bookings.forEach((booking) => {
        list.appendChild(createBookingCard(booking));
    });

    container.appendChild(list);
}

function createBookingCard(booking) {
    const card = document.createElement("article");
    card.className = "booking-card";

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = `${booking.category} — ${booking.service}`;

    const id = document.createElement("p");
    id.className = "booking-id";
    id.textContent = `Booking ID: ${booking.id}`;

    const person = document.createElement("p");
    person.textContent = `Name: ${booking.name}`;

    const date = document.createElement("p");
    date.textContent = `Date: ${formatDate(booking.date)} · ${formatTime(booking.time)}`;

    const email = document.createElement("p");
    email.textContent = `Email: ${booking.email}`;

    details.append(title, id, person, date, email);

    if (booking.notes) {
        const notes = document.createElement("p");
        notes.textContent = `Notes: ${booking.notes}`;
        details.appendChild(notes);
    }

    const right = document.createElement("div");
    right.className = "booking-right";

    const status = document.createElement("span");
    status.className = booking.status === "Booked"
        ? "status status-booked"
        : "status status-cancelled";
    status.textContent = booking.status;

    const actions = document.createElement("div");
    actions.className = "booking-actions";

    const downloadButton = document.createElement("button");
    downloadButton.className = "small-btn";
    downloadButton.textContent = "↓ PDF";
    downloadButton.addEventListener("click", () => downloadBookingPDF(booking.id));
    actions.appendChild(downloadButton);

    if (booking.status === "Booked" && isUpcoming(booking)) {
        const cancelButton = document.createElement("button");
        cancelButton.className = "small-btn danger";
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", () => cancelBooking(booking.id));
        actions.appendChild(cancelButton);
    }

    right.append(status, actions);
    card.append(details, right);

    return card;
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(timeString) {
    if (!timeString) {
        return "";
    }

    const [hour, minute] = timeString.split(":").map(Number);
    const date = new Date();

    date.setHours(hour, minute, 0, 0);

    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

/* =========================
   CANCEL BOOKING
========================= */

function cancelBooking(id) {
    const booking = getUserBookings().find((item) => item.id === id);

    if (!booking) {
        showToast("Booking not found.", "error");
        return;
    }

    if (booking.status !== "Booked") {
        showToast("This booking has already been cancelled.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Cancel booking ${booking.id} for ${booking.service}?`
    );

    if (!confirmed) {
        return;
    }

    const bookings = getBookings();
    const index = bookings.findIndex((item) => item.id === id);

    if (index === -1) {
        showToast("Booking not found.", "error");
        return;
    }

    bookings[index].status = "Cancelled";
    bookings[index].cancelledAt = new Date().toISOString();

    if (!saveBookings(bookings)) {
        return;
    }

    renderDashboard();
    renderAppointments();
    updateTimeSlots();

    showToast("Booking cancelled successfully.");
}

/* =========================
   PDF DOWNLOADS
========================= */

function downloadBookingPDF(id) {
    const booking = getUserBookings().find((item) => item.id === id);

    if (!booking) {
        showToast("Booking not found.", "error");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        showToast("PDF library unavailable. Check your internet connection.", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(49, 94, 251);
    doc.text("BookEase", 15, 20);

    doc.setFontSize(15);
    doc.setTextColor(30, 40, 60);
    doc.text("Booking Confirmation", 15, 32);

    doc.setFontSize(10);
    doc.setTextColor(90, 100, 120);
    doc.text("Booking details and appointment information", 15, 40);

    const rows = [
        ["Booking ID", booking.id],
        ["Status", booking.status],
        ["Name", booking.name],
        ["Email", booking.email],
        ["Phone", booking.phone],
        ["Category", booking.category],
        ["Service / Provider", booking.service],
        ["Date", formatDate(booking.date)],
        ["Time", formatTime(booking.time)],
        ["Additional Notes", booking.notes || "None"]
    ];

    doc.autoTable({
        startY: 50,
        head: [["Field", "Details"]],
        body: rows,
        theme: "grid",
        headStyles: {
            fillColor: [49, 94, 251]
        },
        styles: {
            fontSize: 10,
            cellPadding: 4,
            overflow: "linebreak"
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 125 }
        }
    });

    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(
        "Thank you for using BookEase.",
        15,
        (doc.lastAutoTable?.finalY || 100) + 15
    );

    doc.save(`${booking.id}.pdf`);
}

function downloadAllBookingsPDF() {
    const bookings = getUserBookings();

    if (bookings.length === 0) {
        showToast("There are no bookings to export.", "error");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        showToast("PDF library unavailable. Check your internet connection.", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");

    doc.setFontSize(20);
    doc.setTextColor(49, 94, 251);
    doc.text("BookEase — Booking Report", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(90, 100, 120);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 26);

    doc.autoTable({
        startY: 33,
        head: [[
            "Booking ID",
            "Name",
            "Category",
            "Service",
            "Date",
            "Time",
            "Status"
        ]],
        body: bookings.map((booking) => [
            booking.id,
            booking.name,
            booking.category,
            booking.service,
            formatDate(booking.date),
            formatTime(booking.time),
            booking.status
        ]),
        theme: "grid",
        headStyles: {
            fillColor: [49, 94, 251]
        },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: "linebreak"
        }
    });

    doc.save("BookEase-Booking-Report.pdf");
}

$("exportAllButton").addEventListener("click", downloadAllBookingsPDF);

/* =========================
   SEARCH AND FILTERS
========================= */

$("searchBookings").addEventListener("input", renderAppointments);
$("statusFilter").addEventListener("change", renderAppointments);

/* =========================
   SIDEBAR NAVIGATION
========================= */

document.querySelectorAll(".side-link[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

/* =========================
   LANGUAGE SELECTOR
========================= */

function applyBookingLanguage(language) {
    const words = translations[language] || translations.en;

    const labelMap = {
        bookingName: words.name,
        bookingEmail: words.email,
        bookingPhone: words.phone,
        bookingCategory: words.category,
        bookingService: words.service,
        bookingDate: words.date,
        bookingTime: words.time,
        bookingNotes: words.notes
    };

    Object.entries(labelMap).forEach(([id, text]) => {
        const label = document.querySelector(`label[for="${id}"]`);

        if (label) {
            label.textContent = text;
        }
    });

    const submitButton = $("bookingForm").querySelector('button[type="submit"]');
    const clearButton = $("bookingForm").querySelector('button[type="reset"]');

    submitButton.textContent = words.submit;
    clearButton.textContent = words.clear;
}

$("bookingLanguage").addEventListener("change", function () {
    applyBookingLanguage(this.value);
});

/* =========================
   INITIALIZATION
========================= */

function initializeApp() {
    setMinimumDate();
    updateTimeSlots();

    const user = getCurrentUser();

    if (user) {
        showDashboard();
    } else {
        showLanding();
    }
}

initializeApp();