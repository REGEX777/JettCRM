function confirmDelete(projectId) {
  const deleteLink = document.getElementById('confirmDeleteBtn');
  deleteLink.href = `/projects/delete/${projectId}`;
  document.getElementById('deleteModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('deleteModal').classList.add('hidden');
}

const statusText = document.getElementById('statusText');
const sortText = document.getElementById('sortText');

let currentStatus = '<%= status || "all" %>';
let currentSort = '<%= sort || "newest" %>';

document.querySelectorAll('[data-status]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    currentStatus = el.getAttribute('data-status');
    statusText.textContent = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
    updateURL();
  });
});

document.querySelectorAll('[data-sort]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    currentSort = el.getAttribute('data-sort');
    sortText.textContent = currentSort.charAt(0).toUpperCase() + currentSort.slice(1);
    updateURL();
  });
});

function updateURL() {
  window.location.href = `/projects?status=${currentStatus}&sort=${currentSort}`;
}

document.getElementById("projectSearch").addEventListener("input", function () {
  const query = this.value.trim();

  const defaultList = document.getElementById("defaultProjectList");
  const searchList = document.getElementById("searchResults");

  if (!defaultList || !searchList) return;

  if (query === "") {
    defaultList.classList.remove("hidden");
    searchList.classList.add("hidden");
    return;
  }

  fetch(`/projects/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      defaultList.classList.add("hidden");
      searchList.classList.remove("hidden");
      updateSearchCards(data);
    })
    .catch(err => console.error("Search error:", err));
});

function updateSearchCards(projects) {
  const container = document.getElementById("searchResults");
  if (!container) return;

  container.innerHTML = "";

  if (projects.length === 0) {
    container.innerHTML = `<p class="text-center text-sm text-gray-400 py-4">No matching projects found.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "min-w-full divide-y divide-gray-200";

  table.innerHTML = `
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");
  tbody.className = "bg-white divide-y divide-gray-200";

  projects.forEach((project) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50";

    const statusBadge = project.status === "active"
      ? `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">Active</span>`
      : project.status === "completed"
      ? `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700">Completed</span>`
      : `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">${project.status}</span>`;

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <i class="fa-solid fa-briefcase"></i>
          </div>
          <div class="min-w-0">
            <a href="/projects/v/${project._id}" class="text-gray-900 font-medium truncate hover:text-blue-600">${project.name}</a>
            <div class="text-xs text-gray-500 truncate">${project.description ? project.description.slice(0, 60) : ''}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${project.client ? (project.client.firstName + " " + project.client.lastName) : (project.clientEmail || "Unknown")}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(project.createdAt).toDateString()}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${project.deadlineDate ? new Date(project.deadlineDate).toDateString() : "N/A"}</td>
      <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex items-center justify-end gap-3">
          <a href="/projects/v/${project._id}" class="text-gray-600 hover:text-gray-900"><i class="fas fa-eye"></i></a>
          <a href="/projects/edit/${project._id}" class="text-gray-600 hover:text-gray-900"><i class="fas fa-edit"></i></a>
          <button onclick="confirmDelete('${project._id}')" class="text-gray-600 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
