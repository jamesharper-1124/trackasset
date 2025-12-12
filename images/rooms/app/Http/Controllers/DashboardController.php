<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inventory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Return view only. Data will be fetched via AJAX to enforce Bearer Token.
        return view('dashboard');
    }

    public function getData(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        // 1. New Inventories Reported (Latest 5)
        $newInventories = Inventory::orderBy('created_at', 'desc')->take(5)->get();

        // 2. New Users Registered (Latest 5)
        $newUsers = User::orderBy('created_at', 'desc')->take(5)->get();

        // 3. Problems Detected (Recent Reports)
        $problemInventories = \App\Models\Report::with('inventory')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // 4. Statistics for Chart/Legend
        $totalInventories = Inventory::count();

        $stats = Inventory::select('status_condition', DB::raw('count(*) as total'))
            ->groupBy('status_condition')
            ->pluck('total', 'status_condition')
            ->toArray();

        return response()->json([
            'newInventories' => $newInventories,
            'newUsers' => $newUsers,
            'problemInventories' => $problemInventories,
            'totalInventories' => $totalInventories,
            'stats' => $stats,
        ]);
    }
}
