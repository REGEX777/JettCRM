  function handleClientSelect() {
    const select = document.getElementById('clientSelect');
    const newClientSection = document.getElementById('newClientEmailWrapper');

    if (select.value === "new") {
      newClientSection.classList.remove('hidden');
    } else {
      newClientSection.classList.add('hidden');
    }
  }



function searchClients(query) {
  const dropdown = document.getElementById('clientDropdown');
  dropdown.innerHTML = '';

  if (query.length < 2) {
    dropdown.classList.add('hidden');
    return;
  }

  fetch(`/clients/api?search=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(clients => {
      if (clients.length > 0) {
        clients.forEach(client => {
          const item = document.createElement('div');
          item.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer';
          item.innerHTML = `
            <div class="font-medium">${client.clientName}</div>
            <div class="text-xs text-gray-500">${client.email}</div>
          `;
          item.onclick = () => selectClient(client);
          dropdown.appendChild(item);
        });

        const newClientItem = document.createElement('div');
        newClientItem.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200';
        newClientItem.innerHTML = `
          <div class="font-medium text-blue-600">Add new client: "${query}"</div>
          <div class="text-xs text-gray-500">Click to create new client</div>
        `;
        newClientItem.onclick = () => selectNewClient(query);
        dropdown.appendChild(newClientItem);

        dropdown.classList.remove('hidden');
      } else {
        dropdown.innerHTML = `
          <div class="px-4 py-2 text-sm text-gray-500">No results for "${query}"</div>
          <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200" onclick="selectNewClient('${query}')">
            <div class="font-medium text-blue-600">Add new client: "${query}"</div>
            <div class="text-xs text-gray-500">Click to create new client</div>
          </div>
        `;
        dropdown.classList.remove('hidden');
      }
    })
    .catch(err => {
      console.error("Search error:", err);
      dropdown.classList.add('hidden');
    });
}

  function selectClient(client) {
    const searchInput = document.getElementById('clientSearch');
    const selectInput = document.getElementById('clientSelect');
    const emailWrapper = document.getElementById('newClientEmailWrapper');

    searchInput.value = `${client.clientName} - ${client.email}`;
    selectInput.innerHTML = `<option value="${client.id}" selected>${client.clientName}</option>`;
    emailWrapper.classList.add('hidden');
    document.getElementById('clientDropdown').classList.add('hidden');
  }

  function selectNewClient(query) {
    const searchInput = document.getElementById('clientSearch');
    const selectInput = document.getElementById('clientSelect');
    const emailWrapper = document.getElementById('newClientEmailWrapper');

    searchInput.value = query;
    selectInput.innerHTML = `<option value="new" selected>New Client: ${query}</option>`;
    emailWrapper.classList.remove('hidden');
    document.getElementById('newClientEmail').focus();
    document.getElementById('clientDropdown').classList.add('hidden');
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#clientSearch') && !e.target.closest('#clientDropdown')) {
      document.getElementById('clientDropdown').classList.add('hidden');
    }
  });