let itemIndex = document.querySelectorAll('#itemsContainer > .grid').length;
if (itemIndex === 0) itemIndex = 1;


const _initRemoveBtns = document.querySelectorAll('.remove-btn');
if (_initRemoveBtns.length <= 1) {
    _initRemoveBtns.forEach(btn => btn.classList.add('hidden'));
} else {
    _initRemoveBtns.forEach(btn => btn.classList.remove('hidden'));
}

document.getElementById("addItem").addEventListener("click", () => {
    const container = document.getElementById("itemsContainer");

    const newItem = document.createElement("div");
    newItem.className = "grid grid-cols-12 gap-4 items-center";

    newItem.innerHTML = `
                <div class="col-span-6">
                    <input name="items[${itemIndex}][name]" type="text" placeholder="Item or service name" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div class="col-span-4">
                    <input name="items[${itemIndex}][price]" type="number" step="0.01" placeholder="Price" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 price-input" required>
                </div>
                <div class="col-span-2 flex justify-end">
                    <button type="button" class="text-gray-400 hover:text-red-500 remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

    container.appendChild(newItem);
    itemIndex++;

    const removeButtons = document.querySelectorAll('.remove-btn');
    if (removeButtons.length > 1) {
        document.querySelector('.remove-btn').classList.remove('hidden');
    }

    updateTotal();
});

// item row deletre
document.getElementById("itemsContainer").addEventListener("click", (e) => {
    if (e.target.closest(".remove-btn")) {
        const row = e.target.closest(".remove-btn").parentElement.parentElement;
        row.remove();

        const removeButtons = document.querySelectorAll('.remove-btn');
        if (removeButtons.length === 1) {
            removeButtons[0].classList.add('hidden');
        }

        updateTotal();
    }
});

// calculate everything
function updateTotal() {
    const priceInputs = document.querySelectorAll('.price-input');
    let subtotal = 0;

    priceInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        subtotal += value;
    });

    const taxRate = parseFloat(document.getElementById('taxInput').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);

    const discountInput = parseFloat(document.getElementById('discountInput').value) || 0;
    const discountType = document.getElementById('discountType').value;
    let discountAmount = 0;

    if (discountType === 'flat') {
        discountAmount = discountInput;
    } else if (discountType === 'percent') {
        discountAmount = subtotal * (discountInput / 100);
    }

    const total = subtotal + taxAmount - discountAmount;

    document.getElementById('subtotalDisplay').textContent = subtotal.toFixed(2);
    document.getElementById('taxDisplay').textContent = taxAmount.toFixed(2);
    document.getElementById('discountDisplay').textContent = discountAmount.toFixed(2);
    document.getElementById('totalDisplay').textContent = total.toFixed(2);
}

document.getElementById('taxInput').addEventListener('input', updateTotal);
document.getElementById('discountInput').addEventListener('input', updateTotal);
document.getElementById('discountType').addEventListener('change', updateTotal);
document.getElementById('itemsContainer').addEventListener('input', function (e) {
    if (e.target.classList.contains('price-input')) {
        updateTotal();
    }
});

updateTotal();