/* File: public/js/auth.js
   Handles the multi-step registration form toggling.
*/

function showStep2() {
    // Hide Step 1
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    if (step1 && step2) {
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
    }
}

function showStep1() {
    // Hide Step 2
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    if (step1 && step2) {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
    }
}
