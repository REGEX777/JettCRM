function copytoClipboard(email) {
    navigator.clipboard.writeText(email)
        .then(()=>alert('Copied To Clipboard'))
        .catch(err=>console.log('Error Copying Text:"' + err))
}

function showApprovalModal(link, taskId, projectId) {
    document.getElementById('approvalLink').textContent = link;
    document.getElementById('approve').href = `/mytasks/approve/${projectId}/${taskId}`;
    document.getElementById('approvalModal').classList.remove('hidden');
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.add('hidden');
}