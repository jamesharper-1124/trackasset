<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Room;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

// Cache Force Update
class RoomController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $assignedRooms = $user->rooms()->with('managers')->get();
        $availableRooms = Room::with('managers')->get();
        return view('rooms', compact('assignedRooms', 'availableRooms'));
    }

    public function getData(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $user = auth()->user();
        $assignedRooms = $user->rooms()->with('managers')->get();
        $availableRooms = Room::with('managers')->get();

        return response()->json([
            'assignedRooms' => $assignedRooms,
            'availableRooms' => $availableRooms,
            'currentUser' => [
                'id' => $user->id,
                'role' => $user->role,
            ]
        ]);
    }

    public function showInventories(Room $room)
    {
        $inventories = $room->inventories;
        return view('view_inventory', compact('room', 'inventories'));
    }

    public function create()
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $users = User::whereIn('role', ['admin', 'staff'])->get();
        return view('add_rooms', compact('users'));
    }

    public function store(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'room_name' => 'required|string|max:255',
            'managed_by' => 'required|array',
            'managed_by.*' => 'exists:users,id',
            'room_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->only(['room_name']);

        if ($request->hasFile('room_photo')) {
            $file = $request->file('room_photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('images/rooms'), $filename);
            $data['room_photo'] = 'images/rooms/' . $filename;
        }

        $room = Room::create($data);
        $room->managers()->attach($request->managed_by);

        return response()->json(['message' => 'Room created successfully.', 'redirect' => route('rooms')]);
    }

    public function edit(Room $room)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $users = User::whereIn('role', ['admin', 'staff'])->get();
        return view('edit_room', compact('room', 'users'));
    }

    public function update(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $room = Room::findOrFail($id);

        $validated = $request->validate([
            'room_name' => 'required|string|max:255',
            'room_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'managed_by' => 'required|array',
            'managed_by.*' => 'exists:users,id',
        ]);

        if ($request->hasFile('room_photo')) {
            // Delete old photo if exists and not default
            if ($room->room_photo && $room->room_photo !== 'images/rooms/default.png') {
                Storage::disk('public')->delete($room->room_photo);
            }

            $path = $request->file('room_photo')->store('images/rooms', 'public');
            $room->room_photo = $path;
        }

        $room->room_name = $validated['room_name'];
        $room->save();

        // Sync managers
        $room->managers()->sync($validated['managed_by']);

        return response()->json(['message' => 'Room updated successfully.', 'redirect' => route('rooms')]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // EXPLICIT TRANSACTION & RAW DELETE (NUCLEAR FIX)
        DB::beginTransaction();
        try {
            // Force cast ID
            $roomId = (int) $id;
            if ($roomId <= 0) {
                throw new \Exception("Invalid Room ID received: " . json_encode($id));
            }

            // 1. Manually Handle Child Deletions (Inventories)
            // Fetch child IDs first
            $inventoryIds = DB::table('inventories')->where('room_id', $roomId)->pluck('id');
            foreach ($inventoryIds as $invId) {
                $inv = DB::table('inventories')->where('id', $invId)->first();
                if ($inv && $inv->inventory_photo && file_exists(public_path($inv->inventory_photo))) {
                    @unlink(public_path($inv->inventory_photo));
                }
                DB::table('inventories')->where('id', $invId)->delete();
            }

            // 2. Delete Room Photo
            $room = DB::table('rooms')->where('id', $roomId)->first();
            if (!$room) {
                return response()->json(['message' => 'Room already deleted or not found.'], 200); // 200 OK because goal is accomplished
            }

            if ($room->room_photo && $room->room_photo !== 'images/rooms/default.png') {
                Storage::disk('public')->delete($room->room_photo);
            }

            // 3. Detach Managers (Many-to-Many)
            DB::table('room_user')->where('room_id', $roomId)->delete();

            // 4. FORCE DELETE PARENT (Raw SQL)
            $deleted = DB::table('rooms')->where('id', $roomId)->delete();

            if (!$deleted) {
                // If it exists but wasn't deleted, that's an error. If it didn't exist, we handled above.
                throw new \Exception("DB Report: Room ID {$roomId} could not be deleted (Row not affected).");
            }

            DB::commit();

            // 5. Final Verification (Post-Commit)
            $exists = DB::table('rooms')->where('id', $roomId)->exists();
            if ($exists) {
                return response()->json(['message' => 'CRITICAL FATAL: Transaction committed but row remains.'], 500);
            }

            return response()->json(['message' => 'Room deleted successfully (Nuclear Fix).', 'redirect' => route('rooms')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:rooms,id',
        ]);

        $rooms = Room::whereIn('id', $validated['ids'])->get();

        foreach ($rooms as $room) {
            if ($room->room_photo && $room->room_photo !== 'images/rooms/default.png') {
                Storage::disk('public')->delete($room->room_photo);
            }
            $room->delete();
        }

        return response()->json(['success' => true, 'message' => 'Rooms deleted successfully.']);
    }
}
