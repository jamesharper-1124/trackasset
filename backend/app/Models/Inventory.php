<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_photo',
        'inventory_name',
        'quantity',
        'status_condition',
        'remarks',
        'room_id',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
