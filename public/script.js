// script.js (shared for index / novel / read)
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  routePage();
});

function setupTheme() {
  const body = document.body;
  const stored = localStorage.getItem('theme');
  if (stored === 'light') body.classList.remove('dark'); // default dark
  else body.classList.add('dark');

  document.querySelectorAll('#theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  });
}

function routePage() {
  if (document.getElementById('novel-grid')) loadIndex();
  if (document.getElementById('chapter-list')) loadNovel();
  if (document.getElementById('chapter-content')) loadReader();
  if (document.getElementById('back-home')) document.getElementById('back-home').addEventListener('click', () => location.href = '/');
  if (document.getElementById('back-to-novel')) {
    document.getElementById('back-to-novel').addEventListener('click', () => {
      const params = new URLSearchParams(window.location.search);
      const novel = params.get('novel');
      if (novel) location.href = `/novel.html?novel=${encodeURIComponent(novel)}`;
      else location.href = '/';
    });
  }
}

async function loadIndex() {
  const grid = document.getElementById('novel-grid');
  grid.innerHTML = '<p class="muted">Loading novels…</p>';
  try {
    const res = await fetch('/api/novels');
    const novels = await res.json();
    grid.innerHTML = '';
    if (!novels.length) {
      grid.innerHTML = '<p class="muted">No novels found. Create folders inside /novels/</p>';
      return;
    }

    novels.forEach(n => {
      const card = document.createElement('div');
      card.className = 'novel-card';
      const coverPath = `/covers/${n.id}.jpg`;
      card.innerHTML = `
        <img src="${coverPath}" class="cover-thumb" onerror="this.style.display='none'">
        <h3>${escapeHtml(n.title)}</h3>
        <p class="muted">Click read to view chapters</p>
        <div style="margin-top:8px">
          <button class="read-btn" data-novel="${n.id}">Open</button>
        </div>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll('.read-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const novel = btn.dataset.novel;
        location.href = `/novel.html?novel=${encodeURIComponent(novel)}`;
      });
    });
  } catch (err) {
    grid.innerHTML = `<p class="muted">Failed to load novels</p>`;
    console.error(err);
  }
}

async function loadNovel() {
  const params = new URLSearchParams(window.location.search);
  const novel = params.get('novel');
  if (!novel) return document.getElementById('chapter-list').innerHTML = '<p class="muted">No novel specified</p>';

  document.getElementById('novel-title').textContent = novel.replace(/-/g,' ');
  const cover = document.getElementById('cover-img');
  cover.src = `/covers/${novel}.jpg`;

  const list = document.getElementById('chapter-list');
  list.innerHTML = '<p class="muted">Loading chapters…</p>';

  try {
    const res = await fetch(`/api/novels/${encodeURIComponent(novel)}`);
    const chapters = await res.json();
    if (!chapters.length) {
      list.innerHTML = '<p class="muted">No chapters (.md) found in this novel folder.</p>';
      return;
    }
    list.innerHTML = '';
    chapters.forEach(ch => {
      const a = document.createElement('a');
      a.className = 'chapter-link';
      a.href = `/read.html?novel=${encodeURIComponent(novel)}&file=${encodeURIComponent(ch.filename)}`;
      a.innerHTML = `<span>${escapeHtml(ch.title)}</span><span class="muted">Chapter ${ch.index}</span>`;
      list.appendChild(a);
    });
  } catch (err) {
    list.innerHTML = '<p class="muted">Failed to load chapters.</p>';
  }
}

async function loadReader() {
  const params = new URLSearchParams(window.location.search);
  const novel = params.get('novel');
  const file = params.get('file');
  if (!novel || !file) return document.getElementById('chapter-content').innerHTML = '<p class="muted">Invalid chapter link</p>';

  const contentEl = document.getElementById('chapter-content');
  contentEl.innerHTML = '<p class="muted">Loading chapter…</p>';

  try {
    // fetch chapter content
    const res = await fetch(`/api/novels/${encodeURIComponent(novel)}/${encodeURIComponent(file)}`);
    const html = await res.text();
    contentEl.innerHTML = html;

    // fetch chapters to enable prev/next
    const listRes = await fetch(`/api/novels/${encodeURIComponent(novel)}`);
    const chapters = await listRes.json();
    const idx = chapters.findIndex(c => c.filename === file);

    const prevBtn = document.getElementById('prev-ch');
    const nextBtn = document.getElementById('next-ch');

    if (idx > 0) {
      prevBtn.disabled = false;
      prevBtn.onclick = () => {
        const prevFile = chapters[idx - 1].filename;
        location.href = `/read.html?novel=${encodeURIComponent(novel)}&file=${encodeURIComponent(prevFile)}`;
      };
    } else {
      prevBtn.disabled = true;
    }

    if (idx < chapters.length - 1) {
      nextBtn.disabled = false;
      nextBtn.onclick = () => {
        const nextFile = chapters[idx + 1].filename;
        location.href = `/read.html?novel=${encodeURIComponent(novel)}&file=${encodeURIComponent(nextFile)}`;
      };
    } else {
      nextBtn.disabled = true;
    }

  } catch (err) {
    contentEl.innerHTML = '<p class="muted">Failed to load chapter.</p>';
    console.error(err);
  }
}

// small helper to avoid XSS from folder names
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
