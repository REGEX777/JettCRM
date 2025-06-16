
document.addEventListener('DOMContentLoaded', function () {
    setupEvents();

    document.getElementById('addItemBtn').addEventListener('click', function (e) {
        e.preventDefault();
        addItemRow();
    });

    document.getElementById('generateInvoiceBtn')?.addEventListener('click', function () {
        alert('Invoice generated!');
    });

    document.getElementById('discount').addEventListener('input', calculateTotals);
});

function setupEvents() {
    document.querySelectorAll('.item-qty, .item-rate').forEach(input => {
        input.addEventListener('input', updateRowAmount);
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function () {
            const row = btn.closest('tr');
            row.remove();
            calculateTotals();
        });
    });

    document.getElementById('taxRate').addEventListener('input', calculateTotals);
    document.getElementById('discount').addEventListener('input', calculateTotals);

    calculateTotals();
}

function addItemRow() {
    const tbody = document.getElementById('itemsBody');
    const row = document.createElement('tr');
    row.className = 'item-row border-b border-border';

    row.innerHTML = `
        <td class="p-3"><input type="text" class="item-desc w-full p-2 border rounded-md" placeholder="Service description"></td>
        <td class="p-3"><input type="number" class="item-qty w-full p-2 border rounded-md" value="1" min="1"></td>
        <td class="p-3"><input type="number" class="item-rate w-full p-2 border rounded-md" value="0" min="0" step="0.01"></td>
        <td class="p-3 item-amount font-medium">$0.00</td>
        <td class="p-3">
            <button class="remove-item text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
        </td>
    `;

    tbody.appendChild(row);
    setupEvents(); 
}

function updateRowAmount(e) {
    const row = e.target.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = qty * rate;
    row.querySelector('.item-amount').textContent = formatCurrency(amount);
    calculateTotals();
}

function calculateTotals() {
    let subtotal = 0;
 
    document.querySelectorAll('.item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const amount = qty * rate;
        row.querySelector('.item-amount').textContent = formatCurrency(amount);
        subtotal += amount;
    });
 
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const discountRate = parseFloat(document.getElementById('discount').value) || 0;

    const discountAmount = subtotal * (discountRate/100);
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * (taxRate / 100);
    const total = discountedSubtotal + taxAmount;
    
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
    document.getElementById('discountAmount').textContent = formatCurrency(discountAmount);
    document.getElementById('totalAmount').textContent = formatCurrency(total);

    document.getElementById('subtotalValue').value = subtotal.toFixed(2);
    document.getElementById('taxAmountValue').value = taxAmount.toFixed(2);
    document.getElementById('discountAmountValue').value = discountAmount.toFixed(2);
    document.getElementById('totalAmountValue').value = total.toFixed(2);
}
function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
} 
