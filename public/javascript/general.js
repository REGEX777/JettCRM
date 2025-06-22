        function toggleSection(sectionId) {
            const section = document.getElementById(sectionId);
            const icon = document.getElementById(sectionId + 'Icon');

            section.classList.toggle('hidden');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }


        function toggleClientDetails(index) {
            const detailsRow = document.getElementById(`client-details-${index}`);
            const mainRow = document.getElementById(`client-row-${index}`);

            detailsRow.classList.toggle('hidden');

            mainRow.classList.toggle('bg-[#F0F0F0]');

            document.querySelectorAll('[id^="client-details-"]').forEach(row => {
                if (row.id !== `client-details-${index}` && !row.classList.contains('hidden')) {
                    row.classList.add('hidden');
                    const otherIndex = row.id.split('-')[2];
                    document.getElementById(`client-row-${otherIndex}`).classList.remove('bg-[#F0F0F0]');
                }
            });
        }


  const modal = document.getElementById("excelUploadModal");
  const uploadBtn = document.getElementById("excelUploadButton");
  const dropArea = document.getElementById("dropArea");
  const fileInput = document.getElementById("excelFileInput");
  const form = document.getElementById("excelUploadForm");
  const submitBtn = document.getElementById("submitExcelButton");

  uploadBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  dropArea.addEventListener("click", () => {
    fileInput.click();
  });

  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("border-blue-500", "bg-blue-50");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("border-blue-500", "bg-blue-50");
  });

  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("border-blue-500", "bg-blue-50");

    const file = e.dataTransfer.files[0];

    if (e.dataTransfer.files.length > 1) {
        alert("Only one file at a time.");
        return;
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        alert("Only Excel files are allowed.");
        return;
    }

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    showFileName(file.name);
    submitBtn.classList.remove("hidden");
  });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) {
            showFileName(file.name);
            submitBtn.classList.remove("hidden");
        }
    });

    function showFileName(name) {
    const display = document.getElementById("fileNameDisplay");
    display.textContent = `Selected: ${name}`;
    display.classList.remove("hidden");
    }