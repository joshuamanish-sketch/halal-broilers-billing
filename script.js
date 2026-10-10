const PRODUCTS = [
    { id: 1, name: "Broiler Chicken", type: "formula1" },
    { id: 2, name: "Biriyani Piece", type: "formula1" },
    { id: 3, name: "Chilli", type: "formula1" },
    { id: 4, name: "Grill", type: "formula1" },
    { id: 5, name: "Boneless", type: "formula1" },
    { id: 6, name: "Liver", type: "formula2" },
    { id: 7, name: "Mutton", type: "formula2" },
    { id: 8, name: "Naatukoli", type: "formula2" }
];

// Load UI Data
displayHotels();
displaySalesHistory();

// Hotel Management
function openAddHotelModal() {
    document.getElementById('hotelModalTitle').innerText = '➕ Add Hotel';
    document.getElementById('editHotelId').value = '';
    document.getElementById('hotelName').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('address').value = '';
    document.getElementById('oldBalance').value = '0';
    document.getElementById('hotelModal').style.display = 'flex';
}

function closeHotelModal() {
    document.getElementById('hotelModal').style.display = 'none';
}

function saveHotel() {
    let id = document.getElementById('editHotelId').value;
    let name = document.getElementById('hotelName').value.trim();
    let customer = document.getElementById('customerName').value.trim();
    let address = document.getElementById('address').value.trim();
    let oldBal = parseFloat(document.getElementById('oldBalance').value) || 0;

    if (!name || !customer || !address) {
        alert('Please fill all details!');
        return;
    }

    let hotels = JSON.parse(localStorage.getItem('halal_hotels')) || [];

    if (id) {
        hotels = hotels.map(h => h.id == id ? { ...h, hotelName: name, customerName: customer, address: address, oldBalance: oldBal } : h);
    } else {
        hotels.push({ id: Date.now(), hotelName: name, customerName: customer, address: address, oldBalance: oldBal });
    }

    localStorage.setItem('halal_hotels', JSON.stringify(hotels));
    closeHotelModal();
    displayHotels();
}

function displayHotels() {
    let list = document.getElementById('hotelList');
    if (!list) return;
    list.innerHTML = '';
    let hotels = JSON.parse(localStorage.getItem('halal_hotels')) || [];

    if (hotels.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:#64748b; font-size:13px; padding:10px;">No hotels found.</li>';
        return;
    }

    hotels.forEach(hotel => {
        let li = document.createElement('li');
        li.className = 'hotel-item';
        li.innerHTML = `
            <div class="hotel-info">
                <h4>🏨 ${hotel.hotelName}</h4>
                <p>👤 Customer: ${hotel.customerName} | 📍 ${hotel.address}</p>
                <p>Old Balance: <span class="balance-tag">₹${(hotel.oldBalance || 0).toFixed(2)}</span></p>
            </div>
            <div class="actions">
                <button class="btn-sm btn-bill" onclick='openBillingModal(${JSON.stringify(hotel)})'>Next Bill 🧾</button>
                <button class="btn-sm btn-edit" onclick='editHotel(${JSON.stringify(hotel)})'>✏️</button>
                <button class="btn-sm btn-del" onclick='deleteHotel(${hotel.id})'>🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function editHotel(hotel) {
    document.getElementById('hotelModalTitle').innerText = '✏️ Edit Hotel';
    document.getElementById('editHotelId').value = hotel.id;
    document.getElementById('hotelName').value = hotel.hotelName;
    document.getElementById('customerName').value = hotel.customerName;
    document.getElementById('address').value = hotel.address;
    document.getElementById('oldBalance').value = hotel.oldBalance || 0;
    document.getElementById('hotelModal').style.display = 'flex';
}

function deleteHotel(id) {
    if (confirm('Do you want to delete this hotel?')) {
        let hotels = JSON.parse(localStorage.getItem('halal_hotels')) || [];
        hotels = hotels.filter(h => h.id !== id);
        localStorage.setItem('halal_hotels', JSON.stringify(hotels));
        displayHotels();
    }
}

// Billing Modal & Calculations
let activeHotel = null;

function openBillingModal(hotel) {
    activeHotel = hotel;
    document.getElementById('bHotelName').innerText = hotel.hotelName;
    document.getElementById('bCustomerName').innerText = hotel.customerName;
    document.getElementById('bAddress').innerText = hotel.address;
    document.getElementById('bOldBalance').innerText = (hotel.oldBalance || 0).toFixed(2);

    let todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('billDate').value = todayStr;
    document.getElementById('customerPaid').value = '0';

    buildCartTable();
    calculateFinalSummary();
    document.getElementById('billingModal').style.display = 'flex';
}

function closeBillingModal() {
    document.getElementById('billingModal').style.display = 'none';
}

function buildCartTable() {
    let tbody = document.getElementById('cartTableBody');
    tbody.innerHTML = '';

    PRODUCTS.forEach((p, index) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:left; font-weight:600;">${index + 1}. ${p.name}</td>
            <td><input type="number" id="paper_${p.id}" value="0" step="0.1" oninput="calculateRow(${p.id}, '${p.type}')"></td>
            <td><input type="number" id="est_${p.id}" value="0" step="0.1" oninput="calculateRow(${p.id}, '${p.type}')"></td>
            <td><input type="number" id="wt_${p.id}" value="0" step="0.01" oninput="calculateRow(${p.id}, '${p.type}')"></td>
            <td id="amt_${p.id}" style="font-weight:bold; color:#059669;">0.00</td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateRow(id, type) {
    let paper = parseFloat(document.getElementById(`paper_${id}`).value) || 0;
    let est = parseFloat(document.getElementById(`est_${id}`).value) || 0;
    let wt = parseFloat(document.getElementById(`wt_${id}`).value) || 0;

    let amount = 0;
    if (type === 'formula1') {
        // Items 1 to 5: (Paper Rate * Estimation Cost * Weight)
        amount = paper * est * wt;
    } else if (type === 'formula2') {
        // Items 6 to 8: (Estimation Cost * Weight)
        amount = est * wt;
    }

    document.getElementById(`amt_${id}`).innerText = amount.toFixed(2);
    calculateFinalSummary();
}

function calculateFinalSummary() {
    let itemsTotal = 0;
    PRODUCTS.forEach(p => {
        let amt = parseFloat(document.getElementById(`amt_${p.id}`).innerText) || 0;
        itemsTotal += amt;
    });

    let oldBal = activeHotel.oldBalance || 0;
    let paid = parseFloat(document.getElementById('customerPaid').value) || 0;
    let finalBal = oldBal + itemsTotal - paid;

    document.getElementById('itemsTotalAmt').innerText = itemsTotal.toFixed(2);
    document.getElementById('summaryOldBal').innerText = oldBal.toFixed(2);
    document.getElementById('summaryPaid').innerText = paid.toFixed(2);
    document.getElementById('finalBalanceAmt').innerText = finalBal.toFixed(2);
}

// Generate Premium Image & Share via html2canvas
function generateAndShareBill() {
    let itemsTotal = parseFloat(document.getElementById('itemsTotalAmt').innerText);
    let oldBal = activeHotel.oldBalance || 0;
    let paid = parseFloat(document.getElementById('customerPaid').value) || 0;
    let finalBal = parseFloat(document.getElementById('finalBalanceAmt').innerText);
    let billDate = document.getElementById('billDate').value;

    document.getElementById('rDateStr').innerText = billDate;
    document.getElementById('rHotelName').innerText = activeHotel.hotelName;
    document.getElementById('rCustomerName').innerText = activeHotel.customerName;
    document.getElementById('rAddress').innerText = activeHotel.address;

    document.getElementById('rItemsTotal').innerText = itemsTotal.toFixed(2);
    document.getElementById('rOldBal').innerText = oldBal.toFixed(2);
    document.getElementById('rPaid').innerText = paid.toFixed(2);
    document.getElementById('rFinalBal').innerText = finalBal.toFixed(2);

    let rTableBody = document.getElementById('rTableBody');
    rTableBody.innerHTML = '';

    let count = 1;
    PRODUCTS.forEach(p => {
        let wt = parseFloat(document.getElementById(`wt_${p.id}`).value) || 0;
        let amt = parseFloat(document.getElementById(`amt_${p.id}`).innerText) || 0;
        if (wt > 0 || amt > 0) {
            let cost = (p.type === 'formula1') 
                ? (parseFloat(document.getElementById(`paper_${p.id}`).value) * parseFloat(document.getElementById(`est_${p.id}`).value)) 
                : parseFloat(document.getElementById(`est_${p.id}`).value);

            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${count++}</td>
                <td><b>${p.name}</b></td>
                <td>${wt} kg</td>
                <td>₹${cost.toFixed(1)}</td>
                <td><b>₹${amt.toFixed(2)}</b></td>
            `;
            rTableBody.appendChild(tr);
        }
    });

    let sales = JSON.parse(localStorage.getItem('halal_sales')) || [];
    sales.unshift({
        id: Date.now(),
        date: billDate,
        hotelName: activeHotel.hotelName,
        itemsTotal: itemsTotal,
        paid: paid,
        finalBalance: finalBal
    });
    localStorage.setItem('halal_sales', JSON.stringify(sales));

    let hotels = JSON.parse(localStorage.getItem('halal_hotels')) || [];
    hotels = hotels.map(h => h.id === activeHotel.id ? { ...h, oldBalance: finalBal } : h);
    localStorage.setItem('halal_hotels', JSON.stringify(hotels));

    displayHotels();
    displaySalesHistory();

    let receiptElement = document.getElementById('receiptTemplate');
    receiptElement.style.left = '0';

    html2canvas(receiptElement, { scale: 2 }).then(canvas => {
        receiptElement.style.left = '-9999px';

        canvas.toBlob(blob => {
            let file = new File([blob], `Bill_${activeHotel.hotelName}_${billDate}.png`, { type: 'image/png' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: 'Halal Broilers Bill',
                    text: `${activeHotel.hotelName} - Bill for ${billDate}`
                }).catch(err => console.log(err));
            } else {
                let link = document.createElement('a');
                link.download = `Bill_${activeHotel.hotelName}_${billDate}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                alert('Premium Bill Image downloaded successfully!');
            }
            closeBillingModal();
        });
    });
}

function displaySalesHistory() {
    let list = document.getElementById('salesHistoryList');
    if (!list) return;
    list.innerHTML = '';
    let sales = JSON.parse(localStorage.getItem('halal_sales')) || [];

    if (sales.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:#64748b; font-size:12px; padding:8px;">No sales records found.</li>';
        return;
    }

    sales.slice(0, 10).forEach(s => {
        let li = document.createElement('li');
        li.className = 'history-card';
        li.innerHTML = `
            <div>
                <strong>${s.hotelName}</strong> (${s.date})
                <div style="font-size:11px; color:#64748b;">Bill: ₹${s.itemsTotal.toFixed(2)} | Paid: ₹${s.paid.toFixed(2)}</div>
            </div>
            <div style="font-weight:bold; color:#dc2626;">Balance: ₹${s.finalBalance.toFixed(2)}</div>
        `;
        list.appendChild(li);
    });
}