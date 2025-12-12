document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('Session Expired. Please log in again.');
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return;
    }

    const searchInput = document.getElementById('inventory-search');
    const radioButtons = document.querySelectorAll('input[name="status-filter"]');
    const cards = document.querySelectorAll('.h-card');

    function filterInventories() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = document.querySelector('input[name="status-filter"]:checked').value;

        cards.forEach(card => {
            const title = card.querySelector('.h-card-title').textContent.toLowerCase();
            const status = card.dataset.status;

            const matchesSearch = title.includes(searchTerm);
            const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

            if (matchesSearch && matchesStatus) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterInventories);
    }

    radioButtons.forEach(radio => {
        radio.addEventListener('change', filterInventories);
    });

    // ---------------------------------------------------------
    // AJAX Form Handling (Single Delete)
    // ---------------------------------------------------------
    document.querySelectorAll('form[action*="/inventories/"]').forEach(form => {
        if (form.querySelector('input[name="_method"][value="DELETE"]')) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();

                const token = localStorage.getItem('auth_token');
                if (!token) {
                    alert('Session Expired. Please log in again.');
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                    return;
                }

                const formData = new FormData(this);

                $.ajax({
                    url: this.action,
                    method: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (res) {
                        window.location.reload();
                    },
                    error: function (xhr) {
                        // 401 handled globally
                        if (xhr.status !== 401) {
                            let msg = 'Delete failed';
                            if (xhr.responseJSON && xhr.responseJSON.message) {
                                msg = xhr.responseJSON.message;
                            }
                            alert('Error: ' + msg);
                        }
                    }
                });
            });
        }
    });
});
