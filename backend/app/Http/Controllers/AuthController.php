<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Mail\SendCodeMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Mail\ResetPasswordMail;

class AuthController extends Controller
{
    // 1. Handle Registration
    public function register(Request $request)
    {
        // A. Validate the input
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'username' => 'required|string|unique:users|min:4',
            'password' => 'required|min:6',
        ]);

        // Generate a random 6-digit code
        $code = rand(100000, 999999);

        // B. Create the User in Database
        $userData = [
            'firstname' => $request->firstname,
            'lastname' => $request->lastname,
            'address' => $request->address ?? null,
            'phone' => $request->phone ?? null,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'verification_code' => $code,
            'verified' => 'NO', // Set to NO initially
        ];

        // If this is the first user, make them admin
        if (User::count() === 0) {
            $userData['role'] = 'admin';
        }

        $user = User::create($userData);

        // Send the email
        try {
            Mail::to($user->email)->send(new SendCodeMail($code));
        } catch (\Exception $e) {
            // If email fails, we might want to log it, but proceed for now
        }

        // Redirect to Verification Page with specific message
        return redirect()->route('verify.page', ['email' => $user->email])
            ->with('success', 'Please check your email to complete your registration.');
    }

    // 2. SHOW VERIFY PAGE
    public function showVerifyForm(Request $request)
    {
        $email = $request->query('email');
        return view('verify_account', ['email' => $email]);
    }

    // 3. CHECK THE CODE
    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|numeric'
        ]);

        // Find user by email
        $user = User::where('email', $request->email)->first();

        // Check if user exists and code matches
        if (!$user || $user->verification_code !== $request->code) {
            return back()->withErrors(['code' => 'The OTP is invalid. Please check your email again.']);
        }

        // Code is correct! Mark as verified.
        $user->email_verified_at = now();
        $user->verification_code = null; // Clear the code
        $user->verified = 'YES'; // Update custom status
        $user->save();

        // Redirect back to Verify Page with Success Message
        return redirect()->route('verify.page', ['email' => $request->email])
            ->with('verification_success', 'Account has been verified successfully. You can now log in to your account.');
    }

    // Login Logic (Standard)
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            // Check custom verified status
            if (Auth::user()->verified === 'NO') {
                $user = Auth::user();
                $email = $user->email;

                // Generate new code and update user
                $code = rand(100000, 999999);
                $user->verification_code = $code;
                $user->save();

                // Send the email
                try {
                    Mail::to($email)->send(new SendCodeMail($code));
                } catch (\Exception $e) {
                    // Log error if needed
                }

                Auth::logout();

                $redirectUrl = route('verify.page', ['email' => $email]);

                if ($request->ajax()) {
                    // Manually flash the error to the session so it appears on the verify page
                    $errors = new \Illuminate\Support\ViewErrorBag();
                    $errors->put('default', new \Illuminate\Support\MessageBag(['code' => 'Your account is not verified. A new verification code has been sent to your email.']));
                    session()->flash('errors', $errors);

                    return response()->json([
                        'status' => 'unverified',
                        'redirect' => $redirectUrl,
                    ]);
                }

                return redirect($redirectUrl)
                    ->withErrors(['code' => 'Your account is not verified. A new verification code has been sent to your email.']);
            }

            $request->session()->regenerate();

            // Generate Sanctum Token
            $token = Auth::user()->createToken('auth_token')->plainTextToken;

            if ($request->ajax()) {
                return response()->json([
                    'status' => 'success',
                    'redirect' => route('dashboard'),
                    'token' => $token, // Return the token
                    'user' => Auth::user()
                ]);
            }

            return redirect()->intended('dashboard');
        }

        if ($request->ajax()) {
            return response()->json([
                'status' => 'error',
                'message' => 'The credentials are invalid. Please try again.'
            ], 401);
        }

        return back()->withErrors(['username' => 'The credentials are invalid. Please try again.']);
    }

    // Handle Logout
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }

    // Forgot Password Methods

    // Show Link Request Form
    public function showForgotPasswordForm()
    {
        return view('forgot_password');
    }

    // Handle sending the link
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Check if user exists? Standard practice is to not reveal existence, but for this app maybe it's fine.
        // Let's check for better UX in this internal app context.
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors(['email' => 'We can\'t find a user with that e-mail address.']);
        }

        // Create Token
        $token = Str::random(60);

        // Save to password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'email' => $request->email,
                'token' => $token,
                'created_at' => Carbon::now()
            ]
        );

        // Send Email
        try {
            Mail::to($request->email)->send(new ResetPasswordMail($token, $request->email));
            return back()->with('status', 'We have e-mailed your password reset link!');
        } catch (\Exception $e) {
            return back()->withErrors(['email' => 'Failed to send email. Please try again later.']);
        }
    }

    // Show Reset Form
    public function showResetForm(Request $request, $token)
    {
        return view('password_reset', ['token' => $token, 'email' => $request->email]);
    }

    // Reset the password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:6',
        ]);

        // Validate Token
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$resetRecord) {
            return back()->withErrors(['email' => 'Invalid or expired password reset token.']);
        }

        // Check expiration (e.g. 60 mins)
        if (Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return back()->withErrors(['email' => 'This password reset token has expired.']);
        }

        // Update User Password
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return back()->withErrors(['email' => 'We can\'t find a user with that e-mail address.']);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return redirect()->route('login')->with('success', 'Your password has been reset!');
    }
}
