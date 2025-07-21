function copytoClipboard(email) {
    navigator.clipboard.writeText(email)
        .then(()=>alert('Copied To Clipboard'))
        .catch(err=>console.log('Error Copying Text:"' + err))
}