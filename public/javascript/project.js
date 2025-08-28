function copytoClipboard(email) {
    navigator.clipboard.writeText(email)
        .then(() => alert('Copied To Clipboard'))
        .catch(err => console.log('Error Copying Text:"' + err))
}

function showApprovalModal(link, taskId, projectId) {
    document.getElementById('approvalLink').textContent = link;
    document.getElementById('approve').href = `/mytasks/approve/${projectId}/${taskId}`;
    document.getElementById('approvalModal').classList.remove('hidden');
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.add('hidden');
}






(function () {

    window.copyToClipboard = function (text) {
        navigator.clipboard?.writeText(text).then(() => {
            const t = document.createElement('div');
            t.className = 'fixed right-6 bottom-6 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 shadow';
            t.textContent = 'Copied to clipboard';
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 1800);
        }).catch(() => alert('Could not copy'));
    };

    window.closeApprovalModal = function () {
        const modal = document.getElementById('approvalModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    window.openAssignModal = function () {
        const modal = document.getElementById('assignModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.closeAssignModal = function () {
        const modal = document.getElementById('assignModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        // for delay
        setTimeout(() => window.location.reload(), 150);
    };

})();




async function addMember(memberId) {
    const res = await fetch(`/projects/${window.projectId}/members/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            memberId
        })
    });
    const updated = await res.json();
    renderMembers(updated);
}

async function removeMember(memberId) {
    const res = await fetch(`/projects/${window.projectId}/members/remove`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            memberId
        })
    });
    const updated = await res.json();
    renderMembers(updated);
}


// render
function renderMembers({
    assignedTeammates,
    availableTeammates
}) {
    const current = document.getElementById('currentMembers');
    const available = document.getElementById('availableMembers');

    current.innerHTML = assignedTeammates.map(m => `
        <li class="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
        <span>${m.firstName} ${m.lastName}</span>
        <button onclick="removeMember('${m._id}')" class="text-red-500 hover:text-red-700">&times;</button>
        </li>
    `).join('');

    available.innerHTML = availableTeammates.map(m => `
        <li class="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
        <span>${m.firstName} ${m.lastName}</span>
        <button onclick="addMember('${m._id}')" class="text-green-500 hover:text-green-700">+</button>
        </li>
    `).join('');
}