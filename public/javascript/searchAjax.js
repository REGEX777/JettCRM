document.getElementById("clientSearch").addEventListener("input", function () {
    const query = this.value.trim();
    fetch(`/clients/api?search=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => updateTable(data))
        .catch(err => console.error("Search error:", err));
});

function updateTable(clients) {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    clients.forEach((client, index) => {
        const rowId = `client-row-${index}`;
        const detailsId = `client-details-${index}`;

        const html = `
        <tr class="border-b border-border hover:bg-[#FAFAFA] cursor-pointer"
            onclick="toggleClientDetails('${index}')"
            id="${rowId}">
            <td class="py-3 px-4 flex items-center gap-3">
                <div>
                    <p class="font-medium">${client.clientName}</p>
                    <p class="text-xs text-[#A3A3A3]">ID: ${client.ID}</p>
                </div>
            </td>
            <td class="py-3 px-4">
                <p>${client.email}</p>
                <p class="text-xs text-[#A3A3A3]">${client.phoneNumber}</p>
            </td>
            <td class="py-3 px-4">${client.businessName}</td>
            <td class="py-3 px-4">${client.projects || '-'}</td>
            <td class="py-3 px-4">
                <span class="py-1 px-3 rounded-full bg-[#E8F5E9] text-[#00B506] text-xs">Active</span>
            </td>
            <td class="py-3 px-4">
                <div class="flex gap-2">
                    <button class="p-2 text-[#3546FF] hover:bg-[#F5F5F5] rounded-lg" onclick="event.stopPropagation()">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="p-2 text-[#FF3D3D] hover:bg-[#F5F5F5] rounded-lg" onclick="event.stopPropagation()">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="p-2 text-[#3A3A3A] hover:bg-[#F5F5F5] rounded-lg" onclick="event.stopPropagation()">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
            </td>
        </tr>
        <tr class="hidden bg-[#FAFAFA]" id="${detailsId}">
            <td colspan="6" class="px-4 py-3">
                <div class="grid grid-cols-2 gap-4 p-4">
                    <div class="col-span-1">
                        <div class="mb-4">
                            <h4 class="text-sm font-medium text-[#3A3A3A] mb-2">Contact Information</h4>
                            <div class="flex items-center gap-3 mb-2">
                                <i class="fa-solid fa-phone text-[#A3A3A3] w-5"></i>
                                <p class="text-sm">${client.phoneNumber}</p>
                            </div>
                            <div class="flex items-center gap-3 mb-2">
                                <i class="fa-solid fa-envelope text-[#A3A3A3] w-5"></i>
                                <p class="text-sm">${client.email}</p>
                            </div>
                            ${client.address ? `
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-location-dot text-[#A3A3A3] w-5 mt-1"></i>
                                <p class="text-sm">${client.address}</p>
                            </div>` : ''}
                        </div>
                        ${client.website ? `
                        <div class="mb-4">
                            <h4 class="text-sm font-medium text-[#3A3A3A] mb-2">Website</h4>
                            <div class="flex items-center gap-3">
                                <i class="fa-solid fa-globe text-[#A3A3A3] w-5"></i>
                                <a href="${client.website}" target="_blank" class="text-sm text-[#3546FF] hover:underline">${client.website}</a>
                            </div>
                        </div>` : ''}
                    </div>
                    <div class="col-span-1">
                        ${client.notes ? `
                        <div class="mb-4">
                            <h4 class="text-sm font-medium text-[#3A3A3A] mb-2">Notes</h4>
                            <p class="text-sm bg-white p-3 rounded-lg border border-border">${client.notes}</p>
                        </div>` : ''}
                        <div>
                            <h4 class="text-sm font-medium text-[#3A3A3A] mb-2">Recent Activity</h4>
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <div class="w-5 h-5 rounded-full bg-[#3546FF] flex items-center justify-center mt-0.5">
                                        <i class="fa-solid fa-plus text-white text-xs"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm">Client added to system</p>
                                        <p class="text-xs text-[#A3A3A3]">2 days ago</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <div class="w-5 h-5 rounded-full bg-[#00B506] flex items-center justify-center mt-0.5">
                                        <i class="fa-solid fa-check text-white text-xs"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm">Initial contact made</p>
                                        <p class="text-xs text-[#A3A3A3]">1 day ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", html);
    });

    if (clients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-6 text-[#A3A3A3] text-sm">No clients found.</td>
            </tr>
        `;
    }
}