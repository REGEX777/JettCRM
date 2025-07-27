const projectSearch = document.getElementById("projectSearch");
const container = document.getElementById("projectContainer");
const teamId = projectSearch.dataset.teamId

projectSearch.addEventListener("input", function () {
    const query = this.value.trim();

    fetch(`/myteam/team/${teamId}/projects?search=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = "";

            if (data.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center text-gray-500 text-sm py-8">No projects found.</div>`;
                return;
            }

            data.forEach(project => {
                const statusColor = {
                    active: 'bg-green-100 text-green-800',
                    pending: 'bg-yellow-100 text-yellow-800',
                    completed: 'bg-blue-100 text-blue-800'
                } [project.status] || '';

                const dotColor = {
                    active: 'bg-green-500',
                    pending: 'bg-yellow-500',
                    completed: 'bg-blue-500'
                } [project.status] || '';

                const html = `
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-4">
                  <h4 class="text-lg font-semibold text-gray-800">${project.name}</h4>
                  <span class="flex items-center px-3 py-1 text-xs rounded-full font-medium ${statusColor}">
                    <span class="w-2 h-2 rounded-full mr-2 ${dotColor}"></span>
                    ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
                <div class="text-sm space-y-3 text-gray-600">
                  <div class="flex items-start">
                    <i class="far fa-calendar-alt mt-1 mr-2 text-gray-400"></i>
                    <div>
                      <p class="font-medium text-gray-500">Started On</p>
                      <p>${new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <i class="far fa-clock mt-1 mr-2 text-gray-400"></i>
                    <div>
                      <p class="font-medium text-gray-500">Deadline</p>
                      <p>${new Date(project.deadlineDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="pt-5 mt-4 border-t border-gray-100">
                <a href="/mytasks/${project._id}/tasks" class="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition">
                  <i class="fas fa-tasks pr-2"></i> View Tasks
                </a>
              </div>
            </div>`;
                container.insertAdjacentHTML("beforeend", html);
            });
        })
        .catch(err => {
            console.error("Search error:", err);
        });
});