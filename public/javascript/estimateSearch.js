
function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// function ro treate new rows
function buildEstimateRow(est) {
  const tr = document.createElement('tr');
  tr.className = 'hover:bg-gray-50';

  const tdId = document.createElement('td');
  tdId.className = 'px-6 py-4 whitespace-nowrap';
  const a = document.createElement('a');
  a.href = `/tools/estimate/v/${est.id}`;
  a.className = 'text-blue-600 hover:text-blue-800 font-medium';
  a.textContent = '#' + String(est.id).slice(-6).toUpperCase();
  tdId.appendChild(a);
  tr.appendChild(tdId);

  // client stuff
  const tdClient = document.createElement('td');
  tdClient.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
  tdClient.textContent = est.clientName || '-';
  tr.appendChild(tdClient);

  const tdDate = document.createElement('td');
  tdDate.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
  tdDate.textContent = new Date(est.createdAt).toLocaleDateString();
  tr.appendChild(tdDate);

  const tdStatus = document.createElement('td');
  tdStatus.className = 'px-6 py-4 whitespace-nowrap';
  const span = document.createElement('span');
  span.className = `px-2 py-1 text-xs font-semibold rounded-full ${
    est.status && est.status.toLowerCase() === 'draft' ? 'bg-blue-100 text-blue-800' :
    est.status && est.status.toLowerCase() === 'sent' ? 'bg-green-100 text-green-800' :
    'bg-gray-100 text-gray-800'}`;
  span.textContent = est.status ? (est.status.charAt(0).toUpperCase() + est.status.slice(1)) : 'Draft';
  tdStatus.appendChild(span);
  tr.appendChild(tdStatus);

  const tdAmount = document.createElement('td');
  tdAmount.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right';
  tdAmount.textContent = '$' + (Number(est.total || 0)).toFixed(2);
  tr.appendChild(tdAmount);

  const tdActions = document.createElement('td');
  tdActions.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
  tdActions.innerHTML = `
    <div class="flex justify-end gap-2">
      <a href="/tools/estimate/v/${est.id}" class="text-gray-600 hover:text-gray-900 mr-3"><i class="fas fa-eye"></i></a>
      <a href="/tools/estimate/edit/${est.id}" class="text-gray-600 hover:text-gray-900 mr-3"><i class="fas fa-edit"></i></a>
      <a href="#" class="text-gray-600 hover:text-red-600 mr-3"><i class="fa-solid fa-trash"></i></a>
    </div>`;
  tr.appendChild(tdActions);

  return tr;
}

// push updatess
function updateEstimatesTable(estimates) {
  const tbody = document.getElementById('estimatesTbody');
  tbody.innerHTML = '';
  if (!estimates || estimates.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-[#A3A3A3] text-sm">No results.</td></tr>`;
    return;
  }

  estimates.forEach(est => {
    const row = buildEstimateRow(est);
    tbody.appendChild(row);
  });
}


// api call stuff
async function fetchEstimates() {
  const query = document.getElementById('estimateSearch')?.value.trim() || '';
  const status = document.getElementById('estimateStatus')?.value || 'All';
  const dateRange = document.getElementById('estimateDateRange')?.value || 'all';

  const params = new URLSearchParams();
  if (query) params.set('search', query);
  if (status && status !== 'All') params.set('status', status);
  if (dateRange) params.set('dateRange', dateRange);

  try {
    const res = await fetch(`/tools/estimate/api?${params.toString()}`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    updateEstimatesTable(data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

const debouncedFetch = debounce(fetchEstimates, 250);

document.getElementById('estimateSearch')?.addEventListener('input', debouncedFetch);
document.getElementById('estimateStatus')?.addEventListener('change', debouncedFetch);
document.getElementById('estimateDateRange')?.addEventListener('change', debouncedFetch);


// preloadd type shi
fetchEstimates();







// paginations scripts

const totalResults = 53; // Total items
const itemsPerPage = 10;
let currentPage = 1;
const totalPages = Math.ceil(totalResults / itemsPerPage);

function renderPagination() {
    const paginationNav = document.getElementById('pagination-nav');
    const fromCount = document.getElementById('from-count');
    const toCount = document.getElementById('to-count');
    const totalCount = document.getElementById('total-count');

    fromCount.textContent = (currentPage - 1) * itemsPerPage + 1;
    toCount.textContent = Math.min(currentPage * itemsPerPage, totalResults);
    totalCount.textContent = totalResults;

    paginationNav.innerHTML = `
        <a href="#" onclick="changePage(${currentPage - 1})" 
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}">
            <span class="sr-only">Previous</span>
            <i class="fas fa-chevron-left"></i>
        </a>
        ${Array.from({ length: totalPages }, (_, i) => `
            <a href="#" onclick="changePage(${i + 1})"
                class="${currentPage === i + 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'} relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                ${i + 1}
            </a>
        `).join('')}
        <a href="#" onclick="changePage(${currentPage + 1})" 
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}">
            <span class="sr-only">Next</span>
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPagination();
}

// Initial render
renderPagination();