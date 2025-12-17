<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function create()
    {
        return view('add_report');
    }

    public function index()
    {
        return view('reports');
    }

    public function edit(Report $report)
    {
        // Check if user is authorized to edit (must be the submitter)
        if (Auth::id() !== $report->user_id) {
            return redirect()->route('reports')->with('error', 'Unauthorized access.');
        }
        return view('edit_report', compact('report'));
    }

    public function getData(Request $request)
    {
        // Strict Token Check
        if (!auth('sanctum')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = Auth::user();

        $receivedReports = collect();
        $submittedReports = collect();

        if ($user) {
            // 1. Received Reports
            $query = Report::with(['inventory.room', 'user']);

            // NEW RULE: 
            // "Staff: RECEIVE REPORTS FROM STAFF AND ADMIN. (GLOBAL ANNOUNCEMENT)"
            // "User: RECEIVE STAFF AND ADMIN REPORTS ONLY"

            // Common Logic: All non-admins receive "Global Reports" (Admin + Staff authors).
            // Wait, user said: "Staff ... OTHER REPORTS BY OTHER STAFF CANNOT BE SEEN ... UNLESS IF THE REPORT WAS UNDER ITS ROOM."
            // Contradiction? "RECEIVE REPORTS FROM STAFF" vs "CANNOT BE SEEN".
            // Detailed reading:
            // Staff see: 
            // 1. Admin Reports (Global)
            // 2. Staff Reports (Global? Or maybe only Admin reports are truly global?)
            // Let's re-read carefully: "Staff - RECEIVE REPORTS FROM STAFF AND ADMIN. (GLOBAL ANNOUNCEMENT)"
            // AND "OTHER REPORTS BY OTHER STAFF CANNOT BE SEEN... UNLESS IF THE REPORT WAS UNDER ITS ROOM."

            // Interpretation:
            // 1. Admin Reports -> Visible to All (Global).
            // 2. Staff Reports -> 
            //    - Visible to User? "User - RECEIVE STAFF AND ADMIN REPORTS ONLY". So Users see Staff reports.
            //    - Visible to other Staff? "CANNOT BE SEEN... UNLESS... UNDER ITS ROOM".

            // This implies:
            // - Admin Reports: Visible to everyone.
            // - Staff Reports: visible to Users, but NOT to other Staff (unless same room).

            // Let's implemented EXACTLY what's written:

            if ($user->role === 'staff') {
                $query->where(function ($q) use ($user) {
                    // 1. Admin Reports
                    $q->whereHas('user', function ($u) {
                        $u->where('role', 'admin');
                    })
                        // 2. Reports under my room (from anyone, presumably?)
                        ->orWhereHas('inventory', function ($inv) use ($user) {
                            $inv->whereIn('room_id', $user->rooms->pluck('id'));
                        });
                    // NOTE: Explicitly NOT requesting "All Staff Reports" here based on "CANNOT BE SEEN" rule.
                });
            } elseif ($user->role === 'user') {
                // "User - RECEIVE STAFF AND ADMIN REPORTS ONLY"
                // Implies they see everything from Admin AND Staff.
                $query->whereHas('user', function ($q) {
                    $q->whereIn('role', ['admin', 'staff']);
                });
            }

            // FILTER: Exclude reports hidden by this user
            $query->whereDoesntHave('hiddenByUsers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

            // Admin: Sees ALL reports (no extra filter)

            $receivedReports = $query->latest('date_reported')->get();

            // 2. Submitted Reports (What I sent)
            $submittedReports = Report::where('user_id', $user->id)
                ->with(['inventory.room', 'user'])
                ->latest('date_reported')
                ->get();
        }

        return response()->json([
            'submittedReports' => $submittedReports,
            'receivedReports' => $receivedReports,
            'currentUser' => [
                'id' => $user->id,
                'role' => $user->role
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $report = Report::findOrFail($id);

        $request->validate([
            'evidence_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        if ($request->hasFile('evidence_photo')) {
            // Delete old photo if exists
            if ($report->evidence_photo && file_exists(public_path($report->evidence_photo))) {
                unlink(public_path($report->evidence_photo));
            }

            $file = $request->file('evidence_photo');
            $filename = time() . '_report_' . $file->getClientOriginalName();
            $file->move(public_path('images/reports'), $filename);
            $report->evidence_photo = 'images/reports/' . $filename;
        }

        $report->remarks = $request->remarks;
        $report->save();

        return response()->json(['message' => 'Report has been submitted. We will come back to you shortly.', 'redirect' => route('reports')]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $user = Auth::user();
        $report = Report::findOrFail($id);

        // Authorization: Allow if Owner OR Admin OR Staff (Standard)
        // BUT ALSO allow regular users to "destroy" (hide) reports they received.
        // Simplified: Any auth user can attempt this.
        // If they own it -> Delete.
        // If not -> Hide.

        // Logic: If I am the creator, delete globally. If I am a recipient, hide it.
        if ($user->id === $report->user_id) {
            if ($report->evidence_photo && file_exists(public_path($report->evidence_photo))) {
                unlink(public_path($report->evidence_photo));
            }
            $report->delete();
        } else {
            // Hide for this user
            $report->hiddenByUsers()->syncWithoutDetaching([$user->id]);
        }

        return response()->json(['message' => 'Reports deleted successfully.', 'redirect' => route('reports')]);
    }


    public function bulkDestroy(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $user = Auth::user();

        // Authorization: Validated by auth middleware. 
        // Logic below handles ownership (delete vs hide).

        $ids = $request->input('ids');

        if (empty($ids)) {
            return response()->json(['message' => 'No reports selected'], 422);
        }

        // Perform bulk delete / hide
        $reports = Report::whereIn('id', $ids)->get();

        foreach ($reports as $report) {
            if ($report->user_id === $user->id) {
                // If I submitted it, delete globally (optionally checking photo)
                if ($report->evidence_photo && file_exists(public_path($report->evidence_photo))) {
                    unlink(public_path($report->evidence_photo));
                }
                $report->delete();
            } else {
                // If I received it, hide it from me
                $report->hiddenByUsers()->syncWithoutDetaching([$user->id]);
            }
        }

        return response()->json(['message' => 'The report has been deleted.']);
    }

    public function search(Request $request)
    {
        // Optional: Could strictly enforce here too, but search is often less critical. 
        // Given user request "ALL controllers", let's enforce it.
        // Strict Token Check
        if (!auth('sanctum')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = $request->get('query');
        $inventories = Inventory::where('inventory_name', 'LIKE', "%{$query}%")
            ->with('room')
            ->limit(10)
            ->get()
            ->map(function ($inventory) {
                return [
                    'id' => $inventory->id,
                    'name' => $inventory->inventory_name,
                    'room' => $inventory->room ? $inventory->room->room_name : 'Unassigned',
                    'status' => $inventory->status_condition,
                    'photo' => asset($inventory->inventory_photo ?? 'images/inventory/default.png'),
                    'type' => 'Inventory',
                ];
            });

        return response()->json($inventories);
    }

    public function store(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $request->validate([
            'inventory_name' => 'required|string',
            'inventory_id' => 'required|exists:inventories,id',
            'remarks' => 'required|string',
            'evidence_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        $path = null;
        if ($request->hasFile('evidence_photo')) {
            $file = $request->file('evidence_photo');
            $filename = time() . '_report_' . $file->getClientOriginalName();
            $file->move(public_path('images/reports'), $filename);
            $path = 'images/reports/' . $filename;
        }

        // Fetch the inventory to get its current status
        $inventory = Inventory::findOrFail($request->inventory_id);

        // Use manual assignment to bypass Mass Assignment protection issues
        $report = new Report();
        $report->inventory_id = $request->inventory_id;
        $report->user_id = Auth::id();
        $report->status_condition = $inventory->status_condition;
        $report->remarks = $request->remarks;
        $report->evidence_photo = $path;
        $report->date_reported = now();
        $report->save();

        return response()->json(['message' => 'Report submitted successfully.', 'redirect' => route('reports')]);
    }
}