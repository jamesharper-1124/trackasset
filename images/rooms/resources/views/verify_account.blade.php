<!DOCTYPE html>
<html>

<head>
    <title>Verify Account - TrackAsset</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="{{ asset('js/guest-guard.js') }}?v={{ time() }}"></script>
</head>

<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded shadow-md w-96">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
            <img src="{{ asset('images/inventory/default.png') }}" alt="App Logo"
                class="h-20 w-20 rounded-full object-cover border-2 border-indigo-500">
        </div>
        <h2 class="text-2xl font-bold mb-6 text-center">Verify Your Email</h2>

        <p class="mb-4 text-gray-600 text-center">
            We sent a code to <strong>{{ $email ?? 'your email' }}</strong>.
        </p>

        <!-- 1. REGISTRATION SUCCESS MESSAGE (No Redirect) -->
        @if(session('success'))
            <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
                {{ session('success') }}
            </div>
        @endif

        <!-- 2. VERIFICATION SUCCESS MESSAGE (With Auto-Redirect) -->
        @if(session('verification_success'))
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                {{ session('verification_success') }}
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', function () {
                    // Disable the form
                    const form = document.querySelector('form');
                    const elements = form.elements;
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].disabled = true;
                    }

                    // Redirect after 1 second
                    setTimeout(function () {
                        window.location.href = "{{ route('login') }}";
                    }, 1000);
                });
            </script>
        @endif

        @if($errors->any())
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('verify.code') }}" method="POST">
            @csrf
            <input type="hidden" name="email" value="{{ $email }}">

            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2">Verification Code</label>
                <input type="text" name="code" placeholder="123456"
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-center text-xl tracking-widest">
            </div>

            <button
                class="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
                type="submit">
                Verify Account
            </button>
        </form>

        <div class="mt-4 text-center">
            <a class="text-sm text-blue-500 hover:text-blue-800" href="{{ route('login') }}">
                Back to Login
            </a>
        </div>
    </div>
</body>

</html>