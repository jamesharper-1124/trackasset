<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * @property int $id
     * @property string $firstname
     * @property string $lastname
     * @property string $email
     * @property string $username
     * @property string $role
     * @property string|null $profile_photo
     * @property string|null $address
     * @property string|null $phone
     * @property string|null $verification_code
     * @property string $verified
     */

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'firstname',
        'lastname',
        'address',
        'phone',
        'email',
        'username',
        'password',
        'verification_code', // Added this so we can save the code
        'verified', // Custom verified status
        'role',
        'profile_photo',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
    public function rooms()
    {
        return $this->belongsToMany(Room::class);
    }
}
