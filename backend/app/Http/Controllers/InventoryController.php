<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        return view('inventories', compact('user'));
    }

    public function getData(Request $request)
    {
        // Strict Token Check: Ensure the user is authenticated via Sanctum (Token)
        if (!auth('sanctum')->check()) {
            return response()->json(['message' => 'Unauthenticated: Invalid or Missing Token'], 401);
        }

        $user = auth()->user();
        $userRoomIds = $user->rooms->pluck('id');

        // Your Inventories
        $userInventories = Inventory::whereIn('room_id', $userRoomIds)->with('room')->get();

        // Available Inventories
        if ($user->role === 'admin') {
            $availableInventories = Inventory::with('room')->get();
        } else {
            $availableInventories = Inventory::whereNotIn('room_id', $userRoomIds)->with('room')->get();
        }

        return response()->json([
            'userInventories' => $userInventories,
            'availableInventories' => $availableInventories,
            'currentUser' => [
                'id' => $user->id,
                'role' => $user->role,
                // Pass authorized room IDs to let JS know if user can edit/delete?
                // Actually, the edit/delete logic in View was:
                // ADMIN can do anything.
                // STAFF can edit/delete if they manage the room.
                // USER can do nothing.
                'room_ids' => $userRoomIds,
            ]
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        if ($user->role === 'user') {
            abort(403, 'Unauthorized action.');
        }

        if ($user->role === 'admin') {
            $rooms = Room::all();
        } else {
            // Staff
            $rooms = $user->rooms;
        }

        return view('add_inventory', compact('rooms'));
    }

    public function store(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $user = Auth::user();

        if ($user->role === 'user') {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $request->validate([
            'inventory_name' => 'required|string|max:255',
            'inventory_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'quantity' => 'required|integer|min:1',
            'status_condition' => 'required|in:GOOD,NEEDS ATTENTION,N.G',
            'remarks' => 'nullable|string',
            'room_id' => 'required|exists:rooms,id',
        ]);

        // Authorization check for Staff
        if ($user->role !== 'admin') {
            if (!$user->rooms->contains($request->room_id)) {
                return response()->json(['message' => 'You are not authorized to add inventory to this room.'], 403);
            }
        }

        $path = null;
        if ($request->hasFile('inventory_photo')) {
            $file = $request->file('inventory_photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('images/inventory'), $filename);
            $path = 'images/inventory/' . $filename;
        }

        Inventory::create([
            'inventory_name' => $request->inventory_name,
            'inventory_photo' => $path,
            'quantity' => $request->quantity,
            'status_condition' => $request->status_condition,
            'remarks' => $request->remarks,
            'room_id' => $request->room_id,
        ]);

        return response()->json(['message' => 'Inventory item added successfully.', 'redirect' => route('inventories')]);
    }

    public function edit(Inventory $inventory)
    {
        $user = Auth::user();

        if ($user->role === 'user') {
            abort(403, 'Unauthorized action.');
        }

        if ($user->role === 'admin') {
            $rooms = Room::all();
        } else {
            // Staff strategy: only assigned rooms
            $rooms = $user->rooms;
        }

        return view('edit_inventory', compact('inventory', 'rooms'));
    }

    public function update(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $user = Auth::user();

        if ($user->role === 'user') {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $inventory = Inventory::findOrFail($id);

        $request->validate([
            'inventory_name' => 'required|string|max:255',
            'inventory_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'quantity' => 'required|integer|min:1',
            'status_condition' => 'required|in:GOOD,NEEDS ATTENTION,N.G',
            'remarks' => 'nullable|string',
            'room_id' => 'required|exists:rooms,id',
        ]);

        // Authorization check for Staff
        if ($user->role !== 'admin') {
            if (!$user->rooms->contains($request->room_id)) {
                return response()->json(['message' => 'You are not authorized to move inventory to this room.'], 403);
            }
        }

        if ($request->hasFile('inventory_photo')) {
            // Delete old photo if exists
            if ($inventory->inventory_photo && file_exists(public_path($inventory->inventory_photo))) {
                unlink(public_path($inventory->inventory_photo));
            }

            $file = $request->file('inventory_photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('images/inventory'), $filename);
            $inventory->inventory_photo = 'images/inventory/' . $filename;
        }

        $inventory->inventory_name = $request->inventory_name;
        $inventory->quantity = $request->quantity;
        $inventory->status_condition = $request->status_condition;
        $inventory->remarks = $request->remarks;
        $inventory->room_id = $request->room_id;

        $inventory->save();

        return response()->json([
            'message' => 'Inventory item updated successfully.',
            'redirect' => route('inventories')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        // Basic check, though middleware handles auth
        if (Auth::user()->role === 'user') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $inventory = Inventory::findOrFail($id);

        if ($inventory->inventory_photo && file_exists(public_path($inventory->inventory_photo))) {
            unlink(public_path($inventory->inventory_photo));
        }

        $inventory->delete();

        // Check if redirect is needed or reload. Usually redirect to list.
        return response()->json(['message' => 'Inventory item deleted successfully.', 'redirect' => route('inventories')]);
    }
}
