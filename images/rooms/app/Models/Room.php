<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_name',
        'room_photo',
        'managed_by',
    ];

    public function managers()
    {
        return $this->belongsToMany(User::class);
    }

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }
    protected static function booted()
    {
        static::deleting(function ($room) {
            foreach ($room->inventories as $inventory) {
                if ($inventory->inventory_photo && file_exists(public_path($inventory->inventory_photo))) {
                    @unlink(public_path($inventory->inventory_photo));
                }
                $inventory->delete();
            }
        });
    }
}
