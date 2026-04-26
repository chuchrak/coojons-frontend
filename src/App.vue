<template>
  <div class="min-vh-100 text-light wrapper" :style="{ fontSize: globalFontSize + 'px' }">
    
    <div v-if="!user" class="container pt-5">
      <div class="row justify-content-center mt-5">
        <div class="col-md-5">
          <div class="card bg-panel border-0 rounded-4 shadow-lg">
            <div class="card-body p-5">
              <div class="text-center mb-4"><h2 class="fw-bold mb-1 text-white">COOJONS</h2><p class="text-white-50">Portal Akademicki v2.0</p></div>
              <div class="mb-3"><label class="form-label text-white-50 fw-semibold">Login (student / wykładowca / admin)</label><input v-model="loginForm.username" type="text" class="form-control bg-dark border-secondary text-light" placeholder="Wpisz swój login..."></div>
              <div class="mb-4"><label class="form-label text-white-50 fw-semibold">Hasło</label><input v-model="loginForm.password" type="password" class="form-control bg-dark border-secondary text-light" placeholder="Wpisz hasło..." @keyup.enter="handleLogin"></div>
              <button @click="handleLogin" class="btn btn-primary w-100 py-2 fw-bold rounded-3">Zaloguj System</button>
              
              <div v-if="loginError" class="alert alert-danger py-2 mt-3 mb-0 text-center fw-bold border-0 shadow-sm">Błędny login lub hasło!</div>

              <div class="d-flex align-items-center my-4"><hr class="flex-grow-1 border-secondary"><span class="mx-3 text-white-50 small fw-bold">LUB</span><hr class="flex-grow-1 border-secondary"></div>
              <button @click="loginWithGoogle" :disabled="isGoogleLoading" class="btn btn-light w-100 py-2 fw-bold rounded-3 d-flex justify-content-center align-items-center gap-3 google-btn">
                <span class="text-dark">{{ isGoogleLoading ? 'Łączenie z Google...' : 'Zaloguj przez Google' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="d-flex flex-column min-vh-100 relative">
      
      <div class="header-top d-flex justify-content-between align-items-center px-4 py-3 bg-darker">
        <h4 class="mb-0 fw-bold text-white">Portal Akademicki v2.0</h4>
        <div class="text-end d-flex gap-4">
          <div><small class="text-white-50 d-block text-uppercase" style="font-size: 0.7em; letter-spacing: 1px;">Moduł</small><span class="fw-bold text-white text-capitalize">{{ user.role }}</span></div>
          <div><small class="text-white-50 d-block text-uppercase" style="font-size: 0.7em; letter-spacing: 1px;">Kierunek / Wydział</small><span class="fw-bold text-warning">{{ user.kierunek || 'Nauk Technicznych' }}</span></div>
        </div>
      </div>

      <div class="d-flex flex-grow-1 position-relative">
        
        <div v-if="activePayment" class="payment-overlay d-flex justify-content-center align-items-center position-absolute top-0 start-0 w-100 h-100" style="background: rgba(0,0,0,0.85); z-index: 1000;">
          <div class="card bg-panel border-0 shadow-lg rounded-4" style="width: 450px; overflow: hidden;">
            <div class="bg-darker p-4 text-center border-bottom border-secondary position-relative">
              <button @click="closePayment" class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-3 border-0">✖</button>
              <h5 class="text-white-50 mb-1">Do zapłaty:</h5><h1 class="fw-bold text-white mb-0">{{ activePayment.amount.toFixed(2) }} PLN</h1><p class="text-info mt-2 mb-0">{{ activePayment.title }}</p>
            </div>
            <div v-if="paymentSuccess" class="p-5 text-center"><h1 class="display-1 text-success mb-3">✅</h1><h4 class="text-white fw-bold">Płatność Zakończona</h4><p class="text-white-50">Transakcja została przetworzona pomyślnie.</p><button @click="closePayment" class="btn btn-success w-100 fw-bold mt-3">Wróć do systemu</button></div>
            <div v-else class="p-4">
              <div class="d-flex gap-2 mb-4"><button @click="paymentMethod = 'blik'" class="btn w-100 fw-bold" :class="paymentMethod === 'blik' ? 'btn-light text-dark' : 'btn-outline-secondary text-white'">BLIK</button><button @click="paymentMethod = 'karta'" class="btn w-100 fw-bold" :class="paymentMethod === 'karta' ? 'btn-light text-dark' : 'btn-outline-secondary text-white'">KARTA</button><button @click="paymentMethod = 'apple'" class="btn w-100 fw-bold" :class="paymentMethod === 'apple' ? 'btn-light text-dark' : 'btn-outline-secondary text-white'"> Pay</button></div>
              <div v-if="isProcessing" class="text-center py-4"><div class="spinner-border text-info mb-3" role="status" style="width: 3rem; height: 3rem;"></div><h5 class="text-white">Oczekiwanie na potwierdzenie...</h5></div>
              <div v-else-if="paymentMethod === 'blik'"><div class="text-center mb-4"><div class="bg-white rounded-3 d-inline-block p-2 mb-3"><h4 class="text-dark fw-bold mb-0 mx-2">blik</h4></div><input v-model="blikCode" type="text" class="form-control bg-dark text-white text-center fs-3 letter-spacing-2" placeholder="000 000" maxlength="6"></div><button @click="processPayment" :disabled="blikCode.length < 6" class="btn btn-primary w-100 py-3 fw-bold fs-5 rounded-3">Opłać BLIKIEM</button></div>
              <div v-else-if="paymentMethod === 'karta'"><div class="mb-3"><input type="text" class="form-control bg-dark text-white border-secondary mb-2" placeholder="Numer karty (np. 4111 1111 ...)"><div class="d-flex gap-2"><input type="text" class="form-control bg-dark text-white border-secondary w-50" placeholder="MM/YY"><input type="text" class="form-control bg-dark text-white border-secondary w-50" placeholder="CVV"></div></div><button @click="processPayment" class="btn btn-primary w-100 py-3 fw-bold fs-5 rounded-3">Płacę Kartą</button></div>
              <div v-else-if="paymentMethod === 'apple'" class="text-center py-3"><button @click="processPayment" class="btn btn-light w-100 py-3 fw-bold fs-5 rounded-pill d-flex justify-content-center align-items-center gap-2"><span class="fs-4"></span> Pay</button></div>
            </div>
          </div>
        </div>

        <div class="sidebar bg-panel d-flex flex-column p-3 shadow-lg" style="width: 280px; z-index: 10;">
          <h4 class="fw-bold text-info mb-4 mt-2 px-3">Akademia Bialska</h4>
          <ul v-if="user.role === 'student'" class="nav nav-pills flex-column mb-auto gap-2">
            <li class="nav-item"><a href="#" @click.prevent="activeTab = 'pulpit'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTab === 'pulpit'}">🖥️ Pulpit</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTab = 'mlegitymacja'" class="nav-link text-white-50 px-4 py-3 text-success fw-bold" :class="{'active-tab text-white bg-success': activeTab === 'mlegitymacja'}">🪪 mLegitymacja</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTab = 'plan'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTab === 'plan'}">📅 Mój Plan</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTab = 'oceny'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTab === 'oceny'}">⭐ Oceny</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTab = 'obecnosc'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTab === 'obecnosc'}">🙋 Frekwencja</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTab = 'dokumenty'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTab === 'dokumenty'}">📄 e-Wnioski</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTab = 'platnosci'" class="nav-link text-white-50 px-4 py-3 d-flex justify-content-between align-items-center" :class="{'active-tab text-white': activeTab === 'platnosci'}"><span>💸 Płatności</span><span v-if="unpaidCount > 0" class="badge bg-danger rounded-pill">{{ unpaidCount }}</span></a></li>
          </ul>
          <ul v-if="user.role === 'dziekanat'" class="nav nav-pills flex-column mb-auto gap-2">
            <li class="nav-item"><a href="#" @click.prevent="activeTabAdmin = 'statystyki'" class="nav-link text-white-50 px-4 py-3 text-info fw-bold" :class="{'active-tab text-white': activeTabAdmin === 'statystyki'}">📊 Statystyki</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTabAdmin = 'studenci'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTabAdmin === 'studenci'}">👥 Lista Studentów</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTabAdmin = 'wykladowcy'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTabAdmin === 'wykladowcy'}">🎓 Wykładowcy</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTabAdmin = 'wnioski'" class="nav-link text-white-50 px-4 py-3 d-flex justify-content-between align-items-center" :class="{'active-tab text-white': activeTabAdmin === 'wnioski'}"><span>📄 Wnioski</span><span v-if="newRequestsCount > 0" class="badge bg-danger rounded-pill">{{ newRequestsCount }}</span></a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTabAdmin = 'plany'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTabAdmin === 'plany'}">📅 Plany Zajęć</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTabAdmin = 'ogloszenia'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTabAdmin === 'ogloszenia'}">📢 Ogłoszenia</a></li>
          </ul>
          <ul v-if="user.role === 'wykładowca'" class="nav nav-pills flex-column mb-auto gap-2">
            <li class="nav-item"><a href="#" @click.prevent="activeTabLecturer = 'pulpit'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTabLecturer === 'pulpit'}">🖥️ Pulpit</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTabLecturer = 'oceny'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTabLecturer === 'oceny'}">⭐ Wystaw Oceny</a></li>
            <li class="nav-item"><a href="#" @click.prevent="activeTabLecturer = 'obecnosc'" class="nav-link text-white-50 px-4 py-3" :class="{'active-tab text-white': activeTabLecturer === 'obecnosc'}">🙋 Sprawdź Obecność</a></li>
          </ul>
          <div class="mt-auto px-2 pb-3">
            <div class="mb-3 text-center d-flex align-items-center justify-content-center flex-column">
              <span class="text-white fw-bold mb-1">{{ user.name }}</span>
            </div>
            <button @click="logout" class="btn w-100 py-2 border border-secondary text-white-50 hover-logout rounded-pill">[→ WYLOGUJ</button>
          </div>
        </div>

        <div class="flex-grow-1 p-5 content-area position-relative overflow-auto" style="height: calc(100vh - 70px);">
          <div v-if="flashMessage" class="alert alert-success position-absolute top-0 end-0 m-4 shadow z-3 border-0 bg-success text-white fw-bold">{{ flashMessage }}</div>

          <div v-if="user.role === 'wykładowca'">
            <div v-if="activeTabLecturer === 'pulpit'">
              <h3 class="fw-bold text-white border-bottom border-secondary pb-3 mb-4">Pulpit Wykładowcy</h3>
              <div class="row g-4 mb-4"><div class="col-md-4"><div class="card bg-panel border-0 p-4"><h6 class="text-white-50 text-uppercase">Przypisane Przedmioty</h6><h2 class="text-info fw-bold mb-0">{{ user.subjects.length }}</h2><ul class="mt-3 ps-3 text-white-50 mb-0"><li v-for="s in user.subjects" :key="s">{{ s }}</li></ul></div></div><div class="col-md-4"><div class="card bg-panel border-0 p-4"><h6 class="text-white-50 text-uppercase">Oczekujące wiadomości</h6><h2 class="text-warning fw-bold mb-0">0</h2></div></div></div>
            </div>
            <div v-if="activeTabLecturer === 'oceny'">
              <h3 class="fw-bold text-white border-bottom border-secondary pb-3 mb-4">Dziennik Ocen - Wstawianie</h3>
              <div class="card bg-panel mb-4 border-0 shadow-sm"><div class="card-body"><h6 class="text-white-50 mb-3">Wybierz przedmiot, dla którego chcesz wystawić oceny:</h6><select v-model="selectedSubjectLecturer" class="form-select bg-dark text-white border-info w-50"><option disabled value="">-- Wybierz przedmiot --</option><option v-for="sub in user.subjects" :key="sub" :value="sub">{{ sub }}</option></select></div></div>
              <div v-if="selectedSubjectLecturer" class="card bg-panel shadow-sm border-0"><div class="card-body p-0"><table class="table table-dark table-hover align-middle mb-0 custom-table"><thead><tr><th class="ps-4 text-white-50">Nr Albumu</th><th class="text-white-50">Nazwisko i Imię</th><th class="text-white-50">Kierunek</th><th class="text-end pe-4 text-white-50">Wystaw Ocenę</th></tr></thead><tbody><tr v-for="student in studentsForLecturerSubject" :key="student.id"><td class="ps-4 text-white">{{ student.nrAlbumu }}</td><td class="fw-bold text-white">{{ student.nazwisko }} {{ student.imie }}</td><td><span class="badge bg-secondary">{{ student.kierunek }}</span></td><td class="text-end pe-4"><div class="d-flex justify-content-end align-items-center gap-2"><select v-model="tempLecturerGrades[student.nrAlbumu]" class="form-select form-select-sm bg-dark text-white border-secondary" style="width: 100px;"><option value="5.0">5.0</option><option value="4.5">4.5</option><option value="4.0">4.0</option><option value="3.5">3.5</option><option value="3.0">3.0</option><option value="2.0">2.0</option></select><button @click="saveLecturerGrade(student)" class="btn btn-sm btn-success fw-bold">Zapisz w Chmurze</button></div></td></tr><tr v-if="studentsForLecturerSubject.length === 0"><td colspan="4" class="text-center py-4 text-white-50">Żaden student nie jest zapisany na ten przedmiot.</td></tr></tbody></table></div></div>
            </div>
            <div v-if="activeTabLecturer === 'obecnosc'">
              <h3 class="fw-bold text-white border-bottom border-secondary pb-3 mb-4">Lista Obecności (Frekwencja)</h3>
              <div class="card bg-panel mb-4 border-0 shadow-sm"><div class="card-body d-flex gap-3"><div class="w-50"><label class="text-white-50 small">Wybierz przedmiot</label><select v-model="selectedSubjectLecturer" class="form-select bg-dark text-white border-info"><option disabled value="">-- Wybierz przedmiot --</option><option v-for="sub in user.subjects" :key="sub" :value="sub">{{ sub }}</option></select></div><div class="w-25"><label class="text-white-50 small">Data zajęć</label><input type="date" v-model="attendanceDate" class="form-control bg-dark text-white border-info"></div></div></div>
              <div v-if="selectedSubjectLecturer && attendanceDate" class="card bg-panel shadow-sm border-0"><div class="card-body p-0"><table class="table table-dark table-hover align-middle mb-0 custom-table"><thead><tr><th class="ps-4 text-white-50">Student</th><th class="text-white-50">Status Obecności</th><th class="text-end pe-4 text-white-50">Zaznacz</th></tr></thead><tbody><tr v-for="student in studentsForLecturerSubject" :key="student.id"><td class="ps-4 fw-bold text-white">{{ student.nazwisko }} {{ student.imie }} <small class="text-white-50 ms-2">({{student.nrAlbumu}})</small></td><td><span class="badge px-3 py-2" :class="getAttendanceStatus(student.nrAlbumu) === 'Obecny' ? 'bg-success' : (getAttendanceStatus(student.nrAlbumu) === 'Nieobecny' ? 'bg-danger' : (getAttendanceStatus(student.nrAlbumu) === 'Spóźniony' ? 'bg-warning text-dark' : 'bg-secondary'))">{{ getAttendanceStatus(student.nrAlbumu) || 'Brak wpisu' }}</span></td><td class="text-end pe-4"><button @click="markAttendance(student.nrAlbumu, 'Obecny')" class="btn btn-sm btn-outline-success me-1">Obecny</button><button @click="markAttendance(student.nrAlbumu, 'Spóźniony')" class="btn btn-sm btn-outline-warning me-1">Spóźniony</button><button @click="markAttendance(student.nrAlbumu, 'Nieobecny')" class="btn btn-sm btn-outline-danger">Nieobecny</button></td></tr></tbody></table></div></div>
            </div>
          </div>

          <div v-if="user.role === 'dziekanat'">
            <div v-if="activeTabAdmin === 'statystyki'">
              <h3 class="fw-bold text-white border-bottom border-secondary pb-3 mb-4">Pulpit Analityczny (W Chmurze)</h3>
              <div class="row g-4 mb-4"><div class="col-md-3"><div class="card bg-panel border-0 p-4 text-center"><h6 class="text-white-50 text-uppercase">Aktywni Studenci</h6><h2 class="text-white fw-bold mb-0">{{ students.length }}</h2></div></div><div class="col-md-3"><div class="card bg-panel border-0 p-4 text-center"><h6 class="text-white-50 text-uppercase">Wnioski (Oczekujące)</h6><h2 class="text-warning fw-bold mb-0">{{ newRequestsCount }}</h2></div></div><div class="col-md-3"><div class="card bg-panel border-0 p-4 text-center"><h6 class="text-white-50 text-uppercase">Zaległości finansowe</h6><h2 class="text-danger fw-bold mb-0">{{ totalUnpaidAdmin.toFixed(2) }} PLN</h2></div></div><div class="col-md-3"><div class="card bg-panel border-0 p-4 text-center"><h6 class="text-white-50 text-uppercase">Wydane Legitymacje</h6><h2 class="text-success fw-bold mb-0">{{ students.length > 0 ? 100 : 0 }}%</h2></div></div></div>
              <div class="row g-4"><div class="col-md-6"><div class="card bg-panel border-0 p-4 h-100"><h5 class="text-white fw-bold mb-4">Status finansów studentów</h5><div class="d-flex align-items-center justify-content-center h-100"><div class="css-pie-chart shadow-sm position-relative d-flex justify-content-center align-items-center" :style="{ background: `conic-gradient(#198754 0% ${financePaidPercent}%, #dc3545 ${financePaidPercent}% 100%)` }"><div class="inner-circle bg-panel rounded-circle" style="width: 70%; height: 70%;"></div><h4 class="position-absolute text-white fw-bold m-0">{{ financePaidPercent }}%</h4></div><div class="ms-5"><div class="d-flex align-items-center mb-2"><span class="badge bg-success me-2 p-2"></span><span class="text-white-50">Opłacone czesne ({{ financePaidPercent }}%)</span></div><div class="d-flex align-items-center"><span class="badge bg-danger me-2 p-2"></span><span class="text-white-50">Zaległości ({{ financeUnpaidPercent }}%)</span></div></div></div></div></div><div class="col-md-6"><div class="card bg-panel border-0 p-4 h-100"><h5 class="text-white fw-bold mb-4">Średnia ocen na wydziale</h5><div v-for="(fg, index) in facultyGrades" :key="index" class="mb-3"><div class="d-flex justify-content-between text-white-50 mb-1"><small>{{ fg.subject }}</small><small>{{ fg.avg }}</small></div><div class="progress" style="height: 10px; background-color: #2d2e36;"><div class="progress-bar" :class="fg.avg >= 4 ? 'bg-success' : (fg.avg >= 3 ? 'bg-warning' : 'bg-danger')" :style="{ width: fg.percent + '%' }"></div></div></div><div v-if="facultyGrades.length === 0" class="text-white-50 small text-center py-4">Brak ocen w chmurze. Dodaj ocenę studentowi, aby wygenerować wykres.</div></div></div></div>
            </div>

            <div v-if="activeTabAdmin === 'wykladowcy'">
              <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4"><h3 class="mb-0 fw-bold text-white">Kadra Dydaktyczna - Zarządzanie</h3><button @click="isEditingLecturer = !isEditingLecturer" class="btn btn-primary rounded-3 px-4 py-2 text-dark fw-bold">{{ isEditingLecturer ? 'Anuluj dodawanie' : '+ DODAJ WYKŁADOWCĘ' }}</button></div>
              <div v-if="isEditingLecturer" class="card bg-panel mb-4 shadow-sm border-0"><div class="card-body"><form @submit.prevent="saveLecturer"><div class="row g-3 align-items-start"><div class="col-md-2"><label class="text-white-50 small">Imię (z tyt.)</label><input v-model="currentLecturer.imie" type="text" class="form-control bg-dark text-light border-secondary" placeholder="np. Dr Jan" required></div><div class="col-md-2"><label class="text-white-50 small">Nazwisko</label><input v-model="currentLecturer.nazwisko" type="text" class="form-control bg-dark text-light border-secondary" required></div><div class="col-md-2"><label class="text-info small fw-bold">Login konta</label><input v-model="currentLecturer.login" type="text" class="form-control bg-dark text-info border-info" required></div><div class="col-md-2"><label class="text-info small fw-bold">Hasło startowe</label><input v-model="currentLecturer.password" type="text" class="form-control bg-dark text-info border-info" required></div><div class="col-md-4"><label class="text-white-50 small">Przypisz przedmioty (CTRL, aby zaznaczyć wiele)</label><select v-model="currentLecturer.subjects" multiple class="form-select bg-dark text-light border-secondary" style="height: 80px;" required><option v-for="sub in availableSubjectsList" :key="sub" :value="sub">{{ sub }}</option></select></div><div class="col-12 text-end mt-3"><button type="submit" class="btn btn-success fw-bold px-5 text-dark">Zapisz Wykładowcę</button></div></div></form></div></div>
              <div class="card bg-panel shadow-sm border-0"><div class="card-body p-0"><table class="table table-dark table-hover align-middle mb-0 custom-table"><thead><tr><th class="ps-4 text-white-50">IMIĘ I NAZWISKO</th><th class="text-white-50 text-center">LOGIN</th><th class="text-white-50">PRZYPISANE PRZEDMIOTY</th><th class="text-end pe-4 text-white-50">ZARZĄDZAJ</th></tr></thead><tbody><tr v-for="lec in lecturers" :key="lec.id"><td class="ps-4 fw-semibold text-white">{{ lec.name }}</td><td class="text-center text-info font-monospace">{{ lec.login }}</td><td><span v-for="s in lec.subjects" :key="s" class="badge bg-secondary me-1">{{ s }}</span></td><td class="text-end pe-4"><button @click="deleteLecturer(lec)" class="btn btn-sm btn-outline-danger" title="Usuń">🗑️</button></td></tr><tr v-if="lecturers.length === 0"><td colspan="4" class="text-center py-4 text-white-50">Brak wykładowców w bazie.</td></tr></tbody></table></div></div>
            </div>

            <div v-if="activeTabAdmin === 'studenci'">
              <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4"><h3 class="mb-0 fw-bold text-white">Lista Studentów (Baza Supabase)</h3><button @click="isEditing = !isEditing" class="btn btn-primary rounded-3 px-4 py-2 text-dark fw-bold">{{ isEditing ? 'Anuluj dodawanie' : '+ DODAJ STUDENTA' }}</button></div>
              <div v-if="isEditing" class="card bg-panel mb-4 shadow-sm border-0"><div class="card-body"><form @submit.prevent="saveStudent"><div class="row g-3 align-items-end"><div class="col-md-2"><label class="text-white-50 small">Imię</label><input v-model="currentStudent.imie" type="text" class="form-control bg-dark text-light border-secondary" required></div><div class="col-md-2"><label class="text-white-50 small">Nazwisko</label><input v-model="currentStudent.nazwisko" type="text" class="form-control bg-dark text-light border-secondary" required></div><div class="col-md-2"><label class="text-white-50 small">Nr Albumu</label><input v-model="currentStudent.nrAlbumu" type="text" class="form-control bg-dark text-light border-secondary" required></div><div class="col-md-2"><label class="text-white-50 small">Kierunek</label><select v-model="currentStudent.kierunek" class="form-select bg-dark text-light border-secondary" required><option value="Informatyka">Informatyka</option><option value="Ekonomia">Ekonomia</option><option value="Pielęgniarstwo">Pielęgniarstwo</option></select></div><div class="col-md-2"><label class="text-info small fw-bold">Login konta</label><input v-model="currentStudent.login" type="text" class="form-control bg-dark text-info border-info" placeholder="jkowalski" required></div><div class="col-md-2"><label class="text-info small fw-bold">Hasło startowe</label><input v-model="currentStudent.password" type="text" class="form-control bg-dark text-info border-info" placeholder="123" required></div><div class="col-12 text-end mt-3"><button type="submit" class="btn btn-success fw-bold px-5 text-dark">Zapisz do Chmury</button></div></div></form></div></div>
              <div class="card bg-panel shadow-sm border-0"><div class="card-body p-0"><table class="table table-dark table-hover align-middle mb-0 custom-table"><thead><tr><th class="ps-4 text-white-50">ID INDEKSU</th><th class="text-white-50">NAZWISKO I IMIĘ</th><th class="text-white-50">KIERUNEK</th><th class="text-white-50 text-center">LOGIN KONTA</th><th class="text-end pe-4 text-white-50">ZARZĄDZAJ</th></tr></thead><tbody><tr v-for="student in students" :key="student.id"><td class="ps-4 text-white">{{ student.nrAlbumu }}</td><td class="fw-semibold text-white">{{ student.imie }} {{ student.nazwisko }}</td><td class="text-white-50"><span class="badge bg-secondary">{{ student.kierunek || 'Brak' }}</span></td><td class="text-center text-info font-monospace">{{ student.login }}</td><td class="text-end pe-4"><button @click="openGradeModal(student)" class="btn btn-sm btn-outline-warning me-2" title="Wstaw Ocenę">⭐</button><button @click="openMsgModal(student)" class="btn btn-sm btn-outline-info me-2" title="Wyślij Powiadomienie">✉️</button><button @click="deleteStudent(student)" class="btn btn-sm btn-outline-danger" title="Skreśl">🗑️</button></td></tr><tr v-if="students.length === 0"><td colspan="5" class="text-center py-4 text-white-50">Baza w chmurze jest pusta. Dodaj studentów.</td></tr></tbody></table></div></div>
              <div v-if="actionStudent" class="card bg-dark border-warning mt-4 shadow"><div class="card-body"><h5 class="text-warning mb-3">Wystaw ocenę dla: {{ actionStudent.imie }} {{ actionStudent.nazwisko }} ({{ actionStudent.kierunek }})</h5><div class="d-flex gap-3"><select v-model="tempActionData.subject" class="form-select bg-panel text-white border-secondary w-50"><option disabled value="">Wybierz przedmiot z listy przypisanej do kierunku...</option><option v-for="sub in studentSpecificSubjects" :key="sub" :value="sub">{{ sub }}</option></select><select v-model="tempActionData.grade" class="form-select bg-panel text-white border-secondary" style="width: 150px;"><option value="5.0">5.0 (Bdb)</option><option value="4.5">4.5 (Bdb-)</option><option value="4.0">4.0 (Db)</option><option value="3.5">3.5 (Dst+)</option><option value="3.0">3.0 (Dst)</option><option value="2.0">2.0 (Ndst)</option></select><button @click="submitGrade" class="btn btn-warning fw-bold text-dark px-4" :disabled="!tempActionData.subject">Zapisz do Chmury</button><button @click="actionStudent = null" class="btn btn-outline-secondary">Anuluj</button></div></div></div>
            </div>
            
            <div v-if="activeTabAdmin === 'wnioski'">
              <h3 class="fw-bold text-white border-bottom border-secondary pb-3 mb-4">Wnioski studenckie (Zarządzanie Chmurą)</h3>
              <div class="list-group">
                <div v-for="(req, index) in sharedRequests" :key="req.id || index" class="list-group-item bg-panel border-secondary mb-3 rounded shadow-sm p-4"><div class="d-flex justify-content-between align-items-start mb-3"><div><span v-if="req.status === 'Nowy'" class="badge bg-danger mb-2 px-2 py-1">NOWY WNIOSEK</span><span v-if="req.status === 'Zatwierdzony'" class="badge bg-success mb-2 px-2 py-1">ZATWIERDZONY</span><span v-if="req.status === 'Odrzucony'" class="badge bg-secondary mb-2 px-2 py-1">ODRZUCONY</span><h4 class="fw-bold text-info mb-1">{{ req.type }}</h4><small class="text-white-50">Złożony przez: <span class="text-white">{{ req.student }} ({{ req.studentId }})</span> | Data: {{ req.date }}</small></div><div v-if="req.status === 'Nowy'" class="d-flex gap-2"><button @click="resolveRequest(req.id, 'Zatwierdzony')" class="btn btn-success fw-bold px-4">Zatwierdź</button><button @click="resolveRequest(req.id, 'Odrzucony')" class="btn btn-outline-danger fw-bold px-4">Odrzuć</button></div></div><div class="bg-dark p-3 rounded border border-secondary mt-2"><h6 class="text-white-50 mb-2 font-monospace text-uppercase" style="font-size: 0.8em;">Uzasadnienie studenta:</h6><p class="text-white mb-2">{{ req.description || 'Brak uzasadnienia.' }}</p><div v-if="req.attachment" class="mt-3 pt-3 border-top border-secondary d-flex align-items-center"><span class="text-white-50 me-3" style="font-size: 0.9em;">Załączony dokument:</span><span class="badge bg-secondary text-light py-2 px-3 border border-secondary d-flex align-items-center"><span class="fs-6 me-2">📎</span> {{ req.attachment }}</span><button @click="downloadAttachment(req.attachment)" class="btn btn-sm btn-outline-light rounded-pill px-3 ms-3">Pobierz plik</button></div></div></div>
                <div v-if="sharedRequests.length === 0" class="text-center py-5 text-white-50">Brak oczekujących wniosków w chmurze.</div>
              </div>
            </div>

            <div v-if="activeTabAdmin === 'plany'">
              <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
                <h3 class="fw-bold text-white mb-0">Zarządzanie Planem Zajęć</h3>
                <div class="d-flex align-items-center"><span class="text-white-50 me-3">Wybierz kierunek:</span><select v-model="adminSelectedMajor" class="form-select bg-dark text-white border-info w-auto fw-bold"><option value="Informatyka">Informatyka</option><option value="Ekonomia">Ekonomia</option><option value="Pielęgniarstwo">Pielęgniarstwo</option></select></div>
              </div>
              <div class="card bg-panel mb-4 shadow-sm border-0">
                <div class="card-body">
                  <h6 class="text-info mb-3">Dodaj nowe zajęcia do siatki: <span class="text-white">{{ adminSelectedMajor }}</span></h6>
                  <div class="row g-2">
                    <div class="col-md-2">
                      <select v-model="newLesson.day" class="form-select bg-dark text-white border-secondary">
                        <option disabled value="">Dzień</option><option v-for="d in daysOfWeek" :key="d" :value="d">{{d}}</option>
                      </select>
                    </div>
                    <div class="col-md-2"><input v-model="newLesson.time" type="text" class="form-control bg-dark text-white border-secondary" placeholder="Godz. (np. 08:00 - 09:30)"></div>
                    <div class="col-md-4"><input list="subjects-list" v-model="newLesson.subject" type="text" class="form-control bg-dark text-white border-secondary" placeholder="Wybierz z listy lub wpisz nowy..."><datalist id="subjects-list"><option v-for="sub in availableSubjectsList" :key="sub" :value="sub"></option></datalist></div>
                    <div class="col-md-2"><input v-model="newLesson.room" type="text" class="form-control bg-dark text-white border-secondary" placeholder="Sala"></div>
                    <div class="col-md-2"><button @click="addLesson" class="btn btn-info w-100 fw-bold text-dark" :disabled="!newLesson.subject || !newLesson.day">Wstaw</button></div>
                  </div>
                </div>
              </div>
              <div class="card bg-panel shadow-sm border-0">
                <div class="card-body p-0">
                  <table class="table table-dark table-hover align-middle mb-0 custom-table">
                    <thead><tr><th class="ps-4 text-white-50">Godziny</th><th class="text-white-50">Przedmiot</th><th class="text-white-50">Sala</th><th class="text-end pe-4 text-white-50">Akcja</th></tr></thead>
                    <tbody>
                      <template v-for="day in daysOfWeek" :key="day">
                        <tr v-if="getLessonsByDay(sharedSchedules[adminSelectedMajor], day).length > 0"><td colspan="4" class="bg-dark text-info fw-bold text-center py-2">{{ day }}</td></tr>
                        <tr v-for="(lesson, idx) in getLessonsByDay(sharedSchedules[adminSelectedMajor], day)" :key="idx + day">
                          <td class="ps-4">{{ lesson.time }}</td><td class="text-white">{{ lesson.subject }}</td><td>{{ lesson.room }}</td>
                          <td class="text-end pe-4"><button @click="removeLesson(adminSelectedMajor, lesson)" class="btn btn-sm btn-outline-danger">Usuń</button></td>
                        </tr>
                      </template>
                      <tr v-if="!sharedSchedules[adminSelectedMajor] || sharedSchedules[adminSelectedMajor].length === 0"><td colspan="4" class="text-center py-4 text-white-50">Brak wprowadzonych zajęć.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div v-if="activeTabAdmin === 'ogloszenia'">
              <h3 class="fw-bold text-white border-bottom border-secondary pb-3 mb-4">Publikacja Ogłoszeń (Baza Supabase)</h3>
              <div class="card bg-panel border-0 mb-4 shadow-sm"><div class="card-body"><input v-model="newNews.title" type="text" class="form-control bg-dark text-white mb-3 border-secondary" placeholder="Tytuł ogłoszenia"><textarea v-model="newNews.desc" class="form-control bg-dark text-white mb-3 border-secondary" rows="3" placeholder="Treść ogłoszenia..."></textarea><button @click="postNews" class="btn btn-primary fw-bold px-4 text-dark">Opublikuj na tablicy</button></div></div>
              <ul class="list-group"><li v-for="news in sharedNews" :key="news.id" class="list-group-item bg-dark text-white border-secondary py-3"><strong class="text-info">{{ news.date }}</strong> - <strong class="fs-5">{{ news.title }}</strong><br><span class="text-white-50 d-block mt-2">{{ news.desc }}</span><button @click="deleteNews(news.id)" class="btn btn-sm btn-danger mt-3 opacity-75">Usuń</button></li></ul>
            </div>
          </div>

          <div v-if="user.role === 'student'">
            
            <div v-if="activeTab === 'mlegitymacja'" class="d-flex justify-content-center pt-3">
              <div class="m-legitymacja-card rounded-4 p-4 text-white shadow-lg position-relative overflow-hidden" style="width: 380px; min-height: 600px;">
                <div class="position-absolute top-0 start-0 w-100" style="height: 6px; background: linear-gradient(90deg, white 50%, #dc143c 50%);"></div>
                <div class="text-center border-bottom border-secondary pb-3 mb-4"><h4 class="fw-bold mb-0">mLegitymacja</h4><small class="text-white-50">Akademia Bialska im. Jana Pawła II</small></div>
                <div class="d-flex align-items-center mb-4 bg-dark bg-opacity-50 p-3 rounded-3"><div class="avatar bg-secondary rounded-circle d-flex justify-content-center align-items-center fs-1 border border-2 border-white me-3" style="width: 80px; height: 80px;">👤</div><div><h5 class="fw-bold mb-0">{{ user.name }}</h5><div class="text-info font-monospace mt-1">Album: {{ user.nrAlbumu }}</div></div></div>
                <div class="bg-white rounded-4 p-3 text-center mb-4 position-relative hologram-container"><div class="hologram-line"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="160" height="160" class="mx-auto d-block opacity-75"><rect width="100" height="100" fill="#ffffff"/><path d="M10 10h25v25H10zM15 15h15v15H15zM65 10h25v25H65zM70 15h15v15H70zM10 65h25v25H10zM15 70h15v15H15zM45 10h10v10H45zM45 80h10v10H45zM80 45h10v10H80zM10 45h10v10H10zM25 45h20v20H25zM60 45h10v10H60zM45 25h10v10H45zM45 60h10v10H45zM80 80h10v10H80z" fill="#121212"/><circle cx="50" cy="50" r="10" fill="#1976D2" opacity="0.8"/></svg>
                  <small class="text-muted d-block mt-2 fw-bold">Czas: <span class="text-success">{{ currentTime }}</span></small>
                </div>
                <div class="bg-dark bg-opacity-50 p-3 rounded-3 mb-4"><div class="d-flex justify-content-between mb-2"><span class="text-white-50">Status:</span><span class="text-success fw-bold">Ważna ✅</span></div><div class="d-flex justify-content-between mb-2"><span class="text-white-50">Wydana:</span><span>01.10.2025</span></div><div class="d-flex justify-content-between"><span class="text-white-50">Ważna do:</span><span class="fw-bold">31.03.2027</span></div></div>
                <button class="btn btn-outline-light w-100 rounded-pill">Odśwież certyfikat</button>
              </div>
            </div>

            <div v-if="activeTab === 'pulpit'">
              <div class="row g-4 mb-5">
                <div class="col-md-4"><div @click="activeTab = 'oceny'" class="card bg-panel border-0 shadow-sm h-100 p-4 hover-card cursor-pointer"><h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">Moje Oceny</h5><div class="d-flex justify-content-between align-items-center"><span class="text-white-50">Najnowsza ocena:</span><h3 class="text-success fw-bold mb-0">{{ myGrades.length > 0 ? myGrades[myGrades.length-1].grade : '-' }}</h3></div></div></div>
                <div class="col-md-4"><div @click="activeTab = 'plan'" class="card bg-panel border-0 shadow-sm h-100 p-4 hover-card cursor-pointer"><h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">Najbliższe zajęcia</h5><span class="text-info fw-bold d-block">{{ mySchedule.length > 0 ? mySchedule[0].subject : 'Brak zajęć' }}</span><small class="text-white-50">{{ mySchedule.length > 0 ? mySchedule[0].day + ' | Sala: ' + mySchedule[0].room : 'Masz wolne!' }}</small></div></div>
                <div class="col-md-4"><div @click="activeTab = 'platnosci'" class="card bg-panel border-0 shadow-sm h-100 p-4 hover-card cursor-pointer" :class="unpaidCount > 0 ? 'border-start border-4 border-danger' : 'border-start border-4 border-success'"><h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">Stan Finansów</h5><div v-if="unpaidCount > 0"><span class="text-danger fw-bold d-block mb-1">Masz nieopłacone należności!</span><small class="text-white-50">Zaległe pozycje: {{ unpaidCount }}</small></div><div v-else><span class="text-success fw-bold d-block mb-1">Wszystko opłacone</span><small class="text-white-50">Brak zaległości finansowych</small></div></div></div>
              </div>
              <div v-if="myNotifications.length > 0" class="alert bg-dark border-warning text-warning shadow-sm mb-5"><h6 class="fw-bold mb-2">🔔 Masz nowe powiadomienia:</h6><ul class="mb-0 ps-3"><li v-for="(n, idx) in myNotifications" :key="idx">{{ n.msg }}</li></ul></div>
              <h5 class="fw-bold mb-3 text-white">Aktualności Uczelniane</h5>
              <div class="d-flex flex-column gap-3"><div v-for="news in sharedNews" :key="news.id" class="card bg-panel border-0 shadow-sm"><div class="card-body d-flex"><div class="text-info fw-bold me-4 fs-5">{{ news.date }}</div><div><h6 class="fw-bold text-white mb-1">{{ news.title }}</h6><small class="text-white-50">{{ news.desc }}</small></div></div></div></div>
            </div>

            <div v-if="activeTab === 'platnosci'">
              <div class="d-flex justify-content-between align-items-end border-bottom border-secondary pb-3 mb-4"><h3 class="fw-bold text-white mb-0">Twoje Rozliczenia Finansowe</h3><h5 class="mb-0 text-white-50">Do zapłaty łącznie: <span class="text-danger fw-bold">{{ totalUnpaid.toFixed(2) }} PLN</span></h5></div>
              <div class="card bg-panel shadow-sm border-0"><div class="card-body p-0"><table class="table table-dark table-hover align-middle mb-0 custom-table"><thead><tr><th class="ps-4 text-white-50">Tytuł płatności</th><th class="text-center text-white-50">Kwota</th><th class="text-center text-white-50">Status</th><th class="text-end pe-4 text-white-50">Akcja</th></tr></thead><tbody><tr v-for="payment in myPayments" :key="payment.id"><td class="ps-4 fw-bold text-white">{{ payment.title }}</td><td class="text-center text-white">{{ payment.amount.toFixed(2) }} PLN</td><td class="text-center"><span class="badge rounded-pill px-3 py-2" :class="payment.status === 'Opłacone' ? 'border border-success text-success bg-transparent' : 'bg-danger text-white'">{{ payment.status }}</span></td><td class="text-end pe-4"><button v-if="payment.status !== 'Opłacone'" @click="openPaymentGateway(payment)" class="btn btn-sm btn-info fw-bold text-dark px-4">Opłać</button><button v-else class="btn btn-sm btn-outline-secondary px-3" disabled>Pobierz fakturę</button></td></tr><tr v-if="myPayments.length === 0"><td colspan="4" class="text-center py-4 text-white-50">Nie masz żadnych naliczonych płatności.</td></tr></tbody></table></div></div>
            </div>

            <div v-if="activeTab === 'plan'">
              <h4 class="fw-bold mb-3 text-white">Plan zajęć ({{ user.kierunek || 'Brak kierunku' }})</h4>
              <div class="card bg-panel shadow-sm border-0">
                <table class="table table-dark align-middle mb-0 custom-table">
                  <thead><tr><th class="ps-4 text-white-50">Godziny</th><th class="text-white-50">Przedmiot</th><th class="text-white-50">Sala</th></tr></thead>
                  <tbody>
                    <template v-for="day in daysOfWeek" :key="day">
                      <tr v-if="getLessonsByDay(mySchedule, day).length > 0"><td colspan="3" class="bg-dark text-info fw-bold text-center py-2">{{ day }}</td></tr>
                      <tr v-for="(lesson, index) in getLessonsByDay(mySchedule, day)" :key="index + day">
                        <td class="ps-4">{{ lesson.time }}</td><td class="text-white fw-semibold">{{ lesson.subject }}</td><td>{{ lesson.room }}</td>
                      </tr>
                    </template>
                    <tr v-if="mySchedule.length === 0"><td colspan="3" class="text-center py-4 text-white-50">Twój kierunek nie ma jeszcze wprowadzonych zajęć w systemie.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-if="activeTab === 'oceny'">
              <h4 class="fw-bold mb-3 text-white">Twoje zestawienie ocen (Dane z Chmury)</h4>
              <div class="card bg-panel shadow-sm border-0"><table class="table table-dark align-middle mb-0 custom-table"><thead><tr><th class="ps-4 text-white-50">Przedmiot</th><th class="text-white-50">Data wpisu</th><th class="text-end pe-4 text-white-50">Ocena</th></tr></thead><tbody><tr v-for="(grade, index) in myGrades" :key="index"><td class="ps-4 text-white">{{ grade.subject }}</td><td class="text-white-50">{{ grade.date }}</td><td class="text-end pe-4 fw-bold text-success">{{ grade.grade }}</td></tr><tr v-if="myGrades.length === 0"><td colspan="3" class="text-center py-4 text-white-50">Nie masz jeszcze żadnych wpisanych ocen w systemie.</td></tr></tbody></table></div>
            </div>

            <div v-if="activeTab === 'obecnosc'">
              <h4 class="fw-bold mb-3 text-white">Twoja Frekwencja na zajęciach (Dane z Chmury)</h4>
              <div class="card bg-panel shadow-sm border-0"><table class="table table-dark align-middle mb-0 custom-table"><thead><tr><th class="ps-4 text-white-50">Data zajęć</th><th class="text-white-50">Przedmiot</th><th class="text-end pe-4 text-white-50">Status</th></tr></thead><tbody><tr v-for="(att, index) in myAttendance" :key="index"><td class="ps-4 text-white-50">{{ att.date }}</td><td class="text-white fw-bold">{{ att.subject }}</td><td class="text-end pe-4"><span class="badge px-3 py-2" :class="att.status === 'Obecny' ? 'bg-success' : (att.status === 'Nieobecny' ? 'bg-danger' : 'bg-warning text-dark')">{{ att.status }}</span></td></tr><tr v-if="myAttendance.length === 0"><td colspan="3" class="text-center py-4 text-white-50">Brak zarejestrowanych wpisów frekwencji w tym semestrze.</td></tr></tbody></table></div>
            </div>

            <div v-if="activeTab === 'dokumenty'">
              <h4 class="fw-bold mb-3 text-white">E-Teczka i Wnioski</h4>
              <div class="card bg-dark border-info border-2 mb-4 p-4 shadow-sm rounded-4"><h5 class="text-info fw-bold mb-4">Złóż nowy wniosek do Dziekanatu (Dane z Chmury)</h5><div class="row g-3"><div class="col-md-6"><label class="form-label text-white-50 small text-uppercase">Wybierz typ wniosku *</label><select v-model="newDocType" class="form-select bg-panel text-white border-secondary"><option disabled value="">Wybierz formularz z listy...</option><option value="Wniosek o stypendium rektora">Wniosek o Stypendium Rektora</option><option value="Wniosek o stypendium socjalne">Wniosek o Stypendium Socjalne</option><option value="Wniosek o wpis warunkowy">Wniosek o wpis warunkowy na kolejny semestr</option><option value="Wniosek o urlop dziekański">Wniosek o urlop dziekański</option></select></div><div class="col-md-6"><label class="form-label text-white-50 small text-uppercase">Załączniki (pdf, jpg, png)</label><input type="file" ref="fileInputRef" @change="handleFileUpload" class="form-control bg-panel text-white-50 border-secondary"></div><div class="col-12"><label class="form-label text-white-50 small text-uppercase">Uzasadnienie / Dodatkowe dane *</label><textarea v-model="newDocDescription" class="form-control bg-panel text-white border-secondary" rows="3" placeholder="Opisz powód składania wniosku, podaj przedmioty warunkowe lub inne potrzebne informacje..."></textarea></div><div class="col-12 text-end mt-4 border-top border-secondary pt-3"><button @click="submitDocument" class="btn btn-success fw-bold px-5 text-dark" :disabled="!newDocType || !newDocDescription">Wyślij wniosek</button></div></div></div>
              <h5 class="fw-bold mb-3 text-white mt-5">Historia Twoich wniosków</h5>
              <ul class="list-group shadow-sm"><li v-for="req in myRequests" :key="req.id" class="list-group-item bg-panel text-light py-4 border-secondary flex-column align-items-start"><div class="d-flex justify-content-between align-items-center w-100 mb-2"><span><strong class="text-white fs-5">{{ req.type }}</strong><span class="text-white-50 ms-3">{{ req.date }}</span></span><span class="badge px-3 py-2 fs-6" :class="req.status === 'Nowy' ? 'bg-warning text-dark' : (req.status === 'Zatwierdzony' ? 'bg-success' : 'bg-secondary')">{{ req.status }}</span></div><div class="text-white-50 mt-3 bg-dark p-3 rounded"><strong>Treść wniosku:</strong> {{ req.description }}<span v-if="req.attachment" class="d-block mt-2 badge bg-secondary px-2 py-1 fs-6">📎 Załącznik: {{ req.attachment }}</span></div></li><li v-if="myRequests.length === 0" class="list-group-item bg-panel text-white-50 text-center py-4 border-secondary">Nie składałeś jeszcze żadnych wniosków.</li></ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-darker px-4 py-3 border-top border-secondary d-flex align-items-center position-relative">
        <span class="text-white-50 me-3">Wielkość czcionki:</span>
        <input type="range" class="form-range" min="12" max="22" step="1" v-model="globalFontSize" style="width: 200px;">
      </div>

      <div v-if="user && user.role === 'student'" class="chatbot-container position-fixed bottom-0 end-0 m-4" style="z-index: 2000;">
        <button v-if="!isChatOpen" @click="isChatOpen = true" class="btn btn-primary rounded-circle shadow-lg d-flex justify-content-center align-items-center" style="width: 60px; height: 60px; font-size: 24px;">💬</button>
        <div v-else class="card bg-panel border-secondary shadow-lg d-flex flex-column" style="width: 320px; height: 420px; border-radius: 15px; overflow: hidden;"><div class="bg-primary p-3 text-white d-flex justify-content-between align-items-center"><span class="fw-bold"><span class="me-2">🤖</span> Wirtualny Asystent</span><button @click="isChatOpen = false" class="btn btn-sm btn-primary border-0 fs-5 p-0">✖</button></div><div class="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-2 chat-box" style="background-color: #121316;"><div v-for="(msg, i) in chatMessages" :key="i" class="p-2 rounded-3" style="max-width: 85%; font-size: 0.9em;" :class="msg.sender === 'bot' ? 'bg-secondary text-white align-self-start' : 'bg-primary text-white align-self-end'">{{ msg.text }}</div><div v-if="isBotTyping" class="text-white-50 small fst-italic ps-2">Asystent pisze...</div></div><div class="p-2 bg-darker border-top border-secondary d-flex gap-2"><input v-model="chatInput" @keyup.enter="sendChatMessage" type="text" class="form-control bg-dark text-white border-secondary form-control-sm" placeholder="O co chcesz zapytać?"><button @click="sendChatMessage" class="btn btn-primary btn-sm px-3">→</button></div></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// ---------------------------------------------------------
// 1. SUPABASE IMPORT 
// ---------------------------------------------------------
import { supabase } from './supabase.js';

const globalFontSize = ref(15);
const user = ref(null);
const loginForm = ref({ username: '', password: '' });
const loginError = ref(false); 
const activeTab = ref('pulpit');
const activeTabAdmin = ref('statystyki');
const activeTabLecturer = ref('pulpit');
const flashMessage = ref('');
const isGoogleLoading = ref(false); 

const currentTime = ref('');
let timerInterval;

const isChatOpen = ref(false);
const chatInput = ref('');
const isBotTyping = ref(false);
const chatMessages = ref([{ sender: 'bot', text: 'Cześć! Jestem Twoim wirtualnym asystentem. Spróbuj zapytać o płatności, stypendia lub plan zajęć.' }]);
const sendChatMessage = () => { if (!chatInput.value.trim()) return; const userText = chatInput.value; chatMessages.value.push({ sender: 'user', text: userText }); chatInput.value = ''; isBotTyping.value = true; setTimeout(() => { isBotTyping.value = false; let reply = "Więcej informacji znajdziesz na stronie głównej Uczelni lub w Dziekanacie."; const lower = userText.toLowerCase(); if (lower.includes('stypend') || lower.includes('wniosek')) reply = "Wnioski o stypendium złożysz w zakładce 'e-Wnioski'. Pamiętaj o uzasadnieniu!"; else if (lower.includes('płatnoś') || lower.includes('zapła') || lower.includes('blik')) reply = "Wszelkie opłaty uregulujesz w zakładce 'Płatności' za pomocą BLIK lub Apple Pay."; else if (lower.includes('legitymacj')) reply = "Twoja cyfrowa mLegitymacja dostępna jest w nowej zakładce w menu po lewej stronie."; else if (lower.includes('plan')) reply = "Twój plan zajęć znajduje się w zakładce 'Mój Plan'."; chatMessages.value.push({ sender: 'bot', text: reply }); }, 1000); };

// =========================================================================
// REAL-TIME SUPABASE (CHMURA)
// =========================================================================

const students = ref([]);
const sharedGrades = ref([]);
const sharedAttendance = ref([]);
const sharedRequests = ref([]); 
const sharedNews = ref([]); // Przeniesiono ogłoszenia do chmury!

// Pobieranie początkowe z bazy online
const fetchData = async () => {
  const { data: st } = await supabase.from('students').select('*');
  if (st) students.value = st;

  const { data: gr } = await supabase.from('grades').select('*');
  if (gr) sharedGrades.value = gr;

  const { data: att } = await supabase.from('attendance').select('*');
  if (att) sharedAttendance.value = att;
  
  const { data: req } = await supabase.from('requests').select('*').order('id', { ascending: false });
  if (req) sharedRequests.value = req;
  
  // POBIERANIE OGŁOSZEŃ Z SUPABASE
  const { data: nw } = await supabase.from('news').select('*').order('id', { ascending: false });
  if (nw) sharedNews.value = nw;
};

// Nasłuchiwanie na zmiany u innych użytkowników (Multiplayer)
const subscribeRealtime = () => {
  supabase.channel('public-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, fetchData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, fetchData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, fetchData)
    .subscribe();
};

onMounted(() => { 
  timerInterval = setInterval(() => { currentTime.value = new Date().toLocaleTimeString('pl-PL'); }, 1000); 
  fetchData();
  subscribeRealtime();
});

onUnmounted(() => { clearInterval(timerInterval); });

// =========================================================================
// LOKALNA PAMIĘĆ (Płatności i plany - nie są jeszcze w chmurze!)
// =========================================================================

const baseLecturers = [
  { id: 1, name: 'Dr inż. Adam Nowak', login: 'anowak', password: '123', subjects: ['Inżynieria Oprogramowania', 'Bazy Danych SQL', 'Algorytmy i Struktury Danych'] },
  { id: 2, name: 'Prof. Maria Wiśniewska', login: 'mwisniewska', password: '123', subjects: ['Mikroekonomia', 'Rachunkowość Zarządcza', 'Finanse Przedsiębiorstw', 'Statystyka'] },
  { id: 3, name: 'Mgr Ewa Kowalczyk', login: 'ekowalczyk', password: '123', subjects: ['Anatomia Prawidłowa', 'Fizjologia'] },
  { id: 4, name: 'Dr Tomasz Wójcik', login: 'twojcik', password: '123', subjects: ['Matematyka Dyskretna', 'Programowanie Obiektowe'] },
  { id: 5, name: 'Mgr Anna Dąbrowska', login: 'adabrowska', password: '123', subjects: ['Podstawy Pielęgniarstwa', 'Praktyki Szpitalne', 'Farmakologia'] },
  { id: 6, name: 'Mec. Piotr Lewandowski', login: 'plewandowski', password: '123', subjects: ['Prawo Gospodarcze', 'BHP'] }
];
const lecturers = ref(JSON.parse(localStorage.getItem('coojons_lecturers')) || baseLecturers);
watch(lecturers, (val) => localStorage.setItem('coojons_lecturers', JSON.stringify(val)), { deep: true });

const baseSchedules = {
  'Informatyka': [
    { day: 'Poniedziałek', time: '08:00 - 09:30', subject: 'Inżynieria Oprogramowania', room: 'Aula B' }, 
    { day: 'Poniedziałek', time: '10:00 - 11:30', subject: 'Architektura Komputerów', room: 'Lab 102' },
    { day: 'Wtorek', time: '10:00 - 11:30', subject: 'Algorytmy i Struktury Danych', room: 'Sala 201' },
    { day: 'Wtorek', time: '12:00 - 13:30', subject: 'Matematyka Dyskretna', room: 'Aula B' },
    { day: 'Środa', time: '08:00 - 09:30', subject: 'Programowanie Obiektowe', room: 'Lab 105' },
    { day: 'Środa', time: '10:00 - 11:30', subject: 'Bazy Danych SQL', room: 'Lab 102' },
    { day: 'Czwartek', time: '14:00 - 15:30', subject: 'Język Angielski', room: 'Sala Językowa 3' },
    { day: 'Piątek', time: '10:00 - 11:30', subject: 'Wychowanie Fizyczne', room: 'Hala Sportowa' }
  ],
  'Ekonomia': [
    { day: 'Poniedziałek', time: '09:45 - 11:15', subject: 'Finanse Przedsiębiorstw', room: 'Aula C' }, 
    { day: 'Poniedziałek', time: '12:00 - 13:30', subject: 'Prawo Gospodarcze', room: 'Sala 110' },
    { day: 'Wtorek', time: '09:45 - 11:15', subject: 'Mikroekonomia', room: 'Sala 204' }, 
    { day: 'Środa', time: '08:00 - 09:30', subject: 'Statystyka', room: 'Sala 310' },
    { day: 'Czwartek', time: '12:00 - 13:30', subject: 'Rachunkowość Zarządcza', room: 'Sala 301' },
    { day: 'Piątek', time: '10:00 - 11:30', subject: 'Wychowanie Fizyczne', room: 'Hala Sportowa' }
  ],
  'Pielęgniarstwo': [
    { day: 'Poniedziałek', time: '07:30 - 10:30', subject: 'Anatomia Prawidłowa', room: 'Sala 110' }, 
    { day: 'Wtorek', time: '08:00 - 11:00', subject: 'Fizjologia', room: 'Sala 112' },
    { day: 'Środa', time: '12:00 - 14:00', subject: 'Podstawy Pielęgniarstwa', room: 'Pracownia 1' },
    { day: 'Czwartek', time: '09:00 - 11:00', subject: 'Farmakologia', room: 'Sala 205' },
    { day: 'Czwartek', time: '12:00 - 13:30', subject: 'Język Angielski', room: 'Sala Językowa 2' },
    { day: 'Piątek', time: '08:00 - 12:00', subject: 'Praktyki Szpitalne', room: 'Szpital Wojewódzki' }
  ]
};
const sharedSchedules = ref(JSON.parse(localStorage.getItem('coojons_schedules')) || baseSchedules);
watch(sharedSchedules, (val) => localStorage.setItem('coojons_schedules', JSON.stringify(val)), { deep: true });

const basePayments = [{ id: 1, studentId: '84932', title: 'Opłata za warunkowy wpis na semestr', amount: 800.00, status: 'Do zapłaty' }, { id: 2, studentId: '84932', title: 'Wydanie duplikatu legitymacji', amount: 33.00, status: 'Do zapłaty' }, { id: 3, studentId: '84933', title: 'Opłata rekrutacyjna', amount: 85.00, status: 'Do zapłaty' }, { id: 4, studentId: '84934', title: 'Opłata rekrutacyjna', amount: 85.00, status: 'Opłacone' }];
const sharedPayments = ref(JSON.parse(localStorage.getItem('coojons_payments')) || basePayments);
watch(sharedPayments, (val) => localStorage.setItem('coojons_payments', JSON.stringify(val)), { deep: true });

const baseNotifications = [{ studentId: '84932', msg: 'Zwróć książki do biblioteki przed końcem maja.' }];
const sharedNotifications = ref(JSON.parse(localStorage.getItem('coojons_notifications')) || baseNotifications);
watch(sharedNotifications, (val) => localStorage.setItem('coojons_notifications', JSON.stringify(val)), { deep: true });

// =========================================================================

const daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];
const getLessonsByDay = (schedule, day) => { if(!schedule) return []; return schedule.filter(l => l.day === day).sort((a,b) => a.time.localeCompare(b.time)); };

const availableSubjectsList = computed(() => { const subs = new Set(['Język Angielski', 'BHP', 'Wychowanie Fizyczne']); Object.values(sharedSchedules.value).forEach(schedule => { schedule.forEach(lesson => subs.add(lesson.subject)); }); return Array.from(subs).sort(); });

const adminSelectedMajor = ref('Informatyka'); 
const newLesson = ref({ day: '', time: '', subject: '', room: '' });
const addLesson = () => { if(newLesson.value.subject && newLesson.value.day){ if (!sharedSchedules.value[adminSelectedMajor.value]) { sharedSchedules.value[adminSelectedMajor.value] = []; } sharedSchedules.value[adminSelectedMajor.value].push({...newLesson.value}); newLesson.value = { day: '', time: '', subject: '', room: '' }; showFlash(`Zajęcia dodane do planu: ${adminSelectedMajor.value}!`); } };
const removeLesson = (major, lesson) => { sharedSchedules.value[major] = sharedSchedules.value[major].filter(l => l !== lesson); };

const myPayments = computed(() => sharedPayments.value.filter(p => String(p.studentId) === String(user.value?.nrAlbumu)));
const myGrades = computed(() => sharedGrades.value.filter(g => String(g.studentId) === String(user.value?.nrAlbumu)));
const myRequests = computed(() => sharedRequests.value.filter(r => String(r.studentId) === String(user.value?.nrAlbumu)));
const myNotifications = computed(() => sharedNotifications.value.filter(n => String(n.studentId) === String(user.value?.nrAlbumu)));
const mySchedule = computed(() => { if (user.value && user.value.kierunek) { return sharedSchedules.value[user.value.kierunek] || []; } return []; });
const myAttendance = computed(() => sharedAttendance.value.filter(a => String(a.studentId) === String(user.value?.nrAlbumu)).sort((a,b) => new Date(b.date) - new Date(a.date)));

const unpaidCount = computed(() => myPayments.value.filter(p => p.status === 'Do zapłaty').length);
const totalUnpaid = computed(() => myPayments.value.filter(p => p.status === 'Do zapłaty').reduce((sum, p) => sum + p.amount, 0));

const totalUnpaidAdmin = computed(() => sharedPayments.value.filter(p => p.status === 'Do zapłaty').reduce((sum, p) => sum + p.amount, 0));
const newRequestsCount = computed(() => sharedRequests.value.filter(r => r.status === 'Nowy').length);
const financePaidPercent = computed(() => { const total = sharedPayments.value.length; if (total === 0) return 100; const paid = sharedPayments.value.filter(p => p.status === 'Opłacone').length; return Math.round((paid / total) * 100); });
const financeUnpaidPercent = computed(() => 100 - financePaidPercent.value);
const facultyGrades = computed(() => { const subjects = {}; sharedGrades.value.forEach(g => { if(!subjects[g.subject]) subjects[g.subject] = { sum: 0, count: 0 }; subjects[g.subject].sum += parseFloat(g.grade); subjects[g.subject].count += 1; }); return Object.keys(subjects).map(sub => { const avg = (subjects[sub].sum / subjects[sub].count).toFixed(2); const percent = (avg / 5.0) * 100; return { subject: sub, avg, percent }; }).sort((a,b) => b.avg - a.avg).slice(0, 4); });

const activePayment = ref(null); const paymentMethod = ref('blik'); const blikCode = ref(''); const isProcessing = ref(false); const paymentSuccess = ref(false);
const openPaymentGateway = (p) => { activePayment.value = p; paymentMethod.value = 'blik'; blikCode.value = ''; paymentSuccess.value = false; };
const processPayment = () => { isProcessing.value = true; setTimeout(() => { isProcessing.value = false; paymentSuccess.value = true; const p = sharedPayments.value.find(x => x.id === activePayment.value.id); if(p) p.status = 'Opłacone'; }, 2000); };
const closePayment = () => { activePayment.value = null; paymentSuccess.value = false; showFlash('Płatność zaksięgowana!'); };

const newDocType = ref(''); const newDocDescription = ref(''); const newDocAttachment = ref(null); const fileInputRef = ref(null);
const handleFileUpload = (event) => { const file = event.target.files[0]; if (file) { newDocAttachment.value = file.name; } else { newDocAttachment.value = null; } };

const submitDocument = async () => { 
  if (!newDocType.value || !newDocDescription.value) return; 
  const newReq = { studentId: user.value.nrAlbumu, student: user.value.name, type: newDocType.value, description: newDocDescription.value, attachment: newDocAttachment.value || 'Brak', date: new Date().toLocaleDateString('pl-PL'), status: 'Nowy' }; 
  const { error } = await supabase.from('requests').insert([newReq]);
  if (!error) { await fetchData(); showFlash('Wniosek został przekazany do Dziekanatu.'); newDocType.value = ''; newDocDescription.value = ''; newDocAttachment.value = null; if(fileInputRef.value) fileInputRef.value.value = ''; }
};

const downloadAttachment = (fileName) => { const content = `Symulacja pobranego załącznika: ${fileName}\n\n(Plik demonstracyjny systemu COOJONS)`; const blob = new Blob([content], { type: 'text/plain' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); showFlash(`Rozpoczęto pobieranie pliku: ${fileName}`); };

const isEditing = ref(false); const currentStudent = ref({ imie: '', nazwisko: '', nrAlbumu: '', login: '', password: '', kierunek: 'Informatyka' }); const actionStudent = ref(null); const tempActionData = ref({ subject: '', grade: '5.0' });
const studentSpecificSubjects = computed(() => { const subs = new Set(['Język Angielski', 'BHP']); if (actionStudent.value?.kierunek && sharedSchedules.value[actionStudent.value.kierunek]) { sharedSchedules.value[actionStudent.value.kierunek].forEach(l => subs.add(l.subject)); } return Array.from(subs).sort(); });
const openGradeModal = (st) => { actionStudent.value = st; };

const submitGrade = async () => { 
  if(tempActionData.value.subject){ 
    const newGrade = { studentId: actionStudent.value.nrAlbumu, subject: tempActionData.value.subject, grade: tempActionData.value.grade, date: new Date().toLocaleDateString('pl-PL') };
    const { error } = await supabase.from('grades').insert([newGrade]);
    if(!error) { await fetchData(); showFlash(`Oceniono studenta w chmurze: ${actionStudent.value.imie}!`); actionStudent.value = null; tempActionData.value.subject = ''; }
  } 
};
const openMsgModal = (st) => { const msg = prompt(`Wiadomość dla: ${st.imie} ${st.nazwisko}`); if(msg) { sharedNotifications.value.push({ studentId: st.nrAlbumu, msg }); showFlash('Powiadomienie wysłane do studenta!'); } };

// --- NOWY KOD DLA OGŁOSZEŃ (W CHMURZE) ---
const newNews = ref({ title: '', desc: '' }); 
const postNews = async () => { 
  if(newNews.value.title){ 
    const n = { title: newNews.value.title, desc: newNews.value.desc, date: new Date().toLocaleDateString('pl-PL') };
    const { error } = await supabase.from('news').insert([n]);
    if(!error) {
      await fetchData();
      newNews.value = { title: '', desc: '' }; 
      showFlash('Ogłoszenie opublikowane w chmurze!'); 
    }
  } 
};
const deleteNews = async (id) => {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if(!error) {
    await fetchData();
    showFlash('Ogłoszenie usunięte z tablicy.');
  }
};
// ----------------------------------------

const resolveRequest = async (reqId, newStatus) => { 
  const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', reqId);
  if (!error) { await fetchData(); showFlash(`Status wniosku zmieniono na: ${newStatus}`); }
};
const showFlash = (msg) => { flashMessage.value = msg; setTimeout(() => flashMessage.value = '', 4000); };

const isEditingLecturer = ref(false);
const currentLecturer = ref({ imie: '', nazwisko: '', login: '', password: '', subjects: [] });
const saveLecturer = () => {
  if(!currentLecturer.value.login || currentLecturer.value.subjects.length === 0) { showFlash("Wypełnij login i przypisz przedmioty!"); return; }
  const newLec = { id: Date.now(), name: `${currentLecturer.value.imie} ${currentLecturer.value.nazwisko}`, login: currentLecturer.value.login, password: currentLecturer.value.password, subjects: [...currentLecturer.value.subjects] };
  lecturers.value.push(newLec); isEditingLecturer.value = false; showFlash(`Utworzono wykładowcę: ${newLec.name}`); currentLecturer.value = { imie: '', nazwisko: '', login: '', password: '', subjects: [] };
};
const deleteLecturer = (lec) => { if(confirm(`Usunąć wykładowcę ${lec.name}?`)) { lecturers.value = lecturers.value.filter(l => l.id !== lec.id); showFlash("Wykładowca usunięty."); } };

const selectedSubjectLecturer = ref('');
const attendanceDate = ref(new Date().toISOString().split('T')[0]);
const tempLecturerGrades = ref({});
const studentsForLecturerSubject = computed(() => {
  if (!selectedSubjectLecturer.value) return [];
  const validMajors = Object.keys(sharedSchedules.value).filter(major => sharedSchedules.value[major].some(lesson => lesson.subject === selectedSubjectLecturer.value));
  return students.value.filter(s => validMajors.includes(s.kierunek));
});

const saveLecturerGrade = async (student) => {
  const grade = tempLecturerGrades.value[student.nrAlbumu]; 
  if (!grade) { showFlash('Wybierz ocenę!'); return; }
  const newGrade = { studentId: student.nrAlbumu, subject: selectedSubjectLecturer.value, grade: grade, date: new Date().toLocaleDateString('pl-PL') };
  const { error } = await supabase.from('grades').insert([newGrade]);
  if(!error) { await fetchData(); showFlash(`Wystawiono ocenę w chmurze studentowi: ${student.imie} ${student.nazwisko}`); tempLecturerGrades.value[student.nrAlbumu] = null; }
};

const getAttendanceStatus = (studentId) => { const record = sharedAttendance.value.find(a => String(a.studentId) === String(studentId) && a.subject === selectedSubjectLecturer.value && a.date === attendanceDate.value); return record ? record.status : null; };

const markAttendance = async (studentId, status) => { 
  const record = sharedAttendance.value.find(a => String(a.studentId) === String(studentId) && a.subject === selectedSubjectLecturer.value && a.date === attendanceDate.value); 
  if (record) { await supabase.from('attendance').update({ status: status }).match({ studentId: studentId, subject: selectedSubjectLecturer.value, date: attendanceDate.value });
  } else { await supabase.from('attendance').insert([{ studentId, subject: selectedSubjectLecturer.value, date: attendanceDate.value, status }]); } 
  await fetchData(); showFlash(`Zapisano w chmurze: ${status}`); 
};

const handleLogin = async () => {
  loginError.value = false; 
  await fetchData(); 
  if (loginForm.value.username === 'admin' && loginForm.value.password === '123') { user.value = { role: 'dziekanat', login: 'admin', name: 'Pracownik Wydziału' }; activeTabAdmin.value = 'statystyki'; return; } 
  const foundLecturer = lecturers.value.find(l => l.login === loginForm.value.username && l.password === loginForm.value.password);
  if (foundLecturer) { user.value = { role: 'wykładowca', login: foundLecturer.login, name: foundLecturer.name, subjects: foundLecturer.subjects }; activeTabLecturer.value = 'pulpit'; return; }
  const foundStudent = students.value.find(s => s.login === loginForm.value.username && s.password === loginForm.value.password);
  if (foundStudent) { user.value = { role: 'student', login: foundStudent.login, nrAlbumu: foundStudent.nrAlbumu, name: `${foundStudent.imie} ${foundStudent.nazwisko}`, kierunek: foundStudent.kierunek }; activeTab.value = 'pulpit'; } else { loginError.value = true; }
};

const loginWithGoogle = () => { isGoogleLoading.value = true; setTimeout(() => { isGoogleLoading.value = false; user.value = { role: 'student', login: 'google_user', nrAlbumu: 'GoogleAuth', name: 'Student (Google ID)', googleAuth: true, kierunek: 'Informatyka' }; activeTab.value = 'pulpit'; showFlash('Zalogowano przez Google!'); }, 1500); };
const logout = () => { user.value = null; activePayment.value = null; loginForm.value.username = ''; loginForm.value.password = '';};

const saveStudent = async () => { 
  const studentToSave = { ...currentStudent.value, password: currentStudent.value.password || '123' }; 
  const { error } = await supabase.from('students').insert([studentToSave]);
  if(!error) { await fetchData(); isEditing.value = false; showFlash(`Utworzono konto w chmurze dla: ${currentStudent.value.login}`); currentStudent.value = { imie: '', nazwisko: '', nrAlbumu: '', login: '', password: '', kierunek: 'Informatyka' }; } else { showFlash("Błąd zapisu! Sprawdź tabelę Supabase."); }
};

const deleteStudent = async (student) => { 
  if(confirm(`Usunąć studenta ${student.imie}?`)) { await supabase.from('students').delete().eq('nrAlbumu', student.nrAlbumu); await fetchData(); showFlash("Skreślono z listy w chmurze."); } 
};
</script>

<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #17181c !important; }
.wrapper { background-color: #17181c; transition: font-size 0.2s; }
.bg-darker { background-color: #121316 !important; }
.bg-panel { background-color: #1e1f26 !important; }
.sidebar { border-right: 1px solid #2d2e36; }
.text-info { color: #8cb4ff !important; }
.text-white-50 { color: #b4b8c5 !important; } 

::placeholder { color: #b4b8c5 !important; opacity: 1 !important; }
::-webkit-input-placeholder { color: #b4b8c5 !important; opacity: 1 !important; }
:-ms-input-placeholder { color: #b4b8c5 !important; opacity: 1 !important; }

.nav-link { border-radius: 8px; transition: all 0.2s; }
.nav-link:hover { background-color: #2b2c36; }
.active-tab { background-color: #2b2c36 !important; border-left: 4px solid #8cb4ff; border-radius: 0 8px 8px 0; }

.custom-table th { border-bottom: 1px solid #2d2e36; font-size: 0.8em; }
.custom-table td { border-bottom: 1px solid #2d2e36; background-color: transparent !important;}
.hover-card:hover { transform: translateY(-3px); background-color: #2b2c36 !important; }
.cursor-pointer { cursor: pointer; }

.form-control, .form-select { background-color: #121316 !important; color: white !important; border: 1px solid #2d2e36 !important; }
.form-control:focus, .form-select:focus { border-color: #8cb4ff !important; box-shadow: 0 0 0 0.25rem rgba(140, 180, 255, 0.1); }

.payment-overlay { backdrop-filter: blur(5px); }
.letter-spacing-2 { letter-spacing: 0.5rem; }
.btn-light { background-color: #e4e6eb; border: none; }
.btn-light:hover, .google-btn:hover { background-color: #ffffff; }
.google-btn { border: 1px solid #dadce0; }

.m-legitymacja-card { background: linear-gradient(135deg, #102128 0%, #1c3b47 100%); border: 1px solid #204c59; }
.hologram-container { overflow: hidden; }
.hologram-line { position: absolute; top: -50%; left: 0; width: 100%; height: 20px; background: rgba(140, 180, 255, 0.4); box-shadow: 0 0 15px rgba(140, 180, 255, 0.6); animation: scan 3s infinite linear; }
@keyframes scan { 0% { top: -10%; } 50% { top: 110%; } 100% { top: -10%; } }

.css-pie-chart { width: 130px; height: 130px; border-radius: 50%; transition: background 0.5s ease; }

.chat-box::-webkit-scrollbar { width: 6px; }
.chat-box::-webkit-scrollbar-thumb { background: #2d2e36; border-radius: 3px; }
</style>