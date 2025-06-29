document.getElementById('teamSearch').addEventListener("input", function() {
    const query = this.value.trim();
    const gridContainer = document.querySelector(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3");
    gridContainer.innerHTML = `<div class="col-span-full text-center py-6 text-gray-400">Loading...</div>`;
    
    fetch(`/team/api?search=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => updateTeamGrid(data))
        .catch(err => console.error("Search error:", err));
});

function updateTeamGrid(teamMembers) {
    const gridContainer = document.querySelector(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3");
    gridContainer.innerHTML = "";

    if (teamMembers.length === 0) {
        gridContainer.innerHTML = `
            <div class="col-span-full text-center py-6 text-[#A3A3A3] text-sm">
                No team members found.
            </div>`;
        return;
    }

    teamMembers.forEach(member => {
        const statusColorClass =
            member.status === "Inactive"
                ? "bg-red-600 border-red-600"
                : "bg-green-700 border-green-700";

        const memberHTML = `
            <div class="bg-white rounded-lg border border-border p-5 flex flex-col gap-4">
                <div class="flex items-center gap-4">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName)}+${encodeURIComponent(member.lastName)}&background=random" class="w-16 h-16 rounded-full">
                    <div>
                        <h3 class="font-semibold">${member.firstName} ${member.lastName}</h3>
                        <p class="text-sm text-gray-500">${member.role || '-'}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-gray-500">Department</p>
                        <p class="font-medium">${member.department || '-'}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Joined</p>
                        <p class="font-medium">${member.joinDate || '-'}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Salary</p>
                        <p class="font-medium">$${member.salary || '0'}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Status</p>
                        <div id="status-badge-${member._id}" class="py-1 px-2 rounded-lg ${statusColorClass} inline-block">
                            <p class="text-xs text-white">${member.status || 'Active'}</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-2 border-t border-border">
                    <div class="flex gap-2">
                        <a href="mailto:${member.email}" class="text-[#3546FF] text-sm flex items-center gap-1">
                            <i class="fa-solid fa-envelope text-xs"></i>
                            <span>Email</span>
                        </a>
                        <p class="text-sm flex items-center gap-1">
                            <i class="fa-solid fa-phone text-xs"></i>
                            <span>${member.phone || '-'}</span>
                        </p>
                    </div>
                    <button class="text-gray-500 hover:text-gray-700">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
            </div>
        `;

        gridContainer.insertAdjacentHTML("beforeend", memberHTML);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".status-btn");
        if (!btn) return;

        const memberId = btn.dataset.id;
        const newStatus = btn.dataset.status;

        try {
            const res = await fetch(`/team/api/update-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: memberId, status: newStatus })
            });

            const result = await res.json();
            if (!result.success) throw new Error();

            const parent = btn.closest("ul");
            parent.querySelectorAll("i.fa-check").forEach(i => i.remove());

            const checkIcon = document.createElement("i");
            checkIcon.className = "fa-solid fa-check text-green-500";
            btn.appendChild(checkIcon);

            const badge = document.getElementById(`status-badge-${memberId}`);
            if (badge) {
                badge.querySelector("p").textContent = newStatus;
                badge.className = `py-1 px-2 rounded-lg inline-block ${
                    newStatus === "Active"
                        ? "bg-green-700 border-green-700"
                        : "bg-red-600 border-red-600"
                }`;
            }
        } catch {
            alert("Failed to update status.");
        }
    });
});