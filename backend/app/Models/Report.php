<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    /**
     * @property int $id
     * @property int $inventory_id
     * @property int $user_id
     * @property string $status_condition
     * @property string $remarks
     * @property string|null $evidence_photo
     * @property string $date_reported
     * @property \Illuminate\Support\Carbon|null $created_at
     * @property \Illuminate\Support\Carbon|null $updated_at
     * @property-read \App\Models\Inventory $inventory
     * @property-read \App\Models\User $user
     */

    // Explicitly allow mass assignment for these fields
    protected $fillable = [
        'inventory_id',
        'user_id',
        'status_condition',
        'remarks',
        'evidence_photo',
        'date_reported',
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hiddenByUsers()
    {
        return $this->belongsToMany(User::class, 'hidden_reports', 'report_id', 'user_id')->withTimestamps();
    }
}
