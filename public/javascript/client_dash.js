document.getElementById("projectSearch").addEventListener("input", function () {
    const query = this.value.trim();

    fetch(`/client/api/projects?search=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(projects => updateProjectGrid(projects))
        .catch(err => console.error("Search error:", err));
});

function updateProjectGrid(projects) {
    const grid = document.getElementById("projectGrid");
    grid.innerHTML = "";

    if (projects.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500">No projects found.</div>`;
        return;
    }

    projects.forEach(project => {
        const teammatesHTML = project.assignedTeammates
            .slice(0, 3)
            .map(member =>
                `<img class="w-6 h-6 rounded-full border-2 border-white" src="${member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}&background=random`}" title="${member.firstName}" alt="${member.firstName}">`
            ).join("");

        const extraCount = project.assignedTeammates.length > 3 ?
            `<span class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 border-2 border-white text-xs">+${project.assignedTeammates.length - 3}</span>` :
            "";

        const statusColor = project.status === 'completed' ?
            'bg-green-500' :
            project.status === 'on-hold' ?
            'bg-gray-500' :
            'bg-[#3546FF]';

        const badgeClass = project.status === 'completed' ?
            'bg-green-100 text-green-800' :
            project.status === 'on-hold' ?
            'bg-gray-100 text-gray-800' :
            'bg-blue-100 text-blue-800';

        const html = `
        <div class="project-card bg-white rounded-lg border border-[#D9D9D9] overflow-hidden transition duration-200">
          <div class="h-2 ${statusColor}"></div>
          <div class="p-5">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="font-medium text-gray-800 mb-1">${project.name}</h3>
                <span class="inline-block px-2 py-1 text-xs rounded-full ${badgeClass}">
                  ${project.status || 'active'}
                </span>
              </div>
              <div class="dropdown relative">
                <button class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">${project.description || ''}</p>
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center text-gray-500">
                <i class="far fa-calendar-alt mr-2"></i>
                <span>${new Date(project.deadlineDate).toLocaleDateString()}</span>
              </div>
              <div class="flex -space-x-2">
                ${teammatesHTML}
                ${extraCount}
              </div>
            </div>
          </div>
          <div class="border-t border-[#F0F0F0] px-5 py-3">
            <a href="/client/pv/${project._id}" class="text-[#3546FF] hover:text-[#2a3acc] text-sm font-medium flex items-center">
              View Project <i class="fas fa-chevron-right ml-2 text-xs"></i>
            </a>
          </div>
        </div>`;

        grid.insertAdjacentHTML("beforeend", html);
    });
}


const statusFilter = document.getElementById("statusFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");

function fetchAndUpdateProjects() {
  const query = searchInput.value.trim();
  const status = statusFilter.value.trim();
  const sort = sortFilter.value;

  const params = new URLSearchParams({
    search: query,
    status,
    sort
  });

  fetch(`/client/api/projects?${params.toString()}`)
    .then(res => res.json())
    .then(projects => updateProjectGrid(projects))
    .catch(err => console.error("Filter error:", err));
}

searchInput.addEventListener("input", fetchAndUpdateProjects);
statusFilter.addEventListener("change", fetchAndUpdateProjects);
sortFilter.addEventListener("change", fetchAndUpdateProjects);