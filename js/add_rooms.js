document.addEventListener('DOMContentLoaded', function () {
    const userSelect = document.getElementById('user-select');
    const selectedUsersContainer = document.getElementById('selected-users-container');
    const hiddenInputsContainer = document.getElementById('hidden-inputs');
    const selectedUserIds = new Set();

    // Function to handle user removal
    function setupRemoveButton(button, userId) {
        button.addEventListener('click', function () {
            // Remove from Set
            selectedUserIds.delete(userId);

            // Remove tag and hidden input
            const tag = button.closest('.user-tag');
            if (tag) tag.remove();

            const input = document.getElementById(`input-user-${userId}`);
            if (input) input.remove();

            // Show the option again in dropdown
            const optionToShow = userSelect.querySelector(`option[value="${userId}"]`);
            if (optionToShow) {
                optionToShow.style.display = '';
            }
        });
    }

    // Initialize from existing hidden inputs (for Edit mode)
    const existingInputs = hiddenInputsContainer.querySelectorAll('input[name="managed_by[]"]');
    existingInputs.forEach(input => {
        const userId = input.value;
        selectedUserIds.add(userId);

        // Hide option in dropdown
        const option = userSelect.querySelector(`option[value="${userId}"]`);
        if (option) {
            option.style.display = 'none';
        }

        // Attach event listener to existing remove button
        const removeBtn = selectedUsersContainer.querySelector(`.remove-user-btn[data-id="${userId}"]`);
        if (removeBtn) {
            setupRemoveButton(removeBtn, userId);
        }
    });

    // Handle new selections
    userSelect.addEventListener('change', function () {
        const selectedOption = userSelect.options[userSelect.selectedIndex];
        const userId = selectedOption.value;

        if (userId && !selectedUserIds.has(userId)) {
            selectedUserIds.add(userId);

            const userName = selectedOption.getAttribute('data-name');
            const userImage = selectedOption.getAttribute('data-image');

            // Hide the selected option
            selectedOption.style.display = 'none';

            // Create tag element
            const tag = document.createElement('div');
            tag.className = 'user-tag';
            tag.style.display = 'flex';
            tag.style.alignItems = 'center';
            tag.style.gap = '0.5rem';
            tag.style.backgroundColor = '#e5e7eb';
            tag.style.padding = '0.25rem 0.5rem';
            tag.style.borderRadius = '9999px';
            tag.style.fontSize = '0.875rem';

            tag.innerHTML = `
                <img src="${userImage}" alt="${userName}" style="width: 1.5rem; height: 1.5rem; border-radius: 50%; object-fit: cover;">
                <span>${userName}</span>
                <button type="button" class="remove-user-btn" data-id="${userId}" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1rem; line-height: 1;">&times;</button>
            `;

            selectedUsersContainer.appendChild(tag);

            // Create hidden input
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'managed_by[]';
            input.value = userId;
            input.id = `input-user-${userId}`;
            hiddenInputsContainer.appendChild(input);

            // Setup remove button for the new tag
            const removeBtn = tag.querySelector('.remove-user-btn');
            setupRemoveButton(removeBtn, userId);
        }

        // Reset select to default after adding
        userSelect.value = "";
    });

    // Generic Room Form AJAX Handler (Add & Edit)
    const roomForm = document.getElementById('add-room-form');
    if (roomForm) {
        roomForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Always prevent default for this specific form

            // STRICT SESSION CHECK BEFORE ACTION
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
                success: function (data) {
                    if (data.redirect) {
                        alert('Room added successfully.');
                        window.location.href = data.redirect;
                    } else if (data.success) {
                        // Fallback if no redirect provided but successful
                        alert('Room added successfully.');
                        window.location.href = '/rooms';
                    }
                },
                error: function (xhr) {
                    // 401 is handled by global auth-guard
                    if (xhr.status !== 401) {
                        let msg = 'Failed to save room.';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            msg = xhr.responseJSON.message;
                        }
                        alert(msg);
                    }
                }
            });
        });
    }
});
