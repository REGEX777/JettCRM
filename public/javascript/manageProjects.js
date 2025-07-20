
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
      statusText.textContent = currentStatus;
      updateURL();
    });
  });

  document.querySelectorAll('[data-sort]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      currentSort = el.getAttribute('data-sort');
      sortText.textContent = currentSort;
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
  container.innerHTML = "";

  if (projects.length === 0) {
    container.innerHTML = `<p class="text-center text-sm text-gray-400 py-4">No matching projects found.</p>`;
    return;
  }

  projects.forEach((project, index) => {
    const card = document.createElement("div");
    card.className = "h-[6rem] bg-[#FAFAFA] border-border w-full rounded-lg flex flex-row items-center justify-between px-5 hover:shadow-md transition-all";

    card.innerHTML = `
    <div class="h-[6rem] bg-[#FAFAFA] border-border w-full rounded-lg flex flex-row items-center justify-between px-5 hover:shadow-md transition-all">
      <div class="flex items-center gap-4 w-1/3">
        <div class="h-12 w-12 rounded-lg bg-[#3546FF] flex items-center justify-center text-white">
          <i class="fa-solid fa-briefcase"></i>
        </div>
        <div class="flex flex-col items-start justify-center">
          <p class="font-medium">${project.name}</p>
          <div class="flex flex-row items-center justify-center gap-1">
            <p class="text-xs text-gray-500">Client: ${project.clientEmail || 'Unknown'}</p>
            ${!project.client ? `
              <div class="py-[1px] text-xs flex items-center justify-center px-2 bg-[#ff6e6e] rounded-lg text-white">
                <p>Pending Invite</p>
              </div>` : ''
            }
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 w-1/3 justify-center">
        <div class="flex flex-col items-center">
          <p class="text-xs text-gray-500">Start Date</p>
          <p class="text-sm">${new Date(project.createdAt).toDateString()}</p>
        </div>
        <div class="h-0.5 w-8 bg-gray-300"></div>
        <div class="flex flex-col items-center">
          <p class="text-xs text-gray-500">Due Date</p>
          <p class="text-sm">${project.deadlineDate ? new Date(project.deadlineDate).toDateString() : 'N/A'}</p>
        </div>
      </div>

      <div class="flex items-center gap-3 w-1/3 justify-end">
        <div class="py-1 px-3 rounded-lg ${project.status === 'active' ? 'bg-okgreen border-okgreenborder' : 'bg-gray-400 border-gray-500'} flex items-center justify-center text-sm text-white">
          <p>${project.status.charAt(0).toUpperCase() + project.status.slice(1)}</p>
        </div>
        <button id="dropdownHoverButton" data-dropdown-toggle="dropdownHover-${index}" class="p-2 rounded-lg hover:bg-gray-200">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
        <div id="dropdownHover-${index}" class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44">
          <ul class="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
            <li><a href="/project/taskmanager/${project._id}" class="block px-4 py-2 hover:bg-gray-100">Task Manager</a></li>
            <li><a href="/edit/${project._id}" class="block px-4 py-2 hover:bg-gray-100">Edit</a></li>
            <li>
              <button onclick="confirmDelete('${project._id}')" class="w-full text-left block px-4 py-2 hover:bg-gray-100">
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    `;

    container.appendChild(card);
  });
}