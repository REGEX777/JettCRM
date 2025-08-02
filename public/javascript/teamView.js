document.getElementById("teamSearch").addEventListener("input", function () {
    const query = this.value.trim();

    fetch(`/team/api/search?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => updateTeamList(data))
        .catch(err => console.error("Search error:", err));
});

function updateTeamList(members) {
    const container = document.querySelector(".grid.grid-cols-1");
    container.innerHTML = "";

    if (members.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-sm">No team members found.</p>`;
        return;
    }

    members.forEach((member, index) => {
        const isOwner = member._id === "<%= team.owner.toString() %>";
        const isCurrentUser = member._id === "<%= user._id.toString() %>";
        const isAdmin = member.membership ?.role === "admin";

        const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;

        const card = `
                <div class="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden hover:shadow-md transition duration-200">
                    <div class="p-6">
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                                ${initials}
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-800">
                                    ${member.firstName} ${member.lastName}
                                    ${isCurrentUser ? `<span class="text-gray-400 text-sm">(You)</span>` : ""}
                                </h3>
                                <p class="text-sm text-gray-500">${member.email}</p>
                            </div>
                        </div>
                        <div class="flex justify-between text-sm text-gray-500 mt-4">
                            <span>Member since: ${new Date(member.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <span class="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                ${isOwner ? 'Owner' : (member.membership?.role || 'Member')}
                            </span>
                        </div>
                    </div>
                    <div class="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-end space-x-2 relative">
                        <button class="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <div class="relative inline-block text-left">
                            <button id="dropdownMenuIcon-${index}" data-dropdown-toggle="dropdownMenu-${index}"
                                class="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100">
                                <i class="fas fa-ellipsis-h"></i>
                            </button>
                            <div id="dropdownMenu-${index}"
                                class="hidden z-10 absolute right-0 mt-2 w-36 bg-white rounded-lg shadow divide-y divide-gray-100">
                                <ul class="py-1 text-sm text-gray-700">
                                    ${(!(isOwner && isCurrentUser) && !(isAdmin && isCurrentUser))
                                        ? `<li><a href="#" class="block px-4 py-2 hover:bg-gray-100">Edit</a></li>`
                                        : `<li><span class="block px-4 py-2 text-gray-300 cursor-not-allowed">Cannot edit</span></li>`}

                                    ${(!isOwner && !(isAdmin && isCurrentUser))
                                        ? `<li><a href="#" class="block px-4 py-2 hover:bg-gray-100">Remove</a></li>`
                                        : `<li><span class="block px-4 py-2 text-gray-300 cursor-not-allowed">Cannot remove</span></li>`}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        container.insertAdjacentHTML("beforeend", card);
    });

    if (window.Dropdown) {
        document.querySelectorAll("[data-dropdown-toggle]").forEach(btn => {
            new Dropdown(btn); 
        });
    }
}