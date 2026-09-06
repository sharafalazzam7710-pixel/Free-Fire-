const KEYS = {
  teams: 'clashSquadTeamsV2',
  matches: 'clashSquadMatchesV2',
};

let teams = read(KEYS.teams);
let matches = read(KEYS.matches);
let loggedIn = false;

const $ = (id) => document.getElementById(id);
const toast = $('toast');
const modal = $('adminModal');
const loginView = $('loginView');
const dashboardView = $('dashboardView');

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(KEYS.teams, JSON.stringify(teams));
  localStorage.setItem(KEYS.matches, JSON.stringify(matches));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
}

function getTeam(id) {
  return teams.find((team) => team.id === id);
}

function formatDate(value) {
  if (!value) return 'بدون تاريخ';
  return new Intl.DateTimeFormat('ar-JO', { day: 'numeric', month: 'long' }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-JO', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${value}`));
}

function renderAll() {
  $('teamCount').textContent = teams.length;
  $('playerCount').textContent = teams.length * 2;
  $('matchCount').textContent = matches.length;
  renderPublicSchedule();
  renderNextMatch();
  renderAdminLists();
  populateTeamSelects();
}

function renderPublicSchedule() {
  const list = $('publicSchedule');
  if (!matches.length) {
    list.innerHTML = '<div class="empty-state">لا توجد مواجهات بعد. أضف أول مباراة من لوحة المشرفين.</div>';
    return;
  }
  list.innerHTML = matches
    .slice()
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .map((match, index) => {
      const first = getTeam(match.teamOneId);
      const second = getTeam(match.teamTwoId);
      return `<div class="schedule-row">
        <span class="round">${String(index + 1).padStart(2, '0')}</span>
        <div><b>${escapeHtml(first?.name || 'فريق محذوف')} <em>ضد</em> ${escapeHtml(second?.name || 'فريق محذوف')}</b>
        <small>${escapeHtml(match.round)} • خريطة ${escapeHtml(match.map)}</small></div>
        <strong>${escapeHtml(formatDate(match.date))}<br /><small>${escapeHtml(formatTime(match.time))}</small></strong>
      </div>`;
    }).join('');
}

function renderNextMatch() {
  const next = matches.slice().sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  if (!next) {
    $('nextRound').textContent = 'لم تُضف بعد';
    $('nextDate').textContent = 'التاريخ والوقت يظهران هنا';
    $('nextTime').textContent = '—';
    $('nextMatch').innerHTML = '<div class="empty-next"><span>⚔️</span><b>لم تتم إضافة مواجهات</b><small>أضفها من لوحة المشرفين</small></div>';
    return;
  }
  const first = getTeam(next.teamOneId);
  const second = getTeam(next.teamTwoId);
  $('nextRound').textContent = 'المواجهة القادمة';
  $('nextDate').textContent = formatDate(next.date);
  $('nextTime').textContent = formatTime(next.time);
  $('nextMatch').innerHTML = `<div class="team"><div class="team-logo red">🔥</div><b>${escapeHtml(first?.name || '—')}</b><small>الفريق الأول</small></div>
    <div class="vs">VS</div>
    <div class="team"><div class="team-logo blue">⚡</div><b>${escapeHtml(second?.name || '—')}</b><small>الفريق الثاني</small></div>`;
}

function populateTeamSelects() {
  ['teamOne', 'teamTwo'].forEach((id) => {
    const select = $(id);
    const current = select.value;
    select.innerHTML = teams.length
      ? '<option value="">اختر الفريق</option>' + teams.map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('')
      : '<option value="">أضف الفرق أولًا</option>';
    select.value = teams.some((team) => team.id === current) ? current : '';
  });
}

function renderAdminLists() {
  $('adminTeamTotal').textContent = teams.length;
  $('adminMatchTotal').textContent = matches.length;
  $('adminTeamsList').innerHTML = teams.length ? teams.map((team) => `<div class="admin-item">
    <div><b>${escapeHtml(team.name)}</b><small>${escapeHtml(team.captain)} • ${escapeHtml(team.playerTwo)}</small></div>
    <button class="delete-button" data-delete-team="${team.id}" type="button">حذف</button>
  </div>`).join('') : '<div class="empty-state">لا توجد فرق</div>';
  $('adminMatchesList').innerHTML = matches.length ? matches.map((match) => `<div class="admin-item">
    <div><b>${escapeHtml(getTeam(match.teamOneId)?.name || '—')} ضد ${escapeHtml(getTeam(match.teamTwoId)?.name || '—')}</b>
    <small>${escapeHtml(formatDate(match.date))} • ${escapeHtml(formatTime(match.time))}</small></div>
    <button class="delete-button" data-delete-match="${match.id}" type="button">حذف</button>
  </div>`).join('') : '<div class="empty-state">لا توجد مواجهات</div>';
}

function openAdmin() {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  if (loggedIn) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
  } else {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    $('adminPassword').focus();
  }
}

function closeAdmin() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

$('menuToggle').addEventListener('click', () => $('mainNav').classList.toggle('open'));
document.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => $('mainNav').classList.remove('open')));
$('adminButton').addEventListener('click', openAdmin);
$('openAdminFromRegister').addEventListener('click', openAdmin);
$('closeAdmin').addEventListener('click', closeAdmin);
modal.addEventListener('click', (event) => { if (event.target === modal) closeAdmin(); });

$('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if ($('adminUser').value.trim() === 'admin' && $('adminPassword').value === '2367305746') {
    loggedIn = true;
    $('loginMessage').textContent = '';
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    renderAll();
    showToast('تم الدخول إلى لوحة المشرفين');
  } else {
    $('loginMessage').textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
  }
});

$('logoutButton').addEventListener('click', () => {
  loggedIn = false;
  closeAdmin();
  showToast('تم تسجيل الخروج');
});

$('adminTeamForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const team = {
    id: crypto.randomUUID(),
    name: $('adminTeamName').value.trim(),
    captain: $('adminCaptain').value.trim(),
    playerTwo: $('adminPlayer').value.trim(),
  };
  teams.push(team);
  save();
  event.target.reset();
  renderAll();
  showToast(`تمت إضافة فريق ${team.name}`);
});

$('adminMatchForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if ($('teamOne').value === $('teamTwo').value) {
    showToast('اختر فريقين مختلفين للمواجهة');
    return;
  }
  const match = {
    id: crypto.randomUUID(),
    teamOneId: $('teamOne').value,
    teamTwoId: $('teamTwo').value,
    date: $('matchDate').value,
    time: $('matchTime').value,
    round: $('matchRound').value.trim(),
    map: $('matchMap').value,
  };
  matches.push(match);
  save();
  event.target.reset();
  renderAll();
  showToast('تم حفظ المواجهة بالوقت المحدد');
});

document.addEventListener('click', (event) => {
  const teamButton = event.target.closest('[data-delete-team]');
  const matchButton = event.target.closest('[data-delete-match]');
  if (teamButton) {
    const id = teamButton.dataset.deleteTeam;
    teams = teams.filter((team) => team.id !== id);
    matches = matches.filter((match) => match.teamOneId !== id && match.teamTwoId !== id);
    save();
    renderAll();
    showToast('تم حذف الفريق والمواجهات المرتبطة به');
  }
  if (matchButton) {
    matches = matches.filter((match) => match.id !== matchButton.dataset.deleteMatch);
    save();
    renderAll();
    showToast('تم حذف المواجهة');
  }
});

$('resetData').addEventListener('click', () => {
  if (!window.confirm('سيتم حذف جميع الفرق والمواجهات. هل أنت متأكد؟')) return;
  teams = [];
  matches = [];
  save();
  renderAll();
  showToast('تم تصفير بيانات البطولة بالكامل');
});

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3200);
}

renderAll();