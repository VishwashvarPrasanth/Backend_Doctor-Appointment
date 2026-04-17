const API_URL = '/api';
console.log('App logic loaded. Using API_URL:', API_URL);
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentToken = localStorage.getItem('token') || null;

// Page Switching
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    if(pageId === 'search') searchDoctors();
    if(pageId === 'my-bookings') loadMyBookings();
    if(pageId === 'auth') renderAuthForm('login');
}

// Auth Logic
function renderAuthForm(type) {
    const container = document.getElementById('auth-forms');
    if (type === 'login') {
        container.innerHTML = `
            <div class="form-group"><label>Email</label><input type="email" id="login-email" placeholder="email@example.com"></div>
            <div class="form-group"><label>Password</label><input type="password" id="login-password" placeholder="••••••••"></div>
            <button class="btn-primary" style="width:100%" onclick="login()">Sign In</button>
        `;
    } else {
        container.innerHTML = `
            <div class="form-group"><label>Name</label><input type="text" id="reg-name" placeholder="John Doe"></div>
            <div class="form-group"><label>Email</label><input type="email" id="reg-email" placeholder="john@example.com"></div>
            <div class="form-group"><label>Password</label><input type="password" id="reg-password" placeholder="••••••••"></div>
            <div class="form-group"><label>Role</label>
                <select id="reg-role" onchange="toggleSpecialization(this.value)">
                    <option value="User">Patient</option>
                    <option value="Doctor">Doctor</option>
                </select>
            </div>
            <div id="spec-container" class="form-group" style="display:none">
                <label>Specialization</label>
                <input type="text" id="reg-spec" placeholder="e.g. Cardiology">
            </div>
            <button class="btn-primary" style="width:100%" onclick="register()">Create Account</button>
        `;
    }
}

function setAuthTab(type) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderAuthForm(type);
}

function toggleSpecialization(role) {
    document.getElementById('spec-container').style.display = role === 'Doctor' ? 'block' : 'none';
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
        saveAuth(data.token, data.user);
        console.log('Login successful for user:', data.user.name);
        showPage('home');
        updateUI(); // Immediate UI update
    } else alert(data.message);
}

async function register() {
    try {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        const specialization = document.getElementById('reg-spec').value;

        if (!name || !email || !password) return alert("Please fill all required fields");

        console.log('Registering:', { name, email, role });
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, specialization })
        });
        const data = await res.json();
        
        if (res.ok) {
            alert("Registration successful! Switching to Login.");
            setAuthTab('login');
        } else {
            alert(`Registration Failed: ${data.error || data.message || 'Unknown Error'}`);
        }
    } catch (err) {
        console.error('Registration Error:', err);
        alert("Communication Error. Check your network.");
    }
}

function saveAuth(token, user) {
    currentToken = token;
    currentUser = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    updateUI();
}

function updateUI() {
    if (currentToken) {
        document.getElementById('btn-auth').innerText = `Logout (${currentUser.name})`;
        document.getElementById('btn-auth').onclick = logout;
        document.getElementById('nav-bookings').style.display = 'block';
    } else {
        document.getElementById('btn-auth').innerText = `Login / Sign Up`;
        document.getElementById('btn-auth').onclick = () => showPage('auth');
        document.getElementById('nav-bookings').style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentUser = null;
    updateUI();
    showPage('home');
}

// Doctors Search
async function searchDoctors() {
    try {
        const specInput = document.getElementById('specialty-input');
        const spec = specInput ? specInput.value : '';
        const res = await fetch(`${API_URL}/doctors?specialization=${spec}`);
        const doctors = await res.json();
        
        const list = document.getElementById('doctor-list');
        if (doctors.length === 0) {
            list.innerHTML = '<p class="text-dim">No doctors found for this specialty.</p>';
            return;
        }
        
        list.innerHTML = doctors.map(d => {
            const docName = d.user ? d.user.name : 'Unknown Doctor';
            return `
                <div class="doctor-card">
                    <h3>Dr. ${docName}</h3>
                    <p><strong>Specialty:</strong> ${d.specialization}</p>
                    <p><strong>Status:</strong> ${d.status}</p>
                    <button class="btn-primary" onclick="openBookingModal('${d.id}', 'Dr. ${docName}')">Book Now</button>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Search Error:', err);
    }
}

// Booking Modal
function openBookingModal(id, name) {
    if (!currentToken) return alert("Please login to book appointments");
    document.getElementById('modal-title').innerText = `Book with ${name}`;
    document.getElementById('modal-body').innerHTML = `
        <p class="text-dim" style="margin-bottom:15px">Available: Daily, 09:00 AM - 05:00 PM</p>
        <div class="form-group">
            <label>Select Date & Time</label>
            <input type="datetime-local" id="book-date">
        </div>
    `;
    document.getElementById('modal-container').style.display = 'flex';
    document.getElementById('modal-submit').onclick = () => confirmBooking(id);
}

function closeModal() {
    document.getElementById('modal-container').style.display = 'none';
}

async function confirmBooking(doctorId) {
    const appointmentDate = document.getElementById('book-date').value;
    const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ doctorId, appointmentDate })
    });
    const data = await res.json();
    if (res.ok) {
        alert("Appointment Scheduled Successfully!");
        closeModal();
        showPage('my-bookings');
    } else alert(data.message);
}

// My Bookings
async function loadMyBookings() {
    const res = await fetch(`${API_URL}/appointments`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const bookings = await res.json();
    const list = document.getElementById('booking-list');
    list.innerHTML = bookings.map(b => `
        <div class="booking-card">
            <h3>Appointment ID: ${b.id.slice(0,8)}...</h3>
            <p><strong>Doctor:</strong> Dr. ${b.doctor.user.name}</p>
            <p><strong>Date:</strong> ${new Date(b.appointmentDate).toLocaleString()}</p>
            <p><strong>Status:</strong> ${b.status}</p>
        </div>
    `).join('');
}

// Init
updateUI();
showPage('home');
renderAuthForm('login');
