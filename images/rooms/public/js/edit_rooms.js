document.addEventListener('DOMContentLoaded', function () {
    console.log("DEBUG: edit_rooms.js Loaded");

    // --- Multi-Select Logic (Copied and Adapted) ---
    const userSelect = document.getElementById('user-select');
    const selectedUsersContainer = document.getElementById('selected-users-container');
    const hiddenInputsContainer = document.getElementById('hidden-inputs');
    const selectedUserIds = new Set();

    // Function to handle user removal
    function setupRemoveButton(button, userId) {
        button.addEventListener('click', function () {
            // Remove from Set
            selectedUserIds.delete(String(userId)); // Ensure string comparison

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

    // Initialize from existing hidden inputs (Important for Edit mode)
    if (hiddenInputsContainer) {
        const existingInputs = hiddenInputsContainer.querySelectorAll('input[name="managed_by[]"]');
        existingInputs.forEach(input => {
            const userId = input.value;
            selectedUserIds.add(String(userId));

            // Hide option in dropdown if it exists
            if (userSelect) {
                const option = userSelect.querySelector(`option[value="${userId}"]`);
                if (option) {
                    option.style.display = 'none';
                }
            }

            // Attach event listener to existing remove buttons rendered by Blade
            if (selectedUsersContainer) {
                const removeBtn = selectedUsersContainer.querySelector(`.remove-user-btn[data-id="${userId}"]`);
                if (removeBtn) {
                    setupRemoveButton(removeBtn, userId);
                }
            }
        });
    }

    // Handle new selections
    if (userSelect) {
        userSelect.addEventListener('change', function () {
            const selectedOption = userSelect.options[userSelect.selectedIndex];
            const userId = selectedOption.value;

            if (userId && !selectedUserIds.has(String(userId))) {
                selectedUserIds.add(String(userId));

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
    }

    // --- Edit Form Submission Logic ---
    const form = document.querySelector('form[data-mode="edit"]');

    if (form) {
        $(form).on('submit', function (e) {
            e.preventDefault();

            // Dynamic Token Check
            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired. Please log in again.');
                window.location.href = '/login';
                return;
            }

            const $btn = $(this).find('button[type="submit"]');
            const originalText = $btn.text();

            const id = $(this).data('id');
            const loadingText = 'Updating...';

            $btn.prop('disabled', true).text(loadingText);

            const formData = new FormData(this);

            // Force Method Spoofing
            if (!formData.has('_method')) {
                formData.append('_method', 'PUT');
            }

            // Force URL construction
            let submitUrl = '/api/rooms/' + id;
            console.log('DEBUG: Submitting Room Update to ' + submitUrl);

            $.ajax({
                url: submitUrl,
                method: 'POST', // Always POST with _method=PUT
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log("DEBUG: Success Response", response);
                    alert(response.message || 'Room updated successfully.');
                    window.location.href = '/rooms';
                },
                error: function (xhr) {
                    console.error("DEBUG: Error", xhr);
                    $btn.prop('disabled', false).text(originalText);
                    let msg = 'Update failed.';
                    if (xhr.status === 422) {
                        let errors = xhr.responseJSON.errors;
                        msg = 'Validation Error:\n';
                        for (let field in errors) {
                            msg += `- ${errors[field][0]}\n`;
                        }
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg += ' ' + xhr.responseJSON.message;
                    }
                    alert(msg);
                }
            });
        });
    }
});
