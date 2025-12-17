<!DOCTYPE html>
<html>

<head>
    <title>Register - TrackAsset</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="{{ asset('js/auth.js') }}"></script>
    <script src="{{ asset('js/guest-guard.js') }}?v={{ time() }}"></script>
</head>

<body class="bg-gray-100 flex items-center justify-center min-h-screen px-4">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
            <img src="{{ asset('images/inventory/default.png') }}" alt="App Logo"
                class="h-20 w-20 rounded-full object-cover border-2 border-indigo-500">
        </div>
        <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>

        @if($errors->any())
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('register') }}" method="POST">
            @csrf

            <!-- Step 1 -->
            <div id="step1">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">First Name</label>
                    <input type="text" name="firstname"
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Last Name</label>
                    <input type="text" name="lastname"
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input type="email" name="email"
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </div>
                <button type="button" onclick="showStep2()"
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                    Next
                </button>
            </div>

            <!-- Step 2 -->
            <div id="step2" class="hidden">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Username</label>
                    <input type="text" name="username"
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input type="password" name="password"
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </div>
                <div class="flex justify-between">
                    <button type="button" onclick="showStep1()"
                        class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Back
                    </button>
                    <button type="submit"
                        class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Register
                    </button>
                </div>
            </div>

            <div class="mt-4 text-center">
                <a class="text-sm text-blue-500 hover:text-blue-800" href="{{ route('login') }}">
                    Already have an account? Login
                </a>
            </div>
        </form>
    </div>
</body>

</html>